import { useEffect } from 'react';
import { Outlet } from 'react-router';

const DOCUMENT_TITLE = 'Admin · nerdose';

export function Shell() {
  useEffect(() => {
    document.title = DOCUMENT_TITLE;
  }, []);

  return (
    <div className="min-h-dvh bg-bg font-mono text-text">
      <header className="px-4 py-4 lg:px-12">
        <span className="text-accent">
          <span aria-hidden="true">&gt; </span>
          nerdose
        </span>
      </header>
      <main className="px-4 lg:px-12">
        <h1 className="text-xl font-bold">Admin</h1>
        <Outlet />
      </main>
    </div>
  );
}
