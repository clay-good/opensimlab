/**
 * ArdsLungProtectiveTray, moved out of `ActionCockpit.tsx` unchanged.
 *
 * The cockpit defined this tray inline and rendered it behind a `hasArdsLungProtectiveResponse` gate
 * computed from the scenario, so every specialty downloaded it. That gate is now this tray's
 * `supports` predicate in `trays.ts`; the body below is the original.
 */
import type { EquipmentSnapshot } from '@platform/kernel/protocol';
import { ardsLungProtectiveInlinePrompt } from './tutor/ards-lung-protective-guidance';
import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import { TutorPanel, WatchingNotice } from '@anesthesia/ui/tutor-panel';
import { Badge, Button } from '@platform/ui';

export function ArdsLungProtectiveTray({ assessment, scenarioVersion, guidance = 'unassisted', demonstrating = false, onAction }: {
  assessment?: NonNullable<EquipmentSnapshot['resuscitation']['ardsLungProtectiveAssessment']>;
  scenarioVersion: string;
  guidance?: GuidanceLevel;
  demonstrating?: boolean;
  onAction: (action: string) => void;
}) {
  const baseline = assessment?.baselineAtTick != null;
  const pbw = assessment?.pbwAtTick != null;
  const protection = assessment?.protectionAtTick != null;
  const reassessment = assessment?.reassessmentAtTick != null;
  const escalation = assessment?.escalationAtTick != null;
  const prompt = demonstrating ? null
    : ardsLungProtectiveInlinePrompt(guidance, { scenarioVersion, patient: assessment });
  const act = demonstrating ? undefined : onAction;
  return (
    <div style={{ display: 'grid', gap: 'var(--space-4)' }}>
      <WatchingNotice demonstrating={demonstrating} />
      <TutorPanel prompt={prompt} />
      <div className="tray-grid">
      <section className="syringe" aria-labelledby="ards-size-title">
        <div id="ards-size-title" className="syringe__name">Size the breath to the lung.</div>
        <Badge kind="teaching">height + sex → PBW · never actual weight</Badge>
        <div className="syringe__meta">170 cm · 92 kg actual · 61.5 kg PBW · plateau 32</div>
        <p className="syringe__remaining" role="status">
          {protection ? '370 mL · 6 mL/kg PBW · plateau limit <30'
            : pbw ? '500 mL is 8.1 mL/kg PBW · protect now'
              : baseline ? 'Oxygenation + mechanics integrated · find PBW' : 'Baseline review pending'}
        </p>
        <div className="syringe__presets">
          <Button className="crisis-drug__action" disabled={baseline}
            aria-disabled={demonstrating} onClick={act ? () => act('review-ards-baseline') : undefined}>Review gas + mechanics + circulation</Button>
          <Button className="crisis-drug__action" disabled={!baseline || pbw}
            aria-disabled={demonstrating} onClick={act ? () => act('calculate-ards-pbw') : undefined}>Calculate height-based PBW</Button>
          <Button className="crisis-drug__action" disabled={!pbw || protection}
            aria-disabled={demonstrating} onClick={act ? () => act('record-ards-protective-settings') : undefined}>Set 370 mL + plateau guardrail</Button>
        </div>
        <p className="field__hint">A reassuring pH does not make a plateau pressure of 32 safe. Protect first, then measure what the change costs.</p>
      </section>
      <section className="syringe" aria-labelledby="ards-response-title">
        <div id="ards-response-title" className="syringe__name">Every setting owes you a response.</div>
        <Badge kind="teaching">pressure · gas · synchrony · circulation</Badge>
        <div className="syringe__meta">30 min · plateau 27 · pH 7.29 · PaCO₂ 52 · MAP 70</div>
        <p className="syringe__remaining" role="status">
          {escalation ? 'PEEP/FiO₂ + >12 h prone-team intent handed off'
            : reassessment ? 'Protection held · hypoxemia persists · escalate deliberately'
              : protection ? 'Reassessment due before escalation' : 'Protective setting pending'}
        </p>
        <div className="syringe__presets">
          <Button className="crisis-drug__action" disabled={!protection || reassessment}
            aria-disabled={demonstrating} onClick={act ? () => act('reassess-ards-protection') : undefined}>Review 30-minute response</Button>
          <Button className="crisis-drug__action" disabled={!reassessment || escalation}
            aria-disabled={demonstrating} onClick={act ? () => act('record-ards-peep-prone-escalation') : undefined}>PEEP/FiO₂ + prolonged prone team</Button>
        </div>
        <p className="field__hint">Accept bounded hypercapnia only with serial pH and whole-patient review. Proning is a trained-team procedure, not a button skill.</p>
      </section>
      </div>
    </div>
  );
}
