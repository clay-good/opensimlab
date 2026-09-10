/**
 * IntracranialHemorrhageTray, moved out of `ActionCockpit.tsx` unchanged.
 *
 * The cockpit defined this tray inline and rendered it behind a `hasIntracranialHemorrhageResponse` gate
 * computed from the scenario, so every specialty downloaded it. That gate is now this tray's
 * `supports` predicate in `trays.ts`; the body below is the original.
 */
import type { EquipmentSnapshot } from '@platform/kernel/protocol';
import { intracranialHemorrhageInlinePrompt } from './tutor/intracranial-hemorrhage-deterioration-guidance';
import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import { TutorPanel, WatchingNotice } from '@anesthesia/ui/tutor-panel';
import { Badge, Button } from '@platform/ui';

export function IntracranialHemorrhageTray({ assessment, scenarioVersion, guidance = 'unassisted', demonstrating = false, onAction }: {
  assessment?: NonNullable<EquipmentSnapshot['resuscitation']['intracranialHemorrhageAssessment']>;
  scenarioVersion: string;
  guidance?: GuidanceLevel;
  demonstrating?: boolean;
  onAction: (action: string) => void;
}) {
  const reviewed = assessment?.deteriorationReviewedAtTick != null;
  const activated = assessment?.pathwayActivatedAtTick != null;
  const findings = assessment?.findingsReviewedAtTick != null;
  const reversal = assessment?.reversalAtTick != null;
  const pressure = assessment?.pressureControlAtTick != null;
  const escalated = assessment?.escalatedAtTick != null;
  const prompt = demonstrating ? null
    : intracranialHemorrhageInlinePrompt(guidance, { scenarioVersion, patient: assessment });
  const act = demonstrating ? undefined : onAction;
  return (
    <div style={{ display: 'grid', gap: 'var(--space-4)' }}>
      <WatchingNotice demonstrating={demonstrating} />
      <TutorPanel prompt={prompt} />
      <div className="tray-grid">
      <section className="syringe" aria-labelledby="ich-deterioration-title">
        <div id="ich-deterioration-title" className="syringe__name">Notice the change. Protect the next minute.</div>
        <Badge kind="teaching">Worsening alertness · airway watch</Badge>
        <div className="syringe__meta">15-minute decline · BP 202/112 · glucose 126</div>
        <p className="syringe__remaining" role="status">
          {findings ? '28 mL thalamic ICH · IVH · early hydrocephalus · INR 3.2'
            : activated ? 'ICH pathway active · fixed findings ready'
              : reviewed ? 'Deterioration recognized · activate now'
                : 'Serial neurologic + whole-patient review pending'}
        </p>
        <div className="syringe__presets">
          <Button className="crisis-drug__action" disabled={reviewed}
            aria-disabled={demonstrating} onClick={act ? () => act('review-ich-deterioration') : undefined}>Review serial deterioration</Button>
          <Button className="crisis-drug__action" disabled={!reviewed || activated}
            aria-disabled={demonstrating} onClick={act ? () => act('activate-ich-pathway') : undefined}>Activate ICH pathway + support</Button>
          <Button className="crisis-drug__action" disabled={!activated || findings}
            aria-disabled={demonstrating} onClick={act ? () => act('review-ich-findings-and-coagulopathy') : undefined}>Review CT + warfarin + INR</Button>
        </div>
        <p className="field__hint">Airway protection can fail despite adequate oxygenation. The screen does not examine, score consciousness, interpret CT, or operate airway equipment.</p>
      </section>
      <section className="syringe" aria-labelledby="ich-control-title">
        <div id="ich-control-title" className="syringe__name">Reverse the driver. Smooth the pressure.</div>
        <div className="syringe__meta">Stop warfarin · urgent reversal · neurosurgical capability</div>
        <p className="syringe__remaining" role="status">
          {escalated ? 'Neurocritical + neurosurgical handoff active'
            : pressure ? 'Reversal + smooth pressure intents recorded'
              : reversal ? 'Reversal intent recorded · pressure track open'
                : findings ? 'Two urgent treatment tracks ready' : 'Fixed findings review pending'}
        </p>
        <div className="syringe__presets">
          <Button className="crisis-drug__action" disabled={!findings || reversal}
            aria-disabled={demonstrating} onClick={act ? () => act('record-warfarin-reversal-intent') : undefined}>Stop warfarin + record reversal intent</Button>
          <Button className="crisis-drug__action" disabled={!reversal || pressure}
            aria-disabled={demonstrating} onClick={act ? () => act('record-smooth-ich-pressure-control') : undefined}>Record smooth SBP control</Button>
          <Button className="crisis-drug__action" disabled={!pressure || escalated}
            aria-disabled={demonstrating} onClick={act ? () => act('escalate-ich-neurocritical-care') : undefined}>Escalate + hand off serial findings</Button>
        </div>
        <p className="field__hint">No dose, drug delivery, pressure response, hematoma expansion, airway procedure, ventricular drain, evacuation, complication, disposition, or outcome is simulated.</p>
      </section>
      </div>
    </div>
  );
}
