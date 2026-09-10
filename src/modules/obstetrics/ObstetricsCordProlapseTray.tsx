import type { EquipmentSnapshot } from '@platform/kernel/protocol';
import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import { TutorPanel } from '@anesthesia/ui/tutor-panel';
import { cordProlapseInlinePrompt } from '../obstetrics/tutor/umbilical-cord-prolapse-urgent-birth-coordination-guidance';
import { Button } from '@platform/ui';

export function ObstetricsCordProlapseTray({ assessment, scenarioVersion, onAction, guidance = 'unassisted', demonstrating = false }: {
  assessment?: NonNullable<EquipmentSnapshot['resuscitation']['obstetricsCordProlapseAssessment']>;
  scenarioVersion: string;
  onAction: (action: string) => void;
  guidance?: GuidanceLevel;
  demonstrating?: boolean;
}) {
  const prompt = cordProlapseInlinePrompt(guidance, { scenarioVersion, cordProlapse: assessment });
  const act = demonstrating ? undefined : onAction;
  const support = assessment?.supportAtTick != null;
  const context = assessment?.contextAtTick != null;
  const bridge = assessment?.bridgeAtTick != null;
  const birthPlan = assessment?.birthPlanAtTick != null;
  const reassessment = assessment?.reassessmentAtTick != null;
  const handoff = assessment?.handoffAtTick != null;
  return <>
    {demonstrating && <p className="syringe__remaining">Watching the worked example. Choose “Take the controls” to make your own decisions.</p>}
    <TutorPanel prompt={demonstrating ? null : prompt} />
    <section className="syringe" aria-labelledby="obstetrics-cord-prolapse-now-title">
      <div id="obstetrics-cord-prolapse-now-title" className="syringe__name">Protect oxygen flow. Prepare the whole path.</div>
      <p className="syringe__remaining">Name the emergency, bring theatre and newborn teams close, and keep every physical bridge with the qualified bedside team.</p>
      <div className="crisis-drug__actions">
        {!support && <Button className="crisis-drug__action" aria-disabled={demonstrating} onClick={act ? () => act('activate-obstetrics-cord-prolapse-response-diagnosis-clock-theatre-anesthesia-newborn-and-support-roles') : undefined}>Activate response + diagnosis clock</Button>}
        {support && !context && <Button className="crisis-drug__action" aria-disabled={demonstrating} onClick={act ? () => act('reconcile-obstetrics-cord-prolapse-membrane-rupture-fetal-heart-exam-birth-imminence-and-whole-person') : undefined}>Connect rupture + whole-person facts</Button>}
        {context && !bridge && <Button className="crisis-drug__action" aria-disabled={demonstrating} onClick={act ? () => act('review-obstetrics-cord-prolapse-pressure-relief-minimal-handling-position-and-no-delay-boundaries') : undefined}>Review temporary-bridge boundaries</Button>}
        {bridge && !birthPlan && <Button className="crisis-drug__action" aria-disabled={demonstrating} onClick={act ? () => act('review-obstetrics-cord-prolapse-birth-urgency-mode-anesthesia-newborn-documentation-and-safety-boundaries') : undefined}>Review urgent-birth coordination</Button>}
      </div>
    </section>
    <section className="syringe" aria-labelledby="obstetrics-cord-prolapse-later-title">
      <div id="obstetrics-cord-prolapse-later-title" className="syringe__name">The bridge buys attention, not certainty.</div>
      <p className="syringe__remaining" role="status">{handoff ? 'Fetal, maternal, theatre, newborn, support, documentation, and outcome risks handed off.' : reassessment ? 'Compromise persists in the fixed report. Birth, newborn condition, and outcomes remain open.' : birthPlan ? 'The qualified team is preparing urgent birth. Review the fixed transfer report after time passes.' : support ? 'The response is active. Connect the facts, protect against delay, and coordinate the path to birth.' : 'Start with a calm declaration and a visible clock. You can pause or leave this practice at any time.'}</p>
      <div className="crisis-drug__actions">
        {birthPlan && !reassessment && <Button className="crisis-drug__action" aria-disabled={demonstrating} onClick={act ? () => act('review-obstetrics-cord-prolapse-fixed-persistent-fetal-compromise-and-theatre-transfer-report') : undefined}>Review the fixed transfer report</Button>}
        {reassessment && !handoff && <Button className="crisis-drug__action" aria-disabled={demonstrating} onClick={act ? () => act('handoff-obstetrics-cord-prolapse-fetal-maternal-theatre-newborn-support-documentation-and-outcome-risk') : undefined}>Hand off maternal + fetal risk</Button>}
      </div>
    </section>
  </>;
}
