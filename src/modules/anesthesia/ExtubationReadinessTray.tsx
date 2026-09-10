import { Badge, Button } from '@platform/ui';
import { useState } from 'react';

export function ExtubationReadinessTray({ assessment, onAction }: {
  assessment?: {
    readonly quantitativeRecoveryReviewedAtTick: number | null;
    readonly awakeAirwayReviewedAtTick: number | null;
    readonly gasExchangeReviewedAtTick: number | null;
    readonly airwayPlanReviewedAtTick: number | null;
    readonly decision: 'ready-for-planned-awake-extubation'
      | 'continue-support-and-reassess' | null;
    readonly decidedAtTick: number | null;
  };
  onAction: (action: string) => void;
}) {
  const [pendingDecision, setPendingDecision] = useState<
    'ready-for-planned-awake-extubation' | 'continue-support-and-reassess' | null
  >(null);
  const recovery = assessment?.quantitativeRecoveryReviewedAtTick != null;
  const awakeAirway = assessment?.awakeAirwayReviewedAtTick != null;
  const gasExchange = assessment?.gasExchangeReviewedAtTick != null;
  const airwayPlan = assessment?.airwayPlanReviewedAtTick != null;
  const decision = assessment?.decision ?? null;
  return (
    <div className="tray-grid">
      <section className="syringe" aria-labelledby="extubation-readiness-title">
        <div id="extubation-readiness-title" className="syringe__name">Build the readiness picture</div>
        <Badge kind="teaching">Focused vignette</Badge>
        <div className="syringe__meta">Recovery · awake airway · gas exchange</div>
        <p className="syringe__remaining" role="status">
          {!recovery ? 'Quantitative recovery review pending'
            : !awakeAirway ? 'TOF ratio 0.93 · necessary, not sufficient'
              : !gasExchange ? 'Eyes open · follows commands · strong cough · secretions cleared'
                : 'Spontaneous 14/min · 420 mL · EtCO₂ 39 · SpO₂ 98% on FiO₂ 0.40'}
        </p>
        <div className="syringe__presets">
          <Button className="crisis-drug__action" disabled={recovery}
            onClick={() => onAction('review-quantitative-recovery')}>Review quantitative recovery</Button>
          <Button className="crisis-drug__action" disabled={!recovery || awakeAirway}
            onClick={() => onAction('review-awake-airway-protection')}>Review awake airway</Button>
          <Button className="crisis-drug__action" disabled={!awakeAirway || gasExchange}
            onClick={() => onAction('review-spontaneous-gas-exchange')}>Review gas exchange</Button>
        </div>
        <p className="field__hint">
          These are fixed readiness findings. The screen does not measure consciousness,
          respiratory effort, airway reflexes, or secretion burden.
        </p>
      </section>
      <section className="syringe" aria-labelledby="extubation-plan-title">
        <div id="extubation-plan-title" className="syringe__name">Make removal a plan</div>
        <div className="syringe__meta">Airway risk · rescue · decision</div>
        <p className="syringe__remaining" role="status">
          {decision === 'ready-for-planned-awake-extubation'
            ? 'Ready for planned awake extubation · tube remains in place here'
            : decision === 'continue-support-and-reassess'
              ? 'Continue support + reassess recorded'
              : airwayPlan
                ? 'Low risk · skilled help + oxygen + monitoring + reintubation plan available'
                : 'Airway risk and rescue-plan review pending'}
        </p>
        <Button className="crisis-drug__action" disabled={!gasExchange || airwayPlan}
          onClick={() => onAction('review-airway-risk-and-rescue')}>Review airway risk + rescue</Button>
        {airwayPlan && decision === null && pendingDecision === null && (
          <div className="syringe__presets">
            <Button className="crisis-drug__action"
              onClick={() => setPendingDecision('ready-for-planned-awake-extubation')}>
              Ready for planned awake extubation
            </Button>
            <Button className="crisis-drug__action"
              onClick={() => setPendingDecision('continue-support-and-reassess')}>
              Continue support + reassess
            </Button>
          </div>
        )}
        {pendingDecision !== null && (
          <div style={{ display: 'grid', gap: 'var(--space-2)' }}>
            <span>{pendingDecision === 'ready-for-planned-awake-extubation'
              ? 'Record readiness after all declared checkpoints?'
              : 'Continue support despite all declared low-risk checkpoints?'}</span>
            <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
              <Button variant="primary" className="crisis-drug__action" onClick={() => {
                onAction(pendingDecision);
                setPendingDecision(null);
              }}>Confirm choice</Button>
              <Button variant="ghost" className="crisis-drug__action"
                onClick={() => setPendingDecision(null)}>Cancel</Button>
            </div>
          </div>
        )}
        <p className="field__hint">
          Tube removal, technique, advanced at-risk strategies, reintubation, and post-extubation
          monitoring or outcome remain outside this screen.
        </p>
      </section>
    </div>
  );
}
