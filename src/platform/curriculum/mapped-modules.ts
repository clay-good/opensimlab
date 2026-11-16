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
 * Nursing is here for its CLIENT NEEDS mapping only. Its clinical judgment
 * mapping is derived from each objective's leading verb rather than authored
 * per lesson, so it has no table to look a scenario up in and the two callers
 * keep their own branch for it; the Client Needs categories are authored,
 * because a lesson's category is about its subject and no verb can tell you
 * that.
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
import {
  CRITICAL_CARE_FRAMEWORKS, CRITICAL_CARE_SCENARIO_MAPPINGS,
} from '../../modules/critical-care/curriculum';
import {
  INFECTIOUS_DISEASE_FRAMEWORKS, INFECTIOUS_DISEASE_SCENARIO_MAPPINGS,
} from '../../modules/infectious-disease/curriculum';
import {
  ONCOLOGY_FRAMEWORKS, ONCOLOGY_SCENARIO_MAPPINGS,
} from '../../modules/oncology/curriculum';
import {
  TOXICOLOGY_FRAMEWORKS, TOXICOLOGY_SCENARIO_MAPPINGS,
} from '../../modules/toxicology/curriculum';
import {
  RENAL_ELECTROLYTE_FRAMEWORKS, RENAL_ELECTROLYTE_SCENARIO_MAPPINGS,
} from '../../modules/renal-electrolyte/curriculum';
import {
  ENDOCRINE_METABOLIC_FRAMEWORKS, ENDOCRINE_METABOLIC_SCENARIO_MAPPINGS,
} from '../../modules/endocrine-metabolic/curriculum';
import {
  NEONATOLOGY_FRAMEWORKS, NEONATOLOGY_SCENARIO_MAPPINGS,
} from '../../modules/neonatology/curriculum';
import {
  SURGERY_TRAUMA_FRAMEWORKS, SURGERY_TRAUMA_SCENARIO_MAPPINGS,
} from '../../modules/surgery-trauma/curriculum';
import {
  NCLEX_CLIENT_NEEDS_MAPPINGS,
} from '../../modules/medical-surgical-nursing/curriculum';
import { NCSBN_NCLEX_CLIENT_NEEDS } from './nclex-client-needs';
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
  'critical-care': {
    frameworks: CRITICAL_CARE_FRAMEWORKS, mappings: CRITICAL_CARE_SCENARIO_MAPPINGS,
  },
  'infectious-disease': {
    frameworks: INFECTIOUS_DISEASE_FRAMEWORKS, mappings: INFECTIOUS_DISEASE_SCENARIO_MAPPINGS,
  },
  oncology: { frameworks: ONCOLOGY_FRAMEWORKS, mappings: ONCOLOGY_SCENARIO_MAPPINGS },
  toxicology: { frameworks: TOXICOLOGY_FRAMEWORKS, mappings: TOXICOLOGY_SCENARIO_MAPPINGS },
  'renal-electrolyte': {
    frameworks: RENAL_ELECTROLYTE_FRAMEWORKS, mappings: RENAL_ELECTROLYTE_SCENARIO_MAPPINGS,
  },
  'endocrine-metabolic': {
    frameworks: ENDOCRINE_METABOLIC_FRAMEWORKS, mappings: ENDOCRINE_METABOLIC_SCENARIO_MAPPINGS,
  },
  neonatology: { frameworks: NEONATOLOGY_FRAMEWORKS, mappings: NEONATOLOGY_SCENARIO_MAPPINGS },
  'surgery-trauma': {
    frameworks: SURGERY_TRAUMA_FRAMEWORKS, mappings: SURGERY_TRAUMA_SCENARIO_MAPPINGS,
  },
  'medical-surgical-nursing': {
    frameworks: [NCSBN_NCLEX_CLIENT_NEEDS], mappings: NCLEX_CLIENT_NEEDS_MAPPINGS,
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
