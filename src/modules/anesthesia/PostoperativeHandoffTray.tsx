import type { EquipmentSnapshot } from '@platform/kernel/protocol';
import { Badge, Button } from '@platform/ui';

export function PostoperativeHandoffTray({ assessment, onAction }: {
  assessment?: NonNullable<EquipmentSnapshot['resuscitation']['postoperativeHandoffAssessment']>;
  onAction: (action: string) => void;
}) {
  const ready = assessment?.receiverReadyAtTick != null;
  const course = assessment?.patientAndCourseAtTick != null;
  const current = assessment?.currentStateAtTick != null;
  const risks = assessment?.risksActionsOwnershipAtTick != null;
  const readback = assessment?.receiverReadbackAtTick != null;
  const accepted = assessment?.transferAcceptedAtTick != null;
  return (
    <div className="tray-grid">
      <section className="syringe" aria-labelledby="handoff-content-title">
        <div id="handoff-content-title" className="syringe__name">Create shared attention</div>
        <Badge kind="teaching">Focused vignette</Badge>
        <div className="syringe__meta">Ready · course · current state</div>
        <p className="syringe__remaining" role="status">
          {!ready ? 'Receiver and monitoring readiness pending'
            : !course || !current ? 'Receiver ready · critical content incomplete'
              : 'Patient, perioperative course, and current state shared'}
        </p>
        <div className="syringe__presets">
          <Button className="crisis-drug__action" disabled={ready}
            onClick={() => onAction('confirm-receiver-readiness')}>Confirm receiver readiness</Button>
          <Button className="crisis-drug__action" disabled={!ready || course}
            onClick={() => onAction('share-patient-and-course')}>Share patient + course</Button>
          <Button className="crisis-drug__action" disabled={!ready || current}
            onClick={() => onAction('share-current-state')}>Share current state</Button>
        </div>
        <p className="field__hint">The content blocks are fixed. Voice, interruptions, nonverbal behavior, workload, and bedside examination are not scored.</p>
      </section>
      <section className="syringe" aria-labelledby="handoff-closure-title">
        <div id="handoff-closure-title" className="syringe__name">Close the loop</div>
        <div className="syringe__meta">Risk · timing · ownership · synthesis</div>
        <p className="syringe__remaining" role="status">
          {accepted ? 'Transfer acknowledged + accepted'
            : readback ? 'Receiver synthesis recorded · acceptance pending'
              : risks ? 'Risks, actions, timing, and ownership shared'
                : 'Unresolved-risk ownership pending core content'}
        </p>
        <div className="syringe__presets">
          <Button className="crisis-drug__action" disabled={!course || !current || risks}
            onClick={() => onAction('share-risks-actions-ownership')}>Share risks + ownership</Button>
          <Button className="crisis-drug__action" disabled={!risks || readback}
            onClick={() => onAction('receiver-readback')}>Record receiver synthesis</Button>
          <Button className="crisis-drug__action" disabled={!readback || accepted}
            onClick={() => onAction('accept-transfer')}>Acknowledge + accept transfer</Button>
        </div>
        <p className="field__hint">Responsibility changes only after explicit acknowledgment here. This is a teaching-state transition, not a real clinical transfer.</p>
      </section>
    </div>
  );
}
