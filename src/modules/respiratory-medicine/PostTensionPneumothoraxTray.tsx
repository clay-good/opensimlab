/**
 * PostTensionPneumothoraxTray, moved out of `ActionCockpit.tsx` unchanged.
 *
 * The cockpit defined this tray inline and rendered it behind a `hasPostTensionPneumothoraxResponse` gate
 * computed from the scenario, so every specialty downloaded it. The gate is now this tray's
 * `supports` predicate in `trays.ts`; the body below is the original.
 */
import type { EquipmentSnapshot } from '@platform/kernel/protocol';
import { postTensionPneumothoraxInlinePrompt } from './tutor/spontaneous-tension-pneumothorax-post-drainage-reassessment-guidance';
import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import { TutorPanel } from '@anesthesia/ui/tutor-panel';
import { Badge, Button } from '@platform/ui';

export function PostTensionPneumothoraxTray({ assessment, scenarioVersion, onAction, guidance = 'unassisted', demonstrating = false }: {
  assessment?: NonNullable<EquipmentSnapshot['resuscitation']['postTensionPneumothoraxAssessment']>;
  scenarioVersion: string;
  onAction: (action: string) => void;
  guidance?: GuidanceLevel;
  demonstrating?: boolean;
}) {
  const prompt = postTensionPneumothoraxInlinePrompt(guidance, { scenarioVersion, postTensionPneumothorax: assessment });
  const act = demonstrating ? undefined : onAction;
  const trajectory = assessment?.trajectoryAtTick != null;
  const response = assessment?.drainageResponseAtTick != null;
  const system = assessment?.systemAtTick != null;
  const etiology = assessment?.etiologyAtTick != null;
  const handoff = assessment?.handoffAtTick != null;
  return <div className="tray-grid">
    {demonstrating && <p className="syringe__remaining">Watching the worked example. Choose “Take the controls” to make your own decisions.</p>}
    <TutorPanel prompt={demonstrating ? null : prompt} />
    <section className="syringe" aria-labelledby="post-tension-trajectory-title">
      <div id="post-tension-trajectory-title" className="syringe__name">Relief is the start of the next watch.</div>
      <Badge kind="teaching">6 hours after experienced-team drainage</Badge>
      <div className="syringe__meta">prior tension · current safety · response without certainty</div>
      <p className="syringe__remaining" role="status">{response ? 'Improvement reviewed · durable recovery remains open' : trajectory ? 'Prior rescue reconciled · review the patient now' : 'Start with the event, rescue + trajectory'}</p>
      <div className="syringe__presets">
        <Button className="crisis-drug__action" disabled={trajectory} aria-disabled={demonstrating} onClick={act ? () => act('reconcile-spontaneous-tension-pneumothorax-trajectory-and-prior-care') : undefined}>Reconcile tension event + prior care</Button>
        <Button className="crisis-drug__action" disabled={!trajectory || response} aria-disabled={demonstrating} onClick={act ? () => act('review-spontaneous-tension-pneumothorax-drainage-response') : undefined}>Review post-drainage response</Button>
      </div>
      <p className="field__hint">The presentation, examination, drainage, radiograph, and current findings are authored. Improvement does not prove full re-expansion, durable drain function, or resolution.</p>
    </section>
    <section className="syringe" aria-labelledby="post-tension-ownership-title">
      <div id="post-tension-ownership-title" className="syringe__name">Keep the pleural story gently held.</div>
      <Badge kind="teaching">drain watch · air leak · preferences · named owners</Badge>
      <div className="syringe__meta">parallel review · change triggers · definitive planning</div>
      <p className="syringe__remaining" role="status">{handoff ? 'Unresolved pleural work handed off' : system && etiology ? 'Both lanes complete · advance time before handoff' : response ? 'Open both the system + planning lanes' : 'Review the current response first'}</p>
      <div className="syringe__presets">
        <Button className="crisis-drug__action" disabled={!response || system} aria-disabled={demonstrating} onClick={act ? () => act('review-spontaneous-tension-pneumothorax-drain-system-and-complications') : undefined}>Review drain system + complications</Button>
        <Button className="crisis-drug__action" disabled={!response || etiology} aria-disabled={demonstrating} onClick={act ? () => act('review-spontaneous-tension-pneumothorax-etiology-recurrence-and-definitive-planning') : undefined}>Review causes + definitive planning</Button>
        <Button className="crisis-drug__action" disabled={!system || !etiology || handoff} aria-disabled={demonstrating} onClick={act ? () => act('handoff-spontaneous-tension-pneumothorax-post-drainage-reassessment') : undefined}>Hand off unresolved pleural work</Button>
      </div>
      <p className="field__hint">No drain inspection or manipulation, suction, clamp, flush, device, site, oxygen target, drug, procedure, pleurodesis, surgery, disposition, prognosis, recurrence, resolution, or outcome is chosen.</p>
    </section>
  </div>;
}
