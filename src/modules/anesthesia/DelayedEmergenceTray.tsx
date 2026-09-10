import { Badge, Button } from '@platform/ui';
import { useState } from 'react';

export function DelayedEmergenceTray({ assessment, onAction }: {
  assessment?: {
    readonly supportReviewedAtTick: number | null;
    readonly exposureReviewedAtTick: number | null;
    readonly metabolicReviewedAtTick: number | null;
    readonly neurologicExamAtTick: number | null;
    readonly escalation: 'urgent-neurologic-evaluation' | 'continue-routine-recovery' | null;
    readonly escalatedAtTick: number | null;
  };
  onAction: (action: string) => void;
}) {
  const [pendingEscalation, setPendingEscalation] = useState<
    'urgent-neurologic-evaluation' | 'continue-routine-recovery' | null
  >(null);
  const support = assessment?.supportReviewedAtTick != null;
  const exposure = assessment?.exposureReviewedAtTick != null;
  const metabolic = assessment?.metabolicReviewedAtTick != null;
  const neurologic = assessment?.neurologicExamAtTick != null;
  const escalation = assessment?.escalation ?? null;
  return (
    <div className="tray-grid">
      <section className="syringe" aria-labelledby="delayed-emergence-review-title">
        <div id="delayed-emergence-review-title" className="syringe__name">
          Stabilize, then narrow
        </div>
        <Badge kind="teaching">Focused vignette</Badge>
        <div className="syringe__meta">Support · exposure · reversible categories</div>
        <p className="syringe__remaining" role="status">
          {!support ? 'Immediate support review pending'
            : !exposure ? 'Tube + ventilation established · physiology stable'
              : !metabolic ? 'Agents off · no benzodiazepine · TOF ratio 0.95'
                : 'Glucose 102 · PaCO₂ 41 · sodium 139 · 36.7°C'}
        </p>
        <div className="syringe__presets">
          <Button className="crisis-drug__action" disabled={support}
            onClick={() => onAction('review-support')}>Review immediate support</Button>
          <Button className="crisis-drug__action" disabled={!support || exposure}
            onClick={() => onAction('review-exposure-and-block')}>Reconcile drugs + block</Button>
          <Button className="crisis-drug__action" disabled={!exposure || metabolic}
            onClick={() => onAction('check-metabolic-causes')}>Check reversible causes</Button>
        </div>
        <p className="field__hint">
          The fixed values organize a differential. They do not simulate laboratory testing or
          exclude every real cause of delayed emergence.
        </p>
      </section>
      <section className="syringe" aria-labelledby="delayed-emergence-exam-title">
        <div id="delayed-emergence-exam-title" className="syringe__name">
          Look for what changes urgency
        </div>
        <div className="syringe__meta">Focused examination · escalation</div>
        <p className="syringe__remaining" role="status">
          {escalation === 'urgent-neurologic-evaluation'
            ? 'Urgent neurologic evaluation · airway support continues'
            : escalation === 'continue-routine-recovery'
              ? 'Routine recovery observation recorded'
              : neurologic
                ? 'Left arm localizes · right absent · left gaze preference'
                : 'Focused neurologic examination pending'}
        </p>
        <Button className="crisis-drug__action" disabled={!metabolic || neurologic}
          onClick={() => onAction('perform-focused-neurologic-exam')}>
          Perform focused neurologic exam
        </Button>
        {neurologic && escalation === null && pendingEscalation === null && (
          <div className="syringe__presets">
            <Button className="crisis-drug__action"
              onClick={() => setPendingEscalation('urgent-neurologic-evaluation')}>
              Escalate urgently
            </Button>
            <Button className="crisis-drug__action"
              onClick={() => setPendingEscalation('continue-routine-recovery')}>
              Continue routine recovery
            </Button>
          </div>
        )}
        {pendingEscalation !== null && (
          <div style={{ display: 'grid', gap: 'var(--space-2)' }}>
            <span>{pendingEscalation === 'urgent-neurologic-evaluation'
              ? 'Record urgent neurologic evaluation while support continues?'
              : 'Record routine observation despite the new asymmetry?'}</span>
            <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
              <Button variant="primary" className="crisis-drug__action" onClick={() => {
                onAction(pendingEscalation);
                setPendingEscalation(null);
              }}>Confirm choice</Button>
              <Button variant="ghost" className="crisis-drug__action"
                onClick={() => setPendingEscalation(null)}>Cancel</Button>
            </div>
          </div>
        )}
        <p className="field__hint">
          This screen recognizes a lateralizing pattern. Diagnosis, imaging, treatment, team
          workflow, and outcome remain outside the vignette.
        </p>
      </section>
    </div>
  );
}
