/**
 * The two draggable separators in the cockpit (design/layout → the divider is
 * draggable within bounds; the sacrifice order is explicit).
 *
 * Both regions default to a size derived from the viewport rather than a fixed
 * pixel count, and a learner can move either one. The chosen size is remembered
 * on this device only, like every other preference here: it is written to
 * `localStorage` and never leaves the machine.
 *
 * Keyboard operation is not an afterthought. Each handle is a real `separator`
 * with a value, moved by the arrow keys and reset by Home, because a learner who
 * cannot drag still has to be able to give the drug tray more room.
 */

import { useCallback, useEffect, useRef, useState } from 'react';

export interface ResizableRegion {
  /** The current size, or null while the default is in force. */
  readonly size: number | null;
  /** Props to spread onto the separator element. */
  readonly handleProps: {
    readonly role: 'separator';
    readonly tabIndex: 0;
    readonly 'aria-label': string;
    readonly 'aria-orientation': 'horizontal' | 'vertical';
    readonly 'aria-valuenow': number;
    readonly 'aria-valuemin': number;
    readonly 'aria-valuemax': number;
    readonly onPointerDown: (event: React.PointerEvent<HTMLElement>) => void;
    readonly onKeyDown: (event: React.KeyboardEvent<HTMLElement>) => void;
    readonly onDoubleClick: () => void;
  };
  readonly reset: () => void;
}

export interface ResizableOptions {
  readonly storageKey: string;
  readonly label: string;
  /** `row` drags vertically and sizes a height; `column` drags horizontally. */
  readonly axis: 'row' | 'column';
  readonly min: number;
  readonly max: number;
  /** Which direction increases the size as the pointer moves. */
  readonly invert?: boolean;
  /** Pixels moved by one arrow key press. */
  readonly step?: number;
  /** Measured so the handle can report a percentage the learner can reason about. */
  readonly measure: () => number;
}

function read(key: string): number | null {
  try {
    const raw = localStorage.getItem(key);
    if (raw === null) return null;
    const value = Number(raw);
    return Number.isFinite(value) ? value : null;
  } catch { return null; }
}

function write(key: string, value: number | null): void {
  try {
    if (value === null) localStorage.removeItem(key);
    else localStorage.setItem(key, String(value));
  } catch { /* a device that refuses storage still resizes, just not across loads */ }
}

export function useResizableRegion(options: ResizableOptions): ResizableRegion {
  const { storageKey, label, axis, min, max, invert = false, step = 16, measure } = options;
  const [size, setSize] = useState<number | null>(() => read(storageKey));
  const dragging = useRef<{ origin: number; startSize: number } | null>(null);

  // Rounded, because a measured region gives a fractional pixel and a stored
  // preference of 700.796875 is noise in something a person may read.
  const clamp = useCallback(
    (value: number) => Math.round(Math.min(Math.max(value, min), max)),
    [min, max],
  );

  const commit = useCallback((value: number | null) => {
    setSize(value);
    write(storageKey, value);
  }, [storageKey]);

  /**
   * Nudge relative to the CURRENT size, read functionally.
   *
   * Reading `size` from the closure loses presses: hold an arrow key and every
   * press after the first computes from the same stale value, so four presses
   * move the region one step.
   */
  const nudge = useCallback((delta: number) => {
    setSize((current) => {
      const next = clamp((current ?? measure()) + delta);
      write(storageKey, next);
      return next;
    });
  }, [clamp, measure, storageKey]);

  useEffect(() => {
    const onMove = (event: PointerEvent) => {
      const drag = dragging.current;
      if (!drag) return;
      event.preventDefault();
      const position = axis === 'row' ? event.clientY : event.clientX;
      const delta = (position - drag.origin) * (invert ? -1 : 1);
      commit(clamp(drag.startSize + delta));
    };
    const onUp = () => { dragging.current = null; };
    window.addEventListener('pointermove', onMove, { passive: false });
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
    };
  }, [axis, invert, clamp, commit]);

  const onPointerDown = useCallback((event: React.PointerEvent<HTMLElement>) => {
    event.preventDefault();
    dragging.current = {
      origin: axis === 'row' ? event.clientY : event.clientX,
      startSize: size ?? measure(),
    };
  }, [axis, size, measure]);

  const onKeyDown = useCallback((event: React.KeyboardEvent<HTMLElement>) => {
    // The key that makes the region BIGGER, in the direction the learner sees.
    // The action region sits below its handle, so up grows it; the analysis
    // region sits left of its handle, so right grows it.
    const grow = axis === 'row' ? 'ArrowUp' : 'ArrowRight';
    const shrink = axis === 'row' ? 'ArrowDown' : 'ArrowLeft';
    if (event.key === grow) { event.preventDefault(); nudge(step); }
    else if (event.key === shrink) { event.preventDefault(); nudge(-step); }
    else if (event.key === 'Home') { event.preventDefault(); commit(null); }
  }, [axis, step, nudge, commit]);

  return {
    size,
    handleProps: {
      role: 'separator',
      tabIndex: 0,
      'aria-label': `${label}. Drag, or use the arrow keys. Home restores the default.`,
      'aria-orientation': axis === 'row' ? 'horizontal' : 'vertical',
      'aria-valuenow': Math.round(size ?? measure()),
      'aria-valuemin': min,
      'aria-valuemax': max,
      onPointerDown,
      onKeyDown,
      onDoubleClick: () => commit(null),
    },
    reset: () => commit(null),
  };
}
