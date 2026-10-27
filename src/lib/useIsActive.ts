import { type RefObject, useEffect, useState } from 'react';

/**
 * True while the element is on screen and the tab is visible. Demos gate their
 * timers on it so nothing ticks for a tile scrolled out of view or a
 * background tab.
 */
export function useIsActive(ref: RefObject<Element | null>): boolean {
  const [inView, setInView] = useState(false);
  const [tabVisible, setTabVisible] = useState(true);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(([entry]) =>
      setInView(entry?.isIntersecting ?? false),
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [ref]);

  useEffect(() => {
    const update = () => setTabVisible(document.visibilityState === 'visible');
    update();
    document.addEventListener('visibilitychange', update);
    return () => document.removeEventListener('visibilitychange', update);
  }, []);

  return inView && tabVisible;
}
