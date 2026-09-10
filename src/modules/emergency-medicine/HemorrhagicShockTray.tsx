import type { EquipmentSnapshot } from '@platform/kernel/protocol';
import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import { TutorPanel, WatchingNotice } from '@anesthesia/ui/tutor-panel';
import { hemorrhagicShockInlinePrompt } from '../emergency-medicine/tutor/hemorrhagic-shock-guidance';
import { Badge, Button } from '@platform/ui';

export function HemorrhagicShockTray({ assessment, scenarioVersion, guidance = 'unassisted', demonstrating = false, onAction }: {
  assessment?: NonNullable<EquipmentSnapshot['resuscitation']['hemorrhagicShockAssessment']>;
  scenarioVersion: string;
  guidance?: GuidanceLevel;
  demonstrating?: boolean;
  onAction: (action: string) => void;
}) {
  const recognized = assessment?.mechanismAndPerfusionReviewedAtTick != null;
  const stabilized = assessment?.pelvicStabilizationAtTick != null;
  const activated = assessment?.majorHemorrhageActivatedAtTick != null;
  const redCells = assessment?.redCellsAtTick != null;
  const monitoring = assessment?.coagulationAndTemperatureAtTick != null;
  const reassessed = assessment?.reassessedAtTick != null;
  const definitiveControl = assessment?.definitiveControlEscalatedAtTick != null;
  const prompt = demonstrating ? null : hemorrhagicShockInlinePrompt(guidance, { scenarioVersion, patient: assessment });
  const act = demonstrating ? undefined : onAction;
  return (
    <div style={{ display: 'grid', gap: 'var(--space-4)' }}>
      <TutorPanel prompt={prompt} />
      <WatchingNotice demonstrating={demonstrating} />
      <div className="tray-grid">
      <section className="syringe" aria-labelledby="trauma-control-title">
        <div id="trauma-control-title" className="syringe__name">Recognize and control</div>
        <Badge kind="teaching">Fixed ED vignette</Badge>
        <div className="syringe__meta">Mechanism · pelvis · perfusion · immediate control</div>
        <p className="syringe__remaining" role="status">
          {definitiveControl ? 'Definitive bleeding-control escalation recorded'
            : stabilized ? 'Pelvic stabilization recorded · escalate without delay'
              : recognized ? 'Concealed traumatic hemorrhage recognized'
                : 'Mechanism, injury pattern, and perfusion review pending'}
        </p>
        <div className="syringe__presets">
          <Button className="crisis-drug__action" aria-disabled={demonstrating} disabled={recognized}
            onClick={act ? () => act('review-mechanism-and-perfusion') : undefined}>
            Review mechanism + perfusion
          </Button>
          <Button className="crisis-drug__action" aria-disabled={demonstrating} disabled={!recognized || stabilized}
            onClick={act ? () => act('record-pelvic-stabilization') : undefined}>
            Record pelvic stabilization
          </Button>
          <Button className="crisis-drug__action" aria-disabled={demonstrating} disabled={!stabilized || definitiveControl}
            onClick={act ? () => act('escalate-definitive-bleeding-control') : undefined}>
            Escalate definitive bleeding control
          </Button>
        </div>
        <p className="field__hint">These controls record intent. They do not place a device, choose a procedure, stop bleeding, or predict outcome.</p>
      </section>
      <section className="syringe" aria-labelledby="trauma-resuscitation-title">
        <div id="trauma-resuscitation-title" className="syringe__name">Resuscitate and reassess</div>
        <div className="syringe__meta">Major hemorrhage · 2 red-cell units · coagulation · temperature</div>
        <p className="syringe__remaining" role="status">
          {reassessed ? 'Serial perfusion reassessment recorded'
            : redCells && monitoring ? 'Bridge + monitoring complete · reassess next'
              : activated ? 'Major-hemorrhage response active · parallel tasks open'
                : 'Bounded resuscitation bridge pending'}
        </p>
        <div className="syringe__presets">
          <Button className="crisis-drug__action" aria-disabled={demonstrating} disabled={!recognized || activated}
            onClick={act ? () => act('activate-major-hemorrhage') : undefined}>
            Activate major-hemorrhage response
          </Button>
          <Button className="crisis-drug__action" aria-disabled={demonstrating} disabled={!activated || redCells}
            onClick={act ? () => act('give-two-red-cell-units') : undefined}>
            Give fixed 2-unit red-cell bridge
          </Button>
          <Button className="crisis-drug__action" aria-disabled={demonstrating} disabled={!activated || monitoring}
            onClick={act ? () => act('review-coagulation-and-temperature') : undefined}>
            Review coagulation + temperature
          </Button>
          <Button className="crisis-drug__action" aria-disabled={demonstrating} disabled={!redCells || !monitoring || reassessed}
            onClick={act ? () => act('reassess-perfusion') : undefined}>
            Reassess perfusion
          </Button>
        </div>
        <p className="field__hint">No TXA, calcium, component ratio, procedure, local protocol, repeat transfusion, or outcome is offered.</p>
      </section>
      </div>
    </div>
  );
}
