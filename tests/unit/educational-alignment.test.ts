import { describe, expect, it } from 'vitest';
import { educationalAlignmentFor, learningResourceJsonLd, structuredDataFor } from '@platform/docs/structured-data';
import { SCENARIO_MAPPINGS } from '@anesthesia/curriculum/mapping';
import { FRAMEWORKS } from '@anesthesia/curriculum/frameworks';
import { EMERGENCY_MEDICINE_SCENARIOS } from '../../src/modules/emergency-medicine/scenarios';
import {
  EMERGENCY_MEDICINE_FRAMEWORKS, EMERGENCY_MEDICINE_SCENARIO_MAPPINGS,
} from '../../src/modules/emergency-medicine/curriculum';

describe('educational alignment in structured data', () => {
  const mapped = [...new Set(SCENARIO_MAPPINGS.map((mapping) => mapping.scenarioId))];

  it('aligns every mapped scenario to each framework domain it maps to, as "teaches"', () => {
    for (const scenarioId of mapped) {
      const alignment = educationalAlignmentFor('anesthesia', scenarioId);
      expect(alignment).toHaveLength(SCENARIO_MAPPINGS.filter((mapping) => mapping.scenarioId === scenarioId).length);
      for (const entry of alignment) {
        expect(entry).toMatchObject({ '@type': 'AlignmentObject', alignmentType: 'teaches' });
        expect(FRAMEWORKS.map((framework) => framework.url)).toContain(entry.targetUrl);
      }
    }
  });

  /**
   * The second mapped module reaches this surface through the same lookup, so
   * an emergency medicine briefing carries its subcompetencies the way an
   * anaesthesia briefing carries its content areas. Before the lookup was
   * shared, every module but anaesthesia returned an empty alignment.
   */
  it('aligns the emergency medicine lessons to their subcompetencies', () => {
    for (const scenario of EMERGENCY_MEDICINE_SCENARIOS) {
      const alignment = educationalAlignmentFor('emergency-medicine', scenario.metadata.id);
      expect(alignment.length, scenario.metadata.id).toBe(EMERGENCY_MEDICINE_SCENARIO_MAPPINGS
        .filter((mapping) => mapping.scenarioId === scenario.metadata.id).length);
      for (const entry of alignment) {
        expect(entry).toMatchObject({ '@type': 'AlignmentObject', alignmentType: 'teaches' });
        expect(EMERGENCY_MEDICINE_FRAMEWORKS.map((framework) => framework.url))
          .toContain(entry.targetUrl);
      }
    }
  });

  it('puts the alignment on the scenario page and nowhere it does not belong', () => {
    const page = structuredDataFor(['LearningResource'], `/anesthesia/scenario/${mapped[0]}`)[0]!;
    expect(page.educationalAlignment).toEqual(educationalAlignmentFor('anesthesia', mapped[0]!));
    expect(educationalAlignmentFor('cardiology', mapped[0]!)).toEqual([]);
  });

  it('never claims assessment, accreditation, or endorsement', () => {
    const text = JSON.stringify(mapped.map((scenarioId) => learningResourceJsonLd(scenarioId, 'anesthesia')));
    // A framework may be named "Standards for Accreditation…"; what is forbidden is a claim.
    expect(text).not.toMatch(/"alignmentType":"(?:assesses|requires)"|endorse|(?:accredited|certified|approved|recogni[sz]ed) by/i);
  });
});
