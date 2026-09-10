/**
 * UpperGiHemorrhageTray, moved out of `ActionCockpit.tsx` unchanged.
 *
 * The cockpit defined this tray inline and rendered it behind a `hasUpperGiHemorrhageResponse` gate
 * computed from the scenario, so every specialty downloaded it. That gate is now this tray's
 * `supports` predicate in `trays.ts`; the body below is the original.
 */
import type { EquipmentSnapshot } from '@platform/kernel/protocol';
import { upperGiHemorrhageInlinePrompt } from './tutor/upper-gi-hemorrhage-guidance';
import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import { TutorPanel, WatchingNotice } from '@anesthesia/ui/tutor-panel';
import { Badge, Button } from '@platform/ui';

export function UpperGiHemorrhageTray({ assessment, scenarioVersion, guidance = 'unassisted', demonstrating = false, onAction }: {
  assessment?: NonNullable<EquipmentSnapshot['resuscitation']['upperGiHemorrhageAssessment']>;
  scenarioVersion: string;
  guidance?: GuidanceLevel;
  demonstrating?: boolean;
  onAction: (action: string) => void;
}) {
  const recognized = assessment?.recognitionAtTick != null;
  const pattern = assessment?.patternAtTick != null;
  const resuscitation = assessment?.resuscitationAtTick != null;
  const hemostasis = assessment?.hemostasisAtTick != null;
  const reassessed = assessment?.reassessmentAtTick != null;
  const prompt = demonstrating ? null
    : upperGiHemorrhageInlinePrompt(guidance, { scenarioVersion, patient: assessment });
  const act = demonstrating ? undefined : onAction;
  return (
    <div style={{ display: 'grid', gap: 'var(--space-4)' }}>
      <WatchingNotice demonstrating={demonstrating} />
      <TutorPanel prompt={prompt} />
      <div className="tray-grid">
      <section className="syringe" aria-labelledby="upper-gi-hemorrhage-pattern-title">
        <div id="upper-gi-hemorrhage-pattern-title" className="syringe__name">The trend spoke before the pressure fell.</div>
        <Badge kind="teaching">recurrent hematemesis · melena · falling flow · prior ulcer hemostasis</Badge>
        <div className="syringe__meta">MAP 55 · HR 122 · Hb 6.8 · lactate 4.6 · refill 5 sec</div>
        <p className="syringe__remaining" role="status">
          {pattern ? 'Recurrent nonvariceal bleed · airway + alternate sources stay visible'
            : recognized ? 'Hemorrhage response active · whole-pattern review due'
              : 'New blood. Worse perfusion. Reopen the pathway.'}
        </p>
        <div className="syringe__presets">
          <Button className="crisis-drug__action" disabled={recognized}
            aria-disabled={demonstrating} onClick={act ? () => act('recognize-recurrent-upper-gi-hemorrhage') : undefined}>Recognize recurrence + activate help</Button>
          <Button className="crisis-drug__action" disabled={!recognized || pattern}
            aria-disabled={demonstrating} onClick={act ? () => act('review-upper-gi-hemorrhage-pattern') : undefined}>Review bleed + perfusion context</Button>
        </div>
        <p className="field__hint">Hemoglobin belongs in the trajectory. It is not the perfusion exam and not the only reason to act.</p>
      </section>
      <section className="syringe" aria-labelledby="upper-gi-hemorrhage-control-title">
        <div id="upper-gi-hemorrhage-control-title" className="syringe__name">Resuscitate the patient. Reopen hemostasis.</div>
        <Badge kind="teaching">individualize the bridge · repeat endoscopy · preserve failure pathways</Badge>
        <div className="syringe__meta">restrictive ≠ rigid · resuscitation ∥ source control</div>
        <p className="syringe__remaining" role="status">
          {reassessed ? 'Perfusion improved · hemostasis still unproven'
            : hemostasis ? 'Repeat-hemostasis pathway active · response review due'
              : resuscitation ? 'Individualized bridge recorded · definitive control due'
                : 'Resuscitation + hemostasis pathways pending'}
        </p>
        <div className="syringe__presets">
          <Button className="crisis-drug__action" disabled={!pattern || resuscitation}
            aria-disabled={demonstrating} onClick={act ? () => act('record-upper-gi-hemorrhage-resuscitation') : undefined}>Record individualized resuscitation</Button>
          <Button className="crisis-drug__action" disabled={!resuscitation || hemostasis}
            aria-disabled={demonstrating} onClick={act ? () => act('activate-repeat-endoscopy-pathway') : undefined}>Activate repeat endoscopy pathway</Button>
          <Button className="crisis-drug__action" disabled={!hemostasis || reassessed}
            aria-disabled={demonstrating} onClick={act ? () => act('reassess-upper-gi-hemorrhage-trajectory') : undefined}>Review bridge + bleeding trajectory</Button>
        </div>
        <p className="field__hint">A better pressure is a bridge signal, not proof that the ulcer stopped bleeding.</p>
      </section>
      </div>
    </div>
  );
}
