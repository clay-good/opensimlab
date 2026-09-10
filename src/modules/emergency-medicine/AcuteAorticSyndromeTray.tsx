/**
 * AcuteAorticSyndromeTray, moved out of `ActionCockpit.tsx` unchanged.
 *
 * The cockpit defined this tray inline and rendered it behind a `hasAcuteAorticSyndromeResponse` gate
 * computed from the scenario, so every specialty downloaded it. That gate is now this tray's
 * `supports` predicate in `trays.ts`; the body below is the original.
 */
import type { EquipmentSnapshot } from '@platform/kernel/protocol';
import { acuteAorticSyndromeInlinePrompt } from './tutor/acute-aortic-syndrome-guidance';
import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import { TutorPanel, WatchingNotice } from '@anesthesia/ui/tutor-panel';
import { Badge, Button } from '@platform/ui';

export function AcuteAorticSyndromeTray({ assessment, scenarioVersion, guidance = 'unassisted', demonstrating = false, onAction }: {
  assessment?: NonNullable<EquipmentSnapshot['resuscitation']['acuteAorticSyndromeAssessment']>;
  scenarioVersion: string;
  guidance?: GuidanceLevel;
  demonstrating?: boolean;
  onAction: (action: string) => void;
}) {
  const initial = assessment?.initialReviewedAtTick != null;
  const evolution = assessment?.evolutionReviewedAtTick != null;
  const escalated = assessment?.escalatedAtTick != null;
  const antiImpulse = assessment?.antiImpulseAtTick != null;
  const imaging = assessment?.imagingAtTick != null;
  const handedOff = assessment?.handedOffAtTick != null;
  const prompt = demonstrating ? null
    : acuteAorticSyndromeInlinePrompt(guidance, { scenarioVersion, patient: assessment });
  const act = demonstrating ? undefined : onAction;
  return (
    <div style={{ display: 'grid', gap: 'var(--space-4)' }}>
      <WatchingNotice demonstrating={demonstrating} />
      <TutorPanel prompt={prompt} />
      <div className="tray-grid">
      <section className="syringe" aria-labelledby="aortic-drift-title">
        <div id="aortic-drift-title" className="syringe__name">The first exam is a timestamp.</div>
        <Badge kind="teaching">pain · pressure · pulse · perfusion · brain</Badge>
        <div className="syringe__meta">18 min · abrupt maximum · ECG nondiagnostic · initially symmetric</div>
        <p className="syringe__remaining" role="status">
          {escalated ? 'Aortic + critical-care teams activated · unsupported defaults paused'
            : evolution ? 'ΔBP 36 · weak right radial · cool left foot · left-arm drift'
              : initial ? 'Danger remains open · repeat every territory'
                : 'Incomplete presentation · no diagnosis leaked'}
        </p>
        <div className="syringe__presets">
          <Button className="crisis-drug__action" disabled={initial}
            aria-disabled={demonstrating} onClick={act ? () => act('review-aortic-initial-pattern') : undefined}>Review pain + ECG + symmetric baseline</Button>
          <Button className="crisis-drug__action" disabled={!initial || evolution}
            aria-disabled={demonstrating} onClick={act ? () => act('repeat-aortic-asymmetry-exam') : undefined}>Repeat both arms + pulses + brain</Button>
          <Button className="crisis-drug__action" disabled={!evolution || escalated}
            aria-disabled={demonstrating} onClick={act ? () => act('activate-aortic-pathway') : undefined}>Escalate aortic concern + pause defaults</Button>
        </div>
        <p className="field__hint">A normal first pulse or neurologic exam does not stay normal by promise. Recheck discordant territories when the story changes.</p>
      </section>
      <section className="syringe" aria-labelledby="aortic-protect-title">
        <div id="aortic-protect-title" className="syringe__name">Quiet the impulse. Protect the organs.</div>
        <Badge kind="teaching">rate first · pressure second · perfusion always</Badge>
        <div className="syringe__meta">analgesia · arterial line · urgent CT · serial handoff</div>
        <p className="syringe__remaining" role="status">
          {handedOff ? 'Evolution + uncertainty handed off · scan still unavailable'
            : imaging ? 'Definitive imaging prioritized · repeat before leaving'
              : antiImpulse ? 'HR 60–80 target · SBP &lt;120 only with organ perfusion'
                : escalated ? 'Monitored anti-impulse intent next' : 'Escalation pending'}
        </p>
        <div className="syringe__presets">
          <Button className="crisis-drug__action" disabled={!escalated || antiImpulse}
            aria-disabled={demonstrating} onClick={act ? () => act('record-aortic-anti-impulse-intent') : undefined}>Analgesia + rate-first anti-impulse</Button>
          <Button className="crisis-drug__action" disabled={!antiImpulse || imaging}
            aria-disabled={demonstrating} onClick={act ? () => act('prioritize-aortic-imaging') : undefined}>Prioritize definitive aortic imaging</Button>
          <Button className="crisis-drug__action" disabled={!imaging || handedOff}
            aria-disabled={demonstrating} onClick={act ? () => act('repeat-and-handoff-aortic-evolution') : undefined}>Repeat territories + hand off uncertainty</Button>
        </div>
        <p className="field__hint">CT is the authored first imaging intent while transportable; TEE or MRI may fit another context. This lesson ends before any result or operative choice.</p>
      </section>
      </div>
    </div>
  );
}
