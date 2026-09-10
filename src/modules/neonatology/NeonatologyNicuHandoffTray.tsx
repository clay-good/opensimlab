import type { EquipmentSnapshot } from '@platform/kernel/protocol';
import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import { TutorPanel } from '@anesthesia/ui/tutor-panel';
import { nicuHandoffInlinePrompt } from '../neonatology/tutor/delivery-room-to-nicu-handoff-guidance';
import { Button } from '@platform/ui';

export function NeonatologyNicuHandoffTray({ assessment, scenarioVersion, onAction, guidance = 'unassisted', demonstrating = false }: {
  assessment?: NonNullable<EquipmentSnapshot['resuscitation']['neonatologyNicuHandoffAssessment']>;
  scenarioVersion: string;
  onAction: (action: string) => void;
  guidance?: GuidanceLevel;
  demonstrating?: boolean;
}) {
  const prompt = nicuHandoffInlinePrompt(guidance, { scenarioVersion, nicuHandoff: assessment });
  const act = demonstrating ? undefined : onAction;
  const support = assessment?.supportAtTick != null;
  const context = assessment?.contextAtTick != null;
  const content = assessment?.contentAtTick != null;
  const readiness = assessment?.readinessAtTick != null;
  const reassessment = assessment?.reassessmentAtTick != null;
  const handoff = assessment?.handoffAtTick != null;
  return <>
    {demonstrating && <p className="syringe__remaining">Watching the worked example. Choose “Take the controls” to make your own decisions.</p>}
    <TutorPanel prompt={demonstrating ? null : prompt} />
    <section className="syringe" aria-labelledby="neonatology-nicu-handoff-now-title">
      <div id="neonatology-nicu-handoff-now-title" className="syringe__name">Transfer the story and the ownership.</div>
      <p className="syringe__remaining">Preserve chronology, response, current state, absent actions, pending data, safety concerns, parent context, named owners, and next steps.</p>
      <div className="crisis-drug__actions">
        {!support && <Button className="crisis-drug__action" aria-disabled={demonstrating} onClick={act ? () => act('activate-delivery-room-nicu-sending-receiving-transport-and-family-handoff-support') : undefined}>Confirm shared ownership</Button>}
        {support && !context && <Button className="crisis-drug__action" aria-disabled={demonstrating} onClick={act ? () => act('reconcile-delivery-room-nicu-gestation-perinatal-birth-resuscitation-current-state-parent-and-whole-dyad') : undefined}>Connect newborn + whole dyad</Button>}
        {context && !content && <Button className="crisis-drug__action" aria-disabled={demonstrating} onClick={act ? () => act('review-delivery-room-nicu-patient-assessment-situation-safety-background-actions-timing-ownership-and-next-step-content') : undefined}>Review the whole story</Button>}
        {content && !readiness && <Button className="crisis-drug__action" aria-disabled={demonstrating} onClick={act ? () => act('review-qualified-delivery-room-nicu-transport-continuity-receiving-readiness-check-back-and-family-boundaries') : undefined}>Review qualified boundaries</Button>}
      </div>
    </section>
    <section className="syringe" aria-labelledby="neonatology-nicu-handoff-later-title">
      <div id="neonatology-nicu-handoff-later-title" className="syringe__name">A check-back closes a loop, not the clinical risk.</div>
      <p className="syringe__remaining" role="status">{handoff ? 'Respiratory, thermal, glucose, neurologic, infection, feeding, family, disposition, and outcome risks handed off.' : reassessment ? 'The supplied receiver confirmation and arrival report preserve active risk. Shared understanding, stability, diagnosis, and outcomes remain open.' : readiness ? 'Qualified continuity, receiver questions, check-back, and family support continue. Review the fixed report after time passes.' : support ? 'Named support is present. Connect the whole newborn and dyad before shaping the story.' : 'Begin with calm shared ownership. You can pause or leave this practice at any time.'}</p>
      <div className="crisis-drug__actions">
        {readiness && !reassessment && <Button className="crisis-drug__action" aria-disabled={demonstrating} onClick={act ? () => act('review-delivery-room-nicu-fixed-receiver-check-back-and-ten-minute-arrival-report') : undefined}>Review receiver confirmation</Button>}
        {reassessment && !handoff && <Button className="crisis-drug__action" aria-disabled={demonstrating} onClick={act ? () => act('handoff-delivery-room-nicu-respiratory-thermal-glucose-neurologic-infection-feeding-family-and-outcome-risk') : undefined}>Hand off active newborn risk</Button>}
      </div>
    </section>
  </>;
}
