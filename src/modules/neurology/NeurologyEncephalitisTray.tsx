/**
 * NeurologyEncephalitisTray, moved out of `ActionCockpit.tsx` unchanged.
 *
 * The cockpit defined this tray inline and rendered it behind a `hasNeurologyEncephalitisResponse` gate
 * computed from the scenario, so every specialty downloaded it. That gate is now this tray's
 * `supports` predicate in `trays.ts`; the body below is the original.
 */
import type { EquipmentSnapshot } from '@platform/kernel/protocol';
import { encephalitisInlinePrompt } from './tutor/suspected-herpes-simplex-encephalitis-guidance';
import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import { TutorPanel } from '@anesthesia/ui/tutor-panel';
import { Button } from '@platform/ui';

export function NeurologyEncephalitisTray({ assessment, scenarioVersion, onAction, guidance = 'unassisted', demonstrating = false }: {
  assessment?: NonNullable<EquipmentSnapshot['resuscitation']['neurologyEncephalitisAssessment']>;
  scenarioVersion: string;
  onAction: (action: string) => void;
  guidance?: GuidanceLevel;
  demonstrating?: boolean;
}) {
  const prompt = encephalitisInlinePrompt(guidance, { scenarioVersion, encephalitis: assessment });
  const act = demonstrating ? undefined : onAction;
  const trajectory = assessment?.trajectoryAtTick != null;
  const ownership = assessment?.ownershipAtTick != null;
  const treatment = assessment?.treatmentAtTick != null;
  const diagnostics = assessment?.diagnosticsAtTick != null;
  const later = assessment?.laterAtTick != null;
  const handoff = assessment?.handoffAtTick != null;
  return <>
    {demonstrating && <p className="syringe__remaining">Watching the worked example. Choose “Take the controls” to make your own decisions.</p>}
    <TutorPanel prompt={demonstrating ? null : prompt} />
    <section className="syringe" aria-labelledby="neurology-encephalitis-early-title">
      <div id="neurology-encephalitis-early-title" className="syringe__name">The brain changed first.</div>
      <p className="syringe__remaining">Fever with new memory, language, behavior, and focal-seizure change needs parallel ownership and care.</p>
      <div className="crisis-drug__actions">
        {!trajectory && <Button className="crisis-drug__action" aria-disabled={demonstrating} onClick={act ? () => act('reconcile-neurology-encephalitis-clock-cognition-language-focal-seizure-and-whole-patient') : undefined}>Review encephalitic trajectory</Button>}
        {trajectory && !ownership && <Button className="crisis-drug__action" aria-disabled={demonstrating} onClick={act ? () => act('activate-neurology-encephalitis-qualified-neurocritical-infection-airway-and-seizure-ownership') : undefined}>Activate brain + infection owners</Button>}
        {ownership && !treatment && <Button className="crisis-drug__action" aria-disabled={demonstrating} onClick={act ? () => act('activate-neurology-encephalitis-qualified-immediate-empiric-antiviral-pathway-without-test-delay') : undefined}>Activate early antiviral care</Button>}
        {treatment && !diagnostics && <Button className="crisis-drug__action" aria-disabled={demonstrating} onClick={act ? () => act('review-neurology-encephalitis-mri-eeg-csf-etiology-and-nonconvulsive-seizure-boundary') : undefined}>Review MRI + EEG + CSF</Button>}
      </div>
    </section>
    <section className="syringe" aria-labelledby="neurology-encephalitis-later-title">
      <div id="neurology-encephalitis-later-title" className="syringe__name">One negative is not the end.</div>
      <p className="syringe__remaining" role="status">{handoff ? 'Repeat testing, treatment safety, seizures, autoimmune causes, cognition, and outcome uncertainty handed off.' : later ? 'The localized pattern remains compatible despite an early negative HSV PCR. Risk stays open.' : diagnostics ? 'Qualified early care and diagnostics are active. Review the fixed 4-hour report after time passes.' : 'Complete trajectory, ownership, care, and diagnostic boundaries before reassessment.'}</p>
      <div className="crisis-drug__actions">
        {diagnostics && !later && <Button className="crisis-drug__action" aria-disabled={demonstrating} onClick={act ? () => act('review-neurology-encephalitis-strict-later-early-negative-hsv-pcr-and-clinical-trajectory') : undefined}>Review the 4-hour report</Button>}
        {later && !handoff && <Button className="crisis-drug__action" aria-disabled={demonstrating} onClick={act ? () => act('handoff-neurology-encephalitis-repeat-testing-antiviral-seizure-autoimmune-and-active-risk') : undefined}>Hand off repeat testing + risk</Button>}
      </div>
    </section>
  </>;
}
