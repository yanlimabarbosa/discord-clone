const MARGIN = 8;
const FALLBACK_WIDTH = 220;
const FALLBACK_HEIGHT = 300;

/**
 * Clamp a menu opened at raw cursor coordinates so it stays fully within the
 * viewport (minus an 8px margin). Flips/shifts left or up when the menu would
 * overflow the right or bottom edge. Assumes the menu is `position: fixed`, so
 * the returned values are viewport coordinates.
 */
export function clampMenuPosition(
  x: number,
  y: number,
  menuEl: HTMLElement | null,
): { left: number; top: number } {
  const width = menuEl?.offsetWidth || FALLBACK_WIDTH;
  const height = menuEl?.offsetHeight || FALLBACK_HEIGHT;

  const maxLeft = window.innerWidth - width - MARGIN;
  const maxTop = window.innerHeight - height - MARGIN;

  const left = Math.max(MARGIN, Math.min(x, maxLeft));
  const top = Math.max(MARGIN, Math.min(y, maxTop));

  return { left, top };
}
