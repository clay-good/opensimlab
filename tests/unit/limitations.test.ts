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
import { PEDIATRICS_SCENARIOS } from '../../src/modules/pediatrics/scenarios';
import { NEUROLOGY_SCENARIOS } from '../../src/modules/neurology/scenarios';
import { TOXICOLOGY_SCENARIOS } from '../../src/modules/toxicology/scenarios';
import { OBSTETRICS_SCENARIOS } from '../../src/modules/obstetrics/scenarios';
import { NEONATOLOGY_SCENARIOS } from '../../src/modules/neonatology/scenarios';
import { ENDOCRINE_METABOLIC_SCENARIOS } from '../../src/modules/endocrine-metabolic/scenarios';
import { RENAL_ELECTROLYTE_SCENARIOS } from '../../src/modules/renal-electrolyte/scenarios';
import { INFECTIOUS_DISEASE_SCENARIOS } from '../../src/modules/infectious-disease/scenarios';
import { MEDICAL_SURGICAL_NURSING_SCENARIOS } from '../../src/modules/medical-surgical-nursing/scenarios';
import { ONCOLOGY_SCENARIOS } from '../../src/modules/oncology/scenarios';
import { ANESTHESIA_LIMITATIONS } from '@platform/docs/limitations/anesthesia';
import { EMERGENCY_MEDICINE_LIMITATIONS } from '@platform/docs/limitations/emergency-medicine';
import { CRITICAL_CARE_LIMITATIONS } from '@platform/docs/limitations/critical-care';
import { CARDIOLOGY_LIMITATIONS } from '@platform/docs/limitations/cardiology';
import { RESPIRATORY_MEDICINE_LIMITATIONS } from '@platform/docs/limitations/respiratory-medicine';
import { PEDIATRICS_LIMITATIONS } from '@platform/docs/limitations/pediatrics';
import { NEUROLOGY_LIMITATIONS } from '@platform/docs/limitations/neurology';
import { TOXICOLOGY_LIMITATIONS } from '@platform/docs/limitations/toxicology';
import { OBSTETRICS_LIMITATIONS } from '@platform/docs/limitations/obstetrics';
import { NEONATOLOGY_LIMITATIONS } from '@platform/docs/limitations/neonatology';
import { ENDOCRINE_METABOLIC_LIMITATIONS } from '@platform/docs/limitations/endocrine-metabolic';
import { RENAL_ELECTROLYTE_LIMITATIONS } from '@platform/docs/limitations/renal-electrolyte';
import { INFECTIOUS_DISEASE_LIMITATIONS } from '@platform/docs/limitations/infectious-disease';
import { MEDICAL_SURGICAL_NURSING_LIMITATIONS } from '@platform/docs/limitations/medical-surgical-nursing';
import { ONCOLOGY_LIMITATIONS } from '@platform/docs/limitations/oncology';
import { SHARED_LIMITATIONS } from '@platform/docs/limitations/shared';

/** Each module's own register, beside the scenarios it has to brief. */
const MODULE_REGISTERS = [
  ['anesthesia', ANESTHESIA_LIMITATIONS, SCENARIOS],
  ['emergency-medicine', EMERGENCY_MEDICINE_LIMITATIONS, EMERGENCY_MEDICINE_SCENARIOS],
  ['critical-care', CRITICAL_CARE_LIMITATIONS, CRITICAL_CARE_SCENARIOS],
  ['cardiology', CARDIOLOGY_LIMITATIONS, CARDIOLOGY_SCENARIOS],
  ['respiratory-medicine', RESPIRATORY_MEDICINE_LIMITATIONS, RESPIRATORY_MEDICINE_SCENARIOS],
  ['pediatrics', PEDIATRICS_LIMITATIONS, PEDIATRICS_SCENARIOS],
  ['neurology', NEUROLOGY_LIMITATIONS, NEUROLOGY_SCENARIOS],
  ['toxicology', TOXICOLOGY_LIMITATIONS, TOXICOLOGY_SCENARIOS],
  ['obstetrics', OBSTETRICS_LIMITATIONS, OBSTETRICS_SCENARIOS],
  ['neonatology', NEONATOLOGY_LIMITATIONS, NEONATOLOGY_SCENARIOS],
  ['endocrine-metabolic', ENDOCRINE_METABOLIC_LIMITATIONS, ENDOCRINE_METABOLIC_SCENARIOS],
  ['renal-electrolyte', RENAL_ELECTROLYTE_LIMITATIONS, RENAL_ELECTROLYTE_SCENARIOS],
  ['infectious-disease', INFECTIOUS_DISEASE_LIMITATIONS, INFECTIOUS_DISEASE_SCENARIOS],
  ['medical-surgical-nursing', MEDICAL_SURGICAL_NURSING_LIMITATIONS, MEDICAL_SURGICAL_NURSING_SCENARIOS],
  ['oncology', ONCOLOGY_LIMITATIONS, ONCOLOGY_SCENARIOS],
] as const;

const ALL_SCENARIOS = MODULE_REGISTERS.flatMap(([, , scenarios]) => [...scenarios]);
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
      for (const limitation of limitationsToBrief(scenario, LIMITATIONS)) {
        expect(limitation.headline, scenario.metadata.id).toMatch(/\s/);
        expect(limitation.headline).not.toMatch(/^[a-z0-9-]+$/);
      }
    }
  });

  // The register is split one file per module so a cockpit carries its own entries and not all
  // fifteen modules'. That split is only safe while the parts still add up to the whole: an entry
  // filed under no module would vanish from the limitations page, and one filed under the wrong
  // module would be missing from the briefing that needs it and shipped to a module that does not.
  it('files every entry under a module whose scenarios name it', () => {
    const filed = new Set([...MODULE_REGISTERS.flatMap(([, list]) => list), ...SHARED_LIMITATIONS]
      .map((limitation) => limitation.id));
    expect(LIMITATIONS.filter((limitation) => !filed.has(limitation.id)).map((l) => l.id)).toEqual([]);
    expect(filed.size).toBe(LIMITATIONS.length);

    // A scenario names a limitation from either end: the register's `briefIn`, or the scenario's
    // own declared ids. Filing on `briefIn` alone left routine-induction two entries short of what
    // the whole register gave it, which is what this pair of tests was written to catch.
    for (const [moduleId, list, scenarios] of MODULE_REGISTERS) {
      const briefed = new Set(scenarios.map((scenario) => scenario.metadata.id));
      const declared = new Set(scenarios.flatMap((scenario) => [...scenario.metadata.limitations ?? []]));
      for (const limitation of list) {
        expect(limitation.briefIn.some((id) => briefed.has(id)) || declared.has(limitation.id),
          `${limitation.id} is filed under ${moduleId}, which names it from neither end`).toBe(true);
      }
    }
    // Shared entries name nobody, so no cockpit downloads them.
    for (const limitation of SHARED_LIMITATIONS) expect(limitation.briefIn).toEqual([]);
  });

  it('briefs the same entries from a module register as from the whole one', () => {
    // Sets, not sequences. The whole register is now assembled module by module, so its order is
    // grouped rather than historical; a briefing reads from its own module's register, whose order
    // is the original one. What has to hold is that neither view drops or adds an entry.
    for (const [moduleId, list, scenarios] of MODULE_REGISTERS) {
      for (const scenario of scenarios) {
        expect(new Set(limitationsToBrief(scenario, list).map((l) => l.id)),
          `${scenario.metadata.id} briefs differently from the ${moduleId} register`)
          .toEqual(new Set(limitationsToBrief(scenario, LIMITATIONS).map((l) => l.id)));
      }
    }
  });

  it('names every limitation that nominated this scenario', () => {
    // `briefIn` is the register saying where a limitation bites. It was
    // declared on three limitations and honoured by none.
    for (const scenario of ALL_SCENARIOS) {
      const named = new Set(limitationsToBrief(scenario, LIMITATIONS).map((l) => l.id));
      for (const limitation of LIMITATIONS) {
        if (!limitation.briefIn.includes(scenario.metadata.id)) continue;
        expect(named, `${scenario.metadata.id} does not name ${limitation.id}`)
          .toContain(limitation.id);
      }
    }
  });

  it('names every limitation the scenario itself declared', () => {
    for (const scenario of ALL_SCENARIOS) {
      const named = new Set(limitationsToBrief(scenario, LIMITATIONS).map((l) => l.id));
      for (const id of scenario.metadata.limitations ?? []) {
        expect(named, `${scenario.metadata.id} declared ${id} and does not name it`).toContain(id);
      }
    }
  });

  it('declares no id the register does not carry', () => {
    // Routine induction stored SENTENCES here rather than ids, so all three of
    // its entries matched nothing and could not be linked to the register.
    for (const scenario of ALL_SCENARIOS) {
      expect(unknownLimitationIds(scenario, LIMITATIONS), scenario.metadata.id).toEqual([]);
    }
  });

  it('gives every scenario something to say', () => {
    // A scenario that names no limitation is either perfect or has not been
    // thought about.
    for (const scenario of ALL_SCENARIOS) {
      expect(limitationsToBrief(scenario, LIMITATIONS).length, scenario.metadata.id).toBeGreaterThan(0);
    }
  });

  it('says each one once, however many sources asked for it', () => {
    for (const scenario of ALL_SCENARIOS) {
      const named = limitationsToBrief(scenario, LIMITATIONS).map((l) => l.id);
      expect(new Set(named).size).toBe(named.length);
    }
  });

  it('briefs the bronchospasm scenario on the ventilation modes it cannot show', () => {
    // The case the `briefIn` field was added for: falling tidal volume at a
    // fixed pressure is an early sign of worsening compliance, it is what this
    // scenario is about, and the simulator cannot show it.
    const bronchospasm = SCENARIOS.find((s) => s.metadata.id === 'bronchospasm')!;
    const named = limitationsToBrief(bronchospasm, LIMITATIONS).map((l) => l.id);
    expect(named).toContain('ventilation-modes-are-not-distinguished');
  });

  it('briefs the desaturation scenario on the arrest model it will meet', () => {
    const desat = SCENARIOS.find((s) => s.metadata.id === 'rapid-desaturation')!;
    expect(limitationsToBrief(desat, LIMITATIONS).map((l) => l.id))
      .toContain('hypoxic-collapse-is-a-teaching-model');
  });

  it('gives the hemorrhage case one current coagulation boundary, not the obsolete absence claim', () => {
    const hemorrhage = SCENARIOS.find((s) => s.metadata.id === 'unexpected-intraoperative-hemorrhage')!;
    const named = limitationsToBrief(hemorrhage, LIMITATIONS).map((limitation) => limitation.id);
    expect(named).toContain('bounded-dilutional-coagulopathy');
    expect(named).not.toContain('no-coagulopathy');
  });
});
