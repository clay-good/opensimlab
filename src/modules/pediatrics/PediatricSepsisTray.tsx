/**
 * PediatricSepsisTray, moved out of `ActionCockpit.tsx` unchanged.
 *
 * The cockpit defined this tray inline and rendered it behind a `hasPediatricSepsisResponse` gate
 * computed from the scenario, so every specialty downloaded it. That gate is now this tray's
 * `supports` predicate in `trays.ts`; the body below is the original.
 */
import type { EquipmentSnapshot } from '@platform/kernel/protocol';
import { pediatricSepsisInlinePrompt } from './tutor/pediatric-sepsis-guidance';
import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import { TutorPanel, WatchingNotice } from '@anesthesia/ui/tutor-panel';
import { Badge, Button } from '@platform/ui';

export function PediatricSepsisTray({ assessment, scenarioVersion, guidance = 'unassisted', demonstrating = false, onAction }: {
  assessment?: NonNullable<EquipmentSnapshot['resuscitation']['pediatricSepsisAssessment']>;
  scenarioVersion: string;
  guidance?: GuidanceLevel;
  demonstrating?: boolean;
  onAction: (action: string) => void;
}) {
  const pattern = assessment?.patternAtTick != null;
  const shockBoundary = assessment?.shockBoundaryAtTick != null;
  const care = assessment?.careAtTick != null;
  const sourceReview = assessment?.sourceReviewAtTick != null;
  const later = assessment?.laterResponseAtTick != null;
  const handoff = assessment?.handoffAtTick != null;
  const prompt = demonstrating ? null
    : pediatricSepsisInlinePrompt(guidance, { scenarioVersion, patient: assessment });
  const act = demonstrating ? undefined : onAction;
  return <div style={{ display: 'grid', gap: 'var(--space-4)' }}>
    <WatchingNotice demonstrating={demonstrating} />
    <TutorPanel prompt={prompt} />
    <div className="tray-grid">
    <section className="syringe" aria-labelledby="pediatric-sepsis-pattern-title">
      <div id="pediatric-sepsis-pattern-title" className="syringe__name">See the whole pattern.</div>
      <Badge kind="teaching">infection · organ dysfunction · circulation</Badge>
      <div className="syringe__meta">6 years · 20 kg · supplied coagulation dysfunction</div>
      <p className="syringe__remaining" role="status">
        {sourceReview ? 'Source and organ surveillance remain active'
          : care ? 'Qualified evaluation and antimicrobial care are active'
            : shockBoundary ? 'No shock now does not mean no urgency'
              : pattern ? 'Now separate sepsis from current shock'
                : 'Fever is context. Organ dysfunction changes the question.'}
      </p>
      <div className="syringe__presets">
        {!pattern && <Button className="crisis-drug__action"
          aria-disabled={demonstrating} onClick={act ? () => act('reconcile-pediatric-sepsis-infection-and-organ-dysfunction') : undefined}>Review infection + organ dysfunction</Button>}
        {pattern && !shockBoundary && <Button className="crisis-drug__action"
          aria-disabled={demonstrating} onClick={act ? () => act('distinguish-pediatric-sepsis-without-shock') : undefined}>Separate sepsis from shock</Button>}
        {shockBoundary && !care && <Button className="crisis-drug__action"
          aria-disabled={demonstrating} onClick={act ? () => act('confirm-pediatric-sepsis-qualified-care-ownership') : undefined}>Confirm qualified care ownership</Button>}
        {care && !sourceReview && <Button className="crisis-drug__action"
          aria-disabled={demonstrating} onClick={act ? () => act('review-pediatric-sepsis-source-organs-and-alternatives') : undefined}>Review source + organ support</Button>}
      </div>
      <p className="field__hint">Experienced teams own specimens, tests, antimicrobial selection and delivery, access, fluids, oxygen, organ support, and source procedures. Phoenix is supplied classification, not an early screening control.</p>
    </section>
    <section className="syringe" aria-labelledby="pediatric-sepsis-response-title">
      <div id="pediatric-sepsis-response-title" className="syringe__name">Keep the next check close.</div>
      <Badge kind="teaching">source · organs · response · ownership</Badge>
      <div className="syringe__meta">fixed minute-120 report · active coagulation risk</div>
      <p className="syringe__remaining" role="status">
        {handoff ? 'Active infection, organ, and shock-surveillance work handed off'
          : later ? 'Stable is not resolved. Preserve active ownership.'
            : sourceReview ? 'Review the fixed report after elapsed care'
              : 'Keep source and organ surveillance in parallel'}
      </p>
      <div className="syringe__presets">
        {sourceReview && !later && <Button className="crisis-drug__action"
          aria-disabled={demonstrating} onClick={act ? () => act('review-pediatric-sepsis-later-response') : undefined}>Review the 120-minute report</Button>}
        {later && !handoff && <Button className="crisis-drug__action"
          aria-disabled={demonstrating} onClick={act ? () => act('handoff-pediatric-sepsis-active-risk') : undefined}>Hand off active sepsis risk</Button>}
      </div>
      <p className="field__hint">No cardiovascular Phoenix points are authored now; continue shock surveillance. Improved physiology does not erase persistent organ dysfunction, prove source control, or establish recovery.</p>
    </section>
    </div>
  </div>;
}
