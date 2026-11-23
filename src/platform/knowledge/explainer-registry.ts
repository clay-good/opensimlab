/**
 * Every module's concept explainers in one place
 * (knowledge-layer → the minimum knowledge set).
 *
 * The governance records, the review-status page and the reviewer's index all
 * need the whole catalogue of explanations, with the module and the review
 * domain each belongs to. Before this registry existed they imported one
 * module's array directly, so a second module's explainers would have been
 * authored into a build that never counted them.
 *
 * This file imports every module's explainer file, which makes it as heavy as
 * the catalogue it describes. The cockpit must NOT import it: a module's
 * explainers reach the cockpit on its own route config, so they stay in that
 * module's chunk. The surfaces here are documents, not the simulator.
 */

import type { Explainer } from './explainer';
import { EXPLAINERS } from '@anesthesia/content/explainers';
import { EMERGENCY_MEDICINE_EXPLAINERS } from '../../modules/emergency-medicine/content/explainers';
import { CRITICAL_CARE_EXPLAINERS } from '../../modules/critical-care/content/explainers';
import { CARDIOLOGY_EXPLAINERS } from '../../modules/cardiology/content/explainers';
import { RESPIRATORY_MEDICINE_EXPLAINERS } from '../../modules/respiratory-medicine/content/explainers';
import { PEDIATRICS_EXPLAINERS } from '../../modules/pediatrics/content/explainers';
import { NEUROLOGY_EXPLAINERS } from '../../modules/neurology/content/explainers';
import { TOXICOLOGY_EXPLAINERS } from '../../modules/toxicology/content/explainers';
import { OBSTETRICS_EXPLAINERS } from '../../modules/obstetrics/content/explainers';
import { NEONATOLOGY_EXPLAINERS } from '../../modules/neonatology/content/explainers';
import { ENDOCRINE_METABOLIC_EXPLAINERS } from '../../modules/endocrine-metabolic/content/explainers';

export interface ModuleExplainers {
  readonly moduleId: string;
  /** The route segment, which is also how the review-status page groups rows. */
  readonly route: string;
  /** The clinical review domain the module's content is judged under. */
  readonly reviewDomain: string;
  /** Where the set is authored, for the maturity record's evidence locator. */
  readonly sourcePath: string;
  readonly explainers: readonly Explainer[];
}

export const MODULE_EXPLAINERS: readonly ModuleExplainers[] = [
  {
    moduleId: 'anesthesia',
    route: 'anesthesia',
    reviewDomain: 'adult-general-anaesthesia',
    sourcePath: 'src/modules/anesthesia/content/explainers.ts',
    explainers: EXPLAINERS,
  },
  {
    moduleId: 'emergency-medicine',
    route: 'emergency-medicine',
    reviewDomain: 'emergency-medicine',
    sourcePath: 'src/modules/emergency-medicine/content/explainers.ts',
    explainers: EMERGENCY_MEDICINE_EXPLAINERS,
  },
  {
    moduleId: 'critical-care',
    route: 'critical-care',
    reviewDomain: 'critical-care',
    sourcePath: 'src/modules/critical-care/content/explainers.ts',
    explainers: CRITICAL_CARE_EXPLAINERS,
  },
  {
    moduleId: 'cardiology',
    route: 'cardiology',
    reviewDomain: 'cardiology',
    sourcePath: 'src/modules/cardiology/content/explainers.ts',
    explainers: CARDIOLOGY_EXPLAINERS,
  },
  {
    moduleId: 'respiratory-medicine',
    route: 'respiratory-medicine',
    reviewDomain: 'respiratory-medicine',
    sourcePath: 'src/modules/respiratory-medicine/content/explainers.ts',
    explainers: RESPIRATORY_MEDICINE_EXPLAINERS,
  },
  {
    moduleId: 'pediatrics',
    route: 'pediatrics',
    reviewDomain: 'pediatrics',
    sourcePath: 'src/modules/pediatrics/content/explainers.ts',
    explainers: PEDIATRICS_EXPLAINERS,
  },
  {
    moduleId: 'neurology',
    route: 'neurology',
    reviewDomain: 'neurology',
    sourcePath: 'src/modules/neurology/content/explainers.ts',
    explainers: NEUROLOGY_EXPLAINERS,
  },
  {
    moduleId: 'toxicology',
    route: 'toxicology',
    reviewDomain: 'toxicology',
    sourcePath: 'src/modules/toxicology/content/explainers.ts',
    explainers: TOXICOLOGY_EXPLAINERS,
  },
  {
    moduleId: 'obstetrics',
    route: 'obstetrics',
    reviewDomain: 'obstetrics',
    sourcePath: 'src/modules/obstetrics/content/explainers.ts',
    explainers: OBSTETRICS_EXPLAINERS,
  },
  {
    moduleId: 'neonatology',
    route: 'neonatology',
    reviewDomain: 'neonatology',
    sourcePath: 'src/modules/neonatology/content/explainers.ts',
    explainers: NEONATOLOGY_EXPLAINERS,
  },
  {
    moduleId: 'endocrine-metabolic',
    route: 'endocrine-metabolic',
    reviewDomain: 'endocrine-metabolic',
    sourcePath: 'src/modules/endocrine-metabolic/content/explainers.ts',
    explainers: ENDOCRINE_METABOLIC_EXPLAINERS,
  },
];

/** Every explainer in the build, beside the module that declares it. */
export function allExplainers(): readonly { readonly module: ModuleExplainers; readonly explainer: Explainer }[] {
  return MODULE_EXPLAINERS.flatMap((module) => module.explainers.map((explainer) => ({ module, explainer })));
}

/** One module's declared explainers; empty for a module that declares none. */
export function explainersForModule(moduleId: string): readonly Explainer[] {
  return MODULE_EXPLAINERS.find((entry) => entry.moduleId === moduleId)?.explainers ?? [];
}
