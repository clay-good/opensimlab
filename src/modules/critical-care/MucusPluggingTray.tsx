/**
 * MucusPluggingTray, moved out of `ActionCockpit.tsx` unchanged.
 *
 * The cockpit defined this tray inline and rendered it behind a `hasMucusPluggingResponse` gate
 * computed from the scenario, so every specialty downloaded it. That gate is now this tray's
 * `supports` predicate in `trays.ts`; the body below is the original.
 */
import type { EquipmentSnapshot } from '@platform/kernel/protocol';
import { mucusPluggingInlinePrompt } from './tutor/mucus-plugging-guidance';
import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import { TutorPanel, WatchingNotice } from '@anesthesia/ui/tutor-panel';
import { Badge, Button } from '@platform/ui';

export function MucusPluggingTray({ assessment, scenarioVersion, guidance = 'unassisted', demonstrating = false, onAction }: {
  assessment?: NonNullable<EquipmentSnapshot['resuscitation']['mucusPluggingAssessment']>;
  scenarioVersion: string;
  guidance?: GuidanceLevel;
  demonstrating?: boolean;
  onAction: (action: string) => void;
}) {
  const support = assessment?.supportAtTick != null;
  const indicators = assessment?.indicatorsAtTick != null;
  const suction = assessment?.suctionAtTick != null;
  const reassessment = assessment?.reassessmentAtTick != null;
  const escalation = assessment?.escalationAtTick != null;
  const prompt = demonstrating ? null
    : mucusPluggingInlinePrompt(guidance, { scenarioVersion, patient: assessment });
  const act = demonstrating ? undefined : onAction;
  return (
    <div style={{ display: 'grid', gap: 'var(--space-4)' }}>
      <WatchingNotice demonstrating={demonstrating} />
      <TutorPanel prompt={prompt} />
      <div className="tray-grid">
      <section className="syringe" aria-labelledby="mucus-listen-title">
        <div id="mucus-listen-title" className="syringe__name">Listen to the resistance.</div>
        <Badge kind="teaching">sounds · secretions · flow · pressure</Badge>
        <div className="syringe__meta">sawtooth flow · peak 38 · plateau 23 · SpO₂ 87%</div>
        <p className="syringe__remaining" role="status">
          {indicators ? 'Retained-secretion indicators converge · location unproven'
            : support ? 'Support active · review the airway-resistance pattern'
              : 'Oxygenation support + experienced help due'}
        </p>
        <div className="syringe__presets">
          <Button className="crisis-drug__action" disabled={support}
            aria-disabled={demonstrating} onClick={act ? () => act('support-mucus-plugging-and-call-help') : undefined}>Support oxygenation + call help</Button>
          <Button className="crisis-drug__action" disabled={!support || indicators}
            aria-disabled={demonstrating} onClick={act ? () => act('review-mucus-plugging-indicators') : undefined}>Review airway + graphics + mechanics</Button>
        </div>
        <p className="field__hint">No single sign diagnoses a plug. Keep tube, circuit, pleural, parenchymal, blood, and foreign-body causes open.</p>
      </section>
      <section className="syringe" aria-labelledby="mucus-clear-title">
        <div id="mucus-clear-title" className="syringe__name">Clear, then prove it.</div>
        <Badge kind="teaching">preoxygenate · as needed · no routine saline</Badge>
        <div className="syringe__meta">shallow first · reassess · focal finding persists</div>
        <p className="syringe__remaining" role="status">
          {escalation ? 'Persistent left-base concern · imaging + airway review recorded'
            : reassessment ? 'Central resistance improved · focal concern remains'
              : suction ? 'Clearance intent recorded · response due' : 'Indication review pending'}
        </p>
        <div className="syringe__presets">
          <Button className="crisis-drug__action" disabled={!indicators || suction}
            aria-disabled={demonstrating} onClick={act ? () => act('record-indicated-airway-suction-intent') : undefined}>Record indicated suction intent</Button>
          <Button className="crisis-drug__action" disabled={!suction || reassessment}
            aria-disabled={demonstrating} onClick={act ? () => act('reassess-mucus-plugging-response') : undefined}>Review post-clearance response</Button>
          <Button className="crisis-drug__action" disabled={!reassessment || escalation}
            aria-disabled={demonstrating} onClick={act ? () => act('escalate-persistent-mucus-plugging') : undefined}>Escalate persistent focal concern</Button>
        </div>
        <p className="field__hint">Routine bronchoscopy is not the answer. Persistent focal physiology still earns imaging and experienced evaluation.</p>
      </section>
      </div>
    </div>
  );
}
