import type { EquipmentSnapshot } from '@platform/kernel/protocol';
import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import { TutorPanel, WatchingNotice } from '@anesthesia/ui/tutor-panel';
import { undifferentiatedShockInlinePrompt } from '../emergency-medicine/tutor/undifferentiated-shock-guidance';
import { Badge, Button } from '@platform/ui';

export function UndifferentiatedShockTray({ assessment, scenarioVersion, guidance = 'unassisted', demonstrating = false, onAction }: {
  assessment?: NonNullable<EquipmentSnapshot['resuscitation']['undifferentiatedShockAssessment']>;
  scenarioVersion: string;
  guidance?: GuidanceLevel;
  demonstrating?: boolean;
  onAction: (action: string) => void;
}) {
  const perfusion = assessment?.perfusionReviewedAtTick != null;
  const lactate = assessment?.lactateReviewedAtTick != null;
  const echo = assessment?.focusedEchoReviewedAtTick != null;
  const plr = assessment?.passiveLegRaiseAtTick != null;
  const fluid = assessment?.fluidChallengeAtTick != null;
  const reassessed = assessment?.perfusionReassessedAtTick != null;
  const escalated = assessment?.escalationAtTick != null;
  const prompt = demonstrating ? null : undifferentiatedShockInlinePrompt(guidance, { scenarioVersion, patient: assessment });
  const act = demonstrating ? undefined : onAction;
  return (
    <div style={{ display: 'grid', gap: 'var(--space-4)' }}>
      <TutorPanel prompt={prompt} />
      <WatchingNotice demonstrating={demonstrating} />
      <div className="tray-grid">
      <section className="syringe" aria-labelledby="shock-evidence-title">
        <div id="shock-evidence-title" className="syringe__name">Build the perfusion picture</div>
        <Badge kind="teaching">Fixed ED vignette</Badge>
        <div className="syringe__meta">Skin · brain · kidney · lactate · heart</div>
        <p className="syringe__remaining" role="status">
          {echo ? 'Whole-patient evidence + focused cardiac phenotype reviewed'
            : perfusion && lactate ? 'Perfusion and lactate reviewed · cardiac phenotype pending'
              : 'Serial tissue-perfusion evidence pending'}
        </p>
        <div className="syringe__presets">
          <Button className="crisis-drug__action" aria-disabled={demonstrating} disabled={perfusion}
            onClick={act ? () => act('review-perfusion') : undefined}>Review tissue perfusion</Button>
          <Button className="crisis-drug__action" aria-disabled={demonstrating} disabled={lactate}
            onClick={act ? () => act('review-lactate') : undefined}>Review fixed lactate</Button>
          <Button className="crisis-drug__action" aria-disabled={demonstrating} disabled={!perfusion || !lactate || echo}
            onClick={act ? () => act('review-focused-echo') : undefined}>Review focused cardiac findings</Button>
        </div>
        <p className="field__hint">These are authored findings. The screen does not perform an examination, acquire ultrasound, draw blood, or diagnose the shock cause.</p>
      </section>
      <section className="syringe" aria-labelledby="shock-response-title">
        <div id="shock-response-title" className="syringe__name">Test, act, reassess</div>
        <div className="syringe__meta">Dynamic response · 500 mL · same markers</div>
        <p className="syringe__remaining" role="status">
          {escalated ? 'Serial reassessment complete · ongoing shock escalated'
            : reassessed ? 'Perfusion reassessed · escalation pending'
              : fluid ? 'Bounded challenge delivered · reassessment pending'
                : plr ? 'Positive authored dynamic response reviewed'
                  : 'Dynamic fluid-responsiveness evidence pending'}
        </p>
        <div className="syringe__presets">
          <Button className="crisis-drug__action" aria-disabled={demonstrating} disabled={!echo || plr}
            onClick={act ? () => act('perform-passive-leg-raise') : undefined}>Review passive-leg-raise response</Button>
          <Button className="crisis-drug__action" aria-disabled={demonstrating} disabled={!plr || fluid}
            onClick={act ? () => act('give-targeted-fluid-challenge') : undefined}>Give bounded 500 mL challenge</Button>
          <Button className="crisis-drug__action" aria-disabled={demonstrating} disabled={!fluid || reassessed}
            onClick={act ? () => act('reassess-perfusion') : undefined}>Reassess tissue perfusion</Button>
          <Button className="crisis-drug__action" aria-disabled={demonstrating} disabled={!reassessed || escalated}
            onClick={act ? () => act('escalate-after-reassessment') : undefined}>Escalate ongoing shock workup</Button>
        </div>
        <p className="field__hint">No liberal repeat-fluid shortcut is offered. Etiologic treatment, vasopressors, procedures, and disposition remain outside this first slice.</p>
      </section>
      </div>
    </div>
  );
}
