import type { EquipmentSnapshot } from '@platform/kernel/protocol';
import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import { TutorPanel } from '@anesthesia/ui/tutor-panel';
import { sympathomimeticInlinePrompt } from '../toxicology/tutor/sympathomimetic-hyperadrenergic-hyperthermia-guidance';
import { Button } from '@platform/ui';

export function ToxicologySympathomimeticTray({ assessment, scenarioVersion, onAction, guidance = 'unassisted', demonstrating = false }: {
  assessment?: NonNullable<EquipmentSnapshot['resuscitation']['toxicologySympathomimeticAssessment']>;
  scenarioVersion: string;
  onAction: (action: string) => void;
  guidance?: GuidanceLevel;
  demonstrating?: boolean;
}) {
  const prompt = sympathomimeticInlinePrompt(guidance, { scenarioVersion, sympathomimetic: assessment });
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
    <section className="syringe" aria-labelledby="toxicology-sympathomimetic-early-title">
      <div id="toxicology-sympathomimetic-early-title" className="syringe__name">Lower the heat. Lower the threat.</div>
      <p className="syringe__remaining">Begin with exposure, clock, fear, agitation, sweating, pupils, bowel activity, pressure, pulse, temperature, and whole person.</p>
      <div className="crisis-drug__actions">
        {!trajectory && <Button className="crisis-drug__action" aria-disabled={demonstrating} onClick={act ? () => act('reconcile-toxicology-sympathomimetic-exposure-clock-agitation-autonomic-temperature-and-whole-patient') : undefined}>Connect exposure + surge</Button>}
        {trajectory && !recognition && <Button className="crisis-drug__action" aria-disabled={demonstrating} onClick={act ? () => act('recognize-toxicology-sympathomimetic-coupled-pattern-without-screen-pupil-pressure-temperature-or-agitation-only-closure') : undefined}>Recognize the whole pattern</Button>}
        {recognition && !support && <Button className="crisis-drug__action" aria-disabled={demonstrating} onClick={act ? () => act('activate-toxicology-sympathomimetic-deescalation-resuscitation-cooling-airway-toxicology-monitoring-and-compassionate-safety-ownership') : undefined}>Make the room safer</Button>}
        {support && !evidence && <Button className="crisis-drug__action" aria-disabled={demonstrating} onClick={act ? () => act('review-toxicology-sympathomimetic-supplied-mental-autonomic-cardiac-temperature-renal-ck-and-differential-boundary') : undefined}>Review surge + hidden harm</Button>}
      </div>
    </section>
    <section className="syringe" aria-labelledby="toxicology-sympathomimetic-later-title">
      <div id="toxicology-sympathomimetic-later-title" className="syringe__name">Calmer is safer. It is not the same as safe.</div>
      <p className="syringe__remaining" role="status">{handoff ? 'Mental state, psychiatric safety, pressure, rhythm, temperature, airway, renal and CK injury, seizure, coingestion, and outcome uncertainty handed off.' : reassessment ? 'Temperature, pressure, pulse, and agitation improved. Durable control, cardiac safety, psychiatric safety, and treatment effect remain unproven.' : evidence ? 'Mental, autonomic, cardiac, temperature, renal, CK, coingestion, and differential evidence stay coupled. Record qualified intent after time passes.' : support ? 'De-escalation, cooling, resuscitation, cardiac, airway, toxicology, psychiatric, monitoring, and compassionate safety ownership are active. Review the supplied evidence.' : 'Complete whole-pattern recognition and safety ownership before the treatment-boundary review.'}</p>
      <div className="crisis-drug__actions">
        {evidence && !reassessment && <Button className="crisis-drug__action" aria-disabled={demonstrating} onClick={act ? () => act('record-toxicology-sympathomimetic-bounded-qualified-deescalation-support-sedation-cooling-surveillance-airway-and-adjunct-intent-with-strict-later-review') : undefined}>Record calming intent + reassess</Button>}
        {reassessment && !handoff && <Button className="crisis-drug__action" aria-disabled={demonstrating} onClick={act ? () => act('handoff-toxicology-sympathomimetic-rebound-agitation-psychosis-suicidality-ischemia-arrhythmia-hyperthermia-rhabdomyolysis-coingestion-airway-and-active-risk') : undefined}>Hand off what can rebound</Button>}
      </div>
    </section>
  </>;
}
