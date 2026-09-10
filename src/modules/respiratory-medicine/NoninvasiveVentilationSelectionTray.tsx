/**
 * NoninvasiveVentilationSelectionTray, moved out of `ActionCockpit.tsx` unchanged.
 *
 * The cockpit defined this tray inline and rendered it behind a `hasNoninvasiveVentilationSelectionResponse` gate
 * computed from the scenario, so every specialty downloaded it. The gate is now this tray's
 * `supports` predicate in `trays.ts`; the body below is the original.
 */
import type { EquipmentSnapshot } from '@platform/kernel/protocol';
import { noninvasiveVentilationSelectionInlinePrompt } from './tutor/noninvasive-ventilation-selection-guidance';
import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import { TutorPanel, WatchingNotice } from '@anesthesia/ui/tutor-panel';
import { Badge, Button } from '@platform/ui';

export function NoninvasiveVentilationSelectionTray({ assessment, scenarioVersion, guidance = 'unassisted', demonstrating = false, onAction }: {
  assessment?: NonNullable<EquipmentSnapshot['resuscitation']['noninvasiveVentilationSelectionAssessment']>;
  scenarioVersion: string;
  guidance?: GuidanceLevel;
  demonstrating?: boolean;
  onAction: (action: string) => void;
}) {
  const trajectory = assessment?.trajectoryAtTick != null;
  const suitability = assessment?.suitabilityAtTick != null;
  const selected = assessment?.selectionAtTick != null;
  const response = assessment?.responseAtTick != null;
  const guards = assessment?.failureGuardsAtTick != null;
  const handoff = assessment?.handoffAtTick != null;
  const unsupportedChoice = assessment?.lastUnsupportedChoice;
  const prompt = demonstrating ? null
    : noninvasiveVentilationSelectionInlinePrompt(guidance, { scenarioVersion, patient: assessment });
  const act = demonstrating ? undefined : onAction;
  return <div style={{ display: 'grid', gap: 'var(--space-4)' }}>
    <WatchingNotice demonstrating={demonstrating} />
    <TutorPanel prompt={prompt} />
    <div className="tray-grid">
    <section className="syringe" aria-labelledby="noninvasive-ventilation-selection-choice-title">
      <div id="noninvasive-ventilation-selection-choice-title" className="syringe__name">Choose support from physiology, not familiarity.</div>
      <Badge kind="teaching">persistent acidosis · ventilatory assistance · monitored trial</Badge>
      <div className="syringe__meta">pH 7.28 · PaCO₂ 68 · alert · rescue ready</div>
      <p className="syringe__remaining" role="status">
        {selected ? 'Bilevel NIV intent recorded · qualified staff individualize support off-screen'
          : unsupportedChoice === 'cpap' ? 'CPAP alone does not provide the same inspiratory ventilatory assistance here'
            : unsupportedChoice === 'high-flow' ? 'High-flow alone is not the selected first support for this acidotic hypercapnic pattern'
              : suitability ? 'Suitability + rescue readiness held · choose the support goal'
                : trajectory ? 'Initial care reconciled · review suitability and rescue readiness'
                  : 'Start with the change after verified initial COPD care'}
      </p>
      <div className="syringe__presets">
        {!suitability && <>
          <Button className="crisis-drug__action" disabled={trajectory}
            aria-disabled={demonstrating} onClick={act ? () => act('reconcile-noninvasive-ventilation-selection-treatment-and-trajectory') : undefined}>Review initial care + trajectory</Button>
          <Button className="crisis-drug__action" disabled={!trajectory}
            aria-disabled={demonstrating} onClick={act ? () => act('review-noninvasive-ventilation-selection-suitability-and-rescue-readiness') : undefined}>Review acidosis + NIV suitability</Button>
        </>}
        {suitability && !selected && <>
          <Button className="crisis-drug__action" aria-disabled={demonstrating} onClick={act ? () => act('select-bilevel-noninvasive-ventilation') : undefined}>Bilevel NIV trial</Button>
          <Button className="crisis-drug__action" aria-disabled={demonstrating} onClick={act ? () => act('select-cpap-alone') : undefined}>CPAP alone</Button>
          <Button className="crisis-drug__action" aria-disabled={demonstrating} onClick={act ? () => act('select-high-flow-nasal-oxygen-alone') : undefined}>High-flow nasal oxygen</Button>
        </>}
      </div>
      <p className="field__hint">The choice records a support goal only. No device, interface, pressure, backup rate, oxygen target, or treatment technique is selected or delivered.</p>
    </section>
    <section className="syringe" aria-labelledby="noninvasive-ventilation-selection-response-title">
      <div id="noninvasive-ventilation-selection-response-title" className="syringe__name">A trial earns its place through reassessment.</div>
      <Badge kind="teaching">whole patient · blood gas · failure guards · airway-capable rescue</Badge>
      <div className="syringe__meta">comfort · work · mentation · pH · PaCO₂ · tolerance</div>
      <p className="syringe__remaining" role="status">
        {handoff ? 'Active support + unresolved risk handed off'
          : guards ? 'Continuation guards held · advance time before handoff'
            : response ? 'Early partial improvement · preserve failure triggers and rescue readiness'
              : selected ? 'Support intent recorded · advance time before the 1-hour review'
                : 'Choose the support goal before reassessment'}
      </p>
      <div className="syringe__presets">
        <Button className="crisis-drug__action" disabled={!selected || response}
          aria-disabled={demonstrating} onClick={act ? () => act('review-noninvasive-ventilation-selection-early-response') : undefined}>Review 1-hour whole-patient response</Button>
        <Button className="crisis-drug__action" disabled={!response || guards}
          aria-disabled={demonstrating} onClick={act ? () => act('review-noninvasive-ventilation-selection-failure-guards') : undefined}>Continue trial + preserve rescue triggers</Button>
        <Button className="crisis-drug__action" disabled={!guards || handoff}
          aria-disabled={demonstrating} onClick={act ? () => act('handoff-noninvasive-ventilation-selection-reassessment') : undefined}>Hand off active support + rescue plan</Button>
      </div>
      <p className="field__hint">Early improvement is not durable success. Worsening mentation, airway protection, work, gas exchange, hemodynamics, tolerance, secretions, or another cause prompts immediate experienced reassessment.</p>
    </section>
    </div>
  </div>;
}
