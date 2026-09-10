/**
 * DiabeticKetoacidosisTray, moved out of `ActionCockpit.tsx` unchanged.
 *
 * The cockpit defined this tray inline and rendered it behind a `hasDiabeticKetoacidosisResponse` gate
 * computed from the scenario, so every specialty downloaded it. That gate is now this tray's
 * `supports` predicate in `trays.ts`; the body below is the original.
 */
import type { EquipmentSnapshot } from '@platform/kernel/protocol';
import { diabeticKetoacidosisInlinePrompt } from './tutor/diabetic-ketoacidosis-guidance';
import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import { TutorPanel, WatchingNotice } from '@anesthesia/ui/tutor-panel';
import { Badge, Button } from '@platform/ui';

export function DiabeticKetoacidosisTray({ assessment, scenarioVersion, guidance = 'unassisted', demonstrating = false, onAction }: {
  assessment?: NonNullable<EquipmentSnapshot['resuscitation']['diabeticKetoacidosisAssessment']>;
  scenarioVersion: string;
  guidance?: GuidanceLevel;
  demonstrating?: boolean;
  onAction: (action: string) => void;
}) {
  const reviewed = assessment?.presentationReviewedAtTick != null;
  const fluids = assessment?.fluidsAtTick != null;
  const potassium = assessment?.potassiumAtTick != null;
  const insulin = assessment?.insulinAtTick != null;
  const dextrose = assessment?.dextroseAtTick != null;
  const transitioned = assessment?.transitionAtTick != null;
  const prompt = demonstrating ? null
    : diabeticKetoacidosisInlinePrompt(guidance, { scenarioVersion, patient: assessment });
  const act = demonstrating ? undefined : onAction;
  return (
    <div style={{ display: 'grid', gap: 'var(--space-4)' }}>
      <WatchingNotice demonstrating={demonstrating} />
      <TutorPanel prompt={prompt} />
      <div className="tray-grid">
      <section className="syringe" aria-labelledby="dka-foundation-title">
        <div id="dka-foundation-title" className="syringe__name">Three signals name the crisis.</div>
        <Badge kind="teaching">Glucose + ketones + acidosis</Badge>
        <div className="syringe__meta">486 · β-OHB 5.4 · pH 7.16 · HCO₃ 11 · K 3.2</div>
        <p className="syringe__remaining" role="status">
          {potassium ? 'Fixed repeat K 3.7 · insulin gate open'
            : fluids ? 'Fluids + serial panels active · correct K first'
              : reviewed ? 'Moderate DKA recognized · support next'
                : 'Triad + severity + precipitant review pending'}
        </p>
        <div className="syringe__presets">
          <Button className="crisis-drug__action" disabled={reviewed}
            aria-disabled={demonstrating} onClick={act ? () => act('review-dka-presentation') : undefined}>Review DKA triad + cause</Button>
          <Button className="crisis-drug__action" disabled={!reviewed || fluids}
            aria-disabled={demonstrating} onClick={act ? () => act('record-dka-fluids-and-monitoring') : undefined}>Record fluids + serial monitoring</Button>
          <Button className="crisis-drug__action" disabled={!fluids || potassium}
            aria-disabled={demonstrating} onClick={act ? () => act('record-dka-potassium-replacement') : undefined}>Replace K + recheck before insulin</Button>
        </div>
        <p className="field__hint">Potassium 3.2 mmol/L keeps insulin locked. The screen does not examine, sample, choose a fluid or electrolyte dose, or deliver treatment.</p>
      </section>
      <section className="syringe" aria-labelledby="dka-clearance-title">
        <div id="dka-clearance-title" className="syringe__name">Treat the ketones, not just the glucose.</div>
        <div className="syringe__meta">Insulin after K · dextrose before resolution · safe overlap</div>
        <p className="syringe__remaining" role="status">
          {transitioned ? 'Resolved · β-OHB 0.4 · pH 7.32 · HCO₃ 19'
            : dextrose ? 'Glucose 238 · ketoacidosis persists · continue insulin'
              : insulin ? 'Insulin intent active · interval panel ready'
                : potassium ? 'K gate cleared · insulin intent available' : 'Potassium gate pending'}
        </p>
        <div className="syringe__presets">
          <Button className="crisis-drug__action" disabled={!potassium || insulin}
            aria-disabled={demonstrating} onClick={act ? () => act('record-dka-insulin-intent') : undefined}>Record IV insulin protocol intent</Button>
          <Button className="crisis-drug__action" disabled={!insulin || dextrose}
            aria-disabled={demonstrating} onClick={act ? () => act('add-dextrose-and-continue-insulin') : undefined}>Add dextrose + continue insulin</Button>
          <Button className="crisis-drug__action" disabled={!dextrose || transitioned}
            aria-disabled={demonstrating} onClick={act ? () => act('confirm-dka-resolution-and-transition') : undefined}>Confirm resolution + transition safely</Button>
        </div>
        <p className="field__hint">Resolution uses plasma ketone plus pH or bicarbonate, not anion gap or urine ketones alone. No infusion, lab kinetics, complication, disposition, or outcome is simulated.</p>
      </section>
      </div>
    </div>
  );
}
