/**
 * ObesityHypoventilationTray, moved out of `ActionCockpit.tsx` unchanged.
 *
 * The cockpit defined this tray inline and rendered it behind a `hasObesityHypoventilationResponse` gate
 * computed from the scenario, so every specialty downloaded it. The gate is now this tray's
 * `supports` predicate in `trays.ts`; the body below is the original.
 */
import type { EquipmentSnapshot } from '@platform/kernel/protocol';
import { obesityHypoventilationInlinePrompt } from './tutor/obesity-hypoventilation-reassessment-guidance';
import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import { TutorPanel, WatchingNotice } from '@anesthesia/ui/tutor-panel';
import { Badge, Button } from '@platform/ui';

export function ObesityHypoventilationTray({ assessment, scenarioVersion, guidance = 'unassisted', demonstrating = false, onAction }: {
  assessment?: NonNullable<EquipmentSnapshot['resuscitation']['obesityHypoventilationAssessment']>;
  scenarioVersion: string;
  guidance?: GuidanceLevel;
  demonstrating?: boolean;
  onAction: (action: string) => void;
}) {
  const phenotype = assessment?.phenotypeAtTick != null;
  const awake = assessment?.awakeEvidenceAtTick != null;
  const sleep = assessment?.sleepEvidenceAtTick != null;
  const recognition = assessment?.recognitionAtTick != null;
  const plan = assessment?.coordinatedPlanAtTick != null;
  const handoff = assessment?.handoffAtTick != null;
  const prompt = demonstrating ? null
    : obesityHypoventilationInlinePrompt(guidance, { scenarioVersion, patient: assessment });
  const act = demonstrating ? undefined : onAction;
  return <div style={{ display: 'grid', gap: 'var(--space-4)' }}>
    <WatchingNotice demonstrating={demonstrating} />
    <TutorPanel prompt={prompt} />
    <div className="tray-grid">
    <section className="syringe" aria-labelledby="obesity-hypoventilation-evidence-title">
      <div id="obesity-hypoventilation-evidence-title" className="syringe__name">Awake carbon dioxide completes the sleep story.</div>
      <Badge kind="teaching">symptoms · awake PaCO₂ · bicarbonate · sleep breathing · exclusions</Badge>
      <div className="syringe__meta">daytime function · current safety · fixed awake + sleep evidence</div>
      <p className="syringe__remaining" role="status">{recognition ? 'Daytime + sleep evidence align · bounded pattern recorded' : awake && sleep ? 'Both evidence lanes held · record the whole pattern' : phenotype ? 'Daytime story held · awake and sleep reviews are open' : 'Start with symptoms and daytime function, not body size'}</p>
      <div className="syringe__presets">
        <Button className="crisis-drug__action" disabled={phenotype} aria-disabled={demonstrating} onClick={act ? () => act('reconcile-obesity-hypoventilation-phenotype-and-trajectory') : undefined}>Review symptoms + daytime state</Button>
        <Button className="crisis-drug__action" disabled={!phenotype || awake} aria-disabled={demonstrating} onClick={act ? () => act('review-obesity-hypoventilation-awake-evidence') : undefined}>Review awake CO₂ + bicarbonate</Button>
        <Button className="crisis-drug__action" disabled={!phenotype || sleep} aria-disabled={demonstrating} onClick={act ? () => act('review-obesity-hypoventilation-sleep-evidence-and-open-causes') : undefined}>Review sleep evidence + open causes</Button>
      </div>
      <p className="field__hint">Bicarbonate can prompt PaCO₂ measurement in the right screening context; it does not diagnose OHS. Awake saturation, BMI, PaCO₂, and AHI also do not stand alone.</p>
    </section>
    <section className="syringe" aria-labelledby="obesity-hypoventilation-ownership-title">
      <div id="obesity-hypoventilation-ownership-title" className="syringe__name">A clear pattern deserves a joined-up plan.</div>
      <Badge kind="teaching">respiratory · sleep · primary care · weight health · patient goals</Badge>
      <div className="syringe__meta">preferences · access · cardiometabolic health · follow-through</div>
      <p className="syringe__remaining" role="status">{handoff ? 'Evidence + unresolved work handed off' : plan ? 'Owners connected · advance time before handoff' : recognition ? 'Pattern recorded · connect respectful shared ownership' : 'Bring both evidence lanes together before planning'}</p>
      <div className="syringe__presets">
        <Button className="crisis-drug__action" disabled={!awake || !sleep || recognition} aria-disabled={demonstrating} onClick={act ? () => act('recognize-obesity-hypoventilation-working-pattern') : undefined}>Recognize convergent OHS pattern</Button>
        <Button className="crisis-drug__action" disabled={!recognition || plan} aria-disabled={demonstrating} onClick={act ? () => act('coordinate-obesity-hypoventilation-shared-plan') : undefined}>Connect respiratory + sleep + weight-health owners</Button>
        <Button className="crisis-drug__action" disabled={!plan || handoff} aria-disabled={demonstrating} onClick={act ? () => act('handoff-obesity-hypoventilation-reassessment') : undefined}>Hand off evidence + open work</Button>
      </div>
      <p className="field__hint">No PAP, interface, pressure, backup rate, oxygen, medication, procedure, weight intervention, disposition, response, or outcome is selected.</p>
    </section>
    </div>
  </div>;
}
