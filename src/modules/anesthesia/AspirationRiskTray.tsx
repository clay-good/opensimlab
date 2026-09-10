import { Badge, Button } from '@platform/ui';
import { useState } from 'react';

export function AspirationRiskTray({
  assessment, onAction,
}: {
  assessment?: {
    readonly cuesReviewedAtTick: number | null;
    readonly classification: 'elevated' | 'routine' | null;
    readonly classifiedAtTick: number | null;
    readonly plan: 'defer-and-replan' | 'proceed-routine' | null;
    readonly planAtTick: number | null;
  };
  onAction: (
    action: 'review-cues' | 'classify-elevated' | 'classify-routine'
      | 'defer-and-replan' | 'proceed-routine',
  ) => void;
}) {
  const [pendingPlan, setPendingPlan] = useState<'defer-and-replan' | 'proceed-routine' | null>(null);
  const reviewed = assessment?.cuesReviewedAtTick !== null
    && assessment?.cuesReviewedAtTick !== undefined;
  const classification = assessment?.classification ?? null;
  const plan = assessment?.plan ?? null;
  return (
    <div className="tray-grid">
      <section className="syringe" aria-labelledby="aspiration-cues-title">
        <div id="aspiration-cues-title" className="syringe__name">Read the whole pattern</div>
        <Badge kind="teaching">Focused vignette</Badge>
        <div className="syringe__meta">Medication phase · symptoms · fasting · urgency</div>
        <p className="syringe__remaining" role="status">
          {reviewed
            ? 'Week 3 escalation · dose increased 3 days ago · nausea + bloating · fasted 10 h/2 h · elective case'
            : 'Combined cue review pending'}
        </p>
        <Button className="crisis-drug__action" disabled={reviewed}
          onClick={() => onAction('review-cues')}>Review aspiration-risk cues</Button>
        <p className="field__hint">
          This case asks whether ordinary fasting instructions settle the question for this patient.
          It does not estimate gastric volume or teach ultrasound.
        </p>
      </section>
      <section className="syringe" aria-labelledby="aspiration-decision-title">
        <div id="aspiration-decision-title" className="syringe__name">Classify, then choose</div>
        <div className="syringe__meta">One classification · one disposition</div>
        <p className="syringe__remaining" role="status">
          {plan === 'defer-and-replan' ? 'Elective deferral + shared replanning recorded'
            : plan === 'proceed-routine' ? 'Routine same-day progression recorded'
              : classification === 'elevated' ? 'Elevated risk classified · disposition pending'
                : classification === 'routine' ? 'Routine fasting risk classified · disposition pending'
                  : 'Classification pending'}
        </p>
        {classification === null && (
          <div className="syringe__presets">
            <Button className="crisis-drug__action" disabled={!reviewed}
              onClick={() => onAction('classify-elevated')}>Elevated delayed-emptying risk</Button>
            <Button className="crisis-drug__action" disabled={!reviewed}
              onClick={() => onAction('classify-routine')}>Routine fasting risk</Button>
          </div>
        )}
        {classification !== null && plan === null && pendingPlan === null && (
          <div className="syringe__presets">
            <Button className="crisis-drug__action"
              onClick={() => setPendingPlan('defer-and-replan')}>Defer elective case</Button>
            <Button className="crisis-drug__action"
              onClick={() => setPendingPlan('proceed-routine')}>Proceed routinely today</Button>
          </div>
        )}
        {pendingPlan !== null && (
          <div style={{ display: 'grid', gap: 'var(--space-2)' }}>
            <span>{pendingPlan === 'defer-and-replan'
              ? 'Record elective deferral and shared replanning?'
              : 'Record routine same-day progression?'}</span>
            <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
              <Button variant="primary" className="crisis-drug__action" onClick={() => {
                onAction(pendingPlan);
                setPendingPlan(null);
              }}>Confirm choice</Button>
              <Button variant="ghost" className="crisis-drug__action"
                onClick={() => setPendingPlan(null)}>Cancel</Button>
            </div>
          </div>
        )}
        <p className="field__hint">
          The patient-specific choice is not a universal GLP-1 medication rule. Shared decision-making,
          future preparation, gastric assessment, and anesthetic technique remain outside this screen.
        </p>
      </section>
    </div>
  );
}
