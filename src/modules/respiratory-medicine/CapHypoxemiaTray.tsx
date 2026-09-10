/**
 * CapHypoxemiaTray, moved out of `ActionCockpit.tsx` unchanged.
 *
 * The cockpit defined this tray inline and rendered it behind a `hasCapHypoxemiaResponse` gate
 * computed from the scenario, so every specialty downloaded it. The gate is now this tray's
 * `supports` predicate in `trays.ts`; the body below is the original.
 */
import type { EquipmentSnapshot } from '@platform/kernel/protocol';
import { capHypoxemiaInlinePrompt } from './tutor/community-acquired-pneumonia-hypoxemia-reassessment-guidance';
import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import { TutorPanel } from '@anesthesia/ui/tutor-panel';
import { Badge, Button } from '@platform/ui';

export function CapHypoxemiaTray({ assessment, scenarioVersion, onAction, guidance = 'unassisted', demonstrating = false }: {
  assessment?: NonNullable<EquipmentSnapshot['resuscitation']['capHypoxemiaAssessment']>;
  scenarioVersion: string;
  onAction: (action: string) => void;
  guidance?: GuidanceLevel;
  demonstrating?: boolean;
}) {
  const prompt = capHypoxemiaInlinePrompt(guidance, { scenarioVersion, capHypoxemia: assessment });
  const act = demonstrating ? undefined : onAction;
  const support = assessment?.supportAtTick != null;
  const evidence = assessment?.evidenceAtTick != null;
  const severity = assessment?.severityAtTick != null;
  const treatment = assessment?.treatmentIntentAtTick != null;
  const handoff = assessment?.handoffAtTick != null;
  return <div className="tray-grid">
    {demonstrating && <p className="syringe__remaining">Watching the worked example. Choose “Take the controls” to make your own decisions.</p>}
    <TutorPanel prompt={demonstrating ? null : prompt} />
    <section className="syringe" aria-labelledby="cap-hypoxemia-first-title">
      <div id="cap-hypoxemia-first-title" className="syringe__name">Low oxygen, clear next steps.</div>
      <Badge kind="teaching">SpO₂ 85% room air · RR 32 · focal opacity</Badge>
      <div className="syringe__meta">signal · work · mentation · perfusion · pattern</div>
      <p className="syringe__remaining" role="status">{severity ? 'Whole-patient severity reviewed · higher-acuity help active' : evidence ? 'Pattern supported · review severity + escalation' : support ? 'Support intent recorded · reconcile the pattern' : 'Oxygenation + whole-patient review pending'}</p>
      <div className="syringe__presets">
        <Button className="crisis-drug__action" disabled={support} aria-disabled={demonstrating} onClick={act ? () => act('corroborate-and-support-cap-hypoxemia') : undefined}>Corroborate hypoxemia + whole patient</Button>
        <Button className="crisis-drug__action" disabled={!support || evidence} aria-disabled={demonstrating} onClick={act ? () => act('reconcile-cap-evidence-and-dangerous-alternatives') : undefined}>Review pneumonia pattern + alternatives</Button>
        <Button className="crisis-drug__action" disabled={!evidence || severity} aria-disabled={demonstrating} onClick={act ? () => act('classify-cap-severity-and-escalation-needs') : undefined}>Review severity + activate help</Button>
      </div>
      <p className="field__hint">The pulse, room-air gas, imaging, and laboratory reports are authored. Three minor features support urgent judgment; they do not automatically choose a location of care.</p>
    </section>
    <section className="syringe" aria-labelledby="cap-hypoxemia-ownership-title">
      <div id="cap-hypoxemia-ownership-title" className="syringe__name">Plan the treatment. Watch the trajectory.</div>
      <Badge kind="teaching">empiric plan · indicated tests · complications · response</Badge>
      <div className="syringe__meta">named owners · active oxygen need · open cause</div>
      <p className="syringe__remaining" role="status">{handoff ? 'Active pneumonia care handed off' : treatment ? 'Ownership recorded · advance time before handoff' : severity ? 'Support intent recorded · assign treatment + testing ownership' : 'Pattern review + support intent come first'}</p>
      <div className="syringe__presets">
        <Button className="crisis-drug__action" disabled={!severity || treatment} aria-disabled={demonstrating} onClick={act ? () => act('record-cap-testing-and-empiric-treatment-intent') : undefined}>Record treatment + indicated tests</Button>
        <Button className="crisis-drug__action" disabled={!treatment || handoff} aria-disabled={demonstrating} onClick={act ? () => act('handoff-cap-hypoxemia-reassessment') : undefined}>Reassess + hand off active care</Button>
      </div>
      <p className="field__hint">No antibiotic, dose, oxygen device, flow, support setting, procedure, treatment response, disposition, pathogen, prognosis, or outcome is chosen here.</p>
    </section>
  </div>;
}
