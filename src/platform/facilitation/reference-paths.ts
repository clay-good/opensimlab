/**
 * The reference transcripts, normalised for the facilitator guide
 * (learning/facilitation → facilitator guide).
 *
 * Every lesson already ships three checked-in paths through itself: what an
 * expert does, the error the lesson exists to make visible, and the recovery
 * from it. They are what the guide's "Expected actions" and "Common error and
 * recovery" sections were always meant to read, and they were absent from all
 * 256 guides because the fixtures are not written in one shape.
 *
 * Every fixture file exports exactly one object carrying `scenarioId`,
 * `expert`, `commonError` and `recovery`. The three paths hold one of two
 * element shapes:
 *
 * - 217 lessons use `[tick, stepId]`, where the step id is the tray control the
 *   learner presses.
 * - 39 anaesthesia lessons use `{ tick, type, payload }`, the engine action
 *   itself, because that module's trays send doses rather than named steps.
 *
 * Both normalise to a tick and a label, with the engine action's payload kept
 * as detail. The payload is authored scenario data — a dose an author wrote —
 * so printing it does not breach the guide's rule that the only prose this
 * module owns is its fixed templates.
 *
 * Nothing here interprets a path. It does not say an action was correct, or
 * compare the error path to the expert one: the guide shows a facilitator what
 * the reference transcripts do, and the facilitator reads them.
 */

export interface ReferenceStep {
  readonly tick: number;
  /** The tray step the learner presses, or the engine action the module sends. */
  readonly label: string;
  /** The action's authored payload, where the module sends one. */
  readonly detail?: string;
}

export interface ReferencePaths {
  readonly moduleId: string;
  readonly scenarioId: string;
  readonly expert: readonly ReferenceStep[];
  readonly commonError: readonly ReferenceStep[];
  readonly recovery: readonly ReferenceStep[];
}

/** `{ doseMg: 1, route: 'iv' }` becomes `doseMg 1, route iv`. */
export function formatPayload(payload: unknown): string | undefined {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) return undefined;
  const parts = Object.entries(payload as Record<string, unknown>)
    .filter(([, value]) => value !== undefined)
    .map(([key, value]) => `${key} ${typeof value === 'object' ? JSON.stringify(value) : String(value)}`);
  return parts.length === 0 ? undefined : parts.join(', ');
}

/** An engine action's type and payload, as a step at a given tick. */
function actionStep(tick: number, dispatch: unknown): ReferenceStep | undefined {
  if (!dispatch || typeof dispatch !== 'object') return undefined;
  const { type, payload } = dispatch as { type?: unknown; payload?: unknown };
  if (typeof type !== 'string') return undefined;
  const detail = formatPayload(payload);
  return detail === undefined ? { tick, label: type } : { tick, label: type, detail };
}

/**
 * One fixture element, in any of the three shapes the catalogue uses.
 *
 * `[tick, stepId]` is the common one. Anaesthesia sends whole actions,
 * `{ tick, type, payload }`. And one lesson, emergency medicine's tension
 * pneumothorax, writes `[tick, { type, payload }]` — it dispatches an action
 * but keeps the tick outside it, because its own helper does. Reading only the
 * first two shapes left that lesson's guide with both sections absent while the
 * other 255 filled, which is the kind of gap only a count notices.
 */
export function referenceStep(entry: unknown): ReferenceStep | undefined {
  if (Array.isArray(entry)) {
    const [tick, second] = entry as [unknown, unknown];
    if (typeof tick !== 'number') return undefined;
    return typeof second === 'string' ? { tick, label: second } : actionStep(tick, second);
  }
  if (!entry || typeof entry !== 'object') return undefined;
  const { tick } = entry as { tick?: unknown };
  return typeof tick === 'number' ? actionStep(tick, entry) : undefined;
}

/** Every element of a path, in the order the fixture records them. */
export function referencePath(entries: readonly unknown[]): readonly ReferenceStep[] {
  return entries.flatMap((entry) => referenceStep(entry) ?? []);
}
