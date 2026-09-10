/**
 * BronchiectasisMucusPluggingTray, moved out of `ActionCockpit.tsx` unchanged.
 *
 * The cockpit defined this tray inline and rendered it behind a `hasBronchiectasisMucusPluggingResponse` gate
 * computed from the scenario, so every specialty downloaded it. The gate is now this tray's
 * `supports` predicate in `trays.ts`; the body below is the original.
 */
import type { EquipmentSnapshot } from '@platform/kernel/protocol';
import { bronchiectasisMucusPluggingInlinePrompt } from './tutor/bronchiectasis-mucus-plugging-reassessment-guidance';
import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import { TutorPanel } from '@anesthesia/ui/tutor-panel';
import { Badge, Button } from '@platform/ui';

export function BronchiectasisMucusPluggingTray({ assessment, scenarioVersion, onAction, guidance = 'unassisted', demonstrating = false }: {
  assessment?: NonNullable<EquipmentSnapshot['resuscitation']['bronchiectasisMucusPluggingAssessment']>;
  onAction: (action: string) => void;
  scenarioVersion: string;
  guidance?: GuidanceLevel;
  demonstrating?: boolean;
}) {
  const prompt = bronchiectasisMucusPluggingInlinePrompt(guidance, { scenarioVersion, bronchiectasisMucusPlugging: assessment });
  const act = demonstrating ? undefined : onAction;
  const trajectory = assessment?.trajectoryAtTick != null;
  const evidence = assessment?.evidenceAtTick != null;
  const clearance = assessment?.clearanceIntentAtTick != null;
  const response = assessment?.responseAtTick != null;
  const escalation = assessment?.escalationAtTick != null;
  const handoff = assessment?.handoffAtTick != null;
  return <div className="tray-grid">
    {demonstrating && <p className="syringe__remaining">Watching the worked example. Choose “Take the controls” to make your own decisions.</p>}
    <TutorPanel prompt={demonstrating ? null : prompt} />
    <section className="syringe" aria-labelledby="bronchiectasis-mucus-pattern-title">
      <div id="bronchiectasis-mucus-pattern-title" className="syringe__name">The image says where. The trajectory says why it matters.</div>
      <Badge kind="teaching">spontaneous breathing · focal collapse · stable circulation</Badge>
      <div className="syringe__meta">baseline · cough · secretions · oxygenation · fixed imaging</div>
      <p className="syringe__remaining" role="status">{clearance ? 'Individualized team trial recorded · advance to its response' : evidence ? 'Working pattern held beside open causes' : trajectory ? 'Whole-patient change reconciled · review the fixed evidence' : 'Begin with the change in clearance capacity'}</p>
      <div className="syringe__presets">
        <Button className="crisis-drug__action" disabled={trajectory} aria-disabled={demonstrating} onClick={act ? () => act('reconcile-bronchiectasis-mucus-plugging-trajectory') : undefined}>Review patient + clearance trajectory</Button>
        <Button className="crisis-drug__action" disabled={!trajectory || evidence} aria-disabled={demonstrating} onClick={act ? () => act('review-bronchiectasis-mucus-plugging-evidence-and-alternatives') : undefined}>Review focal evidence + alternatives</Button>
        <Button className="crisis-drug__action" disabled={!evidence || clearance} aria-disabled={demonstrating} onClick={act ? () => act('record-bronchiectasis-mucus-plugging-supported-airway-clearance-intent') : undefined}>Record individualized clearance trial</Button>
      </div>
      <p className="field__hint">Respiratory-physiotherapy expertise, preference, tolerance, and an expected response shape the trial. No technique, device, position, duration, frequency, oxygen setting, or drug is selected.</p>
    </section>
    <section className="syringe" aria-labelledby="bronchiectasis-mucus-response-title">
      <div id="bronchiectasis-mucus-response-title" className="syringe__name">Better is useful. Persistent is useful, too.</div>
      <Badge kind="teaching">partial response · residual focal collapse · cause open</Badge>
      <div className="syringe__meta">cough · speech · work · SpO₂ · air entry · re-expansion</div>
      <p className="syringe__remaining" role="status">{handoff ? 'Response + unresolved focal work handed off' : escalation ? 'Experienced evaluation connected · advance time before handoff' : response ? 'Clearance improved · focal collapse and cause remain active' : 'Review the authored team response first'}</p>
      <div className="syringe__presets">
        <Button className="crisis-drug__action" disabled={!clearance || response} aria-disabled={demonstrating} onClick={act ? () => act('review-bronchiectasis-mucus-plugging-later-response') : undefined}>Review later patient + focal response</Button>
        <Button className="crisis-drug__action" disabled={!response || escalation} aria-disabled={demonstrating} onClick={act ? () => act('escalate-bronchiectasis-mucus-plugging-persistent-collapse') : undefined}>Connect persistent-collapse evaluation</Button>
        <Button className="crisis-drug__action" disabled={!escalation || handoff} aria-disabled={demonstrating} onClick={act ? () => act('handoff-bronchiectasis-mucus-plugging-reassessment') : undefined}>Hand off unresolved focal work</Button>
      </div>
      <p className="field__hint">No sputum test, clearance maneuver, suction, bronchoscopy, plug removal, biopsy, treatment, diagnosis, disposition, recurrence, or outcome is performed or chosen.</p>
    </section>
  </div>;
}
