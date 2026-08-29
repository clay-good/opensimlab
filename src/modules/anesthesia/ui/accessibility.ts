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
import type { EngineAlarm, HypocalcemiaSnapshot, HypercalcemiaSnapshot, MyxedemaSnapshot, HyponatremiaCorrectionSnapshot, AvpDeficiencySnapshot, RefeedingSnapshot, PerioperativeDiabetesSnapshot, RenalHyperkalemiaSnapshot, RenalHypokalemiaSnapshot, RenalHyponatremiaSnapshot, RenalHypernatremiaSnapshot, RenalHypocalcemiaSnapshot, RenalHypermagnesemiaSnapshot, MeningococcalSepsisSnapshot, ObstructedKidneySnapshot, FebrileNeutropeniaSnapshot, NecrotizingInfectionSnapshot, EndocarditisHeartFailureSnapshot, SeverePneumoniaSnapshot, ToxicShockSnapshot, PossibleSepsisSnapshot, SepticShockLabelSnapshot, MeningitisImagingSnapshot, LowScoreSnapshot, CountedRateSnapshot, PairedReadingSnapshot, AfferentLimbSnapshot, QuietPatientSnapshot, ProxyScaleSnapshot, LastKnownWellSnapshot, OxygenTargetScaleSnapshot, LostContingencySnapshot, DelayedImmuneEventSnapshot, IncidentalClotSnapshot, NormalTestToxicitySnapshot, PrognosisQuestionSnapshot } from '@platform/kernel/protocol';
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
    readonly severePneumonia?: SeverePneumoniaSnapshot;
    readonly toxicShock?: ToxicShockSnapshot;
    readonly possibleSepsis?: PossibleSepsisSnapshot;
    readonly septicShockLabel?: SepticShockLabelSnapshot;
    readonly meningitisImaging?: MeningitisImagingSnapshot;
    readonly lowScore?: LowScoreSnapshot;
    readonly countedRate?: CountedRateSnapshot;
    readonly pairedReading?: PairedReadingSnapshot;
    readonly afferentLimb?: AfferentLimbSnapshot;
    readonly quietPatient?: QuietPatientSnapshot;
    readonly proxyScale?: ProxyScaleSnapshot;
    readonly lastKnownWell?: LastKnownWellSnapshot;
    readonly oxygenTargetScale?: OxygenTargetScaleSnapshot;
    readonly lostContingency?: LostContingencySnapshot;
    readonly delayedImmuneEvent?: DelayedImmuneEventSnapshot;
    readonly incidentalClot?: IncidentalClotSnapshot;
    readonly normalTestToxicity?: NormalTestToxicitySnapshot;
    readonly prognosisQuestion?: PrognosisQuestionSnapshot;
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
    if ((options.myxedema || options.hypercalcemia || options.hypocalcemia || options.hyponatremiaCorrection || options.avpDeficiency || options.refeeding || options.perioperativeDiabetes || options.renalHyperkalemia || options.renalHypokalemia || options.renalHyponatremia || options.renalHypernatremia || options.renalHypocalcemia || options.renalHypermagnesemia || options.meningococcalSepsis || options.obstructedKidney || options.febrileNeutropenia || options.necrotizingInfection || options.endocarditisHeartFailure || options.severePneumonia || options.toxicShock || options.possibleSepsis || options.septicShockLabel || options.meningitisImaging || options.lowScore || options.countedRate || options.pairedReading || options.afferentLimb || options.quietPatient || options.proxyScale || options.lastKnownWell || options.oxygenTargetScale || options.lostContingency || options.delayedImmuneEvent || options.incidentalClot || options.normalTestToxicity || options.prognosisQuestion) && ['etco2MmHg', 'fio2', 'depthIndex'].includes(tile.field)) continue;
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
  if (options.prognosisQuestion) {
    const patient = options.prognosisQuestion;
    // The question leads, and the fact that nothing on the monitor answers it is announced rather
    // than left to be inferred from a screen a listener cannot see.
    lines.push('He has asked: how long have I got. Nothing on the monitor bears on it, and the observations will not answer it however often they are taken.');
    lines.push('Supplied starting observations were pulse 82 per minute, blood pressure 124 over 72, respiratory rate 16 per minute, oxygen saturation 97 percent in air, and temperature 36.7 degrees Celsius. These remain historical starting observations, and none of them is relevant.');
    lines.push(`Current alertness: ${patient.alertness}. He has said before that he does not want all the details, and his daughter is in the room.`);
    lines.push(`What he wants it for: ${patient.intentAskedAtTick === null ? 'not established' : 'established'}. Question recorded in his own words: ${patient.questionRecordedAtTick === null ? 'no' : 'yes'}. What he believes the treatment is for: ${patient.beliefCheckedAtTick === null ? 'not checked' : 'checked'}. Answer: ${patient.answeredAtTick === null ? 'not given' : 'given as scenarios'}. Direction of the error: ${patient.directionStatedAtTick === null ? 'not stated' : 'stated'}. Boundaries: ${patient.boundariesReviewedAtTick === null ? 'not reviewed' : 'reviewed'}.`);
    if (patient.askedAgain) {
      lines.push('He has asked again and said why: his daughter is getting married in four months and he has been asked whether to book anything.');
    }
    lines.push('Only 20 percent of doctors\u2019 survival predictions in the cited cohort were accurate to within a third, 63 percent were over-optimistic, and the doctors who had known their patients longest were the least accurate. None of these figures is this man\u2019s. No prognosis is computed here, and no drug, dose, investigation, or procedure is selected; oxygen settings and exhaled carbon dioxide are not supplied in this lesson.');
    lines.push(patient.observation
      ? `Last requested full assessment at simulated ${formatElapsed(patient.observation.atTick)}: pulse ${patient.observation.heartRateBpm} per minute; answer ${patient.observation.answerGiven ? 'given' : 'not given'}; direction ${patient.observation.directionStated ? 'stated' : 'not stated'}.`
      : 'No new full assessment has been requested.');
    if (patient.readbackObserved && patient.readback === 'best-case-only') {
      lines.push('In the corridor he repeated it back to his daughter as the best case, on its own, as though it were the answer. Nothing was misheard.');
    }
    if (patient.readbackObserved && patient.readback === 'all-three-scenarios') {
      lines.push('In the corridor he repeated all three scenarios back to his daughter, and added, unprompted, that he was told doctors tend to guess long.');
    }
    if (patient.choiceFeedback) lines.push(patient.choiceFeedback);
  }
  if (options.normalTestToxicity) {
    const patient = options.normalTestToxicity;
    // The drug status leads, because it is the only thing here that changes with the clock and
    // the only thing a listener can act on without asking anyone.
    lines.push(`Cycle ${patient.cycleNumber}, day ${patient.dayOfCycle}. The drug is ${patient.drugWithheldAtTick === null ? 'not withheld' : 'withheld'}. The supply is ${patient.supplyHeldByPatient ? 'in the patient\u2019s own bag' : 'held by the service'}.`);
    lines.push('Supplied starting observations were pulse 96 per minute, blood pressure 112 over 68, respiratory rate 16 per minute, oxygen saturation 98 percent in air, and temperature 36.9 degrees Celsius, with eight stools a day above baseline since yesterday, a mouth too sore to eat, and painful peeling palms and soles. These remain historical starting observations.');
    lines.push(`Current alertness: ${patient.alertness}. The referral letter states his pre-treatment genotype panel was ${patient.genotypePanelWildType ? 'wild type' : 'variant'}.`);
    lines.push(patient.exclusionsRecordedAtTick === null
      ? 'What the normal pre-treatment panel does not exclude has not been recorded.'
      : 'Recorded: severe toxicity still occurred in 231 of 1018 wild-type patients, 23 percent, and in 39 percent of variant carriers after dose reduction. The panel stratifies risk; it does not clear anybody.');
    lines.push(`Toxicity recorded: ${patient.toxicityRecordedAtTick === null ? 'no' : 'yes, with its severity and the day of the cycle'}. Acute oncology: ${patient.escalationAtTick === null ? 'not contacted' : 'contacted'}. Bounded supportive intent: ${patient.supportiveIntentAtTick === null ? 'not recorded' : 'recorded as the qualified team\u2019s decision'}. Boundaries: ${patient.boundariesReviewedAtTick === null ? 'not reviewed' : 'reviewed'}.`);
    if (patient.nextDoseDue) {
      lines.push(patient.nextDoseTaken
        ? 'The evening dose fell due and he took it, because nobody had told him not to. He did what he was asked to do.'
        : 'The evening dose fell due and he did not take it, because he had been told plainly not to and why.');
    }
    lines.push('Nothing here diagnoses an enzyme deficiency, and none of these figures is a probability for this patient. Grading, dose modification, supportive treatment, and any restart belong to the qualified team; no drug, dose, route, or fluid is selected here, and oxygen settings and exhaled carbon dioxide are not supplied in this lesson.');
    lines.push(patient.observation
      ? `Last requested full assessment at simulated ${formatElapsed(patient.observation.atTick)}: pulse ${patient.observation.heartRateBpm} per minute, ${patient.observation.stoolsToday} stools today, drug ${patient.observation.drugWithheld ? 'withheld' : 'not withheld'}.`
      : 'No new full assessment has been requested.');
    if (patient.serviceObserved) {
      lines.push('Acute oncology has answered, confirmed the drug stays stopped, and taken ownership of grading, further treatment, and any restart.');
    }
    if (patient.choiceFeedback) lines.push(patient.choiceFeedback);
  }
  if (options.incidentalClot) {
    const patient = options.incidentalClot;
    // Strength and certainty are announced together with the recommendation. Either alone is
    // the misreading this lesson exists to prevent.
    lines.push(`The recommendation here is ${patient.recommendationIsConditional ? 'conditional' : 'strong'}, on ${patient.certaintyOfEvidence} certainty in the evidence of effects. The report has gone ${patient.reportUnacknowledgedDays} days unacknowledged.`);
    lines.push('Supplied starting observations were pulse 78 per minute, blood pressure 128 over 74, respiratory rate 15 per minute, oxygen saturation 97 percent in air, and temperature 36.6 degrees Celsius, with no chest symptoms. These remain historical starting observations.');
    lines.push(`Current alertness: ${patient.alertness}. He has bled intermittently from the primary tumour for two months, most recently last week.`);
    lines.push(patient.findingRecordedAtTick === null
      ? 'The finding has not been recorded with how it was found.'
      : `Finding recorded at simulated ${formatElapsed(patient.findingRecordedAtTick)}, with how it was found.`);
    lines.push(patient.tradeoffRecordedAtTick === null
      ? 'The benefit and the harm have not been recorded together, and either figure alone is a different lesson.'
      : 'Recorded together: about 89 fewer deaths and 77 fewer symptomatic emboli per 1000, and about 128 more major bleeds per 1000, all on very uncertain evidence.');
    lines.push(`Certainty: ${patient.certaintyRecordedAtTick === null ? 'not recorded' : 'recorded alongside the recommendation'}. Bleeding risk: ${patient.bleedingRiskRecordedAtTick === null ? 'not recorded' : 'recorded as his own'}. Treating service: ${patient.escalationAtTick === null ? 'not contacted' : 'contacted'}. Shared decision: ${patient.sharedDecisionAtTick === null ? 'not recorded' : 'recorded as one to be made with him'}. Boundaries: ${patient.boundariesReviewedAtTick === null ? 'not reviewed' : 'reviewed'}.`);
    if (patient.patientAsked) {
      lines.push('He has asked whether he has to have this treatment if he feels well, and said, unprompted, that the bleeding frightened him more than anything else has. He is not refusing anything.');
    }
    lines.push('Incidental pulmonary embolism is reported in roughly 3 percent of cancer patients, and the pooled analysis behind these figures followed 926 patients across 11 cohorts of observational data. Whether to anticoagulate, with what, and for how long belongs to the qualified team; no drug, dose, route, or eligibility is selected here, and oxygen settings and exhaled carbon dioxide are not supplied in this lesson.');
    lines.push(patient.observation
      ? `Last requested full assessment at simulated ${formatElapsed(patient.observation.atTick)}: pulse ${patient.observation.heartRateBpm} per minute, blood pressure ${patient.observation.systolicMmHg} over ${patient.observation.diastolicMmHg}, oxygen saturation ${patient.observation.spo2Percent} percent in air.`
      : 'No new full assessment has been requested.');
    if (patient.serviceObserved) {
      lines.push('The treating service has answered, accepted the finding as a decision rather than an automatic action, taken ownership of whether to anticoagulate and with what, and asked that the bleeding history travel with the referral.');
    }
    if (patient.choiceFeedback) lines.push(patient.choiceFeedback);
  }
  if (options.delayedImmuneEvent) {
    const patient = options.delayedImmuneEvent;
    // The exposure and the interval, always together. Either one alone is what the lists already say.
    lines.push(`Completed exposure: ${patient.checkpointInhibitorCycles} cycles of an anti-PD-1 checkpoint inhibitor, last dose ${patient.weeksSinceLastDose} weeks ago. It is ${patient.absentFromCurrentMedicationList ? 'absent from the current medication list, because it stopped' : 'on the current medication list'}.`);
    lines.push('Supplied starting observations were pulse 104 per minute, blood pressure 106 over 64, respiratory rate 18 per minute, oxygen saturation 98 percent in air, and temperature 36.8 degrees Celsius, with seven stools today above his own baseline over three weeks. These remain historical starting observations.');
    lines.push(`Current alertness: ${patient.alertness}. Stools counted today: ${patient.stoolsToday}.`);
    lines.push(patient.exposureRecordedAtTick === null
      ? 'The completed exposure has not been recorded as current history.'
      : `Exposure recorded at simulated ${formatElapsed(patient.exposureRecordedAtTick)} as current history.`);
    lines.push(patient.courseRecordedAtTick === null
      ? 'The symptom course has not been recorded against his own baseline.'
      : 'Course recorded against his own baseline, with its duration.');
    lines.push(`Infection evaluation: ${patient.infectionEvaluationAtTick === null ? 'not recorded' : 'recorded as running alongside rather than ahead'}. Treating service: ${patient.escalationAtTick === null ? 'not contacted' : 'contacted'}. Bounded intent: ${patient.treatmentIntentAtTick === null ? 'not recorded' : 'recorded as the qualified team\u2019s decision'}. Boundaries: ${patient.boundariesReviewedAtTick === null ? 'not reviewed' : 'reviewed'}.`);
    if (patient.courseProgressed) {
      lines.push('An eighth stool has been counted today, with cramping that settles between episodes. The observations have barely moved.');
    }
    lines.push('Immune-related adverse events can occur at any point during treatment or after it has ceased, including beyond six to twelve months. The series naming delayed events collected 23 reported cases with no denominator, so it cannot say how likely this is here. Grading, investigation including endoscopy, and every treatment decision belong to the qualified team; no drug, dose, route, threshold, or eligibility is selected here, and oxygen settings and exhaled carbon dioxide are not supplied in this lesson.');
    lines.push(patient.observation
      ? `Last requested full assessment at simulated ${formatElapsed(patient.observation.atTick)}: pulse ${patient.observation.heartRateBpm} per minute, blood pressure ${patient.observation.systolicMmHg} over ${patient.observation.diastolicMmHg}, ${patient.observation.stoolsToday} stools today.`
      : 'No new full assessment has been requested.');
    if (patient.serviceObserved) {
      lines.push('The treating service has answered, confirmed the cycles and the interval from its own records, taken ownership of grading, investigation and treatment, and recorded that the interval does not exclude an immune-related cause.');
    }
    if (patient.choiceFeedback) lines.push(patient.choiceFeedback);
  }
  if (options.lostContingency) {
    const patient = options.lostContingency;
    // Both counts, always together. A single total would hide the one line that is the lesson.
    lines.push(`Said at handover: ${patient.spokenElements.length} elements. Written in the notes: ${patient.recordedElements.length}. The contingency is ${patient.contingencyWasSpoken ? 'in both' : 'in the notes and was not said'}.`);
    lines.push('Supplied starting observations were pulse 88 per minute, blood pressure 118 over 70, respiratory rate 17 per minute, oxygen saturation 96 percent in air, and temperature 37.1 degrees Celsius. These remain historical starting observations.');
    lines.push(`Current alertness: ${patient.alertness}.`);
    lines.push(patient.spokenRecordedAtTick === null
      ? 'The spoken handover has not been written down. It is the only evidence that something was not said, and it fades.'
      : `Handover recorded: ${patient.spokenElements.join('; ')}.`);
    lines.push(patient.notesCheckedAtTick === null
      ? 'The post-operative notes have not been read.'
      : `Notes read. The record is complete and correct, and holds one element more than was said: ${patient.recordedElements[patient.recordedElements.length - 1]}.`);
    lines.push(patient.contingencyReconstructed === null
      ? 'The contingency is still held only in the notes.'
      : `Reconstructed in the surgical team\u2019s words: ${patient.contingencyReconstructed}`);
    lines.push(`Gap recorded: ${patient.gapRecordedAtTick === null ? 'no' : 'yes, as a transmission gap rather than a documentation gap'}. Consequences: ${patient.consequencesRecordedAtTick === null ? 'not yet stated' : 'stated'}. Confirmation: ${patient.confirmationAtTick === null ? 'not requested' : 'requested'}. Boundaries: ${patient.boundariesReviewedAtTick === null ? 'not reviewed' : 'reviewed'}. Observation: ${patient.monitoringAtTick === null ? 'not arranged' : 'arranged against the written threshold'}.`);
    if (patient.outputReported) {
      lines.push(`The last hourly urine output was ${patient.urineHourlyMl} millilitres, above the plan\u2019s threshold of ${patient.urineThresholdMl} millilitres, with ${patient.consecutiveHoursBelowThreshold} consecutive hours below it. Nothing is triggered. What it does is make the plan matter.`);
    }
    lines.push('Structured handoff reliably increases what the next person holds, and has not been shown to reduce harm: the one cluster-randomised replication raised compliance while preventable adverse events did not move, and no study isolates a lost contingency as a cause of harm. Every quantitative source describes doctors, residents, anaesthetists, or ambulance crews rather than nursing handover. No drug, dose, route, fluid, threshold of the learner\u2019s own devising, or procedure is selected here, and oxygen settings and exhaled carbon dioxide are not supplied in this lesson.');
    lines.push(patient.observation
      ? `Last requested full assessment at simulated ${formatElapsed(patient.observation.atTick)}: ${patient.observation.spokenElements.length} elements said, ${patient.observation.recordedElements.length} written.`
      : 'No new full assessment has been requested.');
    if (patient.confirmationObserved) {
      lines.push('The surgical registrar has confirmed the plan stands as written, unchanged, and recorded that it was confirmed overnight.');
    }
    if (patient.choiceFeedback) lines.push(patient.choiceFeedback);
    if (patient.ended) {
      lines.push(patient.ended === 'handoff'
        ? 'Practice complete. The contingency travels in the surgical team\u2019s words, with its trigger, threshold, action, and owner, and with the fact that it was missing from the handover this shift received.'
        : 'Instructor takeover ended this branch. The teaching stop predicts no patient outcome.');
    }
    return lines.join('\n');
  }

  if (options.oxygenTargetScale) {
    const patient = options.oxygenTargetScale;
    // The score is never announced without the scale it was computed on. A bare 3 is the error the
    // lesson is about, and a screen reader that says only the number reproduces it.
    lines.push(`Saturation ${patient.saturationPercent} percent ${patient.onSupplementalOxygen ? 'on oxygen' : 'breathing air'}, scored ${patient.chartedScore} on scale ${patient.chartedScale}. The prescribed target range is ${patient.prescribedTargetRange} on scale ${patient.prescribedScale}, and the scale decision is ${patient.scaleDecisionDocumented ? 'documented in the notes' : 'not documented'}.`);
    lines.push('Supplied starting observations were pulse 84 per minute, blood pressure 128 over 74, respiratory rate 18 per minute, temperature 36.8 degrees Celsius, and oxygen saturation 90 percent breathing air. These remain historical starting observations.');
    lines.push(`Current alertness: ${patient.alertness}.`);
    lines.push(patient.rescoredAtTick === null
      ? 'The saturation has not been recalculated against the prescribed range.'
      : `Recalculated: ${patient.saturationPercent} percent breathing air scores ${patient.prescribedScaleScore} on the prescribed scale. The measurement is unchanged; the range it is compared with is not.`);
    lines.push('The guideline that sets this range warns that a patient inside it scores points on the ordinary scale and that this may prompt staff to raise the inspired oxygen to reach a normal-looking figure and put her at risk. One cluster-randomised trial found lower mortality with a titrated oxygen strategy than with routine high-flow oxygen, and the same guideline states that it is not known whether this range is the ideal one. The second scale has not been shown to detect deterioration better than the first. No drug, dose, route, oxygen device, flow rate, inspired concentration, or procedure is selected here, and oxygen settings and exhaled carbon dioxide are not supplied in this lesson.');
    lines.push(`Prescription: ${patient.prescriptionCheckedAtTick === null ? 'not read' : 'read'}. Chart: ${patient.chartCheckedAtTick === null ? 'not read' : 'read'}. Mismatch: ${patient.mismatchRecordedAtTick === null ? 'not recorded' : 'recorded'}. Rescore: ${patient.rescoredAtTick === null ? 'not done' : 'done'}. Consequences: ${patient.consequencesRecordedAtTick === null ? 'not yet stated' : 'stated'}. Confirmation: ${patient.confirmationAtTick === null ? 'not requested' : 'requested'}. Boundaries: ${patient.boundariesReviewedAtTick === null ? 'not reviewed' : 'reviewed'}. Observation: ${patient.monitoringAtTick === null ? 'not arranged' : 'arranged on the corrected chart'}.`);
    if (patient.colleagueAskedToRaiseOxygen) {
      lines.push('A colleague has read the score off the chart and offered to put oxygen on her to bring the saturation up.');
    }
    lines.push(patient.prescriptionRecord
      ? `Last prescription read at simulated ${formatElapsed(patient.prescriptionRecord.atTick)}: target ${patient.prescriptionRecord.prescribedTargetRange} on scale ${patient.prescriptionRecord.prescribedScale}.`
      : 'The prescription has not been read.');
    lines.push(patient.chartRecord
      ? `Last chart read at simulated ${formatElapsed(patient.chartRecord.atTick)}: scale ${patient.chartRecord.chartedScale}, scoring ${patient.chartRecord.chartedScore}.`
      : 'The observation chart has not been read.');
    lines.push(patient.observation
      ? `Last requested full assessment at simulated ${formatElapsed(patient.observation.atTick)}: saturation ${patient.observation.saturationPercent} percent, unchanged; chart on scale ${patient.observation.chartedScale}, scoring ${patient.observation.chartedScore}.`
      : 'No new full assessment has been requested.');
    if (patient.reviewObserved) {
      lines.push('The qualified team has confirmed the documented decision and the prescribed range, recorded that the wrong chart was in use, and recorded that a corrected score is not a statement that she is well.');
    }
    if (patient.choiceFeedback) lines.push(patient.choiceFeedback);
    if (patient.ended) {
      lines.push(patient.ended === 'handoff'
        ? 'Practice complete. The prescribed range with its documented decision, the scale the chart had been using, and a score that fell without the patient changing all travel with her.'
        : 'Instructor takeover ended this branch. The teaching stop predicts no patient outcome.');
    }
    return lines.join('\n');
  }

  if (options.lastKnownWell) {
    const patient = options.lastKnownWell;
    // The empty onset field is announced as empty. Saying "not known" out loud is what stops it
    // being quietly filled with something that reads like an observation.
    lines.push(`Onset time: ${patient.onsetTimeRecorded ?? 'not known'}. Last known well ${patient.lastKnownWellClock}, found ${patient.foundClock}, an unwitnessed interval ${patient.unwitnessedHours} hours wide.`);
    lines.push('Supplied starting observations were pulse 86 per minute, blood pressure 158 over 88, respiratory rate 16 per minute, oxygen saturation 96 percent in air, temperature 36.7 degrees Celsius, and blood glucose 6.2 millimoles per liter. These remain historical starting observations.');
    lines.push(`Current alertness: ${patient.alertness}.`);
    lines.push(patient.boundRecordedAtTick === null
      ? 'The chart offers a box labelled onset time.'
      : 'Last known well is a bound: the deficit began at some point after 22:40. That is true and useful, and it is not an onset.');
    lines.push('An unknown onset is a reason to escalate for assessment rather than to stand down. A randomised trial in patients whose deficits began at an unknown time assessed eligibility by imaging as a surrogate for lesion age rather than by a remembered time. It reported numerically more deaths and significantly more parenchymal haematoma in the treated group, and it was stopped early when its funding ended, so it was never powered to measure harm. That describes a population and a pathway rather than this patient. No drug, dose, route, imaging request, eligibility determination, or procedure is selected here, and oxygen settings and exhaled carbon dioxide are not supplied in this lesson.');
    lines.push(`Bound: ${patient.boundRecordedAtTick === null ? 'not yet recorded' : 'recorded and labelled as a bound'}. Recollection: ${patient.recollectionRecordedAtTick === null ? 'not yet recorded' : 'recorded in her words and marked uncertain'}. Pathway: ${patient.pathwayActivatedAtTick === null ? 'not activated' : 'activated on the deficit'}. Consequences: ${patient.consequencesRecordedAtTick === null ? 'not yet stated' : 'stated'}. Boundaries: ${patient.boundariesReviewedAtTick === null ? 'not reviewed' : 'reviewed'}. Observation: ${patient.monitoringAtTick === null ? 'not arranged' : 'arranged, with each finding timed'}.`);
    if (patient.recollectionPressed) {
      lines.push('Pressed on the time, the care assistant moved it by an hour and said she would not swear to it. Pressing an uncertain recollection does not make it certain.');
    }
    lines.push(patient.timelineRecord
      ? `Last requested timeline check at simulated ${formatElapsed(patient.timelineRecord.atTick)}: ${patient.timelineRecord.certainEntries} of ${patient.timelineRecord.totalEntries} entries documented; the interval containing the onset is ${patient.timelineRecord.unwitnessedHours} hours wide.`
      : 'No new timeline check has been requested.');
    lines.push(patient.patientRecord
      ? `Last requested observation at simulated ${formatElapsed(patient.patientRecord.atTick)}: ${patient.patientRecord.focalDeficit ? 'new right-sided weakness present' : 'no focal deficit'}. The blood glucose supplied at discovery was ${patient.patientRecord.glucoseMmolL.toFixed(1)} millimoles per liter and is not retested here.`
      : 'No new observation of the patient has been requested.');
    lines.push(patient.observation
      ? `Last requested full assessment at simulated ${formatElapsed(patient.observation.atTick)}: ${patient.observation.focalDeficit ? 'deficit persists' : 'no deficit'}; unwitnessed interval ${patient.observation.unwitnessedHours} hours.`
      : 'No new full assessment has been requested.');
    if (patient.assessmentObserved) {
      lines.push('The stroke team has assessed, recorded the bound as a bound, kept the recollection separate and uncertain, and is proceeding on imaging-based assessment rather than a remembered time.');
    }
    if (patient.choiceFeedback) lines.push(patient.choiceFeedback);
    if (patient.ended) {
      lines.push(patient.ended === 'handoff'
        ? 'Practice complete. The bound, the uncertain recollection, the basis for activation, and an onset field that is empty because nobody knows what belongs in it all travel with the patient.'
        : 'Instructor takeover ended this branch. The teaching stop predicts no patient outcome.');
    }
    return lines.join('\n');
  }

  if (options.proxyScale) {
    const patient = options.proxyScale;
    // The total is always announced with what it counts. A bare number invites being heard as
    // an intensity, which is the error this lesson refuses.
    lines.push(`Behavioural total ${patient.behaviouralTotal}, the sum of ${patient.itemCount} observed items. Self-report ${patient.selfReportAvailable ? 'available' : 'unavailable'}.`);
    lines.push('Supplied starting observations were pulse 78 per minute, blood pressure 132 over 76, respiratory rate 18 per minute, oxygen saturation 96 percent in air, temperature 36.9 degrees Celsius, all unremarkable, one day after hemiarthroplasty. These remain historical starting observations.');
    lines.push(`Current alertness: ${patient.alertness}.`);
    lines.push(patient.limitsRecordedAtTick === null
      ? 'The reference standard for pain is self-report, and it is unavailable here.'
      : 'The total is not an intensity out of ten and has no validated conversion to one. It also cannot be read downward: a limited behavioural repertoire produces few behaviours whether or not something hurts, and the item sets are not comprehensive.');
    lines.push('The assessment hierarchy runs: attempt self-report; consider whether a cause of pain is present; observe behaviours; obtain a proxy report from someone who knows the person; and treat the response to an analgesic trial as further information. Pulse and blood pressure sit at the bottom as unreliable indicators. No agent, dose, route, or interval is selected here, and oxygen settings and exhaled carbon dioxide are not supplied in this lesson.');
    lines.push(`Self-report: ${patient.selfReportAttemptedAtTick === null ? 'not yet attempted' : `attempted at simulated ${formatElapsed(patient.selfReportAttemptedAtTick)} and unsuccessful`}. Behaviours: ${patient.behavioursRecordedAtTick === null ? 'not yet recorded' : 'recorded as behaviours'}. Limits: ${patient.limitsRecordedAtTick === null ? 'not yet stated' : 'stated in both directions'}. Proxy history: ${patient.proxyHistoryAtTick === null ? 'not obtained' : 'obtained and recorded'}. Analgesic intent: ${patient.analgesicIntentAtTick === null ? 'not recorded' : 'recorded with the reasoning stated'}. Reassessment: ${patient.monitoringAtTick === null ? 'not scheduled' : 'scheduled'}.`);
    lines.push(patient.familyArrived
      ? (patient.proxyHistoryAtTick === null
        ? 'His daughter is here for visiting and has cared for him at home for four years.'
        : 'Recorded in her words: he goes quiet and still rather than restless, he holds his breath in a particular way, and the flat expression is not how he was last week.')
      : 'There is nobody present who knows his baseline.');
    lines.push(patient.behaviourRecord
      ? `Last requested observation at simulated ${formatElapsed(patient.behaviourRecord.atTick)}: total ${patient.behaviourRecord.total} across ${patient.behaviourRecord.itemCount} items.`
      : 'No new behavioural observation has been requested.');
    lines.push(patient.contextRecord
      ? `Last requested context at simulated ${formatElapsed(patient.contextRecord.atTick)}: ${patient.contextRecord.recentSurgery ? 'an operation yesterday that would be expected to hurt' : 'no recent procedure'}; ${patient.contextRecord.proxyAvailable ? 'a relative who knows his baseline is present' : 'no proxy present'}.`
      : 'No new context check has been requested.');
    lines.push(patient.observation
      ? `Last requested full assessment at simulated ${formatElapsed(patient.observation.atTick)}: total ${patient.observation.total}; self-report ${patient.observation.selfReportAvailable ? 'available' : 'unavailable'}.`
      : 'No new full assessment has been requested.');
    if (patient.reviewObserved) {
      lines.push('The qualified team has reviewed and recorded that the total is unchanged, that a total is not an intensity, and that the response to treatment is further evidence rather than confirmation.');
    }
    if (patient.choiceFeedback) lines.push(patient.choiceFeedback);
    if (patient.ended) {
      lines.push(patient.ended === 'handoff'
        ? 'Practice complete. The attempted self-report, the behaviours with their total, the proxy account, and the reassessment schedule all travel with the patient.'
        : 'Instructor takeover ended this branch. The teaching stop predicts no patient outcome.');
    }
    return lines.join('\n');
  }

  if (options.quietPatient) {
    const patient = options.quietPatient;
    // The count of screening results leads, because zero is the finding.
    lines.push(`Screening results in the record: ${patient.recordedScreenResults}. ${patient.screenPositive
      ? 'A screen has been performed in this rehearsal and is positive.'
      : 'No screen has been performed. The record holds no negative screen; it holds no screen.'}`);
    lines.push('Supplied starting observations were pulse 82 per minute, blood pressure 126 over 74, respiratory rate 16 per minute, oxygen saturation 96 percent in air, temperature 36.8 degrees Celsius, all unremarkable, two days after fixation of a fractured neck of femur. These remain historical starting observations.');
    lines.push(`Current alertness: ${patient.alertness}.`);
    lines.push(`Charted impressions across the last three shifts: ${patient.chartedImpressions.map((entry) => `"${entry}"`).join(' ')}`);
    lines.push(patient.impressionsReviewedAtTick === null
      ? 'He has been sleeping through meals and is slow to answer, and his family say this is not how he was a week ago.'
      : 'Every one of those entries is an impression and none is a screening result. Absence of a positive finding and a negative finding are different things, and only the first is present here.');
    lines.push('The hypoactive subtype is about half of cases in reported series and the most frequently missed. Under routine multicentre use the 4AT reached 76 percent sensitivity and the CAM 40 percent, so a negative result is weak evidence of absence. Impaired arousal is itself scoreable, so a drowsy patient can be screened rather than left. No drug, dose, route, fluid, investigation, or procedure is selected here, and oxygen settings and exhaled carbon dioxide are not supplied in this lesson.');
    lines.push(`Impressions reviewed: ${patient.impressionsReviewedAtTick === null ? 'not yet' : `at simulated ${formatElapsed(patient.impressionsReviewedAtTick)}`}. Screen: ${patient.screenedAtTick === null ? 'not performed' : 'performed, and positive'}. Result recorded: ${patient.resultRecordedAtTick === null ? 'not yet' : 'recorded as a screening result'}. Escalation: ${patient.escalationAtTick === null ? 'not yet requested' : 'requested on the screening result'}. Boundaries: ${patient.boundariesReviewedAtTick === null ? 'not reviewed' : 'reviewed'}. Repeat screening: ${patient.monitoringAtTick === null ? 'not scheduled' : 'scheduled at defined intervals'}.`);
    if (patient.handoverRepeated && patient.screenedAtTick === null) {
      lines.push('The outgoing nurse has added it to the handover in the same words. A fourth entry is about to read exactly like the first three.');
    }
    lines.push(patient.chartRecord
      ? `Last requested chart review at simulated ${formatElapsed(patient.chartRecord.atTick)}: ${patient.chartRecord.impressions.length} entries across ${patient.chartRecord.shifts} shifts, ${patient.chartRecord.screenResults} screening results.`
      : 'No new chart review has been requested.');
    lines.push(patient.patientRecord
      ? `Last requested observation at simulated ${formatElapsed(patient.patientRecord.atTick)}: ${patient.patientRecord.rousable ? 'rousable' : 'not rousable'}; ${patient.patientRecord.attentive ? 'attentive' : 'inattentive within seconds'}; ${patient.patientRecord.agitated ? 'agitated' : 'not agitated'}.`
      : 'No new observation of the patient has been requested.');
    lines.push(patient.observation
      ? `Last requested full assessment at simulated ${formatElapsed(patient.observation.atTick)}: ${patient.observation.attentive ? 'attentive' : 'inattentive'}; ${patient.observation.screenResults} screening results across ${patient.observation.shifts} shifts.`
      : 'No new full assessment has been requested.');
    if (patient.reviewObserved) {
      lines.push('The review has happened and reached the same conclusion, recording that the preceding three shifts contain no screening result of any kind.');
    }
    if (patient.choiceFeedback) lines.push(patient.choiceFeedback);
    if (patient.ended) {
      lines.push(patient.ended === 'handoff'
        ? 'Practice complete. The impressions as written, the screen and its positive components, the repeat schedule, and the absence of any earlier result all travel with the patient.'
        : 'Instructor takeover ended this branch. The teaching stop predicts no patient outcome.');
    }
    return lines.join('\n');
  }

  if (options.afferentLimb) {
    const patient = options.afferentLimb;
    // The threshold state leads, because it was settled before the rehearsal began.
    lines.push(`${patient.metCriteriaCount} of ${patient.totalCriteriaCount} activation criteria met, against a local policy requiring ${patient.policyThreshold}. ${patient.calledAtTick === null
      ? 'The call has not been made.'
      : `Response team called at simulated ${formatElapsed(patient.calledAtTick)}.`}`);
    lines.push('Supplied starting observations were respiratory rate 30 per minute, blood pressure 88 over 54, oxygen saturation 93 percent on newly required supplemental oxygen, pulse 118 per minute, temperature 37.8 degrees Celsius, five days after emergency laparotomy. These remain historical starting observations.');
    lines.push(`Current alertness: ${patient.alertness}.`);
    lines.push(patient.obstaclesRecordedAtTick === null
      ? 'The charge nurse says the team came yesterday and found nothing, and that they are busy elsewhere. The covering doctor is in theatre.'
      : 'Recorded: the team attended yesterday and found nothing, they are occupied elsewhere, and the covering doctor is in theatre. None of these is a clinical finding, and none appears among the criteria.');
    lines.push('The criteria are the authorisation and no permission is required. No drug, dose, route, fluid, oxygen setting, investigation, or procedure is selected here, and exhaled carbon dioxide is not supplied in this lesson.');
    lines.push(`Criteria recorded: ${patient.criteriaRecordedAtTick === null ? 'not yet' : `at simulated ${formatElapsed(patient.criteriaRecordedAtTick)}`}. Obstacles recorded: ${patient.obstaclesRecordedAtTick === null ? 'not yet' : 'recorded plainly'}. Call: ${patient.calledAtTick === null ? 'not made' : 'made on the met threshold'}. Concern stated: ${patient.concernStatedAtTick === null ? 'not yet' : 'stated to a person'}. Boundaries: ${patient.boundariesReviewedAtTick === null ? 'not reviewed' : 'reviewed'}. Observation: ${patient.monitoringAtTick === null ? 'not increased' : 'increased, with the reason recorded'}.`);
    if (patient.pressureApplied && patient.calledAtTick === null) {
      lines.push('The charge nurse has repeated the discouragement. Nothing about the patient has changed, and the criteria are still met.');
    }
    lines.push(patient.criteriaRecord
      ? `Last requested criteria check at simulated ${formatElapsed(patient.criteriaRecord.atTick)}: ${patient.criteriaRecord.metCount} of ${patient.criteriaRecord.totalCount} met against a threshold of ${patient.criteriaRecord.policyThreshold}.`
      : 'No new criteria check has been requested.');
    lines.push(patient.availabilityRecord
      ? `Last requested availability at simulated ${formatElapsed(patient.availabilityRecord.atTick)}: response team ${patient.availabilityRecord.responseTeamReachable ? 'reachable' : 'not reachable'}; covering doctor ${patient.availabilityRecord.coveringDoctorAvailable ? 'available' : 'in theatre'}. The response team is reachable regardless of the rest.`
      : 'No new availability check has been requested.');
    lines.push(patient.observation
      ? `Last requested full assessment at simulated ${formatElapsed(patient.observation.atTick)}: respiratory rate ${patient.observation.respiratoryRateBpm} per minute; systolic ${patient.observation.systolicMmHg}; ${patient.observation.metCount} of ${patient.observation.totalCount} criteria met.`
      : 'No new full assessment has been requested.');
    if (patient.arrivalObserved) {
      lines.push('The response team is present and has taken over. They recorded that the criteria were met on arrival.');
    }
    if (patient.choiceFeedback) lines.push(patient.choiceFeedback);
    if (patient.ended) {
      lines.push(patient.ended === 'handoff'
        ? 'Practice complete. Which criteria were met and when, that the call was made on the threshold rather than on permission, and the obstacles as recorded all travel with the patient.'
        : 'Instructor takeover ended this branch. The teaching stop predicts no patient outcome and is not evidence that the delay caused harm.');
    }
    return lines.join('\n');
  }

  if (options.pairedReading) {
    const patient = options.pairedReading;
    // Both numbers are announced together once the second exists, and the first is never amended.
    lines.push(`Oximeter reading ${patient.oximeterPercent} percent on air with a good trace. ${patient.arterialPercent === null
      ? 'The arterial sample sent earlier has not returned.'
      : `Arterial saturation from the same minute: ${patient.arterialPercent} percent.`}`);
    lines.push('Supplied starting observations were oximeter 94 percent on room air with a good trace, a warm hand, no nail covering, respiratory rate 24 counted for a full minute, blood pressure 132 over 78, pulse 98 per minute, temperature 37.4 degrees Celsius, alert and speaking in full sentences, four days after abdominal surgery. These remain historical starting observations.');
    lines.push(`Current alertness: ${patient.alertness}.`);
    lines.push(patient.gapExplainedAtTick === null
      ? 'Every bedside explanation for a wrong reading, meaning poor trace, cold hand, nail covering, motion, or probe position, can be checked. None of them explains a reading that is too high.'
      : 'This gap is not a poor trace, a cold hand, nail covering, motion, or probe position. Pulse oximetry infers saturation from how light is absorbed, and skin pigmentation changes that absorbance, so the device overestimates arterial saturation more often in patients with darker skin. A systematic review of 732,505 paired measurements reports occult hypoxaemia roughly two-thirds more common in Black patients, at moderate certainty of evidence.');
    lines.push('The bias is optical rather than a perfusion artifact, so repositioning the probe, warming the hand, or switching digits does not correct it. A 2025 draft regulatory guidance applies to devices submitted for approval in future and does not recall or recalibrate devices already in service. No drug, dose, route, fluid, oxygen setting, investigation, or procedure is selected here, and exhaled carbon dioxide is not supplied in this lesson.');
    lines.push(`Reading recorded: ${patient.oximeterRecordedAtTick === null ? 'not yet' : `at simulated ${formatElapsed(patient.oximeterRecordedAtTick)}`}. Paired values: ${patient.pairedAtTick === null ? 'not recorded' : 'recorded together, with the reading unamended'}. Gap characterised: ${patient.gapExplainedAtTick === null ? 'not yet' : 'recorded'}. Escalation: ${patient.escalationAtTick === null ? 'not yet requested' : 'requested on the arterial value'}. Boundaries: ${patient.boundariesReviewedAtTick === null ? 'not reviewed' : 'reviewed'}. Observation: ${patient.monitoringAtTick === null ? 'not arranged' : 'arranged, independent of the oximeter'}.`);
    lines.push(patient.oximeterRecord
      ? `Last requested device check at simulated ${formatElapsed(patient.oximeterRecord.atTick)}: reading ${patient.oximeterRecord.readingPercent} percent; ${patient.oximeterRecord.goodTrace ? 'good trace' : 'poor trace'}; ${patient.oximeterRecord.warmPeriphery ? 'warm periphery' : 'cool periphery'}.`
      : 'No new device check has been requested.');
    lines.push(patient.patientRecord
      ? `Last requested observation at simulated ${formatElapsed(patient.patientRecord.atTick)}: respiratory rate ${patient.patientRecord.respiratoryRateBpm} counted for a full minute; ${patient.patientRecord.arterialAvailable ? 'arterial result available' : 'no arterial result yet'}.`
      : 'No new observation of the patient has been requested.');
    lines.push(patient.observation
      ? `Last requested full assessment at simulated ${formatElapsed(patient.observation.atTick)}: oximeter ${patient.observation.readingPercent} percent; respiratory rate ${patient.observation.respiratoryRateBpm}.`
      : 'No new full assessment has been requested.');
    if (patient.gasObserved) {
      lines.push(`The arterial sample returned at ${patient.arterialPercent} percent while the oximeter read ${patient.oximeterPercent} percent. Both numbers are from the same minute and the same patient.`);
    }
    if (patient.reviewObserved) {
      lines.push('The review is acting on the arterial value. The oximeter continues to read in the nineties, correctly by its own calibration, and no fault is found with the device or with anyone who read it.');
    }
    if (patient.choiceFeedback) lines.push(patient.choiceFeedback);
    if (patient.ended) {
      lines.push(patient.ended === 'handoff'
        ? 'Practice complete. Both values, the reason the gap exists, and the fact that the chart will keep reading reassuringly all travel with the patient.'
        : 'Instructor takeover ended this branch. The teaching stop predicts no patient outcome.');
    }
    return lines.join('\n');
  }

  if (options.countedRate) {
    const patient = options.countedRate;
    // Both numbers are announced together once the second exists: the discrepancy is the finding.
    lines.push(`Charted respiratory rates: ${patient.chartedEntries.join(', ')}. ${patient.countedRate === null
      ? 'Nothing has been counted for a full minute in this rehearsal yet.'
      : `Counted for a full minute: ${patient.countedRate}.`}`);
    lines.push('Supplied starting observations were oxygen saturation 95 percent in air, pulse 96 per minute, blood pressure 124 over 72, temperature 37.2 degrees Celsius, alert and speaking in full sentences, two days after open abdominal surgery. These remain historical starting observations.');
    lines.push(`Current alertness: ${patient.alertness}.`);
    lines.push(patient.trendReviewedAtTick === null
      ? 'The charted trend has not been reviewed yet.'
      : 'Read as a trend, the charted column is a stable patient. Read as a distribution, it is six values drawn from a set of two, which is what estimation looks like when it is written down.');
    lines.push('Respiratory rate is the single strongest routine predictor of in-hospital cardiac arrest and also the observation most often estimated rather than counted. A rising rate precedes desaturation, so a normal oxygen saturation does not make it redundant. Whether a monitor-derived rate is equivalent to a counted one is not established in the retrievable evidence. No drug, dose, route, fluid, investigation, or procedure is selected here, and oxygen settings and exhaled carbon dioxide are not supplied in this lesson.');
    lines.push(`Trend reviewed: ${patient.trendReviewedAtTick === null ? 'not yet' : `at simulated ${formatElapsed(patient.trendReviewedAtTick)}`}. Counted: ${patient.countedAtTick === null ? 'not yet' : `at simulated ${formatElapsed(patient.countedAtTick)}`}. Discrepancy: ${patient.discrepancyRecordedAtTick === null ? 'not recorded' : 'recorded, and left unreconciled'}. Escalation: ${patient.escalationAtTick === null ? 'not yet requested' : 'requested on the counted value'}. Boundaries: ${patient.boundariesReviewedAtTick === null ? 'not reviewed' : 'reviewed'}. Increased observation: ${patient.monitoringAtTick === null ? 'not arranged' : 'arranged, with counting rather than estimation'}.`);
    lines.push(patient.chartRecord
      ? `Last requested chart review at simulated ${formatElapsed(patient.chartRecord.atTick)}: ${patient.chartRecord.entries.join(', ')} across ${patient.chartRecord.shifts} shifts, taking ${patient.chartRecord.distinctValues} distinct values.`
      : 'No new chart review has been requested.');
    lines.push(patient.patientRecord
      ? `Last requested observation at simulated ${formatElapsed(patient.patientRecord.atTick)}: respiratory rate ${patient.patientRecord.countedRate} counted for a full minute; oxygen saturation ${patient.patientRecord.spo2Percent} percent on air.`
      : 'No new observation of the patient has been requested.');
    lines.push(patient.observation
      ? `Last requested full assessment at simulated ${formatElapsed(patient.observation.atTick)}: charted ${patient.observation.entries.join(', ')}; counted ${patient.observation.countedRate}.`
      : 'No new full assessment has been requested.');
    if (patient.reviewObserved) {
      lines.push('The qualified team counted independently and reached the same number, and recorded that the charted column gave no indication of it.');
    }
    if (patient.choiceFeedback) lines.push(patient.choiceFeedback);
    if (patient.ended) {
      lines.push(patient.ended === 'handoff'
        ? 'Practice complete. The charted column as written, the counted rate, and the unreconciled discrepancy all travel with the patient.'
        : 'Instructor takeover ended this branch. The teaching stop predicts no patient outcome.');
    }
    return lines.join('\n');
  }

  if (options.lowScore) {
    const patient = options.lowScore;
    // The score is announced first and plainly, because the lesson is not that it is wrong.
    lines.push(`Aggregate early-warning score ${patient.aggregateScore}, which is below the local escalation threshold and is calculated correctly.`);
    lines.push('Supplied starting observations were respiratory rate 18 counted for a full minute, oxygen saturation 96 percent in air with no supplemental oxygen, blood pressure 118 over 68, heart rate 88 per minute, temperature 36.9 degrees Celsius, and alert. These remain historical starting observations.');
    lines.push(`Current alertness: ${patient.alertness}.`);
    lines.push('Her daughter reports that she is not herself and cannot say more than that. There is no field for that on the chart.');
    lines.push(patient.exclusionsRecordedAtTick === null
      ? 'What the score does and does not exclude has not been recorded yet.'
      : 'Recorded: in a cohort of patients with bacteraemia, a score at the escalation threshold had a sensitivity for sepsis of about 87 percent, so roughly one in eight patients with sepsis and a positive blood culture scored below it. The study authors state that a score below the threshold cannot definitively rule out sepsis.');
    lines.push('This score is a screening instrument rather than a diagnostic test. Roughly a third of older adults with serious infection are not febrile, and a rate-controlling medication blunts the tachycardia the score partly depends on. No drug, dose, route, fluid, investigation, or procedure is selected here, and oxygen settings and exhaled carbon dioxide are not supplied in this lesson.');
    lines.push(`Observations recorded: ${patient.observationsRecordedAtTick === null ? 'not yet' : `at simulated ${formatElapsed(patient.observationsRecordedAtTick)}`}. Family report: ${patient.familyReportRecordedAtTick === null ? 'not yet recorded' : 'recorded in the words it was given'}. Escalation: ${patient.escalationAtTick === null ? 'not yet requested' : 'requested on recorded concern'}. Boundaries: ${patient.boundariesReviewedAtTick === null ? 'not reviewed' : 'reviewed'}. Increased observation: ${patient.monitoringAtTick === null ? 'not arranged' : 'arranged'}.`);
    if (patient.familyConcernRaised) {
      lines.push('The daughter has stated the concern again, more plainly. The observations and the score have not moved.');
    }
    lines.push(patient.observationRecord
      ? `Last requested observations at simulated ${formatElapsed(patient.observationRecord.atTick)}: respiratory rate ${patient.observationRecord.respiratoryRateBpm} per minute; heart rate ${patient.observationRecord.heartRateBpm} per minute; temperature ${patient.observationRecord.coreTemperatureC.toFixed(1)} degrees Celsius; aggregate score ${patient.observationRecord.aggregateScore}.`
      : 'No new observation-only check has been requested.');
    lines.push(patient.contextRecord
      ? `Last requested context at simulated ${formatElapsed(patient.contextRecord.atTick)}: ${patient.contextRecord.rateControlMedication ? 'a rate-controlling medication is charted' : 'no rate-controlling medication is charted'}; baseline ${patient.contextRecord.baselineDescription}.`
      : 'No new context check has been requested.');
    lines.push(patient.observation
      ? `Last requested full assessment at simulated ${formatElapsed(patient.observation.atTick)}: respiratory rate ${patient.observation.respiratoryRateBpm} per minute; heart rate ${patient.observation.heartRateBpm} per minute; aggregate score ${patient.observation.aggregateScore}.`
      : 'No new full assessment has been requested.');
    if (patient.reviewObserved) {
      lines.push(`The review has happened. Cultures were taken and later grew an organism, and the qualified team recorded that treatment was warranted at the time of the call. The score at that moment was still ${patient.aggregateScore}.`);
    }
    if (patient.choiceFeedback) lines.push(patient.choiceFeedback);
    if (patient.ended) {
      lines.push(patient.ended === 'handoff'
        ? 'Practice complete. The observations with the score as calculated, what the score does not exclude, the family report, and the reason review was requested all travel with the patient.'
        : 'Instructor takeover ended this branch. The teaching stop predicts no patient outcome.');
    }
    return lines.join('\n');
  }

  if (options.meningitisImaging) {
    const patient = options.meningitisImaging;
    // The recorded fact is announced before the countdown, so a passed ceiling never reads as
    // "nothing recorded" alongside a line reporting what was recorded.
    lines.push(patient.antimicrobialIntentAtTick !== null
      ? `Antimicrobial intent recorded ${patient.antimicrobialInsideCeiling ? 'inside the hour' : 'after the hour had passed'}.`
      : patient.ceilingPassed
        ? 'One hour has elapsed since arrival with no antimicrobial intent recorded. The ceiling has passed, and that is reported rather than hidden.'
        : `Ceiling: ${Math.ceil((patient.ceilingDueInSeconds ?? 0) / 60)} simulated minutes remain of the hour.`);
    lines.push('Supplied starting findings were temperature 38.7 degrees Celsius, heart rate 104 per minute, blood pressure 128 over 74, respiratory rate 20 per minute, Glasgow Coma Scale 14, C-reactive protein 142 milligrams per liter, and white cells 15.1. Present: age 68, maintenance immunosuppression after kidney transplantation, and a Glasgow Coma Scale of 14. Absent: focal deficit, seizure, papilloedema, pupillary abnormality, purpura, shock, and bleeding risk. These remain historical starting findings.');
    lines.push(`Current alertness: ${patient.alertness}.`);
    lines.push('Every published rule set turns on exactly which of those features are present, so the absences matter as much as the presences.');
    lines.push(patient.criteriaCompared
      ? 'Applied to this one patient: the Swedish national criteria indicate no imaging before lumbar puncture. NICE NG240 indicates no imaging. ESCMID indicates imaging, on a severely immunocompromised state. The archived IDSA guideline indicates imaging, on immunocompromise, an abnormal level of consciousness, and age 60 or over. WHO indicates imaging where it is readily accessible, on a severe immunocompromised state. Two say image, three do not, and the patient did not change between those readings.'
      : 'The published criteria sets have not been compared yet. Whether this patient needs imaging before lumbar puncture depends on which set is applied.');
    lines.push('Antimicrobials start within the hour and diagnostics, imaging included, must not delay them. The evidence behind that target was graded very low to low quality by its own developers, which makes it a system-design margin rather than a validated deadline. No agent, dose, route, combination, or adjunct is selected here, and oxygen settings and exhaled carbon dioxide are not supplied in this lesson.');
    lines.push(`Features: ${patient.featuresRecordedAtTick === null ? 'not yet recorded' : `recorded at simulated ${formatElapsed(patient.featuresRecordedAtTick)}`}. Ownership: ${patient.ownersActivatedAtTick === null ? 'not yet activated' : 'activated, with cultures drawn rather than resulted'}. Criteria comparison: ${patient.criteriaComparedAtTick === null ? 'not done' : 'done'}. Boundaries: ${patient.boundariesReviewedAtTick === null ? 'not reviewed' : 'reviewed'}. Monitoring: ${patient.monitoringAtTick === null ? 'not arranged' : 'arranged'}.`);
    lines.push(patient.featureObservation
      ? `Last requested neurological observation at simulated ${formatElapsed(patient.featureObservation.atTick)}: Glasgow Coma Scale ${patient.featureObservation.glasgowComaScale}; ${patient.featureObservation.focalDeficit ? 'focal deficit present' : 'no focal deficit'}; ${patient.featureObservation.seizure ? 'seizure observed' : 'no seizure'}.`
      : 'No new neurological-only observation has been requested.');
    lines.push(patient.labObservation
      ? `Last requested laboratory evidence at simulated ${formatElapsed(patient.labObservation.atTick)}: C-reactive protein ${patient.labObservation.crpMgL} milligrams per liter; white cells ${patient.labObservation.whiteCellsX109L.toFixed(1)}.`
      : 'No new laboratory-only measurement has been requested.');
    lines.push(patient.observation
      ? `Last requested full assessment at simulated ${formatElapsed(patient.observation.atTick)}: Glasgow Coma Scale ${patient.observation.glasgowComaScale}; heart rate ${patient.observation.heartRateBpm} per minute; C-reactive protein ${patient.observation.crpMgL} milligrams per liter.`
      : 'No new full assessment has been requested.');
    if (patient.imagingObserved) {
      lines.push('The scan is reported as showing no space-occupying lesion and no midline shift. It changed no management, which is the common result rather than a lucky one.');
    }
    if (patient.choiceFeedback) lines.push(patient.choiceFeedback);
    if (patient.ended) {
      lines.push(patient.ended === 'handoff'
        ? 'Practice complete. The recorded features and absences, which criteria sets they satisfy, whether intent fell inside the hour, and any microbiological yield lost all travel with the patient.'
        : 'Instructor takeover ended this branch. The teaching stop predicts no patient outcome.');
    }
    return lines.join('\n');
  }

  if (options.septicShockLabel) {
    const patient = options.septicShockLabel;
    lines.push(patient.resuscitationIntentAtTick !== null
      ? `Resuscitation intent recorded ${patient.resuscitationIntentInsideCeiling ? 'inside the hour' : 'after the hour had passed'}.`
      : patient.ceilingPassed
        ? 'One hour has elapsed with no bounded resuscitation intent recorded. The ceiling has passed, and that is reported rather than hidden.'
        : `Ceiling: ${Math.ceil((patient.ceilingDueInSeconds ?? 0) / 60)} simulated minutes remain of the hour this tier carries.`);
    for (const field of ['systolicMmHg', 'diastolicMmHg'] as const) {
      const value = state[field];
      if (!options.invalid.has(field) && Number.isFinite(value)) {
        lines.push(`${FIELDS[field].label}: ${value.toFixed(FIELDS[field].precision)} ${FIELDS[field].unit}.`);
      }
    }
    lines.push('Supplied starting findings were temperature 38.9 degrees Celsius, heart rate 118 per minute, blood pressure 84 over 48 with a mean of 60, respiratory rate 26 per minute, lactate 3.6 millimoles per liter, and capillary refill 4.1 seconds, with no vasopressor running and no fluid resuscitation completed. These remain historical starting findings.');
    lines.push(`Current alertness: ${patient.alertness}.`);
    // Each part is announced separately, because a single verdict would hide which parts the
    // treatment made answerable and which were answerable already.
    lines.push(`Septic shock requires three things together. Vasopressors needed to maintain a mean arterial pressure at or above 65: ${patient.trialObserved ? 'met' : 'not yet decidable'}. That mean pressure held at target on support: ${patient.trialObserved ? 'met' : 'not yet decidable'}. A serum lactate above 2 millimoles per liter, which the current value already exceeds, though the definition asks for it after resuscitation: met.`);
    lines.push(patient.trialObserved
      ? 'All three can now be read together, and this meets septic shock. It did so only once the treatment had run, so the label reflects a treatment as much as a patient.'
      : 'The lactate is already above the threshold, but that threshold applies after resuscitation, and the other two describe a vasopressor that is not running. Two of the three have no truth value yet.');
    lines.push('The consensus task force stated that criteria for adequate fluid resuscitation and for need for vasopressor therapy could not be explicitly specified, because they are highly user dependent. No fluid volume, rate, vasoactive agent, dose, or endpoint is selected here, and oxygen settings and exhaled carbon dioxide are not supplied in this lesson.');
    lines.push(`Hypoperfusion: ${patient.hypoperfusionAtTick === null ? 'not yet recorded' : `recorded at simulated ${formatElapsed(patient.hypoperfusionAtTick)}`}. Critical care: ${patient.criticalCareAtTick === null ? 'not yet activated' : 'activated on the perfusion pattern'}. Classification: ${patient.classificationOpenAtTick === null ? 'not yet recorded' : 'recorded as open, with the reason'}. Boundaries: ${patient.boundariesReviewedAtTick === null ? 'not reviewed' : 'reviewed'}. Monitoring: ${patient.monitoringAtTick === null ? 'not arranged' : 'arranged'}.`);
    lines.push(patient.labObservation
      ? `Last requested laboratory evidence at simulated ${formatElapsed(patient.labObservation.atTick)}: lactate ${patient.labObservation.lactateMmolL.toFixed(1)} millimoles per liter; creatinine ${patient.labObservation.creatinineUmolL} micromoles per liter.`
      : 'No new laboratory-only measurement has been requested.');
    lines.push(patient.perfusionObservation
      ? `Last requested examination at simulated ${formatElapsed(patient.perfusionObservation.atTick)}: mean pressure ${patient.perfusionObservation.meanArterialMmHg}; capillary refill ${patient.perfusionObservation.capillaryRefillSeconds.toFixed(1)} seconds; ${patient.perfusionObservation.vasopressorRunning ? 'vasopressor support running' : 'no vasopressor running'}.`
      : 'No new perfusion-only examination has been requested.');
    lines.push(patient.observation
      ? `Last requested full assessment at simulated ${formatElapsed(patient.observation.atTick)}: heart rate ${patient.observation.heartRateBpm} per minute; mean pressure ${patient.observation.meanArterialMmHg}; lactate ${patient.observation.lactateMmolL.toFixed(1)} millimoles per liter.`
      : 'No new full assessment has been requested.');
    if (patient.choiceFeedback) lines.push(patient.choiceFeedback);
    if (patient.ended) {
      lines.push(patient.ended === 'handoff'
        ? 'Practice complete. The measured state before treatment, the recorded reason the classification was open, and whether intent fell inside the hour all travel with the patient.'
        : 'Instructor takeover ended this branch. The teaching stop predicts no patient outcome.');
    }
    return lines.join('\n');
  }

  if (options.possibleSepsis) {
    const patient = options.possibleSepsis;
    // The ceiling is announced first, because a clock nobody can hear is a clock nobody respects.
    lines.push(patient.immediatePathApplies
      ? 'The immediate path now applies: the pressure has fallen and antimicrobial therapy is indicated within the hour. No time-limited investigation remains available.'
      : patient.ceilingPassed
        ? 'Three hours have elapsed since first suspicion with no antimicrobial intent recorded. The ceiling has passed, and that is recorded rather than hidden.'
        : patient.ceilingDueInSeconds !== null
          ? `Ceiling: ${Math.ceil(patient.ceilingDueInSeconds / 60)} simulated minutes remain of the three hours from first suspicion.`
          : patient.timeZeroAtTick === null
            ? 'The time of first suspicion has not been recorded, so no ceiling is announced. It is running regardless.'
            : 'The ceiling is no longer counting down. The recorded time of first suspicion stands.');
    for (const field of ['systolicMmHg', 'diastolicMmHg'] as const) {
      const value = state[field];
      if (!options.invalid.has(field) && Number.isFinite(value)) {
        lines.push(`${FIELDS[field].label}: ${value.toFixed(FIELDS[field].precision)} ${FIELDS[field].unit}.`);
      }
    }
    lines.push('Supplied starting findings were temperature 38.4 degrees Celsius, heart rate 108 per minute, blood pressure 118 over 72 with no hypotension, respiratory rate 22 per minute, lactate 2.4 millimoles per liter, and no identified source. These remain historical starting findings.');
    lines.push(`Current alertness: ${patient.alertness}.`);
    lines.push('Infection cannot be excluded and neither can a non-infective cause. There is deliberately no waiting action in this lesson: what the guidance permits is a time-limited course of rapid investigation against a recorded ceiling, and the clock does not pause while results are awaited.');
    lines.push(`Time of first suspicion: ${patient.timeZeroAtTick === null ? 'not yet recorded' : `recorded at simulated ${formatElapsed(patient.timeZeroAtTick)}`}. Uncertainty: ${patient.uncertaintyAtTick === null ? 'not yet recorded' : 'recorded without assigning a tier'}. Time-limited assessment: ${patient.assessmentAtTick === null ? 'not yet requested' : 'requested'}. Antimicrobial intent: ${patient.antimicrobialIntentAtTick === null ? 'not yet recorded' : patient.antimicrobialInsideCeiling ? 'recorded inside the ceiling' : 'recorded after the ceiling had passed'}. Close monitoring: ${patient.monitoringAtTick === null ? 'not arranged' : 'arranged'}.`);
    lines.push('The likelihood tier is classified by the qualified team rather than the learner. No agent, dose, route, or combination is selected, and oxygen settings and exhaled carbon dioxide are not supplied in this lesson.');
    lines.push(patient.labObservation
      ? `Last requested laboratory evidence at simulated ${formatElapsed(patient.labObservation.atTick)}: lactate ${patient.labObservation.lactateMmolL.toFixed(1)} millimoles per liter; C-reactive protein ${patient.labObservation.crpMgL} milligrams per liter; source ${patient.labObservation.sourceIdentified ? 'identified' : 'not identified'}. No single value rules infection in or out.`
      : 'No new laboratory-only measurement has been requested.');
    lines.push(patient.perfusionObservation
      ? `Last requested examination at simulated ${formatElapsed(patient.perfusionObservation.atTick)}: blood pressure ${patient.perfusionObservation.systolicMmHg} over ${patient.perfusionObservation.diastolicMmHg}; heart rate ${patient.perfusionObservation.heartRateBpm} per minute; ${patient.perfusionObservation.hypotensive ? 'hypotensive' : 'not hypotensive'}. A perfusion-only look does not refresh laboratory evidence.`
      : 'No new perfusion-only examination has been requested.');
    lines.push(patient.observation
      ? `Last requested full assessment at simulated ${formatElapsed(patient.observation.atTick)}: heart rate ${patient.observation.heartRateBpm} per minute; lactate ${patient.observation.lactateMmolL.toFixed(1)} millimoles per liter; source ${patient.observation.sourceIdentified ? 'identified' : 'not identified'}; ${patient.observation.alertness}. These are historical observations, not live measurements.`
      : 'No new full assessment has been requested.');
    if (patient.investigationObserved) lines.push('Concern for infection persists and a source is identified. The ceiling has not moved, because it runs from first suspicion rather than from the result.');
    lines.push('Every tier in the current guidance rests on very low certainty of evidence, including the strong recommendations, so conditional does not mean optional. No tier, organism, or outcome is established.');
    lines.push(options.alarms.length === 0 ? 'No active alarms.'
      : `Active alarms: ${options.alarms.map((a) => `${a.priority}, ${a.message}`).join('; ')}.`);
    return lines.join(' ');
  }
  if (options.toxicShock) {
    const patient = options.toxicShock;
    for (const field of ['systolicMmHg', 'diastolicMmHg'] as const) {
      const value = state[field];
      if (!options.invalid.has(field) && Number.isFinite(value)) {
        lines.push(`${FIELDS[field].label}: ${value.toFixed(FIELDS[field].precision)} ${FIELDS[field].unit}.`);
      }
    }
    lines.push('Supplied starting findings were temperature 39.4 degrees Celsius, heart rate 128 per minute, blood pressure 88 over 44, diffuse macular erythroderma, mucosal hyperaemia, vomiting and diarrhoea from onset, platelets 118, creatinine 1.9 milligrams per deciliter, and creatine kinase 640 units per liter. Source control was completed by the qualified team before this rehearsal. These remain historical starting findings.');
    lines.push(`Current alertness: ${patient.alertness}.`);
    lines.push('Neither surveillance case definition is met, and not for the same reason. One requires desquamation one to two weeks after the rash, which cannot have happened. The other requires isolation of the organism, which has not grown. The same pending culture answers one definition and violates the other, because one requires negative cultures and the other requires an isolate.');
    lines.push(`Pattern recognized: ${patient.recognitionAtTick === null ? 'not yet' : 'yes'}. Critical care: ${patient.criticalCareAtTick === null ? 'not yet activated' : 'activated'}. Cultures: ${patient.culturesAtTick === null ? 'not yet requested' : 'requested'}. Treatment intent: ${patient.treatmentIntentAtTick === null ? 'not yet recorded' : 'recorded'}. Definition status: ${patient.definitionStatusAtTick === null ? 'not yet recorded' : 'recorded as unmet with its reason and a re-check horizon'}. Surveillance: ${patient.monitoringAtTick === null ? 'not arranged' : 'arranged'}.`);
    lines.push('These definitions count cases consistently across populations rather than deciding treatment at a bedside. A criteria count is not a probability, and the negative-culture requirement is a clause excluding other diagnoses rather than evidence against infection. No agent, dose, adjunct, fluid volume, or vasoactive choice is selected, and oxygen settings and exhaled carbon dioxide are not supplied in this lesson.');
    lines.push(patient.labObservation
      ? `Last requested laboratory evidence at simulated ${formatElapsed(patient.labObservation.atTick)}: platelets ${patient.labObservation.plateletsX109L}; creatinine ${patient.labObservation.creatinineMgDl.toFixed(1)} milligrams per deciliter; creatine kinase ${patient.labObservation.ckUL} units per liter; lactate ${patient.labObservation.lactateMmolL.toFixed(1)} millimoles per liter; cultures showing no growth so far, which is uninformative rather than negative. A laboratory-only check does not refresh the perfusion assessment.`
      : 'No new laboratory-only measurement has been requested.');
    lines.push(patient.perfusionObservation
      ? `Last requested examination at simulated ${formatElapsed(patient.perfusionObservation.atTick)}: blood pressure ${patient.perfusionObservation.systolicMmHg} over ${patient.perfusionObservation.diastolicMmHg}; heart rate ${patient.perfusionObservation.heartRateBpm} per minute; erythroderma present; desquamation absent and not yet possible. A perfusion-only look does not refresh laboratory evidence.`
      : 'No new perfusion-only examination has been requested.');
    lines.push(patient.observation
      ? `Last requested full assessment at simulated ${formatElapsed(patient.observation.atTick)}: heart rate ${patient.observation.heartRateBpm} per minute; blood pressure ${patient.observation.systolicMmHg} over ${patient.observation.diastolicMmHg}; platelets ${patient.observation.plateletsX109L}; lactate ${patient.observation.lactateMmolL.toFixed(1)} millimoles per liter; ${patient.observation.alertness}. These are historical observations, not live measurements.`
      : 'No new full assessment has been requested.');
    if (patient.deteriorationObserved) lines.push('More criteria are now satisfied on both definitions. Neither has closed, and the reasons are unchanged.');
    lines.push('Accumulating criteria move both definitions closer and close neither. The diagnosis is handed over open, and no classification, organism, or outcome is established.');
    lines.push(options.alarms.length === 0 ? 'No active alarms.'
      : `Active alarms: ${options.alarms.map((a) => `${a.priority}, ${a.message}`).join('; ')}.`);
    return lines.join(' ');
  }
  if (options.severePneumonia) {
    const patient = options.severePneumonia;
    for (const field of ['systolicMmHg', 'diastolicMmHg'] as const) {
      const value = state[field];
      if (!options.invalid.has(field) && Number.isFinite(value)) {
        lines.push(`${FIELDS[field].label}: ${value.toFixed(FIELDS[field].precision)} ${FIELDS[field].unit}.`);
      }
    }
    lines.push('Supplied starting findings were multilobar consolidation, respiratory rate 30 per minute, oxygen saturation 92 percent on an inspired fraction of 0.35 giving an oxygenation ratio of 171, heart rate 116 per minute, and temperature 38.7 degrees Celsius. These remain historical starting findings.');
    lines.push(`Current alertness: ${patient.alertness}.`);
    lines.push('Two supplied instruments disagree and both are correctly calculated. The mortality score reads 2, placing the patient in a ward band. The severity criteria count 3, which defines severe pneumonia. The mortality score answers thirty-day death rather than level of care, and its pooled discrimination for predicting critical-care admission is about 0.69.');
    lines.push(`Instruments reconciled: ${patient.reconciliationAtTick === null ? 'not yet' : 'yes'}. Mismatch recognized: ${patient.mismatchAtTick === null ? 'not yet' : 'yes'}. Critical-care review: ${patient.criticalCareAtTick === null ? 'not yet requested' : 'requested'}. Escalation intent: ${patient.escalationIntentAtTick === null ? 'not yet recorded' : 'recorded'}. Surveillance: ${patient.monitoringAtTick === null ? 'not arranged' : 'arranged'}.`);
    lines.push('A saturation without its inspired fraction says very little, and it is the ratio that enters the severity criteria. No oxygen device, ventilation mode, fluid volume, vasoactive agent, antimicrobial, or steroid is selected, and oxygen settings and exhaled carbon dioxide are not supplied in this lesson.');
    lines.push(patient.labObservation
      ? `Last requested laboratory evidence at simulated ${formatElapsed(patient.labObservation.atTick)}: urea ${patient.labObservation.ureaMmolL.toFixed(1)} millimoles per liter; C-reactive protein ${patient.labObservation.crpMgL} milligrams per liter; sodium ${patient.labObservation.sodiumMmolL} millimoles per liter; lactate ${patient.labObservation.lactateMmolL.toFixed(1)} millimoles per liter. The C-reactive protein and the sodium appear in neither instrument. A laboratory-only check does not refresh the respiratory assessment.`
      : 'No new laboratory-only measurement has been requested.');
    lines.push(patient.respiratoryObservation
      ? `Last requested respiratory assessment at simulated ${formatElapsed(patient.respiratoryObservation.atTick)}: respiratory rate ${patient.respiratoryObservation.respiratoryRateBpm} per minute; oxygen saturation ${patient.respiratoryObservation.spo2Percent} percent on an inspired fraction of ${patient.respiratoryObservation.fio2.toFixed(2)}; oxygenation ratio ${patient.respiratoryObservation.pfRatio}. A respiratory-only look does not refresh laboratory evidence.`
      : 'No new respiratory-only assessment has been requested.');
    lines.push(patient.observation
      ? `Last requested full assessment at simulated ${formatElapsed(patient.observation.atTick)}: heart rate ${patient.observation.heartRateBpm} per minute; oxygenation ratio ${patient.observation.pfRatio}; lactate ${patient.observation.lactateMmolL.toFixed(1)} millimoles per liter; mortality score ${patient.observation.mortalityScore}; severity criteria met ${patient.observation.severityCriteria}. These are historical observations, not live measurements.`
      : 'No new full assessment has been requested.');
    if (patient.deteriorationObserved) lines.push('The mortality score has caught up. It was always going to, and it was never the instrument for the question of where this patient should be.');
    lines.push('Whether a critical-care bed exists is a real-world constraint this rehearsal does not model, and neither escalation nor survival is established.');
    lines.push(options.alarms.length === 0 ? 'No active alarms.'
      : `Active alarms: ${options.alarms.map((a) => `${a.priority}, ${a.message}`).join('; ')}.`);
    return lines.join(' ');
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
