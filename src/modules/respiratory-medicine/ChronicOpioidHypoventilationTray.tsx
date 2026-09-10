/**
 * ChronicOpioidHypoventilationTray, moved out of `ActionCockpit.tsx` unchanged.
 *
 * The cockpit defined this tray inline and rendered it behind a `hasChronicOpioidHypoventilationResponse` gate
 * computed from the scenario, so every specialty downloaded it. The gate is now this tray's
 * `supports` predicate in `trays.ts`; the body below is the original.
 */
import type { EquipmentSnapshot } from '@platform/kernel/protocol';
import { chronicOpioidHypoventilationInlinePrompt } from './tutor/chronic-opioid-related-hypoventilation-reassessment-guidance';
import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import { TutorPanel } from '@anesthesia/ui/tutor-panel';
import { Badge, Button } from '@platform/ui';

export function ChronicOpioidHypoventilationTray({ assessment, scenarioVersion, onAction, guidance = 'unassisted', demonstrating = false }: {
  assessment?: NonNullable<EquipmentSnapshot['resuscitation']['chronicOpioidHypoventilationAssessment']>;
  onAction: (action: string) => void;
  scenarioVersion: string;
  guidance?: GuidanceLevel;
  demonstrating?: boolean;
}) {
  const prompt = chronicOpioidHypoventilationInlinePrompt(guidance, { scenarioVersion, chronicOpioidHypoventilation: assessment });
  const act = demonstrating ? undefined : onAction;
  const trajectory = assessment?.trajectoryAtTick != null;
  const evidence = assessment?.evidenceAtTick != null;
  const alternatives = assessment?.alternativesAtTick != null;
  const plan = assessment?.coordinatedPlanAtTick != null;
  const handoff = assessment?.handoffAtTick != null;
  return <div className="tray-grid">
    {demonstrating && <p className="syringe__remaining">Watching the worked example. Choose “Take the controls” to make your own decisions.</p>}
    <TutorPanel prompt={demonstrating ? null : prompt} />
    <section className="syringe" aria-labelledby="chronic-opioid-hypoventilation-pattern-title">
      <div id="chronic-opioid-hypoventilation-pattern-title" className="syringe__name">Daytime can look quiet. Sleep can tell the fuller story.</div>
      <Badge kind="teaching">longitudinal symptoms · awake snapshot · attended sleep evidence</Badge>
      <div className="syringe__meta">exposure · sleep · function · CO₂ pattern · open contributors</div>
      <p className="syringe__remaining" role="status">{evidence && alternatives ? 'Both evidence lanes reviewed · connect shared ownership' : trajectory ? 'Trajectory held · review both evidence lanes' : 'Begin with the person, not one number'}</p>
      <div className="syringe__presets">
        <Button className="crisis-drug__action" disabled={trajectory} aria-disabled={demonstrating} onClick={act ? () => act('reconcile-chronic-opioid-related-hypoventilation-exposure-and-trajectory') : undefined}>Review exposure + sleep trajectory</Button>
        <Button className="crisis-drug__action" disabled={!trajectory || evidence} aria-disabled={demonstrating} onClick={act ? () => act('review-chronic-opioid-related-hypoventilation-awake-and-sleep-evidence') : undefined}>Review awake + sleep evidence</Button>
        <Button className="crisis-drug__action" disabled={!trajectory || alternatives} aria-disabled={demonstrating} onClick={act ? () => act('review-chronic-opioid-related-hypoventilation-contributors-and-alternatives') : undefined}>Review contributors + alternatives</Button>
      </div>
      <p className="field__hint">One awake SpO₂ cannot exclude sleep-related hypoventilation. The blood gas and attended study are fixed specialist reports, not learner-acquired or learner-interpreted tests.</p>
    </section>
    <section className="syringe" aria-labelledby="chronic-opioid-hypoventilation-plan-title">
      <div id="chronic-opioid-hypoventilation-plan-title" className="syringe__name">One breathing pattern can need more than one thoughtful owner.</div>
      <Badge kind="teaching">pain goals · respiratory safety · shared follow-through</Badge>
      <div className="syringe__meta">prescriber · sleep · respiratory · pharmacy · primary care</div>
      <p className="syringe__remaining" role="status">{handoff ? 'Evidence + open work handed off' : plan ? 'Shared plan connected · advance time before handoff' : evidence && alternatives ? 'The whole pattern is ready for shared ownership' : 'Complete both reviews before planning'}</p>
      <div className="syringe__presets">
        <Button className="crisis-drug__action" disabled={!evidence || !alternatives || plan} aria-disabled={demonstrating} onClick={act ? () => act('coordinate-chronic-opioid-related-hypoventilation-prescriber-sleep-and-respiratory-plan') : undefined}>Connect shared safety + pain plan</Button>
        <Button className="crisis-drug__action" disabled={!plan || handoff} aria-disabled={demonstrating} onClick={act ? () => act('handoff-chronic-opioid-related-hypoventilation-reassessment') : undefined}>Hand off evidence + open work</Button>
      </div>
      <p className="field__hint">No diagnosis, morphine-equivalent threshold, abrupt stop, taper, naloxone intervention, oxygen, PAP mode or setting, treatment, disposition, response, or outcome is selected.</p>
    </section>
  </div>;
}
