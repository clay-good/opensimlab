/**
 * AcuteTracheostomyObstructionTray, moved out of `ActionCockpit.tsx` unchanged.
 *
 * The cockpit defined this tray inline and rendered it behind a `hasAcuteTracheostomyObstructionResponse` gate
 * computed from the scenario, so every specialty downloaded it. The gate is now this tray's
 * `supports` predicate in `trays.ts`; the body below is the original.
 */
import type { EquipmentSnapshot } from '@platform/kernel/protocol';
import { acuteTracheostomyObstructionInlinePrompt } from './tutor/acute-tracheostomy-obstruction-guidance';
import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import { TutorPanel, WatchingNotice } from '@anesthesia/ui/tutor-panel';
import { Badge, Button } from '@platform/ui';

export function AcuteTracheostomyObstructionTray({ assessment, scenarioVersion, guidance = 'unassisted', demonstrating = false, onAction }: {
  assessment?: NonNullable<EquipmentSnapshot['resuscitation']['acuteTracheostomyObstructionAssessment']>;
  scenarioVersion: string;
  guidance?: GuidanceLevel;
  demonstrating?: boolean;
  onAction: (action: string) => void;
}) {
  const recognition = assessment?.recognitionAtTick != null;
  const support = assessment?.supportAtTick != null;
  const pathway = assessment?.devicePathwayAtTick != null;
  const correction = assessment?.innerCannulaAtTick != null;
  const restoration = assessment?.restorationAtTick != null;
  const handoff = assessment?.handoffAtTick != null;
  const unsupported = assessment?.lastUnsupportedChoice;
  const prompt = demonstrating ? null
    : acuteTracheostomyObstructionInlinePrompt(guidance, { scenarioVersion, patient: assessment });
  const act = demonstrating ? undefined : onAction;
  return <div style={{ display: 'grid', gap: 'var(--space-4)' }}>
    <WatchingNotice demonstrating={demonstrating} />
    <TutorPanel prompt={prompt} />
    <div className="tray-grid">
    <section className="syringe" aria-labelledby="tracheostomy-obstruction-person-title">
      <div id="tracheostomy-obstruction-person-title" className="syringe__name">The person comes before the tube.</div>
      <Badge kind="teaching">tracheostomy · not laryngectomy · upper airway patent</Badge>
      <div className="syringe__meta">SpO₂ 96 → 82% · RR 18 → 34 · pulse + spontaneous effort</div>
      <p className="syringe__remaining" role="status">
        {pathway ? 'Declared inner-cannula branch confirmed · restore the gas path with qualified help'
          : support ? 'Both possible airways supported · review this declared device path'
            : unsupported === 'imaging' ? 'Oxygenation and expert help cannot wait for imaging'
              : unsupported === 'unverified-ventilation' ? 'Do not ventilate through an unverified path'
                : recognition ? 'Urgent patency failure · help and oxygenation come first'
                  : 'Start with anatomy, pulse, breathing, airflow, and signal'}
      </p>
      <div className="syringe__presets">
        {!recognition && <Button className="crisis-drug__action"
          aria-disabled={demonstrating} onClick={act ? () => act('reconcile-acute-tracheostomy-obstruction-anatomy-and-patency') : undefined}>Review person + airway map</Button>}
        {recognition && !support && <>
          <Button className="crisis-drug__action" aria-disabled={demonstrating} onClick={act ? () => act('activate-acute-tracheostomy-obstruction-help-and-oxygenation') : undefined}>Call airway help + support both routes</Button>
          <Button className="crisis-drug__action" aria-disabled={demonstrating} onClick={act ? () => act('wait-for-acute-tracheostomy-obstruction-imaging') : undefined}>Wait for imaging</Button>
          <Button className="crisis-drug__action" aria-disabled={demonstrating} onClick={act ? () => act('ventilate-through-unverified-tracheostomy') : undefined}>Ventilate through the tube now</Button>
        </>}
        {support && !pathway && <Button className="crisis-drug__action"
          aria-disabled={demonstrating} onClick={act ? () => act('review-acute-tracheostomy-obstruction-device-pathway') : undefined}>Review declared device pathway</Button>}
      </div>
      <p className="field__hint">This exact case has a tracheostomy, a documented patent native upper airway, and ongoing spontaneous breathing. Qualified staff deliver oxygen to face and tracheostomy off-screen; this does not generalize to laryngectomy.</p>
    </section>
    <section className="syringe" aria-labelledby="tracheostomy-obstruction-restoration-title">
      <div id="tracheostomy-obstruction-restoration-title" className="syringe__name">Restore airflow. Then prove it.</div>
      <Badge kind="teaching">declared device · expert action · airflow · waveform · recurrence</Badge>
      <div className="syringe__meta">cuffless dual-cannula · established stoma · outer tube retained</div>
      <p className="syringe__remaining" role="status">
        {handoff ? 'Airway state, recurrence risk, plan, equipment, and owners handed off'
          : restoration ? 'Immediate patency restored · durable risk remains'
            : correction ? 'Canonical gas path restored · advance time for whole-person proof'
              : unsupported === 'force-catheter' ? 'Never force past resistance'
                : unsupported === 'whole-tube' ? 'Use the simpler declared inner-cannula branch first'
                  : pathway ? 'Connect the qualified inner-cannula action'
                    : 'Support and device review come first'}
      </p>
      <div className="syringe__presets">
        {pathway && !correction && <>
          <Button className="crisis-drug__action" aria-disabled={demonstrating} onClick={act ? () => act('record-acute-tracheostomy-obstruction-inner-cannula-removal') : undefined}>Connect qualified inner-cannula action</Button>
          <Button className="crisis-drug__action" aria-disabled={demonstrating} onClick={act ? () => act('force-acute-tracheostomy-obstruction-catheter') : undefined}>Force the catheter through</Button>
          <Button className="crisis-drug__action" aria-disabled={demonstrating} onClick={act ? () => act('replace-whole-tracheostomy-first') : undefined}>Replace the whole tube first</Button>
        </>}
        {correction && !restoration && <Button className="crisis-drug__action"
          aria-disabled={demonstrating} onClick={act ? () => act('reassess-acute-tracheostomy-obstruction-restoration') : undefined}>Review 2-minute response</Button>}
        {restoration && !handoff && <Button className="crisis-drug__action"
          aria-disabled={demonstrating} onClick={act ? () => act('handoff-acute-tracheostomy-obstruction-reassessment') : undefined}>Hand off active airway risk</Button>}
      </div>
      <p className="field__hint">The learner does not inspect, handle, remove, suction, exchange, ventilate, or intubate. Worsening or unresolved obstruction continues down the local emergency pathway outside this bounded lesson.</p>
    </section>
    </div>
  </div>;
}
