/**
 * EmergencyAnaphylaxisTray, moved out of `ActionCockpit.tsx` unchanged.
 *
 * The cockpit defined this tray inline and rendered it behind a `hasEmergencyAnaphylaxisResponse` gate
 * computed from the scenario, so every specialty downloaded it. That gate is now this tray's
 * `supports` predicate in `trays.ts`; the body below is the original.
 */
import type { EquipmentSnapshot } from '@platform/kernel/protocol';
import { emergencyAnaphylaxisInlinePrompt } from './tutor/emergency-anaphylaxis-guidance';
import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import { TutorPanel, WatchingNotice } from '@anesthesia/ui/tutor-panel';
import { Badge, Button } from '@platform/ui';

export function EmergencyAnaphylaxisTray({ assessment, scenarioVersion, guidance = 'unassisted', demonstrating = false, onAction }: {
  assessment?: NonNullable<EquipmentSnapshot['resuscitation']['emergencyAnaphylaxisAssessment']>;
  scenarioVersion: string;
  guidance?: GuidanceLevel;
  demonstrating?: boolean;
  onAction: (action: string) => void;
}) {
  const reviewed = assessment?.patternReviewedAtTick != null;
  const positioned = assessment?.positionedAndHelpedAtTick != null;
  const epinephrine = assessment?.imEpinephrineAtTick != null;
  const oxygen = assessment?.oxygenAtTick != null;
  const fluid = assessment?.crystalloidAtTick != null;
  const reassessed = assessment?.reassessedAtTick != null;
  const prompt = demonstrating ? null
    : emergencyAnaphylaxisInlinePrompt(guidance, { scenarioVersion, patient: assessment });
  const act = demonstrating ? undefined : onAction;
  return (
    <div style={{ display: 'grid', gap: 'var(--space-4)' }}>
      <WatchingNotice demonstrating={demonstrating} />
      <TutorPanel prompt={prompt} />
      <div className="tray-grid">
      <section className="syringe" aria-labelledby="ed-anaphylaxis-recognition-title">
        <div id="ed-anaphylaxis-recognition-title" className="syringe__name">Recognize and lead</div>
        <Badge kind="teaching">Fixed community vignette</Badge>
        <div className="syringe__meta">Airway · breathing · circulation · exposure</div>
        <p className="syringe__remaining" role="status">
          {epinephrine ? 'First-line IM epinephrine recorded'
            : positioned ? 'Support mobilized · first-line treatment next'
              : reviewed ? 'Systemic pattern reviewed · lead the response'
                : 'Abrupt multisystem deterioration'}
        </p>
        <div className="syringe__presets">
          <Button className="crisis-drug__action" disabled={reviewed}
            aria-disabled={demonstrating} onClick={act ? () => act('review-systemic-pattern') : undefined}>
            Review systemic pattern
          </Button>
          <Button className="crisis-drug__action" disabled={!reviewed || positioned}
            aria-disabled={demonstrating} onClick={act ? () => act('position-and-call-for-help') : undefined}>
            Position + call for help
          </Button>
          <Button className="crisis-drug__action" disabled={!positioned || epinephrine}
            aria-disabled={demonstrating} onClick={act ? () => act('give-im-epinephrine') : undefined}>
            Give 500 µg epinephrine IM
          </Button>
        </div>
        <p className="field__hint">This is a fixed adult first-line action, not a dosing calculator or injection-technique trainer. IV bolus epinephrine is not offered.</p>
      </section>
      <section className="syringe" aria-labelledby="ed-anaphylaxis-support-title">
        <div id="ed-anaphylaxis-support-title" className="syringe__name">Support and reassess</div>
        <div className="syringe__meta">Oxygen · isotonic crystalloid · serial review</div>
        <p className="syringe__remaining" role="status">
          {reassessed ? 'Initial response reassessed'
            : oxygen && fluid ? 'Parallel support recorded · reassess next'
              : epinephrine ? 'First-line treatment recorded · parallel support open'
                : 'First-line treatment pending'}
        </p>
        <div className="syringe__presets">
          <Button className="crisis-drug__action" disabled={!epinephrine || oxygen}
            aria-disabled={demonstrating} onClick={act ? () => act('give-high-flow-oxygen') : undefined}>
            Record high-flow oxygen
          </Button>
          <Button className="crisis-drug__action" disabled={!epinephrine || fluid}
            aria-disabled={demonstrating} onClick={act ? () => act('begin-fixed-crystalloid') : undefined}>
            Begin fixed 1,500 mL crystalloid
          </Button>
          <Button className="crisis-drug__action" disabled={!oxygen || !fluid || reassessed}
            aria-disabled={demonstrating} onClick={act ? () => act('reassess-response') : undefined}>
            Reassess airway + perfusion
          </Button>
        </div>
        <p className="field__hint">No repeat-dose clock, refractory infusion, bronchodilator, antihistamine, steroid, airway procedure, observation, discharge, referral, or outcome is offered.</p>
      </section>
      </div>
    </div>
  );
}
