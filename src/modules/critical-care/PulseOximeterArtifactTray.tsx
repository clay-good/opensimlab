/**
 * PulseOximeterArtifactTray, moved out of `ActionCockpit.tsx` unchanged.
 *
 * The cockpit defined this tray inline and rendered it behind a `hasPulseOximeterArtifactResponse` gate
 * computed from the scenario, so every specialty downloaded it. That gate is now this tray's
 * `supports` predicate in `trays.ts`; the body below is the original.
 */
import type { EquipmentSnapshot } from '@platform/kernel/protocol';
import { pulseOximeterArtifactInlinePrompt } from './tutor/pulse-oximeter-artifact-guidance';
import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import { TutorPanel, WatchingNotice } from '@anesthesia/ui/tutor-panel';
import { Badge, Button } from '@platform/ui';

export function PulseOximeterArtifactTray({ assessment, scenarioVersion, guidance = 'unassisted', demonstrating = false, onAction }: {
  assessment?: NonNullable<EquipmentSnapshot['resuscitation']['pulseOximeterArtifactAssessment']>;
  scenarioVersion: string;
  guidance?: GuidanceLevel;
  demonstrating?: boolean;
  onAction: (action: string) => void;
}) {
  const discordance = assessment?.discordanceAtTick != null;
  const pleth = assessment?.plethAtTick != null;
  const probe = assessment?.probePerfusionAtTick != null;
  const corroborated = assessment?.corroboratedAtTick != null;
  const reassessed = assessment?.reassessedAtTick != null;
  const prompt = demonstrating ? null
    : pulseOximeterArtifactInlinePrompt(guidance, { scenarioVersion, patient: assessment });
  const act = demonstrating ? undefined : onAction;
  return (
    <div style={{ display: 'grid', gap: 'var(--space-4)' }}>
      <WatchingNotice demonstrating={demonstrating} />
      <TutorPanel prompt={prompt} />
      <div className="tray-grid">
      <section className="syringe" aria-labelledby="pulse-ox-signal-title">
        <div id="pulse-ox-signal-title" className="syringe__name">Trust the signal, not just the number.</div>
        <Badge kind="teaching">display · pleth · pulse · perfusion · patient</Badge>
        <div className="syringe__meta">82% display · pulse 132 · ECG 86</div>
        <p className="syringe__remaining" role="status">
          {probe ? 'Motion + cool low-perfusion site reviewed · alternatives open'
            : pleth ? 'Poor irregular pleth · pulse-rate mismatch confirmed'
              : discordance ? 'Display ≠ patient · interrogate signal quality'
                : 'Awake patient · stable breathing + circulation · isolated low display'}
        </p>
        <div className="syringe__presets">
          <Button className="crisis-drug__action" disabled={discordance}
            aria-disabled={demonstrating} onClick={act ? () => act('recognize-pulse-oximeter-discordance') : undefined}>Separate display from patient</Button>
          <Button className="crisis-drug__action" disabled={!discordance || pleth}
            aria-disabled={demonstrating} onClick={act ? () => act('inspect-pleth-and-pulse-rate-coherence') : undefined}>Inspect pleth + pulse-rate match</Button>
          <Button className="crisis-drug__action" disabled={!pleth || probe}
            aria-disabled={demonstrating} onClick={act ? () => act('review-probe-motion-and-perfusion') : undefined}>Review probe + motion + perfusion</Button>
        </div>
        <p className="field__hint">Signal confidence is part of the vital sign. Poor coherence lowers confidence; it does not diagnose artifact.</p>
      </section>
      <section className="syringe" aria-labelledby="pulse-ox-corroborate-title">
        <div id="pulse-ox-corroborate-title" className="syringe__name">Corroborate, then reassess.</div>
        <Badge kind="teaching">whole patient · arterial panel · trend · response</Badge>
        <div className="syringe__meta">fixed SaO₂ 97% · PaO₂ 94 · EtCO₂ 37</div>
        <p className="syringe__remaining" role="status">
          {reassessed ? '97% display · pulse 86 · coherent pleth · physiology unchanged'
            : corroborated ? 'Oxygenation corroborated · clean-site reassessment due'
              : 'A clean capnogram cannot exclude hypoxemia.'}
        </p>
        <div className="syringe__presets">
          <Button className="crisis-drug__action" disabled={!probe || corroborated}
            aria-disabled={demonstrating} onClick={act ? () => act('corroborate-oxygenation-independently') : undefined}>Cross-check patient + arterial oxygenation</Button>
          <Button className="crisis-drug__action" disabled={!corroborated || reassessed}
            aria-disabled={demonstrating} onClick={act ? () => act('reassess-pulse-oximeter-signal') : undefined}>Reassess display + signal coherence</Button>
        </div>
        <p className="field__hint">If the patient is unstable, support and escalate in parallel. These controls inspect nothing and deliver no care.</p>
      </section>
      </div>
    </div>
  );
}
