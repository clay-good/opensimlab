/**
 * StableNarrowTachycardiaTray, moved out of `ActionCockpit.tsx` unchanged.
 *
 * The cockpit defined this tray inline and rendered it behind a `hasStableNarrowTachycardiaResponse` gate
 * computed from the scenario, so every specialty downloaded it. That gate is now this tray's
 * `supports` predicate in `trays.ts`; the body below is the original.
 */
import type { EquipmentSnapshot } from '@platform/kernel/protocol';
import { stableNarrowTachycardiaInlinePrompt } from './tutor/stable-narrow-tachycardia-guidance';
import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import { TutorPanel, WatchingNotice } from '@anesthesia/ui/tutor-panel';
import { Badge, Button } from '@platform/ui';

export function StableNarrowTachycardiaTray({ assessment, scenarioVersion, guidance = 'unassisted', demonstrating = false, onAction }: {
  assessment?: NonNullable<EquipmentSnapshot['resuscitation']['stableNarrowTachycardiaAssessment']>;
  scenarioVersion: string;
  guidance?: GuidanceLevel;
  demonstrating?: boolean;
  onAction: (action: string) => void;
}) {
  const stability = assessment?.stabilityAtTick != null;
  const context = assessment?.contextAtTick != null;
  const vagal = assessment?.vagalAtTick != null;
  const vagalResponse = assessment?.vagalResponseAtTick != null;
  const adenosine = assessment?.adenosineAtTick != null;
  const reassessed = assessment?.reassessmentAtTick != null;
  const prompt = demonstrating ? null
    : stableNarrowTachycardiaInlinePrompt(guidance, { scenarioVersion, patient: assessment });
  const act = demonstrating ? undefined : onAction;
  return (
    <div style={{ display: 'grid', gap: 'var(--space-4)' }}>
    <WatchingNotice demonstrating={demonstrating} />
    <TutorPanel prompt={prompt} />
    <div className="tray-grid">
      <section className="syringe" aria-labelledby="stable-narrow-first-title">
        <div id="stable-narrow-first-title" className="syringe__name">Fast rhythm. Steady patient.</div>
        <Badge kind="teaching">regular · narrow · stable now</Badge>
        <div className="syringe__meta">176/min · QRS 82 ms · BP 124/78 · warm + alert</div>
        <p className="syringe__remaining" role="status">
          {vagal ? 'Vagal intent recorded · allow observation time'
            : context ? 'Mechanism open · monitored first step ready'
              : stability ? 'Stable now · review context + readiness'
                : 'Read the rhythm through the whole patient'}
        </p>
        <div className="syringe__presets">
          <Button className="crisis-drug__action" disabled={stability}
            aria-disabled={demonstrating} onClick={act ? () => act('reconcile-stable-regular-narrow-tachycardia') : undefined}>Reconcile rhythm + stability</Button>
          <Button className="crisis-drug__action" disabled={!stability || context}
            aria-disabled={demonstrating} onClick={act ? () => act('review-stable-regular-narrow-context') : undefined}>Review context + monitored readiness</Button>
          <Button className="crisis-drug__action" disabled={!context || vagal}
            aria-disabled={demonstrating} onClick={act ? () => act('record-stable-regular-narrow-vagal-intent') : undefined}>Record coached modified-Valsalva intent</Button>
        </div>
        <p className="field__hint">Heart rate alone does not define instability. The fixed 12-lead supplies width and regularity; it does not prove AVNRT, AVRT, atrial tachycardia, or flutter.</p>
      </section>
      <section className="syringe" aria-labelledby="stable-narrow-response-title">
        <div id="stable-narrow-response-title" className="syringe__name">Try gently. Watch closely. Plan beyond today.</div>
        <Badge kind="teaching">response · suitability · recurrence · rhythm follow-up</Badge>
        <div className="syringe__meta">continuous rhythm + pressure · access ready · no routine oxygen</div>
        <p className="syringe__remaining" role="status">
          {reassessed ? 'Sinus 88/min · mechanism open · follow-up owned'
            : adenosine ? 'Adenosine intent recorded · allow reassessment time'
              : vagalResponse ? 'Still regular + stable · bounded next intent ready'
                : vagal ? 'Observe before deciding'
                  : 'Monitored first response pending'}
        </p>
        <div className="syringe__presets">
          <Button className="crisis-drug__action" disabled={!vagal || vagalResponse}
            aria-disabled={demonstrating} onClick={act ? () => act('review-stable-regular-narrow-vagal-response') : undefined}>Review observed vagal response</Button>
          <Button className="crisis-drug__action" disabled={!vagalResponse || adenosine}
            aria-disabled={demonstrating} onClick={act ? () => act('record-stable-regular-narrow-adenosine-intent') : undefined}>Record monitored adenosine intent</Button>
          <Button className="crisis-drug__action" disabled={!adenosine || reassessed}
            aria-disabled={demonstrating} onClick={act ? () => act('reassess-stable-regular-narrow-trajectory') : undefined}>Reassess rhythm + recurrence plan</Button>
        </div>
        <p className="field__hint">No dose or drug delivery is supplied. Instability opens synchronized cardioversion; conversion does not prove one mechanism, cure recurrence, or choose ablation.</p>
      </section>
    </div>
    </div>
  );
}
