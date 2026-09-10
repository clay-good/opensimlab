/**
 * PediatricFebrileSeizureTray, moved out of `ActionCockpit.tsx` unchanged.
 *
 * The cockpit defined this tray inline and rendered it behind a `hasPediatricFebrileSeizureResponse` gate
 * computed from the scenario, so every specialty downloaded it. That gate is now this tray's
 * `supports` predicate in `trays.ts`; the body below is the original.
 */
import type { EquipmentSnapshot } from '@platform/kernel/protocol';
import { pediatricFebrileSeizureInlinePrompt } from './tutor/pediatric-febrile-seizure-guidance';
import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import { TutorPanel, WatchingNotice } from '@anesthesia/ui/tutor-panel';
import { Badge, Button } from '@platform/ui';

export function PediatricFebrileSeizureTray({ assessment, scenarioVersion, guidance = 'unassisted', demonstrating = false, onAction }: {
  assessment?: NonNullable<EquipmentSnapshot['resuscitation']['pediatricFebrileSeizureAssessment']>;
  scenarioVersion: string;
  guidance?: GuidanceLevel;
  demonstrating?: boolean;
  onAction: (action: string) => void;
}) {
  const trajectory = assessment?.trajectoryAtTick != null;
  const recognition = assessment?.recognitionAtTick != null;
  const care = assessment?.careAtTick != null;
  const safety = assessment?.safetyAtTick != null;
  const later = assessment?.laterResponseAtTick != null;
  const handoff = assessment?.handoffAtTick != null;
  const prompt = demonstrating ? null
    : pediatricFebrileSeizureInlinePrompt(guidance, { scenarioVersion, patient: assessment });
  const act = demonstrating ? undefined : onAction;
  return <div style={{ display: 'grid', gap: 'var(--space-4)' }}>
    <WatchingNotice demonstrating={demonstrating} />
    <TutorPanel prompt={prompt} />
    <div className="tray-grid">
    <section className="syringe" aria-labelledby="pediatric-febrile-seizure-pattern-title">
      <div id="pediatric-febrile-seizure-pattern-title" className="syringe__name">Read the event, then the child.</div>
      <Badge kind="teaching">seizure · fever · recovery · breathing · perfusion</Badge>
      <div className="syringe__meta">2 years · 12 kg · brief generalized seizure stopped</div>
      <p className="syringe__remaining">
        {care && safety ? 'Qualified observation and safety review are active together'
          : safety ? 'Safety review is active · qualified observation still matters'
            : care ? 'Qualified observation is active · keep safety review moving'
              : recognition ? 'Febrile-seizure pattern authored · danger boundary remains open'
                : trajectory ? 'Now connect fever and recovery without closing the cause'
                  : 'Start with the event, whole child, and recovery.'}
      </p>
      <div className="syringe__presets">
        {!trajectory && <Button className="crisis-drug__action"
          aria-disabled={demonstrating} onClick={act ? () => act('reconcile-pediatric-febrile-seizure-event-recovery-and-fever') : undefined}>Review seizure + whole-child recovery</Button>}
        {trajectory && !recognition && <Button className="crisis-drug__action"
          aria-disabled={demonstrating} onClick={act ? () => act('recognize-pediatric-febrile-seizure-pattern-and-danger-boundary') : undefined}>Recognize the febrile-seizure pattern</Button>}
        {recognition && !care && <Button className="crisis-drug__action"
          aria-disabled={demonstrating} onClick={act ? () => act('activate-pediatric-febrile-seizure-qualified-care-ownership') : undefined}>Confirm qualified observation</Button>}
        {recognition && !safety && <Button className="crisis-drug__action"
          aria-disabled={demonstrating} onClick={act ? () => act('review-pediatric-febrile-seizure-infection-recurrence-and-alternatives') : undefined}>Review red flags + recurrence</Button>}
      </div>
      <p className="field__hint">Experienced teams own examination, serious-infection and alternative-cause review, testing, medicines, airway support, observation, escalation, and caregiver communication. This lab exposes no learner test, drug, dose, route, access, device, airway, procedure, treatment, or disposition control.</p>
    </section>
    <section className="syringe" aria-labelledby="pediatric-febrile-seizure-response-title">
      <div id="pediatric-febrile-seizure-response-title" className="syringe__name">Reassurance needs boundaries.</div>
      <Badge kind="teaching">recovery · red flags · recurrence · caregiver · ownership</Badge>
      <div className="syringe__meta">fixed minute-30 report · cause remains open</div>
      <p className="syringe__remaining" role="status">
        {handoff ? 'Active safety, recurrence, and caregiver work handed off'
          : later ? 'The child is improving. Cause and recurrence remain open.'
            : care && safety ? 'Review the fixed report after elapsed parallel care'
              : safety ? 'Safety review is active · confirm qualified observation'
                : care ? 'Observation is active · review red flags and recurrence'
                  : 'Qualified observation and safety review should move together.'}
      </p>
      <div className="syringe__presets">
        {care && safety && !later && <Button className="crisis-drug__action"
          aria-disabled={demonstrating} onClick={act ? () => act('review-pediatric-febrile-seizure-later-response') : undefined}>Review the 30-minute report</Button>}
        {later && !handoff && <Button className="crisis-drug__action"
          aria-disabled={demonstrating} onClick={act ? () => act('handoff-pediatric-febrile-seizure-active-risk') : undefined}>Hand off safety + caregiver guidance</Button>}
      </div>
      <p className="field__hint">The fixed report does not prove a benign cause, exclude serious infection, predict recurrence, establish durable neurological recovery, or determine discharge readiness or outcome.</p>
    </section>
    </div>
  </div>;
}
