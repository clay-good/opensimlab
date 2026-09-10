import type { EquipmentSnapshot } from '@platform/kernel/protocol';
import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import { TutorPanel } from '@anesthesia/ui/tutor-panel';
import { highNeuraxialInlinePrompt } from '../obstetrics/tutor/high-neuraxial-block-obstetric-coordination-guidance';
import { Button } from '@platform/ui';

export function ObstetricsHighNeuraxialTray({ assessment, scenarioVersion, onAction, guidance = 'unassisted', demonstrating = false }: {
  assessment?: NonNullable<EquipmentSnapshot['resuscitation']['obstetricsHighNeuraxialAssessment']>;
  scenarioVersion: string;
  onAction: (action: string) => void;
  guidance?: GuidanceLevel;
  demonstrating?: boolean;
}) {
  const prompt = highNeuraxialInlinePrompt(guidance, { scenarioVersion, highNeuraxial: assessment });
  const act = demonstrating ? undefined : onAction;
  const support = assessment?.supportAtTick != null;
  const context = assessment?.contextAtTick != null;
  const uncertainty = assessment?.uncertaintyAtTick != null;
  const readiness = assessment?.readinessAtTick != null;
  const reassessment = assessment?.reassessmentAtTick != null;
  const handoff = assessment?.handoffAtTick != null;
  return <>
    {demonstrating && <p className="syringe__remaining">Watching the worked example. Choose “Take the controls” to make your own decisions.</p>}
    <TutorPanel prompt={demonstrating ? null : prompt} />
    <section className="syringe" aria-labelledby="obstetrics-high-neuraxial-now-title">
      <div id="obstetrics-high-neuraxial-now-title" className="syringe__name">Stay close. Watch the block, breathing, and circulation together.</div>
      <p className="syringe__remaining">Connect the injection clock, rising block, arms, voice, circulation, fetus, and whole person. Every physical intervention stays with the qualified team.</p>
      <div className="crisis-drug__actions">
        {!support && <Button className="crisis-drug__action" aria-disabled={demonstrating} onClick={act ? () => act('activate-obstetrics-high-neuraxial-block-airway-anesthesia-obstetric-theatre-newborn-and-support-response') : undefined}>Activate airway-capable response</Button>}
        {support && !context && <Button className="crisis-drug__action" aria-disabled={demonstrating} onClick={act ? () => act('reconcile-obstetrics-high-neuraxial-block-injection-clock-level-breathing-arms-circulation-fetus-and-whole-person') : undefined}>Connect block + whole person</Button>}
        {context && !uncertainty && <Button className="crisis-drug__action" aria-disabled={demonstrating} onClick={act ? () => act('review-obstetrics-high-neuraxial-block-rapid-progression-awareness-and-alternative-cause-boundaries') : undefined}>Review progression + alternatives</Button>}
        {uncertainty && !readiness && <Button className="crisis-drug__action" aria-disabled={demonstrating} onClick={act ? () => act('review-obstetrics-high-neuraxial-block-parallel-airway-ventilation-circulation-uterine-displacement-fetal-birth-and-support-readiness') : undefined}>Review parallel readiness</Button>}
      </div>
    </section>
    <section className="syringe" aria-labelledby="obstetrics-high-neuraxial-later-title">
      <div id="obstetrics-high-neuraxial-later-title" className="syringe__name">Support can improve before the block is safe.</div>
      <p className="syringe__remaining" role="status">{handoff ? 'Airway, circulation, block, fetal, birth, awareness, support, and outcome risks handed off.' : reassessment ? 'Breathing and circulation improve in the fixed report. Block recession, fetal recovery, birth, awareness, and outcomes remain open.' : readiness ? 'The qualified response is moving in parallel. Review the fixed report after time passes.' : support ? 'The response is active. Connect the whole pattern while staying close and calm.' : 'Begin with shared ownership and reassuring presence. You can pause or leave this practice at any time.'}</p>
      <div className="crisis-drug__actions">
        {readiness && !reassessment && <Button className="crisis-drug__action" aria-disabled={demonstrating} onClick={act ? () => act('review-obstetrics-high-neuraxial-block-fixed-four-minute-qualified-support-report') : undefined}>Review the fixed 4-minute report</Button>}
        {reassessment && !handoff && <Button className="crisis-drug__action" aria-disabled={demonstrating} onClick={act ? () => act('handoff-obstetrics-high-neuraxial-block-airway-circulation-block-fetal-birth-awareness-support-and-outcome-risk') : undefined}>Hand off active block risk</Button>}
      </div>
    </section>
  </>;
}
