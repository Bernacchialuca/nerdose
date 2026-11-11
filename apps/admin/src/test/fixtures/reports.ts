import type { AdminReport, ReportGroup } from '@/modules/reports/api/types';

export const SESSION = {
  token: 'eyJhbGciOiJIUzI1NiJ9.test.sig',
  expires_at: '2026-11-11T20:00:00Z',
};

export const SESSION_KEY = 'nerdose_admin_session';

export const NOW = '2026-11-11T12:00:00Z';

const report = (
  n: number,
  rest: Partial<AdminReport> & Pick<AdminReport, 'reason'>,
): AdminReport => ({
  id: `aaaaaaa1-0000-4000-8000-00000000000${n}`,
  message: null,
  locale: 'es',
  context: { code_language: null, play_status: null, play_state: null, user_agent: null },
  status: 'open',
  created_at: '2026-11-10T12:00:00Z',
  player_ref: '00000000',
  ...rest,
});

export const R1: AdminReport = report(1, {
  reason: 'wrong_answer',
  message: 'dos palabras posibles',
  locale: 'es',
  context: {
    code_language: null,
    play_status: 'in_progress',
    play_state: { guesses: [] },
    user_agent: 'Mozilla/5.0 Chrome/130',
  },
  created_at: '2026-11-11T10:00:00Z',
  player_ref: 'a1b2c3d4',
});
export const R2: AdminReport = report(2, {
  reason: 'wrong_answer',
  message: null,
  locale: 'en',
  context: {
    code_language: null,
    play_status: 'won',
    play_state: null,
    user_agent: 'Mozilla/5.0 Safari/18',
  },
  created_at: '2026-11-11T07:00:00Z',
  player_ref: '9f0e1d2c',
});
export const R3: AdminReport = report(3, {
  reason: 'wrong_answer',
  message: '<b>REDIS</b> es la respuesta',
  locale: 'es',
  context: {
    code_language: null,
    play_status: 'lost',
    play_state: null,
    user_agent: 'Mozilla/5.0 Firefox/132',
  },
  created_at: '2026-11-10T12:00:00Z',
  player_ref: '77aa01bc',
});
export const R4: AdminReport = report(4, {
  reason: 'ambiguous',
  created_at: '2026-11-10T12:00:00Z',
  player_ref: '1234abcd',
});
export const R5: AdminReport = report(5, {
  reason: 'translation',
  created_at: '2026-11-09T12:00:00Z',
  player_ref: '5678ef90',
});
export const R6: AdminReport = report(6, {
  reason: 'display_bug',
  created_at: '2026-11-08T12:00:00Z',
  player_ref: 'deadbeef',
});

export const DEVDLE_ID = '6a1b2c3d-4e5f-4a6b-8c7d-9e0f1a2b3c4d';
export const TERM_ID = 'a3f1c2d4-5b6e-4f70-8a91-b2c3d4e5f601';

export const DEVDLE_GROUP: ReportGroup = {
  challenge: {
    id: DEVDLE_ID,
    game_id: 'devdle',
    date: '2026-11-08',
    number: 8,
    status: 'published',
    payload: {
      term_id: TERM_ID,
      word: 'REDIS',
      category: 'databases',
      definition: { es: 'Almacén de datos en memoria', en: 'In-memory data store' },
      summary: { es: 'Base clave-valor', en: 'Key-value database' },
      date: '2026-11-08',
    },
    verification: {
      ok: true,
      checks: [
        { name: 'solution_verified', ok: true },
        { name: 'translation_consistent', ok: true },
      ],
    },
    void_reason: null,
    voided_at: null,
    culprits: [{ kind: 'term', id: TERM_ID, label: 'REDIS' }],
  },
  alerted_at: '2026-11-11T08:00:00Z',
  report_count: 3,
  reasons: { wrong_answer: 3 },
  reports: [R1, R2, R3],
};

export const TIMELINE_ID = '7b2c3d4e-5f60-4b7c-9d8e-0f1a2b3c4d5e';
export const FACT_1 = 'bbbbbbb1-0000-4000-8000-000000000001';
export const FACT_2 = 'bbbbbbb1-0000-4000-8000-000000000002';

export const TIMELINE_GROUP: ReportGroup = {
  challenge: {
    id: TIMELINE_ID,
    game_id: 'timeline',
    date: '2026-11-07',
    number: 7,
    status: 'published',
    payload: {
      items: [
        {
          fact_id: FACT_1,
          label: { es: 'Lanzamiento de Docker', en: 'Docker release' },
          year: 2013,
        },
      ],
    },
    verification: { ok: true, checks: [] },
    void_reason: null,
    voided_at: null,
    culprits: [
      { kind: 'timeline_fact', id: FACT_1, label: 'Lanzamiento de Docker' },
      { kind: 'timeline_fact', id: FACT_2, label: 'Primera versión de Linux' },
    ],
  },
  alerted_at: null,
  report_count: 2,
  reasons: { ambiguous: 1, translation: 1 },
  reports: [R4, R5],
};

export const VOIDED_ID = '8c3d4e5f-6071-4c8d-8e9f-1a2b3c4d5e6f';

export const VOIDED_GROUP: ReportGroup = {
  challenge: {
    id: VOIDED_ID,
    game_id: 'grep-grid',
    date: '2026-11-06',
    number: 6,
    status: 'voided',
    payload: { words: ['REDIS', 'NGINX'] },
    verification: { ok: true, checks: [] },
    void_reason: 'definición incorrecta',
    voided_at: '2026-11-08T14:32:00Z',
    culprits: [],
  },
  alerted_at: null,
  report_count: 1,
  reasons: { display_bug: 1 },
  reports: [R6],
};

export const OPEN_GROUPS = { groups: [DEVDLE_GROUP, TIMELINE_GROUP, VOIDED_GROUP] };
