import type { TimelineCategory } from '@nerdose/core';

export const PROMPTS: Record<TimelineCategory, { es: string; en: string }> = {
  programming_languages: {
    es: 'Ordená estos lenguajes del más antiguo al más reciente',
    en: 'Order these languages from oldest to newest',
  },
  frameworks: {
    es: 'Ordená estos frameworks del más antiguo al más reciente',
    en: 'Order these frameworks from oldest to newest',
  },
  companies: {
    es: 'Ordená estas empresas de la más antigua a la más reciente',
    en: 'Order these companies from oldest to newest',
  },
  operating_systems: {
    es: 'Ordená estos sistemas operativos del más antiguo al más reciente',
    en: 'Order these operating systems from oldest to newest',
  },
  hardware: {
    es: 'Ordená estos productos de hardware del más antiguo al más reciente',
    en: 'Order these hardware products from oldest to newest',
  },
  video_games: {
    es: 'Ordená estos videojuegos del más antiguo al más reciente',
    en: 'Order these video games from oldest to newest',
  },
};
