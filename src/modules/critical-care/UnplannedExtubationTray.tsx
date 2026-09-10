/**
 * UnplannedExtubationTray, moved out of `ActionCockpit.tsx` unchanged.
 *
 * The cockpit defined this tray inline and rendered it behind a `hasUnplannedExtubationResponse` gate
 * computed from the scenario, so every specialty downloaded it. That gate is now this tray's
 * `supports` predicate in `trays.ts`; the body below is the original.
 */
import type { EquipmentSnapshot } from '@platform/kernel/protocol';
import { unplannedExtubationInlinePrompt } from './tutor/unplanned-extubation-guidance';
import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import { TutorPanel, WatchingNotice } from '@anesthesia/ui/tutor-panel';
import { Badge, Button } from '@platform/ui';

export function UnplannedExtubationTray({ assessment, scenarioVersion, guidance = 'unassisted', demonstrating = false, onAction }: {
  assessment?: NonNullable<EquipmentSnapshot['resuscitation']['unplannedExtubationAssessment']>;
  scenarioVersion: string;
  guidance?: GuidanceLevel;
  demonstrating?: boolean;
  onAction: (action: string) => void;
}) {
  const support = assessment?.supportAtTick != null;
  const assessed = assessment?.assessmentAtTick != null;
  const failure = assessment?.failureAtTick != null;
  const planned = assessment?.airwayPlanAtTick != null;
  const reassessed = assessment?.reassessmentAtTick != null;
  const prompt = demonstrating ? null
    : unplannedExtubationInlinePrompt(guidance, { scenarioVersion, patient: assessment });
  const act = demonstrating ? undefined : onAction;
  return (
    <div style={{ display: 'grid', gap: 'var(--space-4)' }}>
      <WatchingNotice demonstrating={demonstrating} />
      <TutorPanel prompt={prompt} />
      <div className="tray-grid">
      <section className="syringe" aria-labelledby="unplanned-read-title">
        <div id="unplanned-read-title" className="syringe__name">The tube is out. Read the patient.</div>
        <Badge kind="teaching">airway · effort · gas · brain · circulation</Badge>
        <div className="syringe__meta">RR 36 · SpO₂ 86% · pH 7.27 · weak cough · drowsy</div>
        <p className="syringe__remaining" role="status">
          {failure ? 'Convergent failure · prompt reintubation due'
            : assessed ? 'Whole-patient panel reviewed · decide from the trajectory'
              : support ? 'Oxygen support active · tolerance check due'
                : 'Announce · oxygenate · call the airway team'}
        </p>
        <div className="syringe__presets">
          <Button className="crisis-drug__action" disabled={support}
            aria-disabled={demonstrating} onClick={act ? () => act('support-unplanned-extubation-and-call-help') : undefined}>Oxygenate + call airway help</Button>
          <Button className="crisis-drug__action" disabled={!support || assessed}
            aria-disabled={demonstrating} onClick={act ? () => act('assess-unplanned-extubation-tolerance') : undefined}>Read the whole-patient panel</Button>
          <Button className="crisis-drug__action" disabled={!assessed || failure}
            aria-disabled={demonstrating} onClick={act ? () => act('classify-unplanned-extubation-failure') : undefined}>Classify this trajectory as failing</Button>
        </div>
        <p className="field__hint">The event alone does not decide. Airway protection, work, oxygenation, ventilation, alertness, and trend do.</p>
      </section>
      <section className="syringe" aria-labelledby="unplanned-act-title">
        <div id="unplanned-act-title" className="syringe__name">Don’t rent time from failure.</div>
        <Badge kind="teaching">preoxygenate · reintubate · prove placement</Badge>
        <div className="syringe__meta">experienced team · hemodynamic prep · backup · no NIV delay</div>
        <p className="syringe__remaining" role="status">
          {reassessed ? 'Airway + patient response checked · prevention handoff recorded'
            : planned ? 'Prompt airway plan recorded · confirmation due'
              : 'Failure classification pending'}
        </p>
        <div className="syringe__presets">
          <Button className="crisis-drug__action" disabled={!failure || planned}
            aria-disabled={demonstrating} onClick={act ? () => act('record-unplanned-extubation-airway-plan') : undefined}>Record prompt reintubation plan</Button>
          <Button className="crisis-drug__action" disabled={!planned || reassessed}
            aria-disabled={demonstrating} onClick={act ? () => act('reassess-unplanned-extubation-response') : undefined}>Prove placement + hand off learning</Button>
        </div>
        <p className="field__hint">Noninvasive support must not delay this failing airway. The controls record intent and reported response, never airway performance.</p>
      </section>
      </div>
    </div>
  );
}
