import type { MoveContext } from '@nerdose/core';

import type { DevdlePayload } from './schemas';

export const PAYLOAD_REACT: DevdlePayload = {
  term_id: '0b7e6f1c-3a52-4c1e-9f0a-1d2e3f4a5b6c',
  word: 'REACT',
  category: 'programming_languages',
  definition: {
    es: 'biblioteca de JavaScript para construir interfaces de usuario',
    en: 'JavaScript library for building user interfaces',
  },
  summary: {
    es: 'React es una biblioteca de código abierto mantenida por Meta.',
    en: 'React is a free and open-source front-end JavaScript library maintained by Meta.',
  },
  date: '2026-12-02',
};

export const PAYLOAD_MERGE: DevdlePayload = {
  term_id: '7c1d2e3f-4a5b-4c6d-8e9f-0a1b2c3d4e5f',
  word: 'MERGE',
  category: 'git',
  definition: {
    es: 'combinar dos ramas de un repositorio',
    en: 'combining two branches of a repository',
  },
  summary: {
    es: 'En Git, merge integra los cambios de una rama en otra.',
    en: 'In Git, merge integrates changes from one branch into another.',
  },
  date: '2026-12-03',
};

export const ALL_VALID: MoveContext = { isValidWord: () => true };
export const NONE_VALID: MoveContext = { isValidWord: () => false };
export const NOW = new Date('2026-12-02T10:00:00.000Z');
