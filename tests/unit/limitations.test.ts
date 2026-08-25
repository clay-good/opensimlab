/**
 * The limitations register, and the briefings that name it.
 *
 * Two failures found together. Three limitations nominated a scenario through
 * `briefIn` and not one of those scenarios listed them, so the requirement that
 * a briefing names the limitations near its teaching points was satisfied
 * nowhere. And the briefing printed whatever string the scenario held — which
 * for three of the four scenarios meant showing a learner the bullet
 * "no-shunt-or-dead-space-dynamics".
 */
import { describe, expect, it } from 'vitest';
import { LIMITATIONS } from '@platform/docs/limitations';
import { limitationsToBrief, unknownLimitationIds } from '@platform/docs/scenario-limitations';
import { SCENARIOS } from '@anesthesia/scenarios';
import { EMERGENCY_MEDICINE_SCENARIOS } from '../../src/modules/emergency-medicine/scenarios';
import { CRITICAL_CARE_SCENARIOS } from '../../src/modules/critical-care/scenarios';
import { CARDIOLOGY_SCENARIOS } from '../../src/modules/cardiology/scenarios';
import { RESPIRATORY_MEDICINE_SCENARIOS } from '../../src/modules/respiratory-medicine/scenarios';

const ALL_SCENARIOS = [...SCENARIOS, ...EMERGENCY_MEDICINE_SCENARIOS,
  ...CRITICAL_CARE_SCENARIOS, ...CARDIOLOGY_SCENARIOS, ...RESPIRATORY_MEDICINE_SCENARIOS];

describe('every limitation can be shown to a learner', () => {
  it.each(LIMITATIONS.map((limitation) => [limitation.id, limitation] as const))(
    '%s',
    (_id, limitation) => {
      // A briefing needs one line. `simplification` runs to a paragraph.
      expect(limitation.headline.length).toBeGreaterThan(40);
      expect(limitation.headline.length).toBeLessThan(260);
      expect(limitation.headline.trim()).toBe(limitation.headline);
      expect(limitation.headline.endsWith('.')).toBe(true);
      // The headline is prose, not the id wearing a hat.
      expect(limitation.headline).not.toContain(limitation.id);
      expect(limitation.headline).not.toMatch(/^[a-z0-9-]+$/);
    },
  );

  it('has a unique id for every entry', () => {
    expect(new Set(LIMITATIONS.map((l) => l.id)).size).toBe(LIMITATIONS.length);
  });
});

describe('what a scenario briefing names', () => {
  it('never shows a learner an identifier', () => {
    // The bug, in one assertion. Every bullet is a sentence.
    for (const scenario of ALL_SCENARIOS) {
      for (const limitation of limitationsToBrief(scenario)) {
        expect(limitation.headline, scenario.metadata.id).toMatch(/\s/);
        expect(limitation.headline).not.toMatch(/^[a-z0-9-]+$/);
      }
    }
  });

  it('names every limitation that nominated this scenario', () => {
    // `briefIn` is the register saying where a limitation bites. It was
    // declared on three limitations and honoured by none.
    for (const scenario of ALL_SCENARIOS) {
      const named = new Set(limitationsToBrief(scenario).map((l) => l.id));
      for (const limitation of LIMITATIONS) {
        if (!limitation.briefIn.includes(scenario.metadata.id)) continue;
        expect(named, `${scenario.metadata.id} does not name ${limitation.id}`)
          .toContain(limitation.id);
      }
    }
  });

  it('names every limitation the scenario itself declared', () => {
    for (const scenario of ALL_SCENARIOS) {
      const named = new Set(limitationsToBrief(scenario).map((l) => l.id));
      for (const id of scenario.metadata.limitations ?? []) {
        expect(named, `${scenario.metadata.id} declared ${id} and does not name it`).toContain(id);
      }
    }
  });

  it('declares no id the register does not carry', () => {
    // Routine induction stored SENTENCES here rather than ids, so all three of
    // its entries matched nothing and could not be linked to the register.
    for (const scenario of ALL_SCENARIOS) {
      expect(unknownLimitationIds(scenario), scenario.metadata.id).toEqual([]);
    }
  });

  it('gives every scenario something to say', () => {
    // A scenario that names no limitation is either perfect or has not been
    // thought about.
    for (const scenario of ALL_SCENARIOS) {
      expect(limitationsToBrief(scenario).length, scenario.metadata.id).toBeGreaterThan(0);
    }
  });

  it('says each one once, however many sources asked for it', () => {
    for (const scenario of ALL_SCENARIOS) {
      const named = limitationsToBrief(scenario).map((l) => l.id);
      expect(new Set(named).size).toBe(named.length);
    }
  });

  it('briefs the bronchospasm scenario on the ventilation modes it cannot show', () => {
    // The case the `briefIn` field was added for: falling tidal volume at a
    // fixed pressure is an early sign of worsening compliance, it is what this
    // scenario is about, and the simulator cannot show it.
    const bronchospasm = SCENARIOS.find((s) => s.metadata.id === 'bronchospasm')!;
    const named = limitationsToBrief(bronchospasm).map((l) => l.id);
    expect(named).toContain('ventilation-modes-are-not-distinguished');
  });

  it('briefs the desaturation scenario on the arrest model it will meet', () => {
    const desat = SCENARIOS.find((s) => s.metadata.id === 'rapid-desaturation')!;
    expect(limitationsToBrief(desat).map((l) => l.id))
      .toContain('hypoxic-collapse-is-a-teaching-model');
  });

  it('gives the hemorrhage case one current coagulation boundary, not the obsolete absence claim', () => {
    const hemorrhage = SCENARIOS.find((s) => s.metadata.id === 'unexpected-intraoperative-hemorrhage')!;
    const named = limitationsToBrief(hemorrhage).map((limitation) => limitation.id);
    expect(named).toContain('bounded-dilutional-coagulopathy');
    expect(named).not.toContain('no-coagulopathy');
  });
});
