/**
 * PediatricRespiratoryDistressTray, moved out of `ActionCockpit.tsx` unchanged.
 *
 * The cockpit defined this tray inline and rendered it behind a `hasPediatricRespiratoryDistressResponse` gate
 * computed from the scenario, so every specialty downloaded it. That gate is now this tray's
 * `supports` predicate in `trays.ts`; the body below is the original.
 */
import type { EquipmentSnapshot } from '@platform/kernel/protocol';
import { pediatricRespiratoryDistressInlinePrompt } from './tutor/pediatric-respiratory-distress-guidance';
import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import { TutorPanel, WatchingNotice } from '@anesthesia/ui/tutor-panel';
import { Badge, Button } from '@platform/ui';

export function PediatricRespiratoryDistressTray({ assessment, scenarioVersion, guidance = 'unassisted', demonstrating = false, onAction }: {
  assessment?: NonNullable<EquipmentSnapshot['resuscitation']['pediatricRespiratoryDistressAssessment']>;
  scenarioVersion: string;
  guidance?: GuidanceLevel;
  demonstrating?: boolean;
  onAction: (action: string) => void;
}) {
  const recognition = assessment?.recognitionAtTick != null;
  const support = assessment?.supportAtTick != null;
  const early = assessment?.earlyResponseAtTick != null;
  const later = assessment?.laterPanelAtTick != null;
  const rescue = assessment?.rescueAtTick != null;
  const handoff = assessment?.handoffAtTick != null;
  const unsupported = assessment?.lastUnsupportedChoice;
  const prompt = demonstrating ? null
    : pediatricRespiratoryDistressInlinePrompt(guidance, { scenarioVersion, patient: assessment });
  const act = demonstrating ? undefined : onAction;
  return <div style={{ display: 'grid', gap: 'var(--space-4)' }}>
    <WatchingNotice demonstrating={demonstrating} />
    <TutorPanel prompt={prompt} />
    <div className="tray-grid">
    <section className="syringe" aria-labelledby="pediatric-distress-whole-child-title">
      <div id="pediatric-distress-whole-child-title" className="syringe__name">Read the whole child.</div>
      <Badge kind="teaching">appearance · breathing · circulation · trend</Badge>
      <div className="syringe__meta">6 years · 20 kg · pulse + spontaneous breathing</div>
      <p className="syringe__remaining" role="status">
        {early ? 'SpO₂ improved · grunting, recession, and short phrases remain'
          : unsupported === 'history-first' ? 'Continue history in parallel · support cannot wait'
            : unsupported === 'imaging-first' ? 'Cause review matters · support cannot wait for imaging'
              : support ? 'Experienced support active · advance time for whole-child reassessment'
                : recognition ? 'Respiratory distress recognized · support while causes stay open'
                  : 'Start with appearance, work, speech, circulation, and a coherent signal'}
      </p>
      <div className="syringe__presets">
        {!recognition && <Button className="crisis-drug__action"
          aria-disabled={demonstrating} onClick={act ? () => act('reconcile-pediatric-respiratory-distress-whole-child') : undefined}>Review the whole-child trend</Button>}
        {recognition && !support && <>
          <Button className="crisis-drug__action"
            aria-disabled={demonstrating} onClick={act ? () => act('activate-pediatric-respiratory-distress-support') : undefined}>Activate experienced pediatric help</Button>
          <Button className="crisis-drug__action"
            aria-disabled={demonstrating} onClick={act ? () => act('complete-pediatric-respiratory-distress-history-first') : undefined}>Complete the history first</Button>
          <Button className="crisis-drug__action"
            aria-disabled={demonstrating} onClick={act ? () => act('wait-for-pediatric-respiratory-distress-imaging') : undefined}>Wait for imaging first</Button>
        </>}
        {support && !early && <Button className="crisis-drug__action"
          aria-disabled={demonstrating} onClick={act ? () => act('review-pediatric-respiratory-distress-early-response') : undefined}>Review the 5-minute response</Button>}
      </div>
      <p className="field__hint">Qualified support happens off-screen. No device, flow, oxygen target, drug, dose, fluid, diagnosis, or procedure is selected here.</p>
    </section>
    <section className="syringe" aria-labelledby="pediatric-distress-change-title">
      <div id="pediatric-distress-change-title" className="syringe__name">Notice what the number misses.</div>
      <Badge kind="teaching">mentation · effort · air movement · oxygenation</Badge>
      <div className="syringe__meta">early improvement · later fatigue · active rescue</div>
      <p className="syringe__remaining" role="status">
        {handoff ? 'Trajectory, active support, open causes, triggers, and owners handed off'
          : rescue ? 'Airway-capable pediatric rescue active · hand off the unresolved risk'
            : unsupported === 'falling-rate' ? 'A lower rate is not recovery when the child worsens'
              : later ? 'Drowsier + shallow irregular breathing · rescue now'
                : unsupported === 'single-number' ? 'A better saturation does not overrule the child'
                  : early ? 'Review the later whole-child panel'
                    : 'First support, then reassess the whole child'}
      </p>
      <div className="syringe__presets">
        {early && !later && <>
          <Button className="crisis-drug__action"
            aria-disabled={demonstrating} onClick={act ? () => act('review-pediatric-respiratory-distress-later-panel') : undefined}>Review the later whole-child panel</Button>
          <Button className="crisis-drug__action"
            aria-disabled={demonstrating} onClick={act ? () => act('reassure-pediatric-respiratory-distress-saturation-alone') : undefined}>Reassure from SpO₂ 94%</Button>
        </>}
        {later && !rescue && <>
          <Button className="crisis-drug__action"
            aria-disabled={demonstrating} onClick={act ? () => act('activate-pediatric-respiratory-failure-rescue') : undefined}>Activate airway-capable pediatric rescue</Button>
          <Button className="crisis-drug__action"
            aria-disabled={demonstrating} onClick={act ? () => act('treat-pediatric-respiratory-distress-falling-rate-as-recovery') : undefined}>Treat RR 28 as recovery</Button>
        </>}
        {rescue && !handoff && <Button className="crisis-drug__action"
          aria-disabled={demonstrating} onClick={act ? () => act('handoff-pediatric-respiratory-distress-reassessment') : undefined}>Hand off active breathing risk</Button>}
      </div>
      <p className="field__hint">The falling rate and quieter effort come with worsening mentation and air movement. This authored panel triggers rescue ownership; it does not diagnose a cause or predict outcome.</p>
    </section>
    </div>
  </div>;
}
