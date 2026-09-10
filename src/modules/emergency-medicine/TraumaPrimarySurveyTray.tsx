/**
 * TraumaPrimarySurveyTray, moved out of `ActionCockpit.tsx` unchanged.
 *
 * The cockpit defined this tray inline and rendered it behind a `hasTraumaPrimarySurveyResponse` gate
 * computed from the scenario, so every specialty downloaded it. That gate is now this tray's
 * `supports` predicate in `trays.ts`; the body below is the original.
 */
import type { EquipmentSnapshot } from '@platform/kernel/protocol';
import { traumaPrimarySurveyInlinePrompt } from './tutor/trauma-primary-survey-guidance';
import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import { TutorPanel, WatchingNotice } from '@anesthesia/ui/tutor-panel';
import { Badge, Button } from '@platform/ui';

export function TraumaPrimarySurveyTray({ assessment, scenarioVersion, guidance = 'unassisted', demonstrating = false, onAction }: {
  assessment?: NonNullable<EquipmentSnapshot['resuscitation']['traumaPrimarySurveyAssessment']>;
  scenarioVersion: string;
  guidance?: GuidanceLevel;
  demonstrating?: boolean;
  onAction: (action: string) => void;
}) {
  const activated = assessment?.activatedAtTick != null;
  const hemorrhage = assessment?.catastrophicHemorrhageAtTick != null;
  const airwayBreathing = assessment?.airwayBreathingAtTick != null;
  const circulation = assessment?.circulationAtTick != null;
  const disabilityExposure = assessment?.disabilityExposureAtTick != null;
  const repeated = assessment?.repeatedAtTick != null;
  const prompt = demonstrating ? null
    : traumaPrimarySurveyInlinePrompt(guidance, { scenarioVersion, patient: assessment });
  const act = demonstrating ? undefined : onAction;
  return (
    <div style={{ display: 'grid', gap: 'var(--space-4)' }}>
      <WatchingNotice demonstrating={demonstrating} />
      <TutorPanel prompt={prompt} />
      <div className="tray-grid">
      <section className="syringe" aria-labelledby="trauma-sweep-title">
        <div id="trauma-sweep-title" className="syringe__name">Stop the leak. Keep the sweep moving.</div>
        <Badge kind="teaching">&lt;C&gt; · A · B</Badge>
        <div className="syringe__meta">35 min · failed pressure · pulse 128 · BP 86/54</div>
        <p className="syringe__remaining" role="status">
          {airwayBreathing ? 'Bleed controlled · airway patent · bilateral breathing present'
            : hemorrhage ? 'No visible limb flow · continue A + B'
              : activated ? 'Team ready · catastrophic hemorrhage first'
                : 'Mechanism + injuries + signs + treatment handoff pending'}
        </p>
        <div className="syringe__presets">
          <Button className="crisis-drug__action" disabled={activated}
            aria-disabled={demonstrating} onClick={act ? () => act('activate-trauma-primary-survey') : undefined}>Receive handoff + activate + declare sweep</Button>
          <Button className="crisis-drug__action" disabled={!activated || hemorrhage}
            aria-disabled={demonstrating} onClick={act ? () => act('control-trauma-catastrophic-hemorrhage') : undefined}>Control limb bleed + record time</Button>
          <Button className="crisis-drug__action" disabled={!hemorrhage || airwayBreathing}
            aria-disabled={demonstrating} onClick={act ? () => act('review-trauma-airway-and-breathing') : undefined}>Review airway + spine + breathing</Button>
        </div>
        <p className="field__hint">Catastrophic hemorrhage comes first. A currently patent airway and bilateral breathing are findings to recheck, not permission to skip A or B.</p>
      </section>
      <section className="syringe" aria-labelledby="trauma-repeat-title">
        <div id="trauma-repeat-title" className="syringe__name">Every intervention earns another survey.</div>
        <Badge kind="teaching">C · D · E · repeat</Badge>
        <div className="syringe__meta">Pelvis · blood · brain · back · warmth · trends</div>
        <p className="syringe__remaining" role="status">
          {repeated ? 'Repeat complete · trends + uncertainty handed to definitive control'
            : disabilityExposure ? 'D + E complete · repeat &lt;C&gt;ABCDE now'
              : circulation ? 'Hemorrhage path active · complete D + E'
                : airwayBreathing ? 'Persistent shock · circulation next' : 'A + B pending'}
        </p>
        <div className="syringe__presets">
          <Button className="crisis-drug__action" disabled={!airwayBreathing || circulation}
            aria-disabled={demonstrating} onClick={act ? () => act('record-trauma-circulation-response') : undefined}>Pelvis + blood + TXA + control</Button>
          <Button className="crisis-drug__action" disabled={!circulation || disabilityExposure}
            aria-disabled={demonstrating} onClick={act ? () => act('review-trauma-disability-and-exposure') : undefined}>Review brain + glucose + back + warmth</Button>
          <Button className="crisis-drug__action" disabled={!disabilityExposure || repeated}
            aria-disabled={demonstrating} onClick={act ? () => act('repeat-trauma-primary-survey') : undefined}>Repeat sweep + hand off change</Button>
        </div>
        <p className="field__hint">Use only imaging that directs intervention in persistent instability. A negative FAST would not exclude bleeding; the authored positive statement does not replace definitive control.</p>
      </section>
      </div>
    </div>
  );
}
