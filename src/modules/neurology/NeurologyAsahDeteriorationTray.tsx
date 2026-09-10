/**
 * NeurologyAsahDeteriorationTray, moved out of `ActionCockpit.tsx` unchanged.
 *
 * The cockpit defined this tray inline and rendered it behind a `hasNeurologyAsahDeteriorationResponse` gate
 * computed from the scenario, so every specialty downloaded it. That gate is now this tray's
 * `supports` predicate in `trays.ts`; the body below is the original.
 */
import type { EquipmentSnapshot } from '@platform/kernel/protocol';
import { asahInlinePrompt } from './tutor/aneurysmal-subarachnoid-hemorrhage-deterioration-guidance';
import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import { TutorPanel } from '@anesthesia/ui/tutor-panel';
import { Button } from '@platform/ui';

export function NeurologyAsahDeteriorationTray({ assessment, scenarioVersion, onAction, guidance = 'unassisted', demonstrating = false }: {
  assessment?: NonNullable<EquipmentSnapshot['resuscitation']['neurologyAsahAssessment']>;
  scenarioVersion: string;
  onAction: (action: string) => void;
  guidance?: GuidanceLevel;
  demonstrating?: boolean;
}) {
  const prompt = asahInlinePrompt(guidance, { scenarioVersion, asah: assessment });
  const act = demonstrating ? undefined : onAction;
  const trajectory = assessment?.trajectoryAtTick != null;
  const evidence = assessment?.evidenceAtTick != null;
  const boundary = assessment?.boundaryAtTick != null;
  const ownership = assessment?.ownershipAtTick != null;
  const later = assessment?.laterAtTick != null;
  const handoff = assessment?.handoffAtTick != null;
  return <div className="tray-grid">
    {demonstrating && <p className="syringe__remaining">Watching the worked example. Choose “Take the controls” to make your own decisions.</p>}
    <TutorPanel prompt={demonstrating ? null : prompt} />
    <section className="syringe" aria-labelledby="neurology-asah-deficit-title">
      <div id="neurology-asah-deficit-title" className="syringe__name">A new deficit reopens the whole story.</div>
      <div className="syringe__meta">day 7 · right MCA coiling reported · new left neglect + weakness</div>
      <p className="syringe__remaining">{ownership ? 'Qualified neurocritical, neurovascular, and rescue ownership is active.' : boundary ? 'Possible DCI boundary clear · activate qualified ownership' : evidence ? 'No current rebleed, hydrocephalus, or established infarct reported · perfusion evidence supplied · causes remain open' : trajectory ? 'New deficit reconciled · review fixed threats and alternatives' : 'Start with the SAH course, new function, and whole patient.'}</p>
      <div className="syringe__presets">
        {!trajectory && <Button className="crisis-drug__action" aria-disabled={demonstrating} onClick={act ? () => act('reconcile-neurology-asah-day-aneurysm-status-new-deficit-and-whole-patient') : undefined}>Review SAH course + new deficit</Button>}
        {trajectory && !evidence && <Button className="crisis-drug__action" aria-disabled={demonstrating} onClick={act ? () => act('review-neurology-asah-rebleeding-hydrocephalus-seizure-metabolic-and-perfusion-evidence') : undefined}>Review evidence + immediate threats</Button>}
        {evidence && !boundary && <Button className="crisis-drug__action" aria-disabled={demonstrating} onClick={act ? () => act('recognize-neurology-asah-possible-dci-without-imaging-alone') : undefined}>Recognize possible DCI boundary</Button>}
        {boundary && !ownership && <Button className="crisis-drug__action" aria-disabled={demonstrating} onClick={act ? () => act('activate-neurology-asah-qualified-neurocritical-neurovascular-and-rescue-ownership') : undefined}>Activate qualified DCI ownership</Button>}
      </div>
    </section>
    <section className="syringe" aria-labelledby="neurology-asah-trajectory-title">
      <div id="neurology-asah-trajectory-title" className="syringe__name">Vasospasm is evidence, not an outcome.</div>
      <div className="syringe__meta">fixed 80-minute report · cause and outcome remain open</div>
      <p className="syringe__remaining" role="status">{handoff ? 'Deficit, perfusion context, open causes, and owners handed off.' : later ? 'At 80 minutes, neglect and weakness are worse. Infarction, treatment response, and outcome remain open.' : ownership ? 'Qualified ownership is active. Review the fixed later report.' : 'Complete the new-deficit review before reassessment.'}</p>
      <div className="syringe__presets">
        {ownership && !later && <Button className="crisis-drug__action" aria-disabled={demonstrating} onClick={act ? () => act('review-neurology-asah-strict-later-neurologic-and-perfusion-trajectory') : undefined}>Review the later neurologic report</Button>}
        {later && !handoff && <Button className="crisis-drug__action" aria-disabled={demonstrating} onClick={act ? () => act('handoff-neurology-asah-dci-aneurysm-recurrence-and-active-risk') : undefined}>Hand off deficit + open risk</Button>}
      </div>
    </section>
  </div>;
}
