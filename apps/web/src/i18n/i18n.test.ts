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
    expect(es.footer.about).toBe('Acerca de');
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
        'footer.domain',
        'footer.privacy',
        'footer.about',
        'about.documentTitle',
        'about.title',
        'about.intro',
        'about.games.title',
        'about.games.body',
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
    expect(es.footer.privacy).toBe(
      'Sin cuenta: una única cookie funcional guarda tu progreso, sin datos personales ni cookies de terceros.',
    );
    expect(es.about.documentTitle).toBe('Acerca de · nerdose');
    expect(es.about.games.title).toBe('Los 5 juegos');
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
