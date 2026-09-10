import type { EquipmentSnapshot } from '@platform/kernel/protocol';
import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import { TutorPanel } from '@anesthesia/ui/tutor-panel';
import { acetaminophenInlinePrompt } from '../toxicology/tutor/acetaminophen-clock-and-nomogram-guidance';
import { Button } from '@platform/ui';

export function ToxicologyAcetaminophenTray({ assessment, scenarioVersion, onAction, guidance = 'unassisted', demonstrating = false }: {
  assessment?: NonNullable<EquipmentSnapshot['resuscitation']['toxicologyAcetaminophenAssessment']>;
  scenarioVersion: string;
  onAction: (action: string) => void;
  guidance?: GuidanceLevel;
  demonstrating?: boolean;
}) {
  const prompt = acetaminophenInlinePrompt(guidance, { scenarioVersion, acetaminophen: assessment });
  const act = demonstrating ? undefined : onAction;
  const trajectory = assessment?.trajectoryAtTick != null;
  const recognition = assessment?.recognitionAtTick != null;
  const support = assessment?.supportAtTick != null;
  const evidence = assessment?.evidenceAtTick != null;
  const reassessment = assessment?.reassessmentAtTick != null;
  const handoff = assessment?.handoffAtTick != null;
  return <>
    {demonstrating && <p className="syringe__remaining">Watching the worked example. Choose “Take the controls” to make your own decisions.</p>}
    <TutorPanel prompt={demonstrating ? null : prompt} />
    <section className="syringe" aria-labelledby="toxicology-acetaminophen-early-title">
      <div id="toxicology-acetaminophen-early-title" className="syringe__name">The clock gives the number its meaning.</div>
      <p className="syringe__remaining">Begin with product, ingestion window, exact clock, symptoms, reported-quantity limits, and whole person.</p>
      <div className="crisis-drug__actions">
        {!trajectory && <Button className="crisis-drug__action" aria-disabled={demonstrating} onClick={act ? () => act('reconcile-toxicology-acetaminophen-product-ingestion-window-clock-symptoms-and-whole-patient') : undefined}>Connect product + clock</Button>}
        {trajectory && !recognition && <Button className="crisis-drug__action" aria-disabled={demonstrating} onClick={act ? () => act('recognize-toxicology-acetaminophen-acute-timed-pattern-and-nomogram-applicability-boundary') : undefined}>Set the nomogram boundary</Button>}
        {recognition && !support && <Button className="crisis-drug__action" aria-disabled={demonstrating} onClick={act ? () => act('activate-toxicology-acetaminophen-poison-center-emergency-monitoring-and-nonjudgmental-safety-ownership') : undefined}>Bring in toxicology + safety</Button>}
        {support && !evidence && <Button className="crisis-drug__action" aria-disabled={demonstrating} onClick={act ? () => act('review-toxicology-acetaminophen-supplied-timed-level-nomogram-position-liver-and-coingestion-boundary') : undefined}>Review the timed evidence</Button>}
      </div>
    </section>
    <section className="syringe" aria-labelledby="toxicology-acetaminophen-later-title">
      <div id="toxicology-acetaminophen-later-title" className="syringe__name">A finished clock is not a stopping rule.</div>
      <p className="syringe__remaining" role="status">{handoff ? 'Serial level, liver and failure markers, stopping criteria, safety, disposition, and outcome uncertainty handed off.' : reassessment ? 'The fixed later level and labs are reassuring. They do not create an automatic stop or prove treatment effect.' : evidence ? 'The supplied timed level and nomogram position are visible. Record bounded intent after time passes.' : support ? 'Qualified toxicology, emergency, monitoring, and safety ownership are active. Review the supplied evidence.' : 'Complete recognition and immediate ownership before antidote review.'}</p>
      <div className="crisis-drug__actions">
        {evidence && !reassessment && <Button className="crisis-drug__action" aria-disabled={demonstrating} onClick={act ? () => act('record-toxicology-acetaminophen-bounded-qualified-team-acetylcysteine-intent-and-strict-later-review') : undefined}>Record intent + review</Button>}
        {reassessment && !handoff && <Button className="crisis-drug__action" aria-disabled={demonstrating} onClick={act ? () => act('handoff-toxicology-acetaminophen-serial-level-liver-failure-stopping-safety-and-active-risk') : undefined}>Hand off what stays open</Button>}
      </div>
    </section>
  </>;
}
