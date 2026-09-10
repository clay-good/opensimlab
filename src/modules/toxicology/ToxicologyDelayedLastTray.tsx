import type { EquipmentSnapshot } from '@platform/kernel/protocol';
import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import { TutorPanel } from '@anesthesia/ui/tutor-panel';
import { delayedLastInlinePrompt } from '../toxicology/tutor/delayed-local-anesthetic-cns-cardiac-toxicity-guidance';
import { Button } from '@platform/ui';

export function ToxicologyDelayedLastTray({ assessment, scenarioVersion, onAction, guidance = 'unassisted', demonstrating = false }: {
  assessment?: NonNullable<EquipmentSnapshot['resuscitation']['toxicologyDelayedLastAssessment']>;
  scenarioVersion: string;
  onAction: (action: string) => void;
  guidance?: GuidanceLevel;
  demonstrating?: boolean;
}) {
  const prompt = delayedLastInlinePrompt(guidance, { scenarioVersion, delayedLast: assessment });
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
    <section className="syringe" aria-labelledby="toxicology-delayed-last-early-title">
      <div id="toxicology-delayed-last-early-title" className="syringe__name">The quiet cues were part of the crisis.</div>
      <p className="syringe__remaining">Begin with source, long clock, short prodrome, seizure, breathing, conduction, perfusion, and the whole person.</p>
      <div className="crisis-drug__actions">
        {!trajectory && <Button className="crisis-drug__action" aria-disabled={demonstrating} onClick={act ? () => act('reconcile-toxicology-delayed-last-source-clock-prodrome-seizure-cardiac-and-whole-patient') : undefined}>Connect source + evolution</Button>}
        {trajectory && !recognition && <Button className="crisis-drug__action" aria-disabled={demonstrating} onClick={act ? () => act('recognize-toxicology-delayed-last-coupled-pattern-without-classic-sequence-clock-symptom-or-ecg-only-closure') : undefined}>Recognize the whole pattern</Button>}
        {recognition && !support && <Button className="crisis-drug__action" aria-disabled={demonstrating} onClick={act ? () => act('activate-toxicology-delayed-last-source-airway-seizure-cardiac-toxicology-lipid-and-refractory-rescue-ownership') : undefined}>Bring rescue owners together</Button>}
        {support && !evidence && <Button className="crisis-drug__action" aria-disabled={demonstrating} onClick={act ? () => act('review-toxicology-delayed-last-supplied-source-delivery-cns-ecg-perfusion-acid-base-electrolyte-and-differential-boundary') : undefined}>Review source + hidden harm</Button>}
      </div>
    </section>
    <section className="syringe" aria-labelledby="toxicology-delayed-last-later-title">
      <div id="toxicology-delayed-last-later-title" className="syringe__name">A steadier rhythm is a checkpoint, not an ending.</div>
      <p className="syringe__remaining" role="status">{handoff ? 'Seizure, rhythm, conduction, perfusion, airway, acid-base, source, lipid, refractory-rescue, and outcome uncertainty handed off.' : reassessment ? 'Rhythm, pressure, breathing, and QRS improved. Durable seizure control, recovery, source completeness, lipid safety, and treatment effect remain unproven.' : evidence ? 'Source-delivery, CNS, ECG, perfusion, acid-base, electrolyte, coingestion, and differential evidence stay coupled. Record qualified intent after time passes.' : support ? 'Source, airway, seizure, cardiac, toxicology, lipid, and refractory-rescue ownership are active. Review the supplied evidence.' : 'Complete whole-pattern recognition and qualified ownership before the rescue-boundary review.'}</p>
      <div className="crisis-drug__actions">
        {evidence && !reassessment && <Button className="crisis-drug__action" aria-disabled={demonstrating} onClick={act ? () => act('record-toxicology-delayed-last-bounded-qualified-source-airway-seizure-lipid-acid-base-modified-resuscitation-and-ecls-intent-with-strict-later-review') : undefined}>Record rescue intent + reassess</Button>}
        {reassessment && !handoff && <Button className="crisis-drug__action" aria-disabled={demonstrating} onClick={act ? () => act('handoff-toxicology-delayed-last-recurrent-seizure-arrhythmia-shock-airway-acidemia-source-lipid-and-refractory-risk') : undefined}>Hand off what can return</Button>}
      </div>
    </section>
  </>;
}
