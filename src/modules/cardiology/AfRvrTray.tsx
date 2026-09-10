/**
 * AfRvrTray, moved out of `ActionCockpit.tsx` unchanged.
 *
 * The cockpit defined this tray inline and rendered it behind a `hasAfRvrResponse` gate
 * computed from the scenario, so every specialty downloaded it. That gate is now this tray's
 * `supports` predicate in `trays.ts`; the body below is the original.
 */
import type { EquipmentSnapshot } from '@platform/kernel/protocol';
import { afRvrInlinePrompt } from './tutor/af-rvr-guidance';
import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import { TutorPanel, WatchingNotice } from '@anesthesia/ui/tutor-panel';
import { Badge, Button } from '@platform/ui';

export function AfRvrTray({ assessment, scenarioVersion, guidance = 'unassisted', demonstrating = false, onAction }: {
  assessment?: NonNullable<EquipmentSnapshot['resuscitation']['afRvrAssessment']>;
  scenarioVersion: string;
  guidance?: GuidanceLevel;
  demonstrating?: boolean;
  onAction: (action: string) => void;
}) {
  const stability = assessment?.stabilityAtTick != null;
  const context = assessment?.contextAtTick != null;
  const rateIntent = assessment?.rateIntentAtTick != null;
  const stroke = assessment?.strokePreventionAtTick != null;
  const reassessed = assessment?.reassessmentAtTick != null;
  const prompt = demonstrating ? null
    : afRvrInlinePrompt(guidance, { scenarioVersion, patient: assessment });
  const act = demonstrating ? undefined : onAction;
  return (
    <div style={{ display: 'grid', gap: 'var(--space-4)' }}>
    <WatchingNotice demonstrating={demonstrating} />
    <TutorPanel prompt={prompt} />
    <div className="tray-grid">
      <section className="syringe" aria-labelledby="af-rvr-stability-title">
        <div id="af-rvr-stability-title" className="syringe__name">Treat the patient before the number.</div>
        <Badge kind="teaching">rhythm · pressure · perfusion · ischemia · heart failure</Badge>
        <div className="syringe__meta">142/min irregular · stable pressure · no shock, ischemia, or acute HF</div>
        <p className="syringe__remaining" role="status">
          {rateIntent ? 'Patient-specific rate intent recorded · no treatment delivered'
            : context ? 'Duration uncertain · LVEF 55% · patient-specific plan due'
              : stability ? 'Stable now · review context before strategy'
                : 'Heart rate alone does not define instability'}
        </p>
        <div className="syringe__presets">
          <Button className="crisis-drug__action" disabled={stability}
            aria-disabled={demonstrating} onClick={act ? () => act('reconcile-af-rvr-rhythm-and-stability') : undefined}>Reconcile rhythm + stability</Button>
          <Button className="crisis-drug__action" disabled={!stability || context}
            aria-disabled={demonstrating} onClick={act ? () => act('review-af-rvr-context-and-triggers') : undefined}>Review duration + contributors</Button>
          <Button className="crisis-drug__action" disabled={!context || rateIntent}
            aria-disabled={demonstrating} onClick={act ? () => act('record-af-rvr-rate-control-intent') : undefined}>Record patient-specific rate intent</Button>
        </div>
        <p className="field__hint">Instability changes urgency. In a stable patient, ventricular function, pressure, symptoms, contraindications, and interactions shape acute rate-control selection.</p>
      </section>
      <section className="syringe" aria-labelledby="af-rvr-stroke-title">
        <div id="af-rvr-stroke-title" className="syringe__name">Rate is one lane. Stroke prevention is another.</div>
        <Badge kind="teaching">validated risk · bleeding · preference · duration · reassessment</Badge>
        <div className="syringe__meta">Duration uncertain · risk not low · cardioversion not assumed</div>
        <p className="syringe__remaining" role="status">
          {reassessed ? '96/min · still AF · symptoms improved · ownership recorded'
            : stroke ? 'Stroke-prevention context recorded · reassess the whole patient'
              : rateIntent ? 'Rate lane recorded · stroke-prevention lane remains'
                : 'Rate-control context pending'}
        </p>
        <div className="syringe__presets">
          <Button className="crisis-drug__action" disabled={!rateIntent || stroke}
            aria-disabled={demonstrating} onClick={act ? () => act('record-af-rvr-stroke-prevention-intent') : undefined}>Review stroke prevention + cardioversion context</Button>
          <Button className="crisis-drug__action" disabled={!stroke || reassessed}
            aria-disabled={demonstrating} onClick={act ? () => act('reassess-af-rvr-trajectory-and-follow-up') : undefined}>Reassess trajectory + ownership</Button>
        </div>
        <p className="field__hint">Better can still be AF. No score, agent, dose, anticoagulation decision, cardioversion, disposition, prognosis, or outcome is supplied.</p>
      </section>
    </div>
    </div>
  );
}
