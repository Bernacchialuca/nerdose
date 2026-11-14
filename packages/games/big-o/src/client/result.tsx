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

  // DOM in mobile order (question/code/options, explanation, closing card, aside); the desktop
  // arrangement is placed with `lg:` classes. When the player wins there is no banner: the host
  // throws confetti and the `h1` stays for screen readers.
  return (
    <div className="flex flex-col gap-6">
      {r.win ? (
        <h1 className="sr-only">{t('result.won', { answer })}</h1>
      ) : (
        <Banner variant="failure" titleAs="h1" title={t('result.lost', { answer })}>
          {t('result.lostDetail', { chosen: OPTION_LABEL[r.chosen_option], language })}
        </Banner>
      )}
      {notices}
      <div className="flex flex-col gap-6 lg:grid lg:grid-cols-12 lg:items-start">
        <div className="flex min-w-0 flex-col gap-4 lg:col-span-7 lg:col-start-1 lg:row-start-1">
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
        </div>
        <div className="min-w-0 lg:col-span-5 lg:col-start-8 lg:row-span-2 lg:row-start-1">
          <Explanation
            steps={r.explanation.steps}
            tip={r.explanation.tip}
            example={r.explanation.example}
            trapLabel={r.trap_option === null ? null : OPTION_LABEL[r.trap_option]}
            locale={locale}
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
