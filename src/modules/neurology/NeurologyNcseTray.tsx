/**
 * NeurologyNcseTray, moved out of `ActionCockpit.tsx` unchanged.
 *
 * The cockpit defined this tray inline and rendered it behind a `hasNeurologyNcseResponse` gate
 * computed from the scenario, so every specialty downloaded it. That gate is now this tray's
 * `supports` predicate in `trays.ts`; the body below is the original.
 */
import type { EquipmentSnapshot } from '@platform/kernel/protocol';
import { ncseInlinePrompt } from './tutor/nonconvulsive-status-epilepticus-recognition-guidance';
import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import { TutorPanel } from '@anesthesia/ui/tutor-panel';
import { Button } from '@platform/ui';

export function NeurologyNcseTray({ assessment, scenarioVersion, onAction, guidance = 'unassisted', demonstrating = false }: {
  assessment?: NonNullable<EquipmentSnapshot['resuscitation']['neurologyNcseAssessment']>;
  scenarioVersion: string;
  onAction: (action: string) => void;
  guidance?: GuidanceLevel;
  demonstrating?: boolean;
}) {
  const prompt = ncseInlinePrompt(guidance, { scenarioVersion, ncse: assessment });
  const act = demonstrating ? undefined : onAction;
  const trajectory = assessment?.trajectoryAtTick != null;
  const suspicion = assessment?.suspicionAtTick != null;
  const ownership = assessment?.ownershipAtTick != null;
  const alternatives = assessment?.alternativesAtTick != null;
  const later = assessment?.laterAtTick != null;
  const handoff = assessment?.handoffAtTick != null;
  return <div className="tray-grid">
    {demonstrating && <p className="syringe__remaining">Watching the worked example. Choose “Take the controls” to make your own decisions.</p>}
    <TutorPanel prompt={demonstrating ? null : prompt} />
    <section className="syringe" aria-labelledby="neurology-ncse-pattern-title">
      <div id="neurology-ncse-pattern-title" className="syringe__name">Quiet can still mean seizure.</div>
      <div className="syringe__meta">72 years · 95-minute fluctuation · speech arrest + gaze deviation · no convulsion</div>
      <p className="syringe__remaining">{alternatives ? 'Whole-patient safety and open alternatives reviewed.' : ownership ? 'Qualified EEG ownership is active · complete the alternatives review' : suspicion ? 'Urgent EEG boundary recognized · activate qualified ownership' : trajectory ? 'The fluctuating pattern warrants urgent qualified EEG assessment.' : 'Begin with the clock, fluctuation, subtle signs, and whole patient.'}</p>
      <div className="syringe__presets">
        {!trajectory && <Button className="crisis-drug__action" aria-disabled={demonstrating} onClick={act ? () => act('reconcile-neurology-ncse-clock-fluctuation-subtle-signs-and-whole-patient') : undefined}>Review fluctuation + subtle signs</Button>}
        {trajectory && !suspicion && <Button className="crisis-drug__action" aria-disabled={demonstrating} onClick={act ? () => act('recognize-neurology-ncse-suspicion-and-urgent-eeg-boundary-without-clinical-diagnosis') : undefined}>Recognize urgent EEG boundary</Button>}
        {suspicion && !ownership && <Button className="crisis-drug__action" aria-disabled={demonstrating} onClick={act ? () => act('activate-neurology-ncse-qualified-neurology-eeg-and-airway-capable-ownership') : undefined}>Activate qualified EEG ownership</Button>}
        {ownership && !alternatives && <Button className="crisis-drug__action" aria-disabled={demonstrating} onClick={act ? () => act('review-neurology-ncse-airway-glucose-vascular-metabolic-toxic-and-infectious-alternatives') : undefined}>Review safety + alternatives</Button>}
      </div>
      <p className="field__hint">Experienced teams own airway support, urgent EEG acquisition and interpretation, cause evaluation, and treatment. This lab exposes no learner raw-EEG, drug, dose, route, access, oxygen, airway-device, imaging, laboratory, or procedure control.</p>
    </section>
    <section className="syringe" aria-labelledby="neurology-ncse-eeg-title">
      <div id="neurology-ncse-eeg-title" className="syringe__name">EEG answers a clinical question.</div>
      <div className="syringe__meta">fixed 60-minute report · 24-minute seizure burden · no motor correlate</div>
      <p className="syringe__remaining" role="status">{handoff ? 'Electrographic status, clinical fluctuation, open causes, and owners handed off.' : later ? 'The qualified report meets the electrographic-status definition. Cause, treatment, response, recurrence, and outcome remain open.' : alternatives ? 'Qualified ownership is active. Review the fixed later EEG and clinical report.' : 'Complete suspicion, ownership, and alternatives review before reassessment.'}</p>
      <div className="syringe__presets">
        {alternatives && !later && <Button className="crisis-drug__action" aria-disabled={demonstrating} onClick={act ? () => act('review-neurology-ncse-strict-later-qualified-eeg-and-clinical-trajectory') : undefined}>Review qualified EEG report</Button>}
        {later && !handoff && <Button className="crisis-drug__action" aria-disabled={demonstrating} onClick={act ? () => act('handoff-neurology-ncse-cause-treatment-recurrence-and-active-risk') : undefined}>Hand off status + open risk</Button>}
      </div>
      <p className="field__hint">The supplied specialist report is fixed scenario evidence, not a raw tracing or an interpretation exercise. It does not supply cause, treatment choice, response, recurrence, prognosis, or outcome.</p>
    </section>
  </div>;
}
