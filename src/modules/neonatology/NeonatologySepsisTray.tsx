import type { EquipmentSnapshot } from '@platform/kernel/protocol';
import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import { TutorPanel } from '@anesthesia/ui/tutor-panel';
import { neonatalSepsisInlinePrompt } from '../neonatology/tutor/neonatal-sepsis-guidance';
import { Button } from '@platform/ui';

export function NeonatologySepsisTray({ assessment, scenarioVersion, onAction, guidance = 'unassisted', demonstrating = false }: {
  assessment?: NonNullable<EquipmentSnapshot['resuscitation']['neonatologySepsisAssessment']>;
  scenarioVersion: string;
  onAction: (action: string) => void;
  guidance?: GuidanceLevel;
  demonstrating?: boolean;
}) {
  const prompt = neonatalSepsisInlinePrompt(guidance, { scenarioVersion, neonatalSepsis: assessment });
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
    <section className="syringe" aria-labelledby="neonatology-sepsis-now-title">
      <div id="neonatology-sepsis-now-title" className="syringe__name">Follow the change, not just the risk.</div>
      <p className="syringe__remaining">Connect maternal context, clocks, new multisystem illness, parent, and whole dyad. A score or isolated result never overrules the clinically ill newborn.</p>
      <div className="crisis-drug__actions">
        {!support && <Button className="crisis-drug__action" aria-disabled={demonstrating} onClick={act ? () => act('activate-neonatal-sepsis-newborn-infection-respiratory-circulatory-and-family-support') : undefined}>Confirm prepared support</Button>}
        {support && !context && <Button className="crisis-drug__action" aria-disabled={demonstrating} onClick={act ? () => act('reconcile-neonatal-sepsis-maternal-risk-clock-clinical-change-physiology-and-whole-dyad') : undefined}>Connect newborn + whole dyad</Button>}
        {context && !recognition && <Button className="crisis-drug__action" aria-disabled={demonstrating} onClick={act ? () => act('recognize-clinically-ill-newborn-sepsis-risk-without-calculator-laboratory-or-diagnosis-closure') : undefined}>Recognize the urgent pattern</Button>}
        {recognition && !readiness && <Button className="crisis-drug__action" aria-disabled={demonstrating} onClick={act ? () => act('review-qualified-neonatal-sepsis-culture-antimicrobial-support-investigation-and-reassessment-boundaries') : undefined}>Review qualified boundaries</Button>}
      </div>
    </section>
    <section className="syringe" aria-labelledby="neonatology-sepsis-later-title">
      <div id="neonatology-sepsis-later-title" className="syringe__name">Partial improvement is not microbiologic closure.</div>
      <p className="syringe__remaining" role="status">{handoff ? 'Respiratory, circulatory, neurologic, culture, family, stewardship, disposition, and outcome risks handed off.' : reassessment ? 'The supplied physiology is partly better while culture remains pending. Diagnosis, exclusion, durable stability, duration, and outcomes remain open.' : readiness ? 'Qualified evaluation, care, and serial reassessment continue. Review the fixed report after time passes.' : support ? 'Prepared support is present. Connect the whole newborn and dyad before naming the pattern.' : 'Begin with calm shared ownership. You can pause or leave this practice at any time.'}</p>
      <div className="crisis-drug__actions">
        {readiness && !reassessment && <Button className="crisis-drug__action" aria-disabled={demonstrating} onClick={act ? () => act('review-neonatal-sepsis-fixed-one-hour-qualified-report') : undefined}>Review the fixed 1-hour report</Button>}
        {reassessment && !handoff && <Button className="crisis-drug__action" aria-disabled={demonstrating} onClick={act ? () => act('handoff-neonatal-sepsis-respiratory-circulatory-neurologic-culture-family-and-outcome-risk') : undefined}>Hand off active newborn risk</Button>}
      </div>
    </section>
  </>;
}
