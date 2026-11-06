import { describe, expect, it } from 'vitest';

import i18n from '@/i18n';

import { en } from './en';
import { es } from './es';

function flattenKeys(tree: object, prefix = ''): string[] {
  return Object.entries(tree)
    .flatMap(([key, value]) =>
      typeof value === 'object' && value !== null
        ? flattenKeys(value, `${prefix}${key}.`)
        : [`${prefix}${key}`],
    )
    .sort();
}

describe('i18n', () => {
  it('es y en tienen las mismas claves', () => {
    const esKeys = flattenKeys(es);
    expect(esKeys.length).toBeGreaterThan(0);
    expect(flattenKeys(en)).toEqual(esKeys);
    expect(esKeys).toEqual(
      expect.arrayContaining(['shell.brand', 'shell.title', 'errors.title', 'errors.retry']),
    );
  });

  it('textos en español', () => {
    expect(es.shell.brand).toBe('nerdose');
    expect(es.shell.title).toBe('nerdose');
    expect(es.errors.title).toBe('Algo salió mal');
    expect(es.errors.retry).toBe('Reintentar');
  });

  it('textos nuevos en español', () => {
    expect(es.cookies.title).toBe('Activá las cookies para poder jugar');
    expect(es.about.title).toBe('Acerca de nerdose');
    expect(es.notFound.title).toBe('404 · página no encontrada');
    expect(es.notFound.back).toBe('Volver a los juegos');
  });

  it('claves nuevas y textos exactos en español', () => {
    expect(flattenKeys(es)).toEqual(
      expect.arrayContaining([
        'nav.label',
        'nav.games',
        'nav.stats',
        'nav.about',
        'language.label',
        'language.es',
        'language.en',
        'cookies.title',
        'cookies.detail',
        'footer.tagline',
        'footer.exit',
        'about.documentTitle',
        'about.title',
        'about.intro',
        'about.games.title',
        'about.games.body',
        'about.games.link',
        'about.streaks.link',
        'about.streaks.title',
        'about.streaks.body',
        'about.attribution.title',
        'about.attribution.body',
        'about.newTab',
        'about.privacy.title',
        'about.privacy.body',
        'about.back',
        'notFound.documentTitle',
        'notFound.title',
        'notFound.message',
        'notFound.back',
      ]),
    );
    expect(es.nav).toEqual({
      label: 'Navegación principal',
      games: './juegos',
      stats: './stats',
      about: './about',
    });
    expect(es.language).toEqual({ label: 'Idioma', es: 'ES', en: 'EN' });
    expect(es.cookies.detail).toBe(
      'Sin cookies no podemos guardar tu partida. El catálogo, las estadísticas y «Acerca de» siguen disponibles.',
    );
    expect(es.about.documentTitle).toBe('Acerca de · nerdose');
    expect(es.about.games.title).toBe('Los juegos');
    expect(es.about.streaks.title).toBe('Cómo funciona la racha');
    expect(es.about.attribution.title).toBe('Datos y atribución');
    expect(es.about.privacy.title).toBe('Privacidad');
    expect(es.about.newTab).toBe('(abre en una pestaña nueva)');
    expect(es.about.back).toBe('Volver a los juegos');
    expect(es.notFound.documentTitle).toBe('Página no encontrada · nerdose');
    expect(es.notFound.message).toBe(
      'Esta dirección no existe en nerdose. Los desafíos de hoy te esperan en la home.',
    );
  });

  it('TS-2: claves del catálogo', () => {
    const keys = flattenKeys(es);
    expect(flattenKeys(en)).toEqual(keys);
    const expected = [
      'catalog.title',
      'catalog.subtitle',
      'catalog.howItWorks',
      'catalog.hero.continue',
      'catalog.hero.start',
      'catalog.hero.browse',
      'catalog.challengeLabel',
      'catalog.challengeNumber',
      'catalog.streakPill.label_one',
      'catalog.streakPill.label_other',
      'catalog.streakPill.labelUnknown',
      'catalog.streakPill.value_one',
      'catalog.streakPill.value_other',
      'catalog.streakPill.unknown',
      'catalog.progress.completed',
      'catalog.progress.completedWithChallenge',
      'catalog.progress.noChallenges',
      'catalog.progress.beforeLaunch',
      'catalog.progress.noSession',
      'catalog.progress.unavailable',
      'catalog.loading',
      'catalog.error',
      'catalog.card.minutes',
      'catalog.card.untimed',
      'catalog.card.streak',
      'catalog.stats',
      'catalog.hero.prompt',
      'catalog.hero.date',
      'catalog.challenges.title',
      'catalog.terminal.label',
      'catalog.terminal.title',
      'catalog.terminal.command',
      'catalog.terminal.streakLabel',
      'catalog.terminal.streakValue_one',
      'catalog.terminal.streakValue_other',
      'catalog.terminal.streakUnknown',
      'catalog.terminal.countdown',
      'catalog.card.neutral',
      'catalog.placeholder.command',
      'catalog.placeholder.branch',
      'catalog.placeholder.body',
      'catalog.placeholder.chip',
      'catalog.progressPanel.label',
      'catalog.progressPanel.unit_one',
      'catalog.progressPanel.unit_other',
      'catalog.progressPanel.unitSuffix_one',
      'catalog.progressPanel.unitSuffix_other',
      'catalog.progressPanel.unitUnknown',
      'catalog.progressPanel.record',
      'catalog.how.title',
      'catalog.summary.title',
      'catalog.summary.empty',
      'catalog.summary.noChallenges',
      'catalog.summary.beforeLaunch',
      'catalog.summary.noSession',
      'catalog.summary.unavailable',
      ...['notPlayed', 'inProgress', 'completed', 'none', 'voided', 'soon', 'noSession'].map(
        (k) => `catalog.card.status.${k}`,
      ),
      ...['done', 'notPlayed', 'inProgress', 'none', 'voided', 'soon', 'noSession'].map(
        (k) => `catalog.terminal.status.${k}`,
      ),
      ...['1', '2', '3', '4'].flatMap((n) => [
        `catalog.how.steps.${n}.kicker`,
        `catalog.how.steps.${n}.body`,
      ]),
      ...['play', 'continue', 'result', 'none', 'soon'].map((k) => `catalog.card.cta.${k}`),
      ...['devdle', 'grep-grid', 'timeline', 'big-o', 'bug-hunt'].flatMap((g) => [
        `games.${g}.name`,
        `games.${g}.description`,
      ]),
    ];
    expect(keys).toEqual(expect.arrayContaining(expected));
  });

  it('TS-3: textos exactos del catálogo en español', () => {
    expect(es.catalog.title).toBe('Una dosis diaria de <accent>nerdeo</accent>.');
    expect(es.catalog.error).toBe(
      'No pudimos cargar los juegos de hoy. Revisá tu conexión e intentá de nuevo.',
    );
    expect(es.catalog.card.status.none).toBe('sin desafío hoy');
    expect(es.catalog.card.neutral).toBe('no afecta tu racha');
    expect(es.catalog.challenges.title).toBe('Los desafíos de hoy');
    expect(es.catalog.terminal.title).toBe('~/hoy — progreso.log');
    expect(es.catalog.terminal.streakValue_other).toBe('{{count}} días · récord {{max}}');
    expect(es.catalog.placeholder.body).toBe(
      'Más desafíos en camino. Cada juego nuevo suma su propia racha.',
    );
    expect(es.catalog.how.steps['4'].kicker).toBe('04 · compartís sin spoilers');
    expect(es.catalog.loading).toBe('Cargando los desafíos de hoy…');
    expect(es.games['big-o'].name).toBe('Big O');
    expect(es.games.timeline.name).toBe('Tech Timeline');
    expect(es.games['grep-grid'].description).toBe('Encontrá 8 palabras en la grilla');
  });

  it('actualiza <html lang> al cambiar de idioma', async () => {
    await i18n.changeLanguage('en');
    expect(document.documentElement.lang).toBe('en');
    await i18n.changeLanguage('es');
    expect(document.documentElement.lang).toBe('es');
  });

  it('textos en inglés', () => {
    expect(en.shell.brand).toBe('nerdose');
    expect(en.shell.title).toBe('nerdose');
    expect(en.errors.title).toBe('Something went wrong');
    expect(en.errors.retry).toBe('Try again');
  });

  it('arranca en español con fallback es', () => {
    expect(i18n.language).toBe('es');
    expect(i18n.options.fallbackLng).toContain('es');
    expect(i18n.t('errors.retry')).toBe('Reintentar');
  });
});
