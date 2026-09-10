/**
 * TranscutaneousPacingCaptureTray, moved out of `ActionCockpit.tsx` unchanged.
 *
 * The cockpit defined this tray inline and rendered it behind a `hasTranscutaneousPacingCaptureResponse` gate
 * computed from the scenario, so every specialty downloaded it. That gate is now this tray's
 * `supports` predicate in `trays.ts`; the body below is the original.
 */
import type { EquipmentSnapshot } from '@platform/kernel/protocol';
import { transcutaneousPacingCaptureInlinePrompt } from './tutor/transcutaneous-pacing-capture-guidance';
import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import { TutorPanel, WatchingNotice } from '@anesthesia/ui/tutor-panel';
import { Badge, Button } from '@platform/ui';

export function TranscutaneousPacingCaptureTray({ assessment, scenarioVersion, guidance = 'unassisted', demonstrating = false, onAction }: {
  assessment?: NonNullable<EquipmentSnapshot['resuscitation']['transcutaneousPacingCaptureAssessment']>;
  scenarioVersion: string;
  guidance?: GuidanceLevel;
  demonstrating?: boolean;
  onAction: (action: string) => void;
}) {
  const recognized = assessment?.recognitionAtTick != null;
  const pulselessResponse = assessment?.pulselessResponseAtTick != null;
  const causesBridge = assessment?.causesBridgeAtTick != null;
  const handoff = assessment?.handoffAtTick != null;
  const prompt = demonstrating ? null
    : transcutaneousPacingCaptureInlinePrompt(guidance, { scenarioVersion, patient: assessment });
  const act = demonstrating ? undefined : onAction;
  return <div style={{ display: 'grid', gap: 'var(--space-4)' }}>
    <WatchingNotice demonstrating={demonstrating} />
    <TutorPanel prompt={prompt} />
    <div className="tray-grid">
    <section className="syringe" aria-labelledby="transcutaneous-pacing-capture-title">
      <div id="transcutaneous-pacing-capture-title" className="syringe__name">A QRS can still have no pulse.</div>
      <Badge kind="teaching">paced electrical capture · no mechanical output · PEA</Badge>
      <div className="syringe__meta">spike → broad QRS + T · flat pressure · nonpulsatile pleth</div>
      <p className="syringe__remaining" role="status">{pulselessResponse ? 'Pulse loss recognized · nonshockable pathway active' : recognized ? 'Electrical capture reconciled · act on pulse loss now' : 'Match each electrical complex to mechanical output'}</p>
      <div className="syringe__presets">
        <Button className="crisis-drug__action" disabled={recognized} aria-disabled={demonstrating} onClick={act ? () => act('reconcile-transcutaneous-pacing-electrical-and-mechanical-capture') : undefined}>Reconcile electrical + mechanical capture</Button>
        <Button className="crisis-drug__action" disabled={!recognized || pulselessResponse} aria-disabled={demonstrating} onClick={act ? () => act('activate-transcutaneous-pacing-pulseless-response') : undefined}>Activate pulseless response</Button>
      </div>
      <p className="field__hint">The fixed report, not a learner examination, confirms every pacing artifact has a broad QRS and T wave while pulse, arterial, pleth, and pressure checks show no circulation. The live trace represents this paced electrical activity with flat mechanical signals.</p>
    </section>
    <section className="syringe" aria-labelledby="transcutaneous-pacing-boundary-title">
      <div id="transcutaneous-pacing-boundary-title" className="syringe__name">Treat the arrest. Keep causes open.</div>
      <Badge kind="teaching">nonshockable pathway · reversible causes · expert bridge</Badge>
      <div className="syringe__meta">no pacing-as-arrest-treatment · ROSC unreported · active ownership</div>
      <p className="syringe__remaining" role="status">{handoff ? 'Active resuscitation + unresolved causes handed off' : causesBridge ? 'Causes + pacing boundary reviewed · allow later handoff' : pulselessResponse ? 'Review causes and the pacing-bridge boundary' : 'Activate the pulseless response first'}</p>
      <div className="syringe__presets">
        <Button className="crisis-drug__action" disabled={!pulselessResponse || causesBridge} aria-disabled={demonstrating} onClick={act ? () => act('review-transcutaneous-pacing-open-causes-and-bridge') : undefined}>Review open causes + bridge</Button>
        <Button className="crisis-drug__action" disabled={!causesBridge || handoff} aria-disabled={demonstrating} onClick={act ? () => act('handoff-transcutaneous-pacing-reassessment') : undefined}>Hand off active resuscitation</Button>
      </div>
      <p className="field__hint">No pulse palpation, ECG interpretation, CPR mechanics, oxygen, airway, drug, shock, pad placement, rate, output, pulse width, pacing delivery, transvenous procedure, ROSC, disposition, prognosis, or outcome is selected.</p>
    </section>
    </div>
  </div>;
}
