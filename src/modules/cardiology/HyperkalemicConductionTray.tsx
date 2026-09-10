/**
 * HyperkalemicConductionTray, moved out of `ActionCockpit.tsx` unchanged.
 *
 * The cockpit defined this tray inline and rendered it behind a `hasHyperkalemicConductionResponse` gate
 * computed from the scenario, so every specialty downloaded it. That gate is now this tray's
 * `supports` predicate in `trays.ts`; the body below is the original.
 */
import type { EquipmentSnapshot } from '@platform/kernel/protocol';
import { hyperkalemicConductionInlinePrompt } from './tutor/hyperkalemic-conduction-guidance';
import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import { TutorPanel, WatchingNotice } from '@anesthesia/ui/tutor-panel';
import { Badge, Button } from '@platform/ui';

export function HyperkalemicConductionTray({ assessment, scenarioVersion, guidance = 'unassisted', demonstrating = false, onAction }: {
  assessment?: NonNullable<EquipmentSnapshot['resuscitation']['hyperkalemicConductionAssessment']>;
  scenarioVersion: string;
  guidance?: GuidanceLevel;
  demonstrating?: boolean;
  onAction: (action: string) => void;
}) {
  const trajectory = assessment?.reconciledAtTick != null;
  const calcium = assessment?.calciumResponseAtTick != null;
  const shift = assessment?.shiftSurveillanceAtTick != null;
  const removal = assessment?.removalDeviceAtTick != null;
  const laterPanel = assessment?.laterPanelAtTick != null;
  const handoff = assessment?.handoffAtTick != null;
  const prompt = demonstrating ? null
    : hyperkalemicConductionInlinePrompt(guidance, { scenarioVersion, patient: assessment });
  const act = demonstrating ? undefined : onAction;
  return <div style={{ display: 'grid', gap: 'var(--space-4)' }}>
    <WatchingNotice demonstrating={demonstrating} />
    <TutorPanel prompt={prompt} />
    <div className="tray-grid">
    <section className="syringe" aria-labelledby="hyperkalemic-conduction-protection-title">
      <div id="hyperkalemic-conduction-protection-title" className="syringe__name">The rhythm changed. Check the chemistry.</div>
      <Badge kind="out-of-range">conduction change · reported hyperkalemia pathway</Badge>
      <div className="syringe__meta">serial ECG + potassium · pressure + perfusion · glucose</div>
      <p className="syringe__remaining" role="status">{calcium && shift ? 'Membrane response + shifting surveillance reviewed' : shift ? 'Shifting surveillance reviewed · calcium-response reasoning remains' : calcium ? 'Membrane response reviewed · shifting surveillance remains' : trajectory ? 'Trajectory reconciled · three review lanes are open' : 'Read the serial rhythm, potassium, and whole-patient trajectory'}</p>
      <div className="syringe__presets">
        <Button className="crisis-drug__action" disabled={trajectory} aria-disabled={demonstrating} onClick={act ? () => act('reconcile-hyperkalemic-conduction-trajectory') : undefined}>Reconcile rhythm + potassium trajectory</Button>
        <Button className="crisis-drug__action" disabled={!trajectory || calcium} aria-disabled={demonstrating} onClick={act ? () => act('review-hyperkalemic-conduction-calcium-response') : undefined}>Review reported calcium response</Button>
        <Button className="crisis-drug__action" disabled={!trajectory || shift} aria-disabled={demonstrating} onClick={act ? () => act('review-hyperkalemic-conduction-shift-surveillance') : undefined}>Review shifting + glucose surveillance</Button>
      </div>
      <p className="field__hint">These are authored case reports. Calcium does not lower potassium, and ECG appearance does not reliably quantify potassium severity.</p>
    </section>
    <section className="syringe" aria-labelledby="hyperkalemic-conduction-reassessment-title">
      <div id="hyperkalemic-conduction-reassessment-title" className="syringe__name">Remove. Recheck. Hand off.</div>
      <Badge kind="teaching">removal · device restraint · later panel · owner</Badge>
      <div className="syringe__meta">renal pathway · pacing backup · serial ECG + labs</div>
      <p className="syringe__remaining" role="status">{handoff ? 'Reversible contribution preserved · risk + ownership remain' : laterPanel ? 'Later ECG + potassium panel reviewed · handoff due' : calcium && shift && removal ? 'All review lanes complete · allow the later panel' : removal ? 'Removal + device restraint reviewed · other lanes remain' : trajectory ? 'Removal, calcium-response, and shifting review can proceed in parallel' : 'Reconcile the trajectory first'}</p>
      <div className="syringe__presets">
        <Button className="crisis-drug__action" disabled={!trajectory || removal} aria-disabled={demonstrating} onClick={act ? () => act('review-hyperkalemic-conduction-removal-and-device-restraint') : undefined}>Review removal + device restraint</Button>
        <Button className="crisis-drug__action" disabled={!calcium || !shift || !removal || laterPanel} aria-disabled={demonstrating} onClick={act ? () => act('review-hyperkalemic-conduction-later-panel') : undefined}>Review later ECG + potassium panel</Button>
        <Button className="crisis-drug__action" disabled={!laterPanel || handoff} aria-disabled={demonstrating} onClick={act ? () => act('handoff-hyperkalemic-conduction-reassessment') : undefined}>Hand off rhythm + rebound plan</Button>
      </div>
      <p className="field__hint">Pacing does not treat hyperkalemia. No drug, dialysis, pacing, or device is delivered or selected. Improvement does not prove one exclusive cause or permanent resolution.</p>
    </section>
    </div>
  </div>;
}
