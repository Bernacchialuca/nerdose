import type { CodeLanguage } from '@nerdose/core';

export type HighlightToken = { content: string; color: string | null };
export type Tokenizer = (code: string, language: CodeLanguage) => HighlightToken[][];

const GRAMMAR: Record<CodeLanguage, string> = { js: 'javascript', go: 'go', java: 'java' };

let pending: Promise<Tokenizer> | null = null;

async function build(): Promise<Tokenizer> {
  // Dynamic imports only: this keeps Shiki in the game's own chunk and out of the admin.
  const [{ createHighlighterCore, createCssVariablesTheme }, { createJavaScriptRegexEngine }] =
    await Promise.all([import('shiki/core'), import('shiki/engine/javascript')]);
  const theme = createCssVariablesTheme({
    name: 'nerdose-big-o',
    variablePrefix: '--shiki-',
    fontStyle: false,
  });
  const highlighter = await createHighlighterCore({
    themes: [theme],
    langs: [
      import('shiki/langs/javascript.mjs'),
      import('shiki/langs/go.mjs'),
      import('shiki/langs/java.mjs'),
    ],
    engine: createJavaScriptRegexEngine(),
  });
  return (code, language) =>
    highlighter
      .codeToTokensBase(code, { lang: GRAMMAR[language], theme: 'nerdose-big-o' })
      .map((line) => line.map((t) => ({ content: t.content, color: t.color ?? null })));
}

/** Memoised; a rejection clears the memo so a later mount retries (D11). */
export function loadTokenizer(): Promise<Tokenizer> {
  if (!pending) {
    pending = build().catch((error: unknown) => {
      pending = null;
      throw error;
    });
  }
  return pending;
}
