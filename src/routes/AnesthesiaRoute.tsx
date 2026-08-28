/**
 * The anaesthesia module's route.
 *
 * Carries only essential metadata and never marketing copy: the descriptive
 * weight lives on the root domain. It gates INTERACTION on the
 * not-for-clinical-use acknowledgement, never the delivery of the page.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Button, Select, SiteBar, useLocalPreference } from '@platform/ui';
import {
  useSession, sessionInternals, type GuidanceLevel, type SessionState,
} from '@platform/session/session-store';
import { NotForClinicalUseGate, hasAcknowledged, recordAcknowledgement } from '@platform/safety/not-for-clinical-use';
import { SonificationEngine } from '@platform/audio/sonification';
import { guessRegion, getRegion, REGIONS } from '@anesthesia/region/profiles';
import { DEFAULT_SCENARIO_ID, getScenario, scenariosByDifficulty } from '@anesthesia/scenarios';
import type { Scenario } from '@anesthesia/engine';
import { ENGINE_VERSION } from '@anesthesia/engine';
import { MODEL_SET_REVISION } from '@anesthesia/pharmacology/registry';
import { Prebrief } from '@anesthesia/ui/Prebrief';
import { DEMONSTRATION_SCENARIO_ID, demonstrationRequested } from '@anesthesia/demo/demonstration';
import { supportsHypoglycemiaDemonstration } from '../modules/endocrine-metabolic/demo/hypoglycemia-demonstration';
import { supportsAdrenalDemonstration } from '../modules/endocrine-metabolic/demo/adrenal-demonstration';
import { supportsThyroidDemonstration } from '../modules/endocrine-metabolic/demo/thyroid-demonstration';
import { supportsMyxedemaDemonstration } from '../modules/endocrine-metabolic/demo/myxedema-demonstration';
import { supportsHypercalcemiaDemonstration } from '../modules/endocrine-metabolic/demo/hypercalcemia-demonstration';
import { supportsHypocalcemiaDemonstration } from '../modules/endocrine-metabolic/demo/hypocalcemia-demonstration';
import { HYPOCALCEMIA_ACTIONS } from '../modules/endocrine-metabolic/hypocalcemia';
import { supportsHyponatremiaCorrectionDemonstration } from '../modules/endocrine-metabolic/demo/hyponatremia-correction-demonstration';
import { HYPONATREMIA_CORRECTION_ACTIONS, supportsHyponatremiaCorrection } from '../modules/endocrine-metabolic/hyponatremia-correction';
import { hyponatremiaCorrectionReportActions } from '../modules/endocrine-metabolic/hyponatremia-correction-reporting';
import { AVP_DEFICIENCY_ACTIONS, supportsAvpDeficiency } from '../modules/endocrine-metabolic/avp-deficiency';
import { avpDeficiencyReportActions } from '../modules/endocrine-metabolic/avp-deficiency-reporting';
import { supportsAvpDeficiencyDemonstration } from '../modules/endocrine-metabolic/demo/avp-deficiency-demonstration';
import { REFEEDING_ACTIONS, supportsRefeeding } from '../modules/endocrine-metabolic/refeeding';
import { refeedingReportActions } from '../modules/endocrine-metabolic/refeeding-reporting';
import { supportsRefeedingDemonstration } from '../modules/endocrine-metabolic/demo/refeeding-demonstration';
import { PERIOPERATIVE_DIABETES_ACTIONS, supportsPerioperativeDiabetes } from '../modules/endocrine-metabolic/perioperative-diabetes';
import { perioperativeDiabetesReportActions } from '../modules/endocrine-metabolic/perioperative-diabetes-reporting';
import { RENAL_HYPERKALEMIA_ACTIONS, supportsRenalHyperkalemia } from '../modules/renal-electrolyte/hyperkalemia';
import { renalHyperkalemiaReportActions } from '../modules/renal-electrolyte/hyperkalemia-reporting';
import { supportsRenalHyperkalemiaDemonstration } from '../modules/renal-electrolyte/demo/renal-hyperkalemia-demonstration';
import { RENAL_HYPOKALEMIA_ACTIONS, supportsRenalHypokalemia } from '../modules/renal-electrolyte/hypokalemia';
import { RENAL_HYPONATREMIA_ACTIONS, supportsRenalHyponatremia } from '../modules/renal-electrolyte/hyponatremia';
import { RENAL_HYPERNATREMIA_ACTIONS, supportsRenalHypernatremia } from '../modules/renal-electrolyte/hypernatremia';
import { renalHypernatremiaReportActions } from '../modules/renal-electrolyte/hypernatremia-reporting';
import { supportsRenalHypernatremiaDemonstration } from '../modules/renal-electrolyte/demo/renal-hypernatremia-demonstration';
import { RENAL_HYPOCALCEMIA_ACTIONS, supportsRenalHypocalcemia } from '../modules/renal-electrolyte/hypocalcemia';
import { renalHypocalcemiaReportActions } from '../modules/renal-electrolyte/hypocalcemia-reporting';
import { supportsRenalHypocalcemiaDemonstration } from '../modules/renal-electrolyte/demo/renal-hypocalcemia-demonstration';
import { RENAL_HYPERMAGNESEMIA_ACTIONS, supportsRenalHypermagnesemia } from '../modules/renal-electrolyte/hypermagnesemia';
import { renalHypermagnesemiaReportActions } from '../modules/renal-electrolyte/hypermagnesemia-reporting';
import { MENINGOCOCCAL_SEPSIS_ACTIONS, supportsMeningococcalSepsis } from '../modules/infectious-disease/meningococcal-sepsis';
import { meningococcalSepsisReportActions } from '../modules/infectious-disease/meningococcal-sepsis-reporting';
import { supportsRenalHypermagnesemiaDemonstration } from '../modules/renal-electrolyte/demo/renal-hypermagnesemia-demonstration';
import { renalHyponatremiaReportActions } from '../modules/renal-electrolyte/hyponatremia-reporting';
import { supportsRenalHyponatremiaDemonstration } from '../modules/renal-electrolyte/demo/renal-hyponatremia-demonstration';
import { renalHypokalemiaReportActions } from '../modules/renal-electrolyte/hypokalemia-reporting';
import { supportsRenalHypokalemiaDemonstration } from '../modules/renal-electrolyte/demo/renal-hypokalemia-demonstration';
import { supportsPerioperativeDiabetesDemonstration } from '../modules/endocrine-metabolic/demo/perioperative-diabetes-demonstration';
import { Cockpit } from '@anesthesia/ui/Cockpit';
import { Debrief } from '@anesthesia/ui/Debrief';
import { assertTranscriptIsAnonymous, NOT_FOR_CLINICAL_USE } from '@platform/transcript/transcript';
import { patientPersonNoun } from '@anesthesia/scenarios/patient-label';
import { MaturityMarker } from '@platform/governance/MaturityMarker';
import {
  EMPTY_CATALOG_QUERY,
  catalogQueryString,
  filterCatalog,
  hasCatalogFilters,
  readCatalogQuery,
  type CatalogQuery,
} from '@anesthesia/catalog/query';
import {
  PREPARATION_PATHS,
  pathMinutes,
  preparationPath,
  recommendNextScenario,
} from '@anesthesia/catalog/preparation-paths';
import { completedScenarioIds, loadPracticeHistory } from '@anesthesia/catalog/practice-history';
import {
  DEFAULT_EMERGENCY_MEDICINE_SCENARIO_ID,
  EMERGENCY_MEDICINE_SCENARIOS,
  getEmergencyMedicineScenario,
} from '../modules/emergency-medicine/scenarios';
import {
  CRITICAL_CARE_SCENARIOS, DEFAULT_CRITICAL_CARE_SCENARIO_ID, getCriticalCareScenario,
} from '../modules/critical-care/scenarios';
import {
  CARDIOLOGY_SCENARIOS, DEFAULT_CARDIOLOGY_SCENARIO_ID, getCardiologyScenario,
} from '../modules/cardiology/scenarios';
import {
  RESPIRATORY_MEDICINE_SCENARIOS, DEFAULT_RESPIRATORY_MEDICINE_SCENARIO_ID,
  getRespiratoryMedicineScenario,
} from '../modules/respiratory-medicine/scenarios';
import {
  PEDIATRICS_SCENARIOS, DEFAULT_PEDIATRICS_SCENARIO_ID, getPediatricsScenario,
} from '../modules/pediatrics/scenarios';
import {
  NEUROLOGY_SCENARIOS, DEFAULT_NEUROLOGY_SCENARIO_ID, getNeurologyScenario,
} from '../modules/neurology/scenarios';
import {
  TOXICOLOGY_SCENARIOS, DEFAULT_TOXICOLOGY_SCENARIO_ID, getToxicologyScenario,
} from '../modules/toxicology/scenarios';
import {
  OBSTETRICS_SCENARIOS, DEFAULT_OBSTETRICS_SCENARIO_ID, getObstetricsScenario,
} from '../modules/obstetrics/scenarios';
import {
  NEONATOLOGY_SCENARIOS, DEFAULT_NEONATOLOGY_SCENARIO_ID, getNeonatologyScenario,
} from '../modules/neonatology/scenarios';
import {
  ENDOCRINE_METABOLIC_SCENARIOS, DEFAULT_ENDOCRINE_METABOLIC_SCENARIO_ID,
  getEndocrineMetabolicScenario,
} from '../modules/endocrine-metabolic/scenarios';
import {
  RENAL_ELECTROLYTE_SCENARIOS, DEFAULT_RENAL_ELECTROLYTE_SCENARIO_ID,
  getRenalElectrolyteScenario,
} from '../modules/renal-electrolyte/scenarios';
import {
  INFECTIOUS_DISEASE_SCENARIOS, DEFAULT_INFECTIOUS_DISEASE_SCENARIO_ID,
  getInfectiousDiseaseScenario,
} from '../modules/infectious-disease/scenarios';
import { APP_VERSION } from '@platform/governance/status';
import { ScenarioProblemReport } from '@platform/reporting/ScenarioProblemReport';
import {
  REPORT_CONTEXT_ACTION_LIMIT, REPORT_CONTEXT_SNAPSHOT_LIMIT,
  type ReportContextScalar, type ReportSurface, type ScenarioReportRecentContext,
} from '@platform/reporting/contracts';
import { SITE_ORIGIN } from './site-metadata';

interface ClinicalModuleConfig {
  readonly id: 'anesthesia' | 'emergency-medicine' | 'critical-care' | 'cardiology' | 'respiratory-medicine' | 'pediatrics' | 'neurology' | 'toxicology' | 'obstetrics' | 'neonatology' | 'endocrine-metabolic' | 'renal-electrolyte' | 'infectious-disease';
  readonly basePath: '/anesthesia' | '/emergency-medicine' | '/critical-care' | '/cardiology' | '/respiratory-medicine' | '/pediatrics' | '/neurology' | '/toxicology' | '/obstetrics' | '/neonatology' | '/endocrine-metabolic' | '/renal-electrolyte' | '/infectious-disease';
  readonly heading: string;
  readonly catalogIntroduction: string;
  readonly catalogStatus: string;
  readonly scenarios: readonly Scenario[];
  readonly defaultScenarioId: string;
  readonly getScenario: (id: string) => Scenario | undefined;
}

const ANESTHESIA_CONFIG: ClinicalModuleConfig = {
  id: 'anesthesia', basePath: '/anesthesia', heading: 'Anesthesia simulator',
  catalogIntroduction: '', catalogStatus: '',
  scenarios: scenariosByDifficulty(), defaultScenarioId: DEFAULT_SCENARIO_ID, getScenario,
};

const EMERGENCY_MEDICINE_CONFIG: ClinicalModuleConfig = {
  id: 'emergency-medicine', basePath: '/emergency-medicine',
  heading: 'Emergency medicine simulator', scenarios: EMERGENCY_MEDICINE_SCENARIOS,
  catalogIntroduction: 'Short, focused emergency-department rehearsals. Start with one uncertain patient, make the next useful decision, then see exactly what your sequence established.',
  catalogStatus: 'Twenty-five bounded emergency medicine labs are playable.',
  defaultScenarioId: DEFAULT_EMERGENCY_MEDICINE_SCENARIO_ID,
  getScenario: getEmergencyMedicineScenario,
};

const CRITICAL_CARE_CONFIG: ClinicalModuleConfig = {
  id: 'critical-care', basePath: '/critical-care', heading: 'Critical care simulator',
  catalogIntroduction: 'Quiet ICU rehearsals for the decisions that change organ support. Read the trend, make one purposeful change, then reassess what actually moved.',
  catalogStatus: 'Twenty-four bounded critical care labs are playable.',
  scenarios: CRITICAL_CARE_SCENARIOS, defaultScenarioId: DEFAULT_CRITICAL_CARE_SCENARIO_ID,
  getScenario: getCriticalCareScenario,
};

const CARDIOLOGY_CONFIG: ClinicalModuleConfig = {
  id: 'cardiology', basePath: '/cardiology', heading: 'Cardiology simulator',
  catalogIntroduction: 'Calm cardiovascular rehearsals from clinic to inpatient care. Read the trajectory, surface what remains, and make each next step earn its place.',
  catalogStatus: 'All seventeen bounded cardiology labs are playable.',
  scenarios: CARDIOLOGY_SCENARIOS, defaultScenarioId: DEFAULT_CARDIOLOGY_SCENARIO_ID,
  getScenario: getCardiologyScenario,
};

const RESPIRATORY_MEDICINE_CONFIG: ClinicalModuleConfig = {
  id: 'respiratory-medicine', basePath: '/respiratory-medicine',
  heading: 'Respiratory medicine simulator',
  catalogIntroduction: 'Calm respiratory reassessment labs for the moment a familiar pattern changes. Read the trajectory, act on danger early, and leave the next team a clear map.',
  catalogStatus: `${RESPIRATORY_MEDICINE_SCENARIOS.length} bounded respiratory medicine labs are playable.`,
  scenarios: RESPIRATORY_MEDICINE_SCENARIOS,
  defaultScenarioId: DEFAULT_RESPIRATORY_MEDICINE_SCENARIO_ID,
  getScenario: getRespiratoryMedicineScenario,
};

const PEDIATRICS_CONFIG: ClinicalModuleConfig = {
  id: 'pediatrics', basePath: '/pediatrics', heading: 'Pediatrics simulator',
  catalogIntroduction: 'Gentle, focused rehearsals for noticing when a child is changing. Read the whole child, support early, and make every reassessment count.',
  catalogStatus: `${PEDIATRICS_SCENARIOS.length} of 16 bounded Pediatrics labs is playable.`,
  scenarios: PEDIATRICS_SCENARIOS, defaultScenarioId: DEFAULT_PEDIATRICS_SCENARIO_ID,
  getScenario: getPediatricsScenario,
};

const NEUROLOGY_CONFIG: ClinicalModuleConfig = {
  id: 'neurology', basePath: '/neurology', heading: 'Neurology simulator',
  catalogIntroduction: 'Calm neurological rehearsals for reading function, change, and uncertainty. Follow the trajectory, involve the right team, and leave unresolved risk visible.',
  catalogStatus: `${NEUROLOGY_SCENARIOS.length} of 15 bounded Neurology labs is playable.`,
  scenarios: NEUROLOGY_SCENARIOS, defaultScenarioId: DEFAULT_NEUROLOGY_SCENARIO_ID,
  getScenario: getNeurologyScenario,
};

const TOXICOLOGY_CONFIG: ClinicalModuleConfig = {
  id: 'toxicology', basePath: '/toxicology', heading: 'Toxicology simulator',
  catalogIntroduction: 'Calm poisoning rehearsals for finding the dangerous pattern without losing the whole patient. Support first, keep antidote hazards visible, and make reassessment count.',
  catalogStatus: `${TOXICOLOGY_SCENARIOS.length} of 15 bounded Toxicology labs is playable.`,
  scenarios: TOXICOLOGY_SCENARIOS, defaultScenarioId: DEFAULT_TOXICOLOGY_SCENARIO_ID,
  getScenario: getToxicologyScenario,
};

const OBSTETRICS_CONFIG: ClinicalModuleConfig = {
  id: 'obstetrics', basePath: '/obstetrics', heading: 'Obstetrics simulator',
  catalogIntroduction: 'Calm delivery-room rehearsals for recognizing change early, bringing the right team together, and protecting the whole family through reassessment and handoff.',
  catalogStatus: `${OBSTETRICS_SCENARIOS.length} of 15 bounded Obstetrics labs is playable.`,
  scenarios: OBSTETRICS_SCENARIOS, defaultScenarioId: DEFAULT_OBSTETRICS_SCENARIO_ID,
  getScenario: getObstetricsScenario,
};

const NEONATOLOGY_CONFIG: ClinicalModuleConfig = {
  id: 'neonatology', basePath: '/neonatology', heading: 'Neonatology simulator',
  catalogIntroduction: 'Quiet newborn rehearsals for protecting transition, noticing change early, and keeping the parent-newborn dyad at the center of every handoff.',
  catalogStatus: `${NEONATOLOGY_SCENARIOS.length} of 11 bounded Neonatology labs is playable.`,
  scenarios: NEONATOLOGY_SCENARIOS, defaultScenarioId: DEFAULT_NEONATOLOGY_SCENARIO_ID,
  getScenario: getNeonatologyScenario,
};

const ENDOCRINE_METABOLIC_CONFIG: ClinicalModuleConfig = {
  id: 'endocrine-metabolic', basePath: '/endocrine-metabolic',
  heading: 'Endocrine and metabolic medicine simulator',
  catalogIntroduction: 'Calm metabolic rehearsals for reading the biochemical trajectory without losing the whole person. Keep treatment continuity, transition safety, and recurrence prevention visible.',
  catalogStatus: `${ENDOCRINE_METABOLIC_SCENARIOS.length} of 12 planned Endocrine and Metabolic Medicine labs are available as previews. Registration does not establish completed review.`,
  scenarios: ENDOCRINE_METABOLIC_SCENARIOS,
  defaultScenarioId: DEFAULT_ENDOCRINE_METABOLIC_SCENARIO_ID,
  getScenario: getEndocrineMetabolicScenario,
};

const RENAL_ELECTROLYTE_CONFIG: ClinicalModuleConfig = {
  id: 'renal-electrolyte', basePath: '/renal-electrolyte',
  heading: 'Renal and Electrolyte Medicine simulator',
  catalogIntroduction: 'Calm kidney and electrolyte rehearsals for protecting the person while following the trajectory. Distinguish immediate protection from correction, reassess what changed, and keep recurrent risk visible.',
  catalogStatus: `${RENAL_ELECTROLYTE_SCENARIOS.length} of 12 planned Renal and Electrolyte Medicine labs are available as previews. Registration does not establish completed review.`,
  scenarios: RENAL_ELECTROLYTE_SCENARIOS,
  defaultScenarioId: DEFAULT_RENAL_ELECTROLYTE_SCENARIO_ID,
  getScenario: getRenalElectrolyteScenario,
};

const INFECTIOUS_DISEASE_CONFIG: ClinicalModuleConfig = {
  id: 'infectious-disease', basePath: '/infectious-disease',
  heading: 'Infectious disease simulator',
  catalogIntroduction: 'Calm infection rehearsals for seeing the dangerous pattern early and acting on it in time. Recognize without closing the diagnosis, activate the right people, and keep the treatment boundary and the unresolved risk visible.',
  catalogStatus: `${INFECTIOUS_DISEASE_SCENARIOS.length} of 10 planned Infectious disease labs are available as previews. Registration does not establish completed review.`,
  scenarios: INFECTIOUS_DISEASE_SCENARIOS,
  defaultScenarioId: DEFAULT_INFECTIOUS_DISEASE_SCENARIO_ID,
  getScenario: getInfectiousDiseaseScenario,
};

/**
 * The scenario a path names.
 *
 * `missingId` is the whole point of the return shape. This used to fall back to
 * the default scenario for ANY unrecognised id, so `/anesthesia/scenario/
 * bronchspasm` opened routine induction with the wrong URL still in the bar and
 * nothing said otherwise. An instructor who typed a scenario id wrong in a
 * cohort link would have sent thirty students to the wrong case without one of
 * them being told.
 */
function scenarioForPath(
  path: string,
  config: ClinicalModuleConfig,
): { scenario: Scenario; missingId: string | null } {
  const fallback = config.getScenario(config.defaultScenarioId)!;
  const prefix = `${config.basePath}/scenario/`;
  if (!path.startsWith(prefix)) return { scenario: fallback, missingId: null };
  const id = path.slice(prefix.length).replace(/\/+$/, '');
  const found = config.getScenario(id);
  if (found) return { scenario: found, missingId: null };
  // The id is shown back to whoever followed the link, bounded, because it came
  // from a URL and a URL can carry anything.
  return { scenario: fallback, missingId: id.slice(0, 80) };
}

/** A seed derived from the scenario rather than from a clock, so a session replays. */
const DEFAULT_SEED = 20260819;

function boundedScalars(value: unknown, limit: number): Record<string, ReportContextScalar> {
  const result: Record<string, ReportContextScalar> = {};
  const visit = (node: unknown, path: string) => {
    if (Object.keys(result).length >= limit) return;
    if (node === null || typeof node === 'boolean'
      || (typeof node === 'number' && Number.isFinite(node))) {
      if (path) result[path.slice(0, 80)] = node;
      return;
    }
    if (typeof node === 'string') {
      if (path && /^[a-zA-Z0-9_.-]+$/.test(node)) result[path.slice(0, 80)] = node.slice(0, 80);
      return;
    }
    if (!node || typeof node !== 'object' || Array.isArray(node)) return;
    for (const [key, child] of Object.entries(node as Record<string, unknown>).sort()) {
      visit(child, path ? `${path}.${key}` : key);
      if (Object.keys(result).length >= limit) break;
    }
  };
  visit(value, '');
  return result;
}

export function collectReportEquipmentContext(equipment: SessionState['equipment']): Record<string, ReportContextScalar> {
  const magnesium = equipment?.resuscitation.renalHypermagnesemia;
  if (magnesium) {
    return boundedScalars({ resuscitation: { renalHypermagnesemia: {
      supportActive: magnesium.supportActive, stopMagnesiumAtTick: magnesium.stopMagnesiumAtTick,
      breathingAtTick: magnesium.breathingAtTick, calciumAtTick: magnesium.calciumAtTick,
      lastCalciumAtTick: magnesium.lastCalciumAtTick, calciumRequests: magnesium.calciumRequests,
      contextReviewedAtTick: magnesium.contextReviewedAtTick, removalAtTick: magnesium.removalAtTick,
      monitoringAtTick: magnesium.monitoringAtTick, calciumResponseObserved: magnesium.calciumResponseObserved,
      removalResponseObserved: magnesium.removalResponseObserved, recurrenceObserved: magnesium.recurrenceObserved,
      calciumClearanceAttempted: magnesium.calciumClearanceAttempted, routineDiuresisAttempted: magnesium.routineDiuresisAttempted,
      ended: magnesium.ended,
      magnesiumObservation: magnesium.magnesiumObservation ? {
        atTick: magnesium.magnesiumObservation.atTick, magnesiumMmolL: magnesium.magnesiumObservation.magnesiumMmolL,
      } : null,
      neuromuscularObservation: magnesium.neuromuscularObservation ? {
        atTick: magnesium.neuromuscularObservation.atTick, reflexesPresent: magnesium.neuromuscularObservation.reflexesPresent,
        severeWeakness: magnesium.neuromuscularObservation.severeWeakness,
      } : null,
      observation: magnesium.observation ? {
        atTick: magnesium.observation.atTick, magnesiumMmolL: magnesium.observation.magnesiumMmolL,
        reflexesPresent: magnesium.observation.reflexesPresent, severeWeakness: magnesium.observation.severeWeakness,
        systolicMmHg: magnesium.observation.systolicMmHg, diastolicMmHg: magnesium.observation.diastolicMmHg,
        meanArterialMmHg: magnesium.observation.meanArterialMmHg, heartRateBpm: magnesium.observation.heartRateBpm,
        respiratoryRateBpm: magnesium.observation.respiratoryRateBpm, spo2Percent: magnesium.observation.spo2Percent,
        coreTemperatureC: magnesium.observation.coreTemperatureC,
      } : null,
    } } }, REPORT_CONTEXT_SNAPSHOT_LIMIT);
  }
  const calcium = equipment?.resuscitation.renalHypocalcemia;
  if (calcium) {
    return boundedScalars({ resuscitation: { renalHypocalcemia: {
      supportActive: calcium.supportActive, rescueAtTick: calcium.rescueAtTick, continuingAtTick: calcium.continuingAtTick,
      contextReviewedAtTick: calcium.contextReviewedAtTick, monitoringAtTick: calcium.monitoringAtTick,
      mineralCareAtTick: calcium.mineralCareAtTick, followUpAtTick: calcium.followUpAtTick,
      rescueResponseObserved: calcium.rescueResponseObserved, continuingResponseObserved: calcium.continuingResponseObserved,
      recurrenceObserved: calcium.recurrenceObserved, adjustedReassuranceAttempted: calcium.adjustedReassuranceAttempted,
      oralOnlyAttempted: calcium.oralOnlyAttempted, stoppedAfterReliefAttempted: calcium.stoppedAfterReliefAttempted,
      ended: calcium.ended,
      ionizedObservation: calcium.ionizedObservation ? {
        atTick: calcium.ionizedObservation.atTick, ionizedCalciumMmolL: calcium.ionizedObservation.ionizedCalciumMmolL,
      } : null,
      symptomObservation: calcium.symptomObservation ? {
        atTick: calcium.symptomObservation.atTick, carpopedalSpasm: calcium.symptomObservation.carpopedalSpasm,
        perioralTingling: calcium.symptomObservation.perioralTingling,
      } : null,
      observation: calcium.observation ? {
        atTick: calcium.observation.atTick, ionizedCalciumMmolL: calcium.observation.ionizedCalciumMmolL,
        carpopedalSpasm: calcium.observation.carpopedalSpasm, perioralTingling: calcium.observation.perioralTingling,
        systolicMmHg: calcium.observation.systolicMmHg, diastolicMmHg: calcium.observation.diastolicMmHg,
        meanArterialMmHg: calcium.observation.meanArterialMmHg, heartRateBpm: calcium.observation.heartRateBpm,
        respiratoryRateBpm: calcium.observation.respiratoryRateBpm, spo2Percent: calcium.observation.spo2Percent,
        coreTemperatureC: calcium.observation.coreTemperatureC,
      } : null,
    } } }, REPORT_CONTEXT_SNAPSHOT_LIMIT);
  }
  const water = equipment?.resuscitation.renalHypernatremia;
  if (water) {
    return boundedScalars({ resuscitation: { renalHypernatremia: {
      supportActive: water.supportActive, contextReviewedAtTick: water.contextReviewedAtTick,
      monitoringAtTick: water.monitoringAtTick, volumeAtTick: water.volumeAtTick,
      waterAtTick: water.waterAtTick, lossManagementAtTick: water.lossManagementAtTick, waterAccessAtTick: water.waterAccessAtTick,
      volumeObserved: water.volumeObserved, waterResponseObserved: water.waterResponseObserved,
      combinedResponseObserved: water.combinedResponseObserved, recurrenceObserved: water.recurrenceObserved,
      empiricDesmopressinAttempted: water.empiricDesmopressinAttempted, normalizationAttempted: water.normalizationAttempted,
      ended: water.ended,
      sodiumObservation: water.sodiumObservation ? {
        atTick: water.sodiumObservation.atTick, sodiumMmolL: water.sodiumObservation.sodiumMmolL,
        changeFromBaselineMmolL: water.sodiumObservation.changeFromBaselineMmolL,
      } : null,
      fluidBalanceObservation: water.fluidBalanceObservation ? {
        atTick: water.fluidBalanceObservation.atTick, urineOutputMlPerHour: water.fluidBalanceObservation.urineOutputMlPerHour,
        ongoingDiarrhea: water.fluidBalanceObservation.ongoingDiarrhea,
      } : null,
      observation: water.observation ? {
        atTick: water.observation.atTick, sodiumMmolL: water.observation.sodiumMmolL,
        changeFromBaselineMmolL: water.observation.changeFromBaselineMmolL,
        urineOutputMlPerHour: water.observation.urineOutputMlPerHour, ongoingDiarrhea: water.observation.ongoingDiarrhea,
        systolicMmHg: water.observation.systolicMmHg, diastolicMmHg: water.observation.diastolicMmHg,
        meanArterialMmHg: water.observation.meanArterialMmHg, heartRateBpm: water.observation.heartRateBpm,
        respiratoryRateBpm: water.observation.respiratoryRateBpm, spo2Percent: water.observation.spo2Percent,
        coreTemperatureC: water.observation.coreTemperatureC,
      } : null,
    } } }, REPORT_CONTEXT_SNAPSHOT_LIMIT);
  }
  const sodium = equipment?.resuscitation.renalHyponatremia;
  if (sodium) {
    return boundedScalars({ resuscitation: { renalHyponatremia: {
      supportActive: sodium.supportActive, contextReviewedAtTick: sodium.contextReviewedAtTick,
      monitoringAtTick: sodium.monitoringAtTick, rescueAtTick: sodium.rescueAtTick,
      additionalRescueAtTick: sodium.additionalRescueAtTick, neurologicReviewAtTick: sodium.neurologicReviewAtTick,
      initialResponseObserved: sodium.initialResponseObserved, additionalResponseObserved: sodium.additionalResponseObserved,
      persistentSymptomsObserved: sodium.persistentSymptomsObserved, sodiumNormalizationAttempted: sodium.sodiumNormalizationAttempted,
      numberOnlyRecoveryAttempted: sodium.numberOnlyRecoveryAttempted, siadhLabelAttempted: sodium.siadhLabelAttempted,
      ended: sodium.ended,
      sodiumObservation: sodium.sodiumObservation ? {
        atTick: sodium.sodiumObservation.atTick, sodiumMmolL: sodium.sodiumObservation.sodiumMmolL,
        changeFromBaselineMmolL: sodium.sodiumObservation.changeFromBaselineMmolL,
      } : null,
      neurologicObservation: sodium.neurologicObservation ? {
        atTick: sodium.neurologicObservation.atTick, headache: sodium.neurologicObservation.headache, nausea: sodium.neurologicObservation.nausea,
      } : null,
      observation: sodium.observation ? {
        atTick: sodium.observation.atTick, sodiumMmolL: sodium.observation.sodiumMmolL,
        changeFromBaselineMmolL: sodium.observation.changeFromBaselineMmolL,
        headache: sodium.observation.headache, nausea: sodium.observation.nausea,
        systolicMmHg: sodium.observation.systolicMmHg, diastolicMmHg: sodium.observation.diastolicMmHg,
        meanArterialMmHg: sodium.observation.meanArterialMmHg, heartRateBpm: sodium.observation.heartRateBpm,
        respiratoryRateBpm: sodium.observation.respiratoryRateBpm, spo2Percent: sodium.observation.spo2Percent,
        coreTemperatureC: sodium.observation.coreTemperatureC,
      } : null,
    } } }, REPORT_CONTEXT_SNAPSHOT_LIMIT);
  }
  const hypokalemia = equipment?.resuscitation.renalHypokalemia;
  if (hypokalemia) {
    return boundedScalars({ resuscitation: { renalHypokalemia: {
      supportActive: hypokalemia.supportActive, contextReviewedAtTick: hypokalemia.contextReviewedAtTick,
      monitoringAtTick: hypokalemia.monitoringAtTick, potassiumAtTick: hypokalemia.potassiumAtTick,
      magnesiumAtTick: hypokalemia.magnesiumAtTick, lossManagementAtTick: hypokalemia.lossManagementAtTick,
      potassiumResponseObserved: hypokalemia.potassiumResponseObserved, magnesiumResponseObserved: hypokalemia.magnesiumResponseObserved,
      responseObserved: hypokalemia.responseObserved, recurrenceObserved: hypokalemia.recurrenceObserved,
      rapidPotassiumAttempted: hypokalemia.rapidPotassiumAttempted, monitoringStopAttempted: hypokalemia.monitoringStopAttempted,
      ended: hypokalemia.ended,
      potassiumObservation: hypokalemia.potassiumObservation ? {
        atTick: hypokalemia.potassiumObservation.atTick, potassiumMmolL: hypokalemia.potassiumObservation.potassiumMmolL,
      } : null,
      ecgObservation: hypokalemia.ecgObservation ? { atTick: hypokalemia.ecgObservation.atTick, rhythm: hypokalemia.ecgObservation.rhythm } : null,
      observation: hypokalemia.observation ? {
        atTick: hypokalemia.observation.atTick, potassiumMmolL: hypokalemia.observation.potassiumMmolL,
        magnesiumMmolL: hypokalemia.observation.magnesiumMmolL, rhythm: hypokalemia.observation.rhythm,
        systolicMmHg: hypokalemia.observation.systolicMmHg, diastolicMmHg: hypokalemia.observation.diastolicMmHg,
        meanArterialMmHg: hypokalemia.observation.meanArterialMmHg, heartRateBpm: hypokalemia.observation.heartRateBpm,
        respiratoryRateBpm: hypokalemia.observation.respiratoryRateBpm, spo2Percent: hypokalemia.observation.spo2Percent,
        coreTemperatureC: hypokalemia.observation.coreTemperatureC,
      } : null,
    } } }, REPORT_CONTEXT_SNAPSHOT_LIMIT);
  }
  const renal = equipment?.resuscitation.renalHyperkalemia;
  if (renal) {
    return boundedScalars({ resuscitation: { renalHyperkalemia: {
      supportActive: renal.supportActive, contextReviewedAtTick: renal.contextReviewedAtTick,
      removalPlanAtTick: renal.removalPlanAtTick, monitoringAtTick: renal.monitoringAtTick,
      calciumAtTick: renal.calciumAtTick, lastCalciumAtTick: renal.lastCalciumAtTick,
      calciumRequests: renal.calciumRequests, shiftAtTick: renal.shiftAtTick, removalAtTick: renal.removalAtTick,
      shiftResponseObserved: renal.shiftResponseObserved, removalResponseObserved: renal.removalResponseObserved,
      reboundObserved: renal.reboundObserved, ecgResolvedAttempted: renal.ecgResolvedAttempted,
      glucoseMonitoringStopAttempted: renal.glucoseMonitoringStopAttempted, ended: renal.ended,
      ecgObservation: renal.ecgObservation ? { atTick: renal.ecgObservation.atTick, rhythm: renal.ecgObservation.rhythm } : null,
      glucoseObservation: renal.glucoseObservation ? { atTick: renal.glucoseObservation.atTick, glucoseMgDl: renal.glucoseObservation.glucoseMgDl } : null,
      observation: renal.observation ? {
        atTick: renal.observation.atTick, potassiumMmolL: renal.observation.potassiumMmolL,
        glucoseMgDl: renal.observation.glucoseMgDl, rhythm: renal.observation.rhythm,
        systolicMmHg: renal.observation.systolicMmHg, diastolicMmHg: renal.observation.diastolicMmHg,
        meanArterialMmHg: renal.observation.meanArterialMmHg, heartRateBpm: renal.observation.heartRateBpm,
        respiratoryRateBpm: renal.observation.respiratoryRateBpm, spo2Percent: renal.observation.spo2Percent,
        coreTemperatureC: renal.observation.coreTemperatureC,
      } : null,
    } } }, REPORT_CONTEXT_SNAPSHOT_LIMIT);
  }
  const diabetes = equipment?.resuscitation.perioperativeDiabetes;
  if (diabetes) {
    return boundedScalars({ resuscitation: { perioperativeDiabetes: {
      supportActive: diabetes.supportActive, contextReviewedAtTick: diabetes.contextReviewedAtTick,
      fastingPlanAtTick: diabetes.fastingPlanAtTick, monitoringAtTick: diabetes.monitoringAtTick,
      insulinAtTick: diabetes.insulinAtTick, earlyResponseObserved: diabetes.earlyResponseObserved,
      responseObserved: diabetes.responseObserved, deteriorationObserved: diabetes.deteriorationObserved,
      omitInsulinAttempted: diabetes.omitInsulinAttempted, cgmOnlyAttempted: diabetes.cgmOnlyAttempted,
      clearanceAttempted: diabetes.clearanceAttempted, ended: diabetes.ended,
      glucoseObservation: diabetes.glucoseObservation ? {
        atTick: diabetes.glucoseObservation.atTick, glucoseMgDl: diabetes.glucoseObservation.glucoseMgDl,
      } : null,
      observation: diabetes.observation ? {
        atTick: diabetes.observation.atTick, glucoseMgDl: diabetes.observation.glucoseMgDl,
        ketonesMmolL: diabetes.observation.ketonesMmolL,
        systolicMmHg: diabetes.observation.systolicMmHg, diastolicMmHg: diabetes.observation.diastolicMmHg,
        meanArterialMmHg: diabetes.observation.meanArterialMmHg, heartRateBpm: diabetes.observation.heartRateBpm,
        respiratoryRateBpm: diabetes.observation.respiratoryRateBpm, spo2Percent: diabetes.observation.spo2Percent,
        coreTemperatureC: diabetes.observation.coreTemperatureC,
      } : null,
    } } }, REPORT_CONTEXT_SNAPSHOT_LIMIT);
  }
  const refeeding = equipment?.resuscitation.refeeding;
  if (refeeding) {
    return boundedScalars({ resuscitation: { refeeding: {
      supportActive: refeeding.supportActive, contextReviewedAtTick: refeeding.contextReviewedAtTick,
      monitoringAtTick: refeeding.monitoringAtTick, thiamineAtTick: refeeding.thiamineAtTick,
      phosphateAtTick: refeeding.phosphateAtTick, completeElectrolytesAtTick: refeeding.completeElectrolytesAtTick,
      nutritionPlanAtTick: refeeding.nutritionPlanAtTick, electrolyteResponseObserved: refeeding.electrolyteResponseObserved,
      responseObserved: refeeding.responseObserved, recurrentDeclineObserved: refeeding.recurrentDeclineObserved,
      feedingAdvanceAttempted: refeeding.feedingAdvanceAttempted, monitoringStopAttempted: refeeding.monitoringStopAttempted,
      ended: refeeding.ended,
      observation: refeeding.observation ? {
        atTick: refeeding.observation.atTick, phosphateMmolL: refeeding.observation.phosphateMmolL,
        potassiumMmolL: refeeding.observation.potassiumMmolL, magnesiumMmolL: refeeding.observation.magnesiumMmolL,
        systolicMmHg: refeeding.observation.systolicMmHg, diastolicMmHg: refeeding.observation.diastolicMmHg,
        meanArterialMmHg: refeeding.observation.meanArterialMmHg, heartRateBpm: refeeding.observation.heartRateBpm,
        respiratoryRateBpm: refeeding.observation.respiratoryRateBpm, spo2Percent: refeeding.observation.spo2Percent,
        coreTemperatureC: refeeding.observation.coreTemperatureC,
      } : null,
    } } }, REPORT_CONTEXT_SNAPSHOT_LIMIT);
  }
  const avp = equipment?.resuscitation.avpDeficiency;
  if (avp) {
    return boundedScalars({ resuscitation: { avpDeficiency: {
      supportActive: avp.supportActive, contextReviewedAtTick: avp.contextReviewedAtTick,
      monitoringAtTick: avp.monitoringAtTick, volumeAtTick: avp.volumeAtTick,
      waterAtTick: avp.waterAtTick, desmopressinAtTick: avp.desmopressinAtTick,
      circulationRestored: avp.circulationRestored, volumeObserved: avp.volumeObserved,
      diluteLossesObserved: avp.diluteLossesObserved, responseObserved: avp.responseObserved,
      peakObservedSodiumMmolL: avp.peakObservedSodiumMmolL, volumeDelayed: avp.volumeDelayed,
      normalizationAttempted: avp.normalizationAttempted, withholdingChosen: avp.withholdingChosen, ended: avp.ended,
      observation: avp.observation ? {
        atTick: avp.observation.atTick, sodiumMmolL: avp.observation.sodiumMmolL,
        urineOutputMlPerHour: avp.observation.urineOutputMlPerHour,
        urineOsmolalityMosmPerKg: avp.observation.urineOsmolalityMosmPerKg,
        systolicMmHg: avp.observation.systolicMmHg, diastolicMmHg: avp.observation.diastolicMmHg,
        meanArterialMmHg: avp.observation.meanArterialMmHg, heartRateBpm: avp.observation.heartRateBpm,
        respiratoryRateBpm: avp.observation.respiratoryRateBpm, spo2Percent: avp.observation.spo2Percent,
        coreTemperatureC: avp.observation.coreTemperatureC,
      } : null,
    } } }, REPORT_CONTEXT_SNAPSHOT_LIMIT);
  }
  const hyponatremia = equipment?.resuscitation.hyponatremiaCorrection;
  if (hyponatremia) {
    // Only requested historical results and observed peak belong in a report.
    // Do not fill spare capacity with latent sodium, branch state, or inactive equipment defaults.
    return boundedScalars({ resuscitation: { hyponatremiaCorrection: {
      supportActive: hyponatremia.supportActive, riskReviewedAtTick: hyponatremia.riskReviewedAtTick,
      monitoringAtTick: hyponatremia.monitoringAtTick, waterLossControlAtTick: hyponatremia.waterLossControlAtTick,
      reloweringAtTick: hyponatremia.reloweringAtTick, aquaresisDueInSeconds: hyponatremia.aquaresisDueInSeconds,
      responseDueInSeconds: hyponatremia.responseDueInSeconds, aquaresisObserved: hyponatremia.aquaresisObserved,
      overcorrectionObserved: hyponatremia.overcorrectionObserved, responseObserved: hyponatremia.responseObserved,
      peakObservedSodiumMmolL: hyponatremia.peakObservedSodiumMmolL,
      normalizationAttempted: hyponatremia.normalizationAttempted, symptomWaitChosen: hyponatremia.symptomWaitChosen,
      ended: hyponatremia.ended,
      observation: hyponatremia.observation ? {
        atTick: hyponatremia.observation.atTick, sodiumMmolL: hyponatremia.observation.sodiumMmolL,
        urineOutputMlPerHour: hyponatremia.observation.urineOutputMlPerHour,
        systolicMmHg: hyponatremia.observation.systolicMmHg, diastolicMmHg: hyponatremia.observation.diastolicMmHg,
        meanArterialMmHg: hyponatremia.observation.meanArterialMmHg, heartRateBpm: hyponatremia.observation.heartRateBpm,
        respiratoryRateBpm: hyponatremia.observation.respiratoryRateBpm, spo2Percent: hyponatremia.observation.spo2Percent,
        coreTemperatureC: hyponatremia.observation.coreTemperatureC,
      } : null,
    } } }, REPORT_CONTEXT_SNAPSHOT_LIMIT);
  }
  const hypocalcemia = equipment?.resuscitation.hypocalcemia;
  if (hypocalcemia && equipment) {
    const priority = boundedScalars({ resuscitation: { hypocalcemia: {
      supportActive: hypocalcemia.supportActive, riskAssessedAtTick: hypocalcemia.riskAssessedAtTick,
      causeReviewedAtTick: hypocalcemia.causeReviewedAtTick, calciumAtTick: hypocalcemia.calciumAtTick,
      magnesiumAtTick: hypocalcemia.magnesiumAtTick, continuingCareAtTick: hypocalcemia.continuingCareAtTick,
      calciumDueInSeconds: hypocalcemia.calciumDueInSeconds, responseDueInSeconds: hypocalcemia.responseDueInSeconds,
      calciumResponseObserved: hypocalcemia.calciumResponseObserved, responseObserved: hypocalcemia.responseObserved,
      urgentTreatmentDelayed: hypocalcemia.urgentTreatmentDelayed, recurrenceOccurred: hypocalcemia.recurrenceOccurred,
      oralOnlyChosen: hypocalcemia.oralOnlyChosen, waitForLabsChosen: hypocalcemia.waitForLabsChosen,
      waitForMagnesiumChosen: hypocalcemia.waitForMagnesiumChosen,
      stopAfterReliefAttempted: hypocalcemia.stopAfterReliefAttempted, ended: hypocalcemia.ended,
      observation: hypocalcemia.observation ? {
        atTick: hypocalcemia.observation.atTick, systolicMmHg: hypocalcemia.observation.systolicMmHg,
        diastolicMmHg: hypocalcemia.observation.diastolicMmHg, meanArterialMmHg: hypocalcemia.observation.meanArterialMmHg,
        heartRateBpm: hypocalcemia.observation.heartRateBpm, respiratoryRateBpm: hypocalcemia.observation.respiratoryRateBpm,
        spo2Percent: hypocalcemia.observation.spo2Percent, coreTemperatureC: hypocalcemia.observation.coreTemperatureC,
        adjustedCalciumMgDl: hypocalcemia.observation.adjustedCalciumMgDl,
      } : null,
    } } }, REPORT_CONTEXT_SNAPSHOT_LIMIT);
    const remaining = { ...equipment, resuscitation: { ...equipment.resuscitation, hypocalcemia: undefined } };
    return { ...priority, ...boundedScalars(remaining, REPORT_CONTEXT_SNAPSHOT_LIMIT - Object.keys(priority).length) };
  }
  const hypercalcemia = equipment?.resuscitation.hypercalcemia;
  if (hypercalcemia && equipment) {
    const priority = boundedScalars({ resuscitation: { hypercalcemia: {
      supportActive: hypercalcemia.supportActive, cardiorenalAssessedAtTick: hypercalcemia.cardiorenalAssessedAtTick,
      fluidsAtTick: hypercalcemia.fluidsAtTick, calcitoninAtTick: hypercalcemia.calcitoninAtTick,
      antiresorptiveAtTick: hypercalcemia.antiresorptiveAtTick,
      fluidDueInSeconds: hypercalcemia.fluidDueInSeconds, bridgeDueInSeconds: hypercalcemia.bridgeDueInSeconds,
      fluidResponseObserved: hypercalcemia.fluidResponseObserved, bridgeResponseObserved: hypercalcemia.bridgeResponseObserved,
      urgentTreatmentDelayed: hypercalcemia.urgentTreatmentDelayed,
      unrestrictedFluidsAttempted: hypercalcemia.unrestrictedFluidsAttempted,
      routineDiureticAttempted: hypercalcemia.routineDiureticAttempted, waitForCauseChosen: hypercalcemia.waitForCauseChosen,
      ended: hypercalcemia.ended,
      observation: hypercalcemia.observation ? {
        atTick: hypercalcemia.observation.atTick, systolicMmHg: hypercalcemia.observation.systolicMmHg,
        diastolicMmHg: hypercalcemia.observation.diastolicMmHg, meanArterialMmHg: hypercalcemia.observation.meanArterialMmHg,
        heartRateBpm: hypercalcemia.observation.heartRateBpm, respiratoryRateBpm: hypercalcemia.observation.respiratoryRateBpm,
        spo2Percent: hypercalcemia.observation.spo2Percent, coreTemperatureC: hypercalcemia.observation.coreTemperatureC,
        adjustedCalciumMgDl: hypercalcemia.observation.adjustedCalciumMgDl,
      } : null,
    } } }, REPORT_CONTEXT_SNAPSHOT_LIMIT);
    const remaining = { ...equipment, resuscitation: { ...equipment.resuscitation, hypercalcemia: undefined } };
    return { ...priority, ...boundedScalars(remaining, REPORT_CONTEXT_SNAPSHOT_LIMIT - Object.keys(priority).length) };
  }
  const myxedema = equipment?.resuscitation.myxedema;
  if (myxedema && equipment) {
    const priority = boundedScalars({ resuscitation: { myxedema: {
      supportActive: myxedema.supportActive, ventilationAtTick: myxedema.ventilationAtTick,
      oxygenOnlyAtTick: myxedema.oxygenOnlyAtTick, hydrocortisoneAtTick: myxedema.hydrocortisoneAtTick,
      levothyroxineAtTick: myxedema.levothyroxineAtTick, supportiveCareAtTick: myxedema.supportiveCareAtTick,
      ventilationDueInSeconds: myxedema.ventilationDueInSeconds, responseDueInSeconds: myxedema.responseDueInSeconds,
      respiratorySupportObserved: myxedema.respiratorySupportObserved, responseObserved: myxedema.responseObserved,
      ventilationDelayed: myxedema.ventilationDelayed, endocrineTreatmentDelayed: myxedema.endocrineTreatmentDelayed,
      waitForLabsChosen: myxedema.waitForLabsChosen, earlyThyroxineAttempted: myxedema.earlyThyroxineAttempted,
      rapidRewarmingAttempted: myxedema.rapidRewarmingAttempted, ended: myxedema.ended,
      observation: myxedema.observation ? {
        atTick: myxedema.observation.atTick, systolicMmHg: myxedema.observation.systolicMmHg,
        diastolicMmHg: myxedema.observation.diastolicMmHg, meanArterialMmHg: myxedema.observation.meanArterialMmHg,
        heartRateBpm: myxedema.observation.heartRateBpm, respiratoryRateBpm: myxedema.observation.respiratoryRateBpm,
        spo2Percent: myxedema.observation.spo2Percent, coreTemperatureC: myxedema.observation.coreTemperatureC,
        paco2MmHg: myxedema.observation.paco2MmHg,
      } : null,
    } } }, 32);
    const remaining = { ...equipment, resuscitation: { ...equipment.resuscitation, myxedema: undefined } };
    return { ...priority, ...boundedScalars(remaining, 32 - Object.keys(priority).length) };
  }
  const thyroid = equipment?.resuscitation.thyroidStorm;
  if (thyroid && equipment) {
    const priority = boundedScalars({ resuscitation: { thyroidStorm: {
      supportActive: thyroid.supportActive, synthesisAtTick: thyroid.synthesisAtTick,
      supportiveCareAtTick: thyroid.supportiveCareAtTick, circulationAssessedAtTick: thyroid.circulationAssessedAtTick,
      rateControlReviewedAtTick: thyroid.rateControlReviewedAtTick, iodineAtTick: thyroid.iodineAtTick,
      iodineDueInSeconds: thyroid.iodineDueInSeconds, responseDueInSeconds: thyroid.responseDueInSeconds,
      responseObserved: thyroid.responseObserved, urgentCoverageDelayed: thyroid.urgentCoverageDelayed,
      waitForLabsChosen: thyroid.waitForLabsChosen, blanketBetaBlockadeChosen: thyroid.blanketBetaBlockadeChosen,
      earlyIodineAttempted: thyroid.earlyIodineAttempted, ended: thyroid.ended,
      circulationRisk: thyroid.circulationRisk,
      observation: thyroid.observation ? {
        atTick: thyroid.observation.atTick, systolicMmHg: thyroid.observation.systolicMmHg,
        diastolicMmHg: thyroid.observation.diastolicMmHg, meanArterialMmHg: thyroid.observation.meanArterialMmHg,
        heartRateBpm: thyroid.observation.heartRateBpm, respiratoryRateBpm: thyroid.observation.respiratoryRateBpm,
        spo2Percent: thyroid.observation.spo2Percent, coreTemperatureC: thyroid.observation.coreTemperatureC,
      } : null,
    } } }, REPORT_CONTEXT_SNAPSHOT_LIMIT);
    const remaining = { ...equipment, resuscitation: { ...equipment.resuscitation, thyroidStorm: undefined } };
    return { ...priority, ...boundedScalars(remaining, REPORT_CONTEXT_SNAPSHOT_LIMIT - Object.keys(priority).length) };
  }
  const adrenal = equipment?.resuscitation.adrenalCrisis;
  // Preserve the active lesson within the existing privacy budget. Never copy
  // feedback, prose, arbitrary nested values, or hidden medication findings.
  const priority = adrenal ? boundedScalars({ resuscitation: { adrenalCrisis: {
    supportActive: adrenal.supportActive, hydrocortisoneAtTick: adrenal.hydrocortisoneAtTick,
    salineAtTick: adrenal.salineAtTick, recordReviewed: adrenal.recordReviewed,
    preventionPlanned: adrenal.preventionPlanned, responseObserved: adrenal.responseObserved,
    responseDueInSeconds: adrenal.responseDueInSeconds, ended: adrenal.ended,
    observation: adrenal.observation ? {
      atTick: adrenal.observation.atTick, systolicMmHg: adrenal.observation.systolicMmHg,
      diastolicMmHg: adrenal.observation.diastolicMmHg, meanArterialMmHg: adrenal.observation.meanArterialMmHg,
      heartRateBpm: adrenal.observation.heartRateBpm, respiratoryRateBpm: adrenal.observation.respiratoryRateBpm,
    } : null,
  } } }, REPORT_CONTEXT_SNAPSHOT_LIMIT) : {};
  const remaining = adrenal && equipment
    ? { ...equipment, resuscitation: { ...equipment.resuscitation, adrenalCrisis: undefined } }
    : equipment;
  return { ...priority, ...boundedScalars(remaining, REPORT_CONTEXT_SNAPSHOT_LIMIT - Object.keys(priority).length) };
}

function collectReportRecentContext(session: SessionState, seed: number, sodiumLesson: boolean, avpLesson: boolean, refeedingLesson: boolean, diabetesLesson: boolean, renalLesson: boolean, hypokalemiaLesson: boolean, renalSodiumLesson: boolean, renalWaterLesson: boolean, renalCalciumLesson: boolean, renalMagnesiumLesson: boolean, meningococcalLesson: boolean): ScenarioReportRecentContext {
  const actions = sessionInternals().recorder?.build('pending').actions ?? [];
  return {
    seed: Math.trunc(seed),
    actions: meningococcalLesson ? meningococcalSepsisReportActions(actions, session.log)
      : renalMagnesiumLesson ? renalHypermagnesemiaReportActions(actions, session.log)
      : renalCalciumLesson ? renalHypocalcemiaReportActions(actions, session.log)
      : renalWaterLesson ? renalHypernatremiaReportActions(actions, session.log)
      : renalSodiumLesson ? renalHyponatremiaReportActions(actions, session.log)
      : hypokalemiaLesson ? renalHypokalemiaReportActions(actions, session.log)
      : renalLesson ? renalHyperkalemiaReportActions(actions, session.log)
      : diabetesLesson ? perioperativeDiabetesReportActions(actions, session.log)
      : refeedingLesson ? refeedingReportActions(actions, session.log)
      : avpLesson ? avpDeficiencyReportActions(actions, session.log)
      : sodiumLesson ? hyponatremiaCorrectionReportActions(actions, session.log)
      : actions.slice(-REPORT_CONTEXT_ACTION_LIMIT).map((action) => {
      const lessonActions = action.type === 'meningococcal-sepsis-response' ? MENINGOCOCCAL_SEPSIS_ACTIONS
        : action.type === 'renal-hypermagnesemia-response' ? RENAL_HYPERMAGNESEMIA_ACTIONS
        : action.type === 'renal-hypocalcemia-response' ? RENAL_HYPOCALCEMIA_ACTIONS
        : action.type === 'renal-hypernatremia-response' ? RENAL_HYPERNATREMIA_ACTIONS
        : action.type === 'renal-hyponatremia-response' ? RENAL_HYPONATREMIA_ACTIONS
        : action.type === 'renal-hypokalemia-response' ? RENAL_HYPOKALEMIA_ACTIONS
        : action.type === 'renal-hyperkalemia-response' ? RENAL_HYPERKALEMIA_ACTIONS
        : action.type === 'perioperative-diabetes-response' ? PERIOPERATIVE_DIABETES_ACTIONS
        : action.type === 'refeeding-response' ? REFEEDING_ACTIONS
        : action.type === 'avp-deficiency-response' ? AVP_DEFICIENCY_ACTIONS
        : action.type === 'hypocalcemia-response' ? HYPOCALCEMIA_ACTIONS
        : action.type === 'hyponatremia-correction-response' ? HYPONATREMIA_CORRECTION_ACTIONS : undefined;
      const lessonChoice = lessonActions && action.payload !== null
        && typeof action.payload === 'object' && !Array.isArray(action.payload)
        && Object.keys(action.payload).length === 1
        && Object.hasOwn(action.payload, 'action')
        ? lessonActions.find((choice) => choice === action.payload.action) : undefined;
      return {
        tick: Math.max(0, Math.trunc(action.tick)),
        type: action.type.slice(0, 80),
        outcome: (lessonActions && lessonChoice === undefined)
          || session.log.some((entry) => entry.tick === action.tick && entry.eventId.includes('refused'))
          ? 'refused' as const : 'accepted' as const,
        // Invalid lesson payloads remain refused attempts, without reproducing
        // an injected note or making their named action look accepted.
        payload: lessonActions ? lessonChoice !== undefined ? { action: lessonChoice } : {}
          : (session.equipment?.resuscitation.hyponatremiaCorrection || session.equipment?.resuscitation.avpDeficiency || session.equipment?.resuscitation.refeeding || session.equipment?.resuscitation.perioperativeDiabetes || session.equipment?.resuscitation.renalHyperkalemia || session.equipment?.resuscitation.renalHypokalemia || session.equipment?.resuscitation.renalHyponatremia || session.equipment?.resuscitation.renalHypernatremia || session.equipment?.resuscitation.renalHypocalcemia || session.equipment?.resuscitation.renalHypermagnesemia || session.equipment?.resuscitation.meningococcalSepsis) ? {}
          : boundedScalars(action.payload, 12),
      };
    }),
    snapshot: {
      patient: Object.fromEntries(Object.entries(session.state ?? {})
        .filter((entry): entry is [string, number] => Number.isFinite(entry[1]))
        .filter(([field]) => !(sodiumLesson || avpLesson || refeedingLesson || diabetesLesson || renalLesson || hypokalemiaLesson || renalSodiumLesson || renalWaterLesson || renalCalciumLesson || renalMagnesiumLesson || meningococcalLesson)
          || ['systolicMmHg', 'diastolicMmHg', 'meanArterialMmHg', 'heartRateBpm',
            'respiratoryRateBpm', 'spo2Percent', 'coreTemperatureC'].includes(field))
        // These authored cases supply neither a continuous CO2 measurement nor oxygen settings.
        .filter(([field]) => !(session.equipment?.resuscitation.myxedema || session.equipment?.resuscitation.hypercalcemia || session.equipment?.resuscitation.hypocalcemia)
          || (field !== 'paco2MmHg' && field !== 'etco2MmHg' && field !== 'fio2'))
        .sort(([left], [right]) => left.localeCompare(right))
        .slice(0, REPORT_CONTEXT_SNAPSHOT_LIMIT)),
      equipment: (sodiumLesson && !session.equipment?.resuscitation.hyponatremiaCorrection)
        || (avpLesson && !session.equipment?.resuscitation.avpDeficiency)
        || (refeedingLesson && !session.equipment?.resuscitation.refeeding)
        || (diabetesLesson && !session.equipment?.resuscitation.perioperativeDiabetes)
        || (renalLesson && !session.equipment?.resuscitation.renalHyperkalemia)
        || (hypokalemiaLesson && !session.equipment?.resuscitation.renalHypokalemia)
        || (renalSodiumLesson && !session.equipment?.resuscitation.renalHyponatremia)
        || (renalWaterLesson && !session.equipment?.resuscitation.renalHypernatremia)
        || (renalCalciumLesson && !session.equipment?.resuscitation.renalHypocalcemia)
        || (renalMagnesiumLesson && !session.equipment?.resuscitation.renalHypermagnesemia)
        || (meningococcalLesson && !session.equipment?.resuscitation.meningococcalSepsis)
        ? {} : collectReportEquipmentContext(session.equipment),
    },
  };
}

/**
 * An assignment carried in the URL (platform/adoption → Assignment Links Without
 * Accounts).
 *
 * An instructor hands out one link and the whole cohort meets the identical
 * patient. NOTHING is trusted from the link: the scenario is looked up in the
 * registry, the guidance level must be one of the three, and the seed must be a
 * finite number. A parameter that fails any of those is dropped rather than
 * used, because a URL is input from outside.
 *
 * The link carries no identity and there is nowhere for it to report to. An
 * instructor can tell a cohort to open it; they cannot learn who did.
 */
export interface Assignment {
  readonly seed: number;
  readonly guidance: GuidanceLevel | null;
  readonly label: string | null;
}

const GUIDANCE_LEVELS: readonly GuidanceLevel[] = ['guided', 'coached', 'unassisted'];

export function readAssignment(search: string): Assignment {
  const params = new URLSearchParams(search);
  const rawSeed = Number(params.get('seed'));
  const rawGuidance = params.get('guidance');
  const rawLabel = params.get('assignment');
  return {
    seed: Number.isFinite(rawSeed) && rawSeed !== 0 ? Math.trunc(rawSeed) : DEFAULT_SEED,
    guidance: GUIDANCE_LEVELS.find((level) => level === rawGuidance) ?? null,
    // Shown back to the learner, so it is trimmed and bounded rather than
    // rendered at whatever length a URL happens to carry.
    label: rawLabel ? rawLabel.slice(0, 80) : null,
  };
}

function ClinicalModuleRoute({ path, config }: { path: string; config: ClinicalModuleConfig }) {
  const session = useSession();
  const { scenario, missingId } = useMemo(() => scenarioForPath(path, config), [path, config]);
  const assignment = useMemo(
    () => readAssignment(typeof location === 'undefined' ? '' : location.search),
    [],
  );
  const selectedGoal = useMemo(
    () => readCatalogQuery(typeof location === 'undefined' ? '' : location.search).goal,
    [],
  );
  const contentVersion = scenario.metadata.version;
  // The index at /anesthesia lists what there is to do rather than dropping the
  // learner into whichever scenario happened to be first.
  const isIndex = !path.startsWith(`${config.basePath}/scenario/`);
  const [acknowledged, setAcknowledged] = useState(() => hasAcknowledged());
  // Whether the scripted demonstration is driving this session. Deliberately not
  // in the URL: a demonstration is something you start, not somewhere you are.
  const [demonstrating, setDemonstrating] = useState(false);
  /**
   * `?demo=1` starts the demonstration without the briefing.
   *
   * Someone who followed "watch a 90-second demonstration" from the front door
   * has already decided to watch. Putting the briefing in front of them is
   * asking the question they just answered.
   */
  const autoDemo = useRef(
    demonstrationRequested(typeof location === 'undefined' ? '' : location.search),
  );
  // Validated against the registry, not just type-checked: the default is null,
  // so a shape check cannot tell a real region id from any other string, and an
  // unknown one used to throw and take the whole simulator down.
  const [regionId, setRegionId] = useLocalPreference<string | null>(
    'practice-region',
    null,
    (candidate): candidate is string | null =>
      candidate === null || (typeof candidate === 'string' && REGIONS.some((r) => r.id === candidate)),
  );
  const audio = useMemo(() => new SonificationEngine(), []);
  const reportShouldResume = useRef(false);
  const reportRequestSequence = useRef(0);
  const [reportRequest, setReportRequest] = useState<{
    id: number;
    surface: Extract<ReportSurface, 'source' | 'limitation'>;
  } | null>(null);
  const [sourceOpen, setSourceOpen] = useState(false);
  const requestReport = (surface: Extract<ReportSurface, 'source' | 'limitation'>) => {
    reportRequestSequence.current += 1;
    setReportRequest({ id: reportRequestSequence.current, surface });
  };

  const guess = useMemo(() => guessRegion(
    typeof navigator === 'undefined' ? ['en-GB'] : [...navigator.languages],
  ), []);
  const region = (regionId ? getRegion(regionId) : null) ?? guess.profile;

  const reportControl = (
    <ScenarioProblemReport
      context={{
        scenarioId: scenario.metadata.id,
        contentVersion: scenario.metadata.version,
        appVersion: APP_VERSION,
        engineVersion: ENGINE_VERSION,
        moduleId: config.id,
        maturity: scenario.metadata.maturity,
        practiceRegion: region.id,
        fidelityClass: config.id === 'anesthesia' ? 'closed_loop_physiology' : 'state_transition',
        surface: reportRequest?.surface ?? (sourceOpen ? 'source' : session.phase === 'ended'
          ? 'debrief'
          : session.phase === 'briefing' || session.phase === 'idle' ? 'prebrief' : 'live'),
        simulatedTick: session.tick,
        canonicalUrl: `${SITE_ORIGIN}${config.basePath}/scenario/${scenario.metadata.id}`,
        collectRecentContext: () => collectReportRecentContext(session, assignment.seed, supportsHyponatremiaCorrection(scenario), supportsAvpDeficiency(scenario), supportsRefeeding(scenario), supportsPerioperativeDiabetes(scenario), supportsRenalHyperkalemia(scenario), supportsRenalHypokalemia(scenario), supportsRenalHyponatremia(scenario), supportsRenalHypernatremia(scenario), supportsRenalHypocalcemia(scenario), supportsRenalHypermagnesemia(scenario), supportsMeningococcalSepsis(scenario)),
      }}
      {...(reportRequest ? { openRequest: reportRequest.id } : {})}
      onOpen={() => {
        // Capture intent before a pending final frame can finish the example.
        reportShouldResume.current = session.transport === 'running' && !demonstrating;
        if (session.transport === 'running') session.pause();
      }}
      onClose={() => {
        // Closing a report is not consent to restart a 60× worked example.
        if (reportShouldResume.current) session.play();
        reportShouldResume.current = false;
        setReportRequest(null);
      }}
    />
  );

  // The assignment's guidance level is applied once, before the session begins.
  // After that it is the learner's own control: a link sets the starting point,
  // it does not lock them out of the escape hatch the curriculum requires.
  const appliedGuidance = useRef(false);
  useEffect(() => {
    if (appliedGuidance.current || assignment.guidance === null) return;
    appliedGuidance.current = true;
    session.setGuidance(assignment.guidance);
  }, [assignment.guidance, session]);

  useEffect(() => {
    if (isIndex || !acknowledged || session.phase !== 'idle') return;
    session.begin(
      {
        scenarioId: scenario.metadata.id,
        scenarioVersion: scenario.metadata.version,
        contentVersion: contentVersion,
        modelSetRevision: MODEL_SET_REVISION,
        engineVersion: ENGINE_VERSION,
        practiceRegion: region.id,
        seed: assignment.seed,
        scenario,
      },
      () => new Worker(new URL('../modules/anesthesia/solver.worker.ts', import.meta.url), { type: 'module' }),
      {
        engine: ENGINE_VERSION, content: contentVersion,
        modelSet: MODEL_SET_REVISION, scenario: scenario.metadata.version,
      },
      config.id,
    );
  }, [acknowledged, session, region.id, config.id, isIndex]);

  // `?demo=1`: skip the briefing and start watching. Fires once, only for the
  // scenario the script was authored against, and only once the session is
  // actually ready to run.
  useEffect(() => {
    if (!autoDemo.current) return;
    if (session.phase !== 'briefing' && session.phase !== 'idle') return;
    if (!session.ready) return;
    const endocrineDemo = (config.id === 'endocrine-metabolic'
      && (supportsHypoglycemiaDemonstration(scenario) || supportsAdrenalDemonstration(scenario) || supportsThyroidDemonstration(scenario) || supportsMyxedemaDemonstration(scenario) || supportsHypercalcemiaDemonstration(scenario) || supportsHypocalcemiaDemonstration(scenario) || supportsHyponatremiaCorrectionDemonstration(scenario) || supportsAvpDeficiencyDemonstration(scenario) || supportsRefeedingDemonstration(scenario) || supportsPerioperativeDiabetesDemonstration(scenario)))
      || (config.id === 'renal-electrolyte' && (supportsRenalHyperkalemiaDemonstration(scenario) || supportsRenalHypokalemiaDemonstration(scenario) || supportsRenalHyponatremiaDemonstration(scenario) || supportsRenalHypernatremiaDemonstration(scenario) || supportsRenalHypocalcemiaDemonstration(scenario) || supportsRenalHypermagnesemiaDemonstration(scenario)));
    if (!endocrineDemo && (config.id !== 'anesthesia' || scenario.metadata.id !== DEMONSTRATION_SCENARIO_ID)) return;
    autoDemo.current = false;
    setDemonstrating(true);
    session.setSpeed(endocrineDemo ? 60 : 5);
    session.play();
  }, [session, scenario.metadata.id]);

  const exportTranscript = useCallback(async () => {
    const transcript = await session.exportTranscript();
    // Nothing identifying may leave the device, so the export is checked first.
    assertTranscriptIsAnonymous(transcript);
    const blob = new Blob([JSON.stringify(transcript, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `opensimlab-${transcript.scenarioId}-transcript.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  }, [session]);

  // Browsing the catalog is not simulator interaction. Let a learner understand
  // what exists before asking for the safety acknowledgement.
  if (isIndex) return config.id === 'anesthesia'
    ? <ScenarioIndex />
    : <EmergencyMedicineScenarioIndex config={config} />;

  if (!acknowledged) {
    return (
      <>
        <SiteBar />
        {/* The page content is delivered regardless; only interaction is gated. */}
        <main className="reading" id="main">
          <h1>{config.heading}</h1>
          <p>{isIndex ? 'Choose a scenario.' : scenario.metadata.title}</p>
        </main>
        <NotForClinicalUseGate
          open
          onAcknowledge={() => { recordAcknowledgement(); setAcknowledged(true); }}
        />
      </>
    );
  }

  // A link to a scenario that does not exist says so, rather than quietly
  // opening a different patient.
  if (missingId !== null) return <UnknownScenario id={missingId} config={config} />;

  if (session.phase === 'ended') {
    const internals = sessionInternals();
    const nextRecommendation = config.id !== 'anesthesia' || selectedGoal === 'all' ? undefined : (() => {
      const goal = preparationPath(selectedGoal);
      const completed = completedScenarioIds(loadPracticeHistory());
      completed.add(scenario.metadata.id);
      const next = recommendNextScenario(goal, scenariosByDifficulty(), completed);
      return {
        pathId: goal.id, pathTitle: goal.title,
        scenario: next.scenario, reason: next.reason,
      };
    })();
    return (
      <>
      <Debrief
        scenario={scenario}
        history={session.history}
        log={session.log}
        actions={internals.recorder ? internals.recorder.build('pending').actions : []}
        attributionByTick={() => session.attribution}
        timeToPeakSeconds={{ propofol: 100, remifentanil: 90 }}
        replayOptions={{
          scenario, seed: assignment.seed,
          practiceRegion: region.id, ticks: session.tick || 1,
        }}
        preoxygenationSeconds={session.equipment?.preoxygenationSeconds ?? 0}
        moduleId={config.id}
        onOpenExplainer={() => { /* the debrief opens explainers inline */ }}
        onExportTranscript={() => { void exportTranscript(); }}
        onReplayScenario={session.resetSession}
        onReplayDecisionPoint={(point) => session.rehearseFromDecisionPoint(point.id, point.atTick)}
        {...(nextRecommendation ? { nextRecommendation } : {})}
      />
      {reportControl}
      </>
    );
  }

  if (session.phase === 'briefing' || session.phase === 'idle') {
    return (
      <>
        <Prebrief
          scenario={scenario}
          region={region}
          environment={config.id}
          guidance={session.guidance}
          onGuidance={session.setGuidance}
          onReportLimitation={() => requestReport('limitation')}
          onStart={() => {
            // Resetting an example returns here with its accelerated clock.
            if (demonstrating) session.setSpeed(1);
            setDemonstrating(false); session.play();
          }}
          {...(config.id === 'anesthesia' && scenario.metadata.id === DEMONSTRATION_SCENARIO_ID
            ? { onWatch: () => { setDemonstrating(true); session.setSpeed(5); session.play(); } }
            : (config.id === 'endocrine-metabolic' && (supportsHypoglycemiaDemonstration(scenario) || supportsAdrenalDemonstration(scenario) || supportsThyroidDemonstration(scenario) || supportsMyxedemaDemonstration(scenario) || supportsHypercalcemiaDemonstration(scenario) || supportsHypocalcemiaDemonstration(scenario) || supportsHyponatremiaCorrectionDemonstration(scenario) || supportsAvpDeficiencyDemonstration(scenario) || supportsRefeedingDemonstration(scenario) || supportsPerioperativeDiabetesDemonstration(scenario)))
              || (config.id === 'renal-electrolyte' && (supportsRenalHyperkalemiaDemonstration(scenario) || supportsRenalHypokalemiaDemonstration(scenario) || supportsRenalHyponatremiaDemonstration(scenario) || supportsRenalHypernatremiaDemonstration(scenario) || supportsRenalHypocalcemiaDemonstration(scenario) || supportsRenalHypermagnesemiaDemonstration(scenario)))
            ? { onWatch: () => { setDemonstrating(true); session.setSpeed(60); session.play(); } }
            : {})}
          {...(assignment.label ? { assignmentLabel: assignment.label } : {})}
        />
        {guess.isFallback && regionId === null && (
          <div className="reading">
            <p className="field__hint">{guess.reason}</p>
            <Button compact onClick={() => setRegionId(region.id === 'US' ? 'GB' : 'US')}>
              Use the other profile instead
            </Button>
          </div>
        )}
        <p className="visually-hidden">{path}</p>
        {reportControl}
      </>
    );
  }

  return (
    <>
    <Cockpit
      scenario={scenario}
      region={region}
      audio={audio}
      demonstrating={demonstrating}
      onTakeControls={() => { setDemonstrating(false); session.setSpeed(1); }}
      onEnd={session.end}
      moduleId={config.id}
      onReportSource={() => requestReport('source')}
      onSourceVisibilityChange={setSourceOpen}
    />
    {reportControl}
    </>
  );
}

export function AnesthesiaRoute({ path }: { path: string }) {
  return <ClinicalModuleRoute path={path} config={ANESTHESIA_CONFIG} />;
}

export function EmergencyMedicineRoute({ path }: { path: string }) {
  return <ClinicalModuleRoute path={path} config={EMERGENCY_MEDICINE_CONFIG} />;
}

export function CriticalCareRoute({ path }: { path: string }) {
  return <ClinicalModuleRoute path={path} config={CRITICAL_CARE_CONFIG} />;
}

export function CardiologyRoute({ path }: { path: string }) {
  return <ClinicalModuleRoute path={path} config={CARDIOLOGY_CONFIG} />;
}

export function RespiratoryMedicineRoute({ path }: { path: string }) {
  return <ClinicalModuleRoute path={path} config={RESPIRATORY_MEDICINE_CONFIG} />;
}

export function PediatricsRoute({ path }: { path: string }) {
  return <ClinicalModuleRoute path={path} config={PEDIATRICS_CONFIG} />;
}

export function NeurologyRoute({ path }: { path: string }) {
  return <ClinicalModuleRoute path={path} config={NEUROLOGY_CONFIG} />;
}

export function ToxicologyRoute({ path }: { path: string }) {
  return <ClinicalModuleRoute path={path} config={TOXICOLOGY_CONFIG} />;
}

export function ObstetricsRoute({ path }: { path: string }) {
  return <ClinicalModuleRoute path={path} config={OBSTETRICS_CONFIG} />;
}

export function NeonatologyRoute({ path }: { path: string }) {
  return <ClinicalModuleRoute path={path} config={NEONATOLOGY_CONFIG} />;
}

export function EndocrineMetabolicRoute({ path }: { path: string }) {
  return <ClinicalModuleRoute path={path} config={ENDOCRINE_METABOLIC_CONFIG} />;
}

export function InfectiousDiseaseRoute({ path }: { path: string }) {
  return <ClinicalModuleRoute path={path} config={INFECTIOUS_DISEASE_CONFIG} />;
}

export function RenalElectrolyteRoute({ path }: { path: string }) {
  return <ClinicalModuleRoute path={path} config={RENAL_ELECTROLYTE_CONFIG} />;
}

/**
 * The scenario directory at `/anesthesia`.
 *
 * Ordered by difficulty, because the order is the teaching. Each entry says who
 * the patient is and what the scenario is for, so a learner chooses rather than
 * guesses.
 */
/**
 * A scenario id that is not in the registry.
 *
 * It names the id rather than saying "not found", because the person reading it
 * is usually the one who wrote the link, and the id is the thing they got wrong.
 */
function UnknownScenario({ id, config }: { id: string; config: ClinicalModuleConfig }) {
  return (
    <>
      <SiteBar />
      <main className="reading" id="main">
      <h1>No scenario called that</h1>
      <p>
        This link asks for a scenario with the id <code>{id}</code>, and there is not one.
        It may have been renamed, or the link may have a typo in it.
      </p>
      <p>
        If you were given this link by an instructor, the id in it is the part to check. These are
        all the scenarios there are:
      </p>
      <ul className="scenario-index">
        {config.scenarios.map((entry) => (
          <li key={entry.metadata.id} className="scenario-index__item">
            <a className="scenario-index__title" href={`${config.basePath}/scenario/${entry.metadata.id}`}>
              {entry.metadata.title}
            </a>
            <p className="scenario-index__patient"><code>{entry.metadata.id}</code></p>
          </li>
        ))}
      </ul>
      <p><a href={config.basePath}>Back to the scenario list</a></p>
      </main>
    </>
  );
}

function EmergencyMedicineScenarioIndex({ config }: { config: ClinicalModuleConfig }) {
  return (
    <>
      <SiteBar current={config.basePath} />
      <main className="reading" id="main">
        <p className="catalog-path__eyebrow">Your private practice lab</p>
        <h1>{config.heading}</h1>
        <p>
          {config.catalogIntroduction}
        </p>
        <ul className="scenario-index">
          {config.scenarios.map((entry) => (
            <li key={entry.metadata.id} className="scenario-index__item">
              <a className="scenario-index__title" href={`${config.basePath}/scenario/${entry.metadata.id}`}>
                {entry.metadata.title}
              </a>
              <p className="scenario-index__patient">
                {entry.patient.ageYears}-year-old {patientPersonNoun(entry.patient)}
                {config.id === 'cardiology' || config.id === 'respiratory-medicine' || config.id === 'pediatrics'
                  ? '.' : `, ASA ${entry.patient.asaClass}.`}{' '}
                About {entry.metadata.estimatedMinutes} simulated minutes.
              </p>
              <p className="scenario-index__teaches">{entry.metadata.objectives[0]?.statement}</p>
              <span className="badge">{entry.metadata.difficulty}</span>
              <MaturityMarker
                status={entry.metadata.maturity}
                subjectKind="scenario"
                subjectId={entry.metadata.id}
                contentVersion={entry.metadata.version}
                moduleId={config.id}
              />
            </li>
          ))}
        </ul>
        <p className="reading__aside">{config.catalogStatus}</p>
        <p className="reading__aside">{NOT_FOR_CLINICAL_USE}</p>
      </main>
    </>
  );
}

export function ScenarioIndex() {
  const [query, setQuery] = useState<CatalogQuery>(() => readCatalogQuery(
    typeof location === 'undefined' ? '' : location.search,
  ));
  const scenarios = filterCatalog(scenariosByDifficulty(), query);
  const selectedPath = query.goal === 'all' ? null : preparationPath(query.goal);
  const recommendation = selectedPath
    ? recommendNextScenario(selectedPath, scenariosByDifficulty())
    : null;
  const updateQuery = (next: CatalogQuery) => {
    setQuery(next);
    if (typeof history !== 'undefined') {
      history.replaceState(null, '', `/anesthesia${catalogQueryString(next)}`);
    }
  };
  const scenarioHref = (id: string) => `/anesthesia/scenario/${id}${
    query.goal === 'all' ? '' : `?goal=${query.goal}`
  }`;
  return (
    <>
      <SiteBar current="/anesthesia" />
      <main className="reading" id="main">
      <h1>Anesthesia simulator</h1>
      <p>
        Each scenario is a patient and a problem. Find the one that matches what you want to
        practise, or start at the top if this is your first one.
      </p>
      <section className="catalog-controls" aria-labelledby="catalog-controls-title">
        <h2 id="catalog-controls-title" className="catalog-controls__title">Find a scenario</h2>
        <Select
          label="What are you preparing for?"
          value={query.goal}
          onChange={(event) => updateQuery({
            ...query, goal: event.target.value as CatalogQuery['goal'],
          })}
          options={[
            { value: 'all', label: 'Show me everything' },
            ...PREPARATION_PATHS.map((path) => ({ value: path.id, label: path.title })),
          ]}
        />
        {selectedPath && recommendation && (
          <div className="catalog-path">
            <div>
              <p className="catalog-path__eyebrow">Your private practice path</p>
              <h3>{selectedPath.title}</h3>
              <p>{selectedPath.description}</p>
            </div>
            <dl className="catalog-path__facts">
              <div><dt>Plan</dt><dd>{selectedPath.scenarioIds.length} scenarios · {pathMinutes(selectedPath, scenariosByDifficulty())} minutes</dd></div>
              <div>
                <dt>Start here</dt>
                <dd>
                  <a href={scenarioHref(recommendation.scenario.metadata.id)}>
                    {recommendation.scenario.metadata.title}
                  </a>
                  <MaturityMarker
                    compact
                    status={recommendation.scenario.metadata.maturity}
                    subjectKind="scenario"
                    subjectId={recommendation.scenario.metadata.id}
                    contentVersion={recommendation.scenario.metadata.version}
                  />
                </dd>
              </div>
              <div><dt>Why</dt><dd>{recommendation.reason}</dd></div>
            </dl>
            <div className="catalog-path__competencies" aria-label="Path goals">
              {selectedPath.targetCompetencies.map((competency) => (
                <span className="chip" key={competency}>{competency}</span>
              ))}
            </div>
            <p className="field__hint">Assumes: {selectedPath.prerequisites.join(' ')}</p>
            <p className="reading__aside">{selectedPath.limitations}</p>
            <p className="field__hint">Nothing is locked. Choose “Show me everything” at any time.</p>
          </div>
        )}
        <div className="catalog-controls__grid">
          <div className="field catalog-controls__search">
            <label className="field__label" htmlFor="scenario-search">Patient, problem, or skill</label>
            <input
              id="scenario-search"
              className="field__input"
              type="search"
              maxLength={80}
              value={query.q}
              placeholder="Try airway, child, hemorrhage…"
              onChange={(event) => updateQuery({ ...query, q: event.target.value.slice(0, 80) })}
            />
          </div>
          <Select
            label="Difficulty"
            value={query.difficulty}
            onChange={(event) => updateQuery({
              ...query, difficulty: event.target.value as CatalogQuery['difficulty'],
            })}
            options={[
              { value: 'all', label: 'Any difficulty' },
              { value: 'introductory', label: 'Introductory' },
              { value: 'intermediate', label: 'Intermediate' },
              { value: 'advanced', label: 'Advanced' },
            ]}
          />
          <Select
            label="Duration"
            value={query.duration}
            onChange={(event) => updateQuery({
              ...query, duration: event.target.value as CatalogQuery['duration'],
            })}
            options={[
              { value: 'all', label: 'Any duration' },
              { value: 'under-10', label: 'Under 10 minutes' },
              { value: '10-plus', label: '10 minutes or more' },
            ]}
          />
          <Select
            label="Maturity"
            value={query.maturity}
            onChange={(event) => updateQuery({
              ...query, maturity: event.target.value as CatalogQuery['maturity'],
            })}
            options={[
              { value: 'all', label: 'Any maturity' },
              { value: 'draft', label: 'Draft' },
              { value: 'preview', label: 'Preview' },
              { value: 'source_checked', label: 'Sources checked' },
              { value: 'clinically_reviewed', label: 'Clinically reviewed' },
              { value: 'institution_endorsed', label: 'Institution endorsed' },
              { value: 'withdrawn', label: 'Withdrawn' },
            ]}
          />
        </div>
        <div className="catalog-controls__summary">
          <span role="status" aria-live="polite">
            <strong>{scenarios.length}</strong> {scenarios.length === 1 ? 'scenario' : 'scenarios'}
          </span>
          {hasCatalogFilters(query) && (
            <Button compact variant="ghost" onClick={() => updateQuery(EMPTY_CATALOG_QUERY)}>
              Clear filters
            </Button>
          )}
        </div>
        <noscript>
          <p className="field__hint">
            Filtering needs JavaScript. Every scenario is still listed below and each briefing
            works as a standalone page.
          </p>
        </noscript>
      </section>
      {scenarios.length > 0 && (
        <ul className="scenario-index">
          {scenarios.map((entry) => (
          <li key={entry.metadata.id} className="scenario-index__item">
            <a className="scenario-index__title" href={scenarioHref(entry.metadata.id)}>
              {entry.metadata.title}
            </a>
            <p className="scenario-index__patient">
              {entry.patient.ageYears}-year-old {patientPersonNoun(entry.patient)},
              {' '}ASA {entry.patient.asaClass}, for {entry.patient.procedure.toLowerCase()}.
              {' '}About {entry.metadata.estimatedMinutes} simulated minutes.
            </p>
            <p className="scenario-index__teaches">
              {entry.metadata.objectives[0]?.statement}
            </p>
            <span className="badge">{entry.metadata.difficulty}</span>
            <MaturityMarker
              status={entry.metadata.maturity}
              subjectKind="scenario"
              subjectId={entry.metadata.id}
              contentVersion={entry.metadata.version}
            />
          </li>
          ))}
        </ul>
      )}
      {scenarios.length === 0 && (
        <div className="catalog-empty">
          <h2>No scenarios match yet</h2>
          <p>Try a broader word or clear a filter. Nothing has been hidden from the catalog.</p>
          <Button onClick={() => updateQuery(EMPTY_CATALOG_QUERY)}>Show all scenarios</Button>
        </div>
      )}
      <p className="reading__aside">{NOT_FOR_CLINICAL_USE}</p>
      </main>
    </>
  );
}
