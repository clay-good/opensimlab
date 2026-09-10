/**
 * NeurologyMinorStrokeTray, moved out of `ActionCockpit.tsx` unchanged.
 *
 * The cockpit defined this tray inline and rendered it behind a `hasNeurologyMinorStrokeResponse` gate
 * computed from the scenario, so every specialty downloaded it. That gate is now this tray's
 * `supports` predicate in `trays.ts`; the body below is the original.
 */
import type { EquipmentSnapshot } from '@platform/kernel/protocol';
import { minorStrokeInlinePrompt } from './tutor/minor-nondisabling-acute-ischemic-stroke-guidance';
import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import { TutorPanel } from '@anesthesia/ui/tutor-panel';
import { Badge, Button } from '@platform/ui';

export function NeurologyMinorStrokeTray({ assessment, scenarioVersion, onAction, guidance = 'unassisted', demonstrating = false }: {
  assessment?: NonNullable<EquipmentSnapshot['resuscitation']['neurologyMinorStrokeAssessment']>;
  scenarioVersion: string;
  onAction: (action: string) => void;
  guidance?: GuidanceLevel;
  demonstrating?: boolean;
}) {
  const prompt = minorStrokeInlinePrompt(guidance, { scenarioVersion, minorStroke: assessment });
  const act = demonstrating ? undefined : onAction;
  const reconciled = assessment?.trajectoryAtTick != null;
  const imaging = assessment?.threatsAtTick != null;
  const disability = assessment?.boundaryAtTick != null;
  const strategy = assessment?.intentAtTick != null;
  const later = assessment?.laterAtTick != null;
  const handoff = assessment?.handoffAtTick != null;
  return <div className="tray-grid">
    {demonstrating && <p className="syringe__remaining">Watching the worked example. Choose “Take the controls” to make your own decisions.</p>}
    <TutorPanel prompt={demonstrating ? null : prompt} />
    <section className="syringe" aria-labelledby="neurology-minor-stroke-function-title">
      <div id="neurology-minor-stroke-function-title" className="syringe__name">Function, not one score.</div>
      <Badge kind="teaching">clock · focal change · patient priorities · imaging · threats · function</Badge>
      <div className="syringe__meta">62 years · awake · supplied NIHSS 1 · independent function preserved</div>
      <p className="syringe__remaining">
        {strategy ? 'Qualified strategy and neurological surveillance are owned'
          : disability ? 'The deficit is individually nondisabling to date · record qualified ownership'
            : imaging ? 'Fixed imaging and immediate threats reviewed · connect the deficit to this patient’s function'
              : reconciled ? 'The clock and functional story are clear · review the supplied safety context'
                : 'Begin with what changed, when it changed, and what it changes for her.'}
      </p>
      <div className="syringe__presets">
        {!reconciled && <Button className="crisis-drug__action"
          aria-disabled={demonstrating} onClick={act ? () => act('reconcile-neurology-minor-stroke-clock-deficit-function-and-whole-patient') : undefined}>Review clock + deficit + function</Button>}
        {reconciled && !imaging && <Button className="crisis-drug__action"
          aria-disabled={demonstrating} onClick={act ? () => act('review-neurology-minor-stroke-imaging-mimics-and-immediate-threats') : undefined}>Review imaging + immediate threats</Button>}
        {imaging && !disability && <Button className="crisis-drug__action"
          aria-disabled={demonstrating} onClick={act ? () => act('recognize-neurology-minor-nondisabling-stroke-boundary-without-score-alone') : undefined}>Recognize the functional boundary</Button>}
        {disability && !strategy && <Button className="crisis-drug__action"
          aria-disabled={demonstrating} onClick={act ? () => act('record-neurology-minor-stroke-qualified-antiplatelet-and-surveillance-intent') : undefined}>Record qualified strategy + surveillance</Button>}
      </div>
      <p className="field__hint">The supplied score supports description, not the decision by itself. Qualified stroke clinicians own examination, diagnosis, eligibility, prescribing, treatment, and disposition; this surface exposes none of those controls.</p>
    </section>
    <section className="syringe" aria-labelledby="neurology-minor-stroke-trajectory-title">
      <div id="neurology-minor-stroke-trajectory-title" className="syringe__name">Trajectory keeps the plan honest.</div>
      <Badge kind="teaching">serial deficit · new danger · physiology · etiology · recurrence · ownership</Badge>
      <div className="syringe__meta">fixed later report · sensory change persists · cause remains open</div>
      <p className="syringe__remaining" role="status">
        {handoff ? 'Persistent deficit, open cause, recurrence risk, and owners handed off.'
          : later ? 'No new deficit is reported. Stability does not close cause or recurrence risk.'
            : strategy ? 'Qualified strategy is recorded. Review the fixed later neurologic report.'
              : 'Complete the functional review and qualified ownership before reassessment.'}
      </p>
      <div className="syringe__presets">
        {strategy && !later && <Button className="crisis-drug__action"
          aria-disabled={demonstrating} onClick={act ? () => act('review-neurology-minor-stroke-later-neurologic-trajectory') : undefined}>Review the later neurologic report</Button>}
        {later && !handoff && <Button className="crisis-drug__action"
          aria-disabled={demonstrating} onClick={act ? () => act('handoff-neurology-minor-stroke-etiology-recurrence-and-secondary-prevention-risk') : undefined}>Hand off cause + recurrence risk</Button>}
      </div>
      <p className="field__hint">Short-window stability does not establish treatment effect, infarct resolution, complete recovery, durable control, low recurrence risk, disposition, prognosis, or outcome.</p>
    </section>
  </div>;
}
