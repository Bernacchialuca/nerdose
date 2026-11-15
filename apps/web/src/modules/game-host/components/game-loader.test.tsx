import { render, screen } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import { describe, expect, it } from 'vitest';

import i18n from '@/i18n';

import { GameLoader } from './game-loader';

const loader = (phase?: 'instructions' | 'playing' | 'result') =>
  render(
    <I18nextProvider i18n={i18n}>
      <GameLoader gameId="bug-hunt" phase={phase} />
    </I18nextProvider>,
  );

describe('GameLoader', () => {
  it.each([
    [undefined, '$ cargando bug-hunt…'],
    ['instructions', '$ cargando bug-hunt…'],
    ['playing', '$ cargando tu partida de bug-hunt…'],
    ['result', '$ cargando tu resultado de bug-hunt…'],
  ] as const)('phase %s dice «%s»', (phase, text) => {
    loader(phase);
    expect(screen.getByRole('status')).toHaveTextContent(text);
  });
});
