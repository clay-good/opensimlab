/**
 * PediatricSupraventricularTachycardiaTray, moved out of `ActionCockpit.tsx` unchanged.
 *
 * The cockpit defined this tray inline and rendered it behind a `hasPediatricSupraventricularTachycardiaResponse` gate
 * computed from the scenario, so every specialty downloaded it. That gate is now this tray's
 * `supports` predicate in `trays.ts`; the body below is the original.
 */
import type { EquipmentSnapshot } from '@platform/kernel/protocol';
import { pediatricSvtInlinePrompt } from './tutor/pediatric-svt-guidance';
import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import { TutorPanel, WatchingNotice } from '@anesthesia/ui/tutor-panel';
import { Badge, Button } from '@platform/ui';

export function PediatricSupraventricularTachycardiaTray({ assessment, scenarioVersion, guidance = 'unassisted', demonstrating = false, onAction }: {
  assessment?: NonNullable<EquipmentSnapshot['resuscitation']['pediatricSupraventricularTachycardiaAssessment']>;
  scenarioVersion: string;
  guidance?: GuidanceLevel;
  demonstrating?: boolean;
  onAction: (action: string) => void;
}) {
  const trajectory = assessment?.trajectoryAtTick != null;
  const recognition = assessment?.recognitionAtTick != null;
  const care = assessment?.careAtTick != null;
  const safety = assessment?.safetyAtTick != null;
  const later = assessment?.laterResponseAtTick != null;
  const handoff = assessment?.handoffAtTick != null;
  const prompt = demonstrating ? null
    : pediatricSvtInlinePrompt(guidance, { scenarioVersion, patient: assessment });
  const act = demonstrating ? undefined : onAction;
  return <div style={{ display: 'grid', gap: 'var(--space-4)' }}>
    <WatchingNotice demonstrating={demonstrating} />
    <TutorPanel prompt={prompt} />
    <div className="tray-grid">
    <section className="syringe" aria-labelledby="pediatric-svt-pattern-title">
      <div id="pediatric-svt-pattern-title" className="syringe__name">Read the rhythm through the child.</div>
      <Badge kind="teaching">onset · regularity · width · rate · perfusion · symptoms</Badge>
      <div className="syringe__meta">6 years · 20 kg · regular narrow rhythm · pulse present</div>
      <p className="syringe__remaining">
        {safety ? 'Rhythm, support, and deterioration risks remain under review'
          : care ? 'Qualified rhythm care is active · complete the safety review'
            : recognition ? 'SVT with perfusion risk · qualified pediatric rhythm care matters now'
              : trajectory ? 'Now separate SVT from sinus tachycardia without using rate alone'
                : 'Start with the clock, supplied rhythm, and whole-child state.'}
      </p>
      <div className="syringe__presets">
        {!trajectory && <Button className="crisis-drug__action"
          aria-disabled={demonstrating} onClick={act ? () => act('reconcile-pediatric-svt-clock-rhythm-and-whole-child') : undefined}>Review rhythm + whole-child trajectory</Button>}
        {trajectory && !recognition && <Button className="crisis-drug__action"
          aria-disabled={demonstrating} onClick={act ? () => act('recognize-pediatric-svt-with-perfusion-compromise') : undefined}>Recognize SVT with perfusion risk</Button>}
        {recognition && !care && <Button className="crisis-drug__action"
          aria-disabled={demonstrating} onClick={act ? () => act('activate-pediatric-svt-qualified-rhythm-care-and-resuscitation-ownership') : undefined}>Activate qualified pediatric SVT care</Button>}
        {care && !safety && <Button className="crisis-drug__action"
          aria-disabled={demonstrating} onClick={act ? () => act('review-pediatric-svt-support-causes-heart-failure-and-deterioration-boundary') : undefined}>Review support + deterioration risks</Button>}
      </div>
      <p className="field__hint">Experienced pediatric, cardiology, nursing, pharmacy, and resuscitation teams own rhythm care, monitoring, access, support, cause review, and escalation. This surface exposes no learner maneuver, product, drug, dose, route, interval, device, energy, procedure, or treatment control.</p>
    </section>
    <section className="syringe" aria-labelledby="pediatric-svt-response-title">
      <div id="pediatric-svt-response-title" className="syringe__name">Conversion is a checkpoint.</div>
      <Badge kind="teaching">rhythm · perfusion · heart function · recurrence · ownership</Badge>
      <div className="syringe__meta">fixed minute-12 report · durable control remains open</div>
      <p className="syringe__remaining" role="status">
        {handoff ? 'Recurrence, cardiac, and caregiver risk handed off'
          : later ? 'Sinus rhythm is reported. Durable control and cause remain open.'
            : safety ? 'Review the fixed response after elapsed qualified care'
              : 'Recognition, qualified care, and safety review proceed in order.'}
      </p>
      <div className="syringe__presets">
        {safety && !later && <Button className="crisis-drug__action"
          aria-disabled={demonstrating} onClick={act ? () => act('review-pediatric-svt-later-response') : undefined}>Review the minute-12 response</Button>}
        {later && !handoff && <Button className="crisis-drug__action"
          aria-disabled={demonstrating} onClick={act ? () => act('handoff-pediatric-svt-recurrence-cardiology-and-caregiver-risk') : undefined}>Hand off recurrence + cardiology risk</Button>}
      </div>
      <p className="field__hint">Reported conversion does not prove treatment effect, durable rhythm control, ventricular recovery, recurrence exclusion, cause closure, discharge readiness, or outcome.</p>
    </section>
    </div>
  </div>;
}
