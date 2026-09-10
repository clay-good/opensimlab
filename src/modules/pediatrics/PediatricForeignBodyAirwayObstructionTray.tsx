/**
 * PediatricForeignBodyAirwayObstructionTray, moved out of `ActionCockpit.tsx` unchanged.
 *
 * The cockpit defined this tray inline and rendered it behind a `hasPediatricForeignBodyAirwayObstructionResponse` gate
 * computed from the scenario, so every specialty downloaded it. That gate is now this tray's
 * `supports` predicate in `trays.ts`; the body below is the original.
 */
import type { EquipmentSnapshot } from '@platform/kernel/protocol';
import { pediatricFbaoInlinePrompt } from './tutor/pediatric-fbao-guidance';
import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import { TutorPanel, WatchingNotice } from '@anesthesia/ui/tutor-panel';
import { Badge, Button } from '@platform/ui';

export function PediatricForeignBodyAirwayObstructionTray({ assessment, scenarioVersion, guidance = 'unassisted', demonstrating = false, onAction }: {
  assessment?: NonNullable<EquipmentSnapshot['resuscitation']['pediatricForeignBodyAirwayObstructionAssessment']>;
  scenarioVersion: string;
  guidance?: GuidanceLevel;
  demonstrating?: boolean;
  onAction: (action: string) => void;
}) {
  const reconciled = assessment?.reconciledAtTick != null;
  const effectiveCough = assessment?.effectiveCoughAtTick != null;
  const severe = assessment?.severeResponsiveAtTick != null;
  const responsiveCare = assessment?.responsivePathwayAtTick != null;
  const unresponsiveCare = assessment?.unresponsivePathwayAtTick != null;
  const handoff = assessment?.handoffAtTick != null;
  const prompt = demonstrating ? null
    : pediatricFbaoInlinePrompt(guidance, { scenarioVersion, patient: assessment });
  const act = demonstrating ? undefined : onAction;
  return <div style={{ display: 'grid', gap: 'var(--space-4)' }}>
    <WatchingNotice demonstrating={demonstrating} />
    <TutorPanel prompt={prompt} />
    <div className="tray-grid">
    <section className="syringe" aria-labelledby="pediatric-fbao-pattern-title">
      <div id="pediatric-fbao-pattern-title" className="syringe__name">Let the child’s sound guide urgency.</div>
      <Badge kind="teaching">onset · cough · voice · airflow · color · responsiveness</Badge>
      <div className="syringe__meta">6 years · 20 kg · abrupt choking · initially responsive</div>
      <p className="syringe__remaining">
        {responsiveCare ? 'Qualified responsive-child care is active · keep watching responsiveness'
          : severe ? 'Severe responsive obstruction · qualified care matters now'
            : effectiveCough ? 'Effective cough is preserved · watch for severe obstruction'
              : reconciled ? 'Preserve effective cough and stay close'
                : 'Start with the event, cough, voice, airflow, and responsiveness.'}
      </p>
      <div className="syringe__presets">
        {!reconciled && <Button className="crisis-drug__action"
          aria-disabled={demonstrating} onClick={act ? () => act('reconcile-pediatric-foreign-body-airway-obstruction-event-cough-and-whole-child') : undefined}>Review choking + whole-child signs</Button>}
        {reconciled && !effectiveCough && <Button className="crisis-drug__action"
          aria-disabled={demonstrating} onClick={act ? () => act('preserve-pediatric-foreign-body-airway-obstruction-effective-cough-and-surveillance') : undefined}>Preserve effective cough + watch closely</Button>}
        {effectiveCough && !severe && <Button className="crisis-drug__action"
          aria-disabled={demonstrating} onClick={act ? () => act('recognize-pediatric-foreign-body-airway-obstruction-severe-responsive-transition') : undefined}>Recognize severe responsive obstruction</Button>}
        {severe && !responsiveCare && <Button className="crisis-drug__action"
          aria-disabled={demonstrating} onClick={act ? () => act('activate-pediatric-foreign-body-airway-obstruction-qualified-responsive-pathway') : undefined}>Activate qualified choking rescue</Button>}
      </div>
      <p className="field__hint">Qualified pediatric and emergency responders own age-appropriate obstruction care, monitoring, visible-object review, and escalation. This surface exposes no learner blow, thrust, sweep, suction, compression, breath, oxygen, device, airway procedure, object removal, or treatment control.</p>
    </section>
    <section className="syringe" aria-labelledby="pediatric-fbao-response-title">
      <div id="pediatric-fbao-response-title" className="syringe__name">Responsiveness changes the pathway.</div>
      <Badge kind="teaching">airflow · responsiveness · obstruction · visible object · resuscitation · ownership</Badge>
      <div className="syringe__meta">fixed 3-minute report · pulse status remains unreported</div>
      <p className="syringe__remaining" role="status">
        {handoff ? 'Active obstruction risk and owners handed off.'
          : unresponsiveCare ? 'The child is unresponsive. Qualified unresponsive CPR is active.'
            : responsiveCare ? 'Qualified responsive-child care is active. Review the fixed response after elapsed care.'
              : severe ? 'Activate the qualified responsive-child pathway.'
                : 'Cough, airflow, and responsiveness guide the next step.'}
      </p>
      <div className="syringe__presets">
        {responsiveCare && !unresponsiveCare && <Button className="crisis-drug__action"
          aria-disabled={demonstrating} onClick={act ? () => act('activate-pediatric-foreign-body-airway-obstruction-unresponsive-cpr-pathway') : undefined}>Review transition + activate unresponsive care</Button>}
        {unresponsiveCare && !handoff && <Button className="crisis-drug__action"
          aria-disabled={demonstrating} onClick={act ? () => act('handoff-pediatric-foreign-body-airway-obstruction-active-risk') : undefined}>Hand off active obstruction risk</Button>}
      </div>
      <p className="field__hint">The fixed transition does not prove object or location, pulse status, cardiac arrest, treatment modality or effect, clearance, neurological recovery, prognosis, or outcome. Only a visible object is reviewed; no blind sweep is exposed.</p>
    </section>
    </div>
  </div>;
}
