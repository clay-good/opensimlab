/**
 * EscalatingHypoxemiaTray, moved out of `ActionCockpit.tsx` unchanged.
 *
 * The cockpit defined this tray inline and rendered it behind a `hasEscalatingHypoxemiaResponse` gate
 * computed from the scenario, so every specialty downloaded it. That gate is now this tray's
 * `supports` predicate in `trays.ts`; the body below is the original.
 */
import type { EquipmentSnapshot } from '@platform/kernel/protocol';
import { escalatingHypoxemiaInlinePrompt } from './tutor/escalating-hypoxemia-guidance';
import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import { TutorPanel, WatchingNotice } from '@anesthesia/ui/tutor-panel';
import { Badge, Button } from '@platform/ui';

export function EscalatingHypoxemiaTray({ assessment, scenarioVersion, guidance = 'unassisted', demonstrating = false, onAction }: {
  assessment?: NonNullable<EquipmentSnapshot['resuscitation']['escalatingHypoxemiaAssessment']>;
  scenarioVersion: string;
  guidance?: GuidanceLevel;
  demonstrating?: boolean;
  onAction: (action: string) => void;
}) {
  const signal = assessment?.signalAtTick != null;
  const support = assessment?.supportAtTick != null;
  const deliveryPath = assessment?.deliveryPathAtTick != null;
  const bedsidePattern = assessment?.bedsidePatternAtTick != null;
  const escalation = assessment?.escalationAtTick != null;
  const prompt = demonstrating ? null
    : escalatingHypoxemiaInlinePrompt(guidance, { scenarioVersion, patient: assessment });
  const act = demonstrating ? undefined : onAction;
  return (
    <div style={{ display: 'grid', gap: 'var(--space-4)' }}>
      <WatchingNotice demonstrating={demonstrating} />
      <TutorPanel prompt={prompt} />
      <div className="tray-grid">
      <section className="syringe" aria-labelledby="hypoxemia-signal-title">
        <div id="hypoxemia-signal-title" className="syringe__name">Believe the drop. Verify the signal.</div>
        <Badge kind="teaching">pleth · trend · patient · arterial panel</Badge>
        <div className="syringe__meta">94% → 84% in 6 min · strong pleth · PaO₂ 51</div>
        <p className="syringe__remaining" role="status">
          {support ? 'Oxygen support + ICU and respiratory help active'
            : signal ? 'Credible hypoxemia · support while you troubleshoot'
              : 'Signal and whole-patient trend pending'}
        </p>
        <div className="syringe__presets">
          <Button className="crisis-drug__action" disabled={signal}
            aria-disabled={demonstrating} onClick={act ? () => act('validate-hypoxemia-signal') : undefined}>Corroborate the decline</Button>
          <Button className="crisis-drug__action" disabled={!signal || support}
            aria-disabled={demonstrating} onClick={act ? () => act('support-hypoxemia-and-call-help') : undefined}>Support oxygenation + call help</Button>
        </div>
        <p className="field__hint">A good pleth earns attention, not certainty. Treat urgency and verify the story in parallel.</p>
      </section>
      <section className="syringe" aria-labelledby="hypoxemia-path-title">
        <div id="hypoxemia-path-title" className="syringe__name">Trace oxygen from wall to alveolus.</div>
        <Badge kind="teaching">source · circuit · tube · chest · circulation</Badge>
        <div className="syringe__meta">tube 23 cm · suction path passes · peak 36 · plateau 29</div>
        <p className="syringe__remaining" role="status">
          {escalation ? '15-min response · SpO₂ 92% · PaO₂ 68 · MAP 72'
            : bedsidePattern ? 'Bilateral parenchymal pattern · escalate without overclaiming'
              : deliveryPath ? 'Delivery path reviewed · integrate chest + pressure + flow'
                : support ? 'Outside-in delivery-path review due' : 'Immediate support pending'}
        </p>
        <div className="syringe__presets">
          <Button className="crisis-drug__action" disabled={!support || deliveryPath}
            aria-disabled={demonstrating} onClick={act ? () => act('trace-hypoxemia-delivery-path') : undefined}>Trace source → circuit → tube</Button>
          <Button className="crisis-drug__action" disabled={!deliveryPath || bedsidePattern}
            aria-disabled={demonstrating} onClick={act ? () => act('integrate-hypoxemia-bedside-pattern') : undefined}>Integrate chest + pressure + flow</Button>
          <Button className="crisis-drug__action" disabled={!bedsidePattern || escalation}
            aria-disabled={demonstrating} onClick={act ? () => act('escalate-and-reassess-hypoxemia') : undefined}>Escalate + review 15-min response</Button>
        </div>
        <p className="field__hint">A passed check narrows the field; it never makes tube, pleural, embolic, or equipment danger impossible.</p>
      </section>
      </div>
    </div>
  );
}
