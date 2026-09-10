/**
 * PediatricStatusEpilepticusTray, moved out of `ActionCockpit.tsx` unchanged.
 *
 * The cockpit defined this tray inline and rendered it behind a `hasPediatricStatusEpilepticusResponse` gate
 * computed from the scenario, so every specialty downloaded it. That gate is now this tray's
 * `supports` predicate in `trays.ts`; the body below is the original.
 */
import type { EquipmentSnapshot } from '@platform/kernel/protocol';
import { pediatricStatusEpilepticusInlinePrompt } from './tutor/pediatric-status-epilepticus-guidance';
import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import { TutorPanel, WatchingNotice } from '@anesthesia/ui/tutor-panel';
import { Badge, Button } from '@platform/ui';

export function PediatricStatusEpilepticusTray({ assessment, scenarioVersion, guidance = 'unassisted', demonstrating = false, onAction }: {
  assessment?: NonNullable<EquipmentSnapshot['resuscitation']['pediatricStatusEpilepticusAssessment']>;
  scenarioVersion: string;
  guidance?: GuidanceLevel;
  demonstrating?: boolean;
  onAction: (action: string) => void;
}) {
  const trajectory = assessment?.trajectoryAtTick != null;
  const recognition = assessment?.recognitionAtTick != null;
  const secondLine = assessment?.secondLineAtTick != null;
  const safety = assessment?.safetyAtTick != null;
  const later = assessment?.laterResponseAtTick != null;
  const handoff = assessment?.handoffAtTick != null;
  const prompt = demonstrating ? null
    : pediatricStatusEpilepticusInlinePrompt(guidance, { scenarioVersion, patient: assessment });
  const act = demonstrating ? undefined : onAction;
  return <div style={{ display: 'grid', gap: 'var(--space-4)' }}>
    <WatchingNotice demonstrating={demonstrating} />
    <TutorPanel prompt={prompt} />
    <div className="tray-grid">
    <section className="syringe" aria-labelledby="pediatric-status-epilepticus-pattern-title">
      <div id="pediatric-status-epilepticus-pattern-title" className="syringe__name">Read the clock and the child.</div>
      <Badge kind="teaching">clock · movement · recovery · breathing · pulse · glucose</Badge>
      <div className="syringe__meta">6 years · 20 kg · 14:30 without recovery after reported first-line care</div>
      <p className="syringe__remaining">
        {secondLine && safety ? 'Qualified second-line ownership and safety review are active'
          : safety ? 'Safety review is active · qualified second-line ownership still matters'
            : secondLine ? 'Qualified second-line ownership is active · keep safety review moving'
              : recognition ? 'Ongoing convulsive status · urgent next-line ownership matters'
                : trajectory ? 'Now recognize status after reported first-line care'
                  : 'Start with the clock, reported care, and whole child.'}
      </p>
      <div className="syringe__presets">
        {!trajectory && <Button className="crisis-drug__action"
          aria-disabled={demonstrating} onClick={act ? () => act('reconcile-pediatric-status-epilepticus-clock-care-and-whole-child') : undefined}>Review clock + first-line care</Button>}
        {trajectory && !recognition && <Button className="crisis-drug__action"
          aria-disabled={demonstrating} onClick={act ? () => act('recognize-pediatric-convulsive-status-after-first-line-care') : undefined}>Recognize ongoing convulsive status</Button>}
        {recognition && !secondLine && <Button className="crisis-drug__action"
          aria-disabled={demonstrating} onClick={act ? () => act('activate-pediatric-status-epilepticus-qualified-second-line-ownership') : undefined}>Activate qualified second-line ownership</Button>}
        {recognition && !safety && <Button className="crisis-drug__action"
          aria-disabled={demonstrating} onClick={act ? () => act('review-pediatric-status-epilepticus-airway-causes-and-refractory-boundary') : undefined}>Review airway + causes + boundaries</Button>}
      </div>
      <p className="field__hint">Experienced pediatric, neurological, pharmacy, nursing, and airway-capable teams own medicines, monitoring, glucose and cause work, oxygenation, access, devices, procedures, and escalation. The learner selects or delivers none of them.</p>
    </section>
    <section className="syringe" aria-labelledby="pediatric-status-epilepticus-response-title">
      <div id="pediatric-status-epilepticus-response-title" className="syringe__name">Persistence changes the plan.</div>
      <Badge kind="teaching">response · airway · causes · escalation · ownership</Badge>
      <div className="syringe__meta">fixed minute-25 response · active neurological risk</div>
      <p className="syringe__remaining" role="status">
        {handoff ? 'Active seizure, recovery, and cause risk handed off'
          : later ? 'Visible movements stopped. Recovery and durable control remain open.'
            : secondLine && safety ? 'Review the fixed response after elapsed parallel care'
              : safety ? 'Safety review is active · activate qualified second-line ownership'
                : secondLine ? 'Second-line ownership is active · complete airway and cause review'
                  : 'Qualified escalation and safety review should move together.'}
      </p>
      <div className="syringe__presets">
        {secondLine && safety && !later && <Button className="crisis-drug__action"
          aria-disabled={demonstrating} onClick={act ? () => act('review-pediatric-status-epilepticus-later-response') : undefined}>Review the minute-25 response</Button>}
        {later && !handoff && <Button className="crisis-drug__action"
          aria-disabled={demonstrating} onClick={act ? () => act('handoff-pediatric-status-epilepticus-active-risk') : undefined}>Hand off active status risk</Button>}
      </div>
      <p className="field__hint">Stopped visible movements do not prove electrographic seizure control, durable seizure control, neurological recovery, causal closure, discharge readiness, or outcome.</p>
    </section>
    </div>
  </div>;
}
