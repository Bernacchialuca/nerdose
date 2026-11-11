const KEY = 'nerdose_admin_session';

export type Session = { token: string; expires_at: string };
export type EndReason = 'expired' | 'logout';

type Listener = () => void;

const listeners = new Set<Listener>();
let endReason: EndReason | null = null;

const notify = () => {
  listeners.forEach((listener) => {
    listener();
  });
};

export function readSession(): Session | null {
  try {
    const raw = sessionStorage.getItem(KEY);
    const session = raw ? (JSON.parse(raw) as Session) : null;
    return session && new Date(session.expires_at) > new Date() ? session : null;
  } catch {
    return null;
  }
}

export function writeSession(session: Session): void {
  endReason = null;
  try {
    sessionStorage.setItem(KEY, JSON.stringify(session));
  } catch {
    /* sin storage: la sesión no persiste */
  }
  notify();
}

export function clearSession(reason: EndReason = 'logout'): void {
  endReason = reason;
  try {
    sessionStorage.removeItem(KEY);
  } catch {
    /* sin storage: nada que borrar */
  }
  notify();
}

export function subscribe(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getSessionSnapshot(): string | null {
  try {
    return sessionStorage.getItem(KEY);
  } catch {
    return null;
  }
}

export const getEndReason = (): EndReason | null => endReason;
