import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';

import { Panel, buttonClass } from '@nerdose/ui';

/** Invitación a jugar: jugador nuevo, o sin sesión (acceso deshabilitado, sin acción). */
export function StatsInvitation({ noSession }: { noSession: boolean }) {
  const { t } = useTranslation();
  const cta = (
    <>
      {t('stats.invitation.cta')} <span aria-hidden="true">→</span>
    </>
  );
  return (
    <Panel title={t(noSession ? 'stats.invitation.noSessionTitle' : 'stats.invitation.title')}>
      <p className="font-sans text-body-sm text-text-muted">
        {t(noSession ? 'stats.invitation.noSessionBody' : 'stats.invitation.body')}
      </p>
      <div>
        {noSession ? (
          <button
            type="button"
            aria-disabled="true"
            className={buttonClass({ variant: 'primary', size: 'md', disabled: true })}
          >
            {cta}
          </button>
        ) : (
          <Link to="/" className={buttonClass({ variant: 'primary', size: 'md' })}>
            {cta}
          </Link>
        )}
      </div>
    </Panel>
  );
}
