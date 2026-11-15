export const es = {
  title: 'Bug Hunt',
  instructions: {
    meta: 'Desafío #{{number}} · ~2 min · una partida por día',
    rulesTitle: 'cómo se juega',
    step1: {
      kicker: '1 · Leé qué debería hacer',
      body: 'Tenés la especificación de una función corta y algunos tests que pasan. Hay un test oculto que falla: el bug está ahí.',
    },
    step2: {
      kicker: '2 · Buscá la línea',
      body: 'El bug está en una sola línea. Podés ver el código en JavaScript, Go o Java cuando quieras: es la misma función y el bug está en la misma línea. La firma y las líneas con solo llaves no cuentan.',
    },
    step3: {
      kicker: '3 · Elegí y confirmá',
      body: 'Tenés un solo intento. Al confirmar ves el test que falla, el fix y por qué falla, y el lenguaje con el que confirmaste queda como tu preferido.',
    },
    countNotice:
      'La partida no cuenta hasta que confirmes. Si salís antes, al volver no vas a tener ninguna línea marcada, pero conservás tu intento.',
    start: 'Empezar',
  },
  question: '¿En qué línea está el bug?',
  spec: { title: 'qué debería hacer' },
  tests: {
    title: 'tests',
    datum: 'llamada → esperado',
    passSr: '{{name}} de {{args}} da {{expected}}, pasa',
    hidden: '1 test oculto falla',
    note: 'El test que falla se revela al confirmar. Los que pasan te ayudan a descartar líneas.',
  },
  code: {
    tabsLabel: 'Lenguaje del código',
    regionLabel: 'Código de {{name}} en {{language}}',
    linesLabel: 'Líneas de {{name}} en {{language}}',
    lineLabel: 'Línea {{line}}: {{code}}',
    chosenTag: 'tu elección',
  },
  game: {
    comment: 'un solo intento · la firma y las líneas con solo llaves no cuentan',
    hint: {
      idle: '> tocá la línea donde creés que está el bug',
      selected: '> elegiste la línea {{line}}. Podés cambiarla hasta confirmar.',
      invalidMove:
        '> no pudimos registrar esa línea. Elegí una y confirmá de nuevo: no perdiste tu intento.',
      rateLimited: '> vas muy rápido. Esperá unos segundos y probá de nuevo.',
      message: '> {{message}}',
    },
    confirm: 'Confirmar línea {{line}}',
    confirmIdle: 'Elegí una línea',
    confirming: 'Confirmando…',
    languagesNote:
      'El bug es el mismo en los tres lenguajes: cambiar de pestaña no cambia la respuesta.',
    rulesTitle: 'cómo se juega',
    rule1: 'Leé qué debería hacer la función y mirá los tests.',
    rule2: 'Tocá la línea donde creés que está el bug.',
    rule3: {
      before: 'Confirmá: tenés ',
      strong: 'un solo intento',
      after: '. El lenguaje que tengas abierto queda como tu preferido.',
    },
    help: 'Con teclado: flechas ← → para cambiar de lenguaje, Tab hasta el código, flechas ↑ ↓ para recorrer las líneas elegibles, Espacio para elegir y Enter en «Confirmar línea».',
  },
  result: {
    won: 'Bug encontrado en la línea {{line}}',
    lost: 'El bug estaba en la línea {{bug}}, no en la {{chosen}}',
    lostDetail:
      'Elegiste la línea {{chosen}} en {{language}}. Desafío completado: tus rachas siguen en pie.',
    tag: { found: 'acá estaba el bug', wrong: 'tu elección' },
    failingTitle: 'el test que falla',
    expected: 'esperado',
    actual: 'obtenido',
    fixTitle: 'el fix · línea {{line}}',
    fixLabel: 'Fix de la línea {{line}} en {{language}}',
    whyTitle: 'Por qué falla',
    bugType: 'tipo: {{type}}',
  },
  preview: { bugTag: 'línea del bug', mutation: 'mutación: {{from}} → {{to}}' },
  share: { found: 'bug encontrado', missed: 'se me escapó' },
  stats: {
    byLanguage: 'por lenguaje',
    byBugType: 'por tipo de bug',
    count: '{{correct}} de {{played}}',
    none: 'Todavía no jugaste a este juego.',
  },
} as const;
