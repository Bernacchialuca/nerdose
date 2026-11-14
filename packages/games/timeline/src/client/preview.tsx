import { payloadSchema } from '../definition/schemas';

import { Rail } from './rail';
import { SectionPanel } from './section-panel';
import { translatorFor } from './translate';
import type { PreviewProps } from './types';

/**
 * Solution-mode preview for the admin: the full payload only arrives through
 * /api/admin/*, so this must never be mounted in `web`. Read-only, no effects.
 */
export function Preview({ payload, language }: PreviewProps) {
  const p = payloadSchema.parse(payload);
  const t = translatorFor(language);
  const items = p.correct_order.map((id) => {
    const item = p.items.find((i) => i.opaque_id === id);
    if (!item) throw new Error(`correct_order references unknown opaque_id: ${id}`);
    return {
      opaque_id: item.opaque_id,
      label: item.label,
      category: item.category,
      event_date: item.event_date,
      date_precision: item.date_precision,
      note: item.note[language],
    };
  });
  return (
    <div lang={language} className="flex flex-col gap-4">
      <p className="font-mono text-label-comment text-text-dim">
        {`// ${t('preview.prompt', { prompt: p.prompt[language] })}`}
      </p>
      <SectionPanel title={t('result.correctOrder')} headingLevel={3}>
        <Rail items={items} locale={language} t={t} />
      </SectionPanel>
    </div>
  );
}
