/**
 * SepticShockResuscitationTray, moved out of `ActionCockpit.tsx` unchanged.
 *
 * The cockpit defined this tray inline and rendered it behind a `hasSepticShockResuscitationResponse` gate
 * computed from the scenario, so every specialty downloaded it. That gate is now this tray's
 * `supports` predicate in `trays.ts`; the body below is the original.
 */
import type { EquipmentSnapshot } from '@platform/kernel/protocol';
import { septicShockResuscitationInlinePrompt } from './tutor/septic-shock-resuscitation-guidance';
import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import { TutorPanel, WatchingNotice } from '@anesthesia/ui/tutor-panel';
import { Badge, Button } from '@platform/ui';

export function SepticShockResuscitationTray({ assessment, scenarioVersion, guidance = 'unassisted', demonstrating = false, onAction }: {
  assessment?: NonNullable<EquipmentSnapshot['resuscitation']['septicShockResuscitationAssessment']>;
  scenarioVersion: string;
  guidance?: GuidanceLevel;
  demonstrating?: boolean;
  onAction: (action: string) => void;
}) {
  const context = assessment?.contextAtTick != null;
  const perfusion = assessment?.perfusionAtTick != null;
  const fluidResponse = assessment?.fluidResponseAtTick != null;
  const planned = assessment?.planAtTick != null;
  const reassessed = assessment?.reassessedAtTick != null;
  const prompt = demonstrating ? null
    : septicShockResuscitationInlinePrompt(guidance, { scenarioVersion, patient: assessment });
  const act = demonstrating ? undefined : onAction;
  return (
    <div style={{ display: 'grid', gap: 'var(--space-4)' }}>
      <WatchingNotice demonstrating={demonstrating} />
      <TutorPanel prompt={prompt} />
      <div className="tray-grid">
      <section className="syringe" aria-labelledby="septic-resuscitation-loop-title">
        <div id="septic-resuscitation-loop-title" className="syringe__name">Resuscitation is a loop, not a liter count.</div>
        <Badge kind="teaching">delivery · pressure · brain · skin · kidney · trend</Badge>
        <div className="syringe__meta">MAP 64 · refill 5 s · lactate 5.8 → 6.4</div>
        <p className="syringe__remaining" role="status">
          {perfusion ? 'MAP ≠ restored perfusion · fluid tolerance due'
            : context ? 'Prior care claims reconciled · read the patient response'
              : 'Reported antibiotics + 2.1 L + running norepinephrine · shock persists'}
        </p>
        <div className="syringe__presets">
          <Button className="crisis-drug__action" disabled={context}
            aria-disabled={demonstrating} onClick={act ? () => act('reconcile-septic-shock-resuscitation-so-far') : undefined}>Reconcile care + response</Button>
          <Button className="crisis-drug__action" disabled={!context || perfusion}
            aria-disabled={demonstrating} onClick={act ? () => act('reassess-septic-shock-perfusion') : undefined}>Reassess multi-organ perfusion</Button>
          <Button className="crisis-drug__action" disabled={!perfusion || fluidResponse}
            aria-disabled={demonstrating} onClick={act ? () => act('test-septic-shock-fluid-responsiveness') : undefined}>Review dynamic response + lungs</Button>
        </div>
        <p className="field__hint">Lactate is interpreted in context. A pressure target, one value, or one trend does not prove recovery.</p>
      </section>
      <section className="syringe" aria-labelledby="septic-resuscitation-exit-title">
        <div id="septic-resuscitation-exit-title" className="syringe__name">Fluid needs a target and an exit.</div>
        <Badge kind="teaching">dynamic response · lung tolerance · support · source</Badge>
        <div className="syringe__meta">PLR SV +2% · new B-lines · no blind repeat bolus</div>
        <p className="syringe__remaining" role="status">
          {reassessed ? 'Modest perfusion change · source + organ failure remain open'
            : planned ? 'Support review + urgent source control activated · trajectory due'
              : fluidResponse ? 'Further fluid needs a new patient-specific reason'
                : 'Dynamic response and lung tolerance pending'}
        </p>
        <div className="syringe__presets">
          <Button className="crisis-drug__action" disabled={!fluidResponse || planned}
            aria-disabled={demonstrating} onClick={act ? () => act('individualize-septic-shock-support-and-source-control') : undefined}>Individualize support + source control</Button>
          <Button className="crisis-drug__action" disabled={!planned || reassessed}
            aria-disabled={demonstrating} onClick={act ? () => act('reassess-septic-shock-trajectory') : undefined}>Review 10-minute trajectory</Button>
        </div>
        <p className="field__hint">The +2% response and B-lines are case facts, not universal cutoffs. This screen gives no fluid or drug and performs no drainage.</p>
      </section>
      </div>
    </div>
  );
}
