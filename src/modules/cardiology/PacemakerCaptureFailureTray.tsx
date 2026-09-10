/**
 * PacemakerCaptureFailureTray, moved out of `ActionCockpit.tsx` unchanged.
 *
 * The cockpit defined this tray inline and rendered it behind a `hasPacemakerCaptureFailureResponse` gate
 * computed from the scenario, so every specialty downloaded it. That gate is now this tray's
 * `supports` predicate in `trays.ts`; the body below is the original.
 */
import type { EquipmentSnapshot } from '@platform/kernel/protocol';
import { pacemakerCaptureFailureInlinePrompt } from './tutor/pacemaker-capture-failure-guidance';
import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import { TutorPanel, WatchingNotice } from '@anesthesia/ui/tutor-panel';
import { Badge, Button } from '@platform/ui';

export function PacemakerCaptureFailureTray({ assessment, scenarioVersion, guidance = 'unassisted', demonstrating = false, onAction }: {
  assessment?: NonNullable<EquipmentSnapshot['resuscitation']['pacemakerCaptureFailureAssessment']>;
  scenarioVersion: string;
  guidance?: GuidanceLevel;
  demonstrating?: boolean;
  onAction: (action: string) => void;
}) {
  const recognized = assessment?.recognitionAtTick != null;
  const rescue = assessment?.rescueAtTick != null;
  const deviceSystem = assessment?.deviceSystemAtTick != null;
  const causes = assessment?.causesAtTick != null;
  const laterPanel = assessment?.laterPanelAtTick != null;
  const handoff = assessment?.handoffAtTick != null;
  const prompt = demonstrating ? null
    : pacemakerCaptureFailureInlinePrompt(guidance, { scenarioVersion, patient: assessment });
  const act = demonstrating ? undefined : onAction;
  return <div style={{ display: 'grid', gap: 'var(--space-4)' }}>
    <WatchingNotice demonstrating={demonstrating} />
    <TutorPanel prompt={prompt} />
    <div className="tray-grid">
    <section className="syringe" aria-labelledby="pacemaker-capture-failure-pattern-title">
      <div id="pacemaker-capture-failure-pattern-title" className="syringe__name">A spike is not a heartbeat.</div>
      <Badge kind="teaching">electrical noncapture · intrinsic pulse · device dependent</Badge>
      <div className="syringe__meta">artifact → QRS · pulse + perfusion · lead + generator trends</div>
      <p className="syringe__remaining" role="status">{deviceSystem && causes ? 'Device system + contributors reviewed' : deviceSystem ? 'Device trends reviewed · contributor screen remains' : causes ? 'Contributors reviewed · device trends remain' : recognized ? 'Rescue and two review lanes are open' : 'Match pacing artifacts to QRS complexes and pulse'}</p>
      <div className="syringe__presets">
        <Button className="crisis-drug__action" disabled={recognized} aria-disabled={demonstrating} onClick={act ? () => act('reconcile-pacemaker-capture-failure-pulse-and-pattern') : undefined}>Reconcile pulse + capture pattern</Button>
        <Button className="crisis-drug__action" disabled={!recognized || deviceSystem} aria-disabled={demonstrating} onClick={act ? () => act('review-pacemaker-capture-failure-device-system') : undefined}>Review device + lead system</Button>
        <Button className="crisis-drug__action" disabled={!recognized || causes} aria-disabled={demonstrating} onClick={act ? () => act('review-pacemaker-capture-failure-causes') : undefined}>Review reversible causes</Button>
      </div>
      <p className="field__hint">The fixed report includes pacing artifacts not followed by QRS complexes; intrinsic escape and captured complexes still produce a pulse. The live trace does not simulate initial pacemaker noncapture or a learner-performed capture test.</p>
    </section>
    <section className="syringe" aria-labelledby="pacemaker-capture-failure-rescue-title">
      <div id="pacemaker-capture-failure-rescue-title" className="syringe__name">Protect perfusion. Bring a bridge.</div>
      <Badge kind="teaching">symptomatic hypotension · device expertise · backup ready</Badge>
      <div className="syringe__meta">pulse-loss trigger · experienced-team response · durable work open</div>
      <p className="syringe__remaining" role="status">{handoff ? 'Capture interval + unresolved device work handed off' : laterPanel ? 'Experienced-team response reviewed · later handoff due' : rescue && deviceSystem && causes ? 'Rescue + review lanes complete · allow the later panel' : rescue ? 'Rescue active · device and cause review continue' : recognized ? 'Activate pacing-capable rescue now' : 'Reconcile pulse and pattern first'}</p>
      <div className="syringe__presets">
        <Button className="crisis-drug__action" disabled={!recognized || rescue} aria-disabled={demonstrating} onClick={act ? () => act('activate-pacemaker-capture-failure-rescue-pathway') : undefined}>Activate pacing-capable rescue</Button>
        <Button className="crisis-drug__action" disabled={!rescue || !deviceSystem || !causes || laterPanel} aria-disabled={demonstrating} onClick={act ? () => act('review-pacemaker-capture-failure-later-panel') : undefined}>Review later capture panel</Button>
        <Button className="crisis-drug__action" disabled={!laterPanel || handoff} aria-disabled={demonstrating} onClick={act ? () => act('handoff-pacemaker-capture-failure-reassessment') : undefined}>Hand off capture-failure plan</Button>
      </div>
      <p className="field__hint">No magnet, drug, pad placement, rate, output, pulse width, mode, sedation, access, pacing delivery, interrogation, programming, lead procedure, repair, disposition, prognosis, or outcome is selected.</p>
    </section>
    </div>
  </div>;
}
