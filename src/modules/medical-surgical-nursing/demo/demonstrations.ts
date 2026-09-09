/**
 * medical-surgical-nursing's worked examples, handed to the cockpit by the module's route.
 *
 * Importing this file pulls this module's lesson narration and nothing else.
 * `src/routes/modules/medical-surgical-nursing.tsx` is the only importer, so the narration lands in
 * this module's chunk instead of the shared cockpit chunk every module downloads.
 */
import type { LessonDemonstration } from '@anesthesia/demo/lesson-demonstration';
import { afferentLimbDemonstrationStep, supportsAfferentLimbDemonstration } from './afferent-limb-demonstration';
import { countedRateDemonstrationStep, supportsCountedRateDemonstration } from './counted-rate-demonstration';
import { lastKnownWellDemonstrationStep, supportsLastKnownWellDemonstration } from './last-known-well-demonstration';
import { lostContingencyDemonstrationStep, supportsLostContingencyDemonstration } from './lost-contingency-demonstration';
import { lowScoreDemonstrationStep, supportsLowScoreDemonstration } from './low-score-demonstration';
import { oxygenTargetScaleDemonstrationStep, supportsOxygenTargetScaleDemonstration } from './oxygen-target-scale-demonstration';
import { pairedReadingDemonstrationStep, supportsPairedReadingDemonstration } from './paired-reading-demonstration';
import { proxyScaleDemonstrationStep, supportsProxyScaleDemonstration } from './proxy-scale-demonstration';
import { quietPatientDemonstrationStep, supportsQuietPatientDemonstration } from './quiet-patient-demonstration';

export const MEDICAL_SURGICAL_NURSING_DEMONSTRATIONS: readonly LessonDemonstration[] = [
  { id: 'AfferentLimb', supports: supportsAfferentLimbDemonstration, actionType: 'afferent-limb-response', step: (r) => afferentLimbDemonstrationStep(r?.afferentLimb) },
  { id: 'CountedRate', supports: supportsCountedRateDemonstration, actionType: 'counted-rate-response', step: (r) => countedRateDemonstrationStep(r?.countedRate) },
  { id: 'LastKnownWell', supports: supportsLastKnownWellDemonstration, actionType: 'last-known-well-response', step: (r) => lastKnownWellDemonstrationStep(r?.lastKnownWell) },
  { id: 'LostContingency', supports: supportsLostContingencyDemonstration, actionType: 'lost-contingency-response', step: (r) => lostContingencyDemonstrationStep(r?.lostContingency) },
  { id: 'LowScore', supports: supportsLowScoreDemonstration, actionType: 'low-score-response', step: (r) => lowScoreDemonstrationStep(r?.lowScore) },
  { id: 'OxygenTargetScale', supports: supportsOxygenTargetScaleDemonstration, actionType: 'oxygen-target-scale-response', step: (r) => oxygenTargetScaleDemonstrationStep(r?.oxygenTargetScale) },
  { id: 'PairedReading', supports: supportsPairedReadingDemonstration, actionType: 'paired-reading-response', step: (r) => pairedReadingDemonstrationStep(r?.pairedReading) },
  { id: 'ProxyScale', supports: supportsProxyScaleDemonstration, actionType: 'proxy-scale-response', step: (r) => proxyScaleDemonstrationStep(r?.proxyScale) },
  { id: 'QuietPatient', supports: supportsQuietPatientDemonstration, actionType: 'quiet-patient-response', step: (r) => quietPatientDemonstrationStep(r?.quietPatient) },
];
