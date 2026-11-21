/**
 * The knowledge set each module declares (knowledge-layer → the minimum
 * knowledge set): its explainers, its intervention cards, and the Why templates
 * for its state-transition lessons.
 *
 * One declaration per module, in one place, so the floor and the gaps are
 * something the gate can count rather than something a reader has to infer.
 * Anesthesia declares what it ships. The other fifteen declare empty sets, and
 * that is the point: an empty set is a stated fact, the gate reports it, and
 * filling it is clinical authoring with sources, not something to generate.
 */
import { EXPLAINERS } from '@anesthesia/content/explainers';
import { DRUG_CARDS } from '@anesthesia/content/drug-cards';
import { FACILITATED_SCENARIOS } from '@platform/facilitation/scenario-catalog';
import { availableModules } from '@platform/modules/registry';

export interface KnowledgeSet {
  readonly moduleId: string;
  readonly explainers: readonly { readonly id: string; readonly showMe: { readonly scenarioId: string; readonly sandbox?: string } }[];
  /** Intervention cards, by the formulary agent each covers. */
  readonly cards: readonly { readonly drugId: string }[];
  /** One per declared transition in the module's state-transition lessons. */
  readonly whyTemplates: readonly string[];
}

/** The floor, not the target: no module should ship lessons with no explanation at all. */
export const EXPLAINER_FLOOR = 6;

const DECLARED: Readonly<Record<string, Omit<KnowledgeSet, 'moduleId'>>> = {
  anesthesia: { explainers: EXPLAINERS, cards: DRUG_CARDS, whyTemplates: [] },
};

/** Every available module's knowledge set; a module with nothing declared has an empty one. */
export const KNOWLEDGE_SETS: readonly KnowledgeSet[] = availableModules().map((module) => ({
  moduleId: module.id,
  ...(DECLARED[module.id] ?? { explainers: [], cards: [], whyTemplates: [] }),
}));

export interface KnowledgeGap {
  readonly moduleId: string;
  /** How many explainers short of the floor; zero when at or above it. */
  readonly explainersShort: number;
  /** Agents in the module's own formularies with no card, sorted. */
  readonly agentsWithoutCard: readonly string[];
  /** Explainers whose "show me" names a lesson outside this module. */
  readonly showMeOutsideModule: readonly string[];
}

export function knowledgeGaps(sets: readonly KnowledgeSet[] = KNOWLEDGE_SETS): readonly KnowledgeGap[] {
  return sets.map((set) => {
    const lessons = FACILITATED_SCENARIOS.filter((entry) => entry.moduleRoute === set.moduleId);
    const agents = new Set(lessons.flatMap((entry) => entry.scenario.formulary.map((agent) => agent.drugId)));
    const carded = new Set(set.cards.map((card) => card.drugId));
    const ids = new Set(lessons.map((entry) => entry.scenario.metadata.id));
    return {
      moduleId: set.moduleId,
      explainersShort: Math.max(EXPLAINER_FLOOR - set.explainers.length, 0),
      agentsWithoutCard: [...agents].filter((agent) => !carded.has(agent)).sort(),
      showMeOutsideModule: set.explainers.filter((explainer) => !ids.has(explainer.showMe.scenarioId)).map((explainer) => explainer.id),
    };
  });
}
