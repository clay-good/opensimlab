import type { EquipmentSnapshot } from '@platform/kernel/protocol';
import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import { TutorPanel } from '@anesthesia/ui/tutor-panel';
import { serotoninInlinePrompt } from '../toxicology/tutor/serotonin-toxicity-hyperthermia-clonus-guidance';
import { Button } from '@platform/ui';

export function ToxicologySerotoninTray({ assessment, scenarioVersion, onAction, guidance = 'unassisted', demonstrating = false }: {
  assessment?: NonNullable<EquipmentSnapshot['resuscitation']['toxicologySerotoninAssessment']>;
  scenarioVersion: string;
  onAction: (action: string) => void;
  guidance?: GuidanceLevel;
  demonstrating?: boolean;
}) {
  const prompt = serotoninInlinePrompt(guidance, { scenarioVersion, serotonin: assessment });
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
    <section className="syringe" aria-labelledby="toxicology-serotonin-early-title">
      <div id="toxicology-serotonin-early-title" className="syringe__name">Follow the clonus, not just the thermometer.</div>
      <p className="syringe__remaining">Begin with agents, clock, mind, sweating, bowel activity, clonus, reflexes, tone, temperature, and whole person.</p>
      <div className="crisis-drug__actions">
        {!trajectory && <Button className="crisis-drug__action" aria-disabled={demonstrating} onClick={act ? () => act('reconcile-toxicology-serotonin-agents-clock-mental-autonomic-neuromuscular-temperature-and-whole-patient') : undefined}>Connect interaction + pattern</Button>}
        {trajectory && !recognition && <Button className="crisis-drug__action" aria-disabled={demonstrating} onClick={act ? () => act('recognize-toxicology-serotonin-coupled-pattern-without-hunter-clonus-temperature-or-medication-list-only-closure') : undefined}>Recognize the whole pattern</Button>}
        {recognition && !support && <Button className="crisis-drug__action" aria-disabled={demonstrating} onClick={act ? () => act('activate-toxicology-serotonin-resuscitation-cooling-airway-toxicology-monitoring-and-compassionate-safety-ownership') : undefined}>Build a calm rescue circle</Button>}
        {support && !evidence && <Button className="crisis-drug__action" aria-disabled={demonstrating} onClick={act ? () => act('review-toxicology-serotonin-supplied-cns-autonomic-neuromuscular-temperature-ecg-renal-ck-and-differential-boundary') : undefined}>Review clonus + hidden harm</Button>}
      </div>
    </section>
    <section className="syringe" aria-labelledby="toxicology-serotonin-later-title">
      <div id="toxicology-serotonin-later-title" className="syringe__name">Cooler is better. Persistent clonus keeps the story open.</div>
      <p className="syringe__remaining" role="status">{handoff ? 'Temperature, clonus, rigidity, airway, renal and CK injury, seizure, coingestion, safety, and outcome uncertainty handed off.' : reassessment ? 'Temperature and agitation improved while clonus and hyperreflexia persisted. Durable cooling and neuromuscular recovery remain unproven.' : evidence ? 'CNS, autonomic, neuromuscular, temperature, ECG, renal, CK, coingestion, and differential evidence stay coupled. Record qualified intent after time passes.' : support ? 'Cooling, resuscitation, airway, toxicology, renal, monitoring, and compassionate safety ownership are active. Review the supplied evidence.' : 'Complete whole-pattern recognition and support ownership before rescue-boundary review.'}</p>
      <div className="crisis-drug__actions">
        {evidence && !reassessment && <Button className="crisis-drug__action" aria-disabled={demonstrating} onClick={act ? () => act('record-toxicology-serotonin-bounded-qualified-source-cessation-cooling-support-sedation-seizure-surveillance-airway-and-antagonist-intent-with-strict-later-review') : undefined}>Record rescue intent + reassess</Button>}
        {reassessment && !handoff && <Button className="crisis-drug__action" aria-disabled={demonstrating} onClick={act ? () => act('handoff-toxicology-serotonin-rebound-hyperthermia-clonus-rigidity-seizure-rhabdomyolysis-coingestion-airway-and-active-risk') : undefined}>Hand off what can rebound</Button>}
      </div>
    </section>
  </>;
}
