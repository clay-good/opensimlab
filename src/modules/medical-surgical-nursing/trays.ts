/**
 * medical-surgical-nursing's action trays, handed to the cockpit by the module's route.
 *
 * Importing this file pulls this module's tray controls, labels and tutor prose and
 * nothing else. The cockpit used to import all 48 lesson trays, which measured 98.9 KB gz
 * of the chunk every module downloads.
 */
import type { LessonTray } from '@anesthesia/ui/lesson-tray';
import { AfferentLimbTray } from './AfferentLimbTray';
import { CountedRateTray } from './CountedRateTray';
import { LastKnownWellTray } from './LastKnownWellTray';
import { LostContingencyTray } from './LostContingencyTray';
import { LowScoreTray } from './LowScoreTray';
import { OxygenTargetScaleTray } from './OxygenTargetScaleTray';
import { PairedReadingTray } from './PairedReadingTray';
import { ProxyScaleTray } from './ProxyScaleTray';
import { QuietPatientTray } from './QuietPatientTray';
import { supportsAfferentLimb } from './afferent-limb';
import { supportsCountedRate } from './counted-rate';
import { supportsLastKnownWell } from './last-known-well';
import { supportsLostContingency } from './lost-contingency';
import { supportsLowScore } from './low-score';
import { supportsOxygenTargetScale } from './oxygen-target-scale';
import { supportsPairedReading } from './paired-reading';
import { supportsProxyScale } from './proxy-scale';
import { supportsQuietPatient } from './quiet-patient';

export const MEDICAL_SURGICAL_NURSING_TRAYS: readonly LessonTray[] = [
  { id: 'AfferentLimb', actionType: 'afferent-limb-response', supports: supportsAfferentLimb, assessment: (r) => r?.afferentLimb, Component: AfferentLimbTray as LessonTray['Component'] },
  { id: 'CountedRate', actionType: 'counted-rate-response', supports: supportsCountedRate, assessment: (r) => r?.countedRate, Component: CountedRateTray as LessonTray['Component'] },
  { id: 'LastKnownWell', actionType: 'last-known-well-response', supports: supportsLastKnownWell, assessment: (r) => r?.lastKnownWell, Component: LastKnownWellTray as LessonTray['Component'] },
  { id: 'LostContingency', actionType: 'lost-contingency-response', supports: supportsLostContingency, assessment: (r) => r?.lostContingency, Component: LostContingencyTray as LessonTray['Component'] },
  { id: 'LowScore', actionType: 'low-score-response', supports: supportsLowScore, assessment: (r) => r?.lowScore, Component: LowScoreTray as LessonTray['Component'] },
  { id: 'OxygenTargetScale', actionType: 'oxygen-target-scale-response', supports: supportsOxygenTargetScale, assessment: (r) => r?.oxygenTargetScale, Component: OxygenTargetScaleTray as LessonTray['Component'] },
  { id: 'PairedReading', actionType: 'paired-reading-response', supports: supportsPairedReading, assessment: (r) => r?.pairedReading, Component: PairedReadingTray as LessonTray['Component'] },
  { id: 'ProxyScale', actionType: 'proxy-scale-response', supports: supportsProxyScale, assessment: (r) => r?.proxyScale, Component: ProxyScaleTray as LessonTray['Component'] },
  { id: 'QuietPatient', actionType: 'quiet-patient-response', supports: supportsQuietPatient, assessment: (r) => r?.quietPatient, Component: QuietPatientTray as LessonTray['Component'] },
];
