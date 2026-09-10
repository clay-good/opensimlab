/**
 * PediatricBradycardicArrestTray, moved out of `ActionCockpit.tsx` unchanged.
 *
 * The cockpit defined this tray inline and rendered it behind a `hasPediatricBradycardicArrestResponse` gate
 * computed from the scenario, so every specialty downloaded it. That gate is now this tray's
 * `supports` predicate in `trays.ts`; the body below is the original.
 */
import type { EquipmentSnapshot } from '@platform/kernel/protocol';
import { pediatricBradycardicArrestInlinePrompt } from './tutor/pediatric-bradycardic-arrest-guidance';
import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import { TutorPanel, WatchingNotice } from '@anesthesia/ui/tutor-panel';
import { Badge, Button } from '@platform/ui';

export function PediatricBradycardicArrestTray({ assessment, scenarioVersion, guidance = 'unassisted', demonstrating = false, onAction }: {
  assessment?: NonNullable<EquipmentSnapshot['resuscitation']['pediatricBradycardicArrestAssessment']>;
  scenarioVersion: string;
  guidance?: GuidanceLevel;
  demonstrating?: boolean;
  onAction: (action: string) => void;
}) {
  const trajectory = assessment?.trajectoryAtTick != null;
  const recognition = assessment?.recognitionAtTick != null;
  const care = assessment?.resuscitationAtTick != null;
  const safety = assessment?.safetyAtTick != null;
  const later = assessment?.laterResponseAtTick != null;
  const handoff = assessment?.handoffAtTick != null;
  const prompt = demonstrating ? null
    : pediatricBradycardicArrestInlinePrompt(guidance, { scenarioVersion, patient: assessment });
  const act = demonstrating ? undefined : onAction;
  return <div style={{ display: 'grid', gap: 'var(--space-4)' }}>
    <WatchingNotice demonstrating={demonstrating} />
    <TutorPanel prompt={prompt} />
    <div className="tray-grid">
    <section className="syringe" aria-labelledby="pediatric-bradycardic-arrest-pattern-title">
      <div id="pediatric-bradycardic-arrest-pattern-title" className="syringe__name">Read the pulse behind the rate.</div>
      <Badge kind="teaching">breathing · oxygenation · rhythm · pulse · perfusion · responsiveness</Badge>
      <div className="syringe__meta">6 years · 20 kg · organized slow rhythm · pulse initially present</div>
      <p className="syringe__remaining">
        {safety ? 'Pulse, breathing, causes, and deterioration remain under review'
          : care ? 'Qualified pediatric resuscitation is active · complete the safety review'
            : recognition ? 'Persistent compromise · qualified pediatric resuscitation matters now'
              : trajectory ? 'Now connect the slow rhythm to cardiopulmonary compromise'
                : 'Start with breathing, rhythm, pulse, and the whole-child state.'}
      </p>
      <div className="syringe__presets">
        {!trajectory && <Button className="crisis-drug__action"
          aria-disabled={demonstrating} onClick={act ? () => act('reconcile-pediatric-bradycardic-arrest-support-and-trajectory') : undefined}>Review breathing + rhythm + whole child</Button>}
        {trajectory && !recognition && <Button className="crisis-drug__action"
          aria-disabled={demonstrating} onClick={act ? () => act('recognize-pediatric-bradycardia-with-persistent-compromise') : undefined}>Recognize persistent bradycardic compromise</Button>}
        {recognition && !care && <Button className="crisis-drug__action"
          aria-disabled={demonstrating} onClick={act ? () => act('activate-pediatric-bradycardic-arrest-qualified-resuscitation-ownership') : undefined}>Activate qualified pediatric resuscitation</Button>}
        {care && !safety && <Button className="crisis-drug__action"
          aria-disabled={demonstrating} onClick={act ? () => act('review-pediatric-bradycardic-arrest-causes-pulse-and-arrest-boundary') : undefined}>Review pulse + breathing + causes</Button>}
      </div>
      <p className="field__hint">Experienced pediatric, resuscitation, airway-capable, nursing, pharmacy, and cardiology teams own immediate breathing and circulation care, monitoring, access, cause review, and escalation. This surface exposes no learner compression, ventilation, oxygen, product, drug, dose, route, pacing, shock, energy, device, procedure, or treatment control.</p>
    </section>
    <section className="syringe" aria-labelledby="pediatric-bradycardic-arrest-response-title">
      <div id="pediatric-bradycardic-arrest-response-title" className="syringe__name">A rhythm is not circulation.</div>
      <Badge kind="teaching">pulse · breathing · perfusion · arrest · causes · ownership</Badge>
      <div className="syringe__meta">fixed 2-minute report · outcome remains open</div>
      <p className="syringe__remaining" role="status">
        {handoff ? 'Active nonshockable arrest and owners handed off.'
          : later ? 'No pulse is reported. Organized rhythm is not circulation.'
            : safety ? 'Review the fixed pulse-loss report after elapsed qualified care.'
              : 'Recognition, qualified care, and safety review proceed in order.'}
      </p>
      <div className="syringe__presets">
        {safety && !later && <Button className="crisis-drug__action"
          aria-disabled={demonstrating} onClick={act ? () => act('review-pediatric-bradycardic-arrest-pulse-loss-response') : undefined}>Review the 2-minute pulse-loss report</Button>}
        {later && !handoff && <Button className="crisis-drug__action"
          aria-disabled={demonstrating} onClick={act ? () => act('handoff-pediatric-bradycardic-arrest-active-risk') : undefined}>Hand off active arrest risk</Button>}
      </div>
      <p className="field__hint">The fixed pulse-loss transition does not prove cause, treatment modality or effect, resuscitation quality, return of circulation, neurological recovery, prognosis, or outcome.</p>
    </section>
    </div>
  </div>;
}
