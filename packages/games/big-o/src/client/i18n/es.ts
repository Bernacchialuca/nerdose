export const es = {
  title: 'Big O',
  instructions: {
    meta: 'Desafío #{{number}} · ~1 min · una partida por día',
    rulesTitle: 'cómo se juega',
    step1: {
      kicker: '1 · Leé el código',
      body: 'Es una función f(n) que cuenta sus propias operaciones. Arranca en tu lenguaje preferido y la podés ver en JavaScript, Go o Java cuando quieras: es el mismo algoritmo.',
    },
    step2: {
      kicker: '2 · Pensá en el peor caso',
      body: '¿Cómo crece la cantidad de operaciones cuando n crece? Fijate cómo avanza cada variable.',
    },
    step3: {
      kicker: '3 · Elegí y confirmá',
      body: 'Hay 8 opciones, de O(1) a O(n!), y un solo intento. Al confirmar ves la respuesta y la explicación paso a paso, y el lenguaje con el que confirmaste queda como tu preferido.',
    },
    countNotice:
      'La partida no cuenta hasta que confirmes. Si salís antes, al volver no vas a tener ninguna opción marcada, pero conservás tu intento.',
    start: 'Empezar',
  },
  question: {
    before: '¿Cuál es la complejidad temporal (peor caso) de ',
    after: '?',
  },
  code: {
    tabsLabel: 'Lenguaje del código',
    regionLabel: 'Código de f(n) en {{language}}',
  },
  game: {
    comment: 'peor caso · un solo intento',
    optionsTitle: 'tu respuesta',
    optionsLabel: 'Complejidad temporal de f(n)',
    hint: {
      idle: '> elegí una de las 8 opciones',
      selected: '> elegiste {{option}}. Podés cambiarla hasta confirmar.',
      invalidMove:
        '> no pudimos registrar tu respuesta. Elegí una opción y confirmá de nuevo: no perdiste tu intento.',
      rateLimited: '> vas muy rápido. Esperá unos segundos y probá de nuevo.',
      message: '> {{message}}',
    },
    confirm: 'Confirmar respuesta',
    confirming: 'Confirmando…',
    confirmDisabled: 'Elegí una opción para confirmar',
    rulesTitle: 'reglas',
    rule1: 'Peor caso: cómo crecen las operaciones cuando n crece.',
    rule2: 'Un solo intento: elegí y confirmá.',
    rule3:
      'El lenguaje es solo una vista: el que tengas abierto al confirmar queda como tu preferido.',
    help: 'Con teclado: flechas ← → para cambiar de lenguaje, Tab hasta las opciones, flechas para elegir y Enter en «Confirmar respuesta».',
  },
  result: {
    won: 'Correcto: {{answer}}',
    lost: 'Incorrecto: era {{answer}}',
    lostDetail: 'Elegiste {{chosen}} en {{language}}. Abajo, paso a paso por qué.',
    optionsTitle: 'tu respuesta · confirmada en {{language}}',
    correct: 'correcta',
    yours: 'tu respuesta',
    optionSr: {
      correctChosen: '{{option}}, correcta, tu respuesta',
      correct: '{{option}}, correcta',
      wrongChosen: '{{option}}, tu respuesta, incorrecta',
    },
    whyComment: 'por qué',
    stepsTitle: 'Paso a paso',
    example: {
      title: 'en números, con n = {{n}}',
      ops: 'f({{n}}) cuenta {{ops}} operaciones',
      trap: 'con {{trap}} serían {{trapOps}}',
    },
  },
  preview: {
    optionsTitle: 'respuesta',
    trap: 'trampa',
    optionSr: {
      trap: '{{option}}, trampa',
    },
  },
} as const;
