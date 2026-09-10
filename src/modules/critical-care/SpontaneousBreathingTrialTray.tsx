/**
 * SpontaneousBreathingTrialTray, moved out of `ActionCockpit.tsx` unchanged.
 *
 * The cockpit defined this tray inline and rendered it behind a `hasSpontaneousBreathingTrialResponse` gate
 * computed from the scenario, so every specialty downloaded it. That gate is now this tray's
 * `supports` predicate in `trays.ts`; the body below is the original.
 */
import type { EquipmentSnapshot } from '@platform/kernel/protocol';
import { spontaneousBreathingTrialInlinePrompt } from './tutor/spontaneous-breathing-trial-guidance';
import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import { TutorPanel, WatchingNotice } from '@anesthesia/ui/tutor-panel';
import { Badge, Button } from '@platform/ui';

export function SpontaneousBreathingTrialTray({ assessment, scenarioVersion, guidance = 'unassisted', demonstrating = false, onAction }: {
  assessment?: NonNullable<EquipmentSnapshot['resuscitation']['spontaneousBreathingTrialAssessment']>;
  scenarioVersion: string;
  guidance?: GuidanceLevel;
  demonstrating?: boolean;
  onAction: (action: string) => void;
}) {
  const ready = assessment?.readinessAtTick != null;
  const started = assessment?.startedAtTick != null;
  const failed = assessment?.failureAtTick != null;
  const recovered = assessment?.recoveryAtTick != null;
  const planned = assessment?.planAtTick != null;
  const prompt = demonstrating ? null
    : spontaneousBreathingTrialInlinePrompt(guidance, { scenarioVersion, patient: assessment });
  const act = demonstrating ? undefined : onAction;
  return (
    <div style={{ display: 'grid', gap: 'var(--space-4)' }}>
      <WatchingNotice demonstrating={demonstrating} />
      <TutorPanel prompt={prompt} />
      <div className="tray-grid">
      <section className="syringe" aria-labelledby="sbt-earn-title">
        <div id="sbt-earn-title" className="syringe__name">Earn the trial, not a number.</div>
        <Badge kind="teaching">cause · oxygen · circulation · wakefulness · effort</Badge>
        <div className="syringe__meta">FiO₂ 0.35 · PEEP 5 · awake · stable · RSBI not required</div>
        <p className="syringe__remaining" role="status">
          {failed ? 'Convergent intolerance · stop the trial'
            : started ? '30-minute trial active · read the whole patient'
              : ready ? 'Readiness reviewed · standardized trial due' : 'Daily readiness review due'}
        </p>
        <div className="syringe__presets">
          <Button className="crisis-drug__action" disabled={ready}
            aria-disabled={demonstrating} onClick={act ? () => act('review-sbt-readiness') : undefined}>Review readiness without RSBI</Button>
          <Button className="crisis-drug__action" disabled={!ready || started}
            aria-disabled={demonstrating} onClick={act ? () => act('start-bounded-sbt') : undefined}>Start SBT · keep FiO₂ unchanged</Button>
          <Button className="crisis-drug__action" disabled={!started || failed}
            aria-disabled={demonstrating} onClick={act ? () => act('recognize-sbt-failure') : undefined}>Review 30-minute tolerance</Button>
        </div>
        <p className="field__hint">Supported and unsupported SBT methods can be valid. Standardize the local method and watch the patient, not one index.</p>
      </section>
      <section className="syringe" aria-labelledby="sbt-not-yet-title">
        <div id="sbt-not-yet-title" className="syringe__name">A trial can say “not yet.”</div>
        <Badge kind="teaching">stop · restore · recover · learn · retry</Badge>
        <div className="syringe__meta">RR 36 · Vt 220 · SpO₂ 88% · distress · tachycardia</div>
        <p className="syringe__remaining" role="status">
          {planned ? 'Drivers handed off · another standardized assessment planned'
            : recovered ? 'Prior support restored · recovery proved'
              : 'Failure recognition pending'}
        </p>
        <div className="syringe__presets">
          <Button className="crisis-drug__action" disabled={!failed || recovered}
            aria-disabled={demonstrating} onClick={act ? () => act('stop-failed-sbt-and-recover') : undefined}>Stop trial + restore prior support</Button>
          <Button className="crisis-drug__action" disabled={!recovered || planned}
            aria-disabled={demonstrating} onClick={act ? () => act('plan-after-failed-sbt') : undefined}>Review drivers + plan reassessment</Button>
        </div>
        <p className="field__hint">Do not push through failure. Even a future successful SBT still owes you a separate extubation-readiness decision.</p>
      </section>
      </div>
    </div>
  );
}
