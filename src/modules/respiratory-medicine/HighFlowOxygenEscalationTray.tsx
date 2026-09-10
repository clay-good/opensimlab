/**
 * HighFlowOxygenEscalationTray, moved out of `ActionCockpit.tsx` unchanged.
 *
 * The cockpit defined this tray inline and rendered it behind a `hasHighFlowOxygenEscalationResponse` gate
 * computed from the scenario, so every specialty downloaded it. The gate is now this tray's
 * `supports` predicate in `trays.ts`; the body below is the original.
 */
import type { EquipmentSnapshot } from '@platform/kernel/protocol';
import { highFlowOxygenEscalationInlinePrompt } from './tutor/high-flow-nasal-oxygen-escalation-guidance';
import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import { TutorPanel, WatchingNotice } from '@anesthesia/ui/tutor-panel';
import { Badge, Button } from '@platform/ui';

export function HighFlowOxygenEscalationTray({ assessment, scenarioVersion, guidance = 'unassisted', demonstrating = false, onAction }: {
  assessment?: NonNullable<EquipmentSnapshot['resuscitation']['highFlowOxygenEscalationAssessment']>;
  scenarioVersion: string;
  guidance?: GuidanceLevel;
  demonstrating?: boolean;
  onAction: (action: string) => void;
}) {
  const trajectory = assessment?.trajectoryAtTick != null;
  const suitability = assessment?.suitabilityAtTick != null;
  const selected = assessment?.selectionAtTick != null;
  const response = assessment?.responseAtTick != null;
  const guards = assessment?.guardsAtTick != null;
  const handoff = assessment?.handoffAtTick != null;
  const unsupportedChoice = assessment?.lastUnsupportedChoice;
  const prompt = demonstrating ? null
    : highFlowOxygenEscalationInlinePrompt(guidance, { scenarioVersion, patient: assessment });
  const act = demonstrating ? undefined : onAction;
  return <div style={{ display: 'grid', gap: 'var(--space-4)' }}>
    <WatchingNotice demonstrating={demonstrating} />
    <TutorPanel prompt={prompt} />
    <div className="tray-grid">
    <section className="syringe" aria-labelledby="high-flow-oxygen-escalation-choice-title">
      <div id="high-flow-oxygen-escalation-choice-title" className="syringe__name">Match the support to the breath.</div>
      <Badge kind="teaching">signal · oxygen need · work · CO₂ · circulation</Badge>
      <div className="syringe__meta">SpO₂ 88% · RR 34 · PaCO₂ 31 · warm perfusion</div>
      <p className="syringe__remaining" role="status">
        {selected ? 'HFNO intent recorded · qualified staff individualize support off-screen'
          : unsupportedChoice === 'conventional' ? 'Oxygenation and work remain inadequate on the documented conventional support'
            : unsupportedChoice === 'bilevel' ? 'NIV can fit selected hypoxemia; this person-preference case follows the HFNO pathway'
              : suitability ? 'Rescue boundary ready · choose the next support'
                : trajectory ? 'Conventional oxygen remains behind the need · review suitability'
                  : 'Start with the trend, not the device'}
      </p>
      <div className="syringe__presets">
        {!trajectory && <Button className="crisis-drug__action"
          aria-disabled={demonstrating} onClick={act ? () => act('reconcile-high-flow-oxygen-conventional-support-trajectory') : undefined}>Review oxygen + work trend</Button>}
        {trajectory && !suitability && <Button className="crisis-drug__action"
          aria-disabled={demonstrating} onClick={act ? () => act('review-high-flow-oxygen-suitability-and-rescue-readiness') : undefined}>Review suitability + rescue</Button>}
        {suitability && !selected && <>
          <Button className="crisis-drug__action" aria-disabled={demonstrating} onClick={act ? () => act('select-high-flow-nasal-oxygen-escalation') : undefined}>High-flow nasal oxygen</Button>
          <Button className="crisis-drug__action" aria-disabled={demonstrating} onClick={act ? () => act('continue-conventional-oxygen') : undefined}>Continue reservoir mask</Button>
          <Button className="crisis-drug__action" aria-disabled={demonstrating} onClick={act ? () => act('select-bilevel-niv-first') : undefined}>Bilevel NIV</Button>
        </>}
      </div>
      <p className="field__hint">The choice records a support goal only. No source, device, cannula, fit, flow, temperature, humidification, FiO₂, target, or treatment technique is selected or delivered.</p>
    </section>
    <section className="syringe" aria-labelledby="high-flow-oxygen-escalation-response-title">
      <div id="high-flow-oxygen-escalation-response-title" className="syringe__name">A calmer breath still deserves a watchful plan.</div>
      <Badge kind="teaching">comfort · rate · saturation · gas · rescue boundary</Badge>
      <div className="syringe__meta">whole patient · active cause work · serial reassessment</div>
      <p className="syringe__remaining" role="status">
        {handoff ? 'Active support + rescue boundary handed off'
          : guards ? 'Continuation + failure triggers held · advance time before handoff'
            : unsupportedChoice === 'resolved' ? 'Early improvement is partial · substantial support and active risk remain'
              : unsupportedChoice === 'reduced-monitoring' ? 'Early improvement still needs close reassessment and rapid rescue access'
                : response ? 'Rate and oxygenation improved · active support remains'
                  : selected ? 'Selection stays provisional until the person is rechecked'
                    : 'Choose support before reviewing an authored response'}
      </p>
      <div className="syringe__presets">
        {selected && !response && <Button className="crisis-drug__action"
          aria-disabled={demonstrating} onClick={act ? () => act('review-high-flow-oxygen-early-response') : undefined}>Review 30-minute response</Button>}
        {response && !guards && <>
          <Button className="crisis-drug__action" aria-disabled={demonstrating} onClick={act ? () => act('preserve-high-flow-oxygen-monitoring-and-failure-guards') : undefined}>Continue + watch triggers</Button>
          <Button className="crisis-drug__action" aria-disabled={demonstrating} onClick={act ? () => act('mark-high-flow-respiratory-failure-resolved') : undefined}>Mark respiratory failure resolved</Button>
          <Button className="crisis-drug__action" aria-disabled={demonstrating} onClick={act ? () => act('reduce-high-flow-monitoring') : undefined}>Reduce monitoring now</Button>
        </>}
        {guards && !handoff && <Button className="crisis-drug__action"
          aria-disabled={demonstrating} onClick={act ? () => act('handoff-high-flow-oxygen-escalation') : undefined}>Hand off active support + rescue plan</Button>}
      </div>
      <p className="field__hint">Worsening alertness, airway protection, work, oxygenation, ventilation, hemodynamics, tolerance, secretions, or another cause prompts immediate experienced reassessment. HFNO must not delay escalation.</p>
    </section>
    </div>
  </div>;
}
