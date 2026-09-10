/**
 * StemiTray, moved out of `ActionCockpit.tsx` unchanged.
 *
 * The cockpit defined this tray inline and rendered it behind a `hasStemiResponse` gate
 * computed from the scenario, so every specialty downloaded it. That gate is now this tray's
 * `supports` predicate in `trays.ts`; the body below is the original.
 */
import type { EquipmentSnapshot } from '@platform/kernel/protocol';
import { stemiInlinePrompt } from './tutor/stemi-guidance';
import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import { TutorPanel, WatchingNotice } from '@anesthesia/ui/tutor-panel';
import { Badge, Button } from '@platform/ui';

export function StemiTray({ assessment, scenarioVersion, guidance = 'unassisted', demonstrating = false, onAction }: {
  assessment?: NonNullable<EquipmentSnapshot['resuscitation']['stemiAssessment']>;
  scenarioVersion: string;
  guidance?: GuidanceLevel;
  demonstrating?: boolean;
  onAction: (action: string) => void;
}) {
  const reviewed = assessment?.patternReviewedAtTick != null;
  const activated = assessment?.pathwayActivatedAtTick != null;
  const aspirin = assessment?.aspirinAtTick != null;
  const antithrombotics = assessment?.additionalAntithromboticsAtTick != null;
  const reassessed = assessment?.reassessedAtTick != null;
  const prompt = demonstrating ? null
    : stemiInlinePrompt(guidance, { scenarioVersion, patient: assessment });
  const act = demonstrating ? undefined : onAction;
  return (
    <div style={{ display: 'grid', gap: 'var(--space-4)' }}>
      <WatchingNotice demonstrating={demonstrating} />
      <TutorPanel prompt={prompt} />
      <div className="tray-grid">
      <section className="syringe" aria-labelledby="stemi-pattern-title">
        <div id="stemi-pattern-title" className="syringe__name">See the pattern, start the clock</div>
        <Badge kind="teaching">Fixed PCI-capable ED</Badge>
        <div className="syringe__meta">45 min · fixed 12-lead · pressure · perfusion · mimics</div>
        <p className="syringe__remaining" role="status">
          {activated ? 'STEMI pathway + primary PCI intent active'
            : reviewed ? 'Anterior STEMI pattern reviewed · pathway open'
              : 'Time-critical pattern review pending'}
        </p>
        <div className="syringe__presets">
          <Button className="crisis-drug__action" disabled={reviewed}
            aria-disabled={demonstrating} onClick={act ? () => act('review-stemi-pattern') : undefined}>
            Review symptoms + fixed 12-lead
          </Button>
          <Button className="crisis-drug__action" disabled={!reviewed || activated}
            aria-disabled={demonstrating} onClick={act ? () => act('activate-stemi-pathway') : undefined}>
            Activate STEMI pathway + primary PCI
          </Button>
        </div>
        <p className="field__hint">The diagnostic 12-lead and PCI-capable setting are authored. The bedside lead-II monitor is not a live 12-lead interpreter.</p>
      </section>
      <section className="syringe" aria-labelledby="stemi-treatment-title">
        <div id="stemi-treatment-title" className="syringe__name">Protect the pathway, then hand off clearly</div>
        <div className="syringe__meta">Aspirin · P2Y12 · anticoagulation · serial complications</div>
        <p className="syringe__remaining" role="status">
          {reassessed ? 'Reassessed + reperfusion handoff recorded · BP 146/92'
            : activated && aspirin && antithrombotics ? 'Immediate sequence complete · reassess now'
              : 'Parallel pathway preparation pending'}
        </p>
        <div className="syringe__presets">
          <Button className="crisis-drug__action" disabled={!reviewed || aspirin}
            aria-disabled={demonstrating} onClick={act ? () => act('record-aspirin-load') : undefined}>
            Record aspirin load · 162–325 mg
          </Button>
          <Button className="crisis-drug__action" disabled={!reviewed || antithrombotics}
            aria-disabled={demonstrating} onClick={act ? () => act('record-p2y12-anticoagulation-intent') : undefined}>
            Record P2Y12 + anticoagulation intent
          </Button>
          <Button className="crisis-drug__action"
            disabled={!activated || !aspirin || !antithrombotics || reassessed}
            aria-disabled={demonstrating} onClick={act ? () => act('reassess-and-handoff') : undefined}>
            Reassess + hand off for reperfusion
          </Button>
        </div>
        <p className="field__hint">SpO₂ is 95%, so routine oxygen is not selected. No agent selection, individualized dose, nitrate or opioid pathway, PCI technique, complication treatment, disposition, or outcome is offered.</p>
      </section>
      </div>
    </div>
  );
}
