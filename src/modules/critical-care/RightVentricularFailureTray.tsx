/**
 * RightVentricularFailureTray, moved out of `ActionCockpit.tsx` unchanged.
 *
 * The cockpit defined this tray inline and rendered it behind a `hasRightVentricularFailureResponse` gate
 * computed from the scenario, so every specialty downloaded it. That gate is now this tray's
 * `supports` predicate in `trays.ts`; the body below is the original.
 */
import type { EquipmentSnapshot } from '@platform/kernel/protocol';
import { rvFailureInlinePrompt } from './tutor/rv-failure-guidance';
import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import { TutorPanel, WatchingNotice } from '@anesthesia/ui/tutor-panel';
import { Badge, Button } from '@platform/ui';

export function RightVentricularFailureTray({ assessment, scenarioVersion, guidance = 'unassisted', demonstrating = false, onAction }: {
  assessment?: NonNullable<EquipmentSnapshot['resuscitation']['rightVentricularFailureAssessment']>;
  scenarioVersion: string;
  guidance?: GuidanceLevel;
  demonstrating?: boolean;
  onAction: (action: string) => void;
}) {
  const recognized = assessment?.recognitionAtTick != null;
  const phenotype = assessment?.phenotypeAtTick != null;
  const support = assessment?.supportAtTick != null;
  const triggers = assessment?.triggersAtTick != null;
  const reassessed = assessment?.reassessmentAtTick != null;
  const prompt = demonstrating ? null
    : rvFailureInlinePrompt(guidance, { scenarioVersion, patient: assessment });
  const act = demonstrating ? undefined : onAction;
  return (
    <div style={{ display: 'grid', gap: 'var(--space-4)' }}>
      <WatchingNotice demonstrating={demonstrating} />
      <TutorPanel prompt={prompt} />
      <div className="tray-grid">
      <section className="syringe" aria-labelledby="rv-pattern-title">
        <div id="rv-pattern-title" className="syringe__name">Read the ventricle, not just the pressure.</div>
        <Badge kind="teaching">congestion · perfusion · RV shape · septum · output</Badge>
        <div className="syringe__meta">dilated weak RV · flat septum · small LV · CVP 18 · CI 1.8</div>
        <p className="syringe__remaining" role="status">
          {phenotype ? 'Pressure-loaded RV failure · no universal cutoff'
            : recognized ? 'Congestion + underperfusion recognized · phenotype due'
              : 'The venous side can fail the whole circulation'}
        </p>
        <div className="syringe__presets">
          <Button className="crisis-drug__action" disabled={recognized}
            aria-disabled={demonstrating} onClick={act ? () => act('recognize-rv-failure-trajectory') : undefined}>Recognize trajectory + call teams</Button>
          <Button className="crisis-drug__action" disabled={!recognized || phenotype}
            aria-disabled={demonstrating} onClick={act ? () => act('review-rv-failure-phenotype') : undefined}>Review RV pattern in context</Button>
        </div>
        <p className="field__hint">A high CVP is not a fluid prescription. Read filling pressure beside output, congestion, the septum, and treatment response.</p>
      </section>
      <section className="syringe" aria-labelledby="rv-support-title">
        <div id="rv-support-title" className="syringe__name">Protect filling. Lower the load. Prove the flow.</div>
        <Badge kind="teaching">perfusion · oxygen + pH · rhythm · preload · afterload · reassess</Badge>
        <div className="syringe__meta">no reflex fluid · no reflex decongestion · triggers stay open</div>
        <p className="syringe__remaining" role="status">
          {reassessed ? 'Immediate perfusion improved · congestion + cause work remain'
            : triggers ? 'Triggers kept open · trajectory reassessment due'
              : support ? 'Individualized support recorded · trigger review due'
                : 'RV-protective support pending'}
        </p>
        <div className="syringe__presets">
          <Button className="crisis-drug__action" disabled={!phenotype || support}
            aria-disabled={demonstrating} onClick={act ? () => act('record-rv-failure-support') : undefined}>Record individualized RV support</Button>
          <Button className="crisis-drug__action" disabled={!support || triggers}
            aria-disabled={demonstrating} onClick={act ? () => act('address-rv-failure-triggers') : undefined}>Keep reversible triggers open</Button>
          <Button className="crisis-drug__action" disabled={!triggers || reassessed}
            aria-disabled={demonstrating} onClick={act ? () => act('reassess-rv-failure-trajectory') : undefined}>Review 10-minute trajectory</Button>
        </div>
        <p className="field__hint">Support is a moving balance, not a recipe. Specialist therapy, ventilation, diuresis, inotropy, and temporary support remain cause and trajectory dependent.</p>
      </section>
      </div>
    </div>
  );
}
