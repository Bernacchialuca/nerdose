import postgres from 'postgres';

export const connectAs = (url: string) => postgres(url, { max: 1 });

export function withUser(url: string, user: string, password: string): string {
  const next = new URL(url);
  next.username = user;
  next.password = encodeURIComponent(password);
  return next.toString();
}
