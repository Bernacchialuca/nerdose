import { Badge, Card } from '@nerdose/ui';
import { useTranslation } from 'react-i18next';

export function NextGamePlaceholder() {
  const { t } = useTranslation();
  return (
    <Card variant="placeholder" className="flex-1">
      <p className="font-mono text-mono-body text-text-lede">
        {t('catalog.placeholder.command')}{' '}
        <span className="text-text">{t('catalog.placeholder.branch')}</span>
      </p>
      <p className="font-sans text-body text-text-muted">{t('catalog.placeholder.body')}</p>
      <Badge variant="chip" loose className="self-start">
        {t('catalog.placeholder.chip')}
      </Badge>
    </Card>
  );
}
