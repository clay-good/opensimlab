/**
 * NeurologyMeningitisTray, moved out of `ActionCockpit.tsx` unchanged.
 *
 * The cockpit defined this tray inline and rendered it behind a `hasNeurologyMeningitisResponse` gate
 * computed from the scenario, so every specialty downloaded it. That gate is now this tray's
 * `supports` predicate in `trays.ts`; the body below is the original.
 */
import type { EquipmentSnapshot } from '@platform/kernel/protocol';
import { meningitisInlinePrompt } from './tutor/acute-bacterial-meningitis-first-hour-guidance';
import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import { TutorPanel } from '@anesthesia/ui/tutor-panel';
import { Button } from '@platform/ui';

export function NeurologyMeningitisTray({ assessment, scenarioVersion, onAction, guidance = 'unassisted', demonstrating = false }: {
  assessment?: NonNullable<EquipmentSnapshot['resuscitation']['neurologyMeningitisAssessment']>;
  scenarioVersion: string;
  onAction: (action: string) => void;
  guidance?: GuidanceLevel;
  demonstrating?: boolean;
}) {
  const prompt = meningitisInlinePrompt(guidance, { scenarioVersion, meningitis: assessment });
  const act = demonstrating ? undefined : onAction;
  const trajectory = assessment?.trajectoryAtTick != null;
  const ownership = assessment?.ownershipAtTick != null;
  const diagnostics = assessment?.diagnosticsAtTick != null;
  const treatment = assessment?.treatmentAtTick != null;
  const later = assessment?.laterAtTick != null;
  const handoff = assessment?.handoffAtTick != null;
  return <div className="tray-grid">
    {demonstrating && <p className="syringe__remaining">Watching the worked example. Choose “Take the controls” to make your own decisions.</p>}
    <TutorPanel prompt={demonstrating ? null : prompt} />
    <section className="syringe" aria-labelledby="neurology-meningitis-first-hour-title">
      <div id="neurology-meningitis-first-hour-title" className="syringe__name">Protect the hour.</div>
      <div className="syringe__meta">28 years · 14-hour illness · GCS 15 · nonfocal · T 39.3°C</div>
      <p className="syringe__remaining">{treatment ? 'Qualified early diagnostics and empiric care are active without delay.' : diagnostics ? 'Prompt LP boundary reviewed · activate qualified empiric care' : ownership ? 'Time-critical owners are active · review LP safety and imaging needs' : trajectory ? 'Acute meningeal and infection pattern reconciled · activate qualified owners' : 'Begin with the clock, meningeal symptoms, neurological state, physiology, and whole patient.'}</p>
      <div className="syringe__presets">
        {!trajectory && <Button className="crisis-drug__action" aria-disabled={demonstrating} onClick={act ? () => act('reconcile-neurology-meningitis-clock-meningeal-infection-neurologic-and-whole-patient') : undefined}>Review the acute trajectory</Button>}
        {trajectory && !ownership && <Button className="crisis-drug__action" aria-disabled={demonstrating} onClick={act ? () => act('activate-neurology-meningitis-qualified-time-critical-infection-neurologic-resuscitation-and-precaution-ownership') : undefined}>Activate time-critical owners</Button>}
        {ownership && !diagnostics && <Button className="crisis-drug__action" aria-disabled={demonstrating} onClick={act ? () => act('review-neurology-meningitis-lp-safety-no-routine-imaging-and-parallel-diagnostic-boundary') : undefined}>Review LP + imaging boundary</Button>}
        {diagnostics && !treatment && <Button className="crisis-drug__action" aria-disabled={demonstrating} onClick={act ? () => act('activate-neurology-meningitis-qualified-early-empiric-antimicrobial-and-adjunct-pathway-without-diagnostic-delay') : undefined}>Activate early qualified care</Button>}
      </div>
      <p className="field__hint">Prompt blood and CSF sampling matters, but delayed tests or imaging must not delay qualified empiric care. This exact alert, nonfocal, stable state supports LP without routine prior imaging. New focal, pupillary, seizure, consciousness, airway, breathing, shock, bleeding, purpura, or evolving-lesion concerns reopen the boundary.</p>
    </section>
    <section className="syringe" aria-labelledby="neurology-meningitis-later-title">
      <div id="neurology-meningitis-later-title" className="syringe__name">Strong pattern, open questions.</div>
      <div className="syringe__meta">fixed 45-minute report · bacterial-pattern CSF · organism pending</div>
      <p className="syringe__remaining" role="status">{handoff ? 'Organism, treatment, complications, public health, hearing, and outcome uncertainty handed off.' : later ? 'The CSF strongly supports bacterial meningitis. Organism, response, complications, and outcome remain open.' : treatment ? 'Qualified diagnostics and care are active. Review the fixed 45-minute CSF and clinical report.' : 'Complete trajectory, ownership, diagnostic, and treatment boundaries before reassessment.'}</p>
      <div className="syringe__presets">
        {treatment && !later && <Button className="crisis-drug__action" aria-disabled={demonstrating} onClick={act ? () => act('review-neurology-meningitis-strict-later-csf-clinical-and-supplied-treatment-trajectory') : undefined}>Review the 45-minute report</Button>}
        {later && !handoff && <Button className="crisis-drug__action" aria-disabled={demonstrating} onClick={act ? () => act('handoff-neurology-meningitis-organism-treatment-complication-public-health-hearing-and-active-risk') : undefined}>Hand off meningitis risk</Button>}
      </div>
      <p className="field__hint">The blood, LP, CSF, and prior qualified care are fixed reports, not learner tests, interpretation, procedure, prescribing, or treatment. No pathogen, susceptibility, treatment effect, durable neurological safety, hearing result, disposition, prognosis, or outcome is supplied.</p>
    </section>
  </div>;
}
