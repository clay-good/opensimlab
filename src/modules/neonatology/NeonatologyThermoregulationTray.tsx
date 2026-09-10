import type { EquipmentSnapshot } from '@platform/kernel/protocol';
import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import { TutorPanel } from '@anesthesia/ui/tutor-panel';
import { thermoregulationInlinePrompt } from '../neonatology/tutor/thermoregulation-failure-guidance';
import { Button } from '@platform/ui';

export function NeonatologyThermoregulationTray({ assessment, scenarioVersion, onAction, guidance = 'unassisted', demonstrating = false }: {
  assessment?: NonNullable<EquipmentSnapshot['resuscitation']['neonatologyThermoregulationAssessment']>;
  scenarioVersion: string;
  onAction: (action: string) => void;
  guidance?: GuidanceLevel;
  demonstrating?: boolean;
}) {
  const prompt = thermoregulationInlinePrompt(guidance, { scenarioVersion, thermoregulation: assessment });
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
    <section className="syringe" aria-labelledby="neonatology-thermoregulation-now-title">
      <div id="neonatology-thermoregulation-now-title" className="syringe__name">Warmth is a chain, not a switch.</div>
      <p className="syringe__remaining">Connect gestation, temperatures, environment, transfer, behavior, feeding, physiology, parent, and whole dyad. Keep illness and therapeutic-cooling boundaries open.</p>
      <div className="crisis-drug__actions">
        {!support && <Button className="crisis-drug__action" aria-disabled={demonstrating} onClick={act ? () => act('activate-neonatal-thermoregulation-newborn-thermal-glucose-feeding-and-family-support') : undefined}>Confirm prepared support</Button>}
        {support && !context && <Button className="crisis-drug__action" aria-disabled={demonstrating} onClick={act ? () => act('reconcile-neonatal-thermoregulation-gestation-admission-temperature-environment-trajectory-physiology-and-whole-dyad') : undefined}>Connect newborn + whole dyad</Button>}
        {context && !recognition && <Button className="crisis-drug__action" aria-disabled={demonstrating} onClick={act ? () => act('recognize-unintentional-neonatal-hypothermia-requiring-qualified-rewarming-without-rate-cause-or-diagnosis-closure') : undefined}>Recognize the urgent pattern</Button>}
        {recognition && !readiness && <Button className="crisis-drug__action" aria-disabled={demonstrating} onClick={act ? () => act('review-qualified-neonatal-rewarming-monitoring-glucose-feeding-cause-and-hyperthermia-prevention-boundaries') : undefined}>Review qualified boundaries</Button>}
      </div>
    </section>
    <section className="syringe" aria-labelledby="neonatology-thermoregulation-later-title">
      <div id="neonatology-thermoregulation-later-title" className="syringe__name">A rising temperature is progress, not closure.</div>
      <p className="syringe__remaining" role="status">{handoff ? 'Temperature, glucose, feeding, infection, neurologic, environment, family, disposition, and outcome risks handed off.' : reassessment ? 'The supplied temperature is rising but remains below normal. Rate, cause, durable stability, feeding, and outcomes remain open.' : readiness ? 'Qualified warm-chain care and serial reassessment continue. Review the fixed report after time passes.' : support ? 'Prepared support is present. Connect the whole newborn and dyad before naming the pattern.' : 'Begin with calm shared ownership. You can pause or leave this practice at any time.'}</p>
      <div className="crisis-drug__actions">
        {readiness && !reassessment && <Button className="crisis-drug__action" aria-disabled={demonstrating} onClick={act ? () => act('review-neonatal-thermoregulation-fixed-forty-five-minute-qualified-report') : undefined}>Review the fixed 45-minute report</Button>}
        {reassessment && !handoff && <Button className="crisis-drug__action" aria-disabled={demonstrating} onClick={act ? () => act('handoff-neonatal-thermoregulation-temperature-glucose-feeding-infection-neurologic-family-and-outcome-risk') : undefined}>Hand off active newborn risk</Button>}
      </div>
    </section>
  </>;
}
