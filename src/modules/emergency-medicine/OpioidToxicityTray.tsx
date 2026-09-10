/**
 * OpioidToxicityTray, moved out of `ActionCockpit.tsx` unchanged.
 *
 * The cockpit defined this tray inline and rendered it behind a `hasOpioidToxicityResponse` gate
 * computed from the scenario, so every specialty downloaded it. That gate is now this tray's
 * `supports` predicate in `trays.ts`; the body below is the original.
 */
import type { EquipmentSnapshot } from '@platform/kernel/protocol';
import { opioidToxicityInlinePrompt } from './tutor/opioid-toxicity-guidance';
import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import { TutorPanel, WatchingNotice } from '@anesthesia/ui/tutor-panel';
import { Badge, Button } from '@platform/ui';

export function OpioidToxicityTray({ assessment, scenarioVersion, guidance = 'unassisted', demonstrating = false, onAction }: {
  assessment?: NonNullable<EquipmentSnapshot['resuscitation']['opioidToxicityAssessment']>;
  scenarioVersion: string;
  guidance?: GuidanceLevel;
  demonstrating?: boolean;
  onAction: (action: string) => void;
}) {
  const reviewed = assessment?.patternReviewedAtTick != null;
  const ventilated = assessment?.ventilationAtTick != null;
  const antagonist = assessment?.antagonistAtTick != null;
  const initial = assessment?.initialReassessmentAtTick != null;
  const recurrence = assessment?.recurrenceReviewedAtTick != null;
  const plan = assessment?.recurrencePlanAtTick != null;
  const prompt = demonstrating ? null
    : opioidToxicityInlinePrompt(guidance, { scenarioVersion, patient: assessment });
  const act = demonstrating ? undefined : onAction;
  return (
    <div style={{ display: 'grid', gap: 'var(--space-4)' }}>
      <WatchingNotice demonstrating={demonstrating} />
      <TutorPanel prompt={prompt} />
      <div className="tray-grid">
      <section className="syringe" aria-labelledby="opioid-breathe-title">
        <div id="opioid-breathe-title" className="syringe__name">Breathe first. Antidote without delay.</div>
        <Badge kind="teaching">Pulse 58 · RR 4 · SpO₂ 78% · ETCO₂ 68</Badge>
        <div className="syringe__meta">Unresponsive · pinpoint pupils · glucose 102 · no arrest</div>
        <p className="syringe__remaining" role="status">
          {initial ? 'RR 14 · SpO₂ 97% · ETCO₂ 43 · responds to voice'
            : antagonist ? 'Ventilation continues · initial response next'
              : ventilated ? 'Breathing supported · naloxone intent next'
                : reviewed ? 'Respiratory emergency recognized · ventilate now'
                  : 'Pulse + breathing + oxygenation + mimics review pending'}
        </p>
        <div className="syringe__presets">
          <Button className="crisis-drug__action" disabled={reviewed}
            aria-disabled={demonstrating} onClick={act ? () => act('review-opioid-toxicity-pattern') : undefined}>Review pulse + breathing + pattern</Button>
          <Button className="crisis-drug__action" disabled={!reviewed || ventilated}
            aria-disabled={demonstrating} onClick={act ? () => act('record-opioid-ventilation-support') : undefined}>Open airway + oxygen + ventilate</Button>
          <Button className="crisis-drug__action" disabled={!ventilated || antagonist}
            aria-disabled={demonstrating} onClick={act ? () => act('record-opioid-naloxone-intent') : undefined}>Record naloxone toward breathing</Button>
          <Button className="crisis-drug__action" disabled={!antagonist || initial}
            aria-disabled={demonstrating} onClick={act ? () => act('reassess-opioid-initial-response') : undefined}>Recheck breathing + CO₂ + pulse</Button>
        </div>
        <p className="field__hint">Ventilation does not wait for naloxone. Normal spontaneous breathing and airway reflexes are the endpoint; full arousal is not required.</p>
      </section>
      <section className="syringe" aria-labelledby="opioid-recurrence-title">
        <div id="opioid-recurrence-title" className="syringe__name">The opioid can outlast the antidote.</div>
        <div className="syringe__meta">Observe · detect recurrence · rescue again · leave safer</div>
        <p className="syringe__remaining" role="status">
          {plan ? 'Renewed rescue + observation + discharge safety handed off'
            : recurrence ? 'RR 7 · SpO₂ 90% · ETCO₂ 58 · respiratory depression is back'
              : initial ? 'Initial response is not the finish line · advance observation'
                : 'Initial breathing response pending'}
        </p>
        <div className="syringe__presets">
          <Button className="crisis-drug__action" disabled={!initial || recurrence}
            aria-disabled={demonstrating} onClick={act ? () => act('review-opioid-recurrence') : undefined}>Review 25-minute recurrence</Button>
          <Button className="crisis-drug__action" disabled={!recurrence || plan}
            aria-disabled={demonstrating} onClick={act ? () => act('record-opioid-recurrence-and-safety-plan') : undefined}>Ventilate again + repeat + observe</Button>
        </div>
        <p className="field__hint">Keep co-exposures and complications open. Eventual discharge requires low recurrence risk, normal consciousness and vital signs, antagonist access with instruction, and treatment linkage.</p>
      </section>
      </div>
    </div>
  );
}
