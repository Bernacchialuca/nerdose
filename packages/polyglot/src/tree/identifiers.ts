export const IDENTIFIER_PATTERN = /^[a-z][a-zA-Z0-9]*$/;

const JS_JAVA_WORDS = `abstract assert boolean break byte case catch char class const continue default do double
else enum export extends false final finally float for function goto if implements import in instanceof
int interface let long native new null package private protected public return short static super switch
synchronized this throw throws transient true try typeof var void volatile while with yield await delete
debugger`;

const GO_WORDS = `chan defer fallthrough func go map range select struct type nil len cap make append copy
panic print println`;

// Names used by the generated `main` of each language: a user identifier must not shadow them.
const PROGRAM_NAMES = 'main fmt args console Math System String Main';

export const RESERVED_IDENTIFIERS: ReadonlySet<string> = new Set(
  `${JS_JAVA_WORDS} ${GO_WORDS} ${PROGRAM_NAMES}`.split(/\s+/),
);

export function assertIdentifier(name: string): void {
  if (!IDENTIFIER_PATTERN.test(name) || RESERVED_IDENTIFIERS.has(name)) {
    throw new Error(`invalid_identifier: ${name}`);
  }
}
