/**
 * CroupTray, moved out of `ActionCockpit.tsx` unchanged.
 *
 * The cockpit defined this tray inline and rendered it behind a `hasCroupResponse` gate
 * computed from the scenario, so every specialty downloaded it. That gate is now this tray's
 * `supports` predicate in `trays.ts`; the body below is the original.
 */
import type { EquipmentSnapshot } from '@platform/kernel/protocol';
import { croupInlinePrompt } from './tutor/croup-guidance';
import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import { TutorPanel, WatchingNotice } from '@anesthesia/ui/tutor-panel';
import { Badge, Button } from '@platform/ui';

export function CroupTray({ assessment, scenarioVersion, guidance = 'unassisted', demonstrating = false, onAction }: {
  assessment?: NonNullable<EquipmentSnapshot['resuscitation']['croupAssessment']>;
  scenarioVersion: string;
  guidance?: GuidanceLevel;
  demonstrating?: boolean;
  onAction: (action: string) => void;
}) {
  const pattern = assessment?.patternAtTick != null;
  const severity = assessment?.severityAtTick != null;
  const treatment = assessment?.treatmentIntentAtTick != null;
  const early = assessment?.earlyResponseAtTick != null;
  const recurrence = assessment?.recurrenceAtTick != null;
  const handoff = assessment?.handoffAtTick != null;
  const unsupported = assessment?.lastUnsupportedChoice;
  const prompt = demonstrating ? null
    : croupInlinePrompt(guidance, { scenarioVersion, patient: assessment });
  const act = demonstrating ? undefined : onAction;
  return <div style={{ display: 'grid', gap: 'var(--space-4)' }}>
    <WatchingNotice demonstrating={demonstrating} />
    <TutorPanel prompt={prompt} />
    <div className="tray-grid">
    <section className="syringe" aria-labelledby="croup-pattern-title">
      <div id="croup-pattern-title" className="syringe__name">Make calm part of care.</div>
      <Badge kind="teaching">caregiver · voice · stridor · work · behavior</Badge>
      <div className="syringe__meta">3 years · 15 kg · SpO₂ 96% on room air</div>
      <p className="syringe__remaining" role="status">
        {treatment ? 'Child calm with caregiver · qualified care underway'
          : unsupported === 'albuterol' ? 'Upper-airway stridor is not lower-airway bronchospasm'
            : unsupported === 'radiograph' ? 'Typical croup support does not wait for routine imaging'
              : severity ? 'Whole-child severity clear · record qualified support'
                : pattern ? 'Pattern reconciled · keep dangerous alternatives open'
                  : 'Start with the whole child, not stridor loudness or one number'}
      </p>
      <div className="syringe__presets">
        {!pattern && <Button className="crisis-drug__action"
          aria-disabled={demonstrating} onClick={act ? () => act('reconcile-croup-whole-child-upper-airway-pattern') : undefined}>Review the upper-airway pattern</Button>}
        {pattern && !severity && <>
          <Button className="crisis-drug__action"
            aria-disabled={demonstrating} onClick={act ? () => act('review-croup-severity-and-alternative-red-flags') : undefined}>Review severity + red flags</Button>
          <Button className="crisis-drug__action"
            aria-disabled={demonstrating} onClick={act ? () => act('select-croup-albuterol-for-stridor') : undefined}>Try albuterol for stridor</Button>
          <Button className="crisis-drug__action"
            aria-disabled={demonstrating} onClick={act ? () => act('wait-for-croup-neck-radiograph') : undefined}>Wait for a neck X-ray</Button>
        </>}
        {severity && !treatment && <Button className="crisis-drug__action"
          aria-disabled={demonstrating} onClick={act ? () => act('record-croup-minimal-distress-support-and-qualified-treatment-intent') : undefined}>Keep calm + activate qualified care</Button>}
      </div>
      <p className="field__hint">Keep her with her caregiver in a position of comfort. Qualified staff own medicine and airway care off-screen; no examination, dose, route, device, setting, or procedure is selected here.</p>
    </section>
    <section className="syringe" aria-labelledby="croup-response-title">
      <div id="croup-response-title" className="syringe__name">Improvement needs time.</div>
      <Badge kind="teaching">early response · recurrence · airway readiness</Badge>
      <div className="syringe__meta">fixed 20-minute response · fixed later observation</div>
      <p className="syringe__remaining" role="status">
        {handoff ? 'Recurrence, timing, triggers, and owners handed off'
          : recurrence ? 'Stridor at rest recurred · hand off active risk'
            : unsupported === 'discharge-early' ? 'Early improvement does not prove discharge readiness'
              : unsupported === 'normal-saturation' ? 'Normal saturation does not settle airway severity'
                : early ? 'Early improvement is temporary · review the later observation'
                  : treatment ? 'Review the whole child after elapsed qualified care'
                    : 'First keep the child calm and activate qualified care'}
      </p>
      <div className="syringe__presets">
        {treatment && !early && <Button className="crisis-drug__action"
          aria-disabled={demonstrating} onClick={act ? () => act('review-croup-early-response') : undefined}>Review the early response</Button>}
        {early && !recurrence && <>
          <Button className="crisis-drug__action"
            aria-disabled={demonstrating} onClick={act ? () => act('review-croup-recurrence-and-preserve-airway-readiness') : undefined}>Review the later observation</Button>
          <Button className="crisis-drug__action"
            aria-disabled={demonstrating} onClick={act ? () => act('discharge-croup-after-early-response') : undefined}>Discharge after early improvement</Button>
          <Button className="crisis-drug__action"
            aria-disabled={demonstrating} onClick={act ? () => act('treat-croup-normal-saturation-as-low-risk') : undefined}>Treat SpO₂ 97% as low risk</Button>
        </>}
        {recurrence && !handoff && <Button className="crisis-drug__action"
          aria-disabled={demonstrating} onClick={act ? () => act('handoff-croup-active-upper-airway-risk') : undefined}>Hand off active upper-airway risk</Button>}
      </div>
      <p className="field__hint">Review voice, stridor at calm rest, work, behavior, color, and breathing together. Recurrence renews experienced ownership; it does not select a repeat treatment, airway procedure, or disposition.</p>
    </section>
    </div>
  </div>;
}
