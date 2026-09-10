/**
 * NeurologyFocalMotorStatusTray, moved out of `ActionCockpit.tsx` unchanged.
 *
 * The cockpit defined this tray inline and rendered it behind a `hasNeurologyFocalMotorStatusResponse` gate
 * computed from the scenario, so every specialty downloaded it. That gate is now this tray's
 * `supports` predicate in `trays.ts`; the body below is the original.
 */
import type { EquipmentSnapshot } from '@platform/kernel/protocol';
import { focalMotorStatusInlinePrompt } from './tutor/focal-motor-status-epilepticus-escalation-guidance';
import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import { TutorPanel } from '@anesthesia/ui/tutor-panel';
import { Button } from '@platform/ui';

export function NeurologyFocalMotorStatusTray({ assessment, scenarioVersion, onAction, guidance = 'unassisted', demonstrating = false }: {
  assessment?: NonNullable<EquipmentSnapshot['resuscitation']['neurologyFocalMotorStatusAssessment']>;
  scenarioVersion: string;
  onAction: (action: string) => void;
  guidance?: GuidanceLevel;
  demonstrating?: boolean;
}) {
  const prompt = focalMotorStatusInlinePrompt(guidance, { scenarioVersion, focalMotorStatus: assessment });
  const act = demonstrating ? undefined : onAction;
  const trajectory = assessment?.trajectoryAtTick != null;
  const recognition = assessment?.recognitionAtTick != null;
  const ownership = assessment?.ownershipAtTick != null;
  const safety = assessment?.safetyAtTick != null;
  const later = assessment?.laterAtTick != null;
  const handoff = assessment?.handoffAtTick != null;
  return <div className="tray-grid">
    {demonstrating && <p className="syringe__remaining">Watching the worked example. Choose “Take the controls” to make your own decisions.</p>}
    <TutorPanel prompt={demonstrating ? null : prompt} />
    <section className="syringe" aria-labelledby="neurology-focal-motor-status-pattern-title">
      <div id="neurology-focal-motor-status-pattern-title" className="syringe__name">Less movement is not over.</div>
      <div className="syringe__meta">58 years · 18-minute evolving seizure · left face + arm clonus · no recovery</div>
      <p className="syringe__remaining">{safety ? 'Whole-patient safety and open causes reviewed.' : ownership ? 'Qualified ownership is active · complete the safety review' : recognition ? 'Overt focal motor status recognized · activate qualified ownership' : trajectory ? 'The motor pattern evolved; visible seizure activity continues.' : 'Begin with the clock, motor evolution, recovery, and whole patient.'}</p>
      <div className="syringe__presets">
        {!trajectory && <Button className="crisis-drug__action" aria-disabled={demonstrating} onClick={act ? () => act('reconcile-neurology-focal-motor-status-clock-semiology-recovery-and-whole-patient') : undefined}>Review clock + motor evolution</Button>}
        {trajectory && !recognition && <Button className="crisis-drug__action" aria-disabled={demonstrating} onClick={act ? () => act('recognize-neurology-focal-motor-status-despite-reduced-convulsions') : undefined}>Recognize focal motor status</Button>}
        {recognition && !ownership && <Button className="crisis-drug__action" aria-disabled={demonstrating} onClick={act ? () => act('activate-neurology-focal-motor-status-qualified-seizure-and-airway-ownership') : undefined}>Activate qualified status ownership</Button>}
        {ownership && !safety && <Button className="crisis-drug__action" aria-disabled={demonstrating} onClick={act ? () => act('review-neurology-focal-motor-status-airway-glucose-causes-and-injury-boundary') : undefined}>Review airway + glucose + causes</Button>}
      </div>
      <p className="field__hint">Experienced teams own seizure treatment, monitoring, airway support, cause evaluation, and escalation. This lab exposes no learner drug, dose, route, access, oxygen, airway-device, EEG, imaging, laboratory, or procedure control.</p>
    </section>
    <section className="syringe" aria-labelledby="neurology-focal-motor-status-trajectory-title">
      <div id="neurology-focal-motor-status-trajectory-title" className="syringe__name">What is still moving?</div>
      <div className="syringe__meta">fixed minute-26 report · visible focal clonus persists · cause remains open</div>
      <p className="syringe__remaining" role="status">{handoff ? 'Active visible seizure, open causes, and owners handed off.' : later ? 'Visible focal clonus persists. Recovery, cause, and treatment effect remain open.' : safety ? 'Qualified ownership is active. Review the fixed later motor report.' : 'Complete recognition, ownership, and safety review before reassessment.'}</p>
      <div className="syringe__presets">
        {safety && !later && <Button className="crisis-drug__action" aria-disabled={demonstrating} onClick={act ? () => act('review-neurology-focal-motor-status-strict-later-visible-motor-trajectory') : undefined}>Review the minute-26 motor report</Button>}
        {later && !handoff && <Button className="crisis-drug__action" aria-disabled={demonstrating} onClick={act ? () => act('handoff-neurology-focal-motor-status-recovery-cause-and-active-risk') : undefined}>Hand off active status + cause risk</Button>}
      </div>
      <p className="field__hint">Persistent visible clonus does not supply a cause, EEG state, treatment effect, durable seizure control, recovery, prognosis, or outcome.</p>
    </section>
  </div>;
}
