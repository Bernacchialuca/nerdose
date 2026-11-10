export const es = {
  title: 'Grep Grid',
  instructions: {
    meta: 'Desafío #{{number}} · ~3 min · una partida por día',
    rulesTitle: 'cómo se juega',
    step1: {
      kicker: '1 · Buscá las 8 palabras',
      body: 'Son términos de tecnología escondidos en una grilla de 12×12 letras. La lista de palabras está a la vista: lo que tenés que encontrar es dónde están.',
    },
    step2: {
      kicker: '2 · Tocá la primera y la última letra',
      body: 'Las palabras van en 4 direcciones, siempre hacia adelante: → horizontal, ↓ vertical, ↘ y ↗ en diagonal. Nunca al revés. El primer toque marca el inicio y el segundo envía la selección; tocar de nuevo el inicio la cancela. Si la selección no es una palabra de la lista, no pasa nada: probás de nuevo.',
    },
    step3: {
      kicker: '3 · Sin tiempo',
      body: 'No hay reloj: el contador N/8 lleva la cuenta. Podés rendirte cuando quieras; la partida cierra con las palabras que encontraste y te mostramos las que faltaban, con su definición.',
    },
    countNotice:
      'La partida no cuenta hasta que la completes. Encontrar las 8 o rendirte suma a tu racha.',
    start: 'Empezar',
  },
  game: {
    prompt: "$ grep -o '[A-Z]*' hoy.txt",
    instruction: 'tocá la primera y la última letra de cada palabra',
  },
  counter: { value: '{{found}}/{{total}}', label: 'encontradas' },
  board: {
    label: 'Grilla de 12 por 12',
    resultLabel: 'Grilla final: {{found}} encontradas y {{revealed}} reveladas',
  },
  cell: {
    label: '{{letter}}, fila {{row}}, columna {{col}}, {{state}}',
    free: 'libre',
    start: 'inicio',
    found: 'encontrada',
    revealed: 'revelada',
  },
  hint: {
    idle: '> tocá la primera letra de una palabra',
    start: '> ahora tocá la última letra',
    found: '> {{word}} encontrada · {{found}}/{{total}}',
    notAWord: '> no es una palabra de la lista, probá de nuevo',
    invalidMove: '> las palabras se marcan de la primera a la última letra, hacia adelante',
    rateLimited: '> vas muy rápido. Esperá unos segundos y probá de nuevo',
    message: '> {{message}}',
  },
  words: {
    title: 'palabras de hoy',
    letters: '{{count}} letras',
    foundSr: 'encontrada',
    foundResult: '✓ encontrada',
    revealed: '○ no la encontraste',
  },
  surrender: {
    button: 'Rendirse',
    title: '¿Rendirte?',
    close: 'Cerrar',
    body: 'Vas a cerrar la partida con {{found}}/{{total}}. Cuenta para tu racha y te mostramos las palabras que faltan. No se puede deshacer.',
    bodyNone:
      'Vas a cerrar la partida con 0/{{total}}. Cuenta para tu racha igual y te mostramos las {{total}} palabras. No se puede deshacer.',
    keepPlaying: 'Seguir jugando',
    confirm: 'Sí, rendirme',
    closing: 'Cerrando…',
  },
  result: {
    won: '{{total}}/{{total}}: las encontraste todas',
    gaveUp: 'Te rendiste con {{score}}/{{total}}',
    gaveUpDetail: 'Estas son las palabras que faltaban.',
  },
};

export type Resources = typeof es;
