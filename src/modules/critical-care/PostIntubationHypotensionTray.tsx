/**
 * PostIntubationHypotensionTray, moved out of `ActionCockpit.tsx` unchanged.
 *
 * The cockpit defined this tray inline and rendered it behind a `hasPostIntubationHypotensionResponse` gate
 * computed from the scenario, so every specialty downloaded it. That gate is now this tray's
 * `supports` predicate in `trays.ts`; the body below is the original.
 */
import type { EquipmentSnapshot } from '@platform/kernel/protocol';
import { postIntubationHypotensionInlinePrompt } from './tutor/post-intubation-hypotension-guidance';
import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import { TutorPanel, WatchingNotice } from '@anesthesia/ui/tutor-panel';
import { Badge, Button } from '@platform/ui';

export function PostIntubationHypotensionTray({ assessment, scenarioVersion, guidance = 'unassisted', demonstrating = false, onAction }: {
  assessment?: NonNullable<EquipmentSnapshot['resuscitation']['postIntubationHypotensionAssessment']>;
  scenarioVersion: string;
  guidance?: GuidanceLevel;
  demonstrating?: boolean;
  onAction: (action: string) => void;
}) {
  const pressure = assessment?.pressureAtTick != null;
  const danger = assessment?.dangerAtTick != null;
  const mechanism = assessment?.mechanismAtTick != null;
  const support = assessment?.supportAtTick != null;
  const reassessed = assessment?.reassessmentAtTick != null;
  const prompt = demonstrating ? null
    : postIntubationHypotensionInlinePrompt(guidance, { scenarioVersion, patient: assessment });
  const act = demonstrating ? undefined : onAction;
  return (
    <div style={{ display: 'grid', gap: 'var(--space-4)' }}>
      <WatchingNotice demonstrating={demonstrating} />
      <TutorPanel prompt={prompt} />
      <div className="tray-grid">
      <section className="syringe" aria-labelledby="post-intubation-prove-title">
        <div id="post-intubation-prove-title" className="syringe__name">First, prove the pressure.</div>
        <Badge kind="teaching">waveform · pulse · perfusion · trend</Badge>
        <div className="syringe__meta">MAP 46 · HR 120 · refill 5 s · warm · sinus</div>
        <p className="syringe__remaining" role="status">
          {mechanism ? 'Mixed vasodilation + preload sensitivity · alternatives stay open'
            : danger ? 'Immediate danger panel reviewed · classify the shape'
              : pressure ? 'Pressure validated · trace the post-intubation system'
                : 'Validate · support · call experienced help'}
        </p>
        <div className="syringe__presets">
          <Button className="crisis-drug__action" disabled={pressure}
            aria-disabled={demonstrating} onClick={act ? () => act('validate-post-intubation-pressure-and-call-help') : undefined}>Validate pressure + call help</Button>
          <Button className="crisis-drug__action" disabled={!pressure || danger}
            aria-disabled={demonstrating} onClick={act ? () => act('review-post-intubation-danger-pattern') : undefined}>Check airway + lungs + rhythm + bleeding</Button>
          <Button className="crisis-drug__action" disabled={!danger || mechanism}
            aria-disabled={demonstrating} onClick={act ? () => act('classify-post-intubation-hemodynamics') : undefined}>Review dynamic response + classify</Button>
        </div>
        <p className="field__hint">Timing narrows the search; it does not name the cause. Keep preload, tone, pump, obstruction, bleeding, allergy, drugs, and equipment visible.</p>
      </section>
      <section className="syringe" aria-labelledby="post-intubation-support-title">
        <div id="post-intubation-support-title" className="syringe__name">Support now. Keep asking why.</div>
        <Badge kind="teaching">tone · cautious volume · MAP guardrail · reassess</Badge>
        <div className="syringe__meta">norepinephrine intent · 250 mL balanced challenge · MAP near 65</div>
        <p className="syringe__remaining" role="status">
          {reassessed ? 'MAP + perfusion improved · septic-shock work remains open'
            : support ? 'Concurrent bounded support recorded · response due'
              : 'Mechanism review pending'}
        </p>
        <div className="syringe__presets">
          <Button className="crisis-drug__action" disabled={!mechanism || support}
            aria-disabled={demonstrating} onClick={act ? () => act('record-post-intubation-support-intent') : undefined}>Record concurrent bounded support</Button>
          <Button className="crisis-drug__action" disabled={!support || reassessed}
            aria-disabled={demonstrating} onClick={act ? () => act('reassess-post-intubation-hypotension') : undefined}>Review 5-minute whole-patient response</Button>
        </div>
        <p className="field__hint">This is not a universal fluid-versus-vasopressor answer. Dynamic response and repeated lung, gas, pressure, and perfusion checks constrain both.</p>
      </section>
      </div>
    </div>
  );
}
