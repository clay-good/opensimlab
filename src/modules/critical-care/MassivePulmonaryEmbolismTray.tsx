/**
 * MassivePulmonaryEmbolismTray, moved out of `ActionCockpit.tsx` unchanged.
 *
 * The cockpit defined this tray inline and rendered it behind a `hasMassivePulmonaryEmbolismResponse` gate
 * computed from the scenario, so every specialty downloaded it. That gate is now this tray's
 * `supports` predicate in `trays.ts`; the body below is the original.
 */
import type { EquipmentSnapshot } from '@platform/kernel/protocol';
import { massivePeInlinePrompt } from './tutor/massive-pe-guidance';
import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import { TutorPanel, WatchingNotice } from '@anesthesia/ui/tutor-panel';
import { Badge, Button } from '@platform/ui';

export function MassivePulmonaryEmbolismTray({ assessment, scenarioVersion, guidance = 'unassisted', demonstrating = false, onAction }: {
  assessment?: NonNullable<EquipmentSnapshot['resuscitation']['massivePulmonaryEmbolismAssessment']>;
  scenarioVersion: string;
  guidance?: GuidanceLevel;
  demonstrating?: boolean;
  onAction: (action: string) => void;
}) {
  const recognized = assessment?.recognitionAtTick != null;
  const pattern = assessment?.patternAtTick != null;
  const support = assessment?.supportAtTick != null;
  const ecmo = assessment?.ecmoAtTick != null;
  const reassessed = assessment?.reassessmentAtTick != null;
  const prompt = demonstrating ? null
    : massivePeInlinePrompt(guidance, { scenarioVersion, patient: assessment });
  const act = demonstrating ? undefined : onAction;
  return (
    <div style={{ display: 'grid', gap: 'var(--space-4)' }}>
      <WatchingNotice demonstrating={demonstrating} />
      <TutorPanel prompt={prompt} />
      <div className="tray-grid">
      <section className="syringe" aria-labelledby="massive-pe-pattern-title">
        <div id="massive-pe-pattern-title" className="syringe__name">This is the failure state. Mobilize the system.</div>
        <Badge kind="teaching">confirmed PE · refractory shock · ventilatory failure · Category E2R</Badge>
        <div className="syringe__meta">MAP 50 · lactate 8.1 · SpO₂ 82% · weak dilated RV · small LV</div>
        <p className="syringe__remaining" role="status">
          {pattern ? 'Acute obstructive RV failure · rescue cannot wait'
            : recognized ? 'Category E2R recognized · fixed pattern review due'
              : 'Three infusions. Falling flow. No reserve.'}
        </p>
        <div className="syringe__presets">
          <Button className="crisis-drug__action" disabled={recognized}
            aria-disabled={demonstrating} onClick={act ? () => act('recognize-refractory-pe-shock') : undefined}>Recognize E2R + activate rescue</Button>
          <Button className="crisis-drug__action" disabled={!recognized || pattern}
            aria-disabled={demonstrating} onClick={act ? () => act('review-refractory-pe-pattern') : undefined}>Review PE + RV rescue context</Button>
        </div>
        <p className="field__hint">The diagnosis is already confirmed. Recheck the physiology and dangerous alternatives without making rescue wait for another diagnostic lap.</p>
      </section>
      <section className="syringe" aria-labelledby="massive-pe-bridge-title">
        <div id="massive-pe-bridge-title" className="syringe__name">Bridge the circulation. Keep the clot decision open.</div>
        <Badge kind="teaching">RV-sensitive support · no blind fluid · VA-ECMO pathway · reassess</Badge>
        <div className="syringe__meta">resource + candidacy dependent · support ≠ thrombus treatment</div>
        <p className="syringe__remaining" role="status">
          {reassessed ? 'Flow + oxygenation improved · RV + embolus work remain'
            : ecmo ? 'Specialist bridge activated · response review due'
              : support ? 'RV-sensitive support recorded · rescue bridge due'
                : 'Perfusion bridge pending'}
        </p>
        <div className="syringe__presets">
          <Button className="crisis-drug__action" disabled={!pattern || support}
            aria-disabled={demonstrating} onClick={act ? () => act('record-refractory-pe-support') : undefined}>Record RV-sensitive support</Button>
          <Button className="crisis-drug__action" disabled={!support || ecmo}
            aria-disabled={demonstrating} onClick={act ? () => act('activate-pe-ecmo-bridge') : undefined}>Activate resource-ready VA-ECMO</Button>
          <Button className="crisis-drug__action" disabled={!ecmo || reassessed}
            aria-disabled={demonstrating} onClick={act ? () => act('reassess-pe-ecmo-trajectory') : undefined}>Review bridge + clot strategy</Button>
        </div>
        <p className="field__hint">VA-ECMO can restore perfusion and oxygenation. It does not remove clot, prove candidacy, or make adjunctive reperfusion automatically beneficial.</p>
      </section>
      </div>
    </div>
  );
}
