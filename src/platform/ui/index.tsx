/**
 * The component inventory (design/design-system → Component Inventory).
 *
 * A screen composes only these. Each carries its default, hover, active, focus
 * and disabled states, and where applicable its error and loading states. The
 * component gallery route renders every one in every state for visual review.
 */

import {
  useCallback, useEffect, useId, useRef, useState,
  type ButtonHTMLAttributes, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes,
} from 'react';
import './components.css';

// --- Button ----------------------------------------------------------------

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  readonly variant?: ButtonVariant;
  readonly compact?: boolean;
}

export function Button({ variant = 'secondary', compact, className, ...rest }: ButtonProps) {
  return (
    <button
      type="button"
      className={['button', variant !== 'secondary' ? `button--${variant}` : '', compact ? 'button--compact' : '', className ?? '']
        .filter(Boolean).join(' ')}
      {...rest}
    />
  );
}

export interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Required: an icon button carries no visible text, so it must be named. */
  readonly label: string;
}

export function IconButton({ label, className, children, ...rest }: IconButtonProps) {
  return (
    <button type="button" aria-label={label} title={label} className={`icon-button ${className ?? ''}`} {...rest}>
      {children}
    </button>
  );
}

// --- Toggle ----------------------------------------------------------------

export interface ToggleProps {
  readonly checked: boolean;
  readonly onChange: (checked: boolean) => void;
  readonly label: ReactNode;
  readonly disabled?: boolean;
  readonly describedBy?: string;
}

export function Toggle({ checked, onChange, label, disabled, describedBy }: ToggleProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-describedby={describedBy}
      aria-disabled={disabled}
      disabled={disabled}
      className="toggle"
      onClick={() => !disabled && onChange(!checked)}
    >
      <span className="toggle__track"><span className="toggle__thumb" /></span>
      <span>{label}</span>
    </button>
  );
}

// --- SegmentedControl -------------------------------------------------------

export interface SegmentedOption<T extends string | number> {
  readonly value: T;
  readonly label: string;
  /** Spoken label where the visible one is an abbreviation. */
  readonly srLabel?: string;
}

export interface SegmentedControlProps<T extends string | number> {
  readonly label: string;
  readonly options: readonly SegmentedOption<T>[];
  readonly value: T;
  readonly onChange: (value: T) => void;
}

export function SegmentedControl<T extends string | number>(
  { label, options, value, onChange }: SegmentedControlProps<T>,
) {
  return (
    <div className="segmented" role="group" aria-label={label}>
      {options.map((option) => (
        <button
          key={String(option.value)}
          type="button"
          className="segmented__option"
          aria-pressed={option.value === value}
          onClick={() => onChange(option.value)}
        >
          <span aria-hidden={option.srLabel !== undefined}>{option.label}</span>
          {option.srLabel !== undefined && <span className="visually-hidden">{option.srLabel}</span>}
        </button>
      ))}
    </div>
  );
}

// --- Slider and SteppedDial --------------------------------------------------

export interface SliderProps {
  readonly label: string;
  readonly value: number;
  readonly min: number;
  readonly max: number;
  readonly step: number;
  readonly unit?: string;
  /** Decimal places to show. Omitted, the raw number is shown. */
  readonly precision?: number;
  readonly onChange: (value: number) => void;
  readonly disabled?: boolean;
}

export function Slider({ label, value, min, max, step, unit, precision, onChange, disabled }: SliderProps) {
  const id = useId();
  // A clinical number keeps its decimal places whatever its value: an inspired
  // oxygen fraction reads 1.00, never 1, so it lines up with the tile beside it.
  const shown = precision === undefined ? String(value) : value.toFixed(precision);
  return (
    <div className="slider">
      <label className="field__label" htmlFor={id}>
        {label} <span className="numeric">{shown}</span>{unit ? ` ${unit}` : ''}
      </label>
      <input
        id={id}
        className="slider__input"
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        disabled={disabled}
        aria-valuetext={`${shown}${unit ? ` ${unit}` : ''}`}
        onChange={(event) => onChange(Number(event.target.value))}
      />
    </div>
  );
}

export interface SteppedDialProps {
  readonly label: string;
  readonly value: number;
  readonly step: number;
  readonly min: number;
  readonly max: number;
  readonly unit?: string;
  readonly precision?: number;
  readonly onChange: (value: number) => void;
}

export function SteppedDial({ label, value, step, min, max, unit, precision = 0, onChange }: SteppedDialProps) {
  const clamp = (next: number) => Math.min(Math.max(Number(next.toFixed(6)), min), max);
  return (
    <div
      className="stepped-dial"
      role="spinbutton"
      aria-label={label}
      aria-valuenow={value}
      aria-valuemin={min}
      aria-valuemax={max}
      aria-valuetext={`${value.toFixed(precision)}${unit ? ` ${unit}` : ''}`}
      tabIndex={0}
      onKeyDown={(event) => {
        if (event.key === 'ArrowUp' || event.key === 'ArrowRight') { onChange(clamp(value + step)); event.preventDefault(); }
        if (event.key === 'ArrowDown' || event.key === 'ArrowLeft') { onChange(clamp(value - step)); event.preventDefault(); }
      }}
    >
      <IconButton label={`Decrease ${label}`} onClick={() => onChange(clamp(value - step))}>−</IconButton>
      <span className="stepped-dial__value">{value.toFixed(precision)}{unit ? <span className="vital-tile__unit"> {unit}</span> : null}</span>
      <IconButton label={`Increase ${label}`} onClick={() => onChange(clamp(value + step))}>+</IconButton>
    </div>
  );
}

// --- NumericField and Select --------------------------------------------------

export interface NumericFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'> {
  readonly label: string;
  readonly value: number | '';
  readonly onValueChange: (value: number | '') => void;
  readonly unit?: string;
  readonly error?: string;
  readonly hint?: string;
}

export function NumericField({ label, value, onValueChange, unit, error, hint, ...rest }: NumericFieldProps) {
  const id = useId();
  const errorId = `${id}-error`;
  const hintId = `${id}-hint`;
  return (
    <div className="field">
      <label className="field__label" htmlFor={id}>{label}{unit ? ` (${unit})` : ''}</label>
      <input
        id={id}
        className="field__input"
        type="number"
        inputMode="decimal"
        value={value}
        aria-invalid={error !== undefined}
        aria-describedby={[error ? errorId : '', hint ? hintId : ''].filter(Boolean).join(' ') || undefined}
        onChange={(event) => onValueChange(event.target.value === '' ? '' : Number(event.target.value))}
        {...rest}
      />
      {hint && <span id={hintId} className="field__hint">{hint}</span>}
      {error && <span id={errorId} className="field__error" role="alert">{error}</span>}
    </div>
  );
}

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  readonly label: string;
  readonly options: readonly { value: string; label: string }[];
}

export function Select({ label, options, ...rest }: SelectProps) {
  const id = useId();
  return (
    <div className="field">
      <label className="field__label" htmlFor={id}>{label}</label>
      <select id={id} className="select" {...rest}>
        {options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
      </select>
    </div>
  );
}

// --- Tabs ---------------------------------------------------------------------

export interface TabDefinition {
  readonly id: string;
  readonly label: string;
  /** Shows an unread indicator without stealing focus. */
  readonly unread?: boolean;
}

export interface TabsProps {
  readonly label: string;
  readonly tabs: readonly TabDefinition[];
  readonly active: string;
  readonly onSelect: (id: string) => void;
}

export function Tabs({ label, tabs, active, onSelect }: TabsProps) {
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const move = (from: number, delta: number) => {
    const next = (from + delta + tabs.length) % tabs.length;
    onSelect(tabs[next]!.id);
    refs.current[next]?.focus();
  };
  return (
    <div className="tabs" role="tablist" aria-label={label}>
      {tabs.map((tab, index) => (
        <button
          key={tab.id}
          ref={(element) => { refs.current[index] = element; }}
          type="button"
          role="tab"
          id={`tab-${tab.id}`}
          aria-selected={tab.id === active}
          aria-controls={`panel-${tab.id}`}
          tabIndex={tab.id === active ? 0 : -1}
          className="tabs__tab"
          onClick={() => onSelect(tab.id)}
          onKeyDown={(event) => {
            if (event.key === 'ArrowRight') { move(index, 1); event.preventDefault(); }
            if (event.key === 'ArrowLeft') { move(index, -1); event.preventDefault(); }
          }}
        >
          {tab.label}
          {tab.unread && (
            <>
              <span className="tabs__unread" aria-hidden="true" />
              <span className="visually-hidden">, has unread entries</span>
            </>
          )}
        </button>
      ))}
    </div>
  );
}

export function TabPanel({ id, active, children }: { id: string; active: string; children: ReactNode }) {
  if (id !== active) return null;
  return (
    <div role="tabpanel" id={`panel-${id}`} aria-labelledby={`tab-${id}`} tabIndex={0}>
      {children}
    </div>
  );
}

// --- Panel, Card, Chip, Badge ---------------------------------------------------

export function Panel({ title, actions, children, className }: {
  title?: ReactNode; actions?: ReactNode; children: ReactNode; className?: string;
}) {
  return (
    <section className={`panel ${className ?? ''}`}>
      {(title || actions) && (
        <header className="panel__header">
          {title && <h2 className="panel__title">{title}</h2>}
          {actions}
        </header>
      )}
      <div className="panel__body">{children}</div>
    </section>
  );
}

export function Card({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={`card ${className ?? ''}`}>{children}</div>;
}

export function Chip({ children }: { children: ReactNode }) {
  return <span className="chip">{children}</span>;
}

export type BadgeKind = 'default' | 'out-of-range' | 'teaching';

export function Badge({ kind = 'default', children }: { kind?: BadgeKind; children: ReactNode }) {
  return <span className={`badge ${kind !== 'default' ? `badge--${kind}` : ''}`}>{children}</span>;
}

// --- Tooltip and Popover ----------------------------------------------------------

/**
 * An abbreviation whose expansion appears on focus or hover, never on hover
 * alone (platform/accessibility → Jargon is explained in place).
 */
export function Abbreviation({ short, expansion, explanation }: {
  short: string; expansion: string; explanation?: string;
}) {
  const id = useId();
  const [open, setOpen] = useState(false);
  return (
    <span style={{ position: 'relative' }}>
      <abbr
        title={expansion}
        aria-describedby={open ? id : undefined}
        tabIndex={0}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
      >
        {short}
      </abbr>
      {open && (
        <span className="tooltip" id={id} role="tooltip">
          <strong>{expansion}</strong>{explanation ? ` — ${explanation}` : ''}
        </span>
      )}
    </span>
  );
}

// --- Modal and Drawer ---------------------------------------------------------------

/**
 * Focus moves into the dialog on open and returns to the invoking control on
 * close, and the dialog is a focus trap while it is open
 * (platform/accessibility → Focus is never lost).
 */
interface DialogLayer {
  readonly node: HTMLElement;
  readonly modal: boolean;
  readonly invokers: readonly (Element | null)[];
}
const dialogLayers: DialogLayer[] = [];

function dialogControls(node: HTMLElement) {
  return [...node.querySelectorAll<HTMLElement>('a[href], button, input, select, textarea, summary, iframe, [tabindex]')]
    .filter((item) => item.tabIndex >= 0 && !item.matches(':disabled')
      && !item.closest('[hidden], [inert], [aria-hidden="true"]')
      && getComputedStyle(item).display !== 'none' && getComputedStyle(item).visibility !== 'hidden');
}

function focusDialog(layer: DialogLayer) {
  (dialogControls(layer.node)[0] ?? layer.node).focus();
}

function useDialogFocus(open: boolean, container: React.RefObject<HTMLElement | null>, modal: boolean,
  onClose: (() => void) | undefined, dismissible = true) {
  const options = useRef({ onClose, dismissible });
  options.current = { onClose, dismissible };
  useEffect(() => {
    if (!open || !container.current) return undefined;
    const node = container.current;
    const previous = dialogLayers.at(-1);
    const layer: DialogLayer = { node, modal, invokers: [document.activeElement, ...(previous?.invokers ?? [])] };
    // Modal surfaces cover drawers. A child dialog remains above its parent
    // even when React mounts the child's effect before the parent's effect.
    const above = dialogLayers.findIndex((entry) => (!modal && entry.modal) || node.contains(entry.node));
    dialogLayers.splice(above < 0 ? dialogLayers.length : above, 0, layer);
    const ownsFocus = () => dialogLayers.at(-1) === layer && node.isConnected;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.defaultPrevented || !ownsFocus()) return;
      if (event.key === 'Escape') {
        event.preventDefault();
        if (options.current.dismissible) options.current.onClose?.();
        return;
      }
      if (event.key !== 'Tab') return;
      if (!modal && !node.contains(document.activeElement)) return;
      const items = dialogControls(node);
      const first = items[0]!;
      const last = items[items.length - 1]!;
      if (!items.length || !node.contains(document.activeElement) || document.activeElement === node) {
        event.preventDefault(); (event.shiftKey ? last ?? node : first ?? node).focus();
      } else if (event.shiftKey && document.activeElement === first) { last.focus(); event.preventDefault(); }
      else if (!event.shiftKey && document.activeElement === last) { first.focus(); event.preventDefault(); }
    };
    const onFocus = (event: FocusEvent) => {
      if (modal && !event.defaultPrevented && ownsFocus() && !node.contains(event.target as Node)) focusDialog(layer);
    };
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('focusin', onFocus);
    if (ownsFocus()) focusDialog(layer);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('focusin', onFocus);
      const wasTop = dialogLayers.at(-1) === layer;
      dialogLayers.splice(dialogLayers.indexOf(layer), 1);
      if (!wasTop) return;
      const next = dialogLayers.filter((entry) => entry.node.isConnected).at(-1);
      for (const invoker of layer.invokers) {
        if (!(invoker instanceof HTMLElement) || !invoker.isConnected || (next?.modal && !next.node.contains(invoker))) continue;
        invoker.focus();
        if (document.activeElement === invoker) return;
      }
      if (next) focusDialog(next);
    };
  }, [open, container, modal]);
}

export interface ModalProps {
  readonly open: boolean;
  readonly title: string;
  readonly onClose?: () => void;
  /** When false the dialog cannot be dismissed, as for the acknowledgement gate. */
  readonly dismissible?: boolean;
  readonly children: ReactNode;
  readonly footer?: ReactNode;
}

export function Modal({ open, title, onClose, dismissible = true, children, footer }: ModalProps) {
  const ref = useRef<HTMLDivElement>(null);
  const titleId = useId();
  useDialogFocus(open, ref, true, onClose, dismissible);

  if (!open) return null;
  return (
    <div className="modal-backdrop">
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby={titleId} tabIndex={-1} ref={ref}>
        <h2 className="panel__title" id={titleId} style={{ marginBlockEnd: 'var(--space-4)' }}>{title}</h2>
        {children}
        {footer && <div style={{ display: 'flex', gap: 'var(--space-3)', justifyContent: 'flex-end', marginBlockStart: 'var(--space-5)' }}>{footer}</div>}
      </div>
    </div>
  );
}

export function Drawer({ open, title, onClose, children }: {
  open: boolean; title: string; onClose: () => void; children: ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const titleId = useId();
  useDialogFocus(open, ref, false, onClose);
  if (!open) return null;
  return (
    <div className="drawer" role="dialog" aria-modal="false" aria-labelledby={titleId} tabIndex={-1} ref={ref}>
      <div className="panel__header" style={{ paddingInline: 0 }}>
        <h2 className="panel__title" id={titleId}>{title}</h2>
        <IconButton label="Close" onClick={onClose}>✕</IconButton>
      </div>
      {children}
    </div>
  );
}

// --- Banner ---------------------------------------------------------------------------

export type BannerKind = 'critical' | 'warning' | 'advisory' | 'neutral';

export function Banner({ kind = 'neutral', children, actions }: {
  kind?: BannerKind; children: ReactNode; actions?: ReactNode;
}) {
  return (
    <div
      className={`banner ${kind !== 'neutral' ? `banner--${kind}` : ''}`}
      role={kind === 'critical' ? 'alert' : 'status'}
    >
      <span className="banner__message">{children}</span>
      {actions}
    </div>
  );
}

// --- EmptyState, LoadingState, CitationLink ----------------------------------------------

export function EmptyState({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="empty-state">
      <span className="empty-state__title">{title}</span>
      {children}
    </div>
  );
}

export function LoadingState({ label }: { label: string }) {
  return <div className="loading-state" role="status" aria-live="polite">{label}…</div>;
}

export function CitationLink({ href, children }: { href?: string; children: ReactNode }) {
  if (!href) return <span className="citation-link">{children}</span>;
  return (
    <a className="citation-link" href={href} rel="noreferrer noopener" target="_blank">
      {children}
      <span className="visually-hidden"> (opens in a new tab)</span>
    </a>
  );
}

// --- Timeline ------------------------------------------------------------------------------

export interface TimelineMark {
  readonly tick: number;
  readonly severity: 'info' | 'advisory' | 'warning' | 'critical' | 'artifact';
  readonly label: string;
}

export function Timeline({ marks, totalTicks, onSelect }: {
  marks: readonly TimelineMark[]; totalTicks: number; onSelect?: (tick: number) => void;
}) {
  return (
    <div className="timeline" role="group" aria-label="Session timeline">
      <span className="timeline__track" />
      {marks.map((mark) => (
        <button
          key={`${mark.tick}-${mark.label}`}
          type="button"
          className="timeline__mark"
          data-severity={mark.severity}
          style={{ insetInlineStart: `${Math.min((mark.tick / Math.max(totalTicks, 1)) * 100, 100)}%` }}
          aria-label={`${mark.label} at tick ${mark.tick}`}
          onClick={() => onSelect?.(mark.tick)}
        />
      ))}
    </div>
  );
}

/** A small hook for the reduced-motion preference, used by the renderer and the hero. */
export function usePrefersReducedMotion(): boolean {
  // Starts false on the server AND on the first client render, so the two agree
  // and hydration succeeds; the real preference arrives in the effect below.
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    if (typeof matchMedia !== 'function') return undefined;
    setReduced(matchMedia('(prefers-reduced-motion: reduce)').matches);
    const query = matchMedia('(prefers-reduced-motion: reduce)');
    const listener = () => setReduced(query.matches);
    query.addEventListener('change', listener);
    return () => query.removeEventListener('change', listener);
  }, []);
  return reduced;
}

/** Persist a preference on this device only. Nothing leaves it. */
/**
 * A preference stored on this device only.
 *
 * The stored value is CHECKED against the shape of the default before it is
 * used. Local storage is writable by anything the learner runs — an extension,
 * a console paste, a half-finished write from an older build — and a preference
 * that came back as the wrong type used to reach the component and take the
 * whole simulator down with it. A value that does not match is discarded and the
 * default is used, silently, because there is nothing a learner could do about
 * it and nothing worth interrupting them for.
 *
 * `validate` is for the cases a type check cannot cover, such as an identifier
 * that has to exist in a registry.
 */
export function useLocalPreference<T>(
  key: string,
  initial: T,
  validate?: (candidate: unknown) => candidate is T,
): [T, (value: T) => void] {
  const [value, setValue] = useState<T>(() => {
    try {
      const stored = localStorage.getItem(`opensimlab.${key}`);
      if (stored === null) return initial;
      const parsed: unknown = JSON.parse(stored);
      if (validate) return validate(parsed) ? parsed : initial;
      // With no validator, the default's own shape is the contract. A null
      // default declares nothing, so anything is allowed through and the caller
      // is responsible — which is why the callers that do that pass a validator.
      if (initial === null || initial === undefined) return parsed as T;
      if (Array.isArray(initial) !== Array.isArray(parsed)) return initial;
      if (typeof parsed !== typeof initial) return initial;
      return parsed as T;
    } catch {
      return initial;
    }
  });
  const update = useCallback((next: T) => {
    setValue(next);
    try { localStorage.setItem(`opensimlab.${key}`, JSON.stringify(next)); } catch { /* storage may be full or blocked */ }
  }, [key]);
  return [value, update];
}

export { SiteBar, SITE_BAR_LINKS, type SiteBarLink, type SiteBarProps } from './SiteBar';
