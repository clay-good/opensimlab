/**
 * NeurologyMyasthenicCrisisTray, moved out of `ActionCockpit.tsx` unchanged.
 *
 * The cockpit defined this tray inline and rendered it behind a `hasNeurologyMyasthenicCrisisResponse` gate
 * computed from the scenario, so every specialty downloaded it. That gate is now this tray's
 * `supports` predicate in `trays.ts`; the body below is the original.
 */
import type { EquipmentSnapshot } from '@platform/kernel/protocol';
import { myastheniaInlinePrompt } from './tutor/myasthenic-crisis-escalation-guidance';
import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import { TutorPanel } from '@anesthesia/ui/tutor-panel';
import { Button } from '@platform/ui';

export function NeurologyMyasthenicCrisisTray({ assessment, scenarioVersion, onAction, guidance = 'unassisted', demonstrating = false }: {
  assessment?: NonNullable<EquipmentSnapshot['resuscitation']['neurologyMyasthenicCrisisAssessment']>;
  scenarioVersion: string;
  onAction: (action: string) => void;
  guidance?: GuidanceLevel;
  demonstrating?: boolean;
}) {
  const prompt = myastheniaInlinePrompt(guidance, { scenarioVersion, myasthenia: assessment });
  const act = demonstrating ? undefined : onAction;
  const trajectory = assessment?.trajectoryAtTick != null;
  const recognition = assessment?.recognitionAtTick != null;
  const ownership = assessment?.ownershipAtTick != null;
  const causes = assessment?.causesAtTick != null;
  const later = assessment?.laterAtTick != null;
  const handoff = assessment?.handoffAtTick != null;
  return <div className="tray-grid">
    {demonstrating && <p className="syringe__remaining">Watching the worked example. Choose “Take the controls” to make your own decisions.</p>}
    <TutorPanel prompt={demonstrating ? null : prompt} />
    <section className="syringe" aria-labelledby="neurology-myasthenic-crisis-pattern-title">
      <div id="neurology-myasthenic-crisis-pattern-title" className="syringe__name">Watch work, not just oxygen.</div>
      <div className="syringe__meta">45 years · 36-hour decline · weak cough + bulbar fatigue · SpO2 97%</div>
      <p className="syringe__remaining">{causes ? 'Airway safety, likely trigger, test limits, and open causes reviewed.' : ownership ? 'Qualified neurocritical and airway ownership is active · complete the cause review' : recognition ? 'Impending crisis recognized · activate qualified ownership' : trajectory ? 'Rapid multimodal bulbar and ventilatory decline is clear.' : 'Begin with the clock, fatigability, bulbar function, breathing, and whole patient.'}</p>
      <div className="syringe__presets">
        {!trajectory && <Button className="crisis-drug__action" aria-disabled={demonstrating} onClick={act ? () => act('reconcile-neurology-myasthenic-crisis-clock-fatigability-bulbar-respiratory-and-whole-patient') : undefined}>Review rapid weakness trajectory</Button>}
        {trajectory && !recognition && <Button className="crisis-drug__action" aria-disabled={demonstrating} onClick={act ? () => act('recognize-neurology-impending-myasthenic-crisis-without-spo2-or-single-cutoff-reassurance') : undefined}>Recognize impending crisis</Button>}
        {recognition && !ownership && <Button className="crisis-drug__action" aria-disabled={demonstrating} onClick={act ? () => act('activate-neurology-myasthenic-crisis-qualified-neurocritical-and-airway-capable-ownership') : undefined}>Activate airway-ready ownership</Button>}
        {ownership && !causes && <Button className="crisis-drug__action" aria-disabled={demonstrating} onClick={act ? () => act('review-neurology-myasthenic-crisis-secretion-aspiration-infection-medication-and-alternative-causes') : undefined}>Review safety + open causes</Button>}
      </div>
      <p className="field__hint">No single saturation, gas, FVC, MIP, speech, or count value decides the airway. Experienced teams integrate serial respiratory and bulbar function. This lab exposes no learner test, oxygen, ventilation, drug, dose, suction, airway, or procedure control.</p>
    </section>
    <section className="syringe" aria-labelledby="neurology-myasthenic-crisis-later-title">
      <div id="neurology-myasthenic-crisis-later-title" className="syringe__name">Crisis is a clinical transition.</div>
      <div className="syringe__meta">fixed minute-30 report · worse bulbar + ventilatory function · supplied invasive ventilation</div>
      <p className="syringe__remaining" role="status">{handoff ? 'Manifest crisis, airway status, open trigger, treatment, weaning, and recurrence risk handed off.' : later ? 'Qualified-team ventilation establishes the authored manifest-crisis transition. Trigger, response, weaning, and outcome remain open.' : causes ? 'Qualified ownership is active. Review the fixed later bulbar and respiratory report.' : 'Complete recognition, ownership, and safety review before reassessment.'}</p>
      <div className="syringe__presets">
        {causes && !later && <Button className="crisis-drug__action" aria-disabled={demonstrating} onClick={act ? () => act('review-neurology-myasthenic-crisis-strict-later-bulbar-ventilatory-and-supplied-airway-trajectory') : undefined}>Review the minute-30 crisis report</Button>}
        {later && !handoff && <Button className="crisis-drug__action" aria-disabled={demonstrating} onClick={act ? () => act('handoff-neurology-myasthenic-crisis-trigger-treatment-weaning-recurrence-and-active-risk') : undefined}>Hand off crisis + open risk</Button>}
      </div>
      <p className="field__hint">The airway and ventilation course is a fixed qualified-team report, not a learner-performed procedure. It supplies no trigger certainty, treatment choice, response, extubation readiness, recovery, prognosis, or outcome.</p>
    </section>
  </div>;
}
