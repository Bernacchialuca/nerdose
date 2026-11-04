export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
    readonly retryAfter?: number,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

type Hooks = {
  getHeaders?: () => Record<string, string>;
  onError?: (err: ApiError) => void;
};

type ErrorBody = { error?: { code?: string; message?: string } } | null;

let hooks: Hooks = {};

export const configureApi = (h: Hooks) => {
  hooks = h;
};

export async function api<T>(
  path: string,
  init: RequestInit & { json?: unknown } = {},
): Promise<T> {
  const { json, headers, ...rest } = init;
  const res = await fetch(path, {
    ...rest,
    headers: {
      Accept: 'application/json',
      ...(json !== undefined && { 'Content-Type': 'application/json' }),
      ...hooks.getHeaders?.(),
      ...(headers as Record<string, string> | undefined),
    },
    body: json !== undefined ? JSON.stringify(json) : rest.body,
  });
  if (res.ok) return (res.status === 204 ? undefined : await res.json()) as T;
  const body = (await res.json().catch(() => null)) as ErrorBody;
  const err = new ApiError(
    res.status,
    body?.error?.code ?? 'internal_error',
    body?.error?.message ?? res.statusText,
    Number(res.headers.get('Retry-After')) || undefined,
  );
  hooks.onError?.(err);
  throw err;
}
