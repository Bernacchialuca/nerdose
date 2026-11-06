import { Card } from '@nerdose/ui';
import { useTranslation } from 'react-i18next';

const TONES = ['brand', 'bug-hunt', 'big-o', 'timeline'] as const;
const STEPS = ['1', '2', '3', '4'] as const;

export function HowItWorks() {
  const { t } = useTranslation();
  return (
    <section id="como" aria-labelledby="como-title" className="flex flex-col gap-5.5">
      <h2 id="como-title" tabIndex={-1} className="font-mono text-title-section text-text">
        {t('catalog.how.title')}
      </h2>
      <ol className="grid grid-cols-[repeat(auto-fit,minmax(min(240px,100%),1fr))] gap-4">
        {STEPS.map((n, i) => (
          <li key={n} className="flex">
            <Card
              variant="step"
              kicker={t(`catalog.how.steps.${n}.kicker`)}
              tone={TONES[i]}
              className="flex-1"
            >
              {t(`catalog.how.steps.${n}.body`)}
            </Card>
          </li>
        ))}
      </ol>
    </section>
  );
}
