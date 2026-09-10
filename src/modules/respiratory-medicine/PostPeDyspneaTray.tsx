/**
 * PostPeDyspneaTray, moved out of `ActionCockpit.tsx` unchanged.
 *
 * The cockpit defined this tray inline and rendered it behind a `hasPostPeDyspneaResponse` gate
 * computed from the scenario, so every specialty downloaded it. The gate is now this tray's
 * `supports` predicate in `trays.ts`; the body below is the original.
 */
import type { EquipmentSnapshot } from '@platform/kernel/protocol';
import { postPeDyspneaInlinePrompt } from './tutor/post-pulmonary-embolism-persistent-dyspnea-guidance';
import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import { TutorPanel } from '@anesthesia/ui/tutor-panel';
import { Badge, Button } from '@platform/ui';

export function PostPeDyspneaTray({ assessment, scenarioVersion, onAction, guidance = 'unassisted', demonstrating = false }: {
  assessment?: NonNullable<EquipmentSnapshot['resuscitation']['postPeDyspneaAssessment']>;
  scenarioVersion: string;
  onAction: (action: string) => void;
  guidance?: GuidanceLevel;
  demonstrating?: boolean;
}) {
  const prompt = postPeDyspneaInlinePrompt(guidance, { scenarioVersion, postPeDyspnea: assessment });
  const act = demonstrating ? undefined : onAction;
  const trajectory = assessment?.trajectoryAtTick != null;
  const safety = assessment?.safetyAtTick != null;
  const evidence = assessment?.evidenceAtTick != null;
  const referral = assessment?.referralAtTick != null;
  const handoff = assessment?.handoffAtTick != null;
  return <div className="tray-grid">
    {demonstrating && <p className="syringe__remaining">Watching the worked example. Choose “Take the controls” to make your own decisions.</p>}
    <TutorPanel prompt={demonstrating ? null : prompt} />
    <section className="syringe" aria-labelledby="post-pe-dyspnea-trajectory-title">
      <div id="post-pe-dyspnea-trajectory-title" className="syringe__name">Recovery deserves a real comparison.</div>
      <Badge kind="teaching">4 months · 2 miles before · 150 m now</Badge>
      <div className="syringe__meta">course · anticoagulation · rest · exertion · warnings</div>
      <p className="syringe__remaining" role="status">{evidence ? 'Persistent limitation + fixed evidence reviewed' : safety ? 'Current safety held · review what may explain the limit' : trajectory ? 'Trajectory reconciled · review function + warning signs' : 'Start with life before and after the embolism'}</p>
      <div className="syringe__presets">
        <Button className="crisis-drug__action" disabled={trajectory} aria-disabled={demonstrating} onClick={act ? () => act('reconcile-post-pe-symptoms-and-anticoagulation-course') : undefined}>Reconcile course + symptoms</Button>
        <Button className="crisis-drug__action" disabled={!trajectory || safety} aria-disabled={demonstrating} onClick={act ? () => act('review-post-pe-functional-limitation-and-current-safety') : undefined}>Review function + current safety</Button>
        <Button className="crisis-drug__action" disabled={!safety || evidence} aria-disabled={demonstrating} onClick={act ? () => act('review-post-pe-ctepd-evidence-and-alternatives') : undefined}>Review evidence + open causes</Button>
      </div>
      <p className="field__hint">The treatment record, walk, echo, and perfusion reports are authored. Persistent symptoms justify evaluation; no single report makes a CTEPD or CTEPH diagnosis.</p>
    </section>
    <section className="syringe" aria-labelledby="post-pe-dyspnea-ownership-title">
      <div id="post-pe-dyspnea-ownership-title" className="syringe__name">Make the unresolved work feel held.</div>
      <Badge kind="teaching">pulmonary vascular review · treatment owner · safety net</Badge>
      <div className="syringe__meta">named results · open diagnosis · urgent triggers</div>
      <p className="syringe__remaining" role="status">{handoff ? 'Persistent symptoms + unresolved evaluation handed off' : referral ? 'Expert pathway active · advance time before handoff' : evidence ? 'Concern is clear · connect the expert pathway' : 'Complete the symptom and evidence review first'}</p>
      <div className="syringe__presets">
        <Button className="crisis-drug__action" disabled={!evidence || referral} aria-disabled={demonstrating} onClick={act ? () => act('activate-post-pe-pulmonary-vascular-referral') : undefined}>Coordinate expert evaluation</Button>
        <Button className="crisis-drug__action" disabled={!referral || handoff} aria-disabled={demonstrating} onClick={act ? () => act('handoff-post-pe-persistent-dyspnea-reassessment') : undefined}>Hand off unresolved post-PE work</Button>
      </div>
      <p className="field__hint">No anticoagulant, dose, duration, oxygen, rehabilitation, pulmonary-hypertension therapy, surgery, balloon procedure, operability decision, disposition, prognosis, or outcome is chosen.</p>
    </section>
  </div>;
}
