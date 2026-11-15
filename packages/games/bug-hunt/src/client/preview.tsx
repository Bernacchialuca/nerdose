import { useState } from 'react';

import type { CodeLanguage } from '@nerdose/core';
import { Badge } from '@nerdose/ui';

import { BUG_TYPE_LABEL } from '../shared/labels';

import { CodeBlock, type MarkLabel } from './code-block';
import { payloadFix, previewLineMarks } from './marks';
import { parsePayload } from './parse';
import { Statement } from './statement';
import { TestsCard } from './tests-card';
import { translatorFor } from './translate';
import type { PreviewProps } from './types';
import { TypeChip, WhyPanel } from './why-panel';

/**
 * Solution-mode preview for the admin: the full payload only arrives through /api/admin/*, so this
 * must never be mounted in `web`. Read-only; the code is plain text (never loads Shiki). The language
 * tabs are local view state with no effects.
 */
export function Preview({ payload, language }: PreviewProps) {
  const p = parsePayload(payload);
  const t = translatorFor(language);
  const [tab, setTab] = useState<CodeLanguage>('js');
  const markLabel: MarkLabel = () => ({ glyph: '🐛', text: t('preview.bugTag') });

  return (
    <div lang={language} className="flex flex-col gap-4">
      <Statement spec={p.spec[language]} t={t} headingLevel={3} />
      <CodeBlock
        mode="preview"
        name={p.function_name}
        code={p.code}
        initialLanguage="js"
        t={t}
        highlight={false}
        pickable={p.pickable_lines}
        marks={previewLineMarks(p)}
        markLabel={markLabel}
        onLanguageChange={setTab}
      />
      <div className="flex flex-wrap gap-2">
        <TypeChip>{t('result.bugType', { type: BUG_TYPE_LABEL[p.bug_type][language] })}</TypeChip>
        <Badge variant="chip">
          {t('preview.mutation', { from: p.mutation.from, to: p.mutation.to })}
        </Badge>
      </div>
      <TestsCard
        name={p.function_name}
        tests={p.visible_tests}
        t={t}
        headingLevel={3}
        showHidden={false}
      />
      <WhyPanel
        name={p.function_name}
        failing={p.failing_test}
        fixLine={p.bug_line}
        fix={payloadFix(p, tab)}
        language={tab}
        steps={p.explanation.steps.map((s) => s[language])}
        t={t}
        headingLevel={3}
      />
    </div>
  );
}
