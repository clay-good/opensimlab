/**
 * CriticalCareStatusEpilepticusTray, moved out of `ActionCockpit.tsx` unchanged.
 *
 * The cockpit defined this tray inline and rendered it behind a `hasCriticalCareStatusEpilepticusResponse` gate
 * computed from the scenario, so every specialty downloaded it. That gate is now this tray's
 * `supports` predicate in `trays.ts`; the body below is the original.
 */
import type { EquipmentSnapshot } from '@platform/kernel/protocol';
import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import { statusEpilepticusInlinePrompt as criticalCareStatusEpilepticusInlinePrompt } from './tutor/status-epilepticus-guidance';
import { TutorPanel, WatchingNotice } from '@anesthesia/ui/tutor-panel';
import { Badge, Button } from '@platform/ui';

export function CriticalCareStatusEpilepticusTray({ assessment, scenarioVersion, guidance = 'unassisted', demonstrating = false, onAction }: {
  assessment?: NonNullable<EquipmentSnapshot['resuscitation']['criticalCareStatusEpilepticusAssessment']>;
  scenarioVersion: string;
  guidance?: GuidanceLevel;
  demonstrating?: boolean;
  onAction: (action: string) => void;
}) {
  const recognized = assessment?.recognitionAtTick != null;
  const pattern = assessment?.patternAtTick != null;
  const pathway = assessment?.pathwayAtTick != null;
  const causes = assessment?.causesAtTick != null;
  const reassessed = assessment?.reassessmentAtTick != null;
  const prompt = demonstrating ? null
    : criticalCareStatusEpilepticusInlinePrompt(guidance, { scenarioVersion, patient: assessment });
  const act = demonstrating ? undefined : onAction;
  return (
    <div style={{ display: 'grid', gap: 'var(--space-4)' }}>
      <WatchingNotice demonstrating={demonstrating} />
      <TutorPanel prompt={prompt} />
      <div className="tray-grid">
      <section className="syringe" aria-labelledby="critical-care-status-pattern-title">
        <div id="critical-care-status-pattern-title" className="syringe__name">Movement stopped. The seizure did not.</div>
        <Badge kind="teaching">reported benzodiazepine + urgent load · no recovery · EEG seizures persist</Badge>
        <div className="syringe__meta">intubated · MAP 62 · HR 118 · SpO₂ 94% · temperature 38.1°C</div>
        <p className="syringe__remaining" role="status">
          {pattern ? 'Refractory electrographic status · systemic risks stay visible'
            : recognized ? 'Neurocritical pathway active · whole-pattern review due'
              : 'No convulsions is not the same as no seizure.'}
        </p>
        <div className="syringe__presets">
          <Button className="crisis-drug__action" disabled={recognized}
            aria-disabled={demonstrating} onClick={act ? () => act('recognize-refractory-status-epilepticus') : undefined}>Recognize refractory status + activate help</Button>
          <Button className="crisis-drug__action" disabled={!recognized || pattern}
            aria-disabled={demonstrating} onClick={act ? () => act('review-refractory-status-pattern') : undefined}>Review EEG + systemic context</Button>
        </div>
        <p className="field__hint">The EEG report is an authored fact. This surface does not teach acquisition or interpretation.</p>
      </section>
      <section className="syringe" aria-labelledby="critical-care-status-control-title">
        <div id="critical-care-status-control-title" className="syringe__name">Suppress the seizure. Protect the patient.</div>
        <Badge kind="teaching">continuous therapy + EEG · ventilation + perfusion guardrails · cause search</Badge>
        <div className="syringe__meta">no universal agent · no universal EEG depth · no closed cause</div>
        <p className="syringe__remaining" role="status">
          {reassessed ? 'Brief EEG response · durable control still unproven'
            : causes ? 'Suppression + cause pathways active · response review due'
              : pathway ? 'Continuous pathway active · cause review due'
                : 'Refractory therapy + cause pathways pending'}
        </p>
        <div className="syringe__presets">
          <Button className="crisis-drug__action" disabled={!pattern || pathway}
            aria-disabled={demonstrating} onClick={act ? () => act('activate-refractory-status-pathway') : undefined}>Activate continuous therapy + EEG</Button>
          <Button className="crisis-drug__action" disabled={!pathway || causes}
            aria-disabled={demonstrating} onClick={act ? () => act('address-refractory-status-causes') : undefined}>Keep reversible causes active</Button>
          <Button className="crisis-drug__action" disabled={!causes || reassessed}
            aria-disabled={demonstrating} onClick={act ? () => act('reassess-refractory-status-trajectory') : undefined}>Review EEG + organ trajectory</Button>
        </div>
        <p className="field__hint">A seizure-free window is a response signal, not proof of durable control or recovery.</p>
      </section>
      </div>
    </div>
  );
}
