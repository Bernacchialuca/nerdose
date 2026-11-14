const CHILD_ENV_KEYS = ['PATH', 'HOME', 'GOCACHE', 'GOPATH', 'TMPDIR'] as const;

/** The child never receives DATABASE_URL, GENERATOR_SECRET or any other variable of the caller. */
export function buildChildEnv(env: NodeJS.ProcessEnv): NodeJS.ProcessEnv {
  const child: NodeJS.ProcessEnv = {};
  for (const key of CHILD_ENV_KEYS) {
    const value = env[key];
    if (value !== undefined) child[key] = value;
  }
  return child;
}
