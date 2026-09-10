/**
 * PostArrestTemperatureTray, moved out of `ActionCockpit.tsx` unchanged.
 *
 * The cockpit defined this tray inline and rendered it behind a `hasPostArrestTemperatureResponse` gate
 * computed from the scenario, so every specialty downloaded it. That gate is now this tray's
 * `supports` predicate in `trays.ts`; the body below is the original.
 */
import type { EquipmentSnapshot } from '@platform/kernel/protocol';
import { targetedTemperatureManagementInlinePrompt } from './tutor/targeted-temperature-management-guidance';
import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import { TutorPanel, WatchingNotice } from '@anesthesia/ui/tutor-panel';
import { Badge, Button } from '@platform/ui';

export function PostArrestTemperatureTray({ assessment, scenarioVersion, guidance = 'unassisted', demonstrating = false, onAction }: {
  assessment?: NonNullable<EquipmentSnapshot['resuscitation']['postArrestTemperatureAssessment']>;
  scenarioVersion: string;
  guidance?: GuidanceLevel;
  demonstrating?: boolean;
  onAction: (action: string) => void;
}) {
  const recognized = assessment?.recognitionAtTick != null;
  const context = assessment?.contextAtTick != null;
  const protocol = assessment?.protocolAtTick != null;
  const guardrails = assessment?.guardrailsAtTick != null;
  const reassessed = assessment?.reassessmentAtTick != null;
  const prompt = demonstrating ? null
    : targetedTemperatureManagementInlinePrompt(guidance, { scenarioVersion, patient: assessment });
  const act = demonstrating ? undefined : onAction;
  return (
    <div style={{ display: 'grid', gap: 'var(--space-4)' }}>
      <WatchingNotice demonstrating={demonstrating} />
      <TutorPanel prompt={prompt} />
      <div className="tray-grid">
      <section className="syringe" aria-labelledby="post-arrest-temperature-context-title">
        <div id="post-arrest-temperature-context-title" className="syringe__name">Control temperature. No early prognosis.</div>
        <Badge kind="teaching">32 min after ROSC · no command following · temperature 38.3°C and rising</Badge>
        <div className="syringe__meta">MAP 68 · SpO₂ 96% · EtCO₂ 36 · no current seizure · cause work open</div>
        <p className="syringe__remaining" role="status">
          {context ? 'Temperature control indicated · prognosis remains open'
            : recognized ? 'Post-arrest team active · whole-context review due'
              : 'Fever is a treatment signal, not a prognostic shortcut.'}
        </p>
        <div className="syringe__presets">
          <Button className="crisis-drug__action" disabled={recognized}
            aria-disabled={demonstrating} onClick={act ? () => act('recognize-post-arrest-temperature-control') : undefined}>Recognize indication + activate help</Button>
          <Button className="crisis-drug__action" disabled={!recognized || context}
            aria-disabled={demonstrating} onClick={act ? () => act('review-post-arrest-temperature-context') : undefined}>Review brain + systemic context</Button>
        </div>
        <p className="field__hint">Absent command following opens a temperature-control pathway. It does not settle neurologic prognosis.</p>
      </section>
      <section className="syringe" aria-labelledby="post-arrest-temperature-protocol-title">
        <div id="post-arrest-temperature-protocol-title" className="syringe__name">Choose a range. Protect the patient.</div>
        <Badge kind="teaching">32–37.5°C · at least 36 h · avoid fever · controlled rewarming</Badge>
        <div className="syringe__meta">no universal best target · no rapid cold-fluid loading · rewarm ≤0.5°C/h</div>
        <p className="syringe__remaining" role="status">
          {reassessed ? 'Temperature in range · brain + organ trajectories remain open'
            : guardrails ? 'Protocol + guardrails active · response review due'
              : protocol ? 'Temperature protocol active · guardrails due'
                : 'Protocolized control pending'}
        </p>
        <div className="syringe__presets">
          <Button className="crisis-drug__action" disabled={!context || protocol}
            aria-disabled={demonstrating} onClick={act ? () => act('activate-post-arrest-temperature-protocol') : undefined}>Activate individualized temperature protocol</Button>
          <Button className="crisis-drug__action" disabled={!protocol || guardrails}
            aria-disabled={demonstrating} onClick={act ? () => act('record-temperature-control-guardrails') : undefined}>Record cooling + rewarming guardrails</Button>
          <Button className="crisis-drug__action" disabled={!guardrails || reassessed}
            aria-disabled={demonstrating} onClick={act ? () => act('reassess-post-arrest-temperature-trajectory') : undefined}>Review temperature + organ trajectory</Button>
        </div>
        <p className="field__hint">Reaching the range is an immediate process signal, not proof of neurologic recovery or benefit.</p>
      </section>
      </div>
    </div>
  );
}
