/**
 * NstemiRiskTray, moved out of `ActionCockpit.tsx` unchanged.
 *
 * The cockpit defined this tray inline and rendered it behind a `hasNstemiRiskResponse` gate
 * computed from the scenario, so every specialty downloaded it. That gate is now this tray's
 * `supports` predicate in `trays.ts`; the body below is the original.
 */
import type { EquipmentSnapshot } from '@platform/kernel/protocol';
import { nstemiRiskInlinePrompt } from './tutor/nstemi-risk-guidance';
import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import { TutorPanel, WatchingNotice } from '@anesthesia/ui/tutor-panel';
import { Badge, Button } from '@platform/ui';

export function NstemiRiskTray({ assessment, scenarioVersion, guidance = 'unassisted', demonstrating = false, onAction }: {
  assessment?: NonNullable<EquipmentSnapshot['resuscitation']['nstemiRiskAssessment']>;
  scenarioVersion: string;
  guidance?: GuidanceLevel;
  demonstrating?: boolean;
  onAction: (action: string) => void;
}) {
  const trajectory = assessment?.trajectoryAtTick != null;
  const verification = assessment?.verificationAtTick != null;
  const danger = assessment?.veryHighRiskAtTick != null;
  const strategy = assessment?.strategyAtTick != null;
  const handoff = assessment?.handoffAtTick != null;
  const prompt = demonstrating ? null
    : nstemiRiskInlinePrompt(guidance, { scenarioVersion, patient: assessment });
  const act = demonstrating ? undefined : onAction;
  return (
    <div style={{ display: 'grid', gap: 'var(--space-4)' }}>
    <WatchingNotice demonstrating={demonstrating} />
    <TutorPanel prompt={prompt} />
    <div className="tray-grid">
      <section className="syringe" aria-labelledby="nstemi-trajectory-title">
        <div id="nstemi-trajectory-title" className="syringe__name">Risk is a moving picture.</div>
        <Badge kind="teaching">symptoms · serial ECG · serial troponin · current danger</Badge>
        <div className="syringe__meta">18 → 146 ng/L · ST depression → T-wave inversion · pain-free now</div>
        <p className="syringe__remaining" role="status">
          {danger ? 'No current very-high-risk feature · keep re-screening'
            : verification ? 'Authored NSTEMI verified · re-screen danger now'
              : trajectory ? 'Serial change reconciled · preserve injury alternatives'
                : 'One isolated result is not the trajectory'}
        </p>
        <div className="syringe__presets">
          <Button className="crisis-drug__action" disabled={trajectory}
            aria-disabled={demonstrating} onClick={act ? () => act('reconcile-nstemi-serial-trajectory') : undefined}>Reconcile the serial trajectory</Button>
          <Button className="crisis-drug__action" disabled={!trajectory || verification}
            aria-disabled={demonstrating} onClick={act ? () => act('verify-nstemi-and-alternatives') : undefined}>Verify NSTEMI + preserve alternatives</Button>
          <Button className="crisis-drug__action" disabled={!verification || danger}
            aria-disabled={demonstrating} onClick={act ? () => act('screen-nstemi-very-high-risk-features') : undefined}>Re-screen very-high-risk features</Button>
        </div>
        <p className="field__hint">Stable now does not erase high risk. Recurrent pain, instability, heart failure, dangerous rhythm, arrest, mechanical concern, or dynamic ECG change alters urgency.</p>
      </section>
      <section className="syringe" aria-labelledby="nstemi-strategy-title">
        <div id="nstemi-strategy-title" className="syringe__name">Timing follows risk, patient, region, and system.</div>
        <Badge kind="teaching">ischemia · bleeding · kidney · preference · capability</Badge>
        <div className="syringe__meta">High risk · inpatient invasive intent · no universal clock</div>
        <p className="syringe__remaining" role="status">
          {handoff ? 'Strategy + triggers + owner + next reassessment recorded'
            : strategy ? 'Risk-bounded inpatient strategy recorded · ownership due'
              : danger ? 'Current danger screened · review ischemic + bleeding risk'
                : 'Current very-high-risk screen pending'}
        </p>
        <div className="syringe__presets">
          <Button className="crisis-drug__action" disabled={!danger || strategy}
            aria-disabled={demonstrating} onClick={act ? () => act('record-nstemi-invasive-strategy') : undefined}>Record region-bounded invasive intent</Button>
          <Button className="crisis-drug__action" disabled={!strategy || handoff}
            aria-disabled={demonstrating} onClick={act ? () => act('record-nstemi-monitoring-and-handoff') : undefined}>Record triggers + owner + reassessment</Button>
        </div>
        <p className="field__hint">No score, medication, angiography, or procedure is supplied. The applicable local pathway resolves exact timing as risk evolves.</p>
      </section>
    </div>
    </div>
  );
}
