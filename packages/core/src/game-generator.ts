export type BankName = 'terms' | 'timeline_facts';

export interface HistorySpec {
  bank: BankName | null;
  lastUsedField: string;
  recentDays: number;
  /** Days after D also read as history (default 0); the row of D is excluded (REQ-009). */
  aheadDays?: number;
}

export interface RecentChallenge<Payload> {
  date: string;
  payload: Payload;
}

export interface GeneratorHistory<Payload = unknown, BankItem = unknown> {
  bankItems: readonly BankItem[];
  recentChallenges: readonly RecentChallenge<Payload>[];
}

export interface VerificationCheck {
  name: string;
  ok: boolean;
  detail?: string;
}

export interface VerificationLog {
  ok: boolean;
  checks: VerificationCheck[];
  reason?: string;
}

export interface GameGenerator<Payload, BankItem = unknown> {
  historySpec: HistorySpec;
  usedBankItems(p: Payload): string[];
  generate(input: {
    date: string;
    seed: Uint8Array;
    history: GeneratorHistory<Payload, BankItem>;
  }): Payload;
  verify(
    p: Payload,
    history: GeneratorHistory<Payload, BankItem>,
  ): VerificationLog | Promise<VerificationLog>;
}

// Heterogeneous registry: each game has its own Payload and BankItem.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AnyGameGenerator = GameGenerator<any, any>;
