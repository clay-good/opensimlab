/**
 * NeurologyDeliriumTray, moved out of `ActionCockpit.tsx` unchanged.
 *
 * The cockpit defined this tray inline and rendered it behind a `hasNeurologyDeliriumResponse` gate
 * computed from the scenario, so every specialty downloaded it. That gate is now this tray's
 * `supports` predicate in `trays.ts`; the body below is the original.
 */
import type { EquipmentSnapshot } from '@platform/kernel/protocol';
import { deliriumInlinePrompt } from './tutor/acute-delirium-reversible-causes-guidance';
import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import { TutorPanel } from '@anesthesia/ui/tutor-panel';
import { Button } from '@platform/ui';

export function NeurologyDeliriumTray({ assessment, scenarioVersion, onAction, guidance = 'unassisted', demonstrating = false }: {
  assessment?: NonNullable<EquipmentSnapshot['resuscitation']['neurologyDeliriumAssessment']>;
  scenarioVersion: string;
  onAction: (action: string) => void;
  guidance?: GuidanceLevel;
  demonstrating?: boolean;
}) {
  const prompt = deliriumInlinePrompt(guidance, { scenarioVersion, delirium: assessment });
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
    <section className="syringe" aria-labelledby="neurology-delirium-early-title">
      <div id="neurology-delirium-early-title" className="syringe__name">Begin with who she was.</div>
      <p className="syringe__remaining">Baseline, fluctuation, attention, perception, function, and the whole patient belong together.</p>
      <div className="crisis-drug__actions">
        {!trajectory && <Button className="crisis-drug__action" aria-disabled={demonstrating} onClick={act ? () => act('reconcile-neurology-delirium-baseline-clock-fluctuation-attention-perception-function-and-whole-patient') : undefined}>Review baseline + fluctuation</Button>}
        {trajectory && !recognition && <Button className="crisis-drug__action" aria-disabled={demonstrating} onClick={act ? () => act('recognize-neurology-delirium-indicators-and-qualified-assessment-boundary-without-dementia-or-single-cause-closure') : undefined}>Recognize the assessment boundary</Button>}
        {recognition && !ownership && <Button className="crisis-drug__action" aria-disabled={demonstrating} onClick={act ? () => act('activate-neurology-delirium-qualified-medical-nursing-pharmacy-family-safety-capacity-and-mobility-ownership') : undefined}>Bring familiar care together</Button>}
        {ownership && !boundary && <Button className="crisis-drug__action" aria-disabled={demonstrating} onClick={act ? () => act('review-neurology-delirium-reversible-contributors-communication-environment-deescalation-and-treatment-boundary') : undefined}>Review causes + calm care</Button>}
      </div>
    </section>
    <section className="syringe" aria-labelledby="neurology-delirium-later-title">
      <div id="neurology-delirium-later-title" className="syringe__name">Make the room easier to understand.</div>
      <p className="syringe__remaining" role="status">{handoff ? 'Causes, capacity, safety, medicines, function, recurrence, follow-up, and outcome uncertainty handed off.' : later ? 'Several contributors are visible. Attention still fluctuates, so no single cause or recovery is claimed.' : boundary ? 'Familiar, least-restrictive care is active. Review the fixed 6-hour report after time passes.' : 'Complete the baseline, assessment, owners, and contributor boundary before reassessment.'}</p>
      <div className="crisis-drug__actions">
        {boundary && !later && <Button className="crisis-drug__action" aria-disabled={demonstrating} onClick={act ? () => act('review-neurology-delirium-strict-later-contributor-and-unresolved-cognitive-trajectory') : undefined}>Review the 6-hour report</Button>}
        {later && !handoff && <Button className="crisis-drug__action" aria-disabled={demonstrating} onClick={act ? () => act('handoff-neurology-delirium-causes-capacity-safety-medicines-function-recurrence-follow-up-and-active-risk') : undefined}>Hand off the whole picture</Button>}
      </div>
    </section>
  </>;
}
