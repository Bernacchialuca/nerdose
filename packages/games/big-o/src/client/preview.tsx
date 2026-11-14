import { OPTION_LABEL } from '../shared/labels';

import { CodeBlock } from './code-block';
import { Explanation } from './explanation';
import { previewMarks } from './options';
import { parsePayload } from './parse';
import { Question } from './question';
import { ResultOptions } from './result-options';
import { translatorFor } from './translate';
import type { PreviewProps } from './types';

/**
 * Solution-mode preview for the admin: the full payload only arrives through /api/admin/*, so this
 * must never be mounted in `web`. Read-only; the code is plain text (never loads Shiki). The language
 * tabs are local view state with no effects (D8).
 */
export function Preview({ payload, language }: PreviewProps) {
  const p = parsePayload(payload);
  const t = translatorFor(language);
  return (
    <div lang={language} className="flex flex-col gap-4">
      <Question t={t} as="p" />
      <CodeBlock
        code={p.code}
        initialLanguage="js"
        t={t}
        highlight={false}
        notes={p.explanation.line_notes.map((n) => ({ line: n.line, text: n.text[language] }))}
      />
      <ResultOptions
        marks={previewMarks(p)}
        title={t('preview.optionsTitle')}
        headingLevel={3}
        t={t}
      />
      <Explanation
        steps={p.explanation.steps.map((s) => s[language])}
        tip={p.explanation.tip ? p.explanation.tip[language] : null}
        example={p.explanation.example}
        trapLabel={p.trap_option === null ? null : OPTION_LABEL[p.trap_option]}
        locale={language}
        t={t}
        headingLevel={3}
      />
    </div>
  );
}
