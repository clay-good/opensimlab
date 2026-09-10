import type { EquipmentSnapshot } from '@platform/kernel/protocol';
import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import { TutorPanel } from '@anesthesia/ui/tutor-panel';
import { anticholinergicInlinePrompt } from '../toxicology/tutor/anticholinergic-hyperthermia-delirium-guidance';
import { Button } from '@platform/ui';

export function ToxicologyAnticholinergicTray({ assessment, scenarioVersion, onAction, guidance = 'unassisted', demonstrating = false }: {
  assessment?: NonNullable<EquipmentSnapshot['resuscitation']['toxicologyAnticholinergicAssessment']>;
  scenarioVersion: string;
  onAction: (action: string) => void;
  guidance?: GuidanceLevel;
  demonstrating?: boolean;
}) {
  const prompt = anticholinergicInlinePrompt(guidance, { scenarioVersion, anticholinergic: assessment });
  const act = demonstrating ? undefined : onAction;
  const trajectory = assessment?.trajectoryAtTick != null;
  const recognition = assessment?.recognitionAtTick != null;
  const support = assessment?.supportAtTick != null;
  const evidence = assessment?.evidenceAtTick != null;
  const reassessment = assessment?.reassessmentAtTick != null;
  const handoff = assessment?.handoffAtTick != null;
  return <>
    {demonstrating && <p className="syringe__remaining">Watching the worked example. Choose “Take the controls” to make your own decisions.</p>}
    <TutorPanel prompt={demonstrating ? null : prompt} />
    <section className="syringe" aria-labelledby="toxicology-anticholinergic-early-title">
      <div id="toxicology-anticholinergic-early-title" className="syringe__name">Cool the patient. Keep the differential warm.</div>
      <p className="syringe__remaining">Begin with product, clock, delirium, temperature, dry surfaces, retention, ECG, and whole person.</p>
      <div className="crisis-drug__actions">
        {!trajectory && <Button className="crisis-drug__action" aria-disabled={demonstrating} onClick={act ? () => act('reconcile-toxicology-anticholinergic-product-clock-delirium-temperature-dryness-retention-ecg-and-whole-patient') : undefined}>Connect heat + delirium</Button>}
        {trajectory && !recognition && <Button className="crisis-drug__action" aria-disabled={demonstrating} onClick={act ? () => act('recognize-toxicology-anticholinergic-central-and-peripheral-pattern-without-mnemonic-temperature-or-pupil-only-closure') : undefined}>Recognize the whole pattern</Button>}
        {recognition && !support && <Button className="crisis-drug__action" aria-disabled={demonstrating} onClick={act ? () => act('activate-toxicology-anticholinergic-resuscitation-cooling-airway-toxicology-monitoring-and-compassionate-safety-ownership') : undefined}>Build a calm rescue circle</Button>}
        {support && !evidence && <Button className="crisis-drug__action" aria-disabled={demonstrating} onClick={act ? () => act('review-toxicology-anticholinergic-supplied-temperature-cns-ecg-renal-ck-retention-and-differential-boundary') : undefined}>Review heat + hidden harm</Button>}
      </div>
    </section>
    <section className="syringe" aria-labelledby="toxicology-anticholinergic-later-title">
      <div id="toxicology-anticholinergic-later-title" className="syringe__name">A cooler number does not close the case.</div>
      <p className="syringe__remaining" role="status">{handoff ? 'Temperature, delirium, airway, ECG, retention, renal and CK injury, seizure, coingestion, safety, and outcome uncertainty handed off.' : reassessment ? 'Temperature and agitation improved while confusion and urinary retention persisted. Durable cooling and treatment effect remain unproven.' : evidence ? 'Temperature, CNS, ECG, renal, CK, retention, coingestion, and differential evidence stay coupled. Record qualified intent after time passes.' : support ? 'Cooling, resuscitation, airway, toxicology, bladder, renal, monitoring, and compassionate safety ownership are active. Review the supplied evidence.' : 'Complete whole-pattern recognition and support ownership before antidote-boundary review.'}</p>
      <div className="crisis-drug__actions">
        {evidence && !reassessment && <Button className="crisis-drug__action" aria-disabled={demonstrating} onClick={act ? () => act('record-toxicology-anticholinergic-bounded-qualified-cooling-support-sedation-seizure-surveillance-and-physostigmine-eligibility-intent-with-strict-later-review') : undefined}>Record support intent + reassess</Button>}
        {reassessment && !handoff && <Button className="crisis-drug__action" aria-disabled={demonstrating} onClick={act ? () => act('handoff-toxicology-anticholinergic-rebound-delirium-hyperthermia-retention-rhabdomyolysis-seizure-coingestion-and-active-risk') : undefined}>Hand off what can rebound</Button>}
      </div>
    </section>
  </>;
}
