/**
 * NeurologyHerniationTray, moved out of `ActionCockpit.tsx` unchanged.
 *
 * The cockpit defined this tray inline and rendered it behind a `hasNeurologyHerniationResponse` gate
 * computed from the scenario, so every specialty downloaded it. That gate is now this tray's
 * `supports` predicate in `trays.ts`; the body below is the original.
 */
import type { EquipmentSnapshot } from '@platform/kernel/protocol';
import { herniationInlinePrompt } from './tutor/acute-transtentorial-herniation-pattern-guidance';
import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import { TutorPanel } from '@anesthesia/ui/tutor-panel';
import { Button } from '@platform/ui';

export function NeurologyHerniationTray({ assessment, scenarioVersion, onAction, guidance = 'unassisted', demonstrating = false }: {
  assessment?: NonNullable<EquipmentSnapshot['resuscitation']['neurologyHerniationAssessment']>;
  scenarioVersion: string;
  onAction: (action: string) => void;
  guidance?: GuidanceLevel;
  demonstrating?: boolean;
}) {
  const prompt = herniationInlinePrompt(guidance, { scenarioVersion, herniation: assessment });
  const act = demonstrating ? undefined : onAction;
  const trajectory = assessment?.trajectoryAtTick != null;
  const recognition = assessment?.recognitionAtTick != null;
  const ownership = assessment?.ownershipAtTick != null;
  const boundary = assessment?.boundaryAtTick != null;
  const later = assessment?.laterAtTick != null;
  const handoff = assessment?.handoffAtTick != null;
  return <>
    {demonstrating && <p className="syringe__remaining">Watching the worked example. Choose “Take the controls” to make your own decisions.</p>}
    <TutorPanel prompt={demonstrating ? null : prompt} />
    <section className="syringe" aria-labelledby="neurology-herniation-early-title">
      <div id="neurology-herniation-early-title" className="syringe__name">The pattern changed now.</div>
      <p className="syringe__remaining">Consciousness, pupils, movement, physiology, and structure converge. One sign never stands alone.</p>
      <div className="crisis-drug__actions">
        {!trajectory && <Button className="crisis-drug__action" aria-disabled={demonstrating} onClick={act ? () => act('reconcile-neurology-herniation-clock-consciousness-pupils-motor-physiology-and-whole-patient') : undefined}>Review the rapid change</Button>}
        {trajectory && !recognition && <Button className="crisis-drug__action" aria-disabled={demonstrating} onClick={act ? () => act('recognize-neurology-converging-transtentorial-herniation-pattern-without-isolated-pupil-or-complete-triad') : undefined}>Recognize the whole pattern</Button>}
        {recognition && !ownership && <Button className="crisis-drug__action" aria-disabled={demonstrating} onClick={act ? () => act('activate-neurology-herniation-qualified-airway-neurocritical-neurosurgical-and-brain-rescue-ownership') : undefined}>Activate brain rescue owners</Button>}
        {ownership && !boundary && <Button className="crisis-drug__action" aria-disabled={demonstrating} onClick={act ? () => act('review-neurology-herniation-immediate-systemic-brain-rescue-imaging-and-definitive-source-control-boundary') : undefined}>Review rescue boundaries</Button>}
      </div>
    </section>
    <section className="syringe" aria-labelledby="neurology-herniation-later-title">
      <div id="neurology-herniation-later-title" className="syringe__name">Rescue first. Certainty follows.</div>
      <p className="syringe__remaining" role="status">{handoff ? 'Lesion, airway, pressure, seizure, surgery, recovery, and outcome uncertainty handed off.' : later ? 'Qualified rescue is active, but the pupil remains nonreactive and definitive control is unresolved.' : boundary ? 'Parallel rescue and definitive-control owners are active. Review the fixed 15-minute report after time passes.' : 'Complete the pattern, recognition, owners, and rescue boundary before reassessment.'}</p>
      <div className="crisis-drug__actions">
        {boundary && !later && <Button className="crisis-drug__action" aria-disabled={demonstrating} onClick={act ? () => act('review-neurology-herniation-strict-later-qualified-rescue-and-unresolved-neurologic-trajectory') : undefined}>Review the 15-minute report</Button>}
        {later && !handoff && <Button className="crisis-drug__action" aria-disabled={demonstrating} onClick={act ? () => act('handoff-neurology-herniation-lesion-airway-pressure-seizure-surgery-and-active-risk') : undefined}>Hand off rescue + active risk</Button>}
      </div>
    </section>
  </>;
}
