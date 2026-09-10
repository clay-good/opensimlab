/**
 * DelayedVasopressorDeliveryTray, moved out of `ActionCockpit.tsx` unchanged.
 *
 * The cockpit defined this tray inline and rendered it behind a `hasDelayedVasopressorDeliveryResponse` gate
 * computed from the scenario, so every specialty downloaded it. That gate is now this tray's
 * `supports` predicate in `trays.ts`; the body below is the original.
 */
import type { EquipmentSnapshot } from '@platform/kernel/protocol';
import { delayedVasopressorDeliveryInlinePrompt } from './tutor/delayed-vasopressor-delivery-guidance';
import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import { TutorPanel, WatchingNotice } from '@anesthesia/ui/tutor-panel';
import { Badge, Button } from '@platform/ui';

export function DelayedVasopressorDeliveryTray({ assessment, scenarioVersion, guidance = 'unassisted', demonstrating = false, onAction }: {
  assessment?: NonNullable<EquipmentSnapshot['resuscitation']['delayedVasopressorDeliveryAssessment']>;
  scenarioVersion: string;
  guidance?: GuidanceLevel;
  demonstrating?: boolean;
  onAction: (action: string) => void;
}) {
  const discordance = assessment?.discordanceAtTick != null;
  const path = assessment?.pathAtTick != null;
  const classified = assessment?.classifiedAtTick != null;
  const protocol = assessment?.protocolAtTick != null;
  const reassessed = assessment?.reassessedAtTick != null;
  const prompt = demonstrating ? null
    : delayedVasopressorDeliveryInlinePrompt(guidance, { scenarioVersion, patient: assessment });
  const act = demonstrating ? undefined : onAction;
  return (
    <div style={{ display: 'grid', gap: 'var(--space-4)' }}>
      <WatchingNotice demonstrating={demonstrating} />
      <TutorPanel prompt={prompt} />
      <div className="tray-grid">
      <section className="syringe" aria-labelledby="vasopressor-delivery-truth-title">
        <div id="vasopressor-delivery-truth-title" className="syringe__name">Running is not arriving.</div>
        <Badge kind="teaching">commanded · in transit · delivered · effect</Badge>
        <div className="syringe__meta">RUNNING 6 min · distal 0.6 mL drug-free · MAP 54</div>
        <p className="syringe__remaining" role="status">
          {classified ? 'Delayed delivery classified · alternatives open'
            : path ? 'Source-to-patient path traced · classify the delay'
              : discordance ? 'Command ≠ delivery · trace the whole path'
                : 'Persistent shock · no catheter-tip arrival documented'}
        </p>
        <div className="syringe__presets">
          <Button className="crisis-drug__action" disabled={discordance}
            aria-disabled={demonstrating} onClick={act ? () => act('review-vasopressor-command-delivery-discordance') : undefined}>Separate command from delivery</Button>
          <Button className="crisis-drug__action" disabled={!discordance || path}
            aria-disabled={demonstrating} onClick={act ? () => act('trace-vasopressor-source-to-patient-path') : undefined}>Trace syringe → pump → line → patient</Button>
          <Button className="crisis-drug__action" disabled={!path || classified}
            aria-disabled={demonstrating} onClick={act ? () => act('classify-vasopressor-dead-space-startup-delay') : undefined}>Classify dead-space + startup delay</Button>
        </div>
        <p className="field__hint">A bright RUNNING label describes the pump command, not arrival at the catheter tip.</p>
      </section>
      <section className="syringe" aria-labelledby="vasopressor-delivery-safety-title">
        <div id="vasopressor-delivery-safety-title" className="syringe__name">Move the drug, not the risk.</div>
        <Badge kind="teaching">local protocol · no flush · prove response</Badge>
        <div className="syringe__meta">nursing · pharmacy · critical care · device-specific plan</div>
        <p className="syringe__remaining" role="status">
          {reassessed ? 'Arrived · MAP 67 · shock + durability remain open'
            : protocol ? 'Safe-start plan active · delivery + perfusion proof due'
              : 'No unsupervised purge, flush, or bolus into the patient'}
        </p>
        <div className="syringe__presets">
          <Button className="crisis-drug__action" disabled={!classified || protocol}
            aria-disabled={demonstrating} onClick={act ? () => act('activate-vasopressor-startup-safety-plan') : undefined}>Activate local safe-start protocol</Button>
          <Button className="crisis-drug__action" disabled={!protocol || reassessed}
            aria-disabled={demonstrating} onClick={act ? () => act('reassess-vasopressor-delivery-and-perfusion') : undefined}>Prove delivery + perfusion response</Button>
        </div>
        <p className="field__hint">This records a bounded protocol intent. It never calculates, primes, flushes, programs, or delivers a drug.</p>
      </section>
      </div>
    </div>
  );
}
