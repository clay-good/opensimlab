import type { Scenario } from '@anesthesia/scenarios/types';
import { supportsHypoglycemiaDemonstration } from '../../endocrine-metabolic/demo/hypoglycemia-demonstration';
import { supportsAdrenalDemonstration } from '../../endocrine-metabolic/demo/adrenal-demonstration';
import { supportsThyroidDemonstration } from '../../endocrine-metabolic/demo/thyroid-demonstration';
import { supportsMyxedemaDemonstration } from '../../endocrine-metabolic/demo/myxedema-demonstration';
import { supportsHypercalcemiaDemonstration } from '../../endocrine-metabolic/demo/hypercalcemia-demonstration';
import { supportsHypocalcemiaDemonstration } from '../../endocrine-metabolic/demo/hypocalcemia-demonstration';
import { supportsHyponatremiaCorrectionDemonstration } from '../../endocrine-metabolic/demo/hyponatremia-correction-demonstration';
import { supportsAvpDeficiencyDemonstration } from '../../endocrine-metabolic/demo/avp-deficiency-demonstration';
import { supportsRefeedingDemonstration } from '../../endocrine-metabolic/demo/refeeding-demonstration';
import { supportsPerioperativeDiabetesDemonstration } from '../../endocrine-metabolic/demo/perioperative-diabetes-demonstration';
import { supportsDkaResolutionDemonstration } from '../../endocrine-metabolic/demo/dka-resolution-demonstration';
import { supportsHhsOsmolalityDemonstration } from '../../endocrine-metabolic/demo/hhs-osmolality-demonstration';
import { supportsRenalHyperkalemiaDemonstration } from '../../renal-electrolyte/demo/renal-hyperkalemia-demonstration';
import { supportsRenalHypokalemiaDemonstration } from '../../renal-electrolyte/demo/renal-hypokalemia-demonstration';
import { supportsRenalHyponatremiaDemonstration } from '../../renal-electrolyte/demo/renal-hyponatremia-demonstration';
import { supportsRenalHypernatremiaDemonstration } from '../../renal-electrolyte/demo/renal-hypernatremia-demonstration';
import { supportsRenalHypocalcemiaDemonstration } from '../../renal-electrolyte/demo/renal-hypocalcemia-demonstration';
import { supportsRenalHypermagnesemiaDemonstration } from '../../renal-electrolyte/demo/renal-hypermagnesemia-demonstration';
import { supportsDelayedImmuneEventDemonstration } from '../../oncology/demo/delayed-immune-event-demonstration';
import { supportsIncidentalClotDemonstration } from '../../oncology/demo/incidental-clot-demonstration';
import { supportsNormalTestToxicityDemonstration } from '../../oncology/demo/normal-test-toxicity-demonstration';
import { supportsPrognosisQuestionDemonstration } from '../../oncology/demo/prognosis-question-demonstration';
import { supportsLaboratoryTlsDemonstration } from '../../oncology/demo/laboratory-tls-demonstration';
import { supportsRareEarlyMyocarditisDemonstration } from '../../oncology/demo/rare-early-myocarditis-demonstration';
import { supportsLoweringTheCountDemonstration } from '../../oncology/demo/lowering-the-count-demonstration';
import { supportsInheritedUrgencyDemonstration } from '../../oncology/demo/inherited-urgency-demonstration';
import { supportsTrialRuleDemonstration } from '../../oncology/demo/trial-rule-demonstration';
import { supportsSilentInteractionDemonstration } from '../../oncology/demo/silent-interaction-demonstration';
import { supportsEasyLabelDemonstration } from '../../oncology/demo/easy-label-demonstration';
import { supportsLowScoreDemonstration } from '../../medical-surgical-nursing/demo/low-score-demonstration';
import { supportsCountedRateDemonstration } from '../../medical-surgical-nursing/demo/counted-rate-demonstration';
import { supportsPairedReadingDemonstration } from '../../medical-surgical-nursing/demo/paired-reading-demonstration';
import { supportsAfferentLimbDemonstration } from '../../medical-surgical-nursing/demo/afferent-limb-demonstration';
import { supportsQuietPatientDemonstration } from '../../medical-surgical-nursing/demo/quiet-patient-demonstration';
import { supportsProxyScaleDemonstration } from '../../medical-surgical-nursing/demo/proxy-scale-demonstration';
import { supportsLastKnownWellDemonstration } from '../../medical-surgical-nursing/demo/last-known-well-demonstration';
import { supportsOxygenTargetScaleDemonstration } from '../../medical-surgical-nursing/demo/oxygen-target-scale-demonstration';
import { supportsLostContingencyDemonstration } from '../../medical-surgical-nursing/demo/lost-contingency-demonstration';
import { supportsMeningococcalSepsisDemonstration } from '../../infectious-disease/demo/meningococcal-sepsis-demonstration';
import { supportsObstructedKidneyDemonstration } from '../../infectious-disease/demo/obstructed-kidney-demonstration';
import { supportsFebrileNeutropeniaDemonstration } from '../../infectious-disease/demo/febrile-neutropenia-demonstration';
import { supportsNecrotizingInfectionDemonstration } from '../../infectious-disease/demo/necrotizing-infection-demonstration';

/**
 * Which lessons have a worked example, asked in one place.
 *
 * This list used to be written out as a long `||` chain at four sites: the
 * briefing's two labels, the route's watch control, and the route's `?demo=1`
 * entry. A lesson added to three of the four is built, tested, and unreachable,
 * which is what happened to all eleven oncology examples. The completion audit
 * knew about them and nothing offered them.
 *
 * `tests/unit/worked-example-offer.test.ts` holds the two halves together: a
 * scenario whose audit claims `guidance-and-demonstration` must appear here,
 * and a scenario that appears here must have made that claim.
 */
const WORKED_EXAMPLES: Readonly<Record<string, readonly ((scenario: Scenario) => boolean)[]>> = {
  'endocrine-metabolic': [
        supportsHypoglycemiaDemonstration,
    supportsAdrenalDemonstration,
    supportsThyroidDemonstration,
    supportsMyxedemaDemonstration,
    supportsHypercalcemiaDemonstration,
    supportsHypocalcemiaDemonstration,
    supportsHyponatremiaCorrectionDemonstration,
    supportsAvpDeficiencyDemonstration,
    supportsRefeedingDemonstration,
    supportsPerioperativeDiabetesDemonstration,
    supportsDkaResolutionDemonstration,
    supportsHhsOsmolalityDemonstration,
  ],
  'renal-electrolyte': [
        supportsRenalHyperkalemiaDemonstration,
    supportsRenalHypokalemiaDemonstration,
    supportsRenalHyponatremiaDemonstration,
    supportsRenalHypernatremiaDemonstration,
    supportsRenalHypocalcemiaDemonstration,
    supportsRenalHypermagnesemiaDemonstration,
  ],
  oncology: [
        supportsDelayedImmuneEventDemonstration,
    supportsIncidentalClotDemonstration,
    supportsNormalTestToxicityDemonstration,
    supportsPrognosisQuestionDemonstration,
    supportsLaboratoryTlsDemonstration,
    supportsRareEarlyMyocarditisDemonstration,
    supportsLoweringTheCountDemonstration,
    supportsInheritedUrgencyDemonstration,
    supportsTrialRuleDemonstration,
    supportsSilentInteractionDemonstration,
    supportsEasyLabelDemonstration,
  ],
  'medical-surgical-nursing': [
    supportsLowScoreDemonstration,
    supportsCountedRateDemonstration,
    supportsPairedReadingDemonstration,
    supportsAfferentLimbDemonstration,
    supportsQuietPatientDemonstration,
    supportsProxyScaleDemonstration,
    supportsLastKnownWellDemonstration,
    supportsOxygenTargetScaleDemonstration,
    supportsLostContingencyDemonstration,
  ],
  'infectious-disease': [
    supportsMeningococcalSepsisDemonstration,
    supportsObstructedKidneyDemonstration,
    supportsFebrileNeutropeniaDemonstration,
    supportsNecrotizingInfectionDemonstration,
  ],
};

/** True when this exact scenario version has a worked example to offer. */
export function offersWorkedExample(scenario: Scenario, moduleId: string): boolean {
  return (WORKED_EXAMPLES[moduleId] ?? []).some((supported) => supported(scenario));
}

/** The module ids that ship at least one worked example, for tests and copy. */
export const WORKED_EXAMPLE_MODULE_IDS = Object.keys(WORKED_EXAMPLES);
