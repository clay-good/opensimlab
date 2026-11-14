/**
 * The return index: what a spaced-return suggestion needs to name a lesson it
 * is not standing on (learning/curriculum → Spaced Return To Weak Areas).
 *
 * The suggestion ranks across all sixteen modules, and the history alone is
 * enough to rank: it carries the module, the scenario, the objectives, their
 * outcomes and the days. What the history cannot supply is the winner's own
 * words — its title, its duration, and the statement of each objective the
 * suggestion says it practises — and a module's catalogue page holds only its
 * own scenarios.
 *
 * So this is the smallest derived view of the whole catalogue that lets any
 * page name any lesson: four fields and the objective statements, and nothing
 * of the physiology, timeline, branches or trays that make a scenario large.
 * It is generated (`npm run return-index`) into `return-index.generated.ts`
 * rather than assembled at runtime, because assembling it would mean importing
 * all 256 scenarios, and it is loaded lazily and only when this device has
 * practice history to rank.
 *
 * `tests/unit/return-index.test.ts` holds the generated file in step with the
 * real catalogues, so an edited title cannot leave a stale one behind.
 */

export interface ReturnIndexObjective {
  readonly id: string;
  readonly statement: string;
}

export interface ReturnIndexEntry {
  readonly moduleId: string;
  readonly scenarioId: string;
  readonly title: string;
  readonly estimatedMinutes: number;
  readonly objectives: readonly ReturnIndexObjective[];
}

/** The shape this index is derived from: any scenario list, with its module. */
export interface IndexedModule {
  readonly moduleId: string;
  readonly scenarios: readonly {
    readonly metadata: {
      readonly id: string;
      readonly title: string;
      readonly estimatedMinutes: number;
      readonly objectives: readonly { readonly id: string; readonly statement: string }[];
    };
  }[];
}

export function buildReturnIndex(modules: readonly IndexedModule[]): readonly ReturnIndexEntry[] {
  return modules.flatMap(({ moduleId, scenarios }) => scenarios.map((scenario) => ({
    moduleId,
    scenarioId: scenario.metadata.id,
    title: scenario.metadata.title,
    estimatedMinutes: scenario.metadata.estimatedMinutes,
    objectives: scenario.metadata.objectives.map(({ id, statement }) => ({ id, statement })),
  })));
}
