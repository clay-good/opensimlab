/**
 * UnstableBradycardiaTray, moved out of `ActionCockpit.tsx` unchanged.
 *
 * The cockpit defined this tray inline and rendered it behind a `hasUnstableBradycardiaResponse` gate
 * computed from the scenario, so every specialty downloaded it. That gate is now this tray's
 * `supports` predicate in `trays.ts`; the body below is the original.
 */
import type { EquipmentSnapshot } from '@platform/kernel/protocol';
import { unstableBradycardiaInlinePrompt } from './tutor/unstable-bradycardia-guidance';
import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import { TutorPanel, WatchingNotice } from '@anesthesia/ui/tutor-panel';
import { Badge, Button } from '@platform/ui';

export function UnstableBradycardiaTray({ assessment, scenarioVersion, guidance = 'unassisted', demonstrating = false, onAction }: {
  assessment?: NonNullable<EquipmentSnapshot['resuscitation']['unstableBradycardiaAssessment']>;
  scenarioVersion: string;
  guidance?: GuidanceLevel;
  demonstrating?: boolean;
  onAction: (action: string) => void;
}) {
  const reviewed = assessment?.reviewedAtTick != null;
  const supported = assessment?.supportedAtTick != null;
  const atropine = assessment?.atropineAtTick != null;
  const reassessed = assessment?.reassessedAtTick != null;
  const prompt = demonstrating ? null
    : unstableBradycardiaInlinePrompt(guidance, { scenarioVersion, patient: assessment });
  const act = demonstrating ? undefined : onAction;
  return (
    <div style={{ display: 'grid', gap: 'var(--space-4)' }}>
      <WatchingNotice demonstrating={demonstrating} />
      <TutorPanel prompt={prompt} />
      <div className="tray-grid">
      <section className="syringe" aria-labelledby="unstable-bradycardia-recognition-title">
        <div id="unstable-bradycardia-recognition-title" className="syringe__name">Read the rate through the patient</div>
        <Badge kind="teaching">Fixed unstable bradycardia</Badge>
        <div className="syringe__meta">38/min · palpable pulse · BP · brain · chest · perfusion</div>
        <p className="syringe__remaining" role="status">
          {supported ? 'Airway + oxygen + monitors + pulse + access recorded'
            : reviewed ? 'Compromise recognized · support now'
              : 'Rate + whole-patient review pending'}
        </p>
        <div className="syringe__presets">
          <Button className="crisis-drug__action" disabled={reviewed}
            aria-disabled={demonstrating} onClick={act ? () => act('review-bradycardia-and-compromise') : undefined}>
            Review bradycardia + compromise
          </Button>
          <Button className="crisis-drug__action" disabled={!reviewed || supported}
            aria-disabled={demonstrating} onClick={act ? () => act('record-bradycardia-support') : undefined}>
            Record immediate support + access
          </Button>
        </div>
        <p className="field__hint">The fixed rhythm has a pulse. The case authors compromise but does not diagnose its cause.</p>
      </section>
      <section className="syringe" aria-labelledby="unstable-bradycardia-response-title">
        <div id="unstable-bradycardia-response-title" className="syringe__name">Treat, observe, keep looking</div>
        <div className="syringe__meta">Fixed 1 mg IV intent · reversible causes · escalation</div>
        <p className="syringe__remaining" role="status">
          {reassessed ? 'Response reassessed · HR 68 · BP 112/70'
            : atropine ? 'Atropine intent recorded · reassess next'
              : supported ? 'Persistent compromise · atropine intent available' : 'Support pending'}
        </p>
        <div className="syringe__presets">
          <Button className="crisis-drug__action" disabled={!supported || atropine}
            aria-disabled={demonstrating} onClick={act ? () => act('record-atropine-intent') : undefined}>
            Record atropine 1 mg IV intent
          </Button>
          <Button className="crisis-drug__action" disabled={!atropine || reassessed}
            aria-disabled={demonstrating} onClick={act ? () => act('reassess-bradycardia-response') : undefined}>
            Reassess rhythm + whole-patient perfusion
          </Button>
        </div>
        <p className="field__hint">No medication delivery, repeat dose, pacing, capture, adrenergic infusion, definitive cause, procedure, recurrence, disposition, or outcome is offered.</p>
      </section>
      </div>
    </div>
  );
}
