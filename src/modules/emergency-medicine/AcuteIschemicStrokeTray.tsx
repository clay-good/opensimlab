/**
 * AcuteIschemicStrokeTray, moved out of `ActionCockpit.tsx` unchanged.
 *
 * The cockpit defined this tray inline and rendered it behind a `hasAcuteIschemicStrokeResponse` gate
 * computed from the scenario, so every specialty downloaded it. That gate is now this tray's
 * `supports` predicate in `trays.ts`; the body below is the original.
 */
import type { EquipmentSnapshot } from '@platform/kernel/protocol';
import { acuteIschemicStrokeInlinePrompt } from './tutor/acute-ischemic-stroke-guidance';
import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import { TutorPanel, WatchingNotice } from '@anesthesia/ui/tutor-panel';
import { Badge, Button } from '@platform/ui';

export function AcuteIschemicStrokeTray({ assessment, scenarioVersion, guidance = 'unassisted', demonstrating = false, onAction }: {
  assessment?: NonNullable<EquipmentSnapshot['resuscitation']['acuteIschemicStrokeAssessment']>;
  scenarioVersion: string;
  guidance?: GuidanceLevel;
  demonstrating?: boolean;
  onAction: (action: string) => void;
}) {
  const reviewed = assessment?.presentationReviewedAtTick != null;
  const activated = assessment?.systemActivatedAtTick != null;
  const imaging = assessment?.imagingReviewedAtTick != null;
  const tenecteplase = assessment?.tenecteplaseAtTick != null;
  const thrombectomy = assessment?.thrombectomyActivatedAtTick != null;
  const reassessed = assessment?.reassessedAtTick != null;
  const prompt = demonstrating ? null
    : acuteIschemicStrokeInlinePrompt(guidance, { scenarioVersion, patient: assessment });
  const act = demonstrating ? undefined : onAction;
  return (
    <div style={{ display: 'grid', gap: 'var(--space-4)' }}>
      <WatchingNotice demonstrating={demonstrating} />
      <TutorPanel prompt={prompt} />
      <div className="tray-grid">
      <section className="syringe" aria-labelledby="acute-stroke-recognition-title">
        <div id="acute-stroke-recognition-title" className="syringe__name">Time is tissue. Facts before treatment.</div>
        <Badge kind="teaching">Disabling deficit · 70-minute clock</Badge>
        <div className="syringe__meta">Aphasia + right weakness · glucose 112 · BP 168/94</div>
        <p className="syringe__remaining" role="status">
          {imaging ? 'No hemorrhage · left M1 occlusion · authored eligible'
            : activated ? 'Stroke system active · CT + CTA ready'
              : reviewed ? 'Acute disabling stroke recognized · activate now'
                : 'Last-known-well + deficit + glucose review pending'}
        </p>
        <div className="syringe__presets">
          <Button className="crisis-drug__action" disabled={reviewed}
            aria-disabled={demonstrating} onClick={act ? () => act('review-stroke-presentation') : undefined}>Review deficit + clock</Button>
          <Button className="crisis-drug__action" disabled={!reviewed || activated}
            aria-disabled={demonstrating} onClick={act ? () => act('activate-stroke-system') : undefined}>Activate stroke system</Button>
          <Button className="crisis-drug__action" disabled={!activated || imaging}
            aria-disabled={demonstrating} onClick={act ? () => act('review-stroke-imaging-and-eligibility') : undefined}>Review CT + CTA + eligibility</Button>
        </div>
        <p className="field__hint">The findings are authored. This screen does not examine the patient, calculate a stroke score, interpret imaging, or adjudicate a real contraindication.</p>
      </section>
      <section className="syringe" aria-labelledby="acute-stroke-reperfusion-title">
        <div id="acute-stroke-reperfusion-title" className="syringe__name">Two reperfusion tracks. One clock.</div>
        <div className="syringe__meta">80 kg · tenecteplase 0.25 mg/kg · left M1 LVO</div>
        <p className="syringe__remaining" role="status">
          {reassessed ? 'Surveillance + clock-explicit handoff recorded'
            : thrombectomy ? 'Thrombolysis intent + thrombectomy transfer active'
              : tenecteplase ? '20 mg intent recorded · do not wait for response'
                : imaging ? 'Both reperfusion tracks ready' : 'Eligibility review pending'}
        </p>
        <div className="syringe__presets">
          <Button className="crisis-drug__action" disabled={!imaging || tenecteplase}
            aria-disabled={demonstrating} onClick={act ? () => act('record-tenecteplase-20-mg-intent') : undefined}>Record tenecteplase 20 mg IV intent</Button>
          <Button className="crisis-drug__action" disabled={!tenecteplase || thrombectomy}
            aria-disabled={demonstrating} onClick={act ? () => act('activate-thrombectomy-transfer') : undefined}>Activate thrombectomy transfer</Button>
          <Button className="crisis-drug__action" disabled={!thrombectomy || reassessed}
            aria-disabled={demonstrating} onClick={act ? () => act('reassess-and-handoff-stroke') : undefined}>Reassess + hand off with clocks</Button>
        </div>
        <p className="field__hint">No drug delivery, neurologic improvement, thrombectomy, reperfusion, complication, disposition, or outcome is simulated.</p>
      </section>
      </div>
    </div>
  );
}
