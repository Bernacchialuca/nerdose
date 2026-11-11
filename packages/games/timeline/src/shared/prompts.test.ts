import { describe, expect, it } from 'vitest';

import { PROMPT } from './prompts';

describe('PROMPT', () => {
  it('is a single fixed prompt for every day (TS-10)', () => {
    expect(PROMPT).toEqual({
      es: 'Ordená estos hitos del más antiguo al más reciente',
      en: 'Order these milestones from oldest to newest',
    });
  });
});
