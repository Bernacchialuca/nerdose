import { Banner } from '@nerdose/ui';

import { LANGUAGE_LABEL, OPTION_LABEL } from '../shared/labels';

import { CodeBlock } from './code-block';
import { Explanation } from './explanation';
import { resultMarks } from './options';
import { parsePublicView, parseResult } from './parse';
import { Question } from './question';
import { ResultOptions } from './result-options';
import type { ResultProps } from './types';

export function Result({ t, locale, notices, result, publicView, aside, footer }: ResultProps) {
  const r = parseResult(result);
  const view = publicView == null ? null : parsePublicView(publicView);
  const answer = OPTION_LABEL[r.answer];
  const language = LANGUAGE_LABEL[r.code_language];

  // Two real columns: main (question, code, your answer, closing card) and side (explanation,
  // report). In mobile the main one comes first, then the side one.
  return (
    <div className="flex flex-col gap-6">
      <Banner
        variant={r.win ? 'success' : 'failure'}
        titleAs="h1"
        title={r.win ? t('result.won', { answer }) : t('result.lost', { answer })}
      >
        {r.win
          ? t('result.wonDetail', { answer, language })
          : t('result.lostDetail', { chosen: OPTION_LABEL[r.chosen_option], language })}
      </Banner>
      {notices}
      <div className="flex flex-col gap-6 lg:grid lg:grid-cols-12 lg:items-start">
        <div className="flex min-w-0 flex-col gap-4 lg:col-span-7">
          {view ? (
            <>
              <Question t={t} as="h2" />
              <CodeBlock
                code={view.code}
                initialLanguage={r.code_language}
                t={t}
                notes={r.explanation.line_notes}
              />
            </>
          ) : null}
          <ResultOptions
            marks={resultMarks(r)}
            title={t('result.optionsTitle', { language })}
            headingLevel={2}
            t={t}
          />
          {footer ? <div className="mt-2 min-w-0">{footer}</div> : null}
        </div>
        <div className="flex min-w-0 flex-col gap-6 lg:col-span-5">
          <Explanation
            steps={r.explanation.steps}
            tip={r.explanation.tip}
            example={r.explanation.example}
            trapLabel={r.trap_option === null ? null : OPTION_LABEL[r.trap_option]}
            locale={locale}
            t={t}
            headingLevel={2}
          />
          {aside}
        </div>
      </div>
    </div>
  );
}
