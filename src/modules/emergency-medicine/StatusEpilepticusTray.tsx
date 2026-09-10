import type { EquipmentSnapshot } from '@platform/kernel/protocol';
import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import { TutorPanel, WatchingNotice } from '@anesthesia/ui/tutor-panel';
import { statusEpilepticusInlinePrompt } from '../emergency-medicine/tutor/status-epilepticus-guidance';
import { Badge, Button } from '@platform/ui';

/**
 * The seam hands a tray one `assessment`, and this lesson also reads the visible
 * seizure signal, so its registration selects both and they are unpacked here.
 */
export function StatusEpilepticusTray({ assessment: selected, scenarioVersion, guidance = 'unassisted', demonstrating = false, onAction }: {
  scenarioVersion: string;
  guidance?: GuidanceLevel;
  demonstrating?: boolean;
  assessment?: {
    readonly seizureActivityFraction: number;
    readonly assessment?: NonNullable<EquipmentSnapshot['resuscitation']['statusEpilepticusAssessment']>;
  };
  onAction: (action: string) => void;
}) {
  const seizureActivityFraction = selected?.seizureActivityFraction ?? 0;
  const assessment = selected?.assessment;
  const reviewed = assessment?.reviewedAtTick != null;
  const supported = assessment?.supportedAtTick != null;
  const lorazepam = assessment?.lorazepamAtTick != null;
  const reassessed = assessment?.reassessedAtTick != null;
  const prompt = demonstrating ? null
    : statusEpilepticusInlinePrompt(guidance, { scenarioVersion, patient: assessment });
  const act = demonstrating ? undefined : onAction;
  return (
    <div style={{ display: 'grid', gap: 'var(--space-4)' }}>
      <WatchingNotice demonstrating={demonstrating} />
      <TutorPanel prompt={prompt} />
      <div className="tray-grid">
      <section className="syringe" aria-labelledby="status-epilepticus-recognition-title">
        <div id="status-epilepticus-recognition-title" className="syringe__name">Five minutes changes the name</div>
        <Badge kind="teaching">Generalized convulsive status</Badge>
        <div className="syringe__meta">6:20 elapsed · no recovery · airway + breathing + pulse</div>
        <p className="syringe__remaining" role="status">
          {supported ? 'Stabilized · glucose 118 mg/dL · IV access ready'
            : reviewed ? 'Status recognized · stabilize in parallel'
              : 'Seizure type + time + recovery review pending'}
        </p>
        <div className="syringe__presets">
          <Button className="crisis-drug__action" disabled={reviewed}
            aria-disabled={demonstrating} onClick={act ? () => act('review-convulsive-status') : undefined}>
            Review seizure + clock
          </Button>
          <Button className="crisis-drug__action" disabled={!reviewed || supported}
            aria-disabled={demonstrating} onClick={act ? () => act('record-status-stabilization') : undefined}>
            Stabilize + check glucose
          </Button>
        </div>
        <p className="field__hint">Protect from injury without restraint. Position the airway, prepare suction, titrate oxygen, monitor, obtain access, call for help, and check glucose without delaying first-line treatment.</p>
      </section>
      <section className="syringe" aria-labelledby="status-epilepticus-treatment-title">
        <div id="status-epilepticus-treatment-title" className="syringe__name">Stop it, then prove it stopped</div>
        <div className="syringe__meta">Fixed adult first-line action · lorazepam 4 mg IV</div>
        <p className="syringe__remaining" role="status">
          {reassessed ? 'Convulsions stopped · airway + ventilation reassessed'
            : lorazepam ? 'Lorazepam accepted · reassess next'
              : supported ? 'First-line treatment ready' : 'Stabilization pending'}
        </p>
        <div className="syringe__presets">
          <Button className="crisis-drug__action" disabled={!supported || lorazepam}
            aria-disabled={demonstrating} onClick={act ? () => act('give-lorazepam-4-mg-iv') : undefined}>
            Give lorazepam 4 mg IV
          </Button>
          <Button className="crisis-drug__action" disabled={!lorazepam || reassessed}
            aria-disabled={demonstrating} onClick={act ? () => act('reassess-after-lorazepam') : undefined}>
            Reassess seizure + airway
          </Button>
        </div>
        <p className="field__hint">Visible seizure signal: {seizureActivityFraction > 0 ? 'active' : 'stopped'}. Persistent or recurrent seizure needs prompt second-line therapy. No repeat dose, alternate route, second-line loading, EEG, airway procedure, cause, recurrence, disposition, or outcome is offered.</p>
      </section>
      </div>
    </div>
  );
}
