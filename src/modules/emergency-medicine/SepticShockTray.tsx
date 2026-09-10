import type { EquipmentSnapshot } from '@platform/kernel/protocol';
import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import { TutorPanel, WatchingNotice } from '@anesthesia/ui/tutor-panel';
import { septicShockInlinePrompt } from '../emergency-medicine/tutor/septic-shock-guidance';
import { Badge, Button } from '@platform/ui';

export function SepticShockTray({ assessment, scenarioVersion, guidance = 'unassisted', demonstrating = false, onAction }: {
  scenarioVersion: string;
  guidance?: GuidanceLevel;
  demonstrating?: boolean;
  assessment?: NonNullable<EquipmentSnapshot['resuscitation']['septicShockAssessment']>;
  onAction: (action: string) => void;
}) {
  const recognized = assessment?.infectionAndOrganDysfunctionReviewedAtTick != null;
  const diagnostics = assessment?.culturesAndLactateAtTick != null;
  const antimicrobials = assessment?.antimicrobialIntentAtTick != null;
  const fluid = assessment?.initialCrystalloidAtTick != null;
  const reassessed = assessment?.postFluidReassessmentAtTick != null;
  const norepinephrine = assessment?.norepinephrineIntentAtTick != null;
  const escalated = assessment?.sourceControlEscalationAtTick != null;
  const prompt = demonstrating ? null
    : septicShockInlinePrompt(guidance, { scenarioVersion, patient: assessment });
  const act = demonstrating ? undefined : onAction;
  return (
    <div style={{ display: 'grid', gap: 'var(--space-4)' }}>
      <WatchingNotice demonstrating={demonstrating} />
      <TutorPanel prompt={prompt} />
      <div className="tray-grid">
      <section className="syringe" aria-labelledby="sepsis-recognition-title">
        <div id="sepsis-recognition-title" className="syringe__name">Recognize and treat infection</div>
        <Badge kind="teaching">Fixed ED vignette</Badge>
        <div className="syringe__meta">Source clues · organ dysfunction · cultures · lactate</div>
        <p className="syringe__remaining" role="status">
          {antimicrobials ? 'Immediate empiric antimicrobial intent recorded'
            : diagnostics ? 'Diagnostics recorded · do not wait for results'
              : recognized ? 'Probable infection + organ dysfunction recognized'
                : 'Parallel recognition and treatment pending'}
        </p>
        <div className="syringe__presets">
          <Button className="crisis-drug__action" disabled={recognized}
            aria-disabled={demonstrating} onClick={act ? () => act('review-infection-and-organ-dysfunction') : undefined}>
            Review infection + organ dysfunction
          </Button>
          <Button className="crisis-drug__action" disabled={!recognized || diagnostics}
            aria-disabled={demonstrating} onClick={act ? () => act('obtain-cultures-and-lactate') : undefined}>
            Record cultures + lactate
          </Button>
          <Button className="crisis-drug__action" disabled={!diagnostics || antimicrobials}
            aria-disabled={demonstrating} onClick={act ? () => act('record-immediate-antimicrobial-intent') : undefined}>
            Record immediate antimicrobial intent
          </Button>
        </div>
        <p className="field__hint">These controls record authored intent. They do not collect a specimen, select a drug, or simulate antimicrobial delivery.</p>
      </section>
      <section className="syringe" aria-labelledby="sepsis-resuscitation-title">
        <div id="sepsis-resuscitation-title" className="syringe__name">Resuscitate, reassess, escalate</div>
        <div className="syringe__meta">30 mL/kg · persistent shock · MAP 65 · source control</div>
        <p className="syringe__remaining" role="status">
          {escalated && norepinephrine ? 'Initial sequence closed · parallel support escalated'
            : escalated ? 'Source-control escalation active · support shock in parallel'
            : norepinephrine ? 'First-line vasopressor intent recorded'
              : reassessed ? 'Persistent shock recognized after initial fluid'
                : fluid ? 'Initial crystalloid course started · reassess next'
                  : 'Initial hemodynamic response pending'}
        </p>
        <div className="syringe__presets">
          <Button className="crisis-drug__action" disabled={!recognized || fluid}
            aria-disabled={demonstrating} onClick={act ? () => act('begin-initial-crystalloid') : undefined}>
            Begin fixed 2,100 mL crystalloid course
          </Button>
          <Button className="crisis-drug__action" disabled={!fluid || reassessed}
            aria-disabled={demonstrating} onClick={act ? () => act('reassess-after-initial-fluid') : undefined}>
            Reassess after initial fluid
          </Button>
          <Button className="crisis-drug__action" disabled={!reassessed || norepinephrine}
            aria-disabled={demonstrating} onClick={act ? () => act('start-norepinephrine-intent') : undefined}>
            Record norepinephrine intent · MAP 65
          </Button>
          <Button className="crisis-drug__action" disabled={!recognized || escalated}
            aria-disabled={demonstrating} onClick={act ? () => act('escalate-source-control') : undefined}>
            Escalate source control + critical care
          </Button>
        </div>
        <p className="field__hint">No antimicrobial choice, vasopressor dose, procedure, liberal repeat-fluid shortcut, or outcome is offered.</p>
      </section>
      </div>
    </div>
  );
}
