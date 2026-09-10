/**
 * PediatricHypoglycemicSeizureTray, moved out of `ActionCockpit.tsx` unchanged.
 *
 * The cockpit defined this tray inline and rendered it behind a `hasPediatricHypoglycemicSeizureResponse` gate
 * computed from the scenario, so every specialty downloaded it. That gate is now this tray's
 * `supports` predicate in `trays.ts`; the body below is the original.
 */
import type { EquipmentSnapshot } from '@platform/kernel/protocol';
import { pediatricHypoglycemicSeizureInlinePrompt } from './tutor/pediatric-hypoglycemic-seizure-guidance';
import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import { TutorPanel, WatchingNotice } from '@anesthesia/ui/tutor-panel';
import { Badge, Button } from '@platform/ui';

export function PediatricHypoglycemicSeizureTray({ assessment, scenarioVersion, guidance = 'unassisted', demonstrating = false, onAction }: {
  assessment?: NonNullable<EquipmentSnapshot['resuscitation']['pediatricHypoglycemicSeizureAssessment']>;
  scenarioVersion: string;
  guidance?: GuidanceLevel;
  demonstrating?: boolean;
  onAction: (action: string) => void;
}) {
  const trajectory = assessment?.trajectoryAtTick != null;
  const recognition = assessment?.recognitionAtTick != null;
  const rescue = assessment?.rescueAtTick != null;
  const safety = assessment?.safetyAtTick != null;
  const later = assessment?.laterResponseAtTick != null;
  const handoff = assessment?.handoffAtTick != null;
  const prompt = demonstrating ? null
    : pediatricHypoglycemicSeizureInlinePrompt(guidance, { scenarioVersion, patient: assessment });
  const act = demonstrating ? undefined : onAction;
  return <div style={{ display: 'grid', gap: 'var(--space-4)' }}>
    <WatchingNotice demonstrating={demonstrating} />
    <TutorPanel prompt={prompt} />
    <div className="tray-grid">
    <section className="syringe" aria-labelledby="pediatric-hypoglycemia-pattern-title">
      <div id="pediatric-hypoglycemia-pattern-title" className="syringe__name">Read the seizure and the child.</div>
      <Badge kind="teaching">seizure · glucose · breathing · perfusion · recovery</Badge>
      <div className="syringe__meta">5 years · 18 kg · supplied glucose 34 mg/dL</div>
      <p className="syringe__remaining">
        {rescue && safety ? 'Qualified rescue and safety review are active together'
          : safety ? 'Safety review is active · qualified glucose rescue still matters'
            : rescue ? 'Qualified glucose rescue is active · keep safety review moving'
              : recognition ? 'Hypoglycemic emergency authored · seizure has stopped'
                : trajectory ? 'Now connect the fixed glucose to current neurologic risk'
                  : 'Start with the event, whole child, and fixed glucose.'}
      </p>
      <div className="syringe__presets">
        {!trajectory && <Button className="crisis-drug__action"
          aria-disabled={demonstrating} onClick={act ? () => act('reconcile-pediatric-hypoglycemic-seizure-whole-child-and-glucose') : undefined}>Review seizure + fixed glucose</Button>}
        {trajectory && !recognition && <Button className="crisis-drug__action"
          aria-disabled={demonstrating} onClick={act ? () => act('recognize-pediatric-hypoglycemic-seizure') : undefined}>Recognize hypoglycemic emergency</Button>}
        {recognition && !rescue && <Button className="crisis-drug__action"
          aria-disabled={demonstrating} onClick={act ? () => act('activate-pediatric-hypoglycemic-seizure-qualified-rescue-ownership') : undefined}>Activate qualified glucose rescue</Button>}
        {recognition && !safety && <Button className="crisis-drug__action"
          aria-disabled={demonstrating} onClick={act ? () => act('review-pediatric-hypoglycemic-seizure-causes-and-recurrence-risk') : undefined}>Review recovery + cause risks</Button>}
      </div>
      <p className="field__hint">Experienced teams own serial glucose checks, glucose rescue, recurrence and cause review, access, airway and seizure support, and monitoring. Give nothing by mouth while consciousness is impaired. This lab exposes no learner test, drug, dose, concentration, route, access, device, airway, procedure, treatment, or disposition control.</p>
    </section>
    <section className="syringe" aria-labelledby="pediatric-hypoglycemia-response-title">
      <div id="pediatric-hypoglycemia-response-title" className="syringe__name">Recovery needs another check.</div>
      <Badge kind="teaching">mentation · recurrence · glucose · cause · ownership</Badge>
      <div className="syringe__meta">fixed minute-20 report · cause remains open</div>
      <p className="syringe__remaining" role="status">
        {handoff ? 'Active recurrence and cause risk handed off'
          : later ? 'Fixed glucose improved. Risk and cause remain open.'
            : rescue && safety ? 'Review the fixed report after elapsed parallel care'
              : safety ? 'Safety review is active · activate qualified glucose rescue'
                : rescue ? 'Qualified rescue is active · review recovery and cause risks'
                  : 'Qualified rescue and safety review should move together.'}
      </p>
      <div className="syringe__presets">
        {rescue && safety && !later && <Button className="crisis-drug__action"
          aria-disabled={demonstrating} onClick={act ? () => act('review-pediatric-hypoglycemic-seizure-later-response') : undefined}>Review the 20-minute report</Button>}
        {later && !handoff && <Button className="crisis-drug__action"
          aria-disabled={demonstrating} onClick={act ? () => act('handoff-pediatric-hypoglycemic-seizure-active-risk') : undefined}>Hand off recurrence + cause risk</Button>}
      </div>
      <p className="field__hint">The fixed minute-20 report does not prove treatment effect, durable euglycemia, neurological recovery, etiology, freedom from recurrence, discharge readiness, or outcome.</p>
    </section>
    </div>
  </div>;
}
