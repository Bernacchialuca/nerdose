import { describe, expect, it } from 'vitest';

import { PAYLOAD } from '../definition/test-fixtures';
import { eligibleFacts } from './eligibility';
import { BANK, BID } from './test-fixtures';

const labels = (fs: { label: string }[]) => fs.map((f) => f.label);

describe('eligibleFacts', () => {
  it('applies the 90-day window (TS-41)', () => {
    expect(labels(eligibleFacts(BANK, '2026-12-10', []))).toEqual([
      'Python',
      'Go',
      'Node.js',
      'Kotlin',
      'TypeScript',
      'Elixir',
      'Django',
      'Angular',
      'React',
      'Vue.js',
    ]);
    const later = labels(eligibleFacts(BANK, '2027-02-20', []));
    expect(later).toContain('Java');
    expect(later).toContain('Swift');
    expect(later).not.toContain('Rust');
  });

  it('excludes facts of recent challenges (TS-42)', () => {
    const payload = {
      ...PAYLOAD,
      items: [{ ...PAYLOAD.items[0]!, fact_id: BID('01') }, ...PAYLOAD.items.slice(1)],
    };
    const l = labels(eligibleFacts(BANK, '2026-12-10', [{ date: '2026-12-05', payload }]));
    expect(l).not.toContain('Python');
    expect(l).toContain('Go');
  });
});
