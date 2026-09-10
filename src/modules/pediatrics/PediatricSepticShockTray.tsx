/**
 * PediatricSepticShockTray, moved out of `ActionCockpit.tsx` unchanged.
 *
 * The cockpit defined this tray inline and rendered it behind a `hasPediatricSepticShockResponse` gate
 * computed from the scenario, so every specialty downloaded it. That gate is now this tray's
 * `supports` predicate in `trays.ts`; the body below is the original.
 */
import type { EquipmentSnapshot } from '@platform/kernel/protocol';
import { pediatricSepticShockInlinePrompt } from './tutor/pediatric-septic-shock-guidance';
import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import { TutorPanel, WatchingNotice } from '@anesthesia/ui/tutor-panel';
import { Badge, Button } from '@platform/ui';

export function PediatricSepticShockTray({ assessment, scenarioVersion, guidance = 'unassisted', demonstrating = false, onAction }: {
  assessment?: NonNullable<EquipmentSnapshot['resuscitation']['pediatricSepticShockAssessment']>;
  scenarioVersion: string;
  guidance?: GuidanceLevel;
  demonstrating?: boolean;
  onAction: (action: string) => void;
}) {
  const trajectory = assessment?.trajectoryAtTick != null;
  const recognition = assessment?.recognitionAtTick != null;
  const rescue = assessment?.rescueAtTick != null;
  const source = assessment?.sourceAtTick != null;
  const later = assessment?.laterResponseAtTick != null;
  const handoff = assessment?.handoffAtTick != null;
  const prompt = demonstrating ? null
    : pediatricSepticShockInlinePrompt(guidance, { scenarioVersion, patient: assessment });
  const act = demonstrating ? undefined : onAction;
  return <div style={{ display: 'grid', gap: 'var(--space-4)' }}>
    <WatchingNotice demonstrating={demonstrating} />
    <TutorPanel prompt={prompt} />
    <div className="tray-grid">
    <section className="syringe" aria-labelledby="pediatric-septic-shock-pattern-title">
      <div id="pediatric-septic-shock-pattern-title" className="syringe__name">More fluid is not automatic.</div>
      <Badge kind="teaching">mentation · pulses · refill · urine · lactate</Badge>
      <div className="syringe__meta">4 years · 16 kg · persistent shock after reassessed aliquots</div>
      <p className="syringe__remaining" role="status">
        {source && rescue ? 'Shock rescue and source work are active together'
          : source ? 'Source work is active · qualified shock rescue still matters'
            : rescue ? 'Qualified rescue is active · keep source work moving'
            : recognition ? 'Persistent shock · congestion changes the next step'
              : trajectory ? 'Now recognize the post-fluid shock pattern'
                : 'Start with the whole trajectory, not pressure alone.'}
      </p>
      <div className="syringe__presets">
        {!trajectory && <Button className="crisis-drug__action"
          aria-disabled={demonstrating} onClick={act ? () => act('reconcile-pediatric-septic-shock-care-and-trajectory') : undefined}>Review care + perfusion trajectory</Button>}
        {trajectory && !recognition && <Button className="crisis-drug__action"
          aria-disabled={demonstrating} onClick={act ? () => act('recognize-pediatric-septic-shock-after-fluid-reassessment') : undefined}>Recognize persistent septic shock</Button>}
        {recognition && !rescue && <Button className="crisis-drug__action"
          aria-disabled={demonstrating} onClick={act ? () => act('activate-pediatric-septic-shock-critical-care-and-vasoactive-ownership') : undefined}>Activate qualified shock rescue</Button>}
        {recognition && !source && <Button className="crisis-drug__action"
          aria-disabled={demonstrating} onClick={act ? () => act('escalate-pediatric-septic-shock-source-control') : undefined}>Escalate source-control review</Button>}
      </div>
      <p className="field__hint">Experienced teams own antimicrobials, tests, fluid decisions, access, vasoactives, monitoring, and source procedures. No universal fluid total, MAP target, agent, access route, or response is taught.</p>
    </section>
    <section className="syringe" aria-labelledby="pediatric-septic-shock-response-title">
      <div id="pediatric-septic-shock-response-title" className="syringe__name">Partial movement is not resolution.</div>
      <Badge kind="teaching">perfusion · congestion · source · ownership</Badge>
      <div className="syringe__meta">fixed minute-90 report · active cardiovascular dysfunction</div>
      <p className="syringe__remaining" role="status">
        {handoff ? 'Active shock, congestion, source, and support handed off'
          : later ? 'Some signals improved. Shock remains active.'
            : source && rescue ? 'Review the fixed report after elapsed parallel care'
              : source ? 'Source work is active · activate qualified shock rescue'
                : rescue ? 'Shock rescue is active · escalate source review'
              : 'Rescue and source control cannot wait for each other.'}
      </p>
      <div className="syringe__presets">
        {source && rescue && !later && <Button className="crisis-drug__action"
          aria-disabled={demonstrating} onClick={act ? () => act('review-pediatric-septic-shock-later-response') : undefined}>Review the 90-minute report</Button>}
        {later && !handoff && <Button className="crisis-drug__action"
          aria-disabled={demonstrating} onClick={act ? () => act('handoff-pediatric-septic-shock-active-risk') : undefined}>Hand off active shock risk</Button>}
      </div>
      <p className="field__hint">One unnamed vasoactive and source planning remain qualified-team work. Better pressure or refill does not prove treatment effect, source control, durable recovery, or readiness to leave care.</p>
    </section>
    </div>
  </div>;
}
