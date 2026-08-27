import type { Scenario } from '@anesthesia/scenarios/types';
import { TICKS_PER_SECOND } from '@platform/clock/simulation-clock';
import type { AvpDeficiencySnapshot } from '@platform/kernel/protocol';
export type { AvpDeficiencySnapshot } from '@platform/kernel/protocol';

// Authored bedside contrasts, not required waits, prescribing rates, or treatment kinetics.
export const AVP_DEFICIENCY_VOLUME_TICKS = 15 * 60 * TICKS_PER_SECOND;
export const AVP_DEFICIENCY_DELAY_TICKS = 30 * 60 * TICKS_PER_SECOND;
export const AVP_DEFICIENCY_DESMOPRESSIN_TICKS = 30 * 60 * TICKS_PER_SECOND;
export const AVP_DEFICIENCY_UNCONTROLLED_TICKS = 120 * 60 * TICKS_PER_SECOND;
export const AVP_DEFICIENCY_RESPONSE_TICKS = 120 * 60 * TICKS_PER_SECOND;
export const AVP_DEFICIENCY_TAKEOVER_TICKS = 60 * 60 * TICKS_PER_SECOND;
export const AVP_DEFICIENCY_SESSION_TICKS = 300 * 60 * TICKS_PER_SECOND;
export const AVP_DEFICIENCY_ACTIONS = ['call-support', 'review-context', 'restore-volume', 'monitor',
  'reassess', 'replace-water', 'restore-desmopressin', 'handoff', 'normalize-now', 'withhold-desmopressin'] as const;
export type AvpDeficiencyAction = typeof AVP_DEFICIENCY_ACTIONS[number];
export interface AvpDeficiencyEvent { readonly id: string; readonly message: string }

export function supportsAvpDeficiency(scenario: Scenario): boolean {
  return scenario.metadata.id === 'hypernatremic-dehydration-avp-deficiency'
    && scenario.timeline.every((event) => event.type === 'narrative')
    && scenario.timeline.filter((event) => event.target === 'avp-deficiency').length === 1
    && scenario.timeline.filter((event) => event.target === 'avp-deficiency-boundary').length === 1;
}

/** Known isolated AVP-D. No dosing, water-deficit solver, diagnostic challenge, or injury prediction. */
export class AvpDeficiency {
  private supportAt: number | null = null;
  private contextAt: number | null = null;
  private monitoringAt: number | null = null;
  private volumeAt: number | null = null;
  private waterAt: number | null = null;
  private desmopressinAt: number | null = null;
  private circulationRestored = false;
  private delayed = false;
  private desmopressinResponded = false;
  private responded = false;
  private responseSodium = 162;
  private sodium = 162;
  private urineOutput = 60;
  private urineOsmolality = 100;
  private volumeObserved = false;
  private diluteObserved = false;
  private responseObserved = false;
  private peakObserved = 162;
  private normalizationAttempted = false;
  private withholdingChosen = false;
  private observation: AvpDeficiencySnapshot['observation'] = null;
  private feedback: string | null = null;
  private ended: AvpDeficiencySnapshot['ended'] = null;

  private responseAt(): number | null {
    return this.waterAt !== null && this.desmopressinAt !== null ? Math.max(this.waterAt, this.desmopressinAt) : null;
  }

  advance(tick: number): AvpDeficiencyEvent[] {
    if (this.ended) return [];
    const events: AvpDeficiencyEvent[] = [];
    if (this.volumeAt === null && tick >= AVP_DEFICIENCY_DELAY_TICKS && !this.delayed) {
      this.delayed = true; this.sodium = 164;
      events.push({ id: 'volume-delay', message: 'Circulatory signs worsen at the authored no-volume-support checkpoint. Escalate qualified volume assessment and resuscitation now. Low urine output during hypovolemia does not exclude water loss in known AVP deficiency; this is not a safe waiting interval.' });
    }
    if (!this.circulationRestored && this.volumeAt !== null && tick - this.volumeAt >= AVP_DEFICIENCY_VOLUME_TICKS) {
      this.circulationRestored = true; this.sodium = Math.max(this.sodium, 163);
      this.urineOutput = 450; this.urineOsmolality = 95;
      events.push({ id: 'volume-checkpoint', message: 'The authored circulation checkpoint shows improved blood pressure and pulse. Continue qualified water-balance care and request current sodium and urine findings. Improved circulation alone does not establish correction of dehydration or hypernatremia; the clock is not a required clinical wait.' });
    }
    if (this.volumeAt !== null && tick - this.volumeAt >= AVP_DEFICIENCY_UNCONTROLLED_TICKS
      && this.waterAt === null && this.desmopressinAt === null) {
      this.sodium = 165;
      // Unrequested laboratory evolution must not announce its value or alter observed history.
    }
    if (!this.desmopressinResponded && this.desmopressinAt !== null
      && tick - this.desmopressinAt >= AVP_DEFICIENCY_DESMOPRESSIN_TICKS) {
      this.desmopressinResponded = true; this.urineOutput = 80; this.urineOsmolality = 500;
    }
    const responseAt = this.responseAt();
    if (!this.responded && responseAt !== null && tick - responseAt >= AVP_DEFICIENCY_RESPONSE_TICKS) {
      this.responded = true; this.sodium = this.responseSodium;
      events.push({ id: 'response-checkpoint', message: 'The scheduled authored combined-care checkpoint is ready for reassessment. Obtain fresh sodium and urine findings and continue close fluid-balance and clinical surveillance. Elapsed time is not proof of a safe correction rate, resolved hypernatremia, or readiness to repeat desmopressin.' });
    }
    if ((this.volumeAt === null && tick >= AVP_DEFICIENCY_TAKEOVER_TICKS) || tick >= AVP_DEFICIENCY_SESSION_TICKS) {
      this.ended = 'instructor-takeover';
      events.push({ id: 'instructor-takeover', message: this.volumeAt === null
        ? 'Instructor takeover ends the authored branch without volume restoration. This teaching stop is not a clinical treatment deadline or a prediction of death or neurologic injury.'
        : 'Instructor takeover ends the unfinished rehearsal. Review ongoing water replacement, prescribed treatment, surveillance, reassessment, and ownership. This teaching limit does not predict a clinical outcome.' });
    }
    return events;
  }

  apply(action: unknown, tick: number): AvpDeficiencyEvent[] {
    const events = this.advance(tick);
    const emit = (id: string, message: string) => {
      if (!this.ended || id === 'handoff') this.feedback = message;
      return [...events, { id, message }];
    };
    if (this.ended) return emit('action-refused', 'This practice branch has ended. Open the debrief or restart.');
    switch (action) {
      case 'call-support':
        if (this.supportAt !== null) return events;
        this.supportAt = tick;
        return emit('support', 'Qualified endocrine, emergency, monitored-care, nursing, and pharmacy support is active. Urgent circulation and water-balance care does not await an administrative acknowledgment.');
      case 'review-context':
        if (this.contextAt !== null) return events;
        this.contextAt = tick;
        return emit('context-review', 'Known isolated AVP deficiency, two omitted prescribed desmopressin doses, and lost access to drinking water explain this selected context. Verify the established prescription, formulation, route, availability, and ability to drink. Exact hypernatremia duration is unknown; this is not acute sodium loading, new AVP-D diagnosis, or renal AVP resistance.');
      case 'monitor':
        if (this.monitoringAt !== null) return events;
        this.monitoringAt = tick;
        return emit('monitoring', 'Qualified serial sodium, urine output and concentration, fluid balance, potassium, renal, neurologic, and circulatory surveillance is established. Increase reassessment with changing losses or treatment. Monitoring does not automatically replace the last requested result.');
      case 'restore-volume':
        if (this.volumeAt !== null) return events;
        this.volumeAt = tick;
        return emit('volume-restoration', 'Qualified restoration of depleted circulating volume begins with bedside reassessment and appropriate isotonic fluid. No dose, rate, or fluid-deficit calculation is supplied. In this hypovolemic patient, circulation takes priority before the controlled free-water pathway; do not wait for a new laboratory result or administrative review.');
      case 'replace-water':
        if (this.waterAt !== null) return events;
        if (!this.circulationRestored) return emit('water-review-refused', 'Prioritize qualified restoration of the depleted circulation in this selected branch. Controlled water replacement becomes available with the observed blood-pressure and pulse response; no new urine or sodium test is required to unlock it. The authored interval is not a required clinical wait.');
        this.waterAt = tick;
        if (this.desmopressinAt !== null) this.responseSodium = Math.max(162, this.sodium - 1);
        return emit('water-replacement', 'Qualified controlled replacement of the water deficit and ongoing needs begins, with oral or enteral water when safe and an individualized alternative when needed. Coordinate closely with desmopressin and serial findings; neither the drug request nor an administrative review is a prerequisite. No replacement prescription or normalization promise is supplied.');
      case 'restore-desmopressin':
        if (this.desmopressinAt !== null) return events;
        if (!this.circulationRestored) return emit('desmopressin-review-refused', 'Address depleted circulation first in this selected branch, then restore the known prescribed desmopressin through qualified clinical assessment and close response monitoring. This is not a universal instruction to withhold maintenance treatment or wait for a new diagnostic urine result.');
        this.desmopressinAt = tick;
        if (this.waterAt !== null) this.responseSodium = Math.max(162, this.sodium - 1);
        return emit('desmopressin-restoration', 'Qualified restoration of known prescribed desmopressin begins with verified formulation, route, and close clinical and biochemical observation. Water replacement remains independently necessary. Further doses are not automatic: antidiuresis combined with large water loads can accelerate sodium correction. No dose or conversion is selected.');
      case 'normalize-now':
        this.normalizationAttempted = true;
        return emit('normalization-refused', 'Rapid normalization was not started. Exact hypernatremia duration is unknown. Coordinate controlled water replacement, prescribed desmopressin, and repeated findings with the qualified team; combining unchecked water loads and antidiuresis can accelerate correction. The attempted shortcut remains learning evidence.');
      case 'withhold-desmopressin':
        if (this.desmopressinAt !== null) return emit('action-refused', 'Prescribed desmopressin restoration is already active. Choosing to defer its start is no longer the current decision; continue response monitoring rather than automatically repeating treatment.');
        this.withholdingChosen = true;
        return emit('withholding-choice', 'The blanket withholding choice is retained. Known AVP deficiency can remain dangerous when urine output is modest during hypovolemia, and inability to drink does not make prescribed desmopressin optional. Restore circulation and arrange qualified prescribed treatment with close water-balance observation.');
      case 'reassess': {
        this.observation = { atTick: tick, sodiumMmolL: this.sodium, urineOutputMlPerHour: this.urineOutput,
          urineOsmolalityMosmPerKg: this.urineOsmolality, ...this.vitals() };
        if (this.circulationRestored) this.volumeObserved = true;
        if (this.circulationRestored && !this.desmopressinResponded) this.diluteObserved = true;
        if (this.responded) this.responseObserved = true;
        this.peakObserved = Math.max(this.peakObserved, this.sodium);
        return emit(this.responded ? 'response-reassessment' : this.circulationRestored ? 'volume-reassessment' : 'initial-reassessment',
          `Fresh fictional assessment: sodium ${this.sodium} mmol/L, urine output ${this.urineOutput} mL/hour, urine osmolality ${this.urineOsmolality} mOsm/kg, BP ${this.vitals().systolicMmHg}/${this.vitals().diastolicMmHg} mmHg. The patient remains awake, thirsty, and tired. Continue qualified clinical and laboratory reassessment; these authored findings do not establish a prescribing rate or resolved water deficit.`);
      }
      case 'handoff':
        if (this.supportAt === null || this.contextAt === null || this.monitoringAt === null
          || this.responseAt() === null || !this.responseObserved) {
          return emit('handoff-refused', 'Keep the rehearsal open until qualified support, medication and water-access review, surveillance, both water replacement and prescribed desmopressin, and a fresh combined-care assessment are recorded. Urgent care does not wait for the administrative steps or an earlier teaching assessment.');
        }
        this.ended = 'handoff';
        return emit('handoff', 'The receiving qualified team owns continued sodium, urine, fluid-balance, renal and clinical surveillance, individualized water replacement, prescribed desmopressin access and reassessment before further doses. Preserve the supplied sodium, requested results, and observed peak. This ends the rehearsal, not hypernatremia; no discharge readiness or durable correction is established.');
      default:
        return emit('action-refused', 'That choice is not part of this fictional AVP-deficiency lesson. Nothing changed.');
    }
  }

  vitals() {
    // Laboratory values, urine output, and urine concentration are requested observations only.
    const circulation = this.circulationRestored
      ? { systolicMmHg: 110, diastolicMmHg: 68, meanArterialMmHg: 82, heartRateBpm: 92 }
      : this.delayed
        ? { systolicMmHg: 80, diastolicMmHg: 46, meanArterialMmHg: 57, heartRateBpm: 124 }
        : { systolicMmHg: 90, diastolicMmHg: 54, meanArterialMmHg: 66, heartRateBpm: 112 };
    return { ...circulation, respiratoryRateBpm: 20, spo2Percent: 98, coreTemperatureC: 37.1,
      alertness: 'awake, thirsty, and tired' };
  }

  snapshot(tick: number): AvpDeficiencySnapshot {
    const responseAt = this.responseAt();
    return { supportActive: this.supportAt !== null, contextReviewedAtTick: this.contextAt, monitoringAtTick: this.monitoringAt,
      volumeAtTick: this.volumeAt, waterAtTick: this.waterAt, desmopressinAtTick: this.desmopressinAt,
      volumeDueInSeconds: !this.ended && this.volumeAt !== null && !this.circulationRestored
        ? Math.max(0, Math.ceil((this.volumeAt + AVP_DEFICIENCY_VOLUME_TICKS - tick) / TICKS_PER_SECOND)) : null,
      responseDueInSeconds: !this.ended && responseAt !== null && !this.responded
        ? Math.max(0, Math.ceil((responseAt + AVP_DEFICIENCY_RESPONSE_TICKS - tick) / TICKS_PER_SECOND)) : null,
      circulationRestored: this.circulationRestored, volumeObserved: this.volumeObserved, diluteLossesObserved: this.diluteObserved,
      responseObserved: this.responseObserved, peakObservedSodiumMmolL: this.peakObserved,
      volumeDelayed: this.delayed, normalizationAttempted: this.normalizationAttempted, withholdingChosen: this.withholdingChosen,
      observation: this.observation ? { ...this.observation } : null, alertness: this.vitals().alertness,
      choiceFeedback: this.feedback, ended: this.ended, authoredStateTransitions: true,
      doseModelAvailable: false, durableRecoveryProven: false };
  }
}
