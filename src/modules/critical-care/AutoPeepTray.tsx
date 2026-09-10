/**
 * AutoPeepTray, moved out of `ActionCockpit.tsx` unchanged.
 *
 * The cockpit defined this tray inline and rendered it behind a `hasAutoPeepResponse` gate
 * computed from the scenario, so every specialty downloaded it. That gate is now this tray's
 * `supports` predicate in `trays.ts`; the body below is the original.
 */
import type { EquipmentSnapshot } from '@platform/kernel/protocol';
import { autoPeepInlinePrompt } from './tutor/auto-peep-guidance';
import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import { TutorPanel, WatchingNotice } from '@anesthesia/ui/tutor-panel';
import { Badge, Button } from '@platform/ui';

export function AutoPeepTray({ assessment, scenarioVersion, guidance = 'unassisted', demonstrating = false, onAction }: {
  assessment?: NonNullable<EquipmentSnapshot['resuscitation']['autoPeepAssessment']>;
  scenarioVersion: string;
  guidance?: GuidanceLevel;
  demonstrating?: boolean;
  onAction: (action: string) => void;
}) {
  const flow = assessment?.flowAtTick != null;
  const measurement = assessment?.measurementAtTick != null;
  const classification = assessment?.classificationAtTick != null;
  const correction = assessment?.correctionAtTick != null;
  const reassessment = assessment?.reassessmentAtTick != null;
  const prompt = demonstrating ? null
    : autoPeepInlinePrompt(guidance, { scenarioVersion, patient: assessment });
  const act = demonstrating ? undefined : onAction;
  return (
    <div style={{ display: 'grid', gap: 'var(--space-4)' }}>
      <WatchingNotice demonstrating={demonstrating} />
      <TutorPanel prompt={prompt} />
      <div className="tray-grid">
      <section className="syringe" aria-labelledby="auto-peep-watch-title">
        <div id="auto-peep-watch-title" className="syringe__name">Watch the breath leave.</div>
        <Badge kind="teaching">flow · time · total PEEP · pressure</Badge>
        <div className="syringe__meta">flow never reaches zero · set 5 · total 16 · intrinsic 11</div>
        <p className="syringe__remaining" role="status">
          {classification ? 'Dynamic hyperinflation · bounded obstructive pattern'
            : measurement ? 'Intrinsic PEEP measured · connect the consequences'
              : flow ? 'Incomplete exhalation seen · validate the hold' : 'Whole-patient flow review pending'}
        </p>
        <div className="syringe__presets">
          <Button className="crisis-drug__action" disabled={flow}
            aria-disabled={demonstrating} onClick={act ? () => act('review-auto-peep-patient-and-flow') : undefined}>Review patient + expiratory flow</Button>
          <Button className="crisis-drug__action" disabled={!flow || measurement}
            aria-disabled={demonstrating} onClick={act ? () => act('measure-auto-peep') : undefined}>Review passive expiratory hold</Button>
          <Button className="crisis-drug__action" disabled={!measurement || classification}
            aria-disabled={demonstrating} onClick={act ? () => act('classify-auto-peep-pattern') : undefined}>Classify the bounded pattern</Button>
        </div>
        <p className="field__hint">Flow that misses zero is a clue. Effort, airway closure, and uneven emptying can make one hold value incomplete.</p>
      </section>
      <section className="syringe" aria-labelledby="auto-peep-room-title">
        <div id="auto-peep-room-title" className="syringe__name">Make room for the next breath.</div>
        <Badge kind="teaching">drive · rate · flow · resistance</Badge>
        <div className="syringe__meta">treat obstruction · preserve expiration · keep pressure guardrails</div>
        <p className="syringe__remaining" role="status">
          {reassessment ? '10 min · intrinsic 4 · flow reaches zero · MAP 72'
            : correction ? 'Correction intent recorded · response due'
              : classification ? 'Create time without inventing a universal setting' : 'Classification pending'}
        </p>
        <div className="syringe__presets">
          <Button className="crisis-drug__action" disabled={!classification || correction}
            aria-disabled={demonstrating} onClick={act ? () => act('record-auto-peep-correction-intent') : undefined}>Treat resistance + preserve exhalation</Button>
          <Button className="crisis-drug__action" disabled={!correction || reassessment}
            aria-disabled={demonstrating} onClick={act ? () => act('reassess-auto-peep-response') : undefined}>Review 10-minute response</Button>
        </div>
        <p className="field__hint">External PEEP is individualized. Recheck flow, mechanics, triggering, gas exchange, and circulation after any change.</p>
      </section>
      </div>
    </div>
  );
}
