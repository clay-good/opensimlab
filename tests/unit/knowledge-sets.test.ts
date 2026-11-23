import { describe, expect, it } from 'vitest';
import { EXPLAINER_FLOOR, KNOWLEDGE_SETS, knowledgeGaps, type KnowledgeSet } from '@platform/knowledge/knowledge-sets';
import { availableModules } from '@platform/modules/registry';
import { EXPLAINERS } from '@anesthesia/content/explainers';
import { EMERGENCY_MEDICINE_EXPLAINERS } from '../../src/modules/emergency-medicine/content/explainers';

describe('module knowledge sets', () => {
  it('declares one per available module, each with what it ships', () => {
    expect(KNOWLEDGE_SETS.map((set) => set.moduleId).sort()).toEqual(availableModules().map((module) => module.id).sort());
    expect(KNOWLEDGE_SETS.find((set) => set.moduleId === 'anesthesia')!.explainers).toBe(EXPLAINERS);
    expect(KNOWLEDGE_SETS.find((set) => set.moduleId === 'emergency-medicine')!.explainers)
      .toBe(EMERGENCY_MEDICINE_EXPLAINERS);
  });

  it('measures the floor, the uncarded agents and any "show me" that leaves its module', () => {
    const gaps = knowledgeGaps();
    expect(gaps.find((gap) => gap.moduleId === 'anesthesia')).toEqual({
      moduleId: 'anesthesia', explainersShort: 0, agentsWithoutCard: [], showMeOutsideModule: [] });
    // Today every formulary agent in the catalogue has a card; this pins it so a new agent without one is seen.
    expect(gaps.flatMap((gap) => gap.agentsWithoutCard)).toEqual([]);
    expect(gaps.find((gap) => gap.moduleId === 'emergency-medicine')!.explainersShort).toBe(0);
    // Every module that has not authored a set yet is the whole floor short, and
    // the count of those is the gap this change is closing one module at a time.
    const authored = KNOWLEDGE_SETS.filter((set) => set.explainers.length > 0).length;
    expect(gaps.filter((gap) => gap.explainersShort === EXPLAINER_FLOOR).length).toBe(gaps.length - authored);
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
