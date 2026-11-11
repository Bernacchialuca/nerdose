export const es = {
  title: 'Tech Timeline',
  categories: {
    programming_languages: 'lenguajes de programación',
    frameworks: 'frameworks',
    companies: 'empresas',
    operating_systems: 'sistemas operativos',
    hardware: 'hardware',
    video_games: 'videojuegos',
    databases: 'bases de datos',
    software_tools: 'software y herramientas',
  },
  instructions: {
    meta: 'Desafío #{{number}} · ~1 min · una partida por día',
    rulesTitle: 'cómo se juega',
    step1: {
      kicker: '1 · Mirá los 5 hitos',
      body: 'Son hechos de la historia de la tecnología de distintas categorías (lenguajes, frameworks, empresas…), mezclados y sin fecha.',
    },
    step2: {
      kicker: '2 · Ordenalos',
      body: 'Del más antiguo al más reciente. Arrastrá cada fila desde su asa ⠿, usá los botones ↑ ↓, o con el teclado: Espacio para tomar un hito, flechas para moverlo, Espacio para soltarlo y Escape para cancelar.',
    },
    step3: {
      kicker: '3 · Confirmá',
      body: 'Tenés un solo intento. Cuando el orden te convenza, tocá «Confirmar orden»: vas a ver las fechas, una nota de cada hito y cuántas posiciones acertaste.',
    },
    countNotice:
      'La partida no cuenta hasta que confirmes. Si salís antes, al volver los hitos arrancan otra vez mezclados.',
    start: 'Empezar',
  },
  game: {
    comment: 'consigna: del más antiguo al más reciente · un solo intento',
    listTitle: 'tu orden',
    help: 'Arrastrá cada fila desde su asa ⠿ o usá ↑ ↓. Con teclado: Espacio para tomar un hito, flechas para moverlo, Espacio para soltarlo y Escape para devolverlo a su lugar.',
    confirm: 'Confirmar orden',
    confirming: 'Confirmando…',
  },
  row: {
    handle: '{{label}}, posición {{position}} de {{total}}',
    roleDescription: 'elemento reordenable',
    up: 'Subir {{label}}',
    down: 'Bajar {{label}}',
  },
  dnd: {
    instructions:
      'Para tomar un hito, presioná Espacio o Enter. Movelo con las flechas arriba y abajo. Presioná Espacio o Enter para soltarlo, o Escape para devolverlo a su lugar.',
    start: 'Tomaste {{label}}, posición {{position}} de {{total}}.',
    over: '{{label}}, posición {{position}} de {{total}}.',
    end: 'Soltaste {{label}} en la posición {{position}} de {{total}}.',
    cancel: '{{label}} volvió a la posición {{position}} de {{total}}.',
  },
  hint: {
    over: '> {{label}}, posición {{position}} de {{total}}',
    moved: '> moviste {{label}} a la posición {{position}} de {{total}}',
    invalidMove: '> no pudimos registrar ese orden. Revisalo y confirmá de nuevo',
    rateLimited: '> vas muy rápido. Esperá unos segundos y probá de nuevo',
    message: '> {{message}}',
  },
  result: {
    comment: 'consigna: del más antiguo al más reciente',
    won: 'Orden perfecto',
    partial: '{{score}} de {{total}} en su lugar',
    zero: 'Ninguno en su lugar esta vez',
    scoreUnitTop: 'posiciones',
    scoreUnitBottom: 'correctas',
    yourOrder: 'tu orden',
    correctOrder: 'orden correcto',
    ok: '✓ bien',
    goesIn: '✗ va en {{position}}°',
    rowOk: '{{label}}, posición {{position}}: bien',
    rowWrong: '{{label}}, posición {{position}}: mal ubicado, va en {{correct}}°',
  },
} as const;
