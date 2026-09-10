/**
 * The two small pieces every lesson tray renders, shared so a tray can live in its module.
 *
 * `TutorPanel` and `WatchingNotice` were defined inside `ActionCockpit.tsx`, which meant a tray
 * could not be moved out of that file without either duplicating them or importing the cockpit
 * back. Both are a handful of elements with no cockpit state, so they move here and the trays
 * that leave take an import rather than a copy.
 */

/** The observed-state tutor's one suggestion, or nothing at all when it has none. */
export function TutorPanel({ prompt }: {
  readonly prompt: { readonly suggestion: string; readonly because: string } | null | undefined;
}) {
  if (!prompt) return null;
  return (
    <aside className="syringe" aria-label="Private tutor">
      <div className="syringe__name">A moment to think</div>
      <p className="syringe__remaining">{prompt.suggestion}</p>
      <p className="syringe__remaining">{prompt.because}</p>
    </aside>
  );
}

/** Said once, while a worked example drives the ordinary controls. */
export function WatchingNotice({ demonstrating }: { readonly demonstrating?: boolean }) {
  if (!demonstrating) return null;
  return (
    <p className="field__hint" role="status">
      Watching the worked example. The controls stay visible and do not respond.
    </p>
  );
}
