import type { EquipmentSnapshot } from '@platform/kernel/protocol';
import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import { TutorPanel } from '@anesthesia/ui/tutor-panel';
import { opioidXylazineInlinePrompt } from '../toxicology/tutor/opioid-xylazine-persistent-sedation-guidance';
import { Button } from '@platform/ui';

export function ToxicologyOpioidXylazineTray({ assessment, scenarioVersion, onAction, guidance = 'unassisted', demonstrating = false }: {
  assessment?: NonNullable<EquipmentSnapshot['resuscitation']['toxicologyOpioidXylazineAssessment']>;
  scenarioVersion: string;
  onAction: (action: string) => void;
  guidance?: GuidanceLevel;
  demonstrating?: boolean;
}) {
  const prompt = opioidXylazineInlinePrompt(guidance, { scenarioVersion, opioidXylazine: assessment });
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
    <section className="syringe" aria-labelledby="toxicology-opioid-xylazine-early-title">
      <div id="toxicology-opioid-xylazine-early-title" className="syringe__name">Restore breathing. Keep the differential open.</div>
      <p className="syringe__remaining">Begin with the unknown exposure, bystander rescue, breathing, carbon dioxide, sedation, pupils, perfusion, temperature, and the whole person.</p>
      <div className="crisis-drug__actions">
        {!trajectory && <Button className="crisis-drug__action" aria-disabled={demonstrating} onClick={act ? () => act('reconcile-toxicology-opioid-xylazine-exposure-rescue-breathing-sedation-perfusion-and-whole-patient') : undefined}>Connect rescue + patient</Button>}
        {trajectory && !recognition && <Button className="crisis-drug__action" aria-disabled={demonstrating} onClick={act ? () => act('recognize-toxicology-opioid-xylazine-opioid-emergency-and-possible-adulterant-without-pupil-naloxone-response-or-screen-only-closure') : undefined}>Act without overcalling</Button>}
        {recognition && !support && <Button className="crisis-drug__action" aria-disabled={demonstrating} onClick={act ? () => act('activate-toxicology-opioid-xylazine-ventilation-oxygen-monitoring-toxicology-addiction-wound-and-dignity-ownership') : undefined}>Bring care around the person</Button>}
        {support && !evidence && <Button className="crisis-drug__action" aria-disabled={demonstrating} onClick={act ? () => act('review-toxicology-opioid-xylazine-supplied-respiratory-response-circulation-temperature-glucose-ecg-screen-wound-and-differential-boundary') : undefined}>Review response + hidden harm</Button>}
      </div>
    </section>
    <section className="syringe" aria-labelledby="toxicology-opioid-xylazine-later-title">
      <div id="toxicology-opioid-xylazine-later-title" className="syringe__name">Better breathing is progress, not proof.</div>
      <p className="syringe__remaining" role="status">{handoff ? 'Recurrent depression, sedation, perfusion, temperature, skin, withdrawal, co-exposure, addiction, harm-reduction, and outcome uncertainty handed off.' : reassessment ? 'Breathing and gas exchange improved while sedation persisted. Agent identity, naloxone resistance, recovery, treatment effect, and durable safety remain unproven.' : evidence ? 'Respiratory, circulation, temperature, glucose, ECG, routine-screen, skin, coingestion, and differential evidence stay coupled. Record qualified intent after time passes.' : support ? 'Respiratory, toxicology, addiction, wound, and dignity-centered ownership are active. Review the supplied evidence.' : 'Recognize the actionable opioid emergency and possible co-exposure before the supportive-care boundary.'}</p>
      <div className="crisis-drug__actions">
        {evidence && !reassessment && <Button className="crisis-drug__action" aria-disabled={demonstrating} onClick={act ? () => act('record-toxicology-opioid-xylazine-bounded-qualified-continued-support-opioid-antagonist-symptomatic-care-no-veterinary-antagonist-and-strict-later-review') : undefined}>Record support + reassess</Button>}
        {reassessment && !handoff && <Button className="crisis-drug__action" aria-disabled={demonstrating} onClick={act ? () => act('handoff-toxicology-opioid-xylazine-recurrent-depression-persistent-sedation-shock-hypothermia-wound-withdrawal-addiction-and-outcome-risk') : undefined}>Hand off the whole horizon</Button>}
      </div>
    </section>
  </>;
}
