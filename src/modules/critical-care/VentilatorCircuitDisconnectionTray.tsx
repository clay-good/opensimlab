/**
 * VentilatorCircuitDisconnectionTray, moved out of `ActionCockpit.tsx` unchanged.
 *
 * The cockpit defined this tray inline and rendered it behind a `hasVentilatorCircuitDisconnectionResponse` gate
 * computed from the scenario, so every specialty downloaded it. That gate is now this tray's
 * `supports` predicate in `trays.ts`; the body below is the original.
 */
import type { EquipmentSnapshot } from '@platform/kernel/protocol';
import { circuitDisconnectionInlinePrompt } from './tutor/circuit-disconnection-guidance';
import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import { TutorPanel, WatchingNotice } from '@anesthesia/ui/tutor-panel';
import { Badge, Button } from '@platform/ui';

export function VentilatorCircuitDisconnectionTray({ assessment, scenarioVersion, guidance = 'unassisted', demonstrating = false, onAction }: {
  assessment?: NonNullable<EquipmentSnapshot['resuscitation']['ventilatorCircuitDisconnectionAssessment']>;
  scenarioVersion: string;
  guidance?: GuidanceLevel;
  demonstrating?: boolean;
  onAction: (action: string) => void;
}) {
  const recognized = assessment?.recognizedAtTick != null;
  const bridged = assessment?.bridgedAtTick != null;
  const inspected = assessment?.inspectedAtTick != null;
  const restored = assessment?.restoredAtTick != null;
  const reassessed = assessment?.reassessedAtTick != null;
  const prompt = demonstrating ? null
    : circuitDisconnectionInlinePrompt(guidance, { scenarioVersion, patient: assessment });
  const act = demonstrating ? undefined : onAction;
  return (
    <div style={{ display: 'grid', gap: 'var(--space-4)' }}>
      <WatchingNotice demonstrating={demonstrating} />
      <TutorPanel prompt={prompt} />
      <div className="tray-grid">
      <section className="syringe" aria-labelledby="ventilator-disconnection-breath-title">
        <div id="ventilator-disconnection-breath-title" className="syringe__name">Follow the breath, not the setting.</div>
        <Badge kind="teaching">commanded 420 mL · exhaled 0 · pressure lost</Badge>
        <div className="syringe__meta">capnogram absent · SpO₂ 96→88 · reserve falling</div>
        <p className="syringe__remaining" role="status">
          {inspected ? 'Circuit discontinuity localized · alternatives kept open'
            : bridged ? 'Bridge active · patient-to-source trace due'
              : recognized ? 'Delivered ventilation lost · bridge now'
                : 'Commanded settings ≠ delivered breaths'}
        </p>
        <div className="syringe__presets">
          <Button className="crisis-drug__action" disabled={recognized}
            aria-disabled={demonstrating} onClick={act ? () => act('recognize-ventilator-circuit-disconnection') : undefined}>Recognize loss of delivered ventilation</Button>
          <Button className="crisis-drug__action" disabled={!recognized || bridged}
            aria-disabled={demonstrating} onClick={act ? () => act('bridge-ventilator-circuit-disconnection') : undefined}>Call help + bridge oxygenation</Button>
          <Button className="crisis-drug__action" disabled={!bridged || inspected}
            aria-disabled={demonstrating} onClick={act ? () => act('inspect-ventilator-circuit-disconnection') : undefined}>Trace patient → airway → circuit → source</Button>
        </div>
        <p className="field__hint">The alarm earns attention. Independent patient and delivery signals establish the problem.</p>
      </section>
      <section className="syringe" aria-labelledby="ventilator-disconnection-proof-title">
        <div id="ventilator-disconnection-proof-title" className="syringe__name">Bridge first. Then reconnect. Then prove.</div>
        <Badge kind="teaching">oxygenate · inspect · restore · verify</Badge>
        <div className="syringe__meta">exhaled volume · pressure · capnogram · pleth · patient</div>
        <p className="syringe__remaining" role="status">
          {reassessed ? 'Proved · VTe 410 · EtCO₂ 36 · SpO₂ 94'
            : restored ? 'Continuity restored · whole-system proof due'
              : 'Restoration follows bridge + source-to-patient trace'}
        </p>
        <div className="syringe__presets">
          <Button className="crisis-drug__action" disabled={!inspected || restored}
            aria-disabled={demonstrating} onClick={act ? () => act('restore-ventilator-circuit-support') : undefined}>Restore continuity + established support</Button>
          <Button className="crisis-drug__action" disabled={!restored || reassessed}
            aria-disabled={demonstrating} onClick={act ? () => act('reassess-ventilator-circuit-response') : undefined}>Prove delivered breaths + patient response</Button>
        </div>
        <p className="field__hint">These controls record authored intent. They do not handle equipment, ventilate, or predict a person’s oxygen reserve.</p>
      </section>
      </div>
    </div>
  );
}
