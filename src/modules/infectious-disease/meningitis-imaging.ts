import type { Scenario } from '@anesthesia/scenarios/types';
import { TICKS_PER_SECOND } from '@platform/clock/simulation-clock';
import type { MeningitisImagingSnapshot } from '@platform/kernel/protocol';
export type { MeningitisImagingSnapshot } from '@platform/kernel/protocol';

/**
 * Whether this patient needs a scan before a lumbar puncture is not a fact about the patient. It is
 * a fact about which rule set the unit stands in: the same three features fire two of the five
 * published criteria sets and none of the other three. The learner never chooses the pathway here,
 * because in most places nobody does; the local rule set does, and the delay follows from it.
 */
export const MENINGITIS_IMAGING_LOCAL_PATHWAY_TICKS = 40 * 60 * TICKS_PER_SECOND;
export const MENINGITIS_IMAGING_CEILING_TICKS = 60 * 60 * TICKS_PER_SECOND;
export const MENINGITIS_IMAGING_RESULT_TICKS = 75 * 60 * TICKS_PER_SECOND;
export const MENINGITIS_IMAGING_TAKEOVER_TICKS = 150 * 60 * TICKS_PER_SECOND;
export const MENINGITIS_IMAGING_SESSION_TICKS = 8 * 60 * 60 * TICKS_PER_SECOND;
export const MENINGITIS_IMAGING_ACTIONS = ['record-triggering-features', 'activate-time-critical-owners',
  'record-antimicrobial-intent', 'compare-criteria-sets', 'review-boundaries', 'monitor',
  'check-features', 'check-labs', 'reassess', 'handoff',
  'scan-first-is-safer', 'delay-antimicrobials-for-the-puncture', 'normal-crp-excludes',
  'negative-gram-stain-excludes'] as const;
export type MeningitisImagingAction = typeof MENINGITIS_IMAGING_ACTIONS[number];
export interface MeningitisImagingEvent { readonly id: string; readonly message: string }

/**
 * The five published criteria sets, and what each says about this one patient: a 68-year-old
 * transplant recipient on maintenance immunosuppression, GCS 14, with no focal deficit, no seizure,
 * no papilloedema, and no pupillary abnormality. Two say image first; three do not.
 */
export const MENINGITIS_IMAGING_CRITERIA = [
  { id: 'swedish', label: 'Swedish national criteria', indicated: false,
    reason: 'Requires signs of cerebral herniation, meaning deep coma, or a limb drift with more than four days of symptoms. None of the three features here appears on this list at all.' },
  { id: 'nice-ng240', label: 'NICE NG240 (2024)', indicated: false,
    reason: 'Requires new focal neurological features, abnormal pupillary reactions, a Glasgow Coma Scale score of 9 or less, or a progressive and sustained or rapid fall in consciousness, or risk factors for an evolving space-occupying lesion. A score of 14 is not 9 or less, and immunocompromise is not on this list.' },
  { id: 'escmid-2016', label: 'ESCMID (2016)', indicated: true,
    reason: 'Lists a severely immunocompromised state as an indication in its own right, alongside focal deficits, new-onset seizures, and a Glasgow Coma Scale score below 10. The transplant and maintenance immunosuppression fire this one.' },
  { id: 'idsa-2004', label: 'IDSA (2004, archived)', indicated: true,
    reason: 'Lists an immunocompromised state, an abnormal level of consciousness, and age 60 or over. All three fire here, any one of which would be sufficient. This guideline is marked archived by its issuing society and its data cutoff is 2004, which is itself part of the lesson.' },
  { id: 'who-2025', label: 'WHO (2025)', indicated: true,
    reason: 'Where imaging is readily accessible, lists a severely immunocompromised state among the features that should prompt imaging before lumbar puncture, and states that treatment must not be delayed for it.' },
] as const;

export function supportsMeningitisImaging(scenario: Scenario): boolean {
  return scenario.metadata.id === 'meningitis-imaging-a-rule-that-does-not-agree'
    && scenario.timeline.every((event) => event.type === 'narrative')
    && scenario.timeline.filter((event) => event.target === 'meningitis-imaging').length === 1
    && scenario.timeline.filter((event) => event.target === 'meningitis-imaging-evidence').length === 1
    && scenario.timeline.filter((event) => event.target === 'meningitis-imaging-boundary').length === 1;
}

export class MeningitisImaging {
  private featuresAt: number | null = null;
  private ownersAt: number | null = null;
  private antimicrobialAt: number | null = null;
  private criteriaAt: number | null = null;
  private boundariesAt: number | null = null;
  private monitoringAt: number | null = null;
  private localPathwayApplied = false;
  private imagingResulted = false;
  private imagingObserved = false;
  private ceilingPassed = false;
  private scanIsSaferAttempted = false;
  private delayAttempted = false;
  private crpAttempted = false;
  private gramStainAttempted = false;
  private phase = 0;
  private observedPhase: number | null = null;
  private featureObservation: MeningitisImagingSnapshot['featureObservation'] = null;
  private labObservation: MeningitisImagingSnapshot['labObservation'] = null;
  private observation: MeningitisImagingSnapshot['observation'] = null;
  private feedback: string | null = null;
  private ended: MeningitisImagingSnapshot['ended'] = null;

  private clinicalState() { return JSON.stringify([this.vitals(), this.labs()]); }
  private change(mutate: () => void) {
    const before = this.clinicalState(); mutate();
    if (before !== this.clinicalState()) this.phase += 1;
  }

  advance(tick: number): MeningitisImagingEvent[] {
    if (this.ended) return [];
    const terminal = this.antimicrobialAt === null ? MENINGITIS_IMAGING_TAKEOVER_TICKS : MENINGITIS_IMAGING_SESSION_TICKS;
    const until = Math.min(tick, terminal);
    const events: MeningitisImagingEvent[] = [];
    if (!this.localPathwayApplied && until >= MENINGITIS_IMAGING_LOCAL_PATHWAY_TICKS) {
      this.localPathwayApplied = true;
      events.push({ id: 'local-pathway-applied', message: 'The receiving unit applies its own local criteria, which include a severely immunocompromised state, and the patient goes for cranial imaging before the lumbar puncture. That decision belongs to the unit and its adopted rule set, not to the learner and not to this patient’s neurology. Under two of the other published sets, the same patient would have gone straight to lumbar puncture.' });
    }
    if (!this.ceilingPassed && this.antimicrobialAt === null && until >= MENINGITIS_IMAGING_CEILING_TICKS) {
      this.ceilingPassed = true;
      events.push({ id: 'ceiling-passed', message: 'One hour has elapsed since arrival with no antimicrobial intent recorded. Guidance is explicit that antimicrobials start within the hour and that diagnostics, imaging included, must not delay them. The ceiling is reported rather than hidden. The evidence behind the one-hour figure is graded very low to low quality: it is a system-design margin, not a validated biological deadline, and that does not make missing it acceptable.' });
    }
    if (!this.imagingResulted && this.localPathwayApplied && until >= MENINGITIS_IMAGING_RESULT_TICKS) {
      this.change(() => { this.imagingResulted = true; });
      events.push({ id: 'imaging-resulted', message: 'The scan is reported: no space-occupying lesion, no midline shift, nothing that contraindicates a lumbar puncture. It changed no management. That is the common result rather than a lucky one, and it is the reason the disagreement between the criteria sets matters: in a large series, imaging before puncture was associated with fewer patients treated within the hour, and abnormalities that altered management were rare.' });
    }
    if (tick >= terminal) {
      this.ended = 'instructor-takeover';
      events.push({ id: 'instructor-takeover', message: 'Instructor takeover ends the unfinished rehearsal. Review the recorded features, the comparison of the criteria sets, and bounded antimicrobial intent inside the hour. This authored stop predicts neither injury nor a safe delay.' });
    }
    return events;
  }

  apply(action: unknown, tick: number): MeningitisImagingEvent[] {
    const events = this.advance(tick);
    const emit = (id: string, message: string) => {
      if (!this.ended || id === 'handoff') this.feedback = message;
      return [...events, { id, message }];
    };
    if (this.ended) return emit('action-refused', 'This practice branch has ended. Open the debrief or restart.');
    switch (action) {
      case 'record-triggering-features':
        if (this.featuresAt !== null) return events;
        this.featuresAt = tick;
        return emit('features-recorded', 'The record states the three features as measured: age 68, maintenance immunosuppression after kidney transplantation, and a Glasgow Coma Scale score of 14. It also states what is absent: no focal deficit, no seizure, no papilloedema, no pupillary abnormality, no purpura. Recording both is what makes the criteria comparison possible, because every published rule set turns on exactly which features are and are not present.');
      case 'activate-time-critical-owners':
        if (this.ownersAt !== null) return events;
        this.ownersAt = tick;
        return emit('owners-activated', 'Time-critical infection, neurology, and nursing ownership is activated on the meningitis pattern. Blood cultures are drawn by the qualified team before antimicrobials, which is a different thing from waiting for them to be reported: cultures are taken before, never resulted before.');
      case 'record-antimicrobial-intent':
        if (this.antimicrobialAt !== null) return events;
        this.antimicrobialAt = tick;
        return emit('antimicrobial-intent', `Bounded qualified-team antimicrobial intent is recorded ${this.ceilingPassed ? 'after the one-hour ceiling has passed, which is reported rather than hidden' : 'inside the one-hour ceiling'}, and it does not wait for the imaging or the puncture. No agent, dose, route, combination, or adjunct is selected here, and the adjunctive corticosteroid question, including whether it continues once an organism is known, is a qualified-team decision.`);
      case 'compare-criteria-sets':
        if (this.criteriaAt !== null) return events;
        this.criteriaAt = tick;
        return emit('criteria-compared', `The five published criteria sets are compared against this one patient. ${MENINGITIS_IMAGING_CRITERIA.map((set) => `${set.label}: ${set.indicated ? 'image before puncture' : 'no imaging indicated'}.`).join(' ')} Two say image, three do not, and none of them has changed about this patient. What differs is the rule set, not the neurology. In a published cohort the same population met the imaging criteria in roughly seven, thirty-two, and sixty-five percent of cases under three of these sets, which is the size of the disagreement.`);
      case 'review-boundaries':
        if (this.boundariesAt !== null) return events;
        this.boundariesAt = tick;
        return emit('boundary-review', 'Supplied boundaries. Antimicrobials start within one hour of arrival and diagnostics must not delay them; that recommendation rests on evidence its own guideline developers graded very low to low quality. Blood cultures are taken before antimicrobials, not reported before them. Guidance is that imaging before lumbar puncture is not routine, but the lists of exceptions differ materially between the issuing bodies, and one widely cited set is marked archived by its own society with a data cutoff of 2004. A normal C-reactive protein, procalcitonin, or peripheral white cell count does not exclude bacterial meningitis, and neither does a negative Gram stain, whose sensitivity is roughly half. In a large observational series, lumbar puncture without preceding imaging was associated with lower mortality and with more patients treated inside the hour; that is observational and open to confounding by indication, which is stated rather than hidden.');
      case 'monitor':
        if (this.monitoringAt !== null) return events;
        this.monitoringAt = tick;
        return emit('monitoring', 'Continuous neurological and perfusion observation continues, because the features that would change the imaging answer are the ones that can change during the wait. A neurological look or a laboratory result on its own is useful but does not refresh the full assessment.');
      case 'check-features':
        this.featureObservation = this.featureFinding(tick);
        return emit('feature-check', `Requested neurological observation: Glasgow Coma Scale ${this.featureObservation.glasgowComaScale}; pupils ${this.featureObservation.pupilsEqualReactive ? 'equal and reactive' : 'not equal and reactive'}; ${this.featureObservation.focalDeficit ? 'focal deficit present' : 'no focal deficit'}; ${this.featureObservation.seizure ? 'seizure observed' : 'no seizure'}; ${this.featureObservation.papilloedema ? 'papilloedema present' : 'no papilloedema'}. These are the features every criteria set turns on. This partial observation supplies no new laboratory evidence.`);
      case 'check-labs':
        this.labObservation = this.labFinding(tick);
        return emit('lab-check', `Requested fictional laboratory evidence: C-reactive protein ${this.labObservation.crpMgL} mg/L; white cells ${this.labObservation.whiteCellsX109L.toFixed(1)} x10^9/L; platelets ${this.labObservation.plateletsX109L} x10^9/L; ${this.labObservation.cerebrospinalFluidAvailable ? 'cerebrospinal fluid obtained and a Gram stain reported with no organism seen' : 'no cerebrospinal fluid obtained yet'}. None of these excludes bacterial meningitis. This partial result supplies no current neurological observation.`);
      case 'reassess': {
        this.featureObservation = this.featureFinding(tick);
        this.labObservation = this.labFinding(tick);
        this.observation = { ...this.featureObservation, ...this.labObservation, ...this.vitals() };
        this.observedPhase = this.phase;
        if (this.imagingResulted) this.imagingObserved = true;
        const view = this.observation;
        return emit(this.imagingResulted ? 'imaged-reassessment' : 'initial-reassessment',
          `Fresh fictional assessment: Glasgow Coma Scale ${view.glasgowComaScale}; heart rate ${view.heartRateBpm}/min; BP ${view.systolicMmHg}/${view.diastolicMmHg} mmHg; temperature ${view.coreTemperatureC.toFixed(1)} C; ${view.focalDeficit ? 'focal deficit present' : 'still no focal deficit'}; C-reactive protein ${view.crpMgL} mg/L. ${this.imagingResulted ? 'The scan is reported as showing nothing that contraindicates a puncture, and it changed no management.' : this.localPathwayApplied ? 'The patient is away for imaging under the unit’s local rule set, and the clock has continued to run.' : 'The features that decide the imaging question are unchanged.'} No organism, treatment effect, or outcome is established here.`);
      }
      case 'scan-first-is-safer':
        this.scanIsSaferAttempted = true;
        return emit('scan-default-refused', 'Treating a scan first as the safe default was refused. The published evidence points the other way: in a large observational series, prompt lumbar puncture without preceding imaging was associated with lower mortality and with substantially more patients treated inside the hour, while abnormalities that changed management were rare. It is observational and confounding by indication is a real caveat, but "scan first is safer" is not the cautious position, it is an unevidenced one with a measured cost.');
      case 'delay-antimicrobials-for-the-puncture':
        this.delayAttempted = true;
        return emit('delay-refused', 'Holding antimicrobials until the puncture was refused. Guidance is explicit that the puncture happens before antimicrobials only if that is safe and does not cause a clinically significant delay, and that antimicrobials otherwise start first and the puncture follows as soon as it is safe. What is lost by treating first is microbiological yield, which is a real cost and belongs in the handoff, not a reason to wait.');
      case 'normal-crp-excludes':
        this.crpAttempted = true;
        return emit('crp-refused', 'Excluding bacterial meningitis on a normal C-reactive protein was refused. Guidance states this in as many words: do not rule out bacterial meningitis on a normal C-reactive protein, procalcitonin, or white cell count, and no peripheral blood test can confirm or exclude it. A lumbar puncture should not be deferred or delayed on their results.');
      case 'negative-gram-stain-excludes':
        this.gramStainAttempted = true;
        return emit('gram-stain-refused', 'Excluding bacterial meningitis on a negative Gram stain was refused. Its specificity is high, so a positive result is informative, but its sensitivity is roughly half in reported series, and lower again once antimicrobials have been given. A negative stain moves the question very little.');
      case 'handoff':
        if (this.featuresAt === null || this.ownersAt === null || this.antimicrobialAt === null
          || this.criteriaAt === null || this.boundariesAt === null || this.monitoringAt === null
          || this.observation === null || this.observedPhase !== this.phase) {
          return emit('handoff-refused', 'Record the triggering and absent features, activate time-critical ownership, record bounded antimicrobial intent, compare the criteria sets, review the boundaries, arrange monitoring, and take a current full assessment. A completed scan, an identified organism, and a normal biomarker are not handoff gates.');
        }
        this.ended = 'handoff';
        return emit('handoff', `The receiving team owns antimicrobial selection and delivery, the adjunctive corticosteroid decision and whether it continues, the puncture itself, organism identification, public health notification, and hearing assessment. What travels is the recorded features and their absences, which criteria sets they satisfy and which they do not, whether antimicrobial intent fell inside the hour, ${this.imagingObserved ? 'that the imaging changed no management, and what the pathway cost in time' : 'that the imaging question was still open'}, and any microbiological yield lost to prior antimicrobials. Practice ends, not treatment, and no organism, treatment effect, or outcome is certified.`);
      default:
        return emit('action-refused', 'That choice is not part of this fictional meningitis imaging lesson. No care was started.');
    }
  }

  private featureFinding(tick: number) {
    return { atTick: tick, glasgowComaScale: 14, pupilsEqualReactive: true,
      focalDeficit: false, seizure: false, papilloedema: false };
  }

  private labFinding(tick: number) {
    const values = this.imagingResulted
      ? { crpMgL: 168, whiteCellsX109L: 16.4, plateletsX109L: 186, cerebrospinalFluidAvailable: true }
      : { crpMgL: 142, whiteCellsX109L: 15.1, plateletsX109L: 194, cerebrospinalFluidAvailable: false };
    return { atTick: tick, ...values };
  }

  rhythm(): 'sinus' { return 'sinus'; }

  vitals() {
    // The neurology deliberately does not move: if it did, the criteria sets would stop disagreeing
    // and the lesson would become a different one about deterioration.
    return { heartRateBpm: 104, systolicMmHg: 128, diastolicMmHg: 74, meanArterialMmHg: 92,
      respiratoryRateBpm: 20, spo2Percent: 96, coreTemperatureC: 38.7,
      alertness: 'confused but obeying commands, Glasgow Coma Scale 14' };
  }

  private labs() { return this.labFinding(0); }

  snapshot(tick: number): MeningitisImagingSnapshot {
    const remaining = (at: number) => Math.max(0, Math.ceil((at - tick) / TICKS_PER_SECOND));
    return {
      featuresRecordedAtTick: this.featuresAt, ownersActivatedAtTick: this.ownersAt,
      antimicrobialIntentAtTick: this.antimicrobialAt, criteriaComparedAtTick: this.criteriaAt,
      boundariesReviewedAtTick: this.boundariesAt, monitoringAtTick: this.monitoringAt,
      ceilingDueInSeconds: !this.ended && !this.ceilingPassed && this.antimicrobialAt === null
        ? remaining(MENINGITIS_IMAGING_CEILING_TICKS) : null,
      ceilingPassed: this.ceilingPassed,
      antimicrobialInsideCeiling: this.antimicrobialAt !== null
        && this.antimicrobialAt < MENINGITIS_IMAGING_CEILING_TICKS,
      localPathwayApplied: this.localPathwayApplied,
      imagingResulted: this.imagingResulted,
      imagingObserved: this.imagingObserved,
      // Authored and fixed: the scan never changes management in this case, which is the point.
      imagingChangedManagement: false,
      criteriaCompared: this.criteriaAt !== null,
      scanIsSaferAttempted: this.scanIsSaferAttempted,
      delayAttempted: this.delayAttempted,
      crpAttempted: this.crpAttempted,
      gramStainAttempted: this.gramStainAttempted,
      featureObservation: this.featureObservation ? { ...this.featureObservation } : null,
      labObservation: this.labObservation ? { ...this.labObservation } : null,
      observation: this.observation ? { ...this.observation } : null, alertness: this.vitals().alertness,
      choiceFeedback: this.feedback, ended: this.ended,
      authoredStateTransitions: true, doseModelAvailable: false, durableRecoveryProven: false,
    };
  }
}
