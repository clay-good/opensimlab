/**
 * LargePleuralEffusionTray, moved out of `ActionCockpit.tsx` unchanged.
 *
 * The cockpit defined this tray inline and rendered it behind a `hasLargePleuralEffusionResponse` gate
 * computed from the scenario, so every specialty downloaded it. The gate is now this tray's
 * `supports` predicate in `trays.ts`; the body below is the original.
 */
import type { EquipmentSnapshot } from '@platform/kernel/protocol';
import { largePleuralEffusionInlinePrompt } from './tutor/large-unilateral-pleural-effusion-reassessment-guidance';
import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import { TutorPanel } from '@anesthesia/ui/tutor-panel';
import { Badge, Button } from '@platform/ui';

export function LargePleuralEffusionTray({ assessment, scenarioVersion, onAction, guidance = 'unassisted', demonstrating = false }: {
  assessment?: NonNullable<EquipmentSnapshot['resuscitation']['largePleuralEffusionAssessment']>;
  onAction: (action: string) => void;
  scenarioVersion: string;
  guidance?: GuidanceLevel;
  demonstrating?: boolean;
}) {
  const prompt = largePleuralEffusionInlinePrompt(guidance, { scenarioVersion, largePleuralEffusion: assessment });
  const act = demonstrating ? undefined : onAction;
  const trajectory = assessment?.trajectoryAtTick != null;
  const intent = assessment?.intentAtTick != null;
  const response = assessment?.responseAtTick != null;
  const fluid = assessment?.fluidAtTick != null;
  const evaluation = assessment?.evaluationAtTick != null;
  const handoff = assessment?.handoffAtTick != null;
  return <div className="tray-grid">
    {demonstrating && <p className="syringe__remaining">Watching the worked example. Choose “Take the controls” to make your own decisions.</p>}
    <TutorPanel prompt={demonstrating ? null : prompt} />
    <section className="syringe" aria-labelledby="large-effusion-pattern-title">
      <div id="large-effusion-pattern-title" className="syringe__name">The fluid is real. The cause is still open.</div>
      <Badge kind="teaching">large unilateral effusion · stable circulation</Badge>
      <div className="syringe__meta">trajectory · oxygenation · imaging · symptom-led safety</div>
      <p className="syringe__remaining" role="status">{response ? 'Drainage stopped at symptoms · improvement reviewed' : intent ? 'Experienced-team intent active · advance to the authored checkpoint' : trajectory ? 'Pattern reconciled · plan useful, safe sampling + relief' : 'Begin with the patient, not the fluid volume'}</p>
      <div className="syringe__presets">
        <Button className="crisis-drug__action" disabled={trajectory} aria-disabled={demonstrating} onClick={act ? () => act('reconcile-large-unilateral-pleural-effusion-trajectory') : undefined}>Review patient + pleural pattern</Button>
        <Button className="crisis-drug__action" disabled={!trajectory || intent} aria-disabled={demonstrating} onClick={act ? () => act('record-large-unilateral-pleural-effusion-pleural-team-and-drainage-intent') : undefined}>Record guided sampling + relief intent</Button>
        <Button className="crisis-drug__action" disabled={!intent || response} aria-disabled={demonstrating} onClick={act ? () => act('review-large-unilateral-pleural-effusion-drainage-response') : undefined}>Review symptom-limited checkpoint</Button>
      </div>
      <p className="field__hint">Ultrasound guidance, slow drainage, and experienced ownership are authored safety boundaries. Cough and chest tightness prompt stopping; 850 mL is a case fact, not a target or maximum.</p>
    </section>
    <section className="syringe" aria-labelledby="large-effusion-cause-title">
      <div id="large-effusion-cause-title" className="syringe__name">Relief is not the finish line.</div>
      <Badge kind="teaching">paired fluid report · pending results · named owners</Badge>
      <div className="syringe__meta">cause open · residual effusion · recurrence questions</div>
      <p className="syringe__remaining" role="status">{handoff ? 'Response + unresolved cause work handed off' : evaluation ? 'Definitive evaluation connected · advance time before handoff' : fluid ? 'Pattern reviewed · connect every pending result' : response ? 'Relief reviewed · keep the cause open' : 'Review the authored checkpoint first'}</p>
      <div className="syringe__presets">
        <Button className="crisis-drug__action" disabled={!response || fluid} aria-disabled={demonstrating} onClick={act ? () => act('review-large-unilateral-pleural-effusion-fluid-pattern-and-causes') : undefined}>Review fluid pattern + open causes</Button>
        <Button className="crisis-drug__action" disabled={!fluid || evaluation} aria-disabled={demonstrating} onClick={act ? () => act('coordinate-large-unilateral-pleural-effusion-definitive-evaluation') : undefined}>Coordinate definitive evaluation</Button>
        <Button className="crisis-drug__action" disabled={!evaluation || handoff} aria-disabled={demonstrating} onClick={act ? () => act('handoff-large-unilateral-pleural-effusion-reassessment') : undefined}>Hand off unresolved effusion work</Button>
      </div>
      <p className="field__hint">No examination, calculation, diagnosis, needle, site, device, volume, suction, drain, biopsy, catheter, pleurodesis, surgery, treatment, disposition, recurrence, or outcome is chosen.</p>
    </section>
  </div>;
}
