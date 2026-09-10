/**
 * CopdTransitionTray, moved out of `ActionCockpit.tsx` unchanged.
 *
 * The cockpit defined this tray inline and rendered it behind a `hasCopdTransitionResponse` gate
 * computed from the scenario, so every specialty downloaded it. The gate is now this tray's
 * `supports` predicate in `trays.ts`; the body below is the original.
 */
import type { EquipmentSnapshot } from '@platform/kernel/protocol';
import { copdTransitionInlinePrompt } from './tutor/copd-exacerbation-transition-reassessment-guidance';
import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import { TutorPanel } from '@anesthesia/ui/tutor-panel';
import { Badge, Button } from '@platform/ui';

export function CopdTransitionTray({ assessment, scenarioVersion, onAction, guidance = 'unassisted', demonstrating = false }: {
  assessment?: NonNullable<EquipmentSnapshot['resuscitation']['copdTransitionAssessment']>;
  scenarioVersion: string;
  onAction: (action: string) => void;
  guidance?: GuidanceLevel;
  demonstrating?: boolean;
}) {
  const prompt = copdTransitionInlinePrompt(guidance, { scenarioVersion, copdTransition: assessment });
  const act = demonstrating ? undefined : onAction;
  const readiness = assessment?.readinessAtTick != null;
  const respiratory = assessment?.respiratoryNeedsAtTick != null;
  const medication = assessment?.medicationAtTick != null;
  const coordination = assessment?.coordinationAtTick != null;
  const handoff = assessment?.handoffAtTick != null;
  return <div className="tray-grid">
    {demonstrating && <p className="syringe__remaining">Watching the worked example. Choose “Take the controls” to make your own decisions.</p>}
    <TutorPanel prompt={demonstrating ? null : prompt} />
    <section className="syringe" aria-labelledby="copd-transition-readiness-title">
      <div id="copd-transition-readiness-title" className="syringe__name">Better is not the same as ready.</div>
      <Badge kind="teaching">hospital day 3 · improving gas · residual limits</Badge>
      <div className="syringe__meta">baseline → admission → current rest + activity</div>
      <p className="syringe__remaining" role="status">{medication ? 'Residual needs reviewed · medication ownership recorded' : respiratory ? 'Oxygen uncertainty preserved · review the transition regimen' : readiness ? 'Improvement reconciled · review what remains' : 'Start with recovery versus readiness'}</p>
      <div className="syringe__presets">
        <Button className="crisis-drug__action" disabled={readiness} aria-disabled={demonstrating} onClick={act ? () => act('reconcile-copd-exacerbation-recovery-and-readiness') : undefined}>Reconcile recovery + readiness</Button>
        <Button className="crisis-drug__action" disabled={!readiness || respiratory} aria-disabled={demonstrating} onClick={act ? () => act('review-copd-exacerbation-residual-respiratory-and-oxygen-needs') : undefined}>Review residual breathing + oxygen needs</Button>
        <Button className="crisis-drug__action" disabled={!respiratory || medication} aria-disabled={demonstrating} onClick={act ? () => act('review-copd-exacerbation-maintenance-and-acute-medication-plan') : undefined}>Review medication + technique ownership</Button>
      </div>
      <p className="field__hint">The corridor and blood-gas reports are authored. This acute snapshot does not qualify long-term oxygen or turn improvement into a discharge decision.</p>
    </section>
    <section className="syringe" aria-labelledby="copd-transition-ownership-title">
      <div id="copd-transition-ownership-title" className="syringe__name">Make the next steps feel held.</div>
      <Badge kind="teaching">rehabilitation · self-management · follow-up</Badge>
      <div className="syringe__meta">named owners · access remains local · no promises</div>
      <p className="syringe__remaining" role="status">{handoff ? 'Open transition work handed off with named owners' : coordination ? 'Coordination recorded · advance time before handoff' : medication ? 'Transition review ready for coordinated ownership' : 'Complete the recovery review first'}</p>
      <div className="syringe__presets">
        <Button className="crisis-drug__action" disabled={!medication || coordination} aria-disabled={demonstrating} onClick={act ? () => act('coordinate-copd-exacerbation-rehabilitation-self-management-and-follow-up') : undefined}>Coordinate rehab + follow-up</Button>
        <Button className="crisis-drug__action" disabled={!coordination || handoff} aria-disabled={demonstrating} onClick={act ? () => act('handoff-copd-exacerbation-transition-reassessment') : undefined}>Hand off unresolved transition work</Button>
      </div>
      <p className="field__hint">No oxygen prescription, inhaler selection, treatment delivery, technique grading, rehabilitation enrollment, guaranteed appointment, discharge, prognosis, or outcome is chosen here.</p>
    </section>
  </div>;
}
