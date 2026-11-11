import { NavLink, Outlet } from 'react-router';

import { AppHeader, BrandMark, navItemClass } from '@nerdose/ui';

import { useAuth } from '@/modules/auth';
import { useReportGroups } from '@/modules/reports';

export function Shell() {
  const { signOut } = useAuth();
  const open = useReportGroups('open');
  const count = open.data?.groups.length;
  return (
    <div className="min-h-dvh bg-bg font-mono text-text">
      <AppHeader
        brand={<BrandMark label="nerdose admin" />}
        nav={
          <nav aria-label="Secciones" className="flex flex-wrap items-center gap-2">
            <NavLink to="/reports" className={({ isActive }) => navItemClass({ active: isActive })}>
              Reportes
              {count === undefined ? null : (
                <>
                  <span aria-hidden="true">&nbsp;({count})</span>
                  <span className="sr-only">
                    , {count} {count === 1 ? 'grupo' : 'grupos'} de reportes abiertos
                  </span>
                </>
              )}
            </NavLink>
            <button type="button" onClick={signOut} className={navItemClass({ active: false })}>
              Cerrar sesión
            </button>
          </nav>
        }
      />
      <main className="mx-auto flex max-w-page flex-col gap-6 px-4 py-8 lg:px-12">
        <Outlet />
      </main>
    </div>
  );
}
