/**
 * BronchiolitisTray, moved out of `ActionCockpit.tsx` unchanged.
 *
 * The cockpit defined this tray inline and rendered it behind a `hasBronchiolitisResponse` gate
 * computed from the scenario, so every specialty downloaded it. That gate is now this tray's
 * `supports` predicate in `trays.ts`; the body below is the original.
 */
import type { EquipmentSnapshot } from '@platform/kernel/protocol';
import { bronchiolitisInlinePrompt } from './tutor/bronchiolitis-guidance';
import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import { TutorPanel, WatchingNotice } from '@anesthesia/ui/tutor-panel';
import { Badge, Button } from '@platform/ui';

export function BronchiolitisTray({ assessment, scenarioVersion, guidance = 'unassisted', demonstrating = false, onAction }: {
  assessment?: NonNullable<EquipmentSnapshot['resuscitation']['bronchiolitisAssessment']>;
  scenarioVersion: string;
  guidance?: GuidanceLevel;
  demonstrating?: boolean;
  onAction: (action: string) => void;
}) {
  const recognition = assessment?.recognitionAtTick != null;
  const pattern = assessment?.patternAtTick != null;
  const support = assessment?.supportAtTick != null;
  const feeding = assessment?.feedingHydrationAtTick != null;
  const later = assessment?.laterResponseAtTick != null;
  const handoff = assessment?.handoffAtTick != null;
  const unsupported = assessment?.lastUnsupportedChoice;
  const prompt = demonstrating ? null
    : bronchiolitisInlinePrompt(guidance, { scenarioVersion, patient: assessment });
  const act = demonstrating ? undefined : onAction;
  return <div style={{ display: 'grid', gap: 'var(--space-4)' }}>
    <WatchingNotice demonstrating={demonstrating} />
    <TutorPanel prompt={prompt} />
    <div className="tray-grid">
    <section className="syringe" aria-labelledby="bronchiolitis-pattern-title">
      <div id="bronchiolitis-pattern-title" className="syringe__name">Read the whole infant.</div>
      <Badge kind="teaching">illness day · breathing · feeding · hydration</Badge>
      <div className="syringe__meta">12 months · 10 kg · first wheezing illness</div>
      <p className="syringe__remaining" role="status">
        {support ? 'Experienced support active · keep feeding and hydration visible'
          : unsupported === 'radiograph-first' ? 'A typical clinical pattern does not wait for routine imaging'
            : unsupported === 'single-saturation' ? 'One saturation cannot summarize the infant'
              : unsupported === 'routine-albuterol' ? 'A first wheezing illness is not asthma · keep the supportive pathway'
                : unsupported === 'routine-antibiotic' ? 'No bacterial focus is authored · coinfection stays open, untreated'
                  : pattern ? 'Clinical pattern recorded · activate qualified support'
                    : recognition ? 'Severity trajectory reconciled · keep low-value care out'
                      : 'Start with age, illness day, breathing, intake, urine, and perfusion'}
      </p>
      <div className="syringe__presets">
        {!recognition && <Button className="crisis-drug__action"
          aria-disabled={demonstrating} onClick={act ? () => act('reconcile-bronchiolitis-risk-and-trajectory') : undefined}>Review the whole-infant trajectory</Button>}
        {recognition && !pattern && <>
          <Button className="crisis-drug__action"
            aria-disabled={demonstrating} onClick={act ? () => act('recognize-bronchiolitis-supportive-care-pattern') : undefined}>Record the supplied clinical pattern</Button>
          <Button className="crisis-drug__action"
            aria-disabled={demonstrating} onClick={act ? () => act('wait-for-bronchiolitis-routine-radiograph') : undefined}>Wait for a routine chest X-ray</Button>
          <Button className="crisis-drug__action"
            aria-disabled={demonstrating} onClick={act ? () => act('observe-bronchiolitis-saturation-alone') : undefined}>Watch the saturation alone</Button>
        </>}
        {pattern && !support && <>
          <Button className="crisis-drug__action"
            aria-disabled={demonstrating} onClick={act ? () => act('activate-bronchiolitis-oxygenation-and-monitoring') : undefined}>Activate experienced supportive care</Button>
          <Button className="crisis-drug__action"
            aria-disabled={demonstrating} onClick={act ? () => act('select-routine-bronchiolitis-albuterol') : undefined}>Try routine albuterol</Button>
          <Button className="crisis-drug__action"
            aria-disabled={demonstrating} onClick={act ? () => act('start-routine-bronchiolitis-antibiotic') : undefined}>Start routine antibiotics</Button>
        </>}
      </div>
      <p className="field__hint">Qualified support happens off-screen. No examination, test, oxygen setting, medicine, suction, feeding route, fluid, or treatment is selected here.</p>
    </section>
    <section className="syringe" aria-labelledby="bronchiolitis-reassessment-title">
      <div id="bronchiolitis-reassessment-title" className="syringe__name">Keep every lane in view.</div>
      <Badge kind="teaching">oxygenation · effort · intake · apnea risk</Badge>
      <div className="syringe__meta">partial response · unresolved feeding · active handoff</div>
      <p className="syringe__remaining" role="status">
        {handoff ? 'Trajectory, support, feeding risk, triggers, and owners handed off'
          : later ? 'Partial stabilization · hand off unresolved risk'
            : unsupported === 'discharge-on-saturation' ? 'A better saturation does not prove discharge readiness'
              : feeding ? 'Feeding and hydration risk persist · review the one-hour response'
                : support ? 'Review feeding and hydration after elapsed support'
                  : 'First reconcile the pattern and activate support'}
      </p>
      <div className="syringe__presets">
        {support && !feeding && <Button className="crisis-drug__action"
          aria-disabled={demonstrating} onClick={act ? () => act('review-bronchiolitis-feeding-and-hydration') : undefined}>Review feeding and hydration</Button>}
        {feeding && !later && <>
          <Button className="crisis-drug__action"
            aria-disabled={demonstrating} onClick={act ? () => act('review-bronchiolitis-later-response') : undefined}>Review the one-hour response</Button>
          <Button className="crisis-drug__action"
            aria-disabled={demonstrating} onClick={act ? () => act('discharge-bronchiolitis-on-saturation-alone') : undefined}>Discharge from saturation alone</Button>
        </>}
        {later && !handoff && <Button className="crisis-drug__action"
          aria-disabled={demonstrating} onClick={act ? () => act('handoff-bronchiolitis-active-risk') : undefined}>Hand off active bronchiolitis risk</Button>}
      </div>
      <p className="field__hint">Partial improvement does not prove oral readiness, room-air stability, resolution, discharge readiness, or durable outcome.</p>
    </section>
    </div>
  </div>;
}
