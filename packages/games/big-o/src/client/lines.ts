export const codeLines = (code: string): string[] => code.split('\n');

export const notesByLine = (
  notes: readonly { line: number; text: string }[],
): Map<number, string> => new Map(notes.map((n) => [n.line, n.text]));
