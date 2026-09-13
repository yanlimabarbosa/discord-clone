import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type FocusEvent,
  type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';
import './tooltip.css';

type TooltipSide = 'top' | 'bottom' | 'left' | 'right';

type TooltipProps = {
  label: string;
  side?: TooltipSide;
  children: ReactNode;
};

const SHOW_DELAY = 80;
const GAP = 8;
const EDGE = 6;

export function Tooltip({ label, side = 'top', children }: TooltipProps) {
  const anchorRef = useRef<HTMLSpanElement>(null);
  const tipRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<number>();
  const [visible, setVisible] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0 });

  function show() {
    window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => setVisible(true), SHOW_DELAY);
  }

  function hide() {
    window.clearTimeout(timerRef.current);
    setVisible(false);
  }

  function onFocus(e: FocusEvent<HTMLSpanElement>) {
    if (e.target.matches(':focus-visible')) show();
  }

  useEffect(() => () => window.clearTimeout(timerRef.current), []);

  useLayoutEffect(() => {
    if (!visible) return;
    const anchor = anchorRef.current;
    const tip = tipRef.current;
    if (!anchor || !tip) return;
    // Absolutely-positioned children escape the wrapper's box, so measure
    // the real child instead of the (possibly zero-size) wrapper span.
    const a = (anchor.firstElementChild ?? anchor).getBoundingClientRect();
    const t = tip.getBoundingClientRect();
    let top: number;
    let left: number;
    if (side === 'top') {
      top = a.top - t.height - GAP;
      left = a.left + a.width / 2 - t.width / 2;
    } else if (side === 'bottom') {
      top = a.bottom + GAP;
      left = a.left + a.width / 2 - t.width / 2;
    } else if (side === 'right') {
      top = a.top + a.height / 2 - t.height / 2;
      left = a.right + GAP;
    } else {
      top = a.top + a.height / 2 - t.height / 2;
      left = a.left - t.width - GAP;
    }
    left = Math.min(Math.max(left, EDGE), window.innerWidth - t.width - EDGE);
    top = Math.min(Math.max(top, EDGE), window.innerHeight - t.height - EDGE);
    setPos({ top, left });
  }, [visible, side, label]);

  return (
    <span
      ref={anchorRef}
      className="ui-tooltip-anchor"
      onMouseEnter={show}
      onMouseLeave={hide}
      onMouseDown={hide}
      onFocus={onFocus}
      onBlur={hide}
    >
      {children}
      {visible &&
        createPortal(
          <div
            ref={tipRef}
            className={`ui-tooltip ui-tooltip-${side}`}
            style={{ top: pos.top, left: pos.left }}
            role="tooltip"
          >
            {label}
          </div>,
          document.body,
        )}
    </span>
  );
}
