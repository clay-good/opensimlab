/**
 * AkiFluidOverloadTray, moved out of `ActionCockpit.tsx` unchanged.
 *
 * The cockpit defined this tray inline and rendered it behind a `hasAkiFluidOverloadResponse` gate
 * computed from the scenario, so every specialty downloaded it. That gate is now this tray's
 * `supports` predicate in `trays.ts`; the body below is the original.
 */
import type { EquipmentSnapshot } from '@platform/kernel/protocol';
import { akiFluidOverloadInlinePrompt } from './tutor/aki-fluid-overload-guidance';
import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import { TutorPanel, WatchingNotice } from '@anesthesia/ui/tutor-panel';
import { Badge, Button } from '@platform/ui';

export function AkiFluidOverloadTray({ assessment, scenarioVersion, guidance = 'unassisted', demonstrating = false, onAction }: {
  assessment?: NonNullable<EquipmentSnapshot['resuscitation']['akiFluidOverloadAssessment']>;
  scenarioVersion: string;
  guidance?: GuidanceLevel;
  demonstrating?: boolean;
  onAction: (action: string) => void;
}) {
  const recognized = assessment?.recognitionAtTick != null;
  const context = assessment?.contextAtTick != null;
  const fluidPlan = assessment?.fluidPlanAtTick != null;
  const support = assessment?.supportAtTick != null;
  const reassessed = assessment?.reassessmentAtTick != null;
  const prompt = demonstrating ? null
    : akiFluidOverloadInlinePrompt(guidance, { scenarioVersion, patient: assessment });
  const act = demonstrating ? undefined : onAction;
  return (
    <div style={{ display: 'grid', gap: 'var(--space-4)' }}>
      <WatchingNotice demonstrating={demonstrating} />
      <TutorPanel prompt={prompt} />
      <div className="tray-grid">
      <section className="syringe" aria-labelledby="aki-fluid-burden-title">
        <div id="aki-fluid-burden-title" className="syringe__name">See the burden. Protect the organs.</div>
        <Badge kind="teaching">+8.2 L · +9 kg · urine 0.15 mL/kg/h · pulmonary edema</Badge>
        <div className="syringe__meta">SpO₂ 91% on FiO₂ 0.50 · poor reported diuretic response · intake &gt; output</div>
        <p className="syringe__remaining" role="status">
          {context ? 'Harmful accumulation recognized · demand exceeds capacity'
            : recognized ? 'Kidney + critical-care teams active · whole-context review due'
              : 'Follow the fluid and organ trajectory, not creatinine alone.'}
        </p>
        <div className="syringe__presets">
          <Button className="crisis-drug__action" disabled={recognized}
            aria-disabled={demonstrating} onClick={act ? () => act('recognize-aki-fluid-overload') : undefined}>Recognize harmful fluid burden + activate help</Button>
          <Button className="crisis-drug__action" disabled={!recognized || context}
            aria-disabled={demonstrating} onClick={act ? () => act('review-aki-fluid-overload-context') : undefined}>Review causes + urgent complications</Button>
        </div>
        <p className="field__hint">Urine, balance, weight, lungs, perfusion, electrolytes, acid-base state, and symptoms travel together.</p>
      </section>
      <section className="syringe" aria-labelledby="aki-fluid-support-title">
        <div id="aki-fluid-support-title" className="syringe__name">Match demand to kidney capacity.</div>
        <Badge kind="teaching">life-threatening imbalance = urgent · no creatinine trigger</Badge>
        <div className="syringe__meta">limit accumulation · preserve perfusion · individualize timing + prescription</div>
        <p className="syringe__remaining" role="status">
          {reassessed ? 'Net −1.1 L · SpO₂ 95% · oliguria + recovery remain open'
            : support ? 'Fluid plan + kidney-support pathway active · reassessment due'
              : fluidPlan ? 'Nonessential accumulation limited · support planning due'
                : 'Fluid-demand control pending'}
        </p>
        <div className="syringe__presets">
          <Button className="crisis-drug__action" disabled={!context || fluidPlan}
            aria-disabled={demonstrating} onClick={act ? () => act('limit-fluid-and-review-diuretic-response') : undefined}>Limit fluid + review diuretic response</Button>
          <Button className="crisis-drug__action" disabled={!fluidPlan || support}
            aria-disabled={demonstrating} onClick={act ? () => act('activate-individualized-kidney-support-pathway') : undefined}>Activate individualized kidney-support planning</Button>
          <Button className="crisis-drug__action" disabled={!support || reassessed}
            aria-disabled={demonstrating} onClick={act ? () => act('reassess-aki-fluid-overload-trajectory') : undefined}>Review fluid + organ trajectory</Button>
        </div>
        <p className="field__hint">A better balance is an immediate process signal, not proof of kidney recovery or outcome.</p>
      </section>
      </div>
    </div>
  );
}
