/**
 * PediatricAnaphylaxisTray, moved out of `ActionCockpit.tsx` unchanged.
 *
 * The cockpit defined this tray inline and rendered it behind a `hasPediatricAnaphylaxisResponse` gate
 * computed from the scenario, so every specialty downloaded it. That gate is now this tray's
 * `supports` predicate in `trays.ts`; the body below is the original.
 */
import type { EquipmentSnapshot } from '@platform/kernel/protocol';
import { pediatricAnaphylaxisInlinePrompt } from './tutor/pediatric-anaphylaxis-guidance';
import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import { TutorPanel, WatchingNotice } from '@anesthesia/ui/tutor-panel';
import { Badge, Button } from '@platform/ui';

export function PediatricAnaphylaxisTray({ assessment, scenarioVersion, guidance = 'unassisted', demonstrating = false, onAction }: {
  assessment?: NonNullable<EquipmentSnapshot['resuscitation']['pediatricAnaphylaxisAssessment']>;
  scenarioVersion: string;
  guidance?: GuidanceLevel;
  demonstrating?: boolean;
  onAction: (action: string) => void;
}) {
  const trajectory = assessment?.trajectoryAtTick != null;
  const recognition = assessment?.recognitionAtTick != null;
  const rescue = assessment?.firstLineAtTick != null;
  const safety = assessment?.safetyAtTick != null;
  const later = assessment?.laterResponseAtTick != null;
  const handoff = assessment?.handoffAtTick != null;
  const prompt = demonstrating ? null
    : pediatricAnaphylaxisInlinePrompt(guidance, { scenarioVersion, patient: assessment });
  const act = demonstrating ? undefined : onAction;
  return <div style={{ display: 'grid', gap: 'var(--space-4)' }}>
    <WatchingNotice demonstrating={demonstrating} />
    <TutorPanel prompt={prompt} />
    <div className="tray-grid">
    <section className="syringe" aria-labelledby="pediatric-anaphylaxis-pattern-title">
      <div id="pediatric-anaphylaxis-pattern-title" className="syringe__name">See the whole allergic pattern.</div>
      <Badge kind="teaching">exposure · airway · breathing · gut · perfusion</Badge>
      <div className="syringe__meta">6 years · 20 kg · first-line care reported · symptoms persist</div>
      <p className="syringe__remaining">
        {safety ? 'Airway, asthma, cause, and refractory-risk review remain active'
          : rescue ? 'Qualified rescue is active · complete the safety review'
            : recognition ? 'Persistent ABC compromise · qualified rescue matters now'
              : trajectory ? 'Now recognize the persistent multisystem pattern'
                : 'Start with the exposure, reported care, and whole child.'}
      </p>
      <div className="syringe__presets">
        {!trajectory && <Button className="crisis-drug__action"
          aria-disabled={demonstrating} onClick={act ? () => act('reconcile-pediatric-anaphylaxis-exposure-care-and-whole-child') : undefined}>Review exposure + whole-child trajectory</Button>}
        {trajectory && !recognition && <Button className="crisis-drug__action"
          aria-disabled={demonstrating} onClick={act ? () => act('recognize-pediatric-anaphylaxis-persistent-abc-compromise') : undefined}>Recognize persistent ABC compromise</Button>}
        {recognition && !rescue && <Button className="crisis-drug__action"
          aria-disabled={demonstrating} onClick={act ? () => act('activate-pediatric-anaphylaxis-qualified-repeat-first-line-and-resuscitation-ownership') : undefined}>Activate qualified anaphylaxis rescue</Button>}
        {rescue && !safety && <Button className="crisis-drug__action"
          aria-disabled={demonstrating} onClick={act ? () => act('review-pediatric-anaphylaxis-airway-asthma-causes-and-refractory-boundary') : undefined}>Review airway + asthma + causes</Button>}
      </div>
      <p className="field__hint">Experienced pediatric, allergy, nursing, pharmacy, and airway-capable teams own first-line medicine, circulation and airway support, monitoring, access, devices, cause review, and escalation. This surface exposes no learner product, drug, dose, route, interval, device, procedure, or treatment control.</p>
    </section>
    <section className="syringe" aria-labelledby="pediatric-anaphylaxis-response-title">
      <div id="pediatric-anaphylaxis-response-title" className="syringe__name">Improvement needs watchfulness.</div>
      <Badge kind="teaching">response · recurrence · cofactors · observation · ownership</Badge>
      <div className="syringe__meta">fixed minute-18 report · active recurrence risk</div>
      <p className="syringe__remaining" role="status">
        {handoff ? 'Active anaphylaxis risk and owners handed off'
          : later ? 'Partial improvement only. Recurrence and cause risk remain open.'
            : safety ? 'Review the fixed response after elapsed qualified care'
              : rescue ? 'Qualified rescue is active · complete airway and recurrence review'
                : 'Qualified rescue comes first; safety review stays close.'}
      </p>
      <div className="syringe__presets">
        {safety && !later && <Button className="crisis-drug__action"
          aria-disabled={demonstrating} onClick={act ? () => act('review-pediatric-anaphylaxis-later-response') : undefined}>Review the minute-18 response</Button>}
        {later && !handoff && <Button className="crisis-drug__action"
          aria-disabled={demonstrating} onClick={act ? () => act('handoff-pediatric-anaphylaxis-observation-allergy-and-caregiver-risk') : undefined}>Hand off active anaphylaxis risk</Button>}
      </div>
      <p className="field__hint">Partial improvement does not prove treatment effect, trigger, durable airway or circulatory recovery, refractory-risk closure, recurrence exclusion, discharge readiness, or outcome.</p>
    </section>
    </div>
  </div>;
}
