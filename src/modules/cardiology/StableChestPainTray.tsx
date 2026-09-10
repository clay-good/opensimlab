/**
 * StableChestPainTray, moved out of `ActionCockpit.tsx` unchanged.
 *
 * The cockpit defined this tray inline and rendered it behind a `hasStableChestPainResponse` gate
 * computed from the scenario, so every specialty downloaded it. That gate is now this tray's
 * `supports` predicate in `trays.ts`; the body below is the original.
 */
import type { EquipmentSnapshot } from '@platform/kernel/protocol';
import { stableChestPainInlinePrompt } from './tutor/stable-chest-pain-guidance';
import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import { TutorPanel, WatchingNotice } from '@anesthesia/ui/tutor-panel';
import { Badge, Button } from '@platform/ui';

export function StableChestPainTray({ assessment, scenarioVersion, guidance = 'unassisted', demonstrating = false, onAction }: {
  assessment?: NonNullable<EquipmentSnapshot['resuscitation']['stableChestPainAssessment']>;
  scenarioVersion: string;
  guidance?: GuidanceLevel;
  demonstrating?: boolean;
  onAction: (action: string) => void;
}) {
  const stable = assessment?.stabilityAtTick != null;
  const pattern = assessment?.patternAtTick != null;
  const likelihood = assessment?.likelihoodAtTick != null;
  const testing = assessment?.testingAtTick != null;
  const safetyNet = assessment?.safetyNetAtTick != null;
  const prompt = demonstrating ? null
    : stableChestPainInlinePrompt(guidance, { scenarioVersion, patient: assessment });
  const act = demonstrating ? undefined : onAction;
  return (
    <div style={{ display: 'grid', gap: 'var(--space-4)' }}>
    <WatchingNotice demonstrating={demonstrating} />
    <TutorPanel prompt={prompt} />
    <div className="tray-grid">
      <section className="syringe" aria-labelledby="stable-chest-pattern-title">
        <div id="stable-chest-pattern-title" className="syringe__name">Stable is a trajectory, not a synonym for safe.</div>
        <Badge kind="teaching">time · trigger · relief · change · function · red flags</Badge>
        <div className="syringe__meta">3 months · exertional · 6 min · resolves with rest · no recent change</div>
        <p className="syringe__remaining" role="status">
          {pattern ? 'Complete symptom + functional pattern recorded · cause open'
            : stable ? 'Stable trajectory verified · characterize without “atypical”'
              : 'No current symptom · acute-change screen still comes first'}
        </p>
        <div className="syringe__presets">
          <Button className="crisis-drug__action" disabled={stable}
            aria-disabled={demonstrating} onClick={act ? () => act('verify-stable-chest-pain-trajectory') : undefined}>Verify stable vs acute change</Button>
          <Button className="crisis-drug__action" disabled={!stable || pattern}
            aria-disabled={demonstrating} onClick={act ? () => act('characterize-stable-chest-pain-pattern') : undefined}>Characterize symptom + function</Button>
          <Button className="crisis-drug__action" disabled={!pattern || likelihood}
            aria-disabled={demonstrating} onClick={act ? () => act('estimate-stable-chest-pain-clinical-likelihood') : undefined}>Review clinical likelihood</Button>
        </div>
        <p className="field__hint">A calm visit can still need an acute-change safety net. The symptom pattern informs likelihood; it does not announce coronary disease.</p>
      </section>
      <section className="syringe" aria-labelledby="stable-chest-test-title">
        <div id="stable-chest-test-title" className="syringe__name">Estimate before you investigate.</div>
        <Badge kind="teaching">likelihood · patient · ECG · preference · local quality</Badge>
        <div className="syringe__meta">Test only when the answer can change care.</div>
        <p className="syringe__remaining" role="status">
          {safetyNet ? 'Shared pathway + follow-up + acute-change triggers recorded'
            : testing ? 'Patient-specific noninvasive pathway recorded · safety net due'
              : likelihood ? 'Not very low · choose with the patient + local pathway'
                : 'Likelihood review pending · no universal test shortcut'}
        </p>
        <div className="syringe__presets">
          <Button className="crisis-drug__action" disabled={!likelihood || testing}
            aria-disabled={demonstrating} onClick={act ? () => act('record-stable-chest-pain-testing-intent') : undefined}>Share a patient-specific test pathway</Button>
          <Button className="crisis-drug__action" disabled={!testing || safetyNet}
            aria-disabled={demonstrating} onClick={act ? () => act('safety-net-stable-chest-pain-follow-up') : undefined}>Record follow-up + acute-change safety net</Button>
        </div>
        <p className="field__hint">No exact score or universal modality is supplied. These controls acquire no ECG, order no test, diagnose nothing, and prescribe nothing.</p>
      </section>
    </div>
    </div>
  );
}
