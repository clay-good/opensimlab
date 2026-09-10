/**
 * PediatricDiabeticKetoacidosisTray, moved out of `ActionCockpit.tsx` unchanged.
 *
 * The cockpit defined this tray inline and rendered it behind a `hasPediatricDiabeticKetoacidosisResponse` gate
 * computed from the scenario, so every specialty downloaded it. That gate is now this tray's
 * `supports` predicate in `trays.ts`; the body below is the original.
 */
import type { EquipmentSnapshot } from '@platform/kernel/protocol';
import { pediatricDkaInlinePrompt } from './tutor/pediatric-dka-guidance';
import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import { TutorPanel, WatchingNotice } from '@anesthesia/ui/tutor-panel';
import { Badge, Button } from '@platform/ui';

export function PediatricDiabeticKetoacidosisTray({ assessment, scenarioVersion, guidance = 'unassisted', demonstrating = false, onAction }: {
  assessment?: NonNullable<EquipmentSnapshot['resuscitation']['pediatricDiabeticKetoacidosisAssessment']>;
  scenarioVersion: string;
  guidance?: GuidanceLevel;
  demonstrating?: boolean;
  onAction: (action: string) => void;
}) {
  const trajectory = assessment?.trajectoryAtTick != null;
  const recognition = assessment?.recognitionAtTick != null;
  const care = assessment?.careAtTick != null;
  const safety = assessment?.safetyAtTick != null;
  const later = assessment?.laterResponseAtTick != null;
  const handoff = assessment?.handoffAtTick != null;
  const prompt = demonstrating ? null
    : pediatricDkaInlinePrompt(guidance, { scenarioVersion, patient: assessment });
  const act = demonstrating ? undefined : onAction;
  return <div style={{ display: 'grid', gap: 'var(--space-4)' }}>
    <WatchingNotice demonstrating={demonstrating} />
    <TutorPanel prompt={prompt} />
    <div className="tray-grid">
    <section className="syringe" aria-labelledby="pediatric-dka-pattern-title">
      <div id="pediatric-dka-pattern-title" className="syringe__name">Read the child, not one number.</div>
      <Badge kind="teaching">history · ketones · acidosis · breathing · perfusion</Badge>
      <div className="syringe__meta">9 years · 30 kg · supplied DKA pattern</div>
      <p className="syringe__remaining">
        {care && safety ? 'Qualified DKA care and safety review are active together'
          : safety ? 'Safety review is active · qualified DKA care still matters'
            : care ? 'Qualified DKA care is active · keep safety review moving'
              : recognition ? 'DKA authored · no shock or current warning cluster'
                : trajectory ? 'Now connect the triad to current whole-child risk'
                  : 'Start with the whole illness and fixed panel.'}
      </p>
      <div className="syringe__presets">
        {!trajectory && <Button className="crisis-drug__action"
          aria-disabled={demonstrating} onClick={act ? () => act('reconcile-pediatric-dka-illness-and-fixed-pattern') : undefined}>Review illness + fixed panel</Button>}
        {trajectory && !recognition && <Button className="crisis-drug__action"
          aria-disabled={demonstrating} onClick={act ? () => act('recognize-pediatric-dka-and-current-risk') : undefined}>Recognize pediatric DKA risk</Button>}
        {recognition && !care && <Button className="crisis-drug__action"
          aria-disabled={demonstrating} onClick={act ? () => act('activate-pediatric-dka-qualified-care-ownership') : undefined}>Activate qualified DKA care</Button>}
        {recognition && !safety && <Button className="crisis-drug__action"
          aria-disabled={demonstrating} onClick={act ? () => act('review-pediatric-dka-neurologic-and-metabolic-safety') : undefined}>Review neurologic + metabolic safety</Button>}
      </div>
      <p className="field__hint">Experienced teams own fluids, insulin, glucose, electrolytes, access, rhythm, neurological and biochemical monitoring, and escalation. This lab exposes no calculation, sequence, solution, route, concentration, bolus, dose, rate, threshold, or pump control.</p>
    </section>
    <section className="syringe" aria-labelledby="pediatric-dka-response-title">
      <div id="pediatric-dka-response-title" className="syringe__name">Make every reassessment count.</div>
      <Badge kind="teaching">mentation · headache · rhythm · perfusion · trends</Badge>
      <div className="syringe__meta">fixed minute-60 report · DKA remains active</div>
      <p className="syringe__remaining" role="status">
        {handoff ? 'Active DKA and neurological-metabolic risk handed off'
          : later ? 'Some signals improved. DKA remains active.'
            : care && safety ? 'Review the fixed report after elapsed parallel care'
              : safety ? 'Safety review is active · activate qualified DKA care'
                : care ? 'Qualified care is active · review neurologic and metabolic safety'
                  : 'Qualified care and safety review should move together.'}
      </p>
      <div className="syringe__presets">
        {care && safety && !later && <Button className="crisis-drug__action"
          aria-disabled={demonstrating} onClick={act ? () => act('review-pediatric-dka-later-response') : undefined}>Review the 60-minute report</Button>}
        {later && !handoff && <Button className="crisis-drug__action"
          aria-disabled={demonstrating} onClick={act ? () => act('handoff-pediatric-dka-active-risk') : undefined}>Hand off active DKA risk</Button>}
      </div>
      <p className="field__hint">Improving vitals or fixed laboratory trends do not prove treatment effect, biochemical resolution, cerebral-injury exclusion, durable recovery, discharge readiness, or outcome.</p>
    </section>
    </div>
  </div>;
}
