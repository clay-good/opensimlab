/**
 * UnstableNarrowTachycardiaTray, moved out of `ActionCockpit.tsx` unchanged.
 *
 * The cockpit defined this tray inline and rendered it behind a `hasUnstableNarrowTachycardiaResponse` gate
 * computed from the scenario, so every specialty downloaded it. That gate is now this tray's
 * `supports` predicate in `trays.ts`; the body below is the original.
 */
import type { EquipmentSnapshot } from '@platform/kernel/protocol';
import { unstableNarrowTachycardiaInlinePrompt } from './tutor/unstable-narrow-complex-tachycardia-guidance';
import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import { TutorPanel, WatchingNotice } from '@anesthesia/ui/tutor-panel';
import { Badge, Button } from '@platform/ui';

export function UnstableNarrowTachycardiaTray({ assessment, scenarioVersion, guidance = 'unassisted', demonstrating = false, onAction }: {
  assessment?: NonNullable<EquipmentSnapshot['resuscitation']['unstableNarrowTachycardiaAssessment']>;
  scenarioVersion: string;
  guidance?: GuidanceLevel;
  demonstrating?: boolean;
  onAction: (action: string) => void;
}) {
  const reviewed = assessment?.reviewedAtTick != null;
  const prepared = assessment?.preparedAtTick != null;
  const cardioverted = assessment?.cardiovertedAtTick != null;
  const reassessed = assessment?.reassessedAtTick != null;
  const prompt = demonstrating ? null
    : unstableNarrowTachycardiaInlinePrompt(guidance, { scenarioVersion, patient: assessment });
  const act = demonstrating ? undefined : onAction;
  return (
    <div style={{ display: 'grid', gap: 'var(--space-4)' }}>
      <WatchingNotice demonstrating={demonstrating} />
      <TutorPanel prompt={prompt} />
      <div className="tray-grid">
      <section className="syringe" aria-labelledby="unstable-nct-recognition-title">
        <div id="unstable-nct-recognition-title" className="syringe__name">Read the rhythm through the patient</div>
        <Badge kind="teaching">Fixed unstable NCT</Badge>
        <div className="syringe__meta">188/min · QRS 0.08 s · BP · brain · chest · perfusion</div>
        <p className="syringe__remaining" role="status">
          {prepared ? 'Immediate support + synchronized pads prepared'
            : reviewed ? 'Instability recognized · prepare now'
              : 'Rhythm + whole-patient review pending'}
        </p>
        <div className="syringe__presets">
          <Button className="crisis-drug__action" disabled={reviewed}
            aria-disabled={demonstrating} onClick={act ? () => act('review-rhythm-and-instability') : undefined}>
            Review rhythm + instability
          </Button>
          <Button className="crisis-drug__action" disabled={!reviewed || prepared}
            aria-disabled={demonstrating} onClick={act ? () => act('prepare-synchronized-cardioversion') : undefined}>
            Prepare support + synchronized pads
          </Button>
        </div>
        <p className="field__hint">The fixed 12-lead supplies width and regularity. The teaching waveform does not diagnose the atrial mechanism.</p>
      </section>
      <section className="syringe" aria-labelledby="unstable-nct-response-title">
        <div id="unstable-nct-response-title" className="syringe__name">Synchronize, restore, reassess</div>
        <div className="syringe__meta">Sedate if feasible · do not delay · rhythm + perfusion</div>
        <p className="syringe__remaining" role="status">
          {reassessed ? 'Response reassessed · HR 92 · BP 118/72'
            : cardioverted ? 'Synchronized-cardioversion intent recorded · reassess next'
              : prepared ? 'Ready for prompt synchronized intent' : 'Preparation pending'}
        </p>
        <div className="syringe__presets">
          <Button className="crisis-drug__action" disabled={!prepared || cardioverted}
            aria-disabled={demonstrating} onClick={act ? () => act('record-synchronized-cardioversion-intent') : undefined}>
            Record synchronized cardioversion intent
          </Button>
          <Button className="crisis-drug__action" disabled={!cardioverted || reassessed}
            aria-disabled={demonstrating} onClick={act ? () => act('reassess-rhythm-and-perfusion') : undefined}>
            Reassess rhythm + whole-patient perfusion
          </Button>
        </div>
        <p className="field__hint">SpO₂ is 94%, so routine oxygen is not selected. No energy, sedation drug, device operation, shock technique, adenosine, refractory pathway, recurrence, disposition, or outcome is offered.</p>
      </section>
      </div>
    </div>
  );
}
