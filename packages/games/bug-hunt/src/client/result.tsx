import { useState } from 'react';

import type { CodeLanguage } from '@nerdose/core';
import { Banner } from '@nerdose/ui';

import { BUG_TYPE_LABEL, LANGUAGE_LABEL } from '../shared/labels';

import { CodeBlock, type MarkLabel } from './code-block';
import { resultLineMarks } from './marks';
import { parsePublicView, parseResult } from './parse';
import { Question } from './question';
import { Statement } from './statement';
import type { ResultProps } from './types';
import { TypeChip, WhyPanel } from './why-panel';

export function Result({ t, locale, notices, result, publicView, aside, footer }: ResultProps) {
  const r = parseResult(result);
  const view = publicView == null ? null : parsePublicView(publicView);
  const [language, setLanguage] = useState<CodeLanguage>(r.code_language);
  // Without the public view there are no tabs: the fix stays in the language the player confirmed in.
  const fixLanguage = view ? language : r.code_language;

  const markLabel: MarkLabel = (mark) =>
    mark === 'found'
      ? { glyph: '✓', text: t('result.tag.found') }
      : mark === 'bug'
        ? { glyph: '🐛', text: t('result.tag.found') }
        : { glyph: '✗', text: t('result.tag.wrong') };

  // DOM in mobile order (question/code, explanation, closing card, aside); the desktop arrangement is
  // placed with `lg:` classes. When the player wins there is no banner: the host throws confetti and the
  // `h1` stays for screen readers.
  return (
    <div className="flex flex-col gap-6">
      {r.win ? (
        <h1 className="sr-only">{t('result.won', { line: r.bug_line })}</h1>
      ) : (
        <Banner
          variant="failure"
          titleAs="h1"
          title={t('result.lost', { bug: r.bug_line, chosen: r.chosen_line })}
        >
          {t('result.lostDetail', {
            chosen: r.chosen_line,
            language: LANGUAGE_LABEL[r.code_language],
          })}
        </Banner>
      )}
      {notices}
      <div className="flex flex-col gap-6 lg:grid lg:grid-cols-12 lg:items-start">
        {view ? (
          <div className="flex min-w-0 flex-col gap-4 lg:col-span-7 lg:col-start-1 lg:row-start-1">
            <Question t={t} as="h2" />
            <Statement spec={view.spec} t={t} headingLevel={null} />
            <CodeBlock
              mode="result"
              name={r.function_name}
              code={view.code}
              initialLanguage={r.code_language}
              t={t}
              pickable={view.pickable_lines}
              marks={resultLineMarks(r)}
              markLabel={markLabel}
              onLanguageChange={setLanguage}
            />
          </div>
        ) : null}
        <div className="min-w-0 lg:col-span-5 lg:col-start-8 lg:row-span-2 lg:row-start-1">
          <WhyPanel
            name={r.function_name}
            failing={r.failing_test}
            fixLine={r.bug_line}
            fix={r.fix[fixLanguage]}
            language={fixLanguage}
            steps={r.explanation.steps}
            chips={
              <TypeChip>
                {t('result.bugType', { type: BUG_TYPE_LABEL[r.bug_type][locale] })}
              </TypeChip>
            }
            t={t}
            headingLevel={2}
          />
        </div>
        {footer ? (
          <div className="min-w-0 lg:col-span-7 lg:col-start-1 lg:row-start-2">{footer}</div>
        ) : null}
        {aside ? (
          <div className="min-w-0 lg:col-span-5 lg:col-start-8 lg:row-start-3">{aside}</div>
        ) : null}
      </div>
    </div>
  );
}
