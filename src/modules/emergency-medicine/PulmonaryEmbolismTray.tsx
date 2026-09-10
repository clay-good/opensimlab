/**
 * PulmonaryEmbolismTray, moved out of `ActionCockpit.tsx` unchanged.
 *
 * The cockpit defined this tray inline and rendered it behind a `hasPulmonaryEmbolismResponse` gate
 * computed from the scenario, so every specialty downloaded it. That gate is now this tray's
 * `supports` predicate in `trays.ts`; the body below is the original.
 */
import type { EquipmentSnapshot } from '@platform/kernel/protocol';
import { pulmonaryEmbolismInlinePrompt } from './tutor/pulmonary-embolism-deterioration-guidance';
import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import { TutorPanel, WatchingNotice } from '@anesthesia/ui/tutor-panel';
import { Badge, Button } from '@platform/ui';

export function PulmonaryEmbolismTray({ assessment, scenarioVersion, guidance = 'unassisted', demonstrating = false, onAction }: {
  assessment?: NonNullable<EquipmentSnapshot['resuscitation']['pulmonaryEmbolismAssessment']>;
  scenarioVersion: string;
  guidance?: GuidanceLevel;
  demonstrating?: boolean;
  onAction: (action: string) => void;
}) {
  const reviewed = assessment?.severityReviewedAtTick != null;
  const oxygen = assessment?.oxygenAtTick != null;
  const anticoagulated = assessment?.anticoagulationAtTick != null;
  const deteriorated = assessment?.deteriorationAtTick != null;
  const escalated = assessment?.escalationAtTick != null;
  const prompt = demonstrating ? null
    : pulmonaryEmbolismInlinePrompt(guidance, { scenarioVersion, patient: assessment });
  const act = demonstrating ? undefined : onAction;
  return (
    <div style={{ display: 'grid', gap: 'var(--space-4)' }}>
      <WatchingNotice demonstrating={demonstrating} />
      <TutorPanel prompt={prompt} />
      <div className="tray-grid">
      <section className="syringe" aria-labelledby="pe-severity-title">
        <div id="pe-severity-title" className="syringe__name">Read the right ventricle, lungs, and circulation together</div>
        <Badge kind="teaching">Fixed confirmed PE</Badge>
        <div className="syringe__meta">CTPA · RV · biomarkers · RR · SpO₂ · perfusion</div>
        <p className="syringe__remaining" role="status">
          {deteriorated ? 'Deterioration recognized · Category E1'
            : reviewed ? 'Initial Category C3R pattern reviewed' : 'Serial severity review pending'}
        </p>
        <div className="syringe__presets">
          <Button className="crisis-drug__action" disabled={reviewed}
            aria-disabled={demonstrating} onClick={act ? () => act('review-confirmed-pe-severity') : undefined}>
            Review confirmed PE + severity
          </Button>
          <Button className="crisis-drug__action" disabled={!reviewed || oxygen}
            aria-disabled={demonstrating} onClick={act ? () => act('record-titrated-oxygen') : undefined}>
            Record titrated oxygen intent
          </Button>
          <Button className="crisis-drug__action" disabled={!reviewed || anticoagulated}
            aria-disabled={demonstrating} onClick={act ? () => act('record-therapeutic-anticoagulation-intent') : undefined}>
            Record therapeutic anticoagulation intent
          </Button>
        </div>
        <p className="field__hint">Imaging, echocardiography, biomarkers, and category are authored. No live diagnostic or risk calculator is implied.</p>
      </section>
      <section className="syringe" aria-labelledby="pe-deterioration-title">
        <div id="pe-deterioration-title" className="syringe__name">Catch the turn, then bring the whole team</div>
        <div className="syringe__meta">Serial BP · perfusion · PERT · reperfusion strategy</div>
        <p className="syringe__remaining" role="status">
          {escalated ? 'PERT + urgent reperfusion intent recorded'
            : deteriorated ? 'Persistent hypotension + shock · escalate now'
              : oxygen && anticoagulated ? 'Initial response recorded · reassess now'
                : 'Initial response pending'}
        </p>
        <div className="syringe__presets">
          <Button className="crisis-drug__action"
            disabled={!oxygen || !anticoagulated || deteriorated}
            aria-disabled={demonstrating} onClick={act ? () => act('reassess-for-deterioration') : undefined}>
            Reassess pressure + perfusion
          </Button>
          <Button className="crisis-drug__action" disabled={!deteriorated || escalated}
            aria-disabled={demonstrating} onClick={act ? () => act('activate-pert-and-record-reperfusion-intent') : undefined}>
            Activate PERT + reperfusion intent
          </Button>
        </div>
        <p className="field__hint">No anticoagulant or reperfusion dose, contraindication decision, airway technique, procedure selection, transfer, disposition, or outcome is offered.</p>
      </section>
      </div>
    </div>
  );
}
