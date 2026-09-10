/**
 * PostInfarctionShockTray, moved out of `ActionCockpit.tsx` unchanged.
 *
 * The cockpit defined this tray inline and rendered it behind a `hasPostInfarctionShockResponse` gate
 * computed from the scenario, so every specialty downloaded it. That gate is now this tray's
 * `supports` predicate in `trays.ts`; the body below is the original.
 */
import type { EquipmentSnapshot } from '@platform/kernel/protocol';
import { postInfarctionShockInlinePrompt } from './tutor/post-infarction-shock-guidance';
import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import { TutorPanel, WatchingNotice } from '@anesthesia/ui/tutor-panel';
import { Badge, Button } from '@platform/ui';

export function PostInfarctionShockTray({ assessment, scenarioVersion, guidance = 'unassisted', demonstrating = false, onAction }: {
  assessment?: NonNullable<EquipmentSnapshot['resuscitation']['postInfarctionShockAssessment']>;
  scenarioVersion: string;
  guidance?: GuidanceLevel;
  demonstrating?: boolean;
  onAction: (action: string) => void;
}) {
  const trajectory = assessment?.trajectoryAtTick != null;
  const causes = assessment?.causesAtTick != null;
  const transfer = assessment?.transferAtTick != null;
  const bridge = assessment?.bridgeAtTick != null;
  const handoff = assessment?.handoffAtTick != null;
  const prompt = demonstrating ? null
    : postInfarctionShockInlinePrompt(guidance, { scenarioVersion, patient: assessment });
  const act = demonstrating ? undefined : onAction;
  return (
    <div style={{ display: 'grid', gap: 'var(--space-4)' }}>
    <WatchingNotice demonstrating={demonstrating} />
    <TutorPanel prompt={prompt} />
    <div className="tray-grid">
      <section className="syringe" aria-labelledby="post-infarction-shock-trajectory-title">
        <div id="post-infarction-shock-trajectory-title" className="syringe__name">Pressure moved. Perfusion did not.</div>
        <Badge kind="teaching">brain · skin · kidney · lactate · congestion · pressure</Badge>
        <div className="syringe__meta">MAP 57 → 64 · urine 8 mL/h · lactate 4.2 → 5.1</div>
        <p className="syringe__remaining" role="status">
          {causes && transfer ? 'Causes open · regional shock center contacted'
            : trajectory ? 'Inadequate response · reopen causes and contact help in parallel'
              : 'A better MAP is not shock resolution'}
        </p>
        <div className="syringe__presets">
          <Button className="crisis-drug__action" disabled={trajectory}
            aria-disabled={demonstrating} onClick={act ? () => act('reconcile-post-infarction-shock-trajectory') : undefined}>Reconcile failure to improve</Button>
          <Button className="crisis-drug__action" disabled={!trajectory || causes}
            aria-disabled={demonstrating} onClick={act ? () => act('reopen-post-infarction-shock-causes') : undefined}>Reopen causes + reported care</Button>
          <Button className="crisis-drug__action" disabled={!trajectory || transfer}
            aria-disabled={demonstrating} onClick={act ? () => act('contact-post-infarction-shock-center') : undefined}>Contact local + regional shock teams</Button>
        </div>
        <p className="field__hint">Immediate post-PCI findings are snapshots. Recurrent ischemia, mechanical, RV, rhythm, bleeding, vasodilated, and obstructive causes remain open.</p>
      </section>
      <section className="syringe" aria-labelledby="post-infarction-shock-bridge-title">
        <div id="post-infarction-shock-bridge-title" className="syringe__name">Build the bridge. Keep the exit open.</div>
        <Badge kind="teaching">perfusion · congestion · oxygenation · rhythm · candidacy · transport</Badge>
        <div className="syringe__meta">No blind fluid · no universal target · no routine device</div>
        <p className="syringe__remaining" role="status">
          {handoff ? 'Shock unresolved · owners + triggers handed off'
            : bridge ? 'Bridge recorded · allow reassessment time'
              : causes && transfer ? 'Consultation active · individualized bridge due'
                : 'Cause review + regional consultation pending'}
        </p>
        <div className="syringe__presets">
          <Button className="crisis-drug__action" disabled={!causes || !transfer || bridge}
            aria-disabled={demonstrating} onClick={act ? () => act('record-post-infarction-shock-bridge') : undefined}>Record individualized potential-transport bridge</Button>
          <Button className="crisis-drug__action" disabled={!bridge || handoff}
            aria-disabled={demonstrating} onClick={act ? () => act('handoff-post-infarction-shock-trajectory') : undefined}>Reassess + hand off unresolved work</Button>
        </div>
        <p className="field__hint">Consultation is not transfer authorization. Stability, contraindications, preferences, accepting-center selection, support, transport, disposition, and outcome remain expert work.</p>
      </section>
    </div>
    </div>
  );
}
