/**
 * PediatricDehydrationTray, moved out of `ActionCockpit.tsx` unchanged.
 *
 * The cockpit defined this tray inline and rendered it behind a `hasPediatricDehydrationResponse` gate
 * computed from the scenario, so every specialty downloaded it. That gate is now this tray's
 * `supports` predicate in `trays.ts`; the body below is the original.
 */
import type { EquipmentSnapshot } from '@platform/kernel/protocol';
import { pediatricDehydrationInlinePrompt } from './tutor/pediatric-dehydration-guidance';
import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import { TutorPanel, WatchingNotice } from '@anesthesia/ui/tutor-panel';
import { Badge, Button } from '@platform/ui';

export function PediatricDehydrationTray({ assessment, scenarioVersion, guidance = 'unassisted', demonstrating = false, onAction }: {
  assessment?: NonNullable<EquipmentSnapshot['resuscitation']['pediatricDehydrationAssessment']>;
  scenarioVersion: string;
  guidance?: GuidanceLevel;
  demonstrating?: boolean;
  onAction: (action: string) => void;
}) {
  const trajectory = assessment?.trajectoryAtTick != null;
  const recognition = assessment?.recognitionAtTick != null;
  const rehydration = assessment?.rehydrationAtTick != null;
  const safety = assessment?.safetyAtTick != null;
  const later = assessment?.laterResponseAtTick != null;
  const handoff = assessment?.handoffAtTick != null;
  const prompt = demonstrating ? null
    : pediatricDehydrationInlinePrompt(guidance, { scenarioVersion, patient: assessment });
  const act = demonstrating ? undefined : onAction;
  return <div style={{ display: 'grid', gap: 'var(--space-4)' }}>
    <WatchingNotice demonstrating={demonstrating} />
    <TutorPanel prompt={prompt} />
    <div className="tray-grid">
    <section className="syringe" aria-labelledby="pediatric-dehydration-pattern-title">
      <div id="pediatric-dehydration-pattern-title" className="syringe__name">Read losses through the whole child.</div>
      <Badge kind="teaching">intake · losses · mentation · hydration · urine</Badge>
      <div className="syringe__meta">2 years · 12 kg · fixed gastrointestinal-loss trajectory</div>
      <p className="syringe__remaining">
        {rehydration && safety ? 'Rehydration and safety review are active together'
          : safety ? 'Loss and safety review is active · rehydration ownership still matters'
            : rehydration ? 'Rehydration ownership is active · keep safety review moving'
              : recognition ? 'Compensated volume depletion · no current shock'
                : trajectory ? 'Now separate dehydration from shock'
                  : 'Start with the trajectory, not one sign or percentage.'}
      </p>
      <div className="syringe__presets">
        {!trajectory && <Button className="crisis-drug__action"
          aria-disabled={demonstrating} onClick={act ? () => act('reconcile-pediatric-dehydration-losses-and-perfusion') : undefined}>Review losses + whole child</Button>}
        {trajectory && !recognition && <Button className="crisis-drug__action"
          aria-disabled={demonstrating} onClick={act ? () => act('recognize-pediatric-dehydration-with-hypovolemia') : undefined}>Recognize dehydration + hypovolemia</Button>}
        {recognition && !rehydration && <Button className="crisis-drug__action"
          aria-disabled={demonstrating} onClick={act ? () => act('activate-pediatric-dehydration-qualified-rehydration-ownership') : undefined}>Activate qualified rehydration</Button>}
        {recognition && !safety && <Button className="crisis-drug__action"
          aria-disabled={demonstrating} onClick={act ? () => act('review-pediatric-dehydration-ongoing-losses-and-safety') : undefined}>Review losses + safety</Button>}
      </div>
      <p className="field__hint">Experienced teams own oral support, breastfeeding and phase-appropriate feeding, tests, access, route escalation, fluids, electrolytes, and monitoring. This lab exposes no percentage, deficit, maintenance, solution, route, volume, or rate control.</p>
    </section>
    <section className="syringe" aria-labelledby="pediatric-dehydration-response-title">
      <div id="pediatric-dehydration-response-title" className="syringe__name">Reassess before you reassure.</div>
      <Badge kind="teaching">hydration · tolerance · ongoing losses · ownership</Badge>
      <div className="syringe__meta">fixed minute-60 report · improving, not resolved</div>
      <p className="syringe__remaining" role="status">
        {handoff ? 'Active rehydration and recurrence risk handed off'
          : later ? 'Some signs improved. Completion is not established.'
            : rehydration && safety ? 'Review the fixed report after elapsed parallel care'
              : safety ? 'Safety review is active · activate rehydration ownership'
                : rehydration ? 'Rehydration is active · review losses and safety'
                  : 'Rehydration and safety review should move together.'}
      </p>
      <div className="syringe__presets">
        {rehydration && safety && !later && <Button className="crisis-drug__action"
          aria-disabled={demonstrating} onClick={act ? () => act('review-pediatric-dehydration-later-response') : undefined}>Review the 60-minute report</Button>}
        {later && !handoff && <Button className="crisis-drug__action"
          aria-disabled={demonstrating} onClick={act ? () => act('handoff-pediatric-dehydration-active-risk') : undefined}>Hand off active rehydration risk</Button>}
      </div>
      <p className="field__hint">Better interaction or hydration signs do not prove causal treatment effect, complete deficit correction, durable recovery, discharge readiness, or outcome.</p>
    </section>
    </div>
  </div>;
}
