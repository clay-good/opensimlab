/**
 * SevereAcidemiaTray, moved out of `ActionCockpit.tsx` unchanged.
 *
 * The cockpit defined this tray inline and rendered it behind a `hasSevereAcidemiaResponse` gate
 * computed from the scenario, so every specialty downloaded it. That gate is now this tray's
 * `supports` predicate in `trays.ts`; the body below is the original.
 */
import type { EquipmentSnapshot } from '@platform/kernel/protocol';
import { severeAcidemiaInlinePrompt } from './tutor/severe-acidemia-guidance';
import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import { TutorPanel, WatchingNotice } from '@anesthesia/ui/tutor-panel';
import { Badge, Button } from '@platform/ui';

export function SevereAcidemiaTray({ assessment, scenarioVersion, guidance = 'unassisted', demonstrating = false, onAction }: {
  assessment?: NonNullable<EquipmentSnapshot['resuscitation']['severeAcidemiaAssessment']>;
  scenarioVersion: string;
  guidance?: GuidanceLevel;
  demonstrating?: boolean;
  onAction: (action: string) => void;
}) {
  const recognized = assessment?.recognitionAtTick != null;
  const analyzed = assessment?.analysisAtTick != null;
  const ventilation = assessment?.ventilationAtTick != null;
  const causePlan = assessment?.causePlanAtTick != null;
  const reassessed = assessment?.reassessmentAtTick != null;
  const prompt = demonstrating ? null
    : severeAcidemiaInlinePrompt(guidance, { scenarioVersion, patient: assessment });
  const act = demonstrating ? undefined : onAction;
  return (
    <div style={{ display: 'grid', gap: 'var(--space-4)' }}>
      <WatchingNotice demonstrating={demonstrating} />
      <TutorPanel prompt={prompt} />
      <div className="tray-grid">
      <section className="syringe" aria-labelledby="severe-acidemia-pattern-title">
        <div id="severe-acidemia-pattern-title" className="syringe__name">Read the system, not pH alone.</div>
        <Badge kind="teaching">pH 7.09 · HCO₃ 14 · PaCO₂ 48 · lactate 8.1</Badge>
        <div className="syringe__meta">expected PaCO₂ ≈29 ±2 · actual 48 = added respiratory burden</div>
        <p className="syringe__remaining" role="status">
          {analyzed ? 'Mixed metabolic + respiratory acidemia recognized'
            : recognized ? 'Experienced team active · mixed-disorder review due'
              : 'Treat pH as a severity signal, not the diagnosis.'}
        </p>
        <div className="syringe__presets">
          <Button className="crisis-drug__action" disabled={recognized}
            aria-disabled={demonstrating} onClick={act ? () => act('recognize-severe-acidemia') : undefined}>Recognize severe mixed acidemia + activate help</Button>
          <Button className="crisis-drug__action" disabled={!recognized || analyzed}
            aria-disabled={demonstrating} onClick={act ? () => act('analyze-severe-acidemia-context') : undefined}>Confirm gas + map the disorder</Button>
        </div>
        <p className="field__hint">Gas, perfusion, potassium, ECG, ventilation, kidney function, and causes travel together.</p>
      </section>
      <section className="syringe" aria-labelledby="severe-acidemia-stabilization-title">
        <div id="severe-acidemia-stabilization-title" className="syringe__name">Buy time. Treat the source.</div>
        <Badge kind="teaching">safe compensation · cause control · no pH-only prescription</Badge>
        <div className="syringe__meta">protect mechanics · restore perfusion · individualize buffer + kidney support</div>
        <p className="syringe__remaining" role="status">
          {reassessed ? 'pH 7.23 · PaCO₂ 32 · lactate 6.9 · cause remains active'
            : causePlan ? 'Ventilation + cause plan active · whole-trajectory review due'
              : ventilation ? 'Compensation protected · cause + support plan due'
                : 'Stabilization plan pending'}
        </p>
        <div className="syringe__presets">
          <Button className="crisis-drug__action" disabled={!analyzed || ventilation}
            aria-disabled={demonstrating} onClick={act ? () => act('protect-severe-acidemia-ventilation') : undefined}>Restore safe ventilatory compensation</Button>
          <Button className="crisis-drug__action" disabled={!ventilation || causePlan}
            aria-disabled={demonstrating} onClick={act ? () => act('activate-severe-acidemia-cause-plan') : undefined}>Activate cause-directed + buffer/KRT planning</Button>
          <Button className="crisis-drug__action" disabled={!causePlan || reassessed}
            aria-disabled={demonstrating} onClick={act ? () => act('reassess-severe-acidemia-trajectory') : undefined}>Review gas + organ trajectory</Button>
        </div>
        <p className="field__hint">A better pH is an immediate process signal, not proof of acid clearance or recovery.</p>
      </section>
      </div>
    </div>
  );
}
