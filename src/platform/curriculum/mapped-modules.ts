/**
 * Which framework domains one lesson is mapped to, whichever module it is in
 * (framework-mapping-expansion → scenario mappings).
 *
 * The facilitator guide and the briefing's structured data each asked the
 * anaesthesia module directly and returned nothing for every other module, so
 * adding a second mapped module would have meant adding the same branch twice,
 * in two files, with two chances of disagreeing about what a mapping is. They
 * ask here instead.
 *
 * Nursing is deliberately not here. Its mapping is DERIVED from each
 * objective's leading verb rather than authored per lesson, so it has no
 * mapping table to look a scenario up in; the two callers keep their own
 * branch for it, which reads from the convention itself.
 */
import { FRAMEWORKS } from '@anesthesia/curriculum/frameworks';
import { SCENARIO_MAPPINGS } from '@anesthesia/curriculum/mapping';
import {
  EMERGENCY_MEDICINE_FRAMEWORKS, EMERGENCY_MEDICINE_SCENARIO_MAPPINGS,
} from '../../modules/emergency-medicine/curriculum';
import {
  PEDIATRICS_FRAMEWORKS, PEDIATRICS_SCENARIO_MAPPINGS,
} from '../../modules/pediatrics/curriculum';
import {
  NEUROLOGY_FRAMEWORKS, NEUROLOGY_SCENARIO_MAPPINGS,
} from '../../modules/neurology/curriculum';
import {
  OBSTETRICS_FRAMEWORKS, OBSTETRICS_SCENARIO_MAPPINGS,
} from '../../modules/obstetrics/curriculum';
import {
  CARDIOLOGY_FRAMEWORKS, CARDIOLOGY_SCENARIO_MAPPINGS,
} from '../../modules/cardiology/curriculum';
import {
  RESPIRATORY_MEDICINE_FRAMEWORKS, RESPIRATORY_MEDICINE_SCENARIO_MAPPINGS,
} from '../../modules/respiratory-medicine/curriculum';
import type { FrameworkDomainRecord, FrameworkRecord } from './framework-records';
import type { ScenarioMapping } from './mapping';

interface MappedModule {
  readonly frameworks: readonly FrameworkRecord[];
  readonly mappings: readonly ScenarioMapping[];
}

const BY_ROUTE: Readonly<Record<string, MappedModule>> = {
  anesthesia: { frameworks: FRAMEWORKS, mappings: SCENARIO_MAPPINGS },
  'emergency-medicine': {
    frameworks: EMERGENCY_MEDICINE_FRAMEWORKS, mappings: EMERGENCY_MEDICINE_SCENARIO_MAPPINGS,
  },
  pediatrics: { frameworks: PEDIATRICS_FRAMEWORKS, mappings: PEDIATRICS_SCENARIO_MAPPINGS },
  neurology: { frameworks: NEUROLOGY_FRAMEWORKS, mappings: NEUROLOGY_SCENARIO_MAPPINGS },
  obstetrics: { frameworks: OBSTETRICS_FRAMEWORKS, mappings: OBSTETRICS_SCENARIO_MAPPINGS },
  cardiology: { frameworks: CARDIOLOGY_FRAMEWORKS, mappings: CARDIOLOGY_SCENARIO_MAPPINGS },
  'respiratory-medicine': {
    frameworks: RESPIRATORY_MEDICINE_FRAMEWORKS, mappings: RESPIRATORY_MEDICINE_SCENARIO_MAPPINGS,
  },
};

/** The module routes that carry an authored mapping table. */
export const MAPPED_MODULE_ROUTES: readonly string[] = Object.keys(BY_ROUTE);

export interface MappedDomain {
  readonly framework: FrameworkRecord;
  readonly domain: FrameworkDomainRecord;
  readonly objectiveIds: readonly string[];
}

/** Every domain this lesson claims, resolved against the readings themselves. */
export function mappedDomainsFor(moduleRoute: string, scenarioId: string): MappedDomain[] {
  const module = Object.hasOwn(BY_ROUTE, moduleRoute) ? BY_ROUTE[moduleRoute] : undefined;
  if (module === undefined) return [];
  return module.mappings.filter((mapping) => mapping.scenarioId === scenarioId)
    .flatMap((mapping) => {
      const framework = module.frameworks.find((entry) => entry.id === mapping.frameworkId);
      const domain = framework?.domains.find((entry) => entry.id === mapping.domainId);
      if (framework === undefined || domain === undefined) return [];
      return [{ framework, domain, objectiveIds: mapping.objectiveIds }];
    });
}
