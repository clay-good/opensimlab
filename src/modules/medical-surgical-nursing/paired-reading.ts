import type { Scenario } from '@anesthesia/scenarios/types';
import { TICKS_PER_SECOND } from '@platform/clock/simulation-clock';
import type { PairedReadingSnapshot } from '@platform/kernel/protocol';
export type { PairedReadingSnapshot } from '@platform/kernel/protocol';

/**
 * A device's error is not always random noise. Pulse oximetry overestimates arterial saturation
 * more often in patients with darker skin pigmentation, because the measurement is optical and
 * melanin absorbs light in the wavelengths it uses. The bedside gives no signal that the number is
 * wrong, and the error runs in one direction: toward reassurance.
 */
export const PAIRED_READING_GAS_TICKS = 30 * 60 * TICKS_PER_SECOND;
export const PAIRED_READING_REVIEW_TICKS = 45 * 60 * TICKS_PER_SECOND;
export const PAIRED_READING_TAKEOVER_TICKS = 150 * 60 * TICKS_PER_SECOND;
export const PAIRED_READING_SESSION_TICKS = 8 * 60 * 60 * TICKS_PER_SECOND;
export const PAIRED_READING_ACTIONS = ['record-the-oximeter-reading', 'record-the-paired-values',
  'record-what-the-gap-is-not', 'escalate-on-the-arterial-value', 'review-boundaries', 'monitor',
  'check-oximeter', 'check-patient', 'reassess', 'handoff',
  'reposition-the-probe', 'warm-the-hand', 'trust-the-oximeter-trend',
  'the-device-standard-was-fixed'] as const;
export type PairedReadingAction = typeof PAIRED_READING_ACTIONS[number];
export interface PairedReadingEvent { readonly id: string; readonly message: string }

export const PAIRED_READING_OXIMETER_PERCENT = 94;
export const PAIRED_READING_ARTERIAL_PERCENT = 86;

export function supportsPairedReading(scenario: Scenario): boolean {
  return scenario.metadata.id === 'paired-reading-a-number-wrong-in-one-direction'
    && scenario.timeline.every((event) => event.type === 'narrative')
    && scenario.timeline.filter((event) => event.target === 'paired-reading').length === 1
    && scenario.timeline.filter((event) => event.target === 'paired-reading-evidence').length === 1
    && scenario.timeline.filter((event) => event.target === 'paired-reading-boundary').length === 1;
}

export class PairedReading {
  private oximeterRecordedAt: number | null = null;
  private pairedAt: number | null = null;
  private gapExplainedAt: number | null = null;
  private escalationAt: number | null = null;
  private boundariesAt: number | null = null;
  private monitoringAt: number | null = null;
  private gasReturned = false;
  private gasObserved = false;
  private reviewArrived = false;
  private reviewObserved = false;
  private repositionAttempted = false;
  private warmingAttempted = false;
  private trendTrusted = false;
  private standardAssumedFixed = false;
  private phase = 0;
  private observedPhase: number | null = null;
  private oximeterRecord: PairedReadingSnapshot['oximeterRecord'] = null;
  private patientRecord: PairedReadingSnapshot['patientRecord'] = null;
  private observation: PairedReadingSnapshot['observation'] = null;
  private feedback: string | null = null;
  private ended: PairedReadingSnapshot['ended'] = null;

  // What changes here is what is known, not what the patient is doing: the arterial sample
  // returning, and the review arriving. The oximeter has read 94 throughout.
  private clinicalState() { return JSON.stringify([this.gasReturned, this.reviewArrived]); }
  private change(mutate: () => void) {
    const before = this.clinicalState(); mutate();
    if (before !== this.clinicalState()) this.phase += 1;
  }

  advance(tick: number): PairedReadingEvent[] {
    if (this.ended) return [];
    const terminal = this.escalationAt === null ? PAIRED_READING_TAKEOVER_TICKS : PAIRED_READING_SESSION_TICKS;
    const until = Math.min(tick, terminal);
    const events: PairedReadingEvent[] = [];
    // The sample was already sent by the qualified team before this rehearsal began; the learner
    // does not order it, and its return is the only thing that reveals the gap.
    if (!this.gasReturned && until >= PAIRED_READING_GAS_TICKS) {
      this.change(() => { this.gasReturned = true; });
      events.push({ id: 'gas-returned', message: `The arterial sample sent earlier by the qualified team returns: arterial oxygen saturation ${PAIRED_READING_ARTERIAL_PERCENT} percent, taken while the oximeter read ${PAIRED_READING_OXIMETER_PERCENT} percent. The two numbers are from the same minute and the same patient. Nothing changed between them.` });
    }
    if (!this.reviewArrived && this.escalationAt !== null
      && until >= this.escalationAt + PAIRED_READING_REVIEW_TICKS) {
      this.change(() => { this.reviewArrived = true; });
      events.push({ id: 'review-arrived', message: 'The medical review happens on the arterial value. The qualified team records that the oximeter continues to read in the nineties, that it is doing so correctly by its own calibration, and that the arterial sample is the measurement being acted on. No fault is found with the device or with anyone who read it.' });
    }
    if (tick >= terminal) {
      this.ended = 'instructor-takeover';
      events.push({ id: 'instructor-takeover', message: 'Instructor takeover ends the unfinished rehearsal. Review the recorded oximeter reading, the paired values, what the gap is and is not, and escalation on the arterial value. This authored stop predicts no patient outcome.' });
    }
    return events;
  }

  apply(action: unknown, tick: number): PairedReadingEvent[] {
    const events = this.advance(tick);
    const emit = (id: string, message: string) => {
      if (!this.ended || id === 'handoff') this.feedback = message;
      return [...events, { id, message }];
    };
    if (this.ended) return emit('action-refused', 'This practice branch has ended. Open the debrief or restart.');
    switch (action) {
      case 'record-the-oximeter-reading':
        if (this.oximeterRecordedAt !== null) return events;
        this.oximeterRecordedAt = tick;
        return emit('oximeter-recorded', `The oximeter reading is recorded as measured: ${PAIRED_READING_OXIMETER_PERCENT} percent on room air, good trace, no supplemental oxygen, respiratory rate 24. The reading is recorded as an oximeter reading rather than as the saturation, because those are different quantities and only one of them was measured here.`);
      case 'record-the-paired-values':
        if (!this.gasReturned) {
          return emit('pairing-refused', 'There is only one number so far. The arterial result has not returned, and pairing needs both values from the same minute.');
        }
        if (this.pairedAt !== null) return events;
        this.pairedAt = tick;
        return emit('paired-recorded', `Both values are recorded together with the time they were taken: oximeter ${PAIRED_READING_OXIMETER_PERCENT} percent, arterial ${PAIRED_READING_ARTERIAL_PERCENT} percent, same minute, same patient. The oximeter reading is not amended and not deleted. It is a true record of what the device displayed, and the gap between the two is the finding.`);
      case 'record-what-the-gap-is-not':
        if (this.pairedAt === null) {
          return emit('explanation-refused', 'The gap has not been recorded yet, so there is nothing to characterise.');
        }
        if (this.gapExplainedAt !== null) return events;
        this.gapExplainedAt = tick;
        return emit('gap-explained', 'The record states what this gap is and is not. It is not a poor trace, a cold hand, nail varnish, motion, or a malpositioned probe: the trace was good and the reading was steady. It is a known limitation of the measurement itself. Pulse oximetry infers saturation from how light is absorbed, and skin pigmentation changes that absorbance, so the device overestimates arterial saturation more often in patients with darker skin. A systematic review found occult hypoxaemia roughly one and a half to two-thirds more common in Black patients than in white patients, on moderate certainty of evidence.');
      case 'escalate-on-the-arterial-value':
        if (!this.gasReturned) {
          return emit('escalation-refused', 'There is no arterial value to escalate on yet. Escalating on the oximeter reading would be escalating on the number that is in question.');
        }
        if (this.escalationAt !== null) return events;
        this.escalationAt = tick;
        return emit('escalation-requested', `Review is requested on the arterial saturation of ${PAIRED_READING_ARTERIAL_PERCENT} percent, with the oximeter reading of ${PAIRED_READING_OXIMETER_PERCENT} percent given alongside it and labelled as an oximeter reading. Both are stated, because a reviewer looking at the observation chart will see only the number in the nineties.`);
      case 'review-boundaries':
        if (this.boundariesAt !== null) return events;
        this.boundariesAt = tick;
        return emit('boundary-review', 'Supplied boundaries. The discrepancy is optical rather than a perfusion artifact, so repositioning the probe, warming the hand, or switching digits does not correct it. A large systematic review and meta-analysis, drawing on hundreds of thousands of paired measurements, reports occult hypoxaemia substantially more common in Black patients, at moderate certainty. A regulatory draft guidance issued in 2025 applies to devices submitted for approval in future; it does not recall or recalibrate the devices already in service, so nothing about it changes the reading in front of you. What the oximeter does reliably is trend and detect change in an individual; what it does not do reliably is report an absolute value that can be compared against a threshold in every patient.');
      case 'monitor':
        if (this.monitoringAt !== null) return events;
        this.monitoringAt = tick;
        return emit('monitoring', 'Continuous observation continues, with the respiratory rate counted and the work of breathing described in words rather than inferred from the oximeter. Where the arterial value is the one being acted on, the record says so explicitly, so nobody later reads the chart as a series of reassuring nineties.');
      case 'check-oximeter':
        this.oximeterRecord = this.oximeterFinding(tick);
        return emit('oximeter-check', `Requested device check: reading ${this.oximeterRecord.readingPercent} percent; ${this.oximeterRecord.goodTrace ? 'good plethysmographic trace' : 'poor trace'}; ${this.oximeterRecord.warmPeriphery ? 'warm periphery' : 'cool periphery'}; ${this.oximeterRecord.nailCoveringPresent ? 'nail covering present' : 'no nail covering'}; probe correctly positioned. Every artifact that would explain a falsely low reading is absent, and none of them would explain a falsely high one. This partial check supplies no arterial value.`);
      case 'check-patient':
        this.patientRecord = this.patientFinding(tick);
        return emit('patient-check', `Requested observation: respiratory rate ${this.patientRecord.respiratoryRateBpm} counted for a full minute; ${this.patientRecord.speakingFullSentences ? 'speaking in full sentences' : 'speaking in short phrases'}; ${this.patientRecord.usingAccessoryMuscles ? 'accessory muscle use present' : 'no accessory muscle use'}; ${this.patientRecord.arterialAvailable ? `arterial saturation ${PAIRED_READING_ARTERIAL_PERCENT} percent available` : 'no arterial result available yet'}. This partial observation supplies no device check.`);
      case 'reassess': {
        this.oximeterRecord = this.oximeterFinding(tick);
        this.patientRecord = this.patientFinding(tick);
        this.observation = { ...this.oximeterRecord, ...this.patientRecord };
        this.observedPhase = this.phase;
        if (this.gasReturned) this.gasObserved = true;
        if (this.reviewArrived) this.reviewObserved = true;
        const view = this.observation;
        return emit(this.reviewArrived ? 'reviewed-reassessment' : this.gasReturned ? 'paired-reassessment' : 'initial-reassessment',
          `Fresh fictional assessment: oximeter ${view.readingPercent} percent on air with a good trace; respiratory rate ${view.respiratoryRateBpm} counted for a full minute; ${view.speakingFullSentences ? 'speaking in full sentences' : 'speaking in short phrases'}. ${this.gasReturned ? `Arterial saturation ${PAIRED_READING_ARTERIAL_PERCENT} percent from the same minute.` : 'No arterial result has returned yet.'} ${this.reviewArrived ? 'The review has happened and the arterial value is the measurement being acted on.' : ''} No diagnosis, cause, or outcome is established here.`.trim());
      }
      case 'reposition-the-probe':
        this.repositionAttempted = true;
        return emit('reposition-refused', 'Repositioning the probe was refused as a fix. The bias here is optical, in how light is absorbed before it reaches the sensor, not a perfusion or positioning artifact. Moving the probe to another finger measures the same tissue in the same way and returns the same overestimate.');
      case 'warm-the-hand':
        this.warmingAttempted = true;
        return emit('warming-refused', 'Warming the hand was refused as a fix. Warming corrects a poor trace from vasoconstriction, and the trace here is already good. It does not address absorbance, and treating it as the answer would delay acting on the arterial value.');
      case 'trust-the-oximeter-trend':
        this.trendTrusted = true;
        return emit('trend-refused', 'Reading the steady oximeter numbers as evidence of a stable saturation was refused. The device is comparatively good at detecting change within one patient and comparatively poor at reporting an absolute value that can be compared to a threshold across patients. A steady overestimate is steady.');
      case 'the-device-standard-was-fixed':
        this.standardAssumedFixed = true;
        return emit('standard-refused', 'Assuming the problem was resolved by a regulatory change was refused. The 2025 draft guidance applies to devices submitted for approval in future. It does not recall, recalibrate, or replace the devices already on the wards, and it changes nothing about the reading in front of you.');
      case 'handoff':
        if (this.oximeterRecordedAt === null || this.pairedAt === null || this.gapExplainedAt === null
          || this.escalationAt === null || this.boundariesAt === null || this.monitoringAt === null
          || this.observation === null || this.observedPhase !== this.phase) {
          return emit('handoff-refused', 'Record the oximeter reading as an oximeter reading, record both values together once the arterial result returns, state what the gap is and is not, escalate on the arterial value, review the boundaries, arrange observation that does not depend on the oximeter, and take a current full assessment. A corrected device and an explained cause are not handoff gates.');
        }
        this.ended = 'handoff';
        return emit('handoff', `The receiving team owns the review, any investigation, oxygen decisions, and every treatment decision. What travels is the oximeter reading recorded as an oximeter reading, both values from the same minute recorded together, that the gap is a known limitation of the measurement rather than an artifact anyone can correct at the bedside, that escalation was made on the arterial value, and ${this.reviewObserved ? 'that the review is acting on the arterial value while the chart continues to show numbers in the nineties' : 'that the review is still awaited'}. Practice ends, not care, and no cause or outcome is certified.`);
      default:
        return emit('action-refused', 'That choice is not part of this fictional measurement lesson. No care was started.');
    }
  }

  private oximeterFinding(tick: number) {
    return { atTick: tick, readingPercent: PAIRED_READING_OXIMETER_PERCENT, goodTrace: true,
      warmPeriphery: true, nailCoveringPresent: false };
  }

  private patientFinding(tick: number) {
    return { atTick: tick, respiratoryRateBpm: 24, speakingFullSentences: true,
      usingAccessoryMuscles: false, arterialAvailable: this.gasReturned };
  }

  rhythm(): 'sinus' { return 'sinus'; }

  vitals() {
    // The displayed saturation never moves. The patient was hypoxaemic before the sample returned
    // and is hypoxaemic after it; only what is known changes.
    return { heartRateBpm: 98, systolicMmHg: 132, diastolicMmHg: 78, meanArterialMmHg: 96,
      respiratoryRateBpm: 24, spo2Percent: PAIRED_READING_OXIMETER_PERCENT, coreTemperatureC: 37.4,
      alertness: 'alert and speaking in full sentences' };
  }

  snapshot(_tick: number): PairedReadingSnapshot {
    return {
      oximeterRecordedAtTick: this.oximeterRecordedAt, pairedAtTick: this.pairedAt,
      gapExplainedAtTick: this.gapExplainedAt, escalationAtTick: this.escalationAt,
      boundariesReviewedAtTick: this.boundariesAt, monitoringAtTick: this.monitoringAt,
      oximeterPercent: PAIRED_READING_OXIMETER_PERCENT,
      arterialPercent: this.gasReturned ? PAIRED_READING_ARTERIAL_PERCENT : null,
      gasReturned: this.gasReturned, gasObserved: this.gasObserved,
      reviewArrived: this.reviewArrived, reviewObserved: this.reviewObserved,
      repositionAttempted: this.repositionAttempted,
      warmingAttempted: this.warmingAttempted,
      trendTrusted: this.trendTrusted,
      standardAssumedFixed: this.standardAssumedFixed,
      oximeterRecord: this.oximeterRecord ? { ...this.oximeterRecord } : null,
      patientRecord: this.patientRecord ? { ...this.patientRecord } : null,
      observation: this.observation ? { ...this.observation } : null, alertness: this.vitals().alertness,
      choiceFeedback: this.feedback, ended: this.ended,
      authoredStateTransitions: true, doseModelAvailable: false, durableRecoveryProven: false,
    };
  }
}
