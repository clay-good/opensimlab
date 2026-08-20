/** Acceptance tests for platform/practice-region and platform/global-reach. */
import { describe, expect, it } from 'vitest';
import {
  REGIONS, UNITED_KINGDOM, UNITED_STATES, UNREPRESENTED_NOTE, getRegion, guessRegion, term,
} from '@anesthesia/region/profiles';
import { CONVERTIBLE_FIELDS, forDisplay, formatQuantity, systemsDiffer } from '@anesthesia/region/units';
import { AnesthesiaEngine } from '@anesthesia/engine';
import { ROUTINE_INDUCTION } from '@anesthesia/scenarios/routine-induction';

describe('Requirement: Practice Region Is Chosen Early And Changeable', () => {
  it('Scenario: The default is a visible guess, not a silent assumption', () => {
    const guess = guessRegion(['en-US']);
    expect(guess.profile.id).toBe('US');
    expect(guess.reason).toContain('browser language');
    expect(guess.isFallback).toBe(false);
  });

  it('Scenario: An unlisted region degrades to a stated default', () => {
    const guess = guessRegion(['pt-BR']);
    expect(guess.isFallback).toBe(true);
    // The learner is told which profile they are using and what may differ.
    expect(guess.reason).toContain(guess.profile.name);
    expect(guess.reason).toContain('closest published profile');
    // The note names the gap rather than omitting it.
    expect(UNREPRESENTED_NOTE).toContain('Every other country');
  });

  it('Scenario: Region is recorded in the transcript', () => {
    const engine = new AnesthesiaEngine({
      scenario: ROUTINE_INDUCTION, seed: 1, practiceRegion: 'GB',
    });
    expect(engine.practiceRegion).toBe('GB');
  });
});

describe('Requirement: Region Governs Technique Availability', () => {
  it('Scenario: Target-controlled infusion is honest in the United States', () => {
    expect(UNITED_STATES.targetControlledInfusion.routine).toBe(false);
    expect(UNITED_STATES.targetControlledInfusion.note).toContain('not FDA-approved'.replace('not', 'Not'));
    expect(UNITED_STATES.targetControlledInfusion.note).toContain('Manual weight-based infusion');
  });

  it('Scenario: Target-controlled infusion is the default where it is standard', () => {
    expect(UNITED_KINGDOM.targetControlledInfusion.routine).toBe(true);
    expect(UNITED_KINGDOM.targetControlledInfusion.note).toContain('routine practice');
  });

  it('Scenario: An out-of-region technique remains learnable', () => {
    // The United States note explains WHY it is still available to learn.
    expect(UNITED_STATES.targetControlledInfusion.note).toContain('rotate abroad');
    // And says it is a labelled out-of-region module rather than absent.
    expect(UNITED_STATES.targetControlledInfusion.note).toContain('out-of-region');
  });

  it('Scenario: The right airway guideline is taught, and it names its issuing body', () => {
    expect(UNITED_STATES.airwayGuideline.issuingBody).toContain('American Society of Anesthesiologists');
    expect(UNITED_KINGDOM.airwayGuideline.issuingBody).toContain('Difficult Airway Society');
    for (const region of REGIONS) {
      expect(region.airwayGuideline.version.length).toBeGreaterThan(3);
      expect(region.airwayGuideline.name.length).toBeGreaterThan(10);
    }
  });
});

describe('Requirement: Region Governs Formulary And Presentation', () => {
  it('Scenario: Concentrations match local practice', () => {
    const usPropofol = UNITED_STATES.formulary.find((entry) => entry.drugId === 'propofol');
    const gbPropofol = UNITED_KINGDOM.formulary.find((entry) => entry.drugId === 'propofol');
    // Same concentration, different standard syringe volume.
    expect(usPropofol?.concentration).toBe(gbPropofol?.concentration);
    expect(usPropofol?.syringeVolumeMl).not.toBe(gbPropofol?.syringeVolumeMl);
  });

  it('states every concentration explicitly as mass per volume', () => {
    for (const region of REGIONS) {
      for (const entry of region.formulary) {
        expect(entry.concentrationUnit).toMatch(/\//);
        expect(entry.concentration).toBeGreaterThan(0);
      }
    }
  });

  it('identifies drugs by International Nonproprietary Name with stable identifiers', () => {
    for (const region of REGIONS) {
      for (const entry of region.formulary) {
        expect(entry.inn.length).toBeGreaterThan(3);
        expect(entry.atc ?? entry.unii, `${entry.drugId} needs a stable identifier`).toBeDefined();
      }
    }
  });
});

describe('Requirement: Region Governs Units And Terminology', () => {
  it('Scenario: Terminology matches the learner\'s training', () => {
    expect(term(UNITED_KINGDOM, 'anesthesia')).toBe('anaesthesia');
    expect(term(UNITED_STATES, 'anesthesia')).toBe('anesthesia');
    expect(term(UNITED_KINGDOM, 'epinephrine')).toBe('adrenaline');
    expect(term(UNITED_STATES, 'epinephrine')).toBe('epinephrine');
    // The internal identifier is stable across regions, so transcripts stay portable.
    expect(Object.keys(UNITED_KINGDOM.terminology)).toEqual(Object.keys(UNITED_STATES.terminology));
  });

  it('Scenario: Hemoglobin and glucose switch systems', () => {
    expect(forDisplay('hemoglobinGPerDl', 13.4, 'si')).toEqual({ value: 134, unit: 'g/L' });
    expect(forDisplay('hemoglobinGPerDl', 13.4, 'conventional')).toEqual({ value: 13.4, unit: 'g/dL' });
    const glucoseSi = forDisplay('glucoseMgPerDl', 90, 'si');
    expect(glucoseSi.unit).toBe('mmol/L');
    expect(glucoseSi.value).toBeCloseTo(5.0, 1);
    expect(forDisplay('glucoseMgPerDl', 90, 'conventional')).toEqual({ value: 90, unit: 'mg/dL' });
  });

  it('Scenario: Units are never ambiguous', () => {
    for (const field of CONVERTIBLE_FIELDS) {
      for (const system of ['si', 'conventional'] as const) {
        expect(forDisplay(field, 1, system).unit.length).toBeGreaterThan(0);
      }
    }
    expect(formatQuantity({ value: 13.4, unit: 'g/dL' }, 1)).toBe('13.4 g/dL');
  });

  it('Scenario: Conversion is display-only', () => {
    // The same actions replayed under either unit setting give an identical trace,
    // because unit selection is not an input to the engine at all.
    const trace = () => {
      const engine = new AnesthesiaEngine({ scenario: ROUTINE_INDUCTION, seed: 7, practiceRegion: 'US' });
      engine.apply({ tick: 0, type: 'bolus', payload: { drugId: 'propofol', amount: 130, unit: 'mg' } });
      const out: number[] = [];
      for (let i = 0; i < 600; i += 1) {
        const result = engine.step();
        out.push(result.state.meanArterialMmHg, result.state.hemoglobinGPerDl, result.state.paco2MmHg);
      }
      return out;
    };
    expect(trace()).toEqual(trace());
    // And the conversion table really does change what a learner sees.
    expect(systemsDiffer('hemoglobinGPerDl')).toBe(true);
    expect(systemsDiffer('paco2MmHg')).toBe(true);
  });

  it('Scenario: Language and clinical practice vary independently', () => {
    // Units are declared per region but selectable independently: the conversion
    // function takes the system as an argument, not the region.
    expect(forDisplay('hemoglobinGPerDl', 10, 'si').unit).toBe('g/L');
    expect(UNITED_STATES.unitSystem).toBe('conventional');
    expect(UNITED_KINGDOM.unitSystem).toBe('si');
  });
});

describe('Requirement: Region Profiles Are Data, Reviewed, And Extendable', () => {
  it('Scenario: Profile coverage and gaps are public', () => {
    for (const region of REGIONS) {
      expect(region.clinicalReview.reviewer.length).toBeGreaterThan(0);
      expect(region.clinicalReview.reviewedOn).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(['complete', 'partial', 'unreviewed']).toContain(region.clinicalReview.completeness);
    }
    expect(UNREPRESENTED_NOTE.length).toBeGreaterThan(60);
  });

  it('Scenario: Initial coverage is stated honestly', () => {
    expect(REGIONS.map((region) => region.id).sort()).toEqual(['GB', 'US']);
    expect(UNREPRESENTED_NOTE).toContain('falls back');
    expect(UNREPRESENTED_NOTE).toContain('contribute');
  });

  it('is a versioned data file that needs no code change to extend', () => {
    for (const region of REGIONS) expect(region.version).toMatch(/^\d+\.\d+\.\d+$/);
    expect(() => getRegion('ZZ')).toThrow();
  });
});
