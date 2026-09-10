/**
 * NeuromuscularRespiratoryFailureTray, moved out of `ActionCockpit.tsx` unchanged.
 *
 * The cockpit defined this tray inline and rendered it behind a `hasNeuromuscularRespiratoryFailureResponse` gate
 * computed from the scenario, so every specialty downloaded it. The gate is now this tray's
 * `supports` predicate in `trays.ts`; the body below is the original.
 */
import type { EquipmentSnapshot } from '@platform/kernel/protocol';
import { neuromuscularRespiratoryFailureInlinePrompt } from './tutor/neuromuscular-respiratory-failure-reassessment-guidance';
import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import { TutorPanel, WatchingNotice } from '@anesthesia/ui/tutor-panel';
import { Badge, Button } from '@platform/ui';

export function NeuromuscularRespiratoryFailureTray({ assessment, scenarioVersion, guidance = 'unassisted', demonstrating = false, onAction }: {
  assessment?: NonNullable<EquipmentSnapshot['resuscitation']['neuromuscularRespiratoryFailureAssessment']>;
  scenarioVersion: string;
  guidance?: GuidanceLevel;
  demonstrating?: boolean;
  onAction: (action: string) => void;
}) {
  const trajectory = assessment?.trajectoryAtTick != null;
  const failure = assessment?.failureAtTick != null;
  const escalation = assessment?.escalationAtTick != null;
  const review = assessment?.reviewAtTick != null;
  const ownership = assessment?.ownershipAtTick != null;
  const handoff = assessment?.handoffAtTick != null;
  const prompt = demonstrating ? null
    : neuromuscularRespiratoryFailureInlinePrompt(guidance, { scenarioVersion, patient: assessment });
  const act = demonstrating ? undefined : onAction;
  return <div style={{ display: 'grid', gap: 'var(--space-4)' }}>
    <WatchingNotice demonstrating={demonstrating} />
    <TutorPanel prompt={prompt} />
    <div className="tray-grid">
    <section className="syringe" aria-labelledby="neuromuscular-respiratory-failure-pattern-title">
      <div id="neuromuscular-respiratory-failure-pattern-title" className="syringe__name">Muscle strength can fade before saturation tells the story.</div>
      <Badge kind="teaching">serial change · shallow breathing · hypercapnia · pulse present</Badge>
      <div className="syringe__meta">function · orthopnea · sleep · FVC · SNIP · cough flow</div>
      <p className="syringe__remaining" role="status">{escalation ? 'Urgent experienced evaluation connected' : failure ? 'Failure pattern held · connect owners while review continues' : trajectory ? 'Whole trajectory reconciled · name the pattern' : 'Begin with the person and the trend'}</p>
      <div className="syringe__presets">
        <Button className="crisis-drug__action" disabled={trajectory} aria-disabled={demonstrating} onClick={act ? () => act('reconcile-neuromuscular-respiratory-failure-trajectory') : undefined}>Review breathing + weakness trajectory</Button>
        <Button className="crisis-drug__action" disabled={!trajectory || failure} aria-disabled={demonstrating} onClick={act ? () => act('recognize-neuromuscular-respiratory-failure') : undefined}>Recognize convergent failure pattern</Button>
        <Button className="crisis-drug__action" disabled={!failure || escalation} aria-disabled={demonstrating} onClick={act ? () => act('activate-neuromuscular-respiratory-failure-escalation') : undefined}>Connect ventilation + airway-ready owners</Button>
      </div>
      <p className="field__hint">Symptoms, supine change, serial muscle and cough measures, carbon dioxide, bulbar function, and test quality travel together. No oxygen saturation or mechanics value is a universal isolated cutoff.</p>
    </section>
    <section className="syringe" aria-labelledby="neuromuscular-respiratory-failure-ownership-title">
      <div id="neuromuscular-respiratory-failure-ownership-title" className="syringe__name">Preparation can be urgent and still remain deeply personal.</div>
      <Badge kind="teaching">cough + bulbar safety · open causes · documented preferences</Badge>
      <div className="syringe__meta">respiratory · neurology · swallowing · nutrition · caregivers</div>
      <p className="syringe__remaining" role="status">{handoff ? 'Active risk + unresolved work handed off' : ownership ? 'Shared ownership connected · advance time before handoff' : escalation && review ? 'Both urgent lanes connected · coordinate the whole team' : failure ? 'Escalation and safety review are open in parallel' : 'Recognize the pattern before planning'}</p>
      <div className="syringe__presets">
        <Button className="crisis-drug__action" disabled={!failure || review} aria-disabled={demonstrating} onClick={act ? () => act('review-neuromuscular-respiratory-failure-bulbar-cough-and-alternatives') : undefined}>Review cough + bulbar + open causes</Button>
        <Button className="crisis-drug__action" disabled={!escalation || !review || ownership} aria-disabled={demonstrating} onClick={act ? () => act('coordinate-neuromuscular-respiratory-failure-goals-and-ownership') : undefined}>Coordinate priorities + shared owners</Button>
        <Button className="crisis-drug__action" disabled={!ownership || handoff} aria-disabled={demonstrating} onClick={act ? () => act('handoff-neuromuscular-respiratory-failure-reassessment') : undefined}>Hand off active risk + open work</Button>
      </div>
      <p className="field__hint">No FVC, SNIP, cough, swallow, or neurologic test; oxygen, NIV, mode, pressure, backup rate, cough-assist setting, suction, intubation, tracheostomy, nutrition, drug, treatment, disposition, prognosis, or outcome is performed or chosen.</p>
    </section>
    </div>
  </div>;
}
