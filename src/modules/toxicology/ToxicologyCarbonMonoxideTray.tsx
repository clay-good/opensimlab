import type { EquipmentSnapshot } from '@platform/kernel/protocol';
import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import { TutorPanel } from '@anesthesia/ui/tutor-panel';
import { carbonMonoxideInlinePrompt } from '../toxicology/tutor/carbon-monoxide-reassuring-monitor-guidance';
import { Button } from '@platform/ui';

export function ToxicologyCarbonMonoxideTray({ assessment, scenarioVersion, onAction, guidance = 'unassisted', demonstrating = false }: {
  assessment?: NonNullable<EquipmentSnapshot['resuscitation']['toxicologyCarbonMonoxideAssessment']>;
  scenarioVersion: string;
  onAction: (action: string) => void;
  guidance?: GuidanceLevel;
  demonstrating?: boolean;
}) {
  const prompt = carbonMonoxideInlinePrompt(guidance, { scenarioVersion, carbonMonoxide: assessment });
  const act = demonstrating ? undefined : onAction;
  const trajectory = assessment?.trajectoryAtTick != null;
  const recognition = assessment?.recognitionAtTick != null;
  const support = assessment?.supportAtTick != null;
  const severity = assessment?.severityAtTick != null;
  const reassessment = assessment?.reassessmentAtTick != null;
  const handoff = assessment?.handoffAtTick != null;
  return <>
    {demonstrating && <p className="syringe__remaining">Watching the worked example. Choose “Take the controls” to make your own decisions.</p>}
    <TutorPanel prompt={demonstrating ? null : prompt} />
    <section className="syringe" aria-labelledby="toxicology-carbon-monoxide-early-title">
      <div id="toxicology-carbon-monoxide-early-title" className="syringe__name">A calm monitor can still hide a poisoned patient.</div>
      <p className="syringe__remaining">Begin with the shared exposure, clock, syncope, symptoms, conventional pulse oximetry, and whole person.</p>
      <div className="crisis-drug__actions">
        {!trajectory && <Button className="crisis-drug__action" aria-disabled={demonstrating} onClick={act ? () => act('reconcile-toxicology-carbon-monoxide-shared-exposure-clock-syncope-symptoms-pulse-ox-and-whole-patient') : undefined}>Connect exposure + patient</Button>}
        {trajectory && !recognition && <Button className="crisis-drug__action" aria-disabled={demonstrating} onClick={act ? () => act('recognize-toxicology-carbon-monoxide-pattern-despite-reassuring-pulse-ox-without-single-value-closure') : undefined}>See past the pulse ox</Button>}
        {recognition && !support && <Button className="crisis-drug__action" aria-disabled={demonstrating} onClick={act ? () => act('activate-toxicology-carbon-monoxide-source-safety-qualified-oxygen-monitoring-poison-center-and-emergency-ownership') : undefined}>Make the scene + patient safe</Button>}
        {support && !severity && <Button className="crisis-drug__action" aria-disabled={demonstrating} onClick={act ? () => act('review-toxicology-carbon-monoxide-supplied-cooximetry-neurologic-cardiac-and-severity-boundary') : undefined}>Read severity in context</Button>}
      </div>
    </section>
    <section className="syringe" aria-labelledby="toxicology-carbon-monoxide-later-title">
      <div id="toxicology-carbon-monoxide-later-title" className="syringe__name">A lower number is progress, not permission to forget.</div>
      <p className="syringe__remaining" role="status">{handoff ? 'Exposure, serial neurologic and cardiac findings, delayed risk, follow-up, and outcome uncertainty handed off.' : reassessment ? 'Symptoms and COHb improved in the fixed report. Delayed neurologic and cardiac risk remain open.' : severity ? 'The COHb is contextual evidence, not a severity score. Record selected-patient consultation after time passes.' : support ? 'Source safety, oxygen, monitoring, and qualified ownership are active. Review the supplied severity evidence.' : 'Complete recognition and immediate support before consultation review.'}</p>
      <div className="crisis-drug__actions">
        {severity && !reassessment && <Button className="crisis-drug__action" aria-disabled={demonstrating} onClick={act ? () => act('record-toxicology-carbon-monoxide-selected-patient-hyperbaric-consultation-and-strict-reassessment') : undefined}>Consult + reassess</Button>}
        {reassessment && !handoff && <Button className="crisis-drug__action" aria-disabled={demonstrating} onClick={act ? () => act('handoff-toxicology-carbon-monoxide-delayed-neurologic-cardiac-exposure-followup-and-active-risk') : undefined}>Hand off what can emerge</Button>}
      </div>
    </section>
  </>;
}
