/**
 * IcuHiddenDeteriorationHandoffTray, moved out of `ActionCockpit.tsx` unchanged.
 *
 * The cockpit defined this tray inline and rendered it behind a `hasIcuHiddenDeteriorationHandoffResponse` gate
 * computed from the scenario, so every specialty downloaded it. That gate is now this tray's
 * `supports` predicate in `trays.ts`; the body below is the original.
 */
import type { EquipmentSnapshot } from '@platform/kernel/protocol';
import { icuHandoffInlinePrompt } from './tutor/icu-handoff-guidance';
import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import { TutorPanel, WatchingNotice } from '@anesthesia/ui/tutor-panel';
import { Badge, Button } from '@platform/ui';

export function IcuHiddenDeteriorationHandoffTray({ assessment, scenarioVersion, guidance = 'unassisted', demonstrating = false, onAction }: {
  assessment?: NonNullable<EquipmentSnapshot['resuscitation']['icuHiddenDeteriorationHandoffAssessment']>;
  scenarioVersion: string;
  guidance?: GuidanceLevel;
  demonstrating?: boolean;
  onAction: (action: string) => void;
}) {
  const ready = assessment?.readinessAtTick != null;
  const content = assessment?.contentAtTick != null;
  const crossChecked = assessment?.crossCheckAtTick != null;
  const escalated = assessment?.escalationAtTick != null;
  const accepted = assessment?.acceptanceAtTick != null;
  const prompt = demonstrating ? null
    : icuHandoffInlinePrompt(guidance, { scenarioVersion, patient: assessment });
  const act = demonstrating ? undefined : onAction;
  return (
    <div style={{ display: 'grid', gap: 'var(--space-4)' }}>
      <WatchingNotice demonstrating={demonstrating} />
      <TutorPanel prompt={prompt} />
      <div className="tray-grid">
      <section className="syringe" aria-labelledby="icu-hidden-handoff-truth-title">
        <div id="icu-hidden-handoff-truth-title" className="syringe__name">Receive the story. Check the patient.</div>
        <Badge kind="teaching">“stable” · support rising · perfusion falling</Badge>
        <div className="syringe__meta">HR 94→118 · MAP 70→64 · lactate 3.1→5.8 · urine 30→5</div>
        <p className="syringe__remaining" role="status">
          {crossChecked ? 'Label corrected · worsening shock recognized'
            : content ? 'Outgoing claim received · bedside reconciliation due'
              : ready ? 'Receiver ready · structured content due'
                : 'Shared attention + bedside coverage pending'}
        </p>
        <div className="syringe__presets">
          <Button className="crisis-drug__action" disabled={ready}
            aria-disabled={demonstrating} onClick={act ? () => act('establish-icu-handoff-readiness') : undefined}>Establish readiness + bedside coverage</Button>
          <Button className="crisis-drug__action" disabled={!ready || content}
            aria-disabled={demonstrating} onClick={act ? () => act('receive-icu-handoff-content') : undefined}>Receive severity + support + pending work</Button>
          <Button className="crisis-drug__action" disabled={!content || crossChecked}
            aria-disabled={demonstrating} onClick={act ? () => act('cross-check-hidden-deterioration') : undefined}>Cross-check patient + trends + devices</Button>
        </div>
        <p className="field__hint">The outgoing label is a claim. Dated physiology and source-to-patient support are the cross-check.</p>
      </section>
      <section className="syringe" aria-labelledby="icu-hidden-handoff-ownership-title">
        <div id="icu-hidden-handoff-ownership-title" className="syringe__name">Make the next move unmistakable.</div>
        <Badge kind="teaching">severity · action · trigger · contingency · owner</Badge>
        <div className="syringe__meta">escalate before acceptance · synthesize before ownership changes</div>
        <p className="syringe__remaining" role="status">
          {accepted ? 'Accepted · MAP 70 · source + trajectory remain open'
            : escalated ? 'Escalation + owners explicit · receiver synthesis due'
              : 'Worsening-shock escalation pending'}
        </p>
        <div className="syringe__presets">
          <Button className="crisis-drug__action" disabled={!crossChecked || escalated}
            aria-disabled={demonstrating} onClick={act ? () => act('escalate-icu-handoff-deterioration') : undefined}>Escalate + assign triggers + owners</Button>
          <Button className="crisis-drug__action" disabled={!escalated || accepted}
            aria-disabled={demonstrating} onClick={act ? () => act('synthesize-accept-and-reassess-icu-handoff') : undefined}>Synthesize + accept + reassess</Button>
        </div>
        <p className="field__hint">Acceptance records a teaching-state transition, not real communication, staffing, treatment, or transfer.</p>
      </section>
      </div>
    </div>
  );
}
