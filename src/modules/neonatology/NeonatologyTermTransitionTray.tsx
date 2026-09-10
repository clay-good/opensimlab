import type { EquipmentSnapshot } from '@platform/kernel/protocol';
import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import { TutorPanel } from '@anesthesia/ui/tutor-panel';
import { termTransitionInlinePrompt } from '../neonatology/tutor/term-newborn-transition-guidance';
import { Button } from '@platform/ui';

export function NeonatologyTermTransitionTray({ assessment, scenarioVersion, onAction, guidance = 'unassisted', demonstrating = false }: {
  assessment?: NonNullable<EquipmentSnapshot['resuscitation']['neonatologyTermTransitionAssessment']>;
  scenarioVersion: string;
  onAction: (action: string) => void;
  guidance?: GuidanceLevel;
  demonstrating?: boolean;
}) {
  const prompt = termTransitionInlinePrompt(guidance, { scenarioVersion, termTransition: assessment });
  const act = demonstrating ? undefined : onAction;
  const support = assessment?.supportAtTick != null;
  const context = assessment?.contextAtTick != null;
  const recognition = assessment?.recognitionAtTick != null;
  const care = assessment?.careAtTick != null;
  const reassessment = assessment?.reassessmentAtTick != null;
  const handoff = assessment?.handoffAtTick != null;
  return <>
    {demonstrating && <p className="syringe__remaining">Watching the worked example. Choose “Take the controls” to make your own decisions.</p>}
    <TutorPanel prompt={demonstrating ? null : prompt} />
    <section className="syringe" aria-labelledby="neonatology-term-transition-now-title">
      <div id="neonatology-term-transition-now-title" className="syringe__name">Protect the quiet start. Keep the dyad together.</div>
      <p className="syringe__remaining">Connect the shared clock, breathing, tone, heart rate, warmth, position, parent, and preferences. Every physical care step stays with the qualified team.</p>
      <div className="crisis-drug__actions">
        {!support && <Button className="crisis-drug__action" aria-disabled={demonstrating} onClick={act ? () => act('activate-term-newborn-transition-prepared-newborn-and-dyad-support') : undefined}>Confirm prepared support</Button>}
        {support && !context && <Button className="crisis-drug__action" aria-disabled={demonstrating} onClick={act ? () => act('reconcile-term-newborn-transition-gestation-birth-breathing-tone-heart-rate-temperature-and-whole-dyad') : undefined}>Connect newborn + whole dyad</Button>}
        {context && !recognition && <Button className="crisis-drug__action" aria-disabled={demonstrating} onClick={act ? () => act('recognize-term-newborn-transition-without-resuscitation-or-well-newborn-closure') : undefined}>Recognize the transition</Button>}
        {recognition && !care && <Button className="crisis-drug__action" aria-disabled={demonstrating} onClick={act ? () => act('review-term-newborn-transition-qualified-cord-skin-to-skin-thermal-and-observation-care') : undefined}>Review qualified protective care</Button>}
      </div>
    </section>
    <section className="syringe" aria-labelledby="neonatology-term-transition-later-title">
      <div id="neonatology-term-transition-later-title" className="syringe__name">A smooth first hour is a checkpoint, not a promise.</div>
      <p className="syringe__remaining" role="status">{handoff ? 'Breathing, thermal, feeding, parent, escalation, disposition, and outcome risks handed off.' : reassessment ? 'The supplied transition remains stable. Durable safety, feeding success, discharge, and outcomes remain open.' : care ? 'Protective care is active with qualified staff. Review the fixed report after time passes.' : support ? 'Prepared support is present. Connect the whole dyad before naming the pattern.' : 'Begin with calm shared ownership. You can pause or leave this practice at any time.'}</p>
      <div className="crisis-drug__actions">
        {care && !reassessment && <Button className="crisis-drug__action" aria-disabled={demonstrating} onClick={act ? () => act('review-term-newborn-transition-fixed-one-hour-qualified-report') : undefined}>Review the fixed 1-hour report</Button>}
        {reassessment && !handoff && <Button className="crisis-drug__action" aria-disabled={demonstrating} onClick={act ? () => act('handoff-term-newborn-transition-breathing-temperature-feeding-parent-and-outcome-risk') : undefined}>Hand off active transition risk</Button>}
      </div>
    </section>
  </>;
}
