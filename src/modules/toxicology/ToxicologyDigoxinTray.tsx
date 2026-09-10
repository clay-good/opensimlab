import type { EquipmentSnapshot } from '@platform/kernel/protocol';
import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import { TutorPanel } from '@anesthesia/ui/tutor-panel';
import { digoxinInlinePrompt } from '../toxicology/tutor/digoxin-rhythm-potassium-guidance';
import { Button } from '@platform/ui';

export function ToxicologyDigoxinTray({ assessment, scenarioVersion, onAction, guidance = 'unassisted', demonstrating = false }: {
  assessment?: NonNullable<EquipmentSnapshot['resuscitation']['toxicologyDigoxinAssessment']>;
  scenarioVersion: string;
  onAction: (action: string) => void;
  guidance?: GuidanceLevel;
  demonstrating?: boolean;
}) {
  const prompt = digoxinInlinePrompt(guidance, { scenarioVersion, digoxin: assessment });
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
    <section className="syringe" aria-labelledby="toxicology-digoxin-early-title">
      <div id="toxicology-digoxin-early-title" className="syringe__name">The rhythm and potassium tell one story.</div>
      <p className="syringe__remaining">Begin with product, clock, GI and visual clues, perfusion, rhythm, potassium, and whole person.</p>
      <div className="crisis-drug__actions">
        {!trajectory && <Button className="crisis-drug__action" aria-disabled={demonstrating} onClick={act ? () => act('reconcile-toxicology-digoxin-product-clock-gi-visual-perfusion-rhythm-potassium-and-whole-patient') : undefined}>Connect rhythm + potassium</Button>}
        {trajectory && !recognition && <Button className="crisis-drug__action" aria-disabled={demonstrating} onClick={act ? () => act('recognize-toxicology-digoxin-life-threatening-pattern-without-level-rhythm-or-potassium-only-closure') : undefined}>Recognize the whole pattern</Button>}
        {recognition && !support && <Button className="crisis-drug__action" aria-disabled={demonstrating} onClick={act ? () => act('activate-toxicology-digoxin-poison-center-resuscitation-cardiac-electrolyte-airway-and-safety-ownership') : undefined}>Build the rescue circle</Button>}
        {support && !evidence && <Button className="crisis-drug__action" aria-disabled={demonstrating} onClick={act ? () => act('review-toxicology-digoxin-supplied-ecg-level-timing-potassium-renal-coingestion-and-antidote-boundary') : undefined}>Review timing + antidote</Button>}
      </div>
    </section>
    <section className="syringe" aria-labelledby="toxicology-digoxin-later-title">
      <div id="toxicology-digoxin-later-title" className="syringe__name">After Fab, follow the patient, not a misleading total level.</div>
      <p className="syringe__remaining" role="status">{handoff ? 'Rhythm, potassium, assay interference, renal state, recurrence, rescue, safety, and outcome uncertainty handed off.' : reassessment ? 'The fixed perfusion, rhythm, mental-state, and potassium report improved. Durable stability and treatment effect remain unproven.' : evidence ? 'Perfusion, conduction, timed pre-Fab level, potassium, renal state, prior care, and antidote readiness stay coupled. Record qualified intent after time passes.' : support ? 'Qualified toxicology, resuscitation, cardiac, electrolyte, airway, and safety ownership are active. Review the supplied evidence.' : 'Complete whole-pattern recognition and rescue ownership before antidote-boundary review.'}</p>
      <div className="crisis-drug__actions">
        {evidence && !reassessment && <Button className="crisis-drug__action" aria-disabled={demonstrating} onClick={act ? () => act('record-toxicology-digoxin-bounded-qualified-immune-fab-surveillance-and-rescue-intent-with-strict-later-review') : undefined}>Record Fab intent + reassess</Button>}
        {reassessment && !handoff && <Button className="crisis-drug__action" aria-disabled={demonstrating} onClick={act ? () => act('handoff-toxicology-digoxin-recurrent-arrhythmia-potassium-shift-level-interference-renal-rescue-and-active-risk') : undefined}>Hand off what can recur</Button>}
      </div>
    </section>
  </>;
}
