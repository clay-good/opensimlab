import type { Scenario } from '@anesthesia/scenarios/types';
import { TICKS_PER_SECOND } from '@platform/clock/simulation-clock';
import type { InheritedUrgencySnapshot } from '@platform/kernel/protocol';
export type { InheritedUrgencySnapshot } from '@platform/kernel/protocol';

/**
 * The hyperleukocytosis lesson in this module teaches that a real urgency does not select a
 * manoeuvre. This one is a different shape and had to be built not to read as its variation: here
 * the urgency itself is mostly inherited rather than present, and the correct action is the one
 * that looks like inaction. The cost of hurrying is not paid by this patient tonight. It is paid
 * by the next decision, which needs a diagnosis that tonight's treatment can take away.
 */
export const INHERITED_URGENCY_OFFER_TICKS = 25 * 60 * TICKS_PER_SECOND;
export const INHERITED_URGENCY_TEAM_TICKS = 40 * 60 * TICKS_PER_SECOND;
export const INHERITED_URGENCY_TAKEOVER_TICKS = 180 * 60 * TICKS_PER_SECOND;
export const INHERITED_URGENCY_SESSION_TICKS = 8 * 60 * 60 * TICKS_PER_SECOND;
export const INHERITED_URGENCY_ACTIONS = ['record-the-findings-that-would-make-it-an-emergency',
  'record-that-the-tissue-decides-the-treatment', 'secure-the-diagnostic-pathway',
  'record-bounded-treatment-intent', 'review-boundaries',
  'check-observations', 'check-the-supplied-imaging', 'reassess', 'handoff',
  'start-radiotherapy-tonight-before-the-biopsy', 'the-swelling-alone-makes-it-an-emergency',
  'send-him-home-to-await-the-biopsy', 'treat-the-distended-veins-with-a-diuretic'] as const;
export type InheritedUrgencyAction = typeof INHERITED_URGENCY_ACTIONS[number];
export interface InheritedUrgencyEvent { readonly id: string; readonly message: string }

export function supportsInheritedUrgency(scenario: Scenario): boolean {
  return scenario.metadata.id === 'inherited-urgency-an-emergency-that-mostly-is-not-one'
    && scenario.timeline.every((event) => event.type === 'narrative')
    && scenario.timeline.filter((event) => event.target === 'inherited-urgency').length === 1
    && scenario.timeline.filter((event) => event.target === 'inherited-urgency-evidence').length === 1
    && scenario.timeline.filter((event) => event.target === 'inherited-urgency-boundary').length === 1;
}

export class InheritedUrgency {
  private findingsAt: number | null = null;
  private tissueAt: number | null = null;
  private pathwayAt: number | null = null;
  private intentAt: number | null = null;
  private boundariesAt: number | null = null;
  private offered = false;
  private teamResponded = false;
  private teamObserved = false;
  private treatFirstAttempted = false;
  private swellingOnlyAttempted = false;
  private sendHomeAttempted = false;
  private diureticAttempted = false;
  private phase = 0;
  private observedPhase: number | null = null;
  private observationRecord: InheritedUrgencySnapshot['observationRecord'] = null;
  private imagingRecord: InheritedUrgencySnapshot['imagingRecord'] = null;
  private observation: InheritedUrgencySnapshot['observation'] = null;
  private feedback: string | null = null;
  private ended: InheritedUrgencySnapshot['ended'] = null;

  /**
   * The deliberate contrast with this module's hyperleukocytosis lesson: the patient does not
   * move. What moves is the pressure to treat him. So the gate tracks the offer and the team
   * rather than the observations, and a reassessment has to be repeated after each, because
   * findings recorded as absent an hour ago are not findings excluded now.
   */
  private clinicalState() {
    return JSON.stringify([this.offered, this.teamResponded]);
  }
  private change(mutate: () => void) {
    const before = this.clinicalState(); mutate();
    if (before !== this.clinicalState()) this.phase += 1;
  }

  advance(tick: number): InheritedUrgencyEvent[] {
    if (this.ended) return [];
    const terminal = this.pathwayAt === null ? INHERITED_URGENCY_TAKEOVER_TICKS : INHERITED_URGENCY_SESSION_TICKS;
    const until = Math.min(tick, terminal);
    const events: InheritedUrgencyEvent[] = [];
    if (!this.offered && until >= INHERITED_URGENCY_OFFER_TICKS) {
      this.change(() => { this.offered = true; });
      events.push({ id: 'treatment-offered', message: 'The radiation oncology registrar rings back. There is a treatment slot tonight and she is willing to use it; the biopsy list is tomorrow morning. Nothing about the patient has changed while this was being arranged: he has no stridor, he is fully alert, and his blood pressure is unchanged. What has arrived is an offer, not a deterioration, and the two are easy to confuse when one of them comes with a phone call.' });
    }
    // The diagnostic pathway is the only route to a treatment decision, and only if somebody books it.
    if (!this.teamResponded && this.pathwayAt !== null
      && until >= this.pathwayAt + INHERITED_URGENCY_TEAM_TICKS) {
      this.change(() => { this.teamResponded = true; });
      events.push({ id: 'team-responded', message: 'Acute oncology answers and accepts him. The biopsy is booked for the morning list and flagged, the respiratory team will do it, and the ward has been told which findings to call about overnight. They take ownership of radiotherapy, stenting, systemic therapy, steroid and anticoagulation decisions, and say plainly that what determines which of those he gets is the histology, so the thing that most changes his treatment tonight is that the sample is still worth taking in the morning.' });
    }
    if (tick >= terminal) {
      this.ended = 'instructor-takeover';
      events.push({ id: 'instructor-takeover', message: 'Instructor takeover ends the unfinished rehearsal. Review the findings that would make this an emergency, that the tissue decides the treatment, securing the diagnostic pathway, bounded treatment intent, and the boundaries. This authored stop predicts no patient outcome.' });
    }
    return events;
  }

  apply(action: unknown, tick: number): InheritedUrgencyEvent[] {
    const events = this.advance(tick);
    const emit = (id: string, message: string) => {
      if (!this.ended || id === 'handoff') this.feedback = message;
      return [...events, { id, message }];
    };
    if (this.ended) return emit('action-refused', 'This practice branch has ended. Open the debrief or restart.');
    switch (action) {
      case 'record-the-findings-that-would-make-it-an-emergency':
        if (this.findingsAt !== null) return events;
        this.findingsAt = tick;
        return emit('findings-recorded', 'The record names the three findings that would place him in the group that cannot wait, and records each as looked for and absent rather than unmentioned: no stridor and no other sign of significant laryngeal oedema, no confusion or obtundation to suggest significant cerebral oedema, and no haemodynamic compromise — no syncope, no hypotension. Absent and checked is a different record from absent and assumed, and only one of them tells the night team what to compare against.');
      case 'record-that-the-tissue-decides-the-treatment':
        if (this.tissueAt !== null) return events;
        this.tissueAt = tick;
        return emit('tissue-recorded', 'It is recorded that the histology, not the swelling, decides what he is given: the causes of this picture are treated differently from one another, and there is no treatment that is correct for all of them. That is the reason accumulating evidence supports accurate diagnosis and biopsy preceding emergent therapeutic intervention in most cases — an accurate histological diagnosis before radiotherapy is what allows the causative malignancy to be treated optimally. The diagnosis is not a delay before the treatment decision. It is the treatment decision.');
      case 'secure-the-diagnostic-pathway':
        if (this.pathwayAt !== null) return events;
        this.pathwayAt = tick;
        return emit('pathway-secured', `Acute oncology is called and the diagnostic pathway is secured${this.offered ? ', with the offered slot and the reason it is being declined tonight stated as they stand' : ''}. The referral names the imaging finding, the absent emergency findings and the time they were checked, and asks for the biopsy to be prioritised on the morning list. This is the action that looks most like doing nothing and is the one that moves his treatment forward, because nothing can be chosen until the sample exists.`);
      case 'record-bounded-treatment-intent':
        if (this.intentAt !== null) return events;
        this.intentAt = tick;
        return emit('intent-recorded', 'Bounded intent is recorded and nothing is started: that the qualified team owns radiotherapy and its timing, endovascular stenting, systemic therapy, steroid and anticoagulation decisions, and the definitive treatment of whatever the biopsy shows. No drug, dose, route, product, fraction, threshold, or procedure is chosen here, and none is displayed.');
      case 'review-boundaries':
        if (this.boundariesAt !== null) return events;
        this.boundariesAt = tick;
        return emit('boundary-review', 'Supplied boundaries. Only about 5 percent of patients with this syndrome present with the grade that is genuinely life-threatening, which is defined by significant cerebral oedema, significant laryngeal oedema, or significant haemodynamic compromise — and any of those is an indication for emergent intervention. Death is very rarely caused by the syndrome itself: in one reported series of 1,986 patients, one death. Read both halves. The proportion is not this patient’s risk, and it is not a reason to stop looking; it is the reason the default is to get the diagnosis first, and the named findings are what override that default.');
      case 'check-observations':
        this.observationRecord = this.observationFinding(tick);
        return emit('observation-check', `Requested observations: heart rate ${this.observationRecord.heartRateBpm}/min; blood pressure ${this.observationRecord.systolicMmHg}/${this.observationRecord.diastolicMmHg} mmHg; respiratory rate ${this.observationRecord.respiratoryRateBpm}/min; oxygen saturation ${this.observationRecord.spo2Percent}% on air; ${this.observationRecord.stridor ? 'stridor present' : 'no stridor'}; ${this.observationRecord.consciousLevel}. This partial check supplies no imaging.`);
      case 'check-the-supplied-imaging':
        this.imagingRecord = this.imagingFinding(tick);
        return emit('imaging-check', `Requested supplied imaging: a computed tomogram taken ${this.imagingRecord.imagingAgeHours} hours ago reports a right upper-lobe mass with superior vena caval compression and collateral filling; ${this.imagingRecord.tissueDiagnosisAvailable ? 'a tissue diagnosis is available' : 'there is no tissue diagnosis'}; biopsy is ${this.imagingRecord.biopsyBooked ? 'booked' : 'not yet booked'}. No test is acquired or interpreted by this learner. This partial check supplies no observations.`);
      case 'reassess': {
        this.observationRecord = this.observationFinding(tick);
        this.imagingRecord = this.imagingFinding(tick);
        this.observation = { ...this.observationRecord, ...this.imagingRecord, ...this.vitals() };
        this.observedPhase = this.phase;
        if (this.teamResponded) this.teamObserved = true;
        const view = this.observation;
        return emit(this.teamResponded ? 'reviewed-reassessment' : 'initial-reassessment',
          `Fresh fictional assessment: heart rate ${view.heartRateBpm}/min; blood pressure ${view.systolicMmHg}/${view.diastolicMmHg} mmHg; respiratory rate ${view.respiratoryRateBpm}/min; oxygen saturation ${view.spo2Percent}% on air; ${view.stridor ? 'stridor present' : 'no stridor'}; ${view.consciousLevel}. The face and neck swelling is as it was. ${this.teamResponded ? 'Acute oncology has accepted him, the biopsy is booked and flagged for the morning, and they own the treatment decisions.' : this.offered ? 'A treatment slot has been offered for tonight; the patient is unchanged.' : 'Nothing about him has changed.'} No diagnosis beyond the supplied imaging, treatment effect, or outcome is established here.`);
      }
      case 'start-radiotherapy-tonight-before-the-biopsy':
        this.treatFirstAttempted = true;
        return emit('treat-first-refused', 'Starting radiotherapy tonight, ahead of the biopsy, was refused, and the refusal is about the sequence rather than about radiotherapy. He has none of the three findings that make this the grade which cannot wait. Treating first can leave the sample unable to say what this is, and what it is decides what he should be given — so the cost of tonight is not paid tonight, and it is not paid by whoever agreed to it. Radiotherapy may well be exactly what he needs tomorrow, chosen by people who know what they are treating.');
      case 'the-swelling-alone-makes-it-an-emergency':
        this.swellingOnlyAttempted = true;
        return emit('swelling-only-refused', 'Treating the swelling itself as what makes this an emergency was refused. A distended face and filled neck veins are how this presents at every grade, including the grades that wait safely; what separates the roughly 5 percent who cannot wait is significant cerebral oedema, significant laryngeal oedema, or significant haemodynamic compromise. Grading it by how alarming it looks is how a patient who could have had a diagnosis first ends up without one.');
      case 'send-him-home-to-await-the-biopsy':
        this.sendHomeAttempted = true;
        return emit('send-home-refused', 'Sending him home to come back for the biopsy was refused. That this is usually not an emergency is not the same as this being nothing: he is unmonitored, the findings that would change everything can appear, and they are findings somebody has to be present to notice. The conclusion from the evidence is that the diagnosis comes first, not that the patient can be put down.');
      case 'treat-the-distended-veins-with-a-diuretic':
        this.diureticAttempted = true;
        return emit('diuretic-refused', 'Giving a diuretic to settle the distended veins was refused. The veins are full because an obstruction is upstream of the heart, not because he is overloaded, so this treats the appearance rather than the mechanism and reduces the venous return that is already impeded. It is also a drug decision, which is not this learner’s to make in this lesson, and no drug, dose, or route is displayed.');
      case 'handoff':
        if (this.findingsAt === null || this.tissueAt === null || this.pathwayAt === null
          || this.intentAt === null || this.boundariesAt === null
          || this.observation === null || this.observedPhase !== this.phase) {
          return emit('handoff-refused', 'Record the findings that would make this an emergency and whether they are present, record that the tissue decides the treatment, secure the diagnostic pathway, record bounded qualified-team treatment intent, review the boundaries, and take a current assessment. A histological result, a chosen treatment, and a smaller neck are not handoff gates.');
        }
        this.ended = 'handoff';
        return emit('handoff', `The receiving team owns radiotherapy and its timing, stenting, systemic therapy, steroid and anticoagulation decisions, and the definitive treatment. What travels is the supplied imaging finding, that the three findings which would make this the grade that cannot wait were looked for and ${this.observation.stridor ? 'are present' : 'were absent when last checked'}, the time they were last checked, that the tissue decides the treatment and the biopsy is ${this.teamObserved ? 'booked and flagged for the morning' : 'requested and not yet confirmed'}, ${this.treatFirstAttempted ? 'that treatment before tissue was considered and not taken, ' : ''}and what to call about overnight. Practice ends, not care, and no diagnosis, treatment effect, or outcome is certified.`);
      default:
        return emit('action-refused', 'That choice is not part of this fictional superior vena caval obstruction lesson. No care was started.');
    }
  }

  private observationFinding(tick: number) {
    return { atTick: tick, heartRateBpm: 88,
      systolicMmHg: 128, diastolicMmHg: 76,
      respiratoryRateBpm: 18,
      spo2Percent: 96, coreTemperatureC: 36.8,
      // Absent in every state, and that is the authored point: what changes is the pressure.
      stridor: false,
      consciousLevel: 'fully alert and orientated' };
  }

  private imagingFinding(tick: number) {
    return { atTick: tick, imagingAgeHours: 4, tissueDiagnosisAvailable: false,
      biopsyBooked: this.teamResponded, caudalCollaterals: true };
  }

  rhythm(): 'sinus' { return 'sinus'; }

  vitals() {
    // Deliberately still. The only lesson in this module where nothing about the patient moves,
    // because what is being rehearsed is holding a position while somebody offers to act.
    return { heartRateBpm: 88, systolicMmHg: 128, diastolicMmHg: 76,
      meanArterialMmHg: 93, respiratoryRateBpm: 18,
      spo2Percent: 96, coreTemperatureC: 36.8,
      alertness: 'fully alert and orientated' };
  }

  snapshot(_tick: number): InheritedUrgencySnapshot {
    return {
      findingsRecordedAtTick: this.findingsAt, tissueRecordedAtTick: this.tissueAt,
      pathwaySecuredAtTick: this.pathwayAt, treatmentIntentAtTick: this.intentAt,
      boundariesReviewedAtTick: this.boundariesAt,
      lifeThreateningGradePercent: 5,
      // False in every state. The findings, not the swelling, are what would change this.
      emergencyFindingsPresent: false,
      treatmentOffered: this.offered,
      teamResponded: this.teamResponded,
      teamObserved: this.teamObserved,
      treatBeforeTissueAttempted: this.treatFirstAttempted,
      swellingOnlyAttempted: this.swellingOnlyAttempted,
      sendHomeAttempted: this.sendHomeAttempted,
      diureticAttempted: this.diureticAttempted,
      observationRecord: this.observationRecord ? { ...this.observationRecord } : null,
      imagingRecord: this.imagingRecord ? { ...this.imagingRecord } : null,
      observation: this.observation ? { ...this.observation } : null, alertness: this.vitals().alertness,
      choiceFeedback: this.feedback, ended: this.ended,
      authoredStateTransitions: true, doseModelAvailable: false, durableRecoveryProven: false,
    };
  }
}
