# syntax=docker/dockerfile:1.7
#
# Imágenes de producción de nerdose. Un Dockerfile multi-target con el monorepo como contexto;
# cada servicio es un target y una imagen:
#
#   docker build --target api       -t nerdose-api .
#   docker build --target generator -t nerdose-generator .
#   docker build --target migrate   -t nerdose-migrate .
#
# web y admin son estáticos: el target `static` exporta su build para servirlo con cualquier
# servidor o CDN (el hosting, el proxy y el TLS se definen con el hosting):
#
#   docker build --target static --output type=local,dest=out .   # out/web y out/admin
#
# Las apps no tienen paso de compilación: corren TypeScript con tsx, igual que en desarrollo.

ARG NODE_IMAGE=node:24-bookworm-slim
ARG GO_IMAGE=golang:1.25-bookworm
ARG JDK_IMAGE=eclipse-temurin:21-jdk

# ---------------------------------------------------------------------------------------------
# base: Node 24 con pnpm y tsx globales
# ---------------------------------------------------------------------------------------------
FROM ${NODE_IMAGE} AS base
ENV PNPM_HOME=/pnpm \
    PATH=/pnpm:$PATH \
    CI=true
RUN npm install -g pnpm@11.6.0 tsx@4.23.15 && npm cache clean --force
WORKDIR /app

# ---------------------------------------------------------------------------------------------
# fetch: descarga las dependencias al store. Solo depende del lockfile, así que se cachea.
# ---------------------------------------------------------------------------------------------
FROM base AS fetch
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
RUN --mount=type=cache,id=pnpm-store,target=/pnpm/store pnpm fetch

FROM fetch AS source
COPY . .

# Dependencias de producción de cada servicio (y de los paquetes del workspace que usa).
FROM source AS api-deps
RUN --mount=type=cache,id=pnpm-store,target=/pnpm/store \
    pnpm install --offline --frozen-lockfile --prod --filter "api..."

FROM source AS generator-deps
RUN --mount=type=cache,id=pnpm-store,target=/pnpm/store \
    pnpm install --offline --frozen-lockfile --prod --filter "generator..."

FROM source AS migrate-deps
RUN --mount=type=cache,id=pnpm-store,target=/pnpm/store \
    pnpm install --offline --frozen-lockfile --prod --filter "@nerdose/db..."

# web y admin: build estático con Vite (necesita las devDependencies).
FROM source AS static-build
RUN --mount=type=cache,id=pnpm-store,target=/pnpm/store \
    pnpm install --offline --frozen-lockfile --filter "web..." --filter "admin..."
RUN pnpm --filter web --filter admin build

# ---------------------------------------------------------------------------------------------
# api
# ---------------------------------------------------------------------------------------------
FROM base AS api
# Variables: apps/api/.env.example. Detrás de un proxy, configurar TRUST_PROXY_HEADER (ADR-012).
ENV NODE_ENV=production
COPY --from=api-deps --chown=node:node /app /app
WORKDIR /app/apps/api
USER node
EXPOSE 3000
CMD ["tsx", "src/index.ts"]

# ---------------------------------------------------------------------------------------------
# generator: Node 24 + Go 1.25 + JDK 21 (ADR-007). Corre como usuario no root, así que el runner
# de @nerdose/polyglot ejecuta cada snippet con ese mismo usuario. Variables:
# apps/generator/.env.example.
#
# Al correrlo: sin salida a internet (ADR-007) y, si /tmp se monta como tmpfs, con `exec`. El
# runner compila el binario de Go en /tmp y lo ejecuta ahí, y Docker monta los tmpfs `noexec`.
# ---------------------------------------------------------------------------------------------
FROM ${GO_IMAGE} AS go
FROM ${JDK_IMAGE} AS jdk

FROM base AS generator
ENV NODE_ENV=production \
    JAVA_HOME=/opt/java/openjdk \
    PATH=/usr/local/go/bin:/opt/java/openjdk/bin:$PATH \
    GOTOOLCHAIN=local \
    GOPROXY=off \
    GOFLAGS=-buildvcs=false \
    GOCACHE=/home/node/.cache/go-build
COPY --from=go /usr/local/go /usr/local/go
COPY --from=jdk /opt/java/openjdk /opt/java/openjdk
COPY --from=generator-deps --chown=node:node /app /app
WORKDIR /app/apps/generator
USER node
RUN go version && java -version
CMD ["tsx", "src/index.ts"]

# ---------------------------------------------------------------------------------------------
# migrate: aplica las migraciones y sincroniza las contraseñas de los roles. Corre y termina;
# va antes de levantar api y generator. Variables: packages/db/.env.example.
# ---------------------------------------------------------------------------------------------
FROM base AS migrate
ENV NODE_ENV=production
COPY --from=migrate-deps --chown=node:node /app /app
WORKDIR /app/packages/db
USER node
CMD ["tsx", "scripts/migrate.ts"]

# ---------------------------------------------------------------------------------------------
# static: build de web y admin (index.html + assets con hash), para exportar con --output.
# Al servirlos: los /assets/* se pueden cachear como inmutables; index.html, no. El sitio de web
# tiene que enrutar /api/* a la api, y el de admin solo /api/admin/* (mismo origen, sin CORS).
# ---------------------------------------------------------------------------------------------
FROM scratch AS static
COPY --from=static-build /app/apps/web/dist /web
COPY --from=static-build /app/apps/admin/dist /admin
