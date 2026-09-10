/**
 * SymptomaticBradycardiaTray, moved out of `ActionCockpit.tsx` unchanged.
 *
 * The cockpit defined this tray inline and rendered it behind a `hasSymptomaticBradycardiaResponse` gate
 * computed from the scenario, so every specialty downloaded it. That gate is now this tray's
 * `supports` predicate in `trays.ts`; the body below is the original.
 */
import type { EquipmentSnapshot } from '@platform/kernel/protocol';
import { symptomaticBradycardiaInlinePrompt } from './tutor/symptomatic-bradycardia-guidance';
import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import { TutorPanel, WatchingNotice } from '@anesthesia/ui/tutor-panel';
import { Badge, Button } from '@platform/ui';

export function SymptomaticBradycardiaTray({ assessment, scenarioVersion, guidance = 'unassisted', demonstrating = false, onAction }: {
  assessment?: NonNullable<EquipmentSnapshot['resuscitation']['symptomaticBradycardiaAssessment']>;
  scenarioVersion: string;
  guidance?: GuidanceLevel;
  demonstrating?: boolean;
  onAction: (action: string) => void;
}) {
  const stability = assessment?.stabilityAtTick != null;
  const context = assessment?.contextAtTick != null;
  const correlation = assessment?.correlationAtTick != null;
  const pacing = assessment?.pacingEvaluationAtTick != null;
  const handoff = assessment?.handoffAtTick != null;
  const prompt = demonstrating ? null
    : symptomaticBradycardiaInlinePrompt(guidance, { scenarioVersion, patient: assessment });
  const act = demonstrating ? undefined : onAction;
  return <div style={{ display: 'grid', gap: 'var(--space-4)' }}>
    <WatchingNotice demonstrating={demonstrating} />
    <TutorPanel prompt={prompt} />
    <div className="tray-grid">
    <section className="syringe" aria-labelledby="symptomatic-bradycardia-first-title">
      <div id="symptomatic-bradycardia-first-title" className="syringe__name">Slow rhythm. Match the symptom.</div>
      <Badge kind="teaching">stable now · symptom-rhythm correlation</Badge>
      <div className="syringe__meta">44/min sinus · BP 134/72 · warm + alert</div>
      <p className="syringe__remaining" role="status">{correlation ? 'Symptoms align with bradycardia · mechanism remains open' : stability ? 'Stable now · connect the episodes to the rhythm' : 'A slow number matters when it explains the patient'}</p>
      <div className="syringe__presets">
        <Button className="crisis-drug__action" disabled={stability} aria-disabled={demonstrating} onClick={act ? () => act('reconcile-symptomatic-bradycardia-stability') : undefined}>Reconcile rate + stability</Button>
        <Button className="crisis-drug__action" disabled={!stability || correlation} aria-disabled={demonstrating} onClick={act ? () => act('correlate-symptomatic-bradycardia-record') : undefined}>Review symptom-rhythm record</Button>
      </div>
      <p className="field__hint">There is no universal heart-rate or pause cutoff for pacing in sinus-node dysfunction. The temporal symptom link carries the decision.</p>
    </section>
    <section className="syringe" aria-labelledby="symptomatic-bradycardia-plan-title">
      <div id="symptomatic-bradycardia-plan-title" className="syringe__name">Review causes. Plan together.</div>
      <Badge kind="teaching">medications · thyroid · sleep · structure · preferences</Badge>
      <div className="syringe__meta">reversible context · goals · pacing evaluation · safety net</div>
      <p className="syringe__remaining" role="status">{handoff ? 'Plan owned · follow-up + acute-change triggers are clear' : pacing ? 'Pacing evaluation recorded · close the ownership loop' : context && correlation ? 'Both review lanes complete · shared plan ready' : context ? 'Context reviewed · symptom-rhythm record remains' : 'Correlation and context open the longitudinal plan'}</p>
      <div className="syringe__presets">
        <Button className="crisis-drug__action" disabled={!stability || context} aria-disabled={demonstrating} onClick={act ? () => act('review-symptomatic-bradycardia-context') : undefined}>Review reversible context</Button>
        <Button className="crisis-drug__action" disabled={!context || !correlation || pacing} aria-disabled={demonstrating} onClick={act ? () => act('record-symptomatic-bradycardia-pacing-evaluation') : undefined}>Record shared pacing evaluation</Button>
        <Button className="crisis-drug__action" disabled={!pacing || handoff} aria-disabled={demonstrating} onClick={act ? () => act('handoff-symptomatic-bradycardia-plan') : undefined}>Record safety net + owner</Button>
      </div>
      <p className="field__hint">Pacing is a shared clinical decision, not a reward for a low number. Acute compromise opens the emergency bradycardia pathway.</p>
    </section>
    </div>
  </div>;
}
