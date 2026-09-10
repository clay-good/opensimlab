/**
 * ClinicStemiTray, moved out of `ActionCockpit.tsx` unchanged.
 *
 * The cockpit defined this tray inline and rendered it behind a `hasClinicStemiResponse` gate
 * computed from the scenario, so every specialty downloaded it. That gate is now this tray's
 * `supports` predicate in `trays.ts`; the body below is the original.
 */
import type { EquipmentSnapshot } from '@platform/kernel/protocol';
import { clinicStemiInlinePrompt } from './tutor/clinic-stemi-guidance';
import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import { TutorPanel, WatchingNotice } from '@anesthesia/ui/tutor-panel';
import { Badge, Button } from '@platform/ui';

export function ClinicStemiTray({ assessment, scenarioVersion, guidance = 'unassisted', demonstrating = false, onAction }: {
  assessment?: NonNullable<EquipmentSnapshot['resuscitation']['clinicStemiAssessment']>;
  scenarioVersion: string;
  guidance?: GuidanceLevel;
  demonstrating?: boolean;
  onAction: (action: string) => void;
}) {
  const pattern = assessment?.patternAtTick != null;
  const danger = assessment?.dangerAtTick != null;
  const transfer = assessment?.transferAtTick != null;
  const bridge = assessment?.bridgeAtTick != null;
  const handoff = assessment?.handoffAtTick != null;
  const prompt = demonstrating ? null
    : clinicStemiInlinePrompt(guidance, { scenarioVersion, patient: assessment });
  const act = demonstrating ? undefined : onAction;
  return (
    <div style={{ display: 'grid', gap: 'var(--space-4)' }}>
    <WatchingNotice demonstrating={demonstrating} />
    <TutorPanel prompt={prompt} />
    <div className="tray-grid">
      <section className="syringe" aria-labelledby="clinic-stemi-pattern-title">
        <div id="clinic-stemi-pattern-title" className="syringe__name">Recognize, then open the route.</div>
        <Badge kind="teaching">non-PCI clinic · authored diagnostic 12-lead</Badge>
        <div className="syringe__meta">22 min ongoing · BP 128/76 · SpO₂ 96% room air</div>
        <p className="syringe__remaining" role="status">
          {transfer && danger ? 'EMS + regional system active · authored danger screen reviewed'
            : transfer ? 'EMS + regional system active · screen danger in parallel'
              : danger ? 'Danger screen complete · activate EMS now'
                : pattern ? 'Pattern reconciled · activation and danger review are parallel'
                  : 'The teaching monitor is not a diagnostic 12-lead.'}
        </p>
        <div className="syringe__presets">
          <Button className="crisis-drug__action" disabled={pattern}
            aria-disabled={demonstrating} onClick={act ? () => act('reconcile-clinic-stemi-pattern') : undefined}>Reconcile symptoms + fixed ECG</Button>
          <Button className="crisis-drug__action" disabled={!pattern || transfer}
            aria-disabled={demonstrating} onClick={act ? () => act('activate-clinic-stemi-transfer') : undefined}>Activate EMS + regional STEMI system</Button>
          <Button className="crisis-drug__action" disabled={!pattern || danger}
            aria-disabled={demonstrating} onClick={act ? () => act('screen-clinic-stemi-danger') : undefined}>Screen danger in parallel</Button>
        </div>
        <p className="field__hint">Activate EMS now. Do not use private transport or delay for biomarkers, checklist completion, or paperwork.</p>
      </section>
      <section className="syringe" aria-labelledby="clinic-stemi-bridge-title">
        <div id="clinic-stemi-bridge-title" className="syringe__name">Keep the bridge simple and observable.</div>
        <Badge kind="teaching">aspirin suitability · monitor · transport · handoff</Badge>
        <div className="syringe__meta">regional system selects destination + reperfusion pathway</div>
        <p className="syringe__remaining" role="status">
          {handoff ? 'Reassessed + handed off · downstream care remains open'
            : bridge ? 'Clinic bridge recorded · reassess and hand off'
              : transfer && danger ? 'Activation + danger screen complete · bridge is ready'
                : 'Activation and danger review come first.'}
        </p>
        <div className="syringe__presets">
          <Button className="crisis-drug__action" disabled={!transfer || !danger || bridge}
            aria-disabled={demonstrating} onClick={act ? () => act('record-clinic-stemi-bridge') : undefined}>Record aspirin + monitored-transport intent</Button>
          <Button className="crisis-drug__action" disabled={!bridge || handoff}
            aria-disabled={demonstrating} onClick={act ? () => act('reassess-clinic-stemi-handoff') : undefined}>Reassess + hand off the trajectory</Button>
        </div>
        <p className="field__hint">No routine oxygen at 96%. P2Y12, anticoagulation, fibrinolysis, PCI, nitrate, and opioid choices are not controls here.</p>
      </section>
    </div>
    </div>
  );
}
