import type { EquipmentSnapshot } from '@platform/kernel/protocol';
import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import { TutorPanel } from '@anesthesia/ui/tutor-panel';
import { meconiumTransitionInlinePrompt } from '../neonatology/tutor/meconium-stained-transition-guidance';
import { Button } from '@platform/ui';

export function NeonatologyMeconiumTransitionTray({ assessment, scenarioVersion, onAction, guidance = 'unassisted', demonstrating = false }: {
  assessment?: NonNullable<EquipmentSnapshot['resuscitation']['neonatologyMeconiumTransitionAssessment']>;
  scenarioVersion: string;
  onAction: (action: string) => void;
  guidance?: GuidanceLevel;
  demonstrating?: boolean;
}) {
  const prompt = meconiumTransitionInlinePrompt(guidance, { scenarioVersion, meconiumTransition: assessment });
  const act = demonstrating ? undefined : onAction;
  const support = assessment?.supportAtTick != null;
  const context = assessment?.contextAtTick != null;
  const recognition = assessment?.recognitionAtTick != null;
  const readiness = assessment?.readinessAtTick != null;
  const reassessment = assessment?.reassessmentAtTick != null;
  const handoff = assessment?.handoffAtTick != null;
  return <>
    {demonstrating && <p className="syringe__remaining">Watching the worked example. Choose “Take the controls” to make your own decisions.</p>}
    <TutorPanel prompt={demonstrating ? null : prompt} />
    <section className="syringe" aria-labelledby="neonatology-meconium-now-title">
      <div id="neonatology-meconium-now-title" className="syringe__name">See the newborn, not just the fluid.</div>
      <p className="syringe__remaining">Connect breathing, tone, heart rate, airway visibility, warmth, parent, and whole dyad. Meconium alone does not decide the next step; every physical care step stays with the qualified team.</p>
      <div className="crisis-drug__actions">
        {!support && <Button className="crisis-drug__action" aria-disabled={demonstrating} onClick={act ? () => act('activate-meconium-stained-transition-prepared-newborn-airway-and-dyad-support') : undefined}>Confirm prepared support</Button>}
        {support && !context && <Button className="crisis-drug__action" aria-disabled={demonstrating} onClick={act ? () => act('reconcile-meconium-stained-transition-fluid-breathing-tone-heart-rate-airway-and-whole-dyad') : undefined}>Connect newborn + whole dyad</Button>}
        {context && !recognition && <Button className="crisis-drug__action" aria-disabled={demonstrating} onClick={act ? () => act('recognize-vigorous-meconium-stained-transition-without-routine-suction') : undefined}>Recognize the transition</Button>}
        {recognition && !readiness && <Button className="crisis-drug__action" aria-disabled={demonstrating} onClick={act ? () => act('review-qualified-selective-airway-clearing-observation-and-escalation-boundaries') : undefined}>Review selective boundaries</Button>}
      </div>
    </section>
    <section className="syringe" aria-labelledby="neonatology-meconium-later-title">
      <div id="neonatology-meconium-later-title" className="syringe__name">Quiet observation protects more than a reflex procedure.</div>
      <p className="syringe__remaining" role="status">{handoff ? 'Respiratory, thermal, feeding, parent, disposition, and outcome risks handed off.' : reassessment ? 'The supplied transition remains calm. Evolving respiratory disease, durable safety, and outcomes remain open.' : readiness ? 'Qualified protective care and respiratory observation continue. Review the fixed report after time passes.' : support ? 'Prepared support is present. Connect the whole newborn and dyad before naming the pattern.' : 'Begin with calm shared ownership. You can pause or leave this practice at any time.'}</p>
      <div className="crisis-drug__actions">
        {readiness && !reassessment && <Button className="crisis-drug__action" aria-disabled={demonstrating} onClick={act ? () => act('review-meconium-stained-transition-fixed-thirty-minute-qualified-report') : undefined}>Review the fixed 30-minute report</Button>}
        {reassessment && !handoff && <Button className="crisis-drug__action" aria-disabled={demonstrating} onClick={act ? () => act('handoff-meconium-stained-transition-respiratory-thermal-feeding-parent-and-outcome-risk') : undefined}>Hand off active transition risk</Button>}
      </div>
    </section>
  </>;
}
