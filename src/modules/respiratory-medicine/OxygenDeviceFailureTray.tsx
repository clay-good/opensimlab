/**
 * OxygenDeviceFailureTray, moved out of `ActionCockpit.tsx` unchanged.
 *
 * The cockpit defined this tray inline and rendered it behind a `hasOxygenDeviceFailureResponse` gate
 * computed from the scenario, so every specialty downloaded it. The gate is now this tray's
 * `supports` predicate in `trays.ts`; the body below is the original.
 */
import type { EquipmentSnapshot } from '@platform/kernel/protocol';
import { oxygenDeviceFailureInlinePrompt } from './tutor/oxygen-device-failure-guidance';
import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import { TutorPanel, WatchingNotice } from '@anesthesia/ui/tutor-panel';
import { Badge, Button } from '@platform/ui';

export function OxygenDeviceFailureTray({ assessment, scenarioVersion, guidance = 'unassisted', demonstrating = false, onAction }: {
  assessment?: NonNullable<EquipmentSnapshot['resuscitation']['oxygenDeviceFailureAssessment']>;
  scenarioVersion: string;
  guidance?: GuidanceLevel;
  demonstrating?: boolean;
  onAction: (action: string) => void;
}) {
  const reconciled = assessment?.reconciledAtTick != null;
  const bridge = assessment?.bridgeAtTick != null;
  const path = assessment?.pathAtTick != null;
  const restoration = assessment?.restorationAtTick != null;
  const response = assessment?.responseAtTick != null;
  const handoff = assessment?.handoffAtTick != null;
  const unsupportedChoice = assessment?.lastUnsupportedChoice;
  const prompt = demonstrating ? null
    : oxygenDeviceFailureInlinePrompt(guidance, { scenarioVersion, patient: assessment });
  const act = demonstrating ? undefined : onAction;
  return <div style={{ display: 'grid', gap: 'var(--space-4)' }}>
    <WatchingNotice demonstrating={demonstrating} />
    <TutorPanel prompt={prompt} />
    <div className="tray-grid">
    <section className="syringe" aria-labelledby="oxygen-device-failure-recognition-title">
      <div id="oxygen-device-failure-recognition-title" className="syringe__name">Confirm the person. Then follow the oxygen.</div>
      <Badge kind="teaching">person · pleth · breathing · circulation · source · path</Badge>
      <div className="syringe__meta">SpO₂ 93 → 84% · RR 20 → 30 · spontaneous breathing</div>
      <p className="syringe__remaining" role="status">
        {path ? 'No oxygen leaves the depleted source · correct the fixed upstream interruption'
          : bridge ? 'Verified backup active · trace the original source-to-patient path'
            : unsupportedChoice === 'blood-gas' ? 'The change is credible · support cannot wait for another test'
              : unsupportedChoice === 'continue-transport' ? 'Pause transport · restore reliable delivery before moving'
                : reconciled ? 'Hypoxemia is credible · bridge before naming the fault'
                  : 'Begin with the person, not the cylinder'}
      </p>
      <div className="syringe__presets">
        {!reconciled && <Button className="crisis-drug__action"
          aria-disabled={demonstrating} onClick={act ? () => act('reconcile-oxygen-device-failure-patient-signal-and-delivery') : undefined}>Review patient + signal</Button>}
        {reconciled && !bridge && <>
          <Button className="crisis-drug__action" aria-disabled={demonstrating} onClick={act ? () => act('activate-oxygen-device-failure-immediate-bridge-and-help') : undefined}>Bridge to verified backup oxygen</Button>
          <Button className="crisis-drug__action" aria-disabled={demonstrating} onClick={act ? () => act('wait-for-oxygen-device-failure-blood-gas') : undefined}>Wait for a blood gas</Button>
          <Button className="crisis-drug__action" aria-disabled={demonstrating} onClick={act ? () => act('continue-oxygen-device-failure-transport') : undefined}>Keep transport moving</Button>
        </>}
        {bridge && !path && <Button className="crisis-drug__action"
          aria-disabled={demonstrating} onClick={act ? () => act('review-oxygen-device-failure-source-to-patient-path') : undefined}>Trace patient-to-source path</Button>}
      </div>
      <p className="field__hint">The patient comes before troubleshooting. Qualified staff provide the separate verified bridge off-screen; no oxygen source, device, interface, flow, target, or treatment is selected or delivered here.</p>
    </section>
    <section className="syringe" aria-labelledby="oxygen-device-failure-restoration-title">
      <div id="oxygen-device-failure-restoration-title" className="syringe__name">Restored flow still needs proof.</div>
      <Badge kind="teaching">verified source · prescribed pathway · response · reserve · backup</Badge>
      <div className="syringe__meta">delivery at patient · whole-person trend · transport ownership</div>
      <p className="syringe__remaining" role="status">
        {handoff ? 'Source, reserve, backup, monitoring, and response handed off'
          : response ? 'Oxygenation and work are returning toward baseline · handoff remains'
            : restoration ? 'Established pathway restored · advance time for proof'
              : unsupportedChoice === 'increase-source' ? 'A depleted source cannot deliver oxygen by selecting a higher number'
                : unsupportedChoice === 'reseat-cannula' ? 'The cannula is patent · the fixed interruption is upstream'
                  : path ? 'Correct the fixed upstream interruption with a checked source'
                    : 'Bridge support and source-to-patient review come first'}
      </p>
      <div className="syringe__presets">
        {path && !restoration && <>
          <Button className="crisis-drug__action" aria-disabled={demonstrating} onClick={act ? () => act('record-oxygen-device-failure-restoration-and-backup-intent') : undefined}>Use checked replacement source</Button>
          <Button className="crisis-drug__action" aria-disabled={demonstrating} onClick={act ? () => act('increase-depleted-oxygen-source-control') : undefined}>Turn the depleted source higher</Button>
          <Button className="crisis-drug__action" aria-disabled={demonstrating} onClick={act ? () => act('reseat-patent-oxygen-interface') : undefined}>Reseat the patent cannula</Button>
        </>}
        {restoration && !response && <Button className="crisis-drug__action"
          aria-disabled={demonstrating} onClick={act ? () => act('review-oxygen-device-failure-delivery-and-patient-response') : undefined}>Review 3-minute response</Button>}
        {response && !handoff && <Button className="crisis-drug__action"
          aria-disabled={demonstrating} onClick={act ? () => act('handoff-oxygen-device-failure-reassessment') : undefined}>Hand off source + reserve check</Button>}
      </div>
      <p className="field__hint">A fixed early response does not resolve the lung disease or declare transport safe. Handoff keeps the verified source, documented reserve, independent backup, monitoring, failed-source isolation, and named owners visible without blame.</p>
    </section>
    </div>
  </div>;
}
