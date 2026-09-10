/**
 * VentilatorDyssynchronyTray, moved out of `ActionCockpit.tsx` unchanged.
 *
 * The cockpit defined this tray inline and rendered it behind a `hasVentilatorDyssynchronyResponse` gate
 * computed from the scenario, so every specialty downloaded it. That gate is now this tray's
 * `supports` predicate in `trays.ts`; the body below is the original.
 */
import type { EquipmentSnapshot } from '@platform/kernel/protocol';
import { dyssynchronyInlinePrompt } from './tutor/dyssynchrony-guidance';
import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import { TutorPanel, WatchingNotice } from '@anesthesia/ui/tutor-panel';
import { Badge, Button } from '@platform/ui';

export function VentilatorDyssynchronyTray({ assessment, scenarioVersion, guidance = 'unassisted', demonstrating = false, onAction }: {
  assessment?: NonNullable<EquipmentSnapshot['resuscitation']['ventilatorDyssynchronyAssessment']>;
  scenarioVersion: string;
  guidance?: GuidanceLevel;
  demonstrating?: boolean;
  onAction: (action: string) => void;
}) {
  const graphics = assessment?.graphicsAtTick != null;
  const drivers = assessment?.driversAtTick != null;
  const classification = assessment?.classificationAtTick != null;
  const correction = assessment?.correctionAtTick != null;
  const reassessment = assessment?.reassessmentAtTick != null;
  const prompt = demonstrating ? null
    : dyssynchronyInlinePrompt(guidance, { scenarioVersion, patient: assessment });
  const act = demonstrating ? undefined : onAction;
  return (
    <div style={{ display: 'grid', gap: 'var(--space-4)' }}>
      <WatchingNotice demonstrating={demonstrating} />
      <TutorPanel prompt={prompt} />
      <div className="tray-grid">
      <section className="syringe" aria-labelledby="dyssynchrony-read-title">
        <div id="dyssynchrony-read-title" className="syringe__name">Read the person and the breath.</div>
        <Badge kind="teaching">effort · pressure · flow · volume</Badge>
        <div className="syringe__meta">8/20 double triggers · 420 mL set · 760 mL stacked</div>
        <p className="syringe__remaining" role="status">
          {classification ? 'Flow starvation + premature cycling · bounded pattern'
            : drivers ? 'Drivers reviewed · classify the interaction'
              : graphics ? 'Pattern seen · look for the reason' : 'Patient + graphics review pending'}
        </p>
        <div className="syringe__presets">
          <Button className="crisis-drug__action" disabled={graphics}
            aria-disabled={demonstrating} onClick={act ? () => act('review-dyssynchrony-patient-and-graphics') : undefined}>Read patient + pressure + flow + volume</Button>
          <Button className="crisis-drug__action" disabled={!graphics || drivers}
            aria-disabled={demonstrating} onClick={act ? () => act('review-dyssynchrony-drivers') : undefined}>Review pain + drive + airway + mechanics</Button>
          <Button className="crisis-drug__action" disabled={!drivers || classification}
            aria-disabled={demonstrating} onClick={act ? () => act('classify-dyssynchrony-pattern') : undefined}>Classify the bounded pattern</Button>
        </div>
        <p className="field__hint">Irregularity is a clue, not a diagnosis. Name the phase and mechanism only after you read the patient.</p>
      </section>
      <section className="syringe" aria-labelledby="dyssynchrony-match-title">
        <div id="dyssynchrony-match-title" className="syringe__name">Match support. Keep protection.</div>
        <Badge kind="teaching">cause first · flow · cycle · volume</Badge>
        <div className="syringe__meta">analgesia first · PBW volume · plateau guardrail · RT review</div>
        <p className="syringe__remaining" role="status">
          {reassessment ? '10 min · 1/20 double trigger · 420–450 mL · plateau 22'
            : correction ? 'Correction recorded · response due'
              : classification ? 'Match demand without surrendering protection' : 'Classification pending'}
        </p>
        <div className="syringe__presets">
          <Button className="crisis-drug__action" disabled={!classification || correction}
            aria-disabled={demonstrating} onClick={act ? () => act('record-dyssynchrony-correction-intent') : undefined}>Analgesia first + match flow and cycle</Button>
          <Button className="crisis-drug__action" disabled={!correction || reassessment}
            aria-disabled={demonstrating} onClick={act ? () => act('reassess-dyssynchrony-response') : undefined}>Review 10-minute response</Button>
        </div>
        <p className="field__hint">A quieter waveform is not enough. Recheck comfort, effort, delivered volume, pressure, gas, and circulation.</p>
      </section>
      </div>
    </div>
  );
}
