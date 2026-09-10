import type { EquipmentSnapshot } from '@platform/kernel/protocol';
import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import { TutorPanel, WatchingNotice } from '@anesthesia/ui/tutor-panel';
import { cardiacTamponadeInlinePrompt } from '../emergency-medicine/tutor/cardiac-tamponade-guidance';
import { Badge, Button } from '@platform/ui';

/**
 * The seam hands a tray one `assessment`, and this lesson also reads the modeled
 * obstructive burden, so its registration selects both and they are unpacked here.
 */
export function CardiacTamponadeTray({ assessment: selected, scenarioVersion, guidance = 'unassisted', demonstrating = false, onAction }: {
  assessment?: {
    readonly fraction: number;
    readonly assessment?: NonNullable<EquipmentSnapshot['resuscitation']['cardiacTamponadeAssessment']>;
  };
  scenarioVersion: string;
  guidance?: GuidanceLevel;
  demonstrating?: boolean;
  onAction: (action: string) => void;
}) {
  const fraction = selected?.fraction ?? 0;
  const assessment = selected?.assessment;
  const reviewed = assessment?.contextReviewedAtTick != null;
  const pocus = assessment?.pocusReviewedAtTick != null;
  const control = assessment?.definitiveControlAtTick != null;
  const reassessed = assessment?.reassessedAtTick != null;
  const prompt = demonstrating ? null
    : cardiacTamponadeInlinePrompt(guidance, { scenarioVersion, patient: assessment });
  const act = demonstrating ? undefined : onAction;
  return (
    <div style={{ display: 'grid', gap: 'var(--space-4)' }}>
      <WatchingNotice demonstrating={demonstrating} />
      <TutorPanel prompt={prompt} />
      <div className="tray-grid">
      <section className="syringe" aria-labelledby="tamponade-recognition-title">
        <div id="tamponade-recognition-title" className="syringe__name">Recognize obstructed filling</div>
        <Badge kind="teaching">Fixed trauma vignette</Badge>
        <div className="syringe__meta">Mechanism · perfusion · bilateral breathing · POCUS</div>
        <p className="syringe__remaining" role="status">
          {pocus ? 'Fixed pericardial finding reviewed'
            : reviewed ? 'Whole-patient pattern reviewed · focused finding next'
              : `Modeled obstructive burden ${(fraction * 100).toFixed(0)}%`}
        </p>
        <div className="syringe__presets">
          <Button className="crisis-drug__action" disabled={reviewed}
            aria-disabled={demonstrating} onClick={act ? () => act('review-context-and-perfusion') : undefined}>
            Review context + perfusion
          </Button>
          <Button className="crisis-drug__action" disabled={!reviewed || pocus}
            aria-disabled={demonstrating} onClick={act ? () => act('review-fixed-pocus') : undefined}>
            Review fixed POCUS finding
          </Button>
        </div>
        <p className="field__hint">The interface reveals authored findings. It does not acquire images, teach views, or establish diagnostic competence.</p>
      </section>
      <section className="syringe" aria-labelledby="tamponade-control-title">
        <div id="tamponade-control-title" className="syringe__name">Escalate definitive control</div>
        <div className="syringe__meta">Immediate team transfer · intent only · reassess</div>
        <p className="syringe__remaining" role="status">
          {reassessed ? 'Unresolved perfusion reassessed · definitive care remains urgent'
            : control ? 'Control team mobilized · physiology remains active'
              : 'Obstructive shock continues'}
        </p>
        <div className="syringe__presets">
          <Button className="crisis-drug__action" disabled={!pocus || control}
            aria-disabled={demonstrating} onClick={act ? () => act('record-definitive-control-intent') : undefined}>
            Record immediate definitive-control intent
          </Button>
          <Button className="crisis-drug__action" disabled={!control || reassessed}
            aria-disabled={demonstrating} onClick={act ? () => act('reassess-perfusion') : undefined}>
            Reassess unresolved perfusion
          </Button>
        </div>
        <p className="field__hint">The click mobilizes care; it does not relieve tamponade. No pericardiocentesis or thoracotomy technique, equipment, transport, technical success, complication, or outcome is offered.</p>
      </section>
      </div>
    </div>
  );
}
