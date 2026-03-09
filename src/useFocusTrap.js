import { useEffect } from 'react';

export function useFocusTrap(active, containerRef) {
  useEffect(() => {
    if (!active || !containerRef?.current) return;
    const container = containerRef.current;
    const focusableSelectors = [
      'a[href]', 'area[href]', 'input:not([disabled])', 'select:not([disabled])',
      'textarea:not([disabled])', 'button:not([disabled])', '[tabindex]:not([tabindex="-1"])', '[contenteditable]',
    ];
    const getFocusable = () => Array.from(container.querySelectorAll(focusableSelectors.join(',')));
    const focusables = getFocusable();
    const first = focusables[0];
    const prevActive = document.activeElement;
    if (first) first.focus();
    const onKeyDown = e => {
      if (e.key !== 'Tab') return;
      const list = getFocusable();
      if (list.length === 0) return;
      const firstEl = list[0];
      const lastEl = list[list.length - 1];
      if (e.shiftKey) {
        if (document.activeElement === firstEl) { e.preventDefault(); lastEl.focus(); }
      } else {
        if (document.activeElement === lastEl) { e.preventDefault(); firstEl.focus(); }
      }
    };
    container.addEventListener('keydown', onKeyDown);
    return () => {
      container.removeEventListener('keydown', onKeyDown);
      if (prevActive?.focus) prevActive.focus();
    };
  }, [active, containerRef]);
}
