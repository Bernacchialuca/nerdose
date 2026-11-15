// @vitest-environment node
import { describe, expect, it } from 'vitest';

import { declarations, outsideTheme, themeBody, tokensCss, tokensRaw } from './parse-theme';

const EXISTING = {
  '--font-mono': "'JetBrains Mono', ui-monospace, monospace",
  '--color-bg': '#0A0C0F',
  '--color-surface': '#0F1318',
  '--color-surface-2': '#11151A',
  '--color-surface-3': '#141920',
  '--color-border': '#222A33',
  '--color-border-strong': '#2A323C',
  '--color-border-subtle': '#1E252E',
  '--color-border-interactive': '#8D99A6',
  '--color-text': '#E6EDF3',
  '--color-text-muted': '#9AA6B2',
  '--color-text-dim': '#8D99A6',
  '--color-accent': '#3DDC84',
  '--color-on-accent': '#06120B',
  '--color-game-devdle': '#3DDC84',
  '--color-game-bug-hunt': '#FFB547',
  '--color-game-big-o': '#5EB1FF',
  '--color-game-timeline': '#C39BFF',
  '--color-game-grep-grid': '#F472B6',
  '--color-warning': '#FFB547',
  '--color-error': '#FF7B72',
};

function expectTokens(expected: Record<string, string>) {
  for (const [name, value] of Object.entries(expected)) {
    expect(declarations[name], name).toBe(value);
  }
}

describe('tokens.css', () => {
  it('keeps the 21 existing tokens with the same value (TS-1)', () => {
    expect(Object.keys(EXISTING)).toHaveLength(21);
    expectTokens(EXISTING);
  });

  it('declares font families and disables Mono ligatures (TS-2)', () => {
    expectTokens({
      '--font-sans': "'Inter', system-ui, sans-serif",
      '--font-mono--font-feature-settings': '"liga" 0, "calt" 0',
    });
  });

  it('declares the new DS neutrals (TS-3)', () => {
    expectTokens({
      '--color-surface-sunken': '#0D1116',
      '--color-surface-inset': '#141920',
      '--color-control': '#11151A',
      '--color-control-selected': '#2A323C',
      '--color-toolbar': '#11161C',
      '--color-discarded': '#12161B',
      '--color-titlebar': '#12171D',
      '--color-nav-active': '#161B22',
      '--color-border-row': '#161B22',
      '--color-track': '#1A2028',
      '--color-canvas-dot': '#1A2029',
      '--color-window-dot': '#3A424C',
      '--color-border-hover': '#3A424C',
      '--color-border-emphasis': '#5A6573',
      '--color-text-line-number': '#4F5A66',
      '--color-text-discarded': '#5F6B78',
      '--color-text-disabled': '#6B7682',
      '--color-text-lede': '#A9B4BF',
      '--color-text-body': '#C3CCD5',
      '--color-header': 'rgb(10 12 15 / 0.92)',
      '--color-accent-hover': '#7CF0B0',
    });
  });

  it('declares the per-game scale (TS-4)', () => {
    const scale: Record<string, string[]> = {
      devdle: ['#06120B', '#0C1A12', '#16301F', '#1E3A28', '#7CF0B0', '#1E4A30'],
      'bug-hunt': ['#1A1206', '#1A140A', '#33260F', '#7A5A2A', '#FFD08A', '#5C4419'],
      'big-o': ['#06121F', '#0B1522', '#1B2E45', '#7FA7CF', '#9ACFFF', '#2E4C6E'],
      timeline: ['#160E26', '#161024', '#2B2045', '#B596E6', '#DCC4FF', '#3C2E60'],
      'grep-grid': ['#24081A', '#1A0B16', '#3A1530', '#8A5C7A', '#F9A8D4', '#5B2147'],
    };
    const suffixes = ['on', 'tint', 'border', 'muted', 'light', 'featured'];
    for (const [game, values] of Object.entries(scale)) {
      suffixes.forEach((suffix, i) => {
        expect(declarations[`--color-game-${game}-${suffix}`], `${game}-${suffix}`).toBe(values[i]);
      });
    }
    expectTokens({
      '--color-game-bug-hunt-tint-strong': '#2A1F0B',
      '--color-game-bug-hunt-muted-bar': '#3A2C14',
      '--color-game-big-o-chip-border': '#23405F',
      '--color-game-timeline-rail': '#3C2E60',
    });
  });

  it('declares status and streak colors (TS-5)', () => {
    expectTokens({
      '--color-status-success': '#3DDC84',
      '--color-status-success-on': '#06120B',
      '--color-status-success-bg': '#0C1A12',
      '--color-status-success-border': '#1E4A30',
      '--color-status-success-soft': '#A9C9B5',
      '--color-status-success-badge': '#12301F',
      '--color-status-success-badge-text': '#7CF0B0',
      '--color-status-error': '#FF7B72',
      '--color-status-error-on': '#1C0605',
      '--color-status-error-bg': '#1C0F0E',
      '--color-status-error-border': '#4A2220',
      '--color-status-error-soft': '#D9B3AF',
      '--color-status-warning': '#FFB547',
      '--color-status-warning-on': '#1A1206',
      '--color-status-warning-bg': '#140F07',
      '--color-status-warning-border': '#3A2A12',
      '--color-status-warning-soft': '#C9A46A',
      '--color-status-pending': '#FFB547',
      '--color-status-pending-badge': '#2A1F0B',
      '--color-streak': '#FFB547',
      '--color-streak-bg': '#1A140A',
      '--color-streak-border': '#3A2A12',
      '--color-streak-surface': '#140F07',
      '--color-streak-label': '#C9A46A',
      '--color-streak-note': '#C9B48F',
      '--color-streak-hover': '#FFD08A',
      '--color-streak-border-hover': '#5C4419',
    });
  });

  it('declares the Grep Grid colors and the numeric-lg role (S-024 TS-1, TS-2)', () => {
    expect(declarations['--color-game-grep-grid-selected-bg']).toBe('#2A0F22');
    expect(declarations['--color-game-grep-grid-found-bg']).toBe('#1F0D19');
    expect(declarations['--text-numeric-lg']).toBe('26px');
    expect(declarations['--text-numeric-lg--line-height']).toBe('normal');
    expect(declarations['--text-numeric-lg--font-weight']).toBe('800');
    expect(declarations['--text-numeric-lg--letter-spacing']).toBeUndefined();
    expectTokens(EXISTING);
    expectTokens({
      '--color-game-grep-grid': '#F472B6',
      '--color-game-grep-grid-on': '#24081A',
      '--color-game-grep-grid-tint': '#1A0B16',
      '--color-game-grep-grid-border': '#3A1530',
      '--color-game-grep-grid-muted': '#8A5C7A',
      '--color-game-grep-grid-light': '#F9A8D4',
      '--color-game-grep-grid-featured': '#5B2147',
      '--text-numeric-md': '22px',
      '--text-numeric-md--line-height': 'normal',
      '--text-numeric-md--font-weight': '700',
    });
    expect(declarations['--color-game-grep-grid-found-border']).toBeUndefined();
    expect(declarations['--color-game-grep-grid-hover']).toBeUndefined();
    const grepValues = Object.entries(declarations)
      .filter(([n]) => n.startsWith('--color-game-grep-grid-'))
      .map(([, v]) => v);
    expect(grepValues.filter((v) => v === '#5B2147')).toHaveLength(1);
    expect(tokensRaw.split('--color-game-grep-grid-selected-bg:')).toHaveLength(2);
    expect(tokensRaw.split('--color-game-grep-grid-found-bg:')).toHaveLength(2);
    expect(tokensRaw.split('--text-numeric-lg:')).toHaveLength(2);
  });

  it('declares the Tech Timeline status colors and type roles (S-029 TS-1..TS-5)', () => {
    expect(declarations['--color-status-success-row-bg']).toBe('#0E1A13');
    expect(declarations['--color-status-misplaced-bg']).toBe('#17130B');
    expect(declarations['--color-status-misplaced-border']).toBe('#5C4419');
    expect(declarations['--text-display-score']).toBe('56px');
    expect(declarations['--text-display-score--line-height']).toBe('1');
    expect(declarations['--text-display-score--letter-spacing']).toBe('-2px');
    expect(declarations['--text-display-score--font-weight']).toBe('800');
    expect(declarations['--text-numeric-year']).toBe('18px');
    expect(declarations['--text-numeric-year--line-height']).toBe('normal');
    expect(declarations['--text-numeric-year--font-weight']).toBe('800');
    expect(declarations['--text-game-item']).toBe('16px');
    expect(declarations['--text-game-item--line-height']).toBe('normal');
    expect(declarations['--text-game-item--font-weight']).toBe('700');
    expect(declarations['--text-numeric-year--letter-spacing']).toBeUndefined();
    expect(declarations['--text-game-item--letter-spacing']).toBeUndefined();
    expectTokens(EXISTING);
    expectTokens({
      '--color-status-success-bg': '#0C1A12',
      '--color-status-success-border': '#1E4A30',
      '--color-status-pending-badge': '#2A1F0B',
      '--color-game-bug-hunt-featured': '#5C4419',
      '--color-streak-border-hover': '#5C4419',
      '--color-game-timeline': '#C39BFF',
      '--color-game-timeline-rail': '#3C2E60',
      '--text-numeric-lg': '26px',
      '--text-numeric-lg--font-weight': '800',
      '--text-game-tile-sm': '16px',
      '--text-game-tile-sm--font-weight': '800',
    });
    for (const name of [
      '--color-status-success-row-bg',
      '--color-status-misplaced-bg',
      '--color-status-misplaced-border',
      '--text-display-score',
      '--text-numeric-year',
      '--text-game-item',
    ]) {
      expect(tokensRaw.split(`${name}:`), name).toHaveLength(2);
    }
  });

  it('declares the 40 typographic roles with their companions (TS-6)', () => {
    const roles = Object.keys(declarations)
      .filter(
        (n) => n.startsWith('--text-') && !n.includes('--', 2) && !/^--text-[a-z-]+--/.test(n),
      )
      .map((n) => n.slice('--text-'.length));
    expect(roles).toHaveLength(40);
    for (const role of roles) {
      expect(declarations[`--text-${role}--line-height`], role).toBeDefined();
      if (role !== 'button-lg' && role !== 'button-md') {
        expect(declarations[`--text-${role}--font-weight`], role).toBeDefined();
      } else {
        expect(declarations[`--text-${role}--font-weight`], role).toBeUndefined();
      }
    }
    expectTokens({
      '--text-display-hero': '64px',
      '--text-display-hero--line-height': '1.02',
      '--text-display-hero--letter-spacing': '-2.5px',
      '--text-display-hero--font-weight': '800',
      '--text-display-streak-compact': '88px',
      '--text-display-streak-compact--letter-spacing': '-4px',
      '--text-code-terminal--line-height': '2',
      '--text-body': '15px',
      '--text-micro-xs': '10px',
    });
    expect(declarations['--text-body--letter-spacing']).toBeUndefined();
  });

  it('declares radii, containers, shadows and the blink animation (TS-7)', () => {
    expectTokens({
      '--radius-cell-xs': '4px',
      '--radius-cell-sm': '5px',
      '--radius-cell-md': '6px',
      '--radius-segment': '7px',
      '--radius-tile': '8px',
      '--radius-control': '10px',
      '--radius-inset': '12px',
      '--radius-panel': '14px',
      '--radius-feature': '16px',
      '--container-page': '1240px',
      '--container-lede': '540px',
      '--shadow-window': '0 24px 60px rgba(0, 0, 0, 0.45)',
      '--shadow-next-devdle': '0 0 0 1px #3DDC8433, 0 18px 40px rgba(20, 110, 60, 0.25)',
      '--shadow-next-bug-hunt': '0 0 0 1px #FFB54733, 0 18px 40px rgba(110, 70, 20, 0.25)',
      '--shadow-next-big-o': '0 0 0 1px #5EB1FF33, 0 18px 40px rgba(20, 60, 110, 0.25)',
      '--shadow-next-timeline': '0 0 0 1px #C39BFF33, 0 18px 40px rgba(70, 40, 110, 0.25)',
      '--shadow-next-grep-grid': '0 0 0 1px #F472B633, 0 18px 40px rgba(110, 20, 70, 0.25)',
      '--shadow-bar-bug-hunt': 'inset 3px 0 0 #FFB547',
      '--animate-blink': 'blink 1.1s steps(1) 4',
    });
    expect(themeBody).toMatch(/@keyframes blink\s*\{/);
  });

  it('declares the game-piece roles, colors and widths (S-021 TS-1, TS-2)', () => {
    expectTokens({
      '--text-title-game': '34px',
      '--text-title-game--letter-spacing': '-1px',
      '--text-title-game--font-weight': '700',
      '--text-brand-logo-compact': '18px',
      '--text-brand-logo-compact--font-weight': '800',
      '--text-brand-crumb': '18px',
      '--text-brand-crumb--font-weight': '700',
      '--text-game-tile-lg': '28px',
      '--text-game-tile-lg--font-weight': '800',
      '--text-game-tile-sm': '16px',
      '--text-game-tile-sm--font-weight': '800',
      '--text-game-key': '15px',
      '--text-game-key--font-weight': '700',
      '--text-game-key-small': '12px',
      '--text-game-key-small--font-weight': '700',
      '--text-body-sm': '14px',
      '--text-body-sm--line-height': '1.5',
      '--text-body-sm--font-weight': '400',
      '--text-body-sm-legend': '14px',
      '--text-body-sm-legend--line-height': '1.4',
      '--text-body-sm-legend--font-weight': '400',
      '--text-code-share': '14px',
      '--text-code-share--line-height': '1.7',
      '--text-code-share--font-weight': '400',
      '--color-status-present': '#FFB547',
      '--color-status-absent-bg': '#1A2028',
      '--color-status-absent-text': '#8D99A6',
      '--color-text-separator': '#2A323C',
      '--container-keyboard': '620px',
      '--container-devdle-aside': '380px',
    });
    expectTokens(EXISTING);
  });

  it('declares the tokens the solution previews rely on (S-038 TS-1..TS-4)', () => {
    // Devdle: celda correcta + palabra de la card
    expectTokens({
      '--color-game-devdle': '#3DDC84',
      '--color-game-devdle-on': '#06120B',
      '--radius-tile': '8px',
      '--text-title-panel': '20px',
      '--text-title-panel--font-weight': '700',
    });
    // Grep Grid: celda y fila «solución» (= encontrada), tablero y lista
    expectTokens({
      '--color-game-grep-grid': '#F472B6',
      '--color-game-grep-grid-on': '#24081A',
      '--color-game-grep-grid-light': '#F9A8D4',
      '--color-game-grep-grid-featured': '#5B2147',
      '--color-game-grep-grid-found-bg': '#1F0D19',
      '--color-surface-sunken': '#0D1116',
      '--color-surface-inset': '#141920',
      '--radius-feature': '16px',
      '--radius-control': '10px',
      '--text-mono-unit-compact': '15px',
      '--text-mono-body': '14px',
      '--text-meta': '12px',
      '--text-caption': '13px',
      '--text-caption--line-height': '1.5',
    });
    // Timeline: riel, fecha, nombre y nota
    expectTokens({
      '--color-game-timeline': '#C39BFF',
      '--color-game-timeline-rail': '#3C2E60',
      '--text-numeric-year': '18px',
      '--text-numeric-year--font-weight': '800',
      '--text-game-item': '16px',
      '--text-game-item--font-weight': '700',
      '--text-body-sm': '14px',
      '--text-body-sm--line-height': '1.5',
      '--color-text-lede': '#A9B4BF',
    });
    // Panel `//` compartido
    expectTokens({
      '--color-surface': '#0F1318',
      '--color-border': '#222A33',
      '--radius-panel': '14px',
      '--text-label-comment': '13px',
      '--text-label-comment--line-height': 'normal',
      '--text-label-comment--font-weight': '400',
      '--color-text-dim': '#8D99A6',
      '--color-text-body': '#C3CCD5',
      '--color-text-muted': '#9AA6B2',
    });
  });

  it('declares the Bug Hunt line, confirm and diff tokens (S-051 DS)', () => {
    expectTokens({
      '--color-game-bug-hunt-tint-hover': '#15110A',
      '--color-game-bug-hunt-disabled-bg': '#2A2416',
      '--color-game-bug-hunt-disabled-text': '#8A7856',
      '--color-status-error-diff-text': '#FFB3AD',
      '--color-status-success-diff-text': '#9EF0C2',
    });
  });

  it('has only @source and texture-dots outside @theme (TS-8)', () => {
    expect(tokensCss.match(/@theme\s*\{/g)).toHaveLength(1);
    expect(tokensRaw.split('@source "./components";')).toHaveLength(2);
    const rest = outsideTheme.replace('@source "./components";', '').trim();
    expect(rest.startsWith('@utility texture-dots {')).toBe(true);
    expect(rest.match(/@utility/g)).toHaveLength(1);
    expect(rest).toContain('background-color: var(--color-bg);');
    expect(rest).toContain(
      'background-image: radial-gradient(var(--color-canvas-dot) 1px, transparent 1px);',
    );
    expect(rest).toContain('background-size: 24px 24px;');
    for (const forbidden of ['prefers-color-scheme', '.dark', 'dark:', '@import', 'url(', 'http']) {
      expect(tokensRaw).not.toContain(forbidden);
    }
  });
});
