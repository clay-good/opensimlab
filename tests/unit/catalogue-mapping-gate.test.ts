/**
 * framework-mapping-expansion → every scenario in every module is mapped
 * (platform/adoption → Curriculum Mapping To Recognized Frameworks).
 *
 * The change asked for this gate and said plainly when it could exist: "fail
 * the build on an unmapped scenario once authoring is done". It is done. All
 * sixteen modules carry a mapping to a published reading their own programmes
 * use, so from here an unmapped lesson is a build failure rather than a row in
 * a coverage table.
 *
 * Nursing reaches the gate differently from the other fifteen, and that is not
 * an exemption: its mapping is DERIVED from each objective's leading verb
 * rather than authored per lesson, so it has no mapping table to look a
 * scenario up in. `ncjmmMappings` throws on an objective the convention cannot
 * place, which is the same gate by another mechanism.
 */
import { describe, expect, it } from 'vitest';
import { FACILITATED_SCENARIOS } from '@platform/facilitation/scenario-catalog';
import { MAPPED_MODULE_ROUTES, mappedDomainsFor } from '@platform/curriculum/mapped-modules';
import { ncjmmMappings } from '../../src/modules/medical-surgical-nursing/curriculum';
import { FRAMEWORK_READINGS } from '@platform/curriculum/readings';
import { availableModules } from '@platform/modules/registry';

const DERIVED = 'medical-surgical-nursing';

describe('Requirement: every scenario in every module is mapped', () => {
  it('Scenario: no lesson in the build is unmapped', () => {
    const unmapped = FACILITATED_SCENARIOS
      .filter((entry) => entry.moduleRoute !== DERIVED)
      .filter((entry) => mappedDomainsFor(entry.moduleRoute, entry.scenario.metadata.id).length === 0)
      .map((entry) => `${entry.moduleRoute}/${entry.scenario.metadata.id}`);
    expect(unmapped, 'these lessons are not mapped to any framework').toEqual([]);
  });

  it('Scenario: the nursing module reaches the same gate through its convention', () => {
    const nursing = FACILITATED_SCENARIOS.filter((entry) => entry.moduleRoute === DERIVED);
    expect(nursing.length).toBeGreaterThan(0);
    for (const entry of nursing) {
      const mappings = ncjmmMappings([entry.scenario]);
      expect(mappings.length, entry.scenario.metadata.id)
        .toBe(entry.scenario.metadata.objectives.length);
    }
  });

  it('Scenario: every available module carries a mapping', () => {
    const mapped = new Set([...MAPPED_MODULE_ROUTES, DERIVED]);
    for (const module of availableModules()) {
      expect(mapped, `${module.route} has no framework mapping`).toContain(module.route);
    }
    expect(FACILITATED_SCENARIOS).toHaveLength(256);
  });

  /**
   * Every mapping resolves against a reading this build ships. A mapping to a
   * reading that was removed, or to one that never joined the readings list,
   * is the quiet way a coverage table starts lying.
   */
  it('Scenario: every mapped domain belongs to a shipped reading', () => {
    const readings = new Map(FRAMEWORK_READINGS.map((reading) => [reading.id, reading]));
    for (const entry of FACILITATED_SCENARIOS) {
      for (const mapped of mappedDomainsFor(entry.moduleRoute, entry.scenario.metadata.id)) {
        const reading = readings.get(mapped.framework.id);
        expect(reading, `${mapped.framework.id} is not in the readings list`).toBeDefined();
        expect(reading!.domains.some((domain) => domain.id === mapped.domain.id)).toBe(true);
      }
    }
  });
});
