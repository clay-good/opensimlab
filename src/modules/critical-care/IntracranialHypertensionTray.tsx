/**
 * IntracranialHypertensionTray, moved out of `ActionCockpit.tsx` unchanged.
 *
 * The cockpit defined this tray inline and rendered it behind a `hasIntracranialHypertensionResponse` gate
 * computed from the scenario, so every specialty downloaded it. That gate is now this tray's
 * `supports` predicate in `trays.ts`; the body below is the original.
 */
import type { EquipmentSnapshot } from '@platform/kernel/protocol';
import { intracranialHypertensionInlinePrompt } from './tutor/intracranial-hypertension-guidance';
import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import { TutorPanel, WatchingNotice } from '@anesthesia/ui/tutor-panel';
import { Badge, Button } from '@platform/ui';

export function IntracranialHypertensionTray({ assessment, scenarioVersion, guidance = 'unassisted', demonstrating = false, onAction }: {
  assessment?: NonNullable<EquipmentSnapshot['resuscitation']['intracranialHypertensionAssessment']>;
  scenarioVersion: string;
  guidance?: GuidanceLevel;
  demonstrating?: boolean;
  onAction: (action: string) => void;
}) {
  const recognized = assessment?.recognitionAtTick != null;
  const context = assessment?.contextAtTick != null;
  const protectedBrain = assessment?.protectionAtTick != null;
  const rescued = assessment?.rescueAtTick != null;
  const reassessed = assessment?.reassessmentAtTick != null;
  const prompt = demonstrating ? null
    : intracranialHypertensionInlinePrompt(guidance, { scenarioVersion, patient: assessment });
  const act = demonstrating ? undefined : onAction;
  return (
    <div style={{ display: 'grid', gap: 'var(--space-4)' }}>
      <WatchingNotice demonstrating={demonstrating} />
      <TutorPanel prompt={prompt} />
      <div className="tray-grid">
      <section className="syringe" aria-labelledby="intracranial-hypertension-context-title">
        <div id="intracranial-hypertension-context-title" className="syringe__name">Lower pressure. Preserve perfusion.</div>
        <Badge kind="teaching">ICP 28 · CPP 54 · threshold &gt;22 · contextualize with exam + CT</Badge>
        <div className="syringe__meta">8 min sustained · unchanged pupils · diffuse edema · repeat review open</div>
        <p className="syringe__remaining" role="status">
          {context ? 'ICP crisis recognized · reversible drivers identified'
            : recognized ? 'Neurocritical teams active · whole-context review due'
              : 'Treat the monitored pattern, not one number in isolation.'}
        </p>
        <div className="syringe__presets">
          <Button className="crisis-drug__action" disabled={recognized}
            aria-disabled={demonstrating} onClick={act ? () => act('recognize-intracranial-hypertension') : undefined}>Recognize ICP crisis + activate help</Button>
          <Button className="crisis-drug__action" disabled={!recognized || context}
            aria-disabled={demonstrating} onClick={act ? () => act('review-intracranial-hypertension-context') : undefined}>Review monitor + whole context</Button>
        </div>
        <p className="field__hint">ICP, CPP, examination, imaging, and systemic physiology belong in one decision.</p>
      </section>
      <section className="syringe" aria-labelledby="intracranial-hypertension-treatment-title">
        <div id="intracranial-hypertension-treatment-title" className="syringe__name">Treat pressure. Protect the patient.</div>
        <Badge kind="teaching">CPP 60–70 · do not force &gt;70 · no universal osmotherapy recipe</Badge>
        <div className="syringe__meta">venous drainage · oxygen + ventilation · perfusion · temperature · synchrony</div>
        <p className="syringe__remaining" role="status">
          {reassessed ? 'ICP 19 · CPP 65 · durability + escalation remain open'
            : rescued ? 'Protection + rescue active · ICP and CPP review due'
              : protectedBrain ? 'First-tier protection active · individualized rescue due'
                : 'First-tier brain protection pending'}
        </p>
        <div className="syringe__presets">
          <Button className="crisis-drug__action" disabled={!context || protectedBrain}
            aria-disabled={demonstrating} onClick={act ? () => act('activate-first-tier-brain-protection') : undefined}>Activate first-tier brain protection</Button>
          <Button className="crisis-drug__action" disabled={!protectedBrain || rescued}
            aria-disabled={demonstrating} onClick={act ? () => act('activate-individualized-hyperosmolar-rescue') : undefined}>Activate individualized hyperosmolar rescue</Button>
          <Button className="crisis-drug__action" disabled={!rescued || reassessed}
            aria-disabled={demonstrating} onClick={act ? () => act('reassess-intracranial-hypertension-trajectory') : undefined}>Review ICP + CPP trajectory</Button>
        </div>
        <p className="field__hint">An immediate pressure response does not prove durable control, recovery, or outcome.</p>
      </section>
      </div>
    </div>
  );
}
