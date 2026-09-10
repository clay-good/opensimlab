/**
 * HeatStrokeTray, moved out of `ActionCockpit.tsx` unchanged.
 *
 * The cockpit defined this tray inline and rendered it behind a `hasHeatStrokeResponse` gate
 * computed from the scenario, so every specialty downloaded it. That gate is now this tray's
 * `supports` predicate in `trays.ts`; the body below is the original.
 */
import type { EquipmentSnapshot } from '@platform/kernel/protocol';
import { exertionalHeatStrokeInlinePrompt } from './tutor/exertional-heat-stroke-guidance';
import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import { TutorPanel, WatchingNotice } from '@anesthesia/ui/tutor-panel';
import { Badge, Button } from '@platform/ui';

export function HeatStrokeTray({ assessment, scenarioVersion, guidance = 'unassisted', demonstrating = false, onAction }: {
  assessment?: NonNullable<EquipmentSnapshot['resuscitation']['heatStrokeAssessment']>;
  scenarioVersion: string;
  guidance?: GuidanceLevel;
  demonstrating?: boolean;
  onAction: (action: string) => void;
}) {
  const reviewed = assessment?.patternReviewedAtTick != null;
  const supported = assessment?.supportAtTick != null;
  const cooling = assessment?.coolingAtTick != null;
  const target = assessment?.targetAtTick != null;
  const surveillance = assessment?.surveillanceAtTick != null;
  const prompt = demonstrating ? null
    : exertionalHeatStrokeInlinePrompt(guidance, { scenarioVersion, patient: assessment });
  const act = demonstrating ? undefined : onAction;
  return (
    <div style={{ display: 'grid', gap: 'var(--space-4)' }}>
      <WatchingNotice demonstrating={demonstrating} />
      <TutorPanel prompt={prompt} />
      <div className="tray-grid">
      <section className="syringe" aria-labelledby="heat-cool-title">
        <div id="heat-cool-title" className="syringe__name">Hot brain. Cool now.</div>
        <Badge kind="teaching">Rectal 41.3°C · confused · HR 146</Badge>
        <div className="syringe__meta">Exertion · glucose 110 · sodium 139 · no trauma</div>
        <p className="syringe__remaining" role="status">
          {target ? '14 min · 38.9°C · coherent · stop active cooling'
            : cooling ? 'Whole-body cooling active · watch rectal core'
              : supported ? 'Support ready · immersion now'
                : reviewed ? 'Heat stroke recognized · support while cooling starts'
                  : 'Brain + core + glucose + sodium + mimics review pending'}
        </p>
        <div className="syringe__presets">
          <Button className="crisis-drug__action" disabled={reviewed}
            aria-disabled={demonstrating} onClick={act ? () => act('review-heat-stroke-pattern') : undefined}>Review brain + rectal core + mimics</Button>
          <Button className="crisis-drug__action" disabled={!reviewed || supported}
            aria-disabled={demonstrating} onClick={act ? () => act('record-heat-stroke-support') : undefined}>Support ABCs + strip + prepare</Button>
          <Button className="crisis-drug__action" disabled={!supported || cooling}
            aria-disabled={demonstrating} onClick={act ? () => act('record-cold-water-immersion') : undefined}>Immerse + monitor core + coordinate</Button>
          <Button className="crisis-drug__action" disabled={!cooling || target}
            aria-disabled={demonstrating} onClick={act ? () => act('reassess-heat-stroke-cooling-target') : undefined}>Review cooling target</Button>
        </div>
        <p className="field__hint">Whole-body cold-water immersion is the fastest cooling path. Preserve airway access, monitor rectal core continuously, and organize transport around cooling.</p>
      </section>
      <section className="syringe" aria-labelledby="heat-surveillance-title">
        <div id="heat-surveillance-title" className="syringe__name">Stop the cooling, not the surveillance.</div>
        <div className="syringe__meta">Below 39°C · prevent overshoot · watch delayed injury</div>
        <p className="syringe__remaining" role="status">
          {surveillance ? 'Thermal rescue closed · multiorgan surveillance handed off'
            : target ? 'Temperature target met · organ-injury plan next'
              : 'Cooling target pending'}
        </p>
        <div className="syringe__presets">
          <Button className="crisis-drug__action" disabled={!target || surveillance}
            aria-disabled={demonstrating} onClick={act ? () => act('record-heat-stroke-organ-surveillance') : undefined}>Watch kidney + liver + clotting + muscle</Button>
        </div>
        <p className="field__hint">Temperature recovery does not exclude delayed injury. Antipyretics and dantrolene do not treat heat stroke and are outside this path.</p>
      </section>
      </div>
    </div>
  );
}
