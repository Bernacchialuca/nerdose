import { createHmac } from 'node:crypto';

export function seedFor(secret: string, gameId: string, date: string, attempt: number): Uint8Array {
  return new Uint8Array(
    createHmac('sha256', secret).update(`${gameId}:${date}:${attempt}`).digest(),
  );
}

export function seedToHex(seed: Uint8Array): string {
  return Buffer.from(seed).toString('hex');
}
