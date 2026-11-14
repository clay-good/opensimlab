/**
 * The run sheet: a scenario written for someone running it away from this
 * simulator (learning/facilitation → run sheet).
 *
 * A facilitator with a mannequin, a room of students and no screen still needs
 * what the lesson is: the states it moves through, what each one looks like,
 * what a learner is expected to do, and what may not be claimed about any of
 * it. That is all already authored — the timeline is the state model and the
 * checked-in expert transcript is the expected actions — so the sheet is a view
 * of the scenario, never a second copy of it that can drift.
 *
 * It is emitted as plain text and as JSON carrying the same fields, and in no
 * vendor format: none is open, and producing one would imply this content is a
 * validated mannequin scenario, which it is not.
 *
 * WHAT IT DOES NOT YET CARRY. The design asks that a closed-loop lesson's
 * states also show the vitals the engine produces at each event under the
 * expert transcript. That needs the engine run at build time for the 39
 * anaesthesia lessons, and is not done; `vitalsNote` says so on every sheet
 * rather than leaving a facilitator to assume the absence means the lesson has
 * no vitals. The other 217 lessons are state-transition and carry their
 * observations in the authored text of each state, where they already are.
 */
import type { Scenario } from '@anesthesia/scenarios/types';
import { NOT_FOR_CLINICAL_USE, NOT_CLINICALLY_REVIEWED } from '@platform/transcript/transcript';
import { MATURITY_LABELS } from '@platform/governance/publication';
import type { ReferenceStep } from './reference-paths';

/** One authored state of the scenario, in the order the timeline declares it. */
export interface RunSheetState {
  readonly id: string;
  /** `At start`, `Tick 1300`, or the condition the event fires on. */
  readonly at: string;
  readonly severity: string;
  /** The authored narration of this state, or the event's own type and target. */
  readonly text: string;
}

/** One step of the checked-in expert transcript. */
export interface RunSheetAction {
  readonly at: string;
  readonly action: string;
  readonly detail?: string;
}

export interface RunSheet {
  readonly moduleId: string;
  readonly scenarioId: string;
  readonly title: string;
  readonly contentVersion: string;
  readonly maturity: string;
  readonly licence: string;
  readonly estimatedMinutes: number;
  readonly objectives: readonly string[];
  readonly states: readonly RunSheetState[];
  readonly expectedActions: readonly RunSheetAction[];
  readonly sources: readonly string[];
  readonly notForClinicalUse: string;
  readonly notClinicallyReviewed: string;
  /** Why no engine-sampled vitals appear, so absence is never read as "none". */
  readonly vitalsNote: string;
}

export const RUN_SHEET_VITALS_NOTE =
  'This sheet carries no engine-sampled vital signs. Any observations below are the lesson\'s '
  + 'own authored text. Sampling a closed-loop lesson\'s modelled vitals at each event under the '
  + 'expert transcript is designed and not built.';

export const RUN_SHEET_EXPECTED_ACTIONS_NOTE =
  'The expected actions are one checked-in reference transcript through this lesson. They are '
  + 'not a mark scheme, not the only safe way through, and not a prediction about your group.';

/** `At start`, `Tick 1300`, the firing condition, or that nothing schedules it. */
function timingOf(event: { readonly atTick?: number; readonly when?: string }): string {
  if (event.atTick !== undefined) return event.atTick === 0 ? 'At start' : `Tick ${event.atTick}`;
  if (event.when !== undefined) return `When ${event.when}`;
  return 'Unscheduled';
}

export function buildRunSheet(
  moduleId: string,
  scenario: Scenario,
  expert: readonly ReferenceStep[],
): RunSheet {
  const { metadata } = scenario;
  return {
    moduleId,
    scenarioId: metadata.id,
    title: metadata.title,
    contentVersion: metadata.version,
    maturity: MATURITY_LABELS[metadata.maturity],
    licence: metadata.license,
    estimatedMinutes: metadata.estimatedMinutes,
    objectives: metadata.objectives.map((objective) => objective.statement),
    states: scenario.timeline.map((event) => ({
      id: event.id,
      at: timingOf(event),
      severity: event.severity ?? 'info',
      text: event.message ?? `${event.type}${event.target === undefined ? '' : `: ${event.target}`}`,
    })),
    expectedActions: expert.map((step) => ({
      at: step.tick === 0 ? 'At start' : `Tick ${step.tick}`,
      action: step.label,
      ...(step.detail === undefined ? {} : { detail: step.detail }),
    })),
    sources: metadata.clinicalReview.sources,
    notForClinicalUse: NOT_FOR_CLINICAL_USE,
    notClinicallyReviewed: NOT_CLINICALLY_REVIEWED,
    vitalsNote: RUN_SHEET_VITALS_NOTE,
  };
}

/** The JSON form. Every field of the sheet, and nothing computed on the way out. */
export function runSheetJson(sheet: RunSheet): string {
  return `${JSON.stringify(sheet, null, 2)}\n`;
}

/**
 * The plain-text form, carrying the same fields as the JSON.
 *
 * Plain text because a facilitator prints it, writes on it, and reads it in a
 * room where the screen is showing something else.
 */
export function runSheetText(sheet: RunSheet): string {
  const lines: string[] = [
    sheet.title,
    `Module: ${sheet.moduleId}`,
    `Content version: ${sheet.contentVersion}`,
    `Published as: ${sheet.maturity}`,
    `Licence: ${sheet.licence}`,
    `About ${sheet.estimatedMinutes} simulated minutes`,
    '',
    'WHAT THIS LESSON IS FOR',
    ...sheet.objectives.map((objective) => `  - ${objective}`),
    '',
    'STATES',
  ];
  sheet.states.forEach((state, index) => {
    lines.push(`  ${index + 1}. [${state.at}] (${state.severity}) ${state.id}`);
    lines.push(`     ${state.text}`);
  });
  lines.push('', 'EXPECTED LEARNER ACTIONS', `  ${RUN_SHEET_EXPECTED_ACTIONS_NOTE}`);
  for (const action of sheet.expectedActions) {
    lines.push(`  [${action.at}] ${action.action}${action.detail === undefined ? '' : ` (${action.detail})`}`);
  }
  lines.push('', 'VITAL SIGNS', `  ${sheet.vitalsNote}`);
  lines.push('', 'SOURCES', ...sheet.sources.map((source) => `  - ${source}`));
  lines.push('', sheet.notForClinicalUse, sheet.notClinicallyReviewed, '');
  return lines.join('\n');
}
