/**
 * PediatricStatusAsthmaticusTray, moved out of `ActionCockpit.tsx` unchanged.
 *
 * The cockpit defined this tray inline and rendered it behind a `hasPediatricStatusAsthmaticusResponse` gate
 * computed from the scenario, so every specialty downloaded it. That gate is now this tray's
 * `supports` predicate in `trays.ts`; the body below is the original.
 */
import type { EquipmentSnapshot } from '@platform/kernel/protocol';
import { pediatricStatusAsthmaticusInlinePrompt } from './tutor/pediatric-status-asthmaticus-guidance';
import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import { TutorPanel, WatchingNotice } from '@anesthesia/ui/tutor-panel';
import { Badge, Button } from '@platform/ui';

export function PediatricStatusAsthmaticusTray({ assessment, scenarioVersion, guidance = 'unassisted', demonstrating = false, onAction }: {
  assessment?: NonNullable<EquipmentSnapshot['resuscitation']['pediatricStatusAsthmaticusAssessment']>;
  scenarioVersion: string;
  guidance?: GuidanceLevel;
  demonstrating?: boolean;
  onAction: (action: string) => void;
}) {
  const trajectory = assessment?.trajectoryAtTick != null;
  const nonresponse = assessment?.nonresponseAtTick != null;
  const escalation = assessment?.escalationAtTick != null;
  const secondLine = assessment?.secondLineIntentAtTick != null;
  const later = assessment?.laterResponseAtTick != null;
  const handoff = assessment?.handoffAtTick != null;
  const unsupported = assessment?.lastUnsupportedChoice;
  const prompt = demonstrating ? null
    : pediatricStatusAsthmaticusInlinePrompt(guidance, { scenarioVersion, patient: assessment });
  const act = demonstrating ? undefined : onAction;
  return <div style={{ display: 'grid', gap: 'var(--space-4)' }}>
    <WatchingNotice demonstrating={demonstrating} />
    <TutorPanel prompt={prompt} />
    <div className="tray-grid">
    <section className="syringe" aria-labelledby="pediatric-status-asthmaticus-pattern-title">
      <div id="pediatric-status-asthmaticus-pattern-title" className="syringe__name">Read the whole child.</div>
      <Badge kind="teaching">history · prior care · speech · work · air entry</Badge>
      <div className="syringe__meta">10 years · 32 kg · severe nonresponse at minute 60</div>
      <p className="syringe__remaining" role="status">
        {secondLine ? 'Critical-care ownership active · qualified second-line care recorded'
          : unsupported === 'trigger-review-delay' ? 'Review causes in parallel with qualified care'
            : escalation ? 'Escalation active · record qualified second-line intent'
              : nonresponse ? 'Severe nonresponse clear · escalate before fatigue'
                : unsupported === 'radiograph-delay' ? 'Routine imaging does not delay severe-asthma care'
                  : unsupported === 'force-peak-flow' ? 'Use the whole child when peak flow is not feasible'
                    : trajectory ? 'Trajectory reconciled · recognize persistent severe obstruction'
                      : 'Start with asthma risk, verified care, and current function'}
      </p>
      <div className="syringe__presets">
        {!trajectory && <Button className="crisis-drug__action"
          aria-disabled={demonstrating} onClick={act ? () => act('reconcile-pediatric-status-asthmaticus-treatment-and-trajectory') : undefined}>Review trajectory + prior care</Button>}
        {trajectory && !nonresponse && <Button className="crisis-drug__action"
          aria-disabled={demonstrating} onClick={act ? () => act('recognize-pediatric-status-asthmaticus-severe-nonresponse') : undefined}>Recognize severe nonresponse</Button>}
        {nonresponse && !escalation && <Button className="crisis-drug__action"
          aria-disabled={demonstrating} onClick={act ? () => act('activate-pediatric-status-asthmaticus-critical-care-escalation') : undefined}>Activate pediatric critical-care help</Button>}
        {escalation && !secondLine && <Button className="crisis-drug__action"
          aria-disabled={demonstrating} onClick={act ? () => act('record-pediatric-status-asthmaticus-qualified-second-line-care-intent') : undefined}>Record qualified care + monitoring</Button>}
      </div>
      <p className="field__hint">Experienced pediatric staff own oxygen, inhaled and systemic medicines, monitoring, access, doses, routes, devices, and delivery. The learner records recognition and qualified ownership only.</p>
    </section>
    <section className="syringe" aria-labelledby="pediatric-status-asthmaticus-response-title">
      <div id="pediatric-status-asthmaticus-response-title" className="syringe__name">Improvement must hold.</div>
      <Badge kind="teaching">speech · effort · air entry · oxygen need · time</Badge>
      <div className="syringe__meta">fixed minute-90 response · active severe-asthma risk</div>
      <p className="syringe__remaining" role="status">
        {handoff ? 'Residual obstruction, oxygen need, triggers, and owners handed off'
          : unsupported === 'saturation-discharge' ? 'A better saturation is not discharge readiness'
            : later ? 'Partial improvement only · hand off active risk'
              : secondLine ? 'Review the whole child after elapsed qualified care'
                : 'First recognize nonresponse and activate qualified care'}
      </p>
      <div className="syringe__presets">
        {secondLine && !later && <Button className="crisis-drug__action"
          aria-disabled={demonstrating} onClick={act ? () => act('review-pediatric-status-asthmaticus-later-response') : undefined}>Review the later response</Button>}
        {later && !handoff && <Button className="crisis-drug__action"
          aria-disabled={demonstrating} onClick={act ? () => act('handoff-pediatric-status-asthmaticus-reassessment') : undefined}>Hand off active severe asthma</Button>}
      </div>
      <p className="field__hint">Partial improvement does not prove durable recovery. Keep residual work, air entry, oxygen need, treatment exposure, toxicity surveillance, recurrence, access, and caregiver context visible.</p>
    </section>
    </div>
  </div>;
}
