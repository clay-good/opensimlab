import type { EquipmentSnapshot } from '@platform/kernel/protocol';
import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import { TutorPanel } from '@anesthesia/ui/tutor-panel';
import { shoulderDystociaInlinePrompt } from '../obstetrics/tutor/shoulder-dystocia-cognitive-sequence-guidance';
import { Button } from '@platform/ui';

export function ObstetricsShoulderDystociaTray({ assessment, scenarioVersion, onAction, guidance = 'unassisted', demonstrating = false }: {
  assessment?: NonNullable<EquipmentSnapshot['resuscitation']['obstetricsShoulderDystociaAssessment']>;
  scenarioVersion: string;
  onAction: (action: string) => void;
  guidance?: GuidanceLevel;
  demonstrating?: boolean;
}) {
  const prompt = shoulderDystociaInlinePrompt(guidance, { scenarioVersion, shoulderDystocia: assessment });
  const act = demonstrating ? undefined : onAction;
  const support = assessment?.supportAtTick != null;
  const context = assessment?.contextAtTick != null;
  const safety = assessment?.safetyAtTick != null;
  const escalation = assessment?.escalationAtTick != null;
  const reassessment = assessment?.reassessmentAtTick != null;
  const handoff = assessment?.handoffAtTick != null;
  return <>
    {demonstrating && <p className="syringe__remaining">Watching the worked example. Choose “Take the controls” to make your own decisions.</p>}
    <TutorPanel prompt={demonstrating ? null : prompt} />
    <section className="syringe" aria-labelledby="obstetrics-shoulder-dystocia-now-title">
      <div id="obstetrics-shoulder-dystocia-now-title" className="syringe__name">Slow the room down. Start the clock.</div>
      <p className="syringe__remaining">Name the emergency, bring the right people in, and protect against force. The learner surface keeps every physical maneuver with the qualified birth team.</p>
      <div className="crisis-drug__actions">
        {!support && <Button className="crisis-drug__action" aria-disabled={demonstrating} onClick={act ? () => act('activate-obstetrics-shoulder-dystocia-emergency-response-head-delivery-clock-leader-timekeeper-newborn-and-support-roles') : undefined}>Activate response + head clock</Button>}
        {support && !context && <Button className="crisis-drug__action" aria-disabled={demonstrating} onClick={act ? () => act('reconcile-obstetrics-shoulder-dystocia-head-delivery-gentle-traction-failure-position-pushing-and-whole-person') : undefined}>Connect head delivery + whole person</Button>}
        {context && !safety && <Button className="crisis-drug__action" aria-disabled={demonstrating} onClick={act ? () => act('review-obstetrics-shoulder-dystocia-stop-pushing-no-fundal-pressure-no-forceful-traction-and-first-line-position-boundary') : undefined}>Review protect-from-force boundaries</Button>}
        {safety && !escalation && <Button className="crisis-drug__action" aria-disabled={demonstrating} onClick={act ? () => act('review-obstetrics-shoulder-dystocia-qualified-escalation-maneuvers-episiotomy-access-rescue-and-documentation-boundary') : undefined}>Review flexible qualified sequence</Button>}
      </div>
    </section>
    <section className="syringe" aria-labelledby="obstetrics-shoulder-dystocia-later-title">
      <div id="obstetrics-shoulder-dystocia-later-title" className="syringe__name">The birth ends. The care does not.</div>
      <p className="syringe__remaining" role="status">{handoff ? 'Maternal and newborn injury, hemorrhage, trauma, documentation, support, review, and outcome risks handed off.' : reassessment ? 'Birth is complete in the authored report. Maternal and newborn condition, injury, resuscitation, support, and outcomes remain open.' : escalation ? 'The qualified team is working through a case-specific sequence. Review the fixed report after time passes.' : support ? 'The response is active. Connect the facts, protect against force, and review a flexible qualified sequence.' : 'Start with a calm declaration and a visible clock. You can pause or leave this practice at any time.'}</p>
      <div className="crisis-drug__actions">
        {escalation && !reassessment && <Button className="crisis-drug__action" aria-disabled={demonstrating} onClick={act ? () => act('review-obstetrics-shoulder-dystocia-fixed-qualified-delivery-and-immediate-risk-report') : undefined}>Review the fixed birth report</Button>}
        {reassessment && !handoff && <Button className="crisis-drug__action" aria-disabled={demonstrating} onClick={act ? () => act('handoff-obstetrics-shoulder-dystocia-maternal-newborn-injury-hemorrhage-support-documentation-and-outcome-risk') : undefined}>Hand off maternal + newborn risk</Button>}
      </div>
    </section>
  </>;
}
