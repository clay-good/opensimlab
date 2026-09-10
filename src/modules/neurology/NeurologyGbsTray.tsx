/**
 * NeurologyGbsTray, moved out of `ActionCockpit.tsx` unchanged.
 *
 * The cockpit defined this tray inline and rendered it behind a `hasNeurologyGbsResponse` gate
 * computed from the scenario, so every specialty downloaded it. That gate is now this tray's
 * `supports` predicate in `trays.ts`; the body below is the original.
 */
import type { EquipmentSnapshot } from '@platform/kernel/protocol';
import { gbsInlinePrompt } from './tutor/guillain-barre-respiratory-decline-guidance';
import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import { TutorPanel } from '@anesthesia/ui/tutor-panel';
import { Button } from '@platform/ui';

export function NeurologyGbsTray({ assessment, scenarioVersion, onAction, guidance = 'unassisted', demonstrating = false }: {
  assessment?: NonNullable<EquipmentSnapshot['resuscitation']['neurologyGbsAssessment']>;
  scenarioVersion: string;
  onAction: (action: string) => void;
  guidance?: GuidanceLevel;
  demonstrating?: boolean;
}) {
  const prompt = gbsInlinePrompt(guidance, { scenarioVersion, gbs: assessment });
  const act = demonstrating ? undefined : onAction;
  const trajectory = assessment?.trajectoryAtTick != null;
  const evidence = assessment?.evidenceAtTick != null;
  const recognition = assessment?.recognitionAtTick != null;
  const ownership = assessment?.ownershipAtTick != null;
  const later = assessment?.laterAtTick != null;
  const handoff = assessment?.handoffAtTick != null;
  return <div className="tray-grid">
    {demonstrating && <p className="syringe__remaining">Watching the worked example. Choose “Take the controls” to make your own decisions.</p>}
    <TutorPanel prompt={demonstrating ? null : prompt} />
    <section className="syringe" aria-labelledby="neurology-gbs-pattern-title">
      <div id="neurology-gbs-pattern-title" className="syringe__name">Track decline, not saturation.</div>
      <div className="syringe__meta">33 years · 48-hour ascent · weak cough + dysphagia · SpO2 98%</div>
      <p className="syringe__remaining">{ownership ? 'Respiratory, airway, neurocritical, and cardiac-monitoring owners are active.' : recognition ? 'High-risk respiratory decline recognized · activate qualified ownership' : evidence ? 'Supportive evidence and mimics remain bounded · recognize the respiratory trajectory' : trajectory ? 'Ascending weakness, bulbar risk, mechanics, and autonomic lability are connected.' : 'Begin with the postinfectious clock, functional loss, breathing, swallowing, and whole patient.'}</p>
      <div className="syringe__presets">
        {!trajectory && <Button className="crisis-drug__action" aria-disabled={demonstrating} onClick={act ? () => act('reconcile-neurology-gbs-clock-ascending-weakness-bulbar-respiratory-autonomic-and-whole-patient') : undefined}>Review ascending trajectory</Button>}
        {trajectory && !evidence && <Button className="crisis-drug__action" aria-disabled={demonstrating} onClick={act ? () => act('review-neurology-gbs-supportive-evidence-mimics-and-diagnostic-boundary') : undefined}>Review evidence + mimics</Button>}
        {evidence && !recognition && <Button className="crisis-drug__action" aria-disabled={demonstrating} onClick={act ? () => act('recognize-neurology-gbs-high-risk-respiratory-decline-without-score-or-single-cutoff') : undefined}>Recognize respiratory risk</Button>}
        {recognition && !ownership && <Button className="crisis-drug__action" aria-disabled={demonstrating} onClick={act ? () => act('activate-neurology-gbs-qualified-neurocritical-respiratory-airway-and-cardiac-ownership') : undefined}>Activate airway + cardiac owners</Button>}
      </div>
      <p className="field__hint">Oxygen saturation can remain reassuring while neuromuscular breathing fails. Qualified teams integrate functional speed, bulbar and cough function, breathing pattern, serial mechanics, gas exchange, and dysautonomia. This lab exposes no learner test, score, oxygen, ventilation, drug, rhythm, pressure, airway, or procedure control.</p>
    </section>
    <section className="syringe" aria-labelledby="neurology-gbs-later-title">
      <div id="neurology-gbs-later-title" className="syringe__name">Weakness is not just motor.</div>
      <div className="syringe__meta">fixed 4-hour report · worse bulbar + ventilatory function · wider HR + BP lability</div>
      <p className="syringe__remaining" role="status">{handoff ? 'Respiratory, airway, secretion, dysautonomia, treatment, and outcome uncertainty handed off.' : later ? 'The authored decline is wider and faster. Airway, treatment, rhythm, pressure, and outcome remain expert work.' : ownership ? 'Qualified ownership is active. Review the fixed 4-hour respiratory, bulbar, and autonomic report.' : 'Complete trajectory, evidence, recognition, and ownership before reassessment.'}</p>
      <div className="syringe__presets">
        {ownership && !later && <Button className="crisis-drug__action" aria-disabled={demonstrating} onClick={act ? () => act('review-neurology-gbs-strict-later-respiratory-bulbar-and-autonomic-trajectory') : undefined}>Review the 4-hour decline</Button>}
        {later && !handoff && <Button className="crisis-drug__action" aria-disabled={demonstrating} onClick={act ? () => act('handoff-neurology-gbs-airway-dysautonomia-treatment-recurrence-and-active-risk') : undefined}>Hand off airway + autonomic risk</Button>}
      </div>
      <p className="field__hint">The later mechanics, gas, bulbar findings, and heart-rate and blood-pressure range are fixed scenario evidence. They do not supply a universal airway threshold, treatment choice, treatment response, durable stability, recovery, disposition, prognosis, or outcome.</p>
    </section>
  </div>;
}
