import type { Scenario } from '@anesthesia/scenarios/types';
import { TICKS_PER_SECOND } from '@platform/clock/simulation-clock';
import type { ProxyScaleSnapshot } from '@platform/kernel/protocol';
export type { ProxyScaleSnapshot } from '@platform/kernel/protocol';

/**
 * The reference standard for pain is self-report, and here it is unavailable. What remains is a
 * behavioural observation scale whose numeric output looks like an intensity but is not one: its
 * own developers describe these tools as measuring observable behaviour, not how much it hurts.
 * The danger is not the tool. It is the number the tool prints.
 */
export const PROXY_SCALE_FAMILY_TICKS = 20 * 60 * TICKS_PER_SECOND;
export const PROXY_SCALE_REVIEW_TICKS = 45 * 60 * TICKS_PER_SECOND;
export const PROXY_SCALE_TAKEOVER_TICKS = 150 * 60 * TICKS_PER_SECOND;
export const PROXY_SCALE_SESSION_TICKS = 8 * 60 * 60 * TICKS_PER_SECOND;
export const PROXY_SCALE_ACTIONS = ['attempt-self-report', 'record-the-observed-behaviours',
  'record-what-the-score-is-not', 'seek-the-proxy-history', 'record-analgesic-intent',
  'review-boundaries', 'monitor', 'check-behaviours', 'check-context', 'reassess', 'handoff',
  'read-four-as-four-out-of-ten', 'vitals-confirm-the-pain', 'zero-would-mean-comfortable',
  'wait-until-they-ask'] as const;
export type ProxyScaleAction = typeof PROXY_SCALE_ACTIONS[number];
export interface ProxyScaleEvent { readonly id: string; readonly message: string }

/** The scored behavioural items, and what each contributed. The total is the sum, nothing more. */
export const PROXY_SCALE_ITEMS = [
  { id: 'breathing', label: 'Breathing independent of vocalisation', points: 1 },
  { id: 'vocalisation', label: 'Negative vocalisation', points: 1 },
  { id: 'facial', label: 'Facial expression', points: 1 },
  { id: 'body-language', label: 'Body language', points: 1 },
  { id: 'consolability', label: 'Consolability', points: 0 },
] as const;
export const PROXY_SCALE_TOTAL = PROXY_SCALE_ITEMS.reduce((sum, item) => sum + item.points, 0);

export function supportsProxyScale(scenario: Scenario): boolean {
  return scenario.metadata.id === 'proxy-scale-a-number-without-a-standard'
    && scenario.timeline.every((event) => event.type === 'narrative')
    && scenario.timeline.filter((event) => event.target === 'proxy-scale').length === 1
    && scenario.timeline.filter((event) => event.target === 'proxy-scale-evidence').length === 1
    && scenario.timeline.filter((event) => event.target === 'proxy-scale-boundary').length === 1;
}

export class ProxyScale {
  private selfReportAttemptedAt: number | null = null;
  private behavioursRecordedAt: number | null = null;
  private limitsRecordedAt: number | null = null;
  private proxyHistoryAt: number | null = null;
  private analgesicIntentAt: number | null = null;
  private boundariesAt: number | null = null;
  private monitoringAt: number | null = null;
  private familyArrived = false;
  private reviewArrived = false;
  private reviewObserved = false;
  private intensityRead = false;
  private vitalsTrusted = false;
  private zeroRead = false;
  private waitedForRequest = false;
  private phase = 0;
  private observedPhase: number | null = null;
  private behaviourRecord: ProxyScaleSnapshot['behaviourRecord'] = null;
  private contextRecord: ProxyScaleSnapshot['contextRecord'] = null;
  private observation: ProxyScaleSnapshot['observation'] = null;
  private feedback: string | null = null;
  private ended: ProxyScaleSnapshot['ended'] = null;

  // The daughter's arrival and the review are what change what can be known.
  private clinicalState() { return JSON.stringify([this.familyArrived, this.reviewArrived]); }
  private change(mutate: () => void) {
    const before = this.clinicalState(); mutate();
    if (before !== this.clinicalState()) this.phase += 1;
  }

  advance(tick: number): ProxyScaleEvent[] {
    if (this.ended) return [];
    const terminal = this.analgesicIntentAt === null ? PROXY_SCALE_TAKEOVER_TICKS : PROXY_SCALE_SESSION_TICKS;
    const until = Math.min(tick, terminal);
    const events: ProxyScaleEvent[] = [];
    if (!this.familyArrived && until >= PROXY_SCALE_FAMILY_TICKS) {
      this.change(() => { this.familyArrived = true; });
      events.push({ id: 'family-arrived', message: 'His daughter arrives for visiting. She has cared for him at home for four years and knows what he looks like when something hurts. She is a source of information about his baseline that no scale contains, and she is available to be asked.' });
    }
    if (!this.reviewArrived && this.analgesicIntentAt !== null
      && until >= this.analgesicIntentAt + PROXY_SCALE_REVIEW_TICKS) {
      this.change(() => { this.reviewArrived = true; });
      events.push({ id: 'review-arrived', message: 'The qualified team reviews and records their own assessment. They note that the behavioural total is unchanged, that a total is not an intensity, and that the response to whatever they decide will itself be part of the assessment rather than a confirmation of the score. Nothing about the number has become more precise.' });
    }
    if (tick >= terminal) {
      this.ended = 'instructor-takeover';
      events.push({ id: 'instructor-takeover', message: 'Instructor takeover ends the unfinished rehearsal. Review the attempted self-report, the observed behaviours, what the total is and is not, the proxy history, and bounded qualified-team analgesic intent. This authored stop predicts no patient outcome.' });
    }
    return events;
  }

  apply(action: unknown, tick: number): ProxyScaleEvent[] {
    const events = this.advance(tick);
    const emit = (id: string, message: string) => {
      if (!this.ended || id === 'handoff') this.feedback = message;
      return [...events, { id, message }];
    };
    if (this.ended) return emit('action-refused', 'This practice branch has ended. Open the debrief or restart.');
    switch (action) {
      case 'attempt-self-report':
        if (this.selfReportAttemptedAt !== null) return events;
        this.selfReportAttemptedAt = tick;
        return emit('self-report-attempted', 'Self-report is attempted first, because it is the reference standard and skipping it assumes an answer nobody asked for. He does not answer, does not follow the yes-or-no prompt, and does not use the picture scale. The attempt is recorded as attempted and unsuccessful, which is different from not attempted, and different again from a denial of pain.');
      case 'record-the-observed-behaviours':
        if (this.selfReportAttemptedAt === null) {
          return emit('behaviours-refused', 'Observation comes after an attempt at self-report, not instead of it. The hierarchy exists so that a patient who could have answered is asked before anyone starts scoring them.');
        }
        if (this.behavioursRecordedAt !== null) return events;
        this.behavioursRecordedAt = tick;
        return emit('behaviours-recorded', `The behaviours are recorded as behaviours: ${PROXY_SCALE_ITEMS.filter((item) => item.points > 0).map((item) => item.label.toLowerCase()).join(', ')}, each scoring one, and consolability scoring zero. The total is ${PROXY_SCALE_TOTAL}, and the total is the sum of those observations rather than a measurement of anything else.`);
      case 'record-what-the-score-is-not':
        if (this.behavioursRecordedAt === null) {
          return emit('limits-refused', 'There is no total recorded yet, so there is nothing to qualify.');
        }
        if (this.limitsRecordedAt !== null) return events;
        this.limitsRecordedAt = tick;
        return emit('limits-recorded', `The record states what the total is not. It is not ${PROXY_SCALE_TOTAL} out of 10, and it is not comparable to a self-reported number: the developers of these instruments describe them as measuring observable behaviour rather than pain intensity, and a state-of-the-science review concluded that no behavioural tool could be recommended for broad adoption on the strength of its intensity claims. It also cannot be read downward: a limited behavioural repertoire produces few behaviours whether or not something hurts.`);
      case 'seek-the-proxy-history':
        if (!this.familyArrived) {
          return emit('proxy-refused', 'There is nobody to ask yet. A proxy history is a person who knows this man, not a field on a form.');
        }
        if (this.proxyHistoryAt !== null) return events;
        this.proxyHistoryAt = tick;
        return emit('proxy-recorded', 'His daughter is asked what he looks like when he is in pain, and what is different today. She says he goes quiet and still rather than restless, that he holds his breath in a particular way, and that the flat expression is not how he was last week. That is a proxy report about this person, recorded in her words. It sits above behavioural scoring in the assessment hierarchy and below his own report, which remains unavailable.');
      case 'record-analgesic-intent':
        if (this.analgesicIntentAt !== null) return events;
        this.analgesicIntentAt = tick;
        return emit('analgesic-intent', 'Bounded qualified-team analgesic intent is recorded, with the reasoning stated: an attempted and unsuccessful self-report, observed behaviours consistent with pain, a recent operation that would be expected to hurt, and a proxy account of what is different. No agent, dose, route, or interval is selected here. The response will be assessed as further evidence rather than treated as proof that the original score was right.');
      case 'review-boundaries':
        if (this.boundariesAt !== null) return events;
        this.boundariesAt = tick;
        return emit('boundary-review', 'Supplied boundaries. The assessment hierarchy runs: attempt self-report; consider whether a cause of pain is present; observe behaviours; obtain a proxy report from someone who knows the person; and treat the response to an analgesic trial as further information. Behavioural totals sit inside that hierarchy rather than replacing it. Physiological signs, meaning pulse and blood pressure, sit at the bottom: they are unreliable indicators and rise and fall for many reasons. A published review of the available tools concluded none could then be recommended for broad adoption, and later work notes that these item sets are not comprehensive, so subtle changes can be missed entirely.');
      case 'monitor':
        if (this.monitoringAt !== null) return events;
        this.monitoringAt = tick;
        return emit('monitoring', 'Reassessment is scheduled at defined intervals, with the same instrument, by whoever is present, and recorded alongside what was observed rather than only the total. A number that moves is more informative than a number that is high, and a number recorded without its behaviours cannot be compared with anything.');
      case 'check-behaviours':
        this.behaviourRecord = this.behaviourFinding(tick);
        return emit('behaviour-check', `Requested observation: ${PROXY_SCALE_ITEMS.map((item) => `${item.label.toLowerCase()} ${item.points}`).join('; ')}. Total ${this.behaviourRecord.total}. ${this.behaviourRecord.selfReportAvailable ? 'Self-report available' : 'Self-report unavailable'}. This partial observation supplies no history and no proxy account.`);
      case 'check-context':
        this.contextRecord = this.contextFinding(tick);
        return emit('context-check', `Requested context: ${this.contextRecord.recentSurgery ? 'operation yesterday that would be expected to hurt' : 'no recent procedure'}; ${this.contextRecord.analgesiaCharted ? 'regular analgesia charted' : 'no regular analgesia charted'}; ${this.contextRecord.proxyAvailable ? 'a relative who knows his baseline is present' : 'no proxy present'}; baseline ${this.contextRecord.baselineDescription}. A cause of pain being present is itself a step in the hierarchy. This partial check supplies no new behavioural observation.`);
      case 'reassess': {
        this.behaviourRecord = this.behaviourFinding(tick);
        this.contextRecord = this.contextFinding(tick);
        this.observation = { ...this.behaviourRecord, ...this.contextRecord };
        this.observedPhase = this.phase;
        if (this.reviewArrived) this.reviewObserved = true;
        const view = this.observation;
        return emit(this.reviewArrived ? 'reviewed-reassessment' : this.familyArrived ? 'proxy-available-reassessment' : 'initial-reassessment',
          `Fresh fictional assessment: behavioural total ${view.total}, unchanged; self-report ${view.selfReportAvailable ? 'available' : 'still unavailable'}; ${view.proxyAvailable ? 'a relative who knows his baseline is present' : 'no proxy present'}. ${this.reviewArrived ? 'The qualified team has reviewed and recorded that a total is not an intensity.' : 'The total has not moved, which is neither reassurance nor confirmation.'} No pain intensity, cause, or outcome is established here.`);
      }
      case 'read-four-as-four-out-of-ten':
        this.intensityRead = true;
        return emit('intensity-refused', `Reading the total as ${PROXY_SCALE_TOTAL} out of 10 was refused. These instruments are described by their own developers as measuring observable behaviour rather than pain intensity, and no validated conversion to an intensity score exists. Writing it into the chart as though it were a self-reported number makes an unverifiable claim look like a measurement.`);
      case 'vitals-confirm-the-pain':
        this.vitalsTrusted = true;
        return emit('vitals-refused', 'Using pulse and blood pressure to confirm pain was refused. Physiological signs sit at the bottom of the assessment hierarchy precisely because they are unreliable: they rise and fall with anxiety, medication, infection, and position, and their absence has been used to dismiss pain that was present.');
      case 'zero-would-mean-comfortable':
        this.zeroRead = true;
        return emit('zero-refused', 'Reading a zero as comfortable was refused. Absence of observable behaviour is not absence of pain in a patient whose behavioural repertoire is limited, and the item sets are not comprehensive, so a subtle change can score nothing at all. A low total is weak evidence in the same direction as a high one is weak evidence.');
      case 'wait-until-they-ask':
        this.waitedForRequest = true;
        return emit('waiting-refused', 'Waiting for him to ask was refused. Self-report was attempted and he could not give one; that is the reason this assessment exists rather than a reason to defer it. A patient who cannot request analgesia is the patient least protected by waiting to be asked.');
      case 'handoff':
        if (this.selfReportAttemptedAt === null || this.behavioursRecordedAt === null || this.limitsRecordedAt === null
          || this.proxyHistoryAt === null || this.analgesicIntentAt === null || this.boundariesAt === null
          || this.monitoringAt === null || this.observation === null || this.observedPhase !== this.phase) {
          return emit('handoff-refused', 'Attempt self-report, record the observed behaviours, state what the total is and is not, obtain the proxy history, record bounded analgesic intent, review the boundaries, schedule reassessment, and take a current full assessment. A confirmed intensity and a resolved cause are not handoff gates.');
        }
        this.ended = 'handoff';
        return emit('handoff', `The receiving team owns analgesic selection, delivery, and every treatment decision. What travels is that self-report was attempted and unsuccessful, the behaviours as observed with the total alongside them, that the total is a behavioural sum rather than an intensity, the daughter's account in her words, and that the response to treatment will be read as further evidence rather than as confirmation. ${this.reviewObserved ? 'The review recorded the same limitation. ' : ''}Practice ends, not care, and no intensity, cause, or outcome is certified.`);
      default:
        return emit('action-refused', 'That choice is not part of this fictional pain assessment lesson. No care was started.');
    }
  }

  private behaviourFinding(tick: number) {
    return { atTick: tick, total: PROXY_SCALE_TOTAL, selfReportAvailable: false,
      itemCount: PROXY_SCALE_ITEMS.length };
  }

  private contextFinding(tick: number) {
    return { atTick: tick, recentSurgery: true, analgesiaCharted: true,
      proxyAvailable: this.familyArrived,
      baselineDescription: 'usually restless and vocal when uncomfortable, according to the record' };
  }

  rhythm(): 'sinus' { return 'sinus'; }

  vitals() {
    // Deliberately unremarkable. If the observations moved, the lesson would become about
    // physiological confirmation, which is the thing it refuses.
    return { heartRateBpm: 78, systolicMmHg: 132, diastolicMmHg: 76, meanArterialMmHg: 95,
      respiratoryRateBpm: 18, spo2Percent: 96, coreTemperatureC: 36.9,
      alertness: 'awake, not speaking, flat facial expression' };
  }

  snapshot(_tick: number): ProxyScaleSnapshot {
    return {
      selfReportAttemptedAtTick: this.selfReportAttemptedAt,
      behavioursRecordedAtTick: this.behavioursRecordedAt,
      limitsRecordedAtTick: this.limitsRecordedAt,
      proxyHistoryAtTick: this.proxyHistoryAt,
      analgesicIntentAtTick: this.analgesicIntentAt,
      boundariesReviewedAtTick: this.boundariesAt,
      monitoringAtTick: this.monitoringAt,
      behaviouralTotal: PROXY_SCALE_TOTAL,
      itemCount: PROXY_SCALE_ITEMS.length,
      // Never true in this lesson: the reference standard is what is missing.
      selfReportAvailable: false,
      familyArrived: this.familyArrived,
      reviewArrived: this.reviewArrived,
      reviewObserved: this.reviewObserved,
      intensityReadAttempted: this.intensityRead,
      vitalsTrusted: this.vitalsTrusted,
      zeroReadAttempted: this.zeroRead,
      waitedForRequest: this.waitedForRequest,
      behaviourRecord: this.behaviourRecord ? { ...this.behaviourRecord } : null,
      contextRecord: this.contextRecord ? { ...this.contextRecord } : null,
      observation: this.observation ? { ...this.observation } : null, alertness: this.vitals().alertness,
      choiceFeedback: this.feedback, ended: this.ended,
      authoredStateTransitions: true, doseModelAvailable: false, durableRecoveryProven: false,
    };
  }
}
