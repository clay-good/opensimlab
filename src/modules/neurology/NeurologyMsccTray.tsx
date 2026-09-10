/**
 * NeurologyMsccTray, moved out of `ActionCockpit.tsx` unchanged.
 *
 * The cockpit defined this tray inline and rendered it behind a `hasNeurologyMsccResponse` gate
 * computed from the scenario, so every specialty downloaded it. That gate is now this tray's
 * `supports` predicate in `trays.ts`; the body below is the original.
 */
import type { EquipmentSnapshot } from '@platform/kernel/protocol';
import { msccInlinePrompt } from './tutor/metastatic-spinal-cord-compression-guidance';
import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import { TutorPanel } from '@anesthesia/ui/tutor-panel';
import { Button } from '@platform/ui';

export function NeurologyMsccTray({ assessment, scenarioVersion, onAction, guidance = 'unassisted', demonstrating = false }: {
  assessment?: NonNullable<EquipmentSnapshot['resuscitation']['neurologyMsccAssessment']>;
  scenarioVersion: string;
  onAction: (action: string) => void;
  guidance?: GuidanceLevel;
  demonstrating?: boolean;
}) {
  const prompt = msccInlinePrompt(guidance, { scenarioVersion, mscc: assessment });
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
    <section className="syringe" aria-labelledby="neurology-mscc-early-title">
      <div id="neurology-mscc-early-title" className="syringe__name">The pattern has a level.</div>
      <p className="syringe__remaining">Pain, pyramidal weakness, sensation, gait, and bladder function converge before the scan.</p>
      <div className="crisis-drug__actions">
        {!trajectory && <Button className="crisis-drug__action" aria-disabled={demonstrating} onClick={act ? () => act('reconcile-neurology-mscc-cancer-pain-motor-sensory-bladder-and-whole-patient-clock') : undefined}>Review the cord clock</Button>}
        {trajectory && !recognition && <Button className="crisis-drug__action" aria-disabled={demonstrating} onClick={act ? () => act('recognize-neurology-mscc-oncologic-emergency-before-imaging-confirmation') : undefined}>Recognize the emergency</Button>}
        {recognition && !ownership && <Button className="crisis-drug__action" aria-disabled={demonstrating} onClick={act ? () => act('activate-neurology-mscc-qualified-spinal-oncology-radiology-nursing-and-rehabilitation-ownership') : undefined}>Activate spine + cancer owners</Button>}
        {ownership && !boundary && <Button className="crisis-drug__action" aria-disabled={demonstrating} onClick={act ? () => act('review-neurology-mscc-stability-movement-whole-spine-mri-corticosteroid-and-definitive-care-boundary') : undefined}>Review care boundaries</Button>}
      </div>
    </section>
    <section className="syringe" aria-labelledby="neurology-mscc-later-title">
      <div id="neurology-mscc-later-title" className="syringe__name">Keep every option open.</div>
      <p className="syringe__remaining" role="status">{handoff ? 'Level, stability, function, bladder, definitive care, rehabilitation, and outcome uncertainty handed off.' : later ? 'Qualified MRI confirms T6 compression. Function remains impaired and definitive care is unresolved.' : boundary ? 'Protection and qualified care are active. Review the fixed 4-hour report after time passes.' : 'Complete the clock, recognition, owners, and care boundary before reassessment.'}</p>
      <div className="crisis-drug__actions">
        {boundary && !later && <Button className="crisis-drug__action" aria-disabled={demonstrating} onClick={act ? () => act('review-neurology-mscc-strict-later-qualified-mri-and-unresolved-function-trajectory') : undefined}>Review the 4-hour report</Button>}
        {later && !handoff && <Button className="crisis-drug__action" aria-disabled={demonstrating} onClick={act ? () => act('handoff-neurology-mscc-level-stability-function-bladder-definitive-care-and-active-risk') : undefined}>Hand off function + active risk</Button>}
      </div>
    </section>
  </>;
}
