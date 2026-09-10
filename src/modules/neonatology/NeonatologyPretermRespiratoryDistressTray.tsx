import type { EquipmentSnapshot } from '@platform/kernel/protocol';
import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import { TutorPanel } from '@anesthesia/ui/tutor-panel';
import { pretermRespiratoryDistressInlinePrompt } from '../neonatology/tutor/preterm-respiratory-distress-guidance';
import { Button } from '@platform/ui';

export function NeonatologyPretermRespiratoryDistressTray({ assessment, scenarioVersion, onAction, guidance = 'unassisted', demonstrating = false }: {
  assessment?: NonNullable<EquipmentSnapshot['resuscitation']['neonatologyPretermRespiratoryDistressAssessment']>;
  scenarioVersion: string;
  onAction: (action: string) => void;
  guidance?: GuidanceLevel;
  demonstrating?: boolean;
}) {
  const prompt = pretermRespiratoryDistressInlinePrompt(guidance, { scenarioVersion, pretermRespiratoryDistress: assessment });
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
    <section className="syringe" aria-labelledby="neonatology-preterm-respiratory-now-title">
      <div id="neonatology-preterm-respiratory-now-title" className="syringe__name">Support the breaths already there.</div>
      <p className="syringe__remaining">Connect gestation, spontaneous breathing, work, heart rate, preductal oxygenation, warmth, parent, and whole dyad. Every device and physical care step stays with the qualified team.</p>
      <div className="crisis-drug__actions">
        {!support && <Button className="crisis-drug__action" aria-disabled={demonstrating} onClick={act ? () => act('activate-preterm-respiratory-distress-newborn-respiratory-thermal-and-family-support') : undefined}>Confirm prepared support</Button>}
        {support && !context && <Button className="crisis-drug__action" aria-disabled={demonstrating} onClick={act ? () => act('reconcile-preterm-respiratory-distress-gestation-breathing-work-heart-rate-oxygenation-temperature-and-whole-dyad') : undefined}>Connect newborn + whole dyad</Button>}
        {context && !recognition && <Button className="crisis-drug__action" aria-disabled={demonstrating} onClick={act ? () => act('recognize-spontaneously-breathing-preterm-respiratory-distress-suitable-for-qualified-initial-cpap') : undefined}>Recognize the support branch</Button>}
        {recognition && !readiness && <Button className="crisis-drug__action" aria-disabled={demonstrating} onClick={act ? () => act('review-qualified-cpap-oxygen-thermal-monitoring-and-escalation-boundaries') : undefined}>Review qualified boundaries</Button>}
      </div>
    </section>
    <section className="syringe" aria-labelledby="neonatology-preterm-respiratory-later-title">
      <div id="neonatology-preterm-respiratory-later-title" className="syringe__name">Gentle support still needs close watching.</div>
      <p className="syringe__remaining" role="status">{handoff ? 'Respiratory, oxygen, thermal, glucose, infection, family, transfer, and outcome risks handed off.' : reassessment ? 'The supplied report remains CPAP-supported. Ventilation, disease, durable stability, and outcomes remain open.' : readiness ? 'Qualified respiratory and thermal support continue. Review the fixed report after time passes.' : support ? 'Prepared support is present. Connect the whole newborn and dyad before naming the branch.' : 'Begin with calm shared ownership. You can pause or leave this practice at any time.'}</p>
      <div className="crisis-drug__actions">
        {readiness && !reassessment && <Button className="crisis-drug__action" aria-disabled={demonstrating} onClick={act ? () => act('review-preterm-respiratory-distress-fixed-ten-minute-qualified-report') : undefined}>Review the fixed 10-minute report</Button>}
        {reassessment && !handoff && <Button className="crisis-drug__action" aria-disabled={demonstrating} onClick={act ? () => act('handoff-preterm-respiratory-distress-breathing-oxygen-thermal-glucose-infection-family-and-outcome-risk') : undefined}>Hand off active newborn risk</Button>}
      </div>
    </section>
  </>;
}
