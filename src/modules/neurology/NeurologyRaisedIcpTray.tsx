/**
 * NeurologyRaisedIcpTray, moved out of `ActionCockpit.tsx` unchanged.
 *
 * The cockpit defined this tray inline and rendered it behind a `hasNeurologyRaisedIcpResponse` gate
 * computed from the scenario, so every specialty downloaded it. That gate is now this tray's
 * `supports` predicate in `trays.ts`; the body below is the original.
 */
import type { EquipmentSnapshot } from '@platform/kernel/protocol';
import { raisedIcpInlinePrompt } from './tutor/raised-intracranial-pressure-visual-threat-guidance';
import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import { TutorPanel } from '@anesthesia/ui/tutor-panel';
import { Button } from '@platform/ui';

export function NeurologyRaisedIcpTray({ assessment, scenarioVersion, onAction, guidance = 'unassisted', demonstrating = false }: {
  assessment?: NonNullable<EquipmentSnapshot['resuscitation']['neurologyRaisedIcpAssessment']>;
  scenarioVersion: string;
  onAction: (action: string) => void;
  guidance?: GuidanceLevel;
  demonstrating?: boolean;
}) {
  const prompt = raisedIcpInlinePrompt(guidance, { scenarioVersion, raisedIcp: assessment });
  const act = demonstrating ? undefined : onAction;
  const trajectory = assessment?.trajectoryAtTick != null;
  const ownership = assessment?.ownershipAtTick != null;
  const eyes = assessment?.eyesAtTick != null;
  const diagnostics = assessment?.diagnosticsAtTick != null;
  const later = assessment?.laterAtTick != null;
  const handoff = assessment?.handoffAtTick != null;
  return <>
    {demonstrating && <p className="syringe__remaining">Watching the worked example. Choose “Take the controls” to make your own decisions.</p>}
    <TutorPanel prompt={demonstrating ? null : prompt} />
    <section className="syringe" aria-labelledby="neurology-raised-icp-early-title">
      <div id="neurology-raised-icp-early-title" className="syringe__name">Protect the whole field.</div>
      <p className="syringe__remaining">Central acuity can stay sharp while papilledema quietly threatens peripheral vision.</p>
      <div className="crisis-drug__actions">
        {!trajectory && <Button className="crisis-drug__action" aria-disabled={demonstrating} onClick={act ? () => act('reconcile-neurology-raised-icp-headache-visual-tinnitus-diplopia-and-whole-patient') : undefined}>Review the pressure clock</Button>}
        {trajectory && !ownership && <Button className="crisis-drug__action" aria-disabled={demonstrating} onClick={act ? () => act('activate-neurology-raised-icp-qualified-neurology-neuro-ophthalmology-imaging-and-procedure-ownership') : undefined}>Activate vision + brain owners</Button>}
        {ownership && !eyes && <Button className="crisis-drug__action" aria-disabled={demonstrating} onClick={act ? () => act('review-neurology-raised-icp-confirmed-papilledema-visual-function-and-pseudopapilledema-boundary') : undefined}>Review papilledema + fields</Button>}
        {eyes && !diagnostics && <Button className="crisis-drug__action" aria-disabled={demonstrating} onClick={act ? () => act('review-neurology-raised-icp-mri-venography-lp-secondary-cause-and-diagnostic-boundary') : undefined}>Review MRI + veins + LP</Button>}
      </div>
    </section>
    <section className="syringe" aria-labelledby="neurology-raised-icp-later-title">
      <div id="neurology-raised-icp-later-title" className="syringe__name">Sharp center, narrowing world.</div>
      <p className="syringe__remaining" role="status">{handoff ? 'Sight rescue, secondary causes, disease, headache, surveillance, and outcome uncertainty handed off.' : later ? 'The fields worsened despite 20/20 acuity. Urgent qualified sight-preservation review is open.' : diagnostics ? 'Papilledema and raised pressure are supplied. Review the fixed 24-hour visual report after time passes.' : 'Complete the clock, owners, eye evidence, and diagnostic boundaries before reassessment.'}</p>
      <div className="crisis-drug__actions">
        {diagnostics && !later && <Button className="crisis-drug__action" aria-disabled={demonstrating} onClick={act ? () => act('review-neurology-raised-icp-strict-later-worsening-visual-field-and-imminent-sight-threat') : undefined}>Review the 24-hour fields</Button>}
        {later && !handoff && <Button className="crisis-drug__action" aria-disabled={demonstrating} onClick={act ? () => act('handoff-neurology-raised-icp-vision-rescue-cause-disease-headache-follow-up-and-active-risk') : undefined}>Hand off sight + active risk</Button>}
      </div>
    </section>
  </>;
}
