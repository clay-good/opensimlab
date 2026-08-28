/**
 * The non-visual channel (platform/accessibility → Screen Reader Access To Live
 * Physiology, Waveforms have a non-visual equivalent).
 *
 * Continuously changing vitals reach assistive technology through a polite live
 * region that announces on clinically meaningful change, plus an on-demand
 * full-state summary — never by announcing every tick, which would flood it.
 */

import { FIELDS, type PatientState, type StateField } from '@anesthesia/physiology';
import { getRhythm } from '@anesthesia/waveforms/rhythms';
import type { RhythmId } from '@anesthesia/waveforms/types';
import { alphaForObstruction, NORMAL_ALPHA_DEGREES } from '@anesthesia/waveforms/capnogram';
import type { EngineAlarm, HypocalcemiaSnapshot, HypercalcemiaSnapshot, MyxedemaSnapshot, HyponatremiaCorrectionSnapshot, AvpDeficiencySnapshot, RefeedingSnapshot, PerioperativeDiabetesSnapshot, RenalHyperkalemiaSnapshot, RenalHypokalemiaSnapshot, RenalHyponatremiaSnapshot, RenalHypernatremiaSnapshot, RenalHypocalcemiaSnapshot, RenalHypermagnesemiaSnapshot, MeningococcalSepsisSnapshot, ObstructedKidneySnapshot, FebrileNeutropeniaSnapshot, NecrotizingInfectionSnapshot, EndocarditisHeartFailureSnapshot } from '@platform/kernel/protocol';
import { formatElapsed } from '@platform/clock/simulation-clock';
import { tilesFor } from './tracks';

/**
 * Thresholds that count as a clinically meaningful change. A drift of one beat
 * per minute is not announced; crossing an alarm limit is.
 */
export const ANNOUNCE_THRESHOLDS: Partial<Record<StateField, readonly number[]>> = {
  spo2Percent: [95, 92, 90, 85, 80],
  meanArterialMmHg: [65, 55, 45],
  heartRateBpm: [45, 50, 100, 120, 140],
  etco2MmHg: [20, 25, 45, 55],
  coreTemperatureC: [38, 39],
  depthIndex: [30, 40, 60, 70],
  trainOfFourRatio: [0.1, 0.9],
};

/** Which side of each threshold a value sits on, as a comparable signature. */
export function thresholdSignature(state: Readonly<Record<string, number>>): string {
  const parts: string[] = [];
  for (const [field, thresholds] of Object.entries(ANNOUNCE_THRESHOLDS)) {
    const value = state[field];
    if (value === undefined || thresholds === undefined) continue;
    parts.push(`${field}:${thresholds.map((t) => (value < t ? '<' : '>')).join('')}`);
  }
  return parts.join('|');
}

export interface Announcement {
  readonly text: string;
  readonly severity: 'info' | 'warning' | 'critical';
}

/**
 * What to announce, given the previous and current state. Returns nothing when
 * no threshold was crossed, which is most ticks.
 */
export function announcementsFor(
  previous: Readonly<Record<string, number>> | null,
  current: Readonly<Record<string, number>>,
  alarms: readonly EngineAlarm[],
  unavailable?: ReadonlySet<string>,
): Announcement[] {
  if (!previous) return [];
  const out: Announcement[] = [];
  for (const [field, thresholds] of Object.entries(ANNOUNCE_THRESHOLDS)) {
    if (unavailable?.has(field)) continue;
    const before = previous[field];
    const after = current[field];
    if (before === undefined || after === undefined || thresholds === undefined) continue;
    for (const threshold of thresholds) {
      const wasBelow = before < threshold;
      const isBelow = after < threshold;
      if (wasBelow === isBelow) continue;
      const spec = FIELDS[field as StateField];
      const alarm = alarms.find((a) => a.parameter === field);
      out.push({
        text: `${spec.label} ${isBelow ? 'fell below' : 'rose above'} ${threshold} ${spec.unit}`
          + `, now ${after.toFixed(spec.precision)} ${spec.unit}`
          + (alarm ? `. ${alarm.priority === 'high' ? 'High priority' : alarm.priority === 'medium' ? 'Medium priority' : 'Low priority'} alarm.` : ''),
        severity: alarm?.priority === 'high' ? 'critical' : alarm ? 'warning' : 'info',
      });
    }
  }
  return out;
}

/**
 * The on-demand full-state summary: all current vitals, active infusions,
 * ventilator settings and active alarms, as structured text.
 */
export function stateSummary(
  state: PatientState,
  options: {
    readonly alarms: readonly EngineAlarm[];
    readonly infusions: readonly { drugId: string; rate: number; unit: string }[];
    readonly ventilator: {
      mode: string;
      tidalVolumeMl: number;
      respiratoryRateBpm: number;
      fio2: number;
      delivering: boolean;
      freshGasFlowLPerMin?: number;
    };
    readonly invalid: ReadonlySet<string>;
    readonly myxedema?: MyxedemaSnapshot;
    readonly hypercalcemia?: HypercalcemiaSnapshot;
    readonly hypocalcemia?: HypocalcemiaSnapshot;
    readonly hyponatremiaCorrection?: HyponatremiaCorrectionSnapshot;
    readonly avpDeficiency?: AvpDeficiencySnapshot;
    readonly refeeding?: RefeedingSnapshot;
    readonly perioperativeDiabetes?: PerioperativeDiabetesSnapshot;
    readonly renalHyperkalemia?: RenalHyperkalemiaSnapshot;
    readonly renalHypokalemia?: RenalHypokalemiaSnapshot;
    readonly renalHyponatremia?: RenalHyponatremiaSnapshot;
    readonly renalHypernatremia?: RenalHypernatremiaSnapshot;
    readonly renalHypocalcemia?: RenalHypocalcemiaSnapshot;
    readonly renalHypermagnesemia?: RenalHypermagnesemiaSnapshot;
    readonly meningococcalSepsis?: MeningococcalSepsisSnapshot;
    readonly obstructedKidney?: ObstructedKidneySnapshot;
    readonly febrileNeutropenia?: FebrileNeutropeniaSnapshot;
    readonly necrotizingInfection?: NecrotizingInfectionSnapshot;
    readonly endocarditisHeartFailure?: EndocarditisHeartFailureSnapshot;
    readonly showTrainOfFour?: boolean;
    readonly jawThrustCpapSecondsRemaining?: number;
    readonly capnographyLine?: {
      readonly obstructed: boolean;
      readonly ventilationCrossChecked: boolean;
    };
    readonly resuscitation?: {
      readonly epinephrineEffectFraction: number;
      readonly epinephrineTotalMicrograms: number;
      readonly highSpinalFraction?: number;
      readonly ephedrineTotalMg?: number;
      readonly venousAirEmbolismFraction?: number;
      readonly venousAirEntryControlled?: boolean;
      readonly salbutamolTotalMg?: number;
      readonly bronchodilatorEffectFraction?: number;
      readonly crystalloidTotalMl: number;
      readonly packedRedBloodCellUnits?: number;
      readonly freshFrozenPlasmaUnits?: number;
      readonly coagulationPanelReported?: boolean;
      readonly bloodProductsReleased?: boolean;
      readonly bloodProductTotalMl?: number;
      readonly dantroleneTotalMg?: number;
      readonly dantroleneEffectFraction?: number;
      readonly activeCooling?: boolean;
      readonly cardiacArrestActive?: boolean;
      readonly chestCompressionsActive?: boolean;
      readonly chestCompressionSeconds?: number;
      readonly compressionPerfusionFraction?: number;
      readonly arrestEpinephrineTotalMg?: number;
      readonly defibrillationShockCount?: number;
      readonly lastDefibrillationEnergyJ?: number | null;
      readonly roscAtTick?: number | null;
      readonly postTetanicCount?: number;
      readonly lastNeuromuscularReversal?: {
        readonly agent: 'sugammadex' | 'neostigmine';
        readonly doseMgPerKg: number | null;
        readonly tick: number;
      } | null;
    };
    readonly epinephrineLabel?: string;
    readonly lastExposure?: { readonly agentId: string; readonly tick: number } | null;
    readonly actualBodyWeightKg?: number;
    readonly showEpinephrineSupport?: boolean;
    readonly showHypermetabolicSupport?: boolean;
    readonly showCardiacArrestSupport?: boolean;
    readonly showHighSpinalSupport?: boolean;
    readonly showVenousAirEmbolismSupport?: boolean;
    readonly showBronchospasmSupport?: boolean;
    readonly bronchodilatorLabel?: string;
  },
): string {
  const lines: string[] = ['Current state.'];
  for (const tile of tilesFor(options.showTrainOfFour ?? false)) {
    if ((options.myxedema || options.hypercalcemia || options.hypocalcemia || options.hyponatremiaCorrection || options.avpDeficiency || options.refeeding || options.perioperativeDiabetes || options.renalHyperkalemia || options.renalHypokalemia || options.renalHyponatremia || options.renalHypernatremia || options.renalHypocalcemia || options.renalHypermagnesemia || options.meningococcalSepsis || options.obstructedKidney || options.febrileNeutropenia || options.necrotizingInfection || options.endocarditisHeartFailure) && ['etco2MmHg', 'fio2', 'depthIndex'].includes(tile.field)) continue;
    const spec = FIELDS[tile.field];
    const value = state[tile.field];
    if (options.invalid.has(tile.field) || value === undefined || !Number.isFinite(value)) {
      lines.push(`${spec.label}: not measurable. ${tile.invalidReason ?? ''}`.trim());
      continue;
    }
    lines.push(`${spec.label}: ${value.toFixed(spec.precision)} ${spec.unit}`.trim());
    if (tile.field === 'trainOfFourRatio') {
      lines.push(`Train-of-four count: ${state.trainOfFourCount.toFixed(0)} of 4.`);
      if (state.trainOfFourCount === 4 && state.trainOfFourRatio >= 0.4
        && state.trainOfFourRatio < 0.9) {
        lines.push('Qualitative assessment: no detectable fade, but the quantitative ratio still shows residual blockade below 0.9.');
      }
      if (state.trainOfFourCount === 0 && options.resuscitation?.postTetanicCount !== undefined) {
        lines.push(`Auto-derived post-tetanic-count teaching proxy: ${options.resuscitation.postTetanicCount.toFixed(0)}.`);
      }
      const reversal = options.resuscitation?.lastNeuromuscularReversal;
      if (reversal) {
        lines.push(`Last accepted neuromuscular reversal: ${reversal.agent}`
          + (reversal.doseMgPerKg === null ? '' : ` ${reversal.doseMgPerKg} milligrams per kilogram`)
          + ' intravenous.');
      }
    }
  }
  if (options.endocarditisHeartFailure) {
    const patient = options.endocarditisHeartFailure;
    for (const field of ['systolicMmHg', 'diastolicMmHg'] as const) {
      const value = state[field];
      if (!options.invalid.has(field) && Number.isFinite(value)) {
        lines.push(`${FIELDS[field].label}: ${value.toFixed(FIELDS[field].precision)} ${FIELDS[field].unit}.`);
      }
    }
    lines.push('Supplied starting findings were day 3 of appropriate antimicrobial therapy for confirmed aortic-valve endocarditis, new breathlessness on minimal exertion, heart rate 118 per minute, blood pressure 104 over 62 with a pulse pressure of 42, oxygen saturation 92 percent in air, a 12 millimetre aortic vegetation, and new severe aortic regurgitation. These remain historical starting findings.');
    lines.push(`Current alertness: ${patient.alertness}.`);
    lines.push('The C-reactive protein is falling and the cultures are clearing, which describes the infection rather than the valve. No inflammatory marker measures valve destruction, so falling numbers cannot reassure here.');
    lines.push(`Mechanical failure recognized: ${patient.recognitionAtTick === null ? 'not yet' : 'yes'}. Endocarditis team: ${patient.teamAtTick === null ? 'not yet convened' : 'convened with a surgical centre engaged'}. Surgical referral intent: ${patient.surgicalReferralAtTick === null ? 'not yet recorded' : 'recorded'}. Surveillance: ${patient.monitoringAtTick === null ? 'not arranged' : 'arranged'}.`);
    lines.push('Acute severe regurgitation gives a normal or narrow pulse pressure, because the ventricle has had no time to dilate; the wide pulse pressure of the textbook belongs to chronic disease. No operation, prosthesis, theatre time, or anaesthetic plan is selected, and oxygen settings and exhaled carbon dioxide are not supplied in this lesson.');
    lines.push(patient.labObservation
      ? `Last requested laboratory evidence at simulated ${formatElapsed(patient.labObservation.atTick)}: white cells ${patient.labObservation.whiteCellsX109L.toFixed(1)}; C-reactive protein ${patient.labObservation.crpMgL} milligrams per liter; lactate ${patient.labObservation.lactateMmolL.toFixed(1)} millimoles per liter; cultures ${patient.labObservation.culturesClearing ? 'no growth on the latest set' : 'growth on the admission set'}. A laboratory-only check does not refresh the perfusion assessment.`
      : 'No new laboratory-only measurement has been requested.');
    lines.push(patient.perfusionObservation
      ? `Last requested examination at simulated ${formatElapsed(patient.perfusionObservation.atTick)}: blood pressure ${patient.perfusionObservation.systolicMmHg} over ${patient.perfusionObservation.diastolicMmHg}, pulse pressure ${patient.perfusionObservation.pulsePressureMmHg}; respiratory rate ${patient.perfusionObservation.respiratoryRateBpm} per minute; oxygen saturation ${patient.perfusionObservation.spo2Percent} percent on ${patient.perfusionObservation.oxygenSupport}. A perfusion-only look does not refresh laboratory evidence.`
      : 'No new perfusion-only examination has been requested.');
    lines.push(patient.observation
      ? `Last requested full assessment at simulated ${formatElapsed(patient.observation.atTick)}: heart rate ${patient.observation.heartRateBpm} per minute; pulse pressure ${patient.observation.pulsePressureMmHg}; oxygen saturation ${patient.observation.spo2Percent} percent on ${patient.observation.oxygenSupport}; C-reactive protein ${patient.observation.crpMgL} milligrams per liter; ${patient.observation.alertness}. These are historical observations, not live measurements.`
      : 'No new full assessment has been requested.');
    if (patient.decompensationObserved) lines.push('The C-reactive protein has fallen further while the patient has become very much worse. That divergence is the whole point.');
    lines.push('The decompensation occurs whatever is recorded, because the treatment is an operation that is not in this rehearsal. Neither operability, transfer acceptance, nor survival is established.');
    lines.push(options.alarms.length === 0 ? 'No active alarms.'
      : `Active alarms: ${options.alarms.map((a) => `${a.priority}, ${a.message}`).join('; ')}.`);
    return lines.join(' ');
  }
  if (options.necrotizingInfection) {
    const patient = options.necrotizingInfection;
    for (const field of ['systolicMmHg', 'diastolicMmHg'] as const) {
      const value = state[field];
      if (!options.invalid.has(field) && Number.isFinite(value)) {
        lines.push(`${FIELDS[field].label}: ${value.toFixed(FIELDS[field].precision)} ${FIELDS[field].unit}.`);
      }
    }
    lines.push('Supplied starting findings were 36 hours of oral antibiotics without settling, severe pain extending past the edge of the redness, temperature 37.4 degrees Celsius, heart rate 104 per minute, and lactate 2.4 millimoles per liter. Crepitus and bullae are absent. These remain historical starting findings.');
    lines.push(`Current alertness: ${patient.alertness}.`);
    lines.push('A score below its cutoff excludes nothing here: pooled sensitivity at that cutoff is near two-thirds, and the score counts late physiology that early disease has not produced. Absent crepitus and absent bullae are late-sign absences, not reassurance.');
    lines.push(`Disproportionate pain reconciled: ${patient.recognitionAtTick === null ? 'not yet' : 'yes'}. Erythema border: ${patient.marginMarkedAtTick === null ? 'not yet marked' : 'marked and timed'}. Urgent surgical review: ${patient.surgeryAtTick === null ? 'not yet requested' : 'requested'}. Antimicrobial intent: ${patient.antimicrobialIntentAtTick === null ? 'not yet recorded' : 'recorded'}. Surveillance: ${patient.monitoringAtTick === null ? 'not arranged' : 'arranged'}.`);
    lines.push('Exploration is the only test that can exclude this, and it is a qualified-team act. No agent, dose, incision, extent, or theatre time is selected. Oxygen settings and exhaled carbon dioxide are not supplied in this lesson.');
    lines.push(patient.labObservation
      ? `Last requested laboratory evidence at simulated ${formatElapsed(patient.labObservation.atTick)}: white cells ${patient.labObservation.whiteCellsX109L.toFixed(1)}; C-reactive protein ${patient.labObservation.crpMgL} milligrams per liter; sodium ${patient.labObservation.sodiumMmolL} millimoles per liter; lactate ${patient.labObservation.lactateMmolL.toFixed(1)} millimoles per liter; derived score ${patient.labObservation.riskScore}. A laboratory-only check does not refresh the limb examination.`
      : 'No new laboratory-only measurement has been requested.');
    lines.push(patient.limbObservation
      ? `Last requested limb examination at simulated ${formatElapsed(patient.limbObservation.atTick)}: erythema ${patient.limbObservation.beyondMarginCm === 0 ? 'at the marked border' : `${patient.limbObservation.beyondMarginCm} centimetres beyond the marked border`}; skin ${patient.limbObservation.dusky ? 'dusky' : 'erythematous without duskiness'}. A limb-only look does not refresh laboratory evidence.`
      : 'No new limb-only examination has been requested.');
    lines.push(patient.observation
      ? `Last requested full assessment at simulated ${formatElapsed(patient.observation.atTick)}: temperature ${patient.observation.coreTemperatureC.toFixed(1)} degrees Celsius; heart rate ${patient.observation.heartRateBpm} per minute; lactate ${patient.observation.lactateMmolL.toFixed(1)} millimoles per liter; derived score ${patient.observation.riskScore}; erythema ${patient.observation.beyondMarginCm === 0 ? 'at the marked border' : `${patient.observation.beyondMarginCm} centimetres beyond the marked border`}. These are historical observations, not live measurements.`
      : 'No new full assessment has been requested.');
    if (patient.progressionObserved) lines.push('The derived score is now firmly positive. It became useful only after the interval in which acting on it mattered, which is the lesson rather than a reward.');
    lines.push('The authored progression occurs whatever is recorded, because only an operation treats this and the operation happens after this rehearsal. The diagnosis stays unconfirmed, and no operative finding, limb outcome, or survival is established.');
    lines.push(options.alarms.length === 0 ? 'No active alarms.'
      : `Active alarms: ${options.alarms.map((a) => `${a.priority}, ${a.message}`).join('; ')}.`);
    return lines.join(' ');
  }
  if (options.febrileNeutropenia) {
    const patient = options.febrileNeutropenia;
    for (const field of ['systolicMmHg', 'diastolicMmHg'] as const) {
      const value = state[field];
      if (!options.invalid.has(field) && Number.isFinite(value)) {
        lines.push(`${FIELDS[field].label}: ${value.toFixed(FIELDS[field].precision)} ${FIELDS[field].unit}.`);
      }
    }
    lines.push('Supplied starting findings were temperature 38.4 degrees Celsius, heart rate 104 per minute, neutrophils 0.2, white cells 0.8, C-reactive protein 42 milligrams per liter, and lactate 1.8 millimoles per liter, on day 10 after chemotherapy. The patient looks well and has no localizing findings. These remain historical starting findings.');
    lines.push(`Current alertness: ${patient.alertness}.`);
    lines.push('Without neutrophils there is no pus, redness and swelling are muted, and imaging can stay clear. Absent local signs are a consequence of neutropenia, not evidence against infection.');
    lines.push(`Recognition: ${patient.recognitionAtTick === null ? 'not yet recorded' : 'recorded'}. Neutropenic sepsis pathway: ${patient.pathwayAtTick === null ? 'not yet activated' : 'activated'}. Cultures: ${patient.culturesAtTick === null ? 'not yet requested' : 'requested'}. Empiric antimicrobial intent: ${patient.antimicrobialIntentAtTick === null ? 'not yet recorded' : 'recorded'}. Surveillance: ${patient.monitoringAtTick === null ? 'not arranged' : 'arranged'}.`);
    lines.push('Guidance delegates the agent to local microbiology policy, so no drug, dose, route, or combination is selected. Oxygen settings and exhaled carbon dioxide are not supplied in this lesson.');
    lines.push(patient.labObservation
      ? `Last requested laboratory evidence at simulated ${formatElapsed(patient.labObservation.atTick)}: neutrophils ${patient.labObservation.absoluteNeutrophilsX109L.toFixed(1)}; white cells ${patient.labObservation.whiteCellsX109L.toFixed(1)}; C-reactive protein ${patient.labObservation.crpMgL} milligrams per liter; lactate ${patient.labObservation.lactateMmolL.toFixed(1)} millimoles per liter. A laboratory-only check does not refresh the observations.`
      : 'No new laboratory-only measurement has been requested.');
    lines.push(patient.observationsOnly
      ? `Last requested observations at simulated ${formatElapsed(patient.observationsOnly.atTick)}: temperature ${patient.observationsOnly.coreTemperatureC.toFixed(1)} degrees Celsius; heart rate ${patient.observationsOnly.heartRateBpm} per minute; capillary refill ${patient.observationsOnly.capillaryRefillSeconds} seconds. An observations-only round does not refresh laboratory evidence.`
      : 'No new observations-only round has been requested.');
    lines.push(patient.observation
      ? `Last requested full assessment at simulated ${formatElapsed(patient.observation.atTick)}: temperature ${patient.observation.coreTemperatureC.toFixed(1)} degrees Celsius; heart rate ${patient.observation.heartRateBpm} per minute; mean arterial pressure ${patient.observation.meanArterialMmHg}; neutrophils ${patient.observation.absoluteNeutrophilsX109L.toFixed(1)}; lactate ${patient.observation.lactateMmolL.toFixed(1)} millimoles per liter; ${patient.observation.alertness}. These are historical observations, not live measurements.`
      : 'No new full assessment has been requested.');
    if (patient.untreatedResponseObserved && patient.antimicrobialIntentAtTick === null) lines.push('A full assessment recorded a falling temperature with failing perfusion and no rise in the white cell count. In a patient who cannot mount a count, that combination is worsening infection.');
    lines.push('C-reactive protein takes many hours to rise, so it is uninformative at the door and its later climb is lag catching up. The patient remains profoundly neutropenic, no source or organism is established, and no discharge readiness is certified.');
    lines.push(options.alarms.length === 0 ? 'No active alarms.'
      : `Active alarms: ${options.alarms.map((a) => `${a.priority}, ${a.message}`).join('; ')}.`);
    return lines.join(' ');
  }
  if (options.obstructedKidney) {
    const patient = options.obstructedKidney;
    for (const field of ['systolicMmHg', 'diastolicMmHg'] as const) {
      const value = state[field];
      if (!options.invalid.has(field) && Number.isFinite(value)) {
        lines.push(`${FIELDS[field].label}: ${value.toFixed(FIELDS[field].precision)} ${FIELDS[field].unit}.`);
      }
    }
    lines.push('Supplied starting findings were temperature 38.9 degrees Celsius, heart rate 118 per minute, respiratory rate 26 per minute, lactate 2.6 millimoles per liter, creatinine 148 micromoles per liter against a baseline near 70, and an 8 millimeter obstructing distal ureteric stone with moderate hydronephrosis. Appropriate intravenous antimicrobial therapy is a supplied premise, not a learner decision. These remain historical starting findings.');
    lines.push(`Current alertness: ${patient.alertness}.`);
    lines.push(`Obstruction reconciled: ${patient.recognitionAtTick === null ? 'not yet' : 'yes'}. Urology and interventional radiology: ${patient.urologyAtTick === null ? 'not yet involved' : 'involved'}. Cultures: ${patient.culturesAtTick === null ? 'not yet requested' : 'requested'}.`);
    lines.push(`Decompression intent: ${patient.decompressionIntentAtTick === null ? 'not yet recorded' : 'recorded'}. Definitive stone treatment: ${patient.stoneDeferralAtTick === null ? 'not yet deferred' : 'deferred until the infection is treated'}. Surveillance: ${patient.monitoringAtTick === null ? 'not arranged' : 'arranged'}.`);
    lines.push('Recorded intent is not a placed drain. No drainage modality, access, operator, or time is selected, and neither percutaneous nephrostomy nor retrograde stenting is marked correct. Oxygen settings and exhaled carbon dioxide are not supplied in this lesson.');
    lines.push(patient.labObservation
      ? `Last requested laboratory evidence at simulated ${formatElapsed(patient.labObservation.atTick)}: lactate ${patient.labObservation.lactateMmolL.toFixed(1)} millimoles per liter; creatinine ${patient.labObservation.creatinineUmolL} micromoles per liter; C-reactive protein ${patient.labObservation.crpMgL} milligrams per liter. A laboratory-only check does not refresh the observations.`
      : 'No new laboratory-only measurement has been requested.');
    lines.push(patient.observationsOnly
      ? `Last requested observations at simulated ${formatElapsed(patient.observationsOnly.atTick)}: heart rate ${patient.observationsOnly.heartRateBpm} per minute; track-and-trigger score ${patient.observationsOnly.trackAndTriggerScore}. An observations-only round does not refresh laboratory evidence.`
      : 'No new observations-only round has been requested.');
    lines.push(patient.observation
      ? `Last requested full assessment at simulated ${formatElapsed(patient.observation.atTick)}: heart rate ${patient.observation.heartRateBpm} per minute; mean arterial pressure ${patient.observation.meanArterialMmHg}; track-and-trigger score ${patient.observation.trackAndTriggerScore}; lactate ${patient.observation.lactateMmolL.toFixed(1)} millimoles per liter; ${patient.observation.alertness}. These are historical observations, not live measurements.`
      : 'No new full assessment has been requested.');
    if (patient.untreatedResponseObserved && patient.decompressionIntentAtTick === null) lines.push('A full assessment recorded deterioration after six authored hours of antimicrobial care with the kidney still obstructed.');
    lines.push('C-reactive protein lags by many hours and can keep rising while the patient improves, so it is not the success signal. Drainage is not cure: deterioration after decompression is well described, and no cleared infection, recovered kidney function, or discharge readiness is established.');
    lines.push(options.alarms.length === 0 ? 'No active alarms.'
      : `Active alarms: ${options.alarms.map((a) => `${a.priority}, ${a.message}`).join('; ')}.`);
    return lines.join(' ');
  }
  if (options.meningococcalSepsis) {
    const patient = options.meningococcalSepsis;
    for (const field of ['systolicMmHg', 'diastolicMmHg'] as const) {
      const value = state[field];
      if (!options.invalid.has(field) && Number.isFinite(value)) {
        lines.push(`${FIELDS[field].label}: ${value.toFixed(FIELDS[field].precision)} ${FIELDS[field].unit}.`);
      }
    }
    lines.push('Supplied starting findings were fever 39.2 degrees Celsius, capillary refill 4 seconds, conscious level 14 of 15, lactate 4.1 millimoles per liter, platelets 96, and non-blanching petechiae including two lesions larger than 2 millimeters. These remain historical starting findings.');
    lines.push(`Current alertness: ${patient.alertness}.`);
    lines.push(`Rash reconciled: ${patient.rashRecognizedAtTick === null ? 'not yet' : 'yes'}. Senior clinical decision maker: ${patient.seniorAtTick === null ? 'not yet called' : 'called by telephone'}. Consultant attending in person: ${patient.consultantAtTick === null ? 'not yet alerted' : 'alerted'}.`);
    lines.push(`Antimicrobial intent: ${patient.antimicrobialIntentAtTick === null ? 'not yet recorded' : 'recorded'}. Fluid and critical-care intent: ${patient.fluidIntentAtTick === null ? 'not yet recorded' : 'recorded'}. Blood sampling: ${patient.bloodsAtTick === null ? 'not yet requested' : 'requested'}. Surveillance: ${patient.monitoringAtTick === null ? 'not arranged' : 'arranged'}.`);
    lines.push('Recorded intent is neither a prescription nor proof that treatment reached the patient. No agent, dose, route, or bolus volume is selected. Oxygen settings and exhaled carbon dioxide are not supplied in this lesson.');
    lines.push(patient.labObservation
      ? `Last requested laboratory evidence at simulated ${formatElapsed(patient.labObservation.atTick)}: lactate ${patient.labObservation.lactateMmolL.toFixed(1)} millimoles per liter; platelets ${patient.labObservation.plateletsX109L}; C-reactive protein ${patient.labObservation.crpMgL} milligrams per liter. A laboratory-only check does not refresh the bedside assessment.`
      : 'No new laboratory-only measurement has been requested.');
    lines.push(patient.perfusionObservation
      ? `Last requested examination at simulated ${formatElapsed(patient.perfusionObservation.atTick)}: capillary refill ${patient.perfusionObservation.capillaryRefillSeconds} seconds; conscious level ${patient.perfusionObservation.glasgowComaScore} of 15. A perfusion-only check does not refresh laboratory evidence.`
      : 'No new perfusion-only examination has been requested.');
    lines.push(patient.observation
      ? `Last requested full assessment at simulated ${formatElapsed(patient.observation.atTick)}: heart rate ${patient.observation.heartRateBpm} per minute; mean arterial pressure ${patient.observation.meanArterialMmHg}; capillary refill ${patient.observation.capillaryRefillSeconds} seconds; conscious level ${patient.observation.glasgowComaScore} of 15; lactate ${patient.observation.lactateMmolL.toFixed(1)} millimoles per liter; ${patient.observation.alertness}. These are historical observations, not live measurements.`
      : 'No new full bedside and laboratory assessment has been requested.');
    if (patient.incompleteResponseObserved && patient.consultantAtTick === null) lines.push('A full assessment recorded an inadequate response an hour after recorded intent. Attendance in person has not yet happened.');
    lines.push('A rising C-reactive protein is expected with elapsed time and is not by itself treatment failure. Unresolved shock and an unconfirmed diagnosis remain ongoing responsibilities; no survival or discharge readiness is established.');
    lines.push(options.alarms.length === 0 ? 'No active alarms.'
      : `Active alarms: ${options.alarms.map((a) => `${a.priority}, ${a.message}`).join('; ')}.`);
    return lines.join(' ');
  }
  if (options.renalHypermagnesemia) {
    const patient = options.renalHypermagnesemia;
    const examination = (value: { reflexesPresent: boolean; severeWeakness: boolean }) =>
      `reflexes ${value.reflexesPresent ? 'present' : 'absent'}; ${value.severeWeakness ? 'severe' : 'residual'} weakness persists`;
    for (const field of ['systolicMmHg', 'diastolicMmHg'] as const) {
      const value = state[field];
      if (!options.invalid.has(field) && Number.isFinite(value)) {
        lines.push(`${FIELDS[field].label}: ${value.toFixed(FIELDS[field].precision)} ${FIELDS[field].unit}.`);
      }
    }
    lines.push('Supplied magnesium was 4.6 millimoles per liter, with drowsiness, absent reflexes, severe weakness, and slow breathing. These remain historical starting findings.');
    lines.push(`Current alertness: ${patient.alertness}.`);
    lines.push(patient.breathingAtTick === null ? 'Qualified breathing support has not yet started.'
      : 'Qualified breathing support is active. The displayed respiratory rate is supported, not proof of independent breathing.');
    lines.push(`Calcium requests: ${patient.calciumRequests}. Magnesium exposure: ${patient.stopMagnesiumAtTick === null ? 'not yet stopped' : 'stopped'}. Removal: ${patient.removalAtTick === null ? 'not yet delivered' : 'delivered'}.`);
    lines.push('Calcium temporarily counters toxicity without removing magnesium. No ECG interval is supplied. Oxygen settings and exhaled carbon dioxide are not supplied in this lesson.');
    lines.push(patient.magnesiumObservation
      ? `Last requested magnesium at simulated ${formatElapsed(patient.magnesiumObservation.atTick)}: ${patient.magnesiumObservation.magnesiumMmolL.toFixed(1)} millimoles per liter. A magnesium-only check does not refresh the neuromuscular or full assessment.`
      : 'No new magnesium-only measurement has been requested.');
    lines.push(patient.neuromuscularObservation
      ? `Last requested neuromuscular assessment at simulated ${formatElapsed(patient.neuromuscularObservation.atTick)}: ${examination(patient.neuromuscularObservation)}. A neuromuscular-only check does not refresh magnesium.`
      : 'No new neuromuscular-only assessment has been requested.');
    lines.push(patient.observation
      ? `Last requested full assessment at simulated ${formatElapsed(patient.observation.atTick)}: magnesium ${patient.observation.magnesiumMmolL.toFixed(1)} millimoles per liter; ${examination(patient.observation)}; ${patient.observation.alertness}. These are historical observations, not live measurements.`
      : 'No new full magnesium, neuromuscular, and bedside assessment has been requested.');
    if (patient.recurrenceObserved) lines.push('A full assessment recorded recurrent clinical toxicity, not a new magnesium rise.');
    lines.push('Residual weakness and respiratory support remain ongoing responsibilities. A removal response does not establish durable recovery or authorize withdrawal of support.');
    lines.push(options.alarms.length === 0 ? 'No active alarms.'
      : `Active alarms: ${options.alarms.map((a) => `${a.priority}, ${a.message}`).join('; ')}.`);
    return lines.join(' ');
  }
  if (options.renalHypocalcemia) {
    const patient = options.renalHypocalcemia;
    const symptoms = (value: { carpopedalSpasm: boolean; perioralTingling: boolean }) =>
      `carpopedal spasm ${value.carpopedalSpasm ? 'present' : 'absent'}; perioral tingling ${value.perioralTingling ? 'present' : 'absent'}`;
    for (const field of ['systolicMmHg', 'diastolicMmHg'] as const) {
      const value = state[field];
      if (!options.invalid.has(field) && Number.isFinite(value)) {
        lines.push(`${FIELDS[field].label}: ${value.toFixed(FIELDS[field].precision)} ${FIELDS[field].unit}.`);
      }
    }
    lines.push('Supplied measured ionized calcium was 0.86 millimoles per liter at pH 7.40, with carpopedal spasm and perioral tingling. These remain historical starting findings; an adjusted total estimate does not override the measured ionized result.');
    lines.push(`Current alertness: ${patient.alertness}.`);
    lines.push(`Calcium rescue: ${patient.rescueAtTick === null ? 'not yet requested' : 'requested'}. Continuing calcium: ${patient.continuingAtTick === null ? 'not yet delivered' : 'delivered'}. Mineral care: ${patient.mineralCareAtTick === null ? 'not coordinated' : 'coordinated'}. Follow-up: ${patient.followUpAtTick === null ? 'not arranged' : 'arranged'}.`);
    lines.push('Continuing care is available immediately after rescue, without waiting for symptom relief. The supplied QTc is historical and is not measured by the waveform. Oxygen settings and exhaled carbon dioxide are not supplied in this lesson.');
    lines.push(patient.ionizedObservation
      ? `Last requested ionized calcium at simulated ${formatElapsed(patient.ionizedObservation.atTick)}: ${patient.ionizedObservation.ionizedCalciumMmolL.toFixed(2)} millimoles per liter. An ionized-only check does not refresh symptoms or the full assessment.`
      : 'No new ionized-calcium-only measurement has been requested.');
    lines.push(patient.symptomObservation
      ? `Last requested symptoms at simulated ${formatElapsed(patient.symptomObservation.atTick)}: ${symptoms(patient.symptomObservation)}. A symptom-only check does not refresh calcium.`
      : 'No new symptom-only assessment has been requested.');
    lines.push(patient.observation
      ? `Last requested full assessment at simulated ${formatElapsed(patient.observation.atTick)}: ionized calcium ${patient.observation.ionizedCalciumMmolL.toFixed(2)} millimoles per liter; ${symptoms(patient.observation)}; ${patient.observation.alertness}. These are historical observations, not live measurements.`
      : 'No new full ionized-calcium, symptom, and bedside assessment has been requested.');
    if (patient.recurrenceObserved) lines.push('A full assessment recorded recurrence without continuing calcium care. That history remains visible.');
    lines.push('Symptom relief does not establish durable correction. Continuing calcium, mineral care, and longer-term follow-up remain active responsibilities.');
    lines.push(options.alarms.length === 0 ? 'No active alarms.'
      : `Active alarms: ${options.alarms.map((a) => `${a.priority}, ${a.message}`).join('; ')}.`);
    return lines.join(' ');
  }
  if (options.renalHypernatremia) {
    const patient = options.renalHypernatremia;
    const balance = (value: { urineOutputMlPerHour: number; ongoingDiarrhea: boolean }) =>
      `urine output ${value.urineOutputMlPerHour} milliliters per hour; ongoing diarrhea ${value.ongoingDiarrhea ? 'present' : 'absent'}`;
    for (const field of ['systolicMmHg', 'diastolicMmHg'] as const) {
      const value = state[field];
      if (!options.invalid.has(field) && Number.isFinite(value)) {
        lines.push(`${FIELDS[field].label}: ${value.toFixed(FIELDS[field].precision)} ${FIELDS[field].unit}.`);
      }
    }
    lines.push('Supplied sodium was 164 millimoles per liter and urine output was 20 milliliters per hour. These remain historical starting findings; sodium duration is unknown.');
    lines.push(`Current alertness: ${patient.alertness}.`);
    lines.push(`Circulation rescue: ${patient.volumeAtTick === null ? 'not yet requested' : 'requested'}. Water replacement: ${patient.waterAtTick === null ? 'not yet requested' : 'requested'}. Ongoing-loss care: ${patient.lossManagementAtTick === null ? 'not yet delivered' : 'delivered'}. Safe water access: ${patient.waterAccessAtTick === null ? 'not yet delivered' : 'delivered'}.`);
    lines.push('Improved circulation does not establish sodium correction. Safe access assistance does not prescribe an oral route. Oxygen settings and exhaled carbon dioxide are not supplied in this lesson.');
    lines.push(patient.sodiumObservation
      ? `Last requested sodium at simulated ${formatElapsed(patient.sodiumObservation.atTick)}: ${patient.sodiumObservation.sodiumMmolL} millimoles per liter; change from the original 164: ${patient.sodiumObservation.changeFromBaselineMmolL} millimoles per liter. A sodium-only check does not refresh fluid balance or the full assessment.`
      : 'No new sodium-only measurement has been requested.');
    lines.push(patient.fluidBalanceObservation
      ? `Last requested fluid balance at simulated ${formatElapsed(patient.fluidBalanceObservation.atTick)}: ${balance(patient.fluidBalanceObservation)}. A fluid-balance-only check does not refresh sodium.`
      : 'No new fluid-balance-only assessment has been requested.');
    lines.push(patient.observation
      ? `Last requested full assessment at simulated ${formatElapsed(patient.observation.atTick)}: sodium ${patient.observation.sodiumMmolL} millimoles per liter; change from the original 164: ${patient.observation.changeFromBaselineMmolL} millimoles per liter; ${balance(patient.observation)}; ${patient.observation.alertness}. These are historical observations, not live measurements.`
      : 'No new full sodium, fluid-balance, and bedside assessment has been requested.');
    if (patient.recurrenceObserved) lines.push('A full assessment recorded recurrence with continuing losses. That history remains visible.');
    lines.push('Continuing replacement, safe access, and surveillance remain active responsibilities. Ongoing-loss care does not instantly stop diarrhea or prove durable recovery.');
    lines.push(options.alarms.length === 0 ? 'No active alarms.'
      : `Active alarms: ${options.alarms.map((a) => `${a.priority}, ${a.message}`).join('; ')}.`);
    return lines.join(' ');
  }
  if (options.renalHyponatremia) {
    const patient = options.renalHyponatremia;
    const symptoms = (value: { alertness: string; headache: boolean; nausea: boolean }) =>
      `${value.alertness}; headache ${value.headache ? 'present' : 'absent'}; nausea ${value.nausea ? 'present' : 'absent'}`;
    for (const field of ['systolicMmHg', 'diastolicMmHg'] as const) {
      const value = state[field];
      if (!options.invalid.has(field) && Number.isFinite(value)) {
        lines.push(`${FIELDS[field].label}: ${value.toFixed(FIELDS[field].precision)} ${FIELDS[field].unit}.`);
      }
    }
    lines.push('Supplied sodium was 118 millimoles per liter with confusion, headache, and nausea. These remain historical starting findings; 118 remains the original correction baseline.');
    lines.push(`Current alertness: ${patient.alertness}.`);
    lines.push(`Qualified initial rescue: ${patient.rescueAtTick === null ? 'not yet requested' : 'requested'}. Limited additional rescue: ${patient.additionalRescueAtTick === null ? 'not yet requested' : 'requested'}. Neurologic and alternate-cause review: ${patient.neurologicReviewAtTick === null ? 'not yet requested' : 'requested'}.`);
    lines.push('Initial rescue does not wait for diagnostic certainty. Pretreatment urine findings with thiazide exposure do not independently establish SIAD. Oxygen settings and exhaled carbon dioxide are not supplied in this lesson.');
    lines.push(patient.sodiumObservation
      ? `Last requested sodium at simulated ${formatElapsed(patient.sodiumObservation.atTick)}: ${patient.sodiumObservation.sodiumMmolL} millimoles per liter; change from the original 118: ${patient.sodiumObservation.changeFromBaselineMmolL} millimoles per liter. A sodium-only check does not refresh symptoms or the full assessment.`
      : 'No new sodium-only measurement has been requested.');
    lines.push(patient.neurologicObservation
      ? `Last requested neurologic assessment at simulated ${formatElapsed(patient.neurologicObservation.atTick)}: ${symptoms(patient.neurologicObservation)}. A neurologic-only check does not refresh sodium.`
      : 'No new neurologic-only assessment has been requested.');
    lines.push(patient.observation
      ? `Last requested full assessment at simulated ${formatElapsed(patient.observation.atTick)}: sodium ${patient.observation.sodiumMmolL} millimoles per liter; change from the original 118: ${patient.observation.changeFromBaselineMmolL} millimoles per liter; ${symptoms(patient.observation)}. These are historical observations, not live measurements.`
      : 'No new full sodium, symptom, and bedside assessment has been requested.');
    if (patient.persistentSymptomsObserved) lines.push('A full assessment recorded persistent symptoms despite a sodium rise.');
    if (patient.additionalResponseObserved) lines.push('The observed rise of 6 millimoles per liter is not a clinical stopping rule. No treatment is automatically stopped.');
    lines.push('A sodium rise does not establish symptom recovery. Expert treatment review, monitoring, and cause evaluation remain active responsibilities.');
    lines.push(options.alarms.length === 0 ? 'No active alarms.'
      : `Active alarms: ${options.alarms.map((a) => `${a.priority}, ${a.message}`).join('; ')}.`);
    return lines.join(' ');
  }
  if (options.renalHypokalemia) {
    const patient = options.renalHypokalemia;
    const rhythm = (value: string) => value === 'sinus' ? 'authored ECG improvement' : 'supplied flattened-T pattern';
    for (const field of ['systolicMmHg', 'diastolicMmHg'] as const) {
      const value = state[field];
      if (!options.invalid.has(field) && Number.isFinite(value)) {
        lines.push(`${FIELDS[field].label}: ${value.toFixed(FIELDS[field].precision)} ${FIELDS[field].unit}.`);
      }
    }
    lines.push('Supplied potassium was 2.3 and magnesium 0.40 millimoles per liter, with a qualitative flattened-T ECG pattern. These remain historical starting findings.');
    lines.push(`Current alertness: ${patient.alertness}.`);
    lines.push(`Potassium care: ${patient.potassiumAtTick === null ? 'not yet requested' : 'requested'}. Magnesium care: ${patient.magnesiumAtTick === null ? 'not yet requested' : 'requested'}. Qualified ongoing-loss care: ${patient.lossManagementAtTick === null ? 'not yet delivered' : 'delivered'}.`);
    lines.push('Potassium and magnesium care are independent. Ongoing-loss care does not instantly stop diarrhea. Oxygen settings and exhaled carbon dioxide are not supplied in this lesson.');
    lines.push(patient.potassiumObservation
      ? `Last requested potassium at simulated ${formatElapsed(patient.potassiumObservation.atTick)}: ${patient.potassiumObservation.potassiumMmolL.toFixed(1)} millimoles per liter. A potassium-only check does not refresh magnesium or the full assessment.`
      : 'No new potassium-only measurement has been requested.');
    lines.push(patient.ecgObservation
      ? `Last requested ECG at simulated ${formatElapsed(patient.ecgObservation.atTick)}: ${rhythm(patient.ecgObservation.rhythm)}. An ECG-only check does not refresh electrolytes.`
      : 'No new ECG assessment has been requested.');
    lines.push(patient.observation
      ? `Last requested full assessment at simulated ${formatElapsed(patient.observation.atTick)}: potassium ${patient.observation.potassiumMmolL.toFixed(1)}, magnesium ${patient.observation.magnesiumMmolL.toFixed(2)} millimoles per liter, and ${rhythm(patient.observation.rhythm)}. These are historical observations, not live measurements.`
      : 'No new full potassium, magnesium, ECG, and bedside assessment has been requested.');
    if (patient.recurrenceObserved) lines.push('A full assessment recorded recurrent depletion; later care does not erase that observation.');
    lines.push('ECG appearance does not establish electrolyte concentrations. This waveform supplies no U-wave or QTc measurement. Repeated electrolyte and ECG surveillance remain necessary; improvement does not prove durable safety.');
    lines.push(options.alarms.length === 0 ? 'No active alarms.'
      : `Active alarms: ${options.alarms.map((a) => `${a.priority}, ${a.message}`).join('; ')}.`);
    return lines.join(' ');
  }
  if (options.renalHyperkalemia) {
    const patient = options.renalHyperkalemia;
    const rhythm = (value: string) => value === 'hyperkalemic-conduction' ? 'supplied conduction abnormality' : 'authored ECG improvement';
    for (const field of ['systolicMmHg', 'diastolicMmHg'] as const) {
      const value = state[field];
      if (!options.invalid.has(field) && Number.isFinite(value)) {
        lines.push(`${FIELDS[field].label}: ${value.toFixed(FIELDS[field].precision)} ${FIELDS[field].unit}.`);
      }
    }
    lines.push('Supplied potassium was 6.9 millimoles per liter and blood glucose 108 milligrams per deciliter, with a qualitative ECG conduction change. These remain historical starting findings.');
    lines.push(`Current alertness: ${patient.alertness}.`);
    lines.push(`Calcium requests: ${patient.calciumRequests}. Shifting treatment: ${patient.shiftAtTick === null ? 'not yet requested' : 'requested'}. Removal plan: ${patient.removalPlanAtTick === null ? 'not yet requested' : 'requested'}. Qualified removal delivery: ${patient.removalAtTick === null ? 'not yet confirmed' : 'confirmed'}.`);
    lines.push('Calcium does not lower potassium. Oxygen settings and exhaled carbon dioxide are not supplied in this lesson.');
    lines.push(patient.ecgObservation
      ? `Last requested ECG at simulated ${formatElapsed(patient.ecgObservation.atTick)}: ${rhythm(patient.ecgObservation.rhythm)}. An ECG-only check does not refresh potassium.`
      : 'No new ECG assessment has been requested.');
    lines.push(patient.glucoseObservation
      ? `Last requested blood glucose at simulated ${formatElapsed(patient.glucoseObservation.atTick)}: ${patient.glucoseObservation.glucoseMgDl} milligrams per deciliter. A glucose-only check does not refresh potassium.`
      : 'No new blood-glucose measurement has been requested.');
    lines.push(patient.observation
      ? `Last requested full assessment at simulated ${formatElapsed(patient.observation.atTick)}: potassium ${patient.observation.potassiumMmolL.toFixed(1)} millimoles per liter, blood glucose ${patient.observation.glucoseMgDl} milligrams per deciliter, and ${rhythm(patient.observation.rhythm)}. These are historical observations, not live measurements.`
      : 'No new full potassium, glucose, ECG, and bedside assessment has been requested.');
    if (patient.reboundObserved) lines.push('A full assessment recorded rebound; later care does not erase that observation.');
    lines.push('ECG appearance does not establish a potassium concentration. The waveform is not calibrated to QRS duration. Repeated potassium, glucose, and ECG surveillance remain necessary; improvement does not prove durable safety.');
    lines.push(options.alarms.length === 0 ? 'No active alarms.'
      : `Active alarms: ${options.alarms.map((a) => `${a.priority}, ${a.message}`).join('; ')}.`);
    return lines.join(' ');
  }
  if (options.perioperativeDiabetes) {
    const patient = options.perioperativeDiabetes;
    for (const field of ['systolicMmHg', 'diastolicMmHg'] as const) {
      const value = state[field];
      if (!options.invalid.has(field) && Number.isFinite(value)) {
        lines.push(`${FIELDS[field].label}: ${value.toFixed(FIELDS[field].precision)} ${FIELDS[field].unit}.`);
      }
    }
    lines.push('Supplied glucose was 180 milligrams per deciliter and blood ketones 0.6 millimoles per liter. These remain historical starting findings.');
    lines.push(`Current alertness: ${patient.alertness}.`);
    lines.push(`Qualified insulin delivery: ${patient.insulinAtTick === null ? 'not yet requested' : 'requested'}. Individualized fasting plan: ${patient.fastingPlanAtTick === null ? 'not yet requested' : 'requested'}.`);
    lines.push('Oxygen settings and exhaled carbon dioxide are not supplied in this lesson.');
    lines.push(patient.glucoseObservation
      ? `Last requested blood glucose at simulated ${formatElapsed(patient.glucoseObservation.atTick)}: ${patient.glucoseObservation.glucoseMgDl} milligrams per deciliter. A glucose-only check does not refresh ketones.`
      : 'No new blood-glucose measurement has been requested.');
    lines.push(patient.observation
      ? `Last requested full assessment at simulated ${formatElapsed(patient.observation.atTick)}: glucose ${patient.observation.glucoseMgDl} milligrams per deciliter and blood ketones ${patient.observation.ketonesMmolL.toFixed(1)} millimoles per liter. These are historical observations, not live measurements.`
      : 'No new full glucose, ketone, and bedside assessment has been requested.');
    if (patient.deteriorationObserved) lines.push('A requested full assessment recorded deterioration; later care does not erase that observation.');
    lines.push('Improved glucose alone does not establish the full response, diagnose or exclude ketoacidosis, or automatically clear surgery. Continued insulin, fasting, and monitoring ownership remain necessary.');
    lines.push(options.alarms.length === 0 ? 'No active alarms.'
      : `Active alarms: ${options.alarms.map((a) => `${a.priority}, ${a.message}`).join('; ')}.`);
    return lines.join(' ');
  }
  if (options.refeeding) {
    const patient = options.refeeding;
    for (const field of ['systolicMmHg', 'diastolicMmHg'] as const) {
      const value = state[field];
      if (!options.invalid.has(field) && Number.isFinite(value)) {
        lines.push(`${FIELDS[field].label}: ${value.toFixed(FIELDS[field].precision)} ${FIELDS[field].unit}.`);
      }
    }
    lines.push('Supplied prefeeding phosphate, potassium, and magnesium were 1.00, 3.8, and 0.80 millimoles per liter. Supplied current findings were 0.30, 2.7, and 0.48 millimoles per liter. These remain historical starting findings.');
    lines.push(`Current alertness: ${patient.alertness}.`);
    lines.push(`Comprehensive electrolyte care: ${patient.completeElectrolytesAtTick === null ? 'not yet requested' : 'requested'}. Thiamine: ${patient.thiamineAtTick === null ? 'not yet requested' : 'requested'}. Individualized nutrition review: ${patient.nutritionPlanAtTick === null ? 'not yet requested' : 'requested'}.`);
    lines.push('Oxygen settings and exhaled carbon dioxide are not supplied in this lesson.');
    lines.push(patient.observation
      ? `Last requested assessment at simulated ${formatElapsed(patient.observation.atTick)}: phosphate ${patient.observation.phosphateMmolL.toFixed(2)}, potassium ${patient.observation.potassiumMmolL.toFixed(1)}, and magnesium ${patient.observation.magnesiumMmolL.toFixed(2)} millimoles per liter. These are historical observations, not live measurements.`
      : 'No new electrolyte and bedside reassessment has been requested.');
    if (patient.recurrentDeclineObserved) lines.push('A requested recurrent decline remains in the record after later care.');
    lines.push('Phosphate-only care is partial care. Improved signs or one better result do not establish normalization or lasting safety. Nutrition review selects neither a universal feeding rate nor stopping all nutrition.');
    lines.push(options.alarms.length === 0 ? 'No active alarms.'
      : `Active alarms: ${options.alarms.map((a) => `${a.priority}, ${a.message}`).join('; ')}.`);
    return lines.join(' ');
  }
  if (options.avpDeficiency) {
    const patient = options.avpDeficiency;
    for (const field of ['systolicMmHg', 'diastolicMmHg'] as const) {
      const value = state[field];
      if (!options.invalid.has(field) && Number.isFinite(value)) {
        lines.push(`${FIELDS[field].label}: ${value.toFixed(FIELDS[field].precision)} ${FIELDS[field].unit}.`);
      }
    }
    lines.push('Supplied initial sodium: 162 millimoles per liter. This patient has known AVP deficiency, formerly central diabetes insipidus, not diabetes mellitus.');
    lines.push(`Current alertness: ${patient.alertness}.`);
    lines.push(`Qualified volume restoration: ${patient.volumeAtTick === null ? 'not yet requested' : patient.circulationRestored ? 'authored circulation checkpoint reached' : 'requested'}. Water replacement: ${patient.waterAtTick === null ? 'not yet requested' : 'requested'}. Prescribed desmopressin restoration: ${patient.desmopressinAtTick === null ? 'not yet requested' : 'requested'}.`);
    lines.push('Oxygen settings and exhaled carbon dioxide are not supplied in this lesson.');
    lines.push(patient.observation
      ? `Last requested assessment at simulated ${formatElapsed(patient.observation.atTick)}: sodium ${patient.observation.sodiumMmolL} millimoles per liter, urine output ${patient.observation.urineOutputMlPerHour} milliliters per hour, urine osmolality ${patient.observation.urineOsmolalityMosmPerKg} milliosmoles per kilogram. These are historical observations, not live measurements.`
      : 'No sodium, urine-output, and urine-osmolality reassessment has been requested.');
    lines.push(`Highest observed sodium: ${patient.peakObservedSodiumMmolL} millimoles per liter. Improved circulation or less urine does not establish sodium normalization or recovery.`);
    lines.push(options.alarms.length === 0 ? 'No active alarms.'
      : `Active alarms: ${options.alarms.map((a) => `${a.priority}, ${a.message}`).join('; ')}.`);
    return lines.join(' ');
  }
  if (options.hyponatremiaCorrection) {
    const patient = options.hyponatremiaCorrection;
    lines.push('The original correction window began with sodium 106 millimoles per liter, one hour before this lesson. Supplied post-rescue sodium was 111.');
    lines.push(`Current alertness: ${patient.alertness}.`);
    lines.push('Oxygen settings and exhaled carbon dioxide are not supplied in this lesson.');
    lines.push(patient.observation
      ? `Last requested assessment at simulated ${formatElapsed(patient.observation.atTick)}: sodium ${patient.observation.sodiumMmolL} millimoles per liter, urine output ${patient.observation.urineOutputMlPerHour} milliliters per hour. These are historical observations, not live measurements.`
      : 'No sodium and urine-output reassessment has been requested.');
    lines.push(`Highest observed sodium: ${patient.peakObservedSodiumMmolL} millimoles per liter. Relowering does not erase the correction history. A normal appearance does not establish safety.`);
    lines.push(options.alarms.length === 0 ? 'No active alarms.'
      : `Active alarms: ${options.alarms.map((a) => `${a.priority}, ${a.message}`).join('; ')}.`);
    return lines.join(' ');
  }
  if (options.hypocalcemia) {
    const patient = options.hypocalcemia;
    lines.push(`Authored qualified calcium rescue: ${patient.calciumAtTick === null ? 'not yet started' : 'started with ECG monitoring'}.`);
    lines.push(`Current symptoms: ${patient.symptoms}.`);
    lines.push('Oxygen settings and exhaled carbon dioxide are not supplied in this lesson. The supplied QTc is not calculated by the waveform.');
    lines.push(patient.observation
      ? `Last requested adjusted calcium at simulated ${formatElapsed(patient.observation.atTick)}: ${patient.observation.adjustedCalciumMgDl} milligrams per deciliter. This is a historical observation, not a live measurement.`
      : 'No calcium and bedside reassessment has been requested.');
    lines.push('Symptom relief does not establish sustained calcium control or recovery.');
    lines.push(options.alarms.length === 0
      ? 'No active alarms.'
      : `Active alarms: ${options.alarms.map((a) => `${a.priority}, ${a.message}`).join('; ')}.`);
    return lines.join(' ');
  }
  if (options.hypercalcemia) {
    const patient = options.hypercalcemia;
    lines.push(`Authored qualified hydration: ${patient.fluidsAtTick === null ? 'not yet started' : 'started'}.`);
    lines.push(`Current alertness: ${patient.alertness}.`);
    lines.push('Oxygen settings and exhaled carbon dioxide are not supplied in this lesson.');
    lines.push(patient.observation
      ? `Last requested adjusted calcium at simulated ${formatElapsed(patient.observation.atTick)}: ${patient.observation.adjustedCalciumMgDl} milligrams per deciliter. This is a historical observation, not a live measurement. Fluid tolerance: ${patient.observation.fluidTolerance}.`
      : 'No calcium and fluid-tolerance reassessment has been requested.');
    lines.push('Improved circulation does not establish calcium control or recovery.');
    lines.push(options.alarms.length === 0
      ? 'No active alarms.'
      : `Active alarms: ${options.alarms.map((a) => `${a.priority}, ${a.message}`).join('; ')}.`);
    return lines.join(' ');
  }
  if (options.myxedema) {
    const patient = options.myxedema;
    lines.push(`Authored qualified ventilation support: ${patient.ventilationAtTick === null ? 'not yet started' : 'started'}.`);
    lines.push(`Current alertness: ${patient.alertness}.`);
    lines.push('Oxygen settings and exhaled carbon dioxide are not supplied in this lesson.');
    lines.push(patient.observation
      ? `Last requested bedside PaCO₂ at simulated ${formatElapsed(patient.observation.atTick)}: ${patient.observation.paco2MmHg} millimeters of mercury. This is a historical observation, not a live measurement.`
      : 'No bedside PaCO₂ reassessment has been requested.');
    lines.push('Supported improvement is not independent breathing or recovery.');
    lines.push(options.alarms.length === 0
      ? 'No active alarms.'
      : `Active alarms: ${options.alarms.map((a) => `${a.priority}, ${a.message}`).join('; ')}.`);
    return lines.join(' ');
  }
  lines.push(options.infusions.length === 0
    ? 'No infusions running.'
    : `Infusions: ${options.infusions.map((i) => `${i.drugId} at ${i.rate.toFixed(1)} ${i.unit}`).join(', ')}.`);
  lines.push(`Ventilator: ${options.ventilator.mode}, `
    + `inspired oxygen fraction ${options.ventilator.fio2.toFixed(2)}, `
    + (options.ventilator.freshGasFlowLPerMin === undefined
      ? '' : `fresh gas flow ${options.ventilator.freshGasFlowLPerMin.toFixed(1)} litres per minute, `)
    + (options.ventilator.delivering
      ? `tidal volume ${options.ventilator.tidalVolumeMl} millilitres`
        + (options.actualBodyWeightKg === undefined
          ? '' : `, ${(options.ventilator.tidalVolumeMl / options.actualBodyWeightKg).toFixed(1)} millilitres per kilogram actual body weight`)
        + ` at ${options.ventilator.respiratoryRateBpm} per minute, `
        + `delivered minute ventilation ${(
          options.ventilator.tidalVolumeMl * options.ventilator.respiratoryRateBpm / 1000
        ).toFixed(1)} litres per minute.`
      : 'not delivering breaths.'));
  if (options.actualBodyWeightKg !== undefined) {
    lines.push('The millilitres-per-kilogram value is a conversion using actual body weight, not a recommended target.');
  }
  lines.push((options.jawThrustCpapSecondsRemaining ?? 0) > 0
    ? options.ventilator.delivering
      ? 'Jaw thrust and continuous positive airway pressure are being applied.'
      : 'A jaw thrust hold is active, but the ventilator is not delivering positive pressure.'
    : 'No held airway maneuver is active.');
  if (options.capnographyLine) {
    lines.push(options.capnographyLine.obstructed
      ? 'Carbon-dioxide sampling line obstructed; the displayed end-tidal value and waveform are unavailable.'
      : 'Carbon-dioxide sampling line connected.');
    lines.push(options.capnographyLine.ventilationCrossChecked
      ? 'Independent ventilation evidence has been cross-checked.'
      : 'No independent ventilation cross-check has been recorded.');
  }
  if (options.resuscitation && (options.showEpinephrineSupport ?? true)) {
    const name = options.epinephrineLabel ?? 'epinephrine';
    lines.push(`Accepted crisis support: ${name} ${options.resuscitation.epinephrineTotalMicrograms.toFixed(0)} micrograms intravenous; balanced crystalloid ${options.resuscitation.crystalloidTotalMl.toFixed(0)} millilitres.`);
    if (options.resuscitation.epinephrineEffectFraction > 0) {
      lines.push(`The ${name} teaching-model effect is active.`);
    }
  }
  if (options.resuscitation && (options.resuscitation.packedRedBloodCellUnits ?? 0) > 0) {
    lines.push(`Accepted packed red cells: ${options.resuscitation.packedRedBloodCellUnits} units, ${(options.resuscitation.bloodProductTotalMl ?? 0).toFixed(0)} millilitres in the bounded teaching model.`);
  }
  if (options.resuscitation?.bloodProductsReleased) {
    lines.push('The bounded blood-product release has been accepted.');
  }
  if (options.resuscitation?.coagulationPanelReported) {
    lines.push(`Current coagulation teaching panel: prothrombin time ratio ${state.prothrombinTimeRatio.toFixed(2)} times normal; fibrinogen ${state.fibrinogenGPerL.toFixed(1)} grams per litre.`);
  }
  if ((options.resuscitation?.freshFrozenPlasmaUnits ?? 0) > 0) {
    lines.push(`Accepted fresh frozen plasma: ${options.resuscitation?.freshFrozenPlasmaUnits} units in the bounded teaching model.`);
  }
  if (options.resuscitation && options.showHighSpinalSupport) {
    lines.push(`High-spinal teaching progression: ${Math.round((options.resuscitation.highSpinalFraction ?? 0) * 100)} percent.`);
    lines.push(`Accepted ephedrine total: ${(options.resuscitation.ephedrineTotalMg ?? 0).toFixed(0)} milligrams intravenous.`);
  }
  if (options.resuscitation && options.showVenousAirEmbolismSupport) {
    lines.push(`Abrupt pulmonary-flow teaching burden: ${Math.round((options.resuscitation.venousAirEmbolismFraction ?? 0) * 100)} percent.`);
    lines.push(options.resuscitation.venousAirEntryControlled
      ? 'Further modeled air entry is stopped; the residual teaching pattern is clearing.'
      : 'Further modeled air entry has not been stopped.');
  }
  if (options.resuscitation && options.showBronchospasmSupport) {
    const name = options.bronchodilatorLabel ?? 'salbutamol';
    lines.push(`Accepted nebulized ${name}: ${(options.resuscitation.salbutamolTotalMg ?? 0).toFixed(0)} milligrams.`);
    if ((options.resuscitation.bronchodilatorEffectFraction ?? 0) > 0) {
      lines.push('The bronchodilator teaching-model effect is active.');
    }
  }
  if (options.resuscitation && options.showHypermetabolicSupport) {
    lines.push(`Accepted dantrolene total: ${(options.resuscitation.dantroleneTotalMg ?? 0).toFixed(0)} milligrams intravenous.`);
    if ((options.resuscitation.dantroleneEffectFraction ?? 0) > 0) {
      lines.push('The dantrolene teaching-model effect is active.');
    }
    lines.push(`Active cooling is ${options.resuscitation.activeCooling ? 'on' : 'off'}.`);
    const rigidity = state.muscleRigidityFraction >= 0.75 ? 'marked'
      : state.muscleRigidityFraction >= 0.4 ? 'moderate'
        : state.muscleRigidityFraction > 0.05 ? 'mild' : 'none observed';
    lines.push(`Muscle rigidity: ${rigidity}.`);
  }
  if (options.resuscitation && options.showCardiacArrestSupport) {
    const arrest = options.resuscitation;
    lines.push(arrest.roscAtTick !== null && arrest.roscAtTick !== undefined
      ? 'Modeled return of spontaneous circulation is recorded.'
      : arrest.cardiacArrestActive ? 'Scripted cardiac arrest is active.' : 'No scripted cardiac arrest is active.');
    lines.push(`Chest compressions are ${arrest.chestCompressionsActive ? 'running' : 'stopped'}; `
      + `${(arrest.chestCompressionSeconds ?? 0).toFixed(0)} accepted seconds, `
      + `compression perfusion proxy ${(100 * (arrest.compressionPerfusionFraction ?? 0)).toFixed(0)} percent.`);
    lines.push(`Accepted arrest epinephrine: ${(arrest.arrestEpinephrineTotalMg ?? 0).toFixed(0)} milligrams. `
      + `Defibrillation shocks: ${(arrest.defibrillationShockCount ?? 0).toFixed(0)}`
      + (arrest.lastDefibrillationEnergyJ === null || arrest.lastDefibrillationEnergyJ === undefined
        ? '.' : `; last energy ${arrest.lastDefibrillationEnergyJ.toFixed(0)} joules.`));
  }
  if (options.lastExposure) {
    lines.push(`Most recent modeled trigger exposure: ${options.lastExposure.agentId}.`);
  }
  lines.push(options.alarms.length === 0
    ? 'No active alarms.'
    : `Active alarms: ${options.alarms.map((a) => `${a.priority}, ${a.message}`).join('; ')}.`);
  return lines.join(' ');
}

/** Whether current patient state can produce arterial and pleth mechanical pulses. */
export function mechanicalPulseFromState(
  state: Readonly<Record<string, number>> | null,
): boolean {
  return (state?.heartRateBpm ?? 0) > 0
    && (state?.strokeVolumeMl ?? 0) > 0
    && (state?.cardiacOutputLPerMin ?? 0) > 0;
}

/**
 * A text description of the current waveform morphology, so a screen reader user
 * reaching a trace gets its shape rather than an empty canvas.
 */
export function waveformDescriptions(options: {
  readonly rhythm: RhythmId;
  readonly bronchospasmSeverity: number;
  readonly airwayPatencyFraction: number;
  readonly perfusionIndex: number;
  readonly artifacts: ReadonlySet<string>;
  readonly capnographyUnavailable?: boolean;
  readonly capnographySampleObstructed?: boolean;
  readonly tracheostomyPatencyFraction?: number;
  readonly arterialDamped?: boolean;
  readonly inspiredCo2MmHg?: number;
  readonly ventilating: boolean;
  readonly mechanicalPulse: boolean;
}): { signal: string; label: string; description: string }[] {
  const rhythm = getRhythm(options.rhythm);
  const alpha = alphaForObstruction(options.bronchospasmSeverity);
  const capnoShape = options.capnographyUnavailable
    ? 'Not supplied in this lesson.'
    : options.capnographySampleObstructed
    || options.artifacts.has('sampling-line-obstruction')
    ? 'No sampled waveform: the carbon-dioxide sampling line is obstructed. This is a monitoring problem; cross-check ventilation independently.'
    : options.tracheostomyPatencyFraction !== undefined
      && options.tracheostomyPatencyFraction < 0.5
      ? 'Minimal intermittent sampled carbon dioxide: the declared tracheostomy gas path is nearly obstructed. Reconcile the person, both possible airways, and device-specific patency evidence.'
    : !options.ventilating || options.airwayPatencyFraction <= 0.05
      ? 'No waveform: no gas is moving.'
    : (options.inspiredCo2MmHg ?? 0) >= 0.5
      ? `Rebreathing pattern: the inspiratory baseline remains about ${(options.inspiredCo2MmHg ?? 0).toFixed(1)} millimeters of mercury above zero while expiratory waveforms continue.`
    : alpha > NORMAL_ALPHA_DEGREES + 15
      ? `Shark-fin shape: the expiratory upstroke is sloped and the plateau rises, giving an alpha angle of about ${alpha.toFixed(0)} degrees.`
      : `Normal rectangular shape with a flat alveolar plateau, alpha angle about ${alpha.toFixed(0)} degrees.`;

  const plethShape = !options.mechanicalPulse
    ? 'Non-pulsatile: no mechanical pulse is reaching the probe.'
    : options.artifacts.has('probe-displacement') || options.artifacts.has('pleth')
      ? 'Artifact-affected: pulses are irregular, low amplitude, or absent. Signal quality is poor and the saturation reading is unreliable.'
      : options.perfusionIndex < 0.35
        ? 'Small, low-amplitude pulses. Signal quality is poor and the saturation reading is unreliable.'
        : 'Regular pulses with a clear upstroke and a dicrotic shoulder.';

  const arterialShape = !options.mechanicalPulse
    ? 'Flat: no pulsatile pressure.'
    : options.arterialDamped || options.artifacts.has('arterial-damping')
      ? 'Damped: the dicrotic notch is lost and the trace is narrow. This is a monitoring problem, not a pressure change.'
      : 'Sharp upstroke, a dicrotic notch on the downslope, and a diastolic runoff.';

  return [
    {
      signal: 'ecg', label: 'Electrocardiogram, lead two',
      description: options.artifacts.has('electrocautery')
        ? `${rhythm.morphologyDescription} The trace is obscured by electrocautery interference, so the displayed heart rate is unreliable.`
        : rhythm.morphologyDescription,
    },
    { signal: 'arterial', label: 'Arterial pressure', description: arterialShape },
    { signal: 'capno', label: 'Capnography', description: capnoShape },
    { signal: 'pleth', label: 'Plethysmogram', description: plethShape },
  ];
}

/** A concise nonvisual equivalent of the scenario-scoped arterial pressure system. */
export function arterialLineSummary(status: {
  readonly displayedMeanArterialMmHg: number | null;
  readonly mislevelingCm: number;
  readonly dynamicResponse: 'normal' | 'overdamped';
  readonly cuff: {
    readonly status: 'idle' | 'cycling' | 'complete';
    readonly secondsRemaining: number;
    readonly meanArterialMmHg: number | null;
  };
}): string {
  const display = status.displayedMeanArterialMmHg === null
    ? 'Invasive mean arterial pressure is unavailable.'
    : `Displayed invasive mean arterial pressure ${status.displayedMeanArterialMmHg.toFixed(0)} millimeters of mercury.`;
  const fault = status.mislevelingCm > 0
    ? ` The transducer is ${status.mislevelingCm.toFixed(0)} centimeters above its reference level.`
    : '';
  const response = status.dynamicResponse === 'overdamped'
    ? ' The arterial waveform is over-damped.' : '';
  const cuff = status.cuff.status === 'cycling'
    ? ` The independent cuff is cycling with ${status.cuff.secondsRemaining} simulated seconds remaining.`
    : status.cuff.status === 'complete' && status.cuff.meanArterialMmHg !== null
      ? ` Independent cuff mean arterial pressure ${status.cuff.meanArterialMmHg.toFixed(0)} millimeters of mercury.`
      : '';
  return `${display}${fault}${response}${cuff}`;
}

/** A concise nonvisual equivalent of the scenario-scoped circle system. */
export function breathingCircuitSummary(status: {
  readonly co2Absorbent: 'normal' | 'exhausted';
  readonly inspiredCo2MmHg: number;
  readonly capnogramAssessed: boolean;
  readonly absorbentReplaced: boolean;
}): string {
  const absorber = status.co2Absorbent === 'exhausted'
    ? 'The modeled carbon-dioxide absorbent is exhausted.'
    : status.absorbentReplaced
      ? 'Absorbent replacement intent is recorded.'
      : 'The modeled carbon-dioxide absorbent is normal.';
  return `Inspired carbon dioxide ${status.inspiredCo2MmHg.toFixed(1)} millimeters of mercury. ${absorber}`
    + (status.capnogramAssessed ? ' Raised inspiratory baseline assessment is recorded.' : '');
}

/**
 * The keyboard shortcuts, documented and reachable without leaving the cockpit
 * (platform/accessibility → Complete Keyboard Operation).
 */
export interface Shortcut {
  readonly keys: string;
  readonly action: string;
  /** True for the time-critical actions the requirement singles out. */
  readonly timeCritical: boolean;
}

export const SHORTCUTS: readonly Shortcut[] = [
  { keys: 'Space', action: 'Play or pause the simulation', timeCritical: true },
  { keys: '.', action: 'Advance one simulated second', timeCritical: false },
  { keys: 'S', action: 'Read the full state summary aloud', timeCritical: true },
  { keys: 'W', action: 'Read the waveform descriptions', timeCritical: false },
  { keys: 'A', action: 'Silence the highest-priority active alarm', timeCritical: true },
  { keys: '1 – 4', action: 'Switch the Analysis tab', timeCritical: false },
  { keys: 'G', action: 'Give the focused syringe\'s first preset dose', timeCritical: true },
  { keys: 'V', action: 'Start or stop ventilating', timeCritical: true },
  { keys: 'L', action: 'Perform laryngoscopy', timeCritical: true },
  { keys: 'C', action: 'Start or stop modeled chest compressions', timeCritical: true },
  { keys: 'E', action: 'Give 1 mg IV epinephrine in the scripted arrest case', timeCritical: true },
  { keys: 'D', action: 'Deliver the declared 200 J biphasic shock in the scripted arrest case', timeCritical: true },
  { keys: '?', action: 'Open this shortcut reference', timeCritical: false },
];
