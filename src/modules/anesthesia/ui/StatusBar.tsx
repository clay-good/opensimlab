/**
 * The Status Bar (design/layout → Status Bar Contents).
 *
 * Left to right: the patient identity summary, the procedure, the elapsed
 * simulated clock, the transport controls, the speed selector and the overflow
 * menu. It also carries the persistent simulator marker the safety capability
 * requires.
 */

import { SPEED_MULTIPLIERS, type SpeedMultiplier } from '@platform/clock/simulation-clock';
import { IconButton, SegmentedControl } from '@platform/ui';
import { PERSISTENT_MARKER_TEXT } from '@platform/safety/not-for-clinical-use';
import type { Scenario } from '@anesthesia/engine';
import { MaturityMarker } from '@platform/governance/MaturityMarker';

export interface StatusBarProps {
  readonly scenario: Scenario;
  readonly elapsed: string;
  readonly transport: 'idle' | 'running' | 'paused';
  readonly speed: SpeedMultiplier;
  readonly onPlay: () => void;
  readonly onPause: () => void;
  readonly onStep: () => void;
  readonly onReset: () => void;
  readonly onSpeed: (speed: SpeedMultiplier) => void;
  readonly onOverflow: () => void;
  readonly moduleId?: string;
}

export function StatusBar({
  scenario, elapsed, transport, speed, onPlay, onPause, onStep, onReset, onSpeed, onOverflow,
  moduleId = 'anesthesia',
}: StatusBarProps) {
  const patient = scenario.patient;
  const age = patient.ageYears === 0 ? 'Newborn' : `${patient.ageYears} y`;
  const summary = `${age} ${patient.sex === 'male' ? 'M' : 'F'} · `
    + `${patient.weightKg} kg${moduleId === 'cardiology' || moduleId === 'respiratory-medicine' || moduleId === 'pediatrics' || moduleId === 'neonatology'
      ? '' : ` · ASA ${patient.asaClass}`}`;

  return (
    <div className="status-bar">
      <div className="status-bar__patient">
        <span className="status-bar__patient-summary">{summary}</span>
        <span className="status-bar__procedure">{patient.procedure}</span>
      </div>

      {/* The persistent simulator marker. It never disappears mid-session, and
          it is never truncated into nonsense either: at a phone width it shows
          its short form in full rather than an ellipsis. The full sentence stays
          in the accessibility tree at every width. */}
      <span className="status-bar__marker">
        <span className="status-bar__marker-long">{PERSISTENT_MARKER_TEXT}</span>
        <span className="status-bar__marker-short" aria-hidden="true">Simulator</span>
      </span>

      <MaturityMarker
        compact
        status={scenario.metadata.maturity}
        subjectKind="scenario"
        subjectId={scenario.metadata.id}
        contentVersion={scenario.metadata.version}
        moduleId={moduleId}
      />

      <span className="status-bar__clock numeric" aria-label={`Elapsed simulated time ${elapsed}`}>
        {elapsed}
      </span>

      <div className="status-bar__transport" role="group" aria-label="Transport controls">
        {transport === 'running'
          ? <IconButton label="Pause" onClick={onPause}>⏸</IconButton>
          : <IconButton label="Play" onClick={onPlay}>▶</IconButton>}
        {/* Step and reset leave the bar as phone space tightens. Both remain in
            More options; preserving that gateway is more useful than clipping
            it to duplicate secondary controls in the bar. */}
        <IconButton className="status-bar__step" label="Advance one simulated second" onClick={onStep}>⏭</IconButton>
        <IconButton className="status-bar__reset" label="Reset the scenario" onClick={onReset}>↺</IconButton>
      </div>

      <SegmentedControl<SpeedMultiplier>
        label="Simulation speed"
        value={speed}
        onChange={onSpeed}
        options={SPEED_MULTIPLIERS.map((multiplier) => ({
          value: multiplier,
          label: `${multiplier}×`,
          srLabel: `${multiplier} times speed`,
        }))}
      />

      <IconButton label="More options" onClick={onOverflow}>⋯</IconButton>
    </div>
  );
}
