/**
 * StableWideTachycardiaTray, moved out of `ActionCockpit.tsx` unchanged.
 *
 * The cockpit defined this tray inline and rendered it behind a `hasStableWideTachycardiaResponse` gate
 * computed from the scenario, so every specialty downloaded it. That gate is now this tray's
 * `supports` predicate in `trays.ts`; the body below is the original.
 */
import type { EquipmentSnapshot } from '@platform/kernel/protocol';
import { stableWideTachycardiaInlinePrompt } from './tutor/stable-wide-tachycardia-guidance';
import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import { TutorPanel, WatchingNotice } from '@anesthesia/ui/tutor-panel';
import { Badge, Button } from '@platform/ui';

export function StableWideTachycardiaTray({ assessment, scenarioVersion, guidance = 'unassisted', demonstrating = false, onAction }: {
  assessment?: NonNullable<EquipmentSnapshot['resuscitation']['stableWideTachycardiaAssessment']>;
  scenarioVersion: string;
  guidance?: GuidanceLevel;
  demonstrating?: boolean;
  onAction: (action: string) => void;
}) {
  const stability = assessment?.stabilityAtTick != null;
  const context = assessment?.contextAtTick != null;
  const readiness = assessment?.readinessAtTick != null;
  const medication = assessment?.medicationAtTick != null;
  const nonresponse = assessment?.nonresponseAtTick != null;
  const cardioversion = assessment?.cardioversionAtTick != null;
  const reassessed = assessment?.reassessmentAtTick != null;
  const prompt = demonstrating ? null
    : stableWideTachycardiaInlinePrompt(guidance, { scenarioVersion, patient: assessment });
  const act = demonstrating ? undefined : onAction;
  return <div style={{ display: 'grid', gap: 'var(--space-4)' }}>
    <WatchingNotice demonstrating={demonstrating} />
    <TutorPanel prompt={prompt} />
    <div className="tray-grid">
    <section className="syringe" aria-labelledby="stable-wide-first-title">
      <div id="stable-wide-first-title" className="syringe__name">Wide rhythm. Steady patient.</div>
      <Badge kind="teaching">stable now · regular · monomorphic</Badge>
      <div className="syringe__meta">164/min · QRS 158 ms · BP 118/72 · warm + alert</div>
      <p className="syringe__remaining" role="status">{context ? 'Regular + monomorphic · mechanism remains open' : stability ? 'Stable now · define the wide rhythm' : 'Start with the patient, then read the width'}</p>
      <div className="syringe__presets">
        <Button className="crisis-drug__action" disabled={stability} aria-disabled={demonstrating} onClick={act ? () => act('reconcile-stable-wide-complex-tachycardia') : undefined}>Reconcile pulse + stability</Button>
        <Button className="crisis-drug__action" disabled={!stability || context} aria-disabled={demonstrating} onClick={act ? () => act('review-wide-complex-context') : undefined}>Review morphology + context</Button>
        <Button className="crisis-drug__action" disabled={!context || readiness} aria-disabled={demonstrating} onClick={act ? () => act('prepare-wide-complex-pathway') : undefined}>Prepare monitored WCT pathway</Button>
      </div>
      <p className="field__hint">A wide rhythm is a pattern, not a final diagnosis. Keep VT, aberrancy, pre-excitation, pacing, electrolyte, and drug causes visible.</p>
    </section>
    <section className="syringe" aria-labelledby="stable-wide-response-title">
      <div id="stable-wide-response-title" className="syringe__name">One pathway. Watch closely.</div>
      <Badge kind="teaching">monitor · access · pads · expert help</Badge>
      <div className="syringe__meta">one authored medication lane · cardioversion ready</div>
      <p className="syringe__remaining" role="status">{reassessed ? 'Sinus 84/min · cause + recurrence work remain' : cardioversion ? 'Cardioversion intent recorded · allow reassessment time' : nonresponse ? 'WCT persists · synchronized escalation ready' : medication ? 'Medication path recorded · observe before reassessing' : readiness ? 'Team + rescue readiness recorded' : 'Rhythm review opens the monitored pathway'}</p>
      <div className="syringe__presets">
        <Button className="crisis-drug__action" disabled={!readiness || medication} aria-disabled={demonstrating} onClick={act ? () => act('record-wide-complex-procainamide-pathway') : undefined}>Record expert-guided medication path</Button>
        <Button className="crisis-drug__action" disabled={!medication || nonresponse} aria-disabled={demonstrating} onClick={act ? () => act('review-wide-complex-medication-nonresponse') : undefined}>Review observed medication response</Button>
        <Button className="crisis-drug__action" disabled={!nonresponse || cardioversion} aria-disabled={demonstrating} onClick={act ? () => act('record-wide-complex-cardioversion-intent') : undefined}>Record synchronized-cardioversion intent</Button>
        <Button className="crisis-drug__action" disabled={!cardioversion || reassessed} aria-disabled={demonstrating} onClick={act ? () => act('reassess-wide-complex-trajectory') : undefined}>Reassess rhythm + ownership</Button>
      </div>
      <p className="field__hint">No dose, rate, energy, or learner delivery is supplied. Any instability opens prompt synchronized cardioversion; polymorphic or pulseless rhythms use different pathways.</p>
    </section>
    </div>
  </div>;
}
