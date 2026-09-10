import type { EquipmentSnapshot } from '@platform/kernel/protocol';
import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import { TutorPanel } from '@anesthesia/ui/tutor-panel';
import { tricyclicInlinePrompt } from '../toxicology/tutor/tricyclic-sodium-channel-cardiotoxicity-guidance';
import { Button } from '@platform/ui';

export function ToxicologyTricyclicTray({ assessment, scenarioVersion, onAction, guidance = 'unassisted', demonstrating = false }: {
  assessment?: NonNullable<EquipmentSnapshot['resuscitation']['toxicologyTricyclicAssessment']>;
  scenarioVersion: string;
  onAction: (action: string) => void;
  guidance?: GuidanceLevel;
  demonstrating?: boolean;
}) {
  const prompt = tricyclicInlinePrompt(guidance, { scenarioVersion, tricyclic: assessment });
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
    <section className="syringe" aria-labelledby="toxicology-tricyclic-early-title">
      <div id="toxicology-tricyclic-early-title" className="syringe__name">The tracing belongs to a whole patient.</div>
      <p className="syringe__remaining">Begin with product, clock, mentation, seizure, perfusion, supplied ECG, oxygenation, and whole person.</p>
      <div className="crisis-drug__actions">
        {!trajectory && <Button className="crisis-drug__action" aria-disabled={demonstrating} onClick={act ? () => act('reconcile-toxicology-tricyclic-product-clock-cns-seizure-perfusion-ecg-and-whole-patient') : undefined}>Connect patient + tracing</Button>}
        {trajectory && !recognition && <Button className="crisis-drug__action" aria-disabled={demonstrating} onClick={act ? () => act('recognize-toxicology-tricyclic-sodium-channel-cardiotoxicity-pattern-without-qrs-only-closure') : undefined}>Recognize the electrical pattern</Button>}
        {recognition && !support && <Button className="crisis-drug__action" aria-disabled={demonstrating} onClick={act ? () => act('activate-toxicology-tricyclic-poison-center-resuscitation-cardiac-airway-seizure-and-safety-ownership') : undefined}>Build the rescue circle</Button>}
        {support && !evidence && <Button className="crisis-drug__action" aria-disabled={demonstrating} onClick={act ? () => act('review-toxicology-tricyclic-supplied-ecg-perfusion-acid-base-electrolyte-coingestion-and-rescue-boundary') : undefined}>Review the coupled risk</Button>}
      </div>
    </section>
    <section className="syringe" aria-labelledby="toxicology-tricyclic-later-title">
      <div id="toxicology-tricyclic-later-title" className="syringe__name">A narrower tracing is a checkpoint, not an all-clear.</div>
      <p className="syringe__remaining" role="status">{handoff ? 'Serial conduction, perfusion, CNS, seizure, acid-base, recurrence, rescue, safety, and outcome uncertainty handed off.' : reassessment ? 'The fixed electrical, perfusion, and mental-state report improved. Durable stability and treatment effect remain unproven.' : evidence ? 'ECG, perfusion, CNS, seizure, acid-base, electrolytes, and rescue readiness stay coupled. Record qualified intent after time passes.' : support ? 'Qualified toxicology, resuscitation, cardiac, airway, seizure, and safety ownership are active. Review the supplied evidence.' : 'Complete whole-pattern recognition and rescue ownership before treatment-boundary review.'}</p>
      <div className="crisis-drug__actions">
        {evidence && !reassessment && <Button className="crisis-drug__action" aria-disabled={demonstrating} onClick={act ? () => act('record-toxicology-tricyclic-bounded-qualified-bicarbonate-and-rescue-intent-with-strict-later-review') : undefined}>Record intent + reassess</Button>}
        {reassessment && !handoff && <Button className="crisis-drug__action" aria-disabled={demonstrating} onClick={act ? () => act('handoff-toxicology-tricyclic-recurrent-conduction-shock-seizure-acidemia-rescue-and-active-risk') : undefined}>Hand off what can recur</Button>}
      </div>
    </section>
  </>;
}
