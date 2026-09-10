import type { EquipmentSnapshot } from '@platform/kernel/protocol';
import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import { TutorPanel } from '@anesthesia/ui/tutor-panel';
import { tensionPneumothoraxInlinePrompt } from '../neonatology/tutor/neonatal-tension-pneumothorax-guidance';
import { Button } from '@platform/ui';

export function NeonatologyTensionPneumothoraxTray({ assessment, scenarioVersion, onAction, guidance = 'unassisted', demonstrating = false }: {
  assessment?: NonNullable<EquipmentSnapshot['resuscitation']['neonatologyTensionPneumothoraxAssessment']>;
  scenarioVersion: string;
  onAction: (action: string) => void;
  guidance?: GuidanceLevel;
  demonstrating?: boolean;
}) {
  const prompt = tensionPneumothoraxInlinePrompt(guidance, { scenarioVersion, tensionPneumothorax: assessment });
  const act = demonstrating ? undefined : onAction;
  const support = assessment?.supportAtTick != null;
  const context = assessment?.contextAtTick != null;
  const recognition = assessment?.recognitionAtTick != null;
  const readiness = assessment?.readinessAtTick != null;
  const reassessment = assessment?.reassessmentAtTick != null;
  const handoff = assessment?.handoffAtTick != null;
  return <>
    {demonstrating && <p className="syringe__remaining">Watching the worked example. Choose “Take the controls” to make your own decisions.</p>}
    <TutorPanel prompt={demonstrating ? null : prompt} />
    <section className="syringe" aria-labelledby="neonatology-tension-pneumothorax-now-title">
      <div id="neonatology-tension-pneumothorax-now-title" className="syringe__name">Sudden asymmetry changes the emergency.</div>
      <p className="syringe__remaining">Connect the support, clock, oxygen need, unilateral findings, perfusion, alternatives, parent, and whole dyad. Keep imaging and procedural choices with the qualified team.</p>
      <div className="crisis-drug__actions">
        {!support && <Button className="crisis-drug__action" aria-disabled={demonstrating} onClick={act ? () => act('activate-neonatal-tension-pneumothorax-respiratory-decompression-monitoring-and-family-support') : undefined}>Confirm prepared support</Button>}
        {support && !context && <Button className="crisis-drug__action" aria-disabled={demonstrating} onClick={act ? () => act('reconcile-neonatal-tension-pneumothorax-support-clock-sudden-change-asymmetry-perfusion-and-whole-dyad') : undefined}>Connect newborn + whole dyad</Button>}
        {context && !recognition && <Button className="crisis-drug__action" aria-disabled={demonstrating} onClick={act ? () => act('recognize-suspected-neonatal-tension-pneumothorax-with-cardiopulmonary-compromise-without-imaging-delay') : undefined}>Recognize the urgent pattern</Button>}
        {recognition && !readiness && <Button className="crisis-drug__action" aria-disabled={demonstrating} onClick={act ? () => act('review-qualified-neonatal-tension-pneumothorax-oxygenation-ventilation-decompression-drain-and-reassessment-boundaries') : undefined}>Review qualified boundaries</Button>}
      </div>
    </section>
    <section className="syringe" aria-labelledby="neonatology-tension-pneumothorax-later-title">
      <div id="neonatology-tension-pneumothorax-later-title" className="syringe__name">A pressure release is a beginning, not closure.</div>
      <p className="syringe__remaining" role="status">{handoff ? 'Air-leak, lung-support, circulatory, analgesia, imaging, family, disposition, and outcome risks handed off.' : reassessment ? 'The supplied physiology improves, but asymmetry persists. Diagnosis, alternatives, recurrence, durable response, and outcomes remain open.' : readiness ? 'Qualified emergency care and serial reassessment continue. Review the fixed report after time passes.' : support ? 'Prepared support is present. Connect the whole newborn and dyad before naming the pattern.' : 'Begin with calm shared ownership. You can pause or leave this practice at any time.'}</p>
      <div className="crisis-drug__actions">
        {readiness && !reassessment && <Button className="crisis-drug__action" aria-disabled={demonstrating} onClick={act ? () => act('review-neonatal-tension-pneumothorax-fixed-two-minute-qualified-report') : undefined}>Review the fixed 2-minute report</Button>}
        {reassessment && !handoff && <Button className="crisis-drug__action" aria-disabled={demonstrating} onClick={act ? () => act('handoff-neonatal-tension-pneumothorax-air-leak-lung-support-circulatory-family-and-outcome-risk') : undefined}>Hand off active newborn risk</Button>}
      </div>
    </section>
  </>;
}
