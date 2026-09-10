import type { EquipmentSnapshot } from '@platform/kernel/protocol';
import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import { TutorPanel } from '@anesthesia/ui/tutor-panel';
import { methemoglobinemiaInlinePrompt } from '../toxicology/tutor/methemoglobinemia-saturation-gap-guidance';
import { Button } from '@platform/ui';

export function ToxicologyMethemoglobinemiaTray({ assessment, scenarioVersion, onAction, guidance = 'unassisted', demonstrating = false }: {
  assessment?: NonNullable<EquipmentSnapshot['resuscitation']['toxicologyMethemoglobinemiaAssessment']>;
  scenarioVersion: string;
  onAction: (action: string) => void;
  guidance?: GuidanceLevel;
  demonstrating?: boolean;
}) {
  const prompt = methemoglobinemiaInlinePrompt(guidance, { scenarioVersion, methemoglobinemia: assessment });
  const act = demonstrating ? undefined : onAction;
  const trajectory = assessment?.trajectoryAtTick != null;
  const recognition = assessment?.recognitionAtTick != null;
  const support = assessment?.supportAtTick != null;
  const hazards = assessment?.hazardsAtTick != null;
  const reassessment = assessment?.reassessmentAtTick != null;
  const handoff = assessment?.handoffAtTick != null;
  return <>
    {demonstrating && <p className="syringe__remaining">Watching the worked example. Choose “Take the controls” to make your own decisions.</p>}
    <TutorPanel prompt={demonstrating ? null : prompt} />
    <section className="syringe" aria-labelledby="toxicology-methemoglobinemia-early-title">
      <div id="toxicology-methemoglobinemia-early-title" className="syringe__name">The numbers disagree. The patient matters.</div>
      <p className="syringe__remaining">Begin with the exposure, cyanosis, symptoms, pulse trace, arterial oxygen evidence, and the whole person.</p>
      <div className="crisis-drug__actions">
        {!trajectory && <Button className="crisis-drug__action" aria-disabled={demonstrating} onClick={act ? () => act('reconcile-toxicology-methemoglobinemia-exposure-cyanosis-symptoms-pulse-ox-arterial-oxygen-and-whole-patient') : undefined}>Connect the discordant clues</Button>}
        {trajectory && !recognition && <Button className="crisis-drug__action" aria-disabled={demonstrating} onClick={act ? () => act('recognize-toxicology-methemoglobinemia-dyshemoglobin-pattern-without-single-number-or-diagnostic-closure') : undefined}>Recognize the urgent pattern</Button>}
        {recognition && !support && <Button className="crisis-drug__action" aria-disabled={demonstrating} onClick={act ? () => act('activate-toxicology-methemoglobinemia-support-monitoring-source-control-poison-center-and-critical-care-ownership') : undefined}>Support + call toxicology</Button>}
        {support && !hazards && <Button className="crisis-drug__action" aria-disabled={demonstrating} onClick={act ? () => act('review-toxicology-methemoglobinemia-supplied-cooximetry-and-methylene-blue-hazard-boundary') : undefined}>Review co-ox + hazards</Button>}
      </div>
    </section>
    <section className="syringe" aria-labelledby="toxicology-methemoglobinemia-later-title">
      <div id="toxicology-methemoglobinemia-later-title" className="syringe__name">Better is a trend, not an all-clear.</div>
      <p className="syringe__remaining" role="status">{handoff ? 'Exposure, serial co-oximetry, rebound, hemolysis, serotonin, rescue, and outcome uncertainty handed off.' : reassessment ? 'Symptoms and co-oximetry improved in the fixed report. Rebound and treatment hazards remain open.' : hazards ? 'The co-ox result and methylene-blue hazards are visible. Record bounded intent after time passes.' : support ? 'Support and qualified ownership are active. Review the supplied co-oximetry and hazards.' : 'Complete recognition and immediate support before antidote review.'}</p>
      <div className="crisis-drug__actions">
        {hazards && !reassessment && <Button className="crisis-drug__action" aria-disabled={demonstrating} onClick={act ? () => act('record-toxicology-methemoglobinemia-bounded-qualified-team-antidote-intent-and-strict-reassessment') : undefined}>Record intent + reassess</Button>}
        {reassessment && !handoff && <Button className="crisis-drug__action" aria-disabled={demonstrating} onClick={act ? () => act('handoff-toxicology-methemoglobinemia-exposure-rebound-hemolysis-serotonin-rescue-and-active-risk') : undefined}>Hand off what stays open</Button>}
      </div>
    </section>
  </>;
}
