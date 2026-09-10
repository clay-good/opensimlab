/**
 * MixedShockTray, moved out of `ActionCockpit.tsx` unchanged.
 *
 * The cockpit defined this tray inline and rendered it behind a `hasMixedShockResponse` gate
 * computed from the scenario, so every specialty downloaded it. That gate is now this tray's
 * `supports` predicate in `trays.ts`; the body below is the original.
 */
import type { EquipmentSnapshot } from '@platform/kernel/protocol';
import { mixedShockInlinePrompt } from './tutor/mixed-shock-guidance';
import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import { TutorPanel, WatchingNotice } from '@anesthesia/ui/tutor-panel';
import { Badge, Button } from '@platform/ui';

export function MixedShockTray({ assessment, scenarioVersion, guidance = 'unassisted', demonstrating = false, onAction }: {
  assessment?: NonNullable<EquipmentSnapshot['resuscitation']['mixedShockAssessment']>;
  scenarioVersion: string;
  guidance?: GuidanceLevel;
  demonstrating?: boolean;
  onAction: (action: string) => void;
}) {
  const recognized = assessment?.recognitionAtTick != null;
  const hemodynamics = assessment?.hemodynamicsAtTick != null;
  const support = assessment?.supportAtTick != null;
  const causes = assessment?.causesAtTick != null;
  const reassessed = assessment?.reassessmentAtTick != null;
  const prompt = demonstrating ? null
    : mixedShockInlinePrompt(guidance, { scenarioVersion, patient: assessment });
  const act = demonstrating ? undefined : onAction;
  return (
    <div style={{ display: 'grid', gap: 'var(--space-4)' }}>
      <WatchingNotice demonstrating={demonstrating} />
      <TutorPanel prompt={prompt} />
      <div className="tray-grid">
      <section className="syringe" aria-labelledby="mixed-pattern-title">
        <div id="mixed-pattern-title" className="syringe__name">When clues disagree, believe the pattern.</div>
        <Badge kind="teaching">output · tone · filling pressure · perfusion · context</Badge>
        <div className="syringe__meta">CI 1.7 · wedge 24 · SVR 720 · LVEF 25% · warm + mottled</div>
        <p className="syringe__remaining" role="status">
          {hemodynamics ? 'Cardiac + vasodilatory phenotype · no universal cutoff'
            : recognized ? 'Discordant shock recognized · hemodynamic context due'
              : 'One pure label cannot explain this trajectory'}
        </p>
        <div className="syringe__presets">
          <Button className="crisis-drug__action" disabled={recognized}
            aria-disabled={demonstrating} onClick={act ? () => act('recognize-mixed-shock-discordance') : undefined}>Recognize discordance + call teams</Button>
          <Button className="crisis-drug__action" disabled={!recognized || hemodynamics}
            aria-disabled={demonstrating} onClick={act ? () => act('classify-mixed-shock-hemodynamics') : undefined}>Review hemodynamics in context</Button>
        </div>
        <p className="field__hint">Numbers should make you reconsider the model, not stop thinking. Vasoactive treatment changes both output and vascular-resistance interpretation.</p>
      </section>
      <section className="syringe" aria-labelledby="mixed-support-title">
        <div id="mixed-support-title" className="syringe__name">Support both halves. Chase both causes.</div>
        <Badge kind="teaching">tone · output review · no blind fluid · parallel causes · reassess</Badge>
        <div className="syringe__meta">cardiac pathway · pneumonia pathway · congestion guardrail</div>
        <p className="syringe__remaining" role="status">
          {reassessed ? 'Immediate perfusion improved · both causes remain open'
            : causes ? 'Parallel cause control recorded · trajectory reassessment due'
              : support ? 'Tone + output review recorded · cause pathways due'
                : 'Mixed-physiology support pending'}
        </p>
        <div className="syringe__presets">
          <Button className="crisis-drug__action" disabled={!hemodynamics || support}
            aria-disabled={demonstrating} onClick={act ? () => act('record-mixed-shock-support') : undefined}>Record tone + output support review</Button>
          <Button className="crisis-drug__action" disabled={!support || causes}
            aria-disabled={demonstrating} onClick={act ? () => act('address-mixed-shock-causes') : undefined}>Keep both cause pathways active</Button>
          <Button className="crisis-drug__action" disabled={!causes || reassessed}
            aria-disabled={demonstrating} onClick={act ? () => act('reassess-mixed-shock-trajectory') : undefined}>Review 10-minute trajectory</Button>
        </div>
        <p className="field__hint">A mixed label is a beginning, not a destination. Reassess perfusion, congestion, infection, cardiac function, and treatment effect together.</p>
      </section>
      </div>
    </div>
  );
}
