/**
 * EndotrachealTubeMigrationTray, moved out of `ActionCockpit.tsx` unchanged.
 *
 * The cockpit defined this tray inline and rendered it behind a `hasEndotrachealTubeMigrationResponse` gate
 * computed from the scenario, so every specialty downloaded it. That gate is now this tray's
 * `supports` predicate in `trays.ts`; the body below is the original.
 */
import type { EquipmentSnapshot } from '@platform/kernel/protocol';
import { tubeMigrationInlinePrompt } from './tutor/tube-migration-guidance';
import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import { TutorPanel, WatchingNotice } from '@anesthesia/ui/tutor-panel';
import { Badge, Button } from '@platform/ui';

export function EndotrachealTubeMigrationTray({ assessment, scenarioVersion, guidance = 'unassisted', demonstrating = false, onAction }: {
  assessment?: NonNullable<EquipmentSnapshot['resuscitation']['endotrachealTubeMigrationAssessment']>;
  scenarioVersion: string;
  guidance?: GuidanceLevel;
  demonstrating?: boolean;
  onAction: (action: string) => void;
}) {
  const recognized = assessment?.recognizedAtTick != null;
  const supported = assessment?.supportedAtTick != null;
  const positionReviewed = assessment?.positionReviewedAtTick != null;
  const correction = assessment?.correctionAtTick != null;
  const reassessed = assessment?.reassessedAtTick != null;
  const prompt = demonstrating ? null
    : tubeMigrationInlinePrompt(guidance, { scenarioVersion, patient: assessment });
  const act = demonstrating ? undefined : onAction;
  return (
    <div style={{ display: 'grid', gap: 'var(--space-4)' }}>
      <WatchingNotice demonstrating={demonstrating} />
      <TutorPanel prompt={prompt} />
      <div className="tray-grid">
      <section className="syringe" aria-labelledby="tube-migration-recognition-title">
        <div id="tube-migration-recognition-title" className="syringe__name">After every move, earn the airway again.</div>
        <Badge kind="teaching">movement · depth · bilateral ventilation · pressure</Badge>
        <div className="syringe__meta">22 → 25 cm · left markedly reduced · Ppeak 36</div>
        <p className="syringe__remaining" role="status">
          {positionReviewed ? 'Depth change + unilateral ventilation integrated · alternatives open'
            : supported ? 'Oxygenation bridge recorded · locate the problem'
              : recognized ? 'Post-turn ventilation change recognized · support in parallel'
                : 'SpO₂ 89% · exhaled Vt 310 mL · continuous capnography present'}
        </p>
        <div className="syringe__presets">
          <Button className="crisis-drug__action" disabled={recognized}
            aria-disabled={demonstrating} onClick={act ? () => act('recognize-post-repositioning-ventilation-change') : undefined}>Recognize the post-turn change</Button>
          <Button className="crisis-drug__action" disabled={!recognized || supported}
            aria-disabled={demonstrating} onClick={act ? () => act('bridge-post-repositioning-oxygenation') : undefined}>Bridge oxygenation + escalate</Button>
          <Button className="crisis-drug__action" disabled={!supported || positionReviewed}
            aria-disabled={demonstrating} onClick={act ? () => act('integrate-tube-depth-and-bilateral-ventilation') : undefined}>Integrate depth + bilateral ventilation</Button>
        </div>
        <p className="field__hint">Continuous capnography supports tracheal placement; it does not prove correct depth or bilateral ventilation.</p>
      </section>
      <section className="syringe" aria-labelledby="tube-migration-correction-title">
        <div id="tube-migration-correction-title" className="syringe__name">Support first. Correct with proof.</div>
        <Badge kind="teaching">experienced correction · secure · reassess</Badge>
        <div className="syringe__meta">fixed response: 22 cm · bilateral · Vt 410 · SpO₂ 96%</div>
        <p className="syringe__remaining" role="status">
          {reassessed ? 'Position + gas exchange reassessed · ongoing care remains open'
            : correction ? 'Experienced correction intent recorded · prove the response'
              : 'No tube is handled by this screen.'}
        </p>
        <div className="syringe__presets">
          <Button className="crisis-drug__action" disabled={!positionReviewed || correction}
            aria-disabled={demonstrating} onClick={act ? () => act('record-experienced-tube-correction-intent') : undefined}>Record experienced correction intent</Button>
          <Button className="crisis-drug__action" disabled={!correction || reassessed}
            aria-disabled={demonstrating} onClick={act ? () => act('reassess-tube-position-and-gas-exchange') : undefined}>Reassess position + gas exchange</Button>
        </div>
        <p className="field__hint">Exact depth is a case fact, not a target. These controls inspect, auscultate, image, or manipulate nothing.</p>
      </section>
      </div>
    </div>
  );
}
