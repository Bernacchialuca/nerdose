export const es = {
  shell: { brand: 'nerdose', title: 'nerdose' },
  errors: { title: 'Algo salió mal', retry: 'Reintentar' },
  nav: {
    label: 'Navegación principal',
    games: './juegos',
    stats: './stats',
    about: './about',
  },
  language: { label: 'Idioma', es: 'ES', en: 'EN' },
  cookies: {
    title: 'Activá las cookies para poder jugar',
    detail:
      'Sin cookies no podemos guardar tu partida. El catálogo, las estadísticas y «Acerca de» siguen disponibles.',
  },
  footer: {
    tagline: 'nerdose — una plataforma, múltiples desafíos.',
    exit: 'exit 0',
    privacy:
      'Sin cuenta: una única cookie funcional guarda tu progreso, sin datos personales ni cookies de terceros.',
    about: 'Acerca de',
  },
  about: {
    documentTitle: 'Acerca de · nerdose',
    title: 'Acerca de nerdose',
    intro:
      'nerdose es un juego diario sobre programación y tecnología: cinco minijuegos cortos, un único desafío por día igual para todos, sin registro y en español e inglés.',
    games: {
      title: 'Los 5 juegos',
      body: 'Devdle: adiviná el término. Bug Hunt: encontrá la línea con el bug. Big O: elegí la complejidad. Tech Timeline: ordená los hitos. Grep Grid: encontrá las 8 palabras, sin tiempo.',
    },
    streaks: {
      title: 'Cómo funciona la racha',
      body: 'Completar un desafío, ganando o perdiendo, suma a tu racha. Un día sin desafío es neutro: no suma ni corta. Un desafío anulado no te afecta.',
    },
    attribution: {
      title: 'Datos y atribución',
      body: 'Parte del contenido proviene de <wikipedia>Wikipedia</wikipedia> y <wikidata>Wikidata</wikidata> y se usa bajo licencia <license>CC BY-SA 4.0</license>.',
    },
    newTab: '(abre en una pestaña nueva)',
    privacy: {
      title: 'Privacidad',
      body: 'No hay cuenta ni registro. Usamos una única cookie funcional para guardar tu progreso: no guarda datos personales, no la usamos para seguirte y no hay cookies de terceros. Por eso no te mostramos un banner de cookies.',
    },
    back: 'Volver a los juegos',
  },
  notFound: {
    documentTitle: 'Página no encontrada · nerdose',
    title: '404 · página no encontrada',
    message: 'Esta dirección no existe en nerdose. Los desafíos de hoy te esperan en la home.',
    back: 'Volver a los juegos',
  },
  catalog: {
    title: 'Cinco juegos tech. Un desafío por día.',
    subtitle: 'Sin registro, de 1 a 3 minutos por partida. El mismo desafío para todos, cada día.',
    howItWorks: '¿Cómo funciona?',
    hero: { continue: 'Seguir jugando', start: 'Empezar a jugar', browse: 'Ver los juegos' },
    gamesLabel: 'Juegos de hoy',
    challengeLabel: 'Desafío del día',
    challengeNumber: '#{{number}}',
    streakPill: {
      label_one: 'Racha global: {{count}} día',
      label_other: 'Racha global: {{count}} días',
      labelUnknown: 'Racha global: sin datos',
      value_one: '{{count}} día',
      value_other: '{{count}} días',
      unknown: '—',
    },
    progress: {
      completed: '{{completed}} de {{total}} completados hoy',
      completedWithChallenge: '{{completed}} de {{total}} con desafío completados',
      noChallenges: 'Hoy no hay desafíos publicados',
      beforeLaunch: 'El primer desafío llega pronto',
      noSession: 'Sin sesión: no podemos mostrar tu progreso',
      unavailable: 'No pudimos iniciar tu sesión. Recargá en unos minutos para jugar.',
    },
    globalStreak_one: 'Racha global: {{count}} día',
    globalStreak_other: 'Racha global: {{count}} días',
    globalStreakUnknown: 'Racha global: —',
    countdown: 'Próximo desafío en {{time}}',
    loading: 'Cargando los desafíos de hoy…',
    error: 'No pudimos cargar los juegos de hoy. Revisá tu conexión e intentá de nuevo.',
    card: {
      minutes: '~{{count}} min',
      untimed: 'sin tiempo',
      streak: 'racha {{count}}',
      status: {
        notPlayed: 'sin jugar',
        inProgress: 'en curso',
        completed: 'completado',
        none: 'sin desafío hoy · no afecta tu racha',
        voided: 'anulado',
        soon: 'próximamente',
        noSession: 'sin sesión',
      },
      cta: {
        play: 'Jugar',
        continue: 'Seguir jugando',
        result: 'Ver resultado',
        none: 'Sin desafío hoy',
        soon: 'Próximamente',
      },
    },
    summary: {
      title: 'Tu progreso',
      streaks: 'Racha global {{current}} · Récord {{max}}',
      empty: 'Todavía no hay datos. Completá un desafío y acá vas a ver tu racha y tu heatmap.',
      noChallenges:
        'Todavía no hay datos. Cuando haya desafíos, acá vas a ver tu racha y tu heatmap.',
      beforeLaunch:
        'Todavía no hay datos. Cuando empiecen los desafíos, acá vas a ver tu racha y tu heatmap.',
      noSession: 'Sin sesión no hay progreso para mostrar. Activá las cookies y recargá.',
      unavailable: 'Sin sesión no hay progreso para mostrar. Recargá en unos minutos.',
    },
    stats: 'ver estadísticas',
  },
  games: {
    devdle: { name: 'Devdle', description: 'Adiviná el término tech en 6 intentos' },
    'grep-grid': { name: 'Grep Grid', description: 'Encontrá 8 palabras en la grilla' },
    timeline: { name: 'Tech Timeline', description: 'Ordená 5 hitos de la tecnología' },
    'big-o': { name: 'Big O', description: 'Elegí la complejidad temporal' },
    'bug-hunt': { name: 'Bug Hunt', description: 'Encontrá la línea con el bug' },
  },
};
