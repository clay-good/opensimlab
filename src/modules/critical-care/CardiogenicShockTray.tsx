/**
 * CardiogenicShockTray, moved out of `ActionCockpit.tsx` unchanged.
 *
 * The cockpit defined this tray inline and rendered it behind a `hasCardiogenicShockResponse` gate
 * computed from the scenario, so every specialty downloaded it. That gate is now this tray's
 * `supports` predicate in `trays.ts`; the body below is the original.
 */
import type { EquipmentSnapshot } from '@platform/kernel/protocol';
import { cardiogenicShockInlinePrompt } from './tutor/cardiogenic-shock-guidance';
import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import { TutorPanel, WatchingNotice } from '@anesthesia/ui/tutor-panel';
import { Badge, Button } from '@platform/ui';

export function CardiogenicShockTray({ assessment, scenarioVersion, guidance = 'unassisted', demonstrating = false, onAction }: {
  assessment?: NonNullable<EquipmentSnapshot['resuscitation']['cardiogenicShockAssessment']>;
  scenarioVersion: string;
  guidance?: GuidanceLevel;
  demonstrating?: boolean;
  onAction: (action: string) => void;
}) {
  const recognized = assessment?.recognitionAtTick != null;
  const phenotype = assessment?.phenotypeAtTick != null;
  const bridge = assessment?.bridgeAtTick != null;
  const causeControl = assessment?.causeControlAtTick != null;
  const reassessed = assessment?.reassessmentAtTick != null;
  const prompt = demonstrating ? null
    : cardiogenicShockInlinePrompt(guidance, { scenarioVersion, patient: assessment });
  const act = demonstrating ? undefined : onAction;
  return (
    <div style={{ display: 'grid', gap: 'var(--space-4)' }}>
      <WatchingNotice demonstrating={demonstrating} />
      <TutorPanel prompt={prompt} />
      <div className="tray-grid">
      <section className="syringe" aria-labelledby="cardiogenic-perfusion-title">
        <div id="cardiogenic-perfusion-title" className="syringe__name">Pressure is a clue. Perfusion is the verdict.</div>
        <Badge kind="teaching">brain · skin · kidney · lactate · trajectory</Badge>
        <div className="syringe__meta">MAP 58 · refill 5 s · urine 10 mL/h · lactate 3.1 → 4.8</div>
        <p className="syringe__remaining" role="status">
          {phenotype ? 'Acute-MI · LV-predominant · congested · alternatives open'
            : recognized ? 'Shock trajectory recognized · phenotype due'
              : 'Read the whole perfusion trajectory'}
        </p>
        <div className="syringe__presets">
          <Button className="crisis-drug__action" disabled={recognized}
            aria-disabled={demonstrating} onClick={act ? () => act('recognize-cardiogenic-shock-trajectory') : undefined}>Recognize shock + activate teams</Button>
          <Button className="crisis-drug__action" disabled={!recognized || phenotype}
            aria-disabled={demonstrating} onClick={act ? () => act('review-cardiogenic-shock-cause-and-phenotype') : undefined}>Review cause + phenotype + threats</Button>
        </div>
        <p className="field__hint">Do not wait for one pressure threshold. Stage the trajectory, phenotype the pump, and keep mechanical, rhythm, right-heart, and noncardiac causes visible.</p>
      </section>
      <section className="syringe" aria-labelledby="cardiogenic-bridge-title">
        <div id="cardiogenic-bridge-title" className="syringe__name">Bridge the pump. Fix the cause.</div>
        <Badge kind="teaching">perfusion bridge · no blind fluid · culprit pathway · reassess</Badge>
        <div className="syringe__meta">norepinephrine intent · no primary fluid load · no routine device</div>
        <p className="syringe__remaining" role="status">
          {reassessed ? 'Perfusion improved · congestion + definitive work remain open'
            : causeControl ? 'Culprit pathway prioritized · trajectory reassessment due'
              : bridge ? 'Bounded bridge recorded · cause control due' : 'Phenotype review pending'}
        </p>
        <div className="syringe__presets">
          <Button className="crisis-drug__action" disabled={!phenotype || bridge}
            aria-disabled={demonstrating} onClick={act ? () => act('record-cardiogenic-shock-bridge') : undefined}>Record perfusion-linked bridge</Button>
          <Button className="crisis-drug__action" disabled={!bridge || causeControl}
            aria-disabled={demonstrating} onClick={act ? () => act('escalate-cardiogenic-shock-cause-control') : undefined}>Prioritize culprit revascularization</Button>
          <Button className="crisis-drug__action" disabled={!causeControl || reassessed}
            aria-disabled={demonstrating} onClick={act ? () => act('reassess-cardiogenic-shock-trajectory') : undefined}>Review 10-minute trajectory</Button>
        </div>
        <p className="field__hint">Support buys time; it does not repair the infarct. Further hemodynamics, inotrope, transfer, and temporary support remain expert and trajectory dependent.</p>
      </section>
      </div>
    </div>
  );
}
