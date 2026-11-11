import { useEffect, useRef } from 'react';

/** Fija `document.title` y, salvo `focusHeading: false`, enfoca el `<h1>` al montar. */
export function usePageTitle(title: string, { focusHeading = true } = {}) {
  const headingRef = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    document.title = title;
    if (focusHeading) headingRef.current?.focus();
  }, [title, focusHeading]);
  return headingRef;
}
