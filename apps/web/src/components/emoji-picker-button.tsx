import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { Tooltip } from './tooltip';
import { useEscapeKey } from '../hooks/use-escape-key';
import './emoji-picker-button.css';

export const QUICK_EMOJIS = ['👍', '❤️', '😂', '🎉', '😮', '😢', '🔥', '👀'];

type EmojiPickerButtonProps = {
  label: string;
  icon: ReactNode;
  buttonClassName?: string;
  pickerClassName?: string;
  tooltipSide?: 'top' | 'bottom' | 'left' | 'right';
  onPick: (emoji: string) => void;
};

export function EmojiPickerButton({
  label,
  icon,
  buttonClassName,
  pickerClassName,
  tooltipSide,
  onPick,
}: EmojiPickerButtonProps) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEscapeKey(useCallback(() => setOpen(false), []));

  useEffect(() => {
    if (!open) return;
    function onDocMouseDown(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', onDocMouseDown);
    return () => document.removeEventListener('mousedown', onDocMouseDown);
  }, [open]);

  function pick(emoji: string) {
    onPick(emoji);
    setOpen(false);
  }

  return (
    <div className="emoji-picker-wrap" ref={wrapRef}>
      <Tooltip label={label} side={tooltipSide}>
        <button
          type="button"
          className={buttonClassName}
          aria-label={label}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          {icon}
        </button>
      </Tooltip>
      {open && (
        <div className={`emoji-picker${pickerClassName ? ` ${pickerClassName}` : ''}`}>
          {QUICK_EMOJIS.map((emoji) => (
            <button
              key={emoji}
              type="button"
              className="emoji-picker-btn"
              aria-label={`Pick ${emoji}`}
              onClick={() => pick(emoji)}
            >
              {emoji}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
