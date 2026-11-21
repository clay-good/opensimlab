import { describe, expect, it } from 'vitest';
import { EXPLAINER_FLOOR, KNOWLEDGE_SETS, knowledgeGaps, type KnowledgeSet } from '@platform/knowledge/knowledge-sets';
import { availableModules } from '@platform/modules/registry';
import { EXPLAINERS } from '@anesthesia/content/explainers';

describe('module knowledge sets', () => {
  it('declares one per available module, anesthesia with what it ships', () => {
    expect(KNOWLEDGE_SETS.map((set) => set.moduleId).sort()).toEqual(availableModules().map((module) => module.id).sort());
    expect(KNOWLEDGE_SETS.find((set) => set.moduleId === 'anesthesia')!.explainers).toBe(EXPLAINERS);
  });

  it('measures the floor, the uncarded agents and any "show me" that leaves its module', () => {
    const gaps = knowledgeGaps();
    expect(gaps.find((gap) => gap.moduleId === 'anesthesia')).toEqual({
      moduleId: 'anesthesia', explainersShort: 0, agentsWithoutCard: [], showMeOutsideModule: [] });
    // Today every formulary agent in the catalogue has a card; this pins it so a new agent without one is seen.
    expect(gaps.flatMap((gap) => gap.agentsWithoutCard)).toEqual([]);
    expect(gaps.filter((gap) => gap.explainersShort === EXPLAINER_FLOOR).length).toBe(gaps.length - 1);
  });

  it('finds a gap when one is introduced', () => {
    const broken: KnowledgeSet = { moduleId: 'anesthesia', explainers: [{ id: 'x', showMe: { scenarioId: 'not-in-anesthesia' } }],
      cards: [], whyTemplates: [] };
    const [gap] = knowledgeGaps([broken]);
    expect(gap!.explainersShort).toBe(EXPLAINER_FLOOR - 1);
    expect(gap!.agentsWithoutCard).toContain('propofol');
    expect(gap!.showMeOutsideModule).toEqual(['x']);
  });
});
