/**
 * The Monitor region (design/layout → Monitor Region Composition).
 *
 * A single WaveformCanvas on the left 72% with stacked traces, a VitalTile column
 * on the right 28% with each tile aligned to its trace, and the AlarmRail above
 * both, full width, collapsing to zero height when no alarm is active.
 */

import { useMemo } from 'react';
import { AlarmRail, VitalTile, WaveformCanvas } from '@platform/ui/monitor';
import type { EngineAlarm } from '@platform/kernel/protocol';
import { FIELDS, type StateField } from '@anesthesia/physiology';
import { TILES, TRACKS, trackConfigs } from './tracks';
import { waveformDescriptions } from './accessibility';
import type { RhythmId } from '@anesthesia/waveforms/types';

export interface MonitorRegionProps {
  readonly state: Readonly<Record<string, number>> | null;
  readonly blocks: readonly { trackId: string; samples: Float32Array }[];
  readonly alarms: readonly EngineAlarm[];
  readonly tick: number;
  readonly invalidParameters: ReadonlySet<string>;
  readonly artifactParameters: ReadonlySet<string>;
  readonly waveformArtifacts: ReadonlySet<string>;
  readonly rhythm: RhythmId;
  readonly mechanicalPulse: boolean;
  readonly reducedMotion: boolean;
  readonly colorblindSafe: boolean;
  readonly showLimits: boolean;
  readonly primaryTracesOnly: boolean;
  readonly canvasHeight: number;
  readonly onSilence: (alarmId: string) => void;
  readonly onWhy: (field: StateField) => void;
  readonly onFrame?: (durationMs: number) => void;
  readonly modelConfidence?: { label: string; kind: 'default' | 'out-of-range' | 'teaching' };
}

export function MonitorRegion(props: MonitorRegionProps) {
  const tracks = useMemo(
    () => trackConfigs(props.colorblindSafe, props.waveformArtifacts, props.primaryTracesOnly),
    [props.colorblindSafe, props.waveformArtifacts, props.primaryTracesOnly],
  );

  const descriptions = useMemo(() => waveformDescriptions({
    rhythm: props.rhythm,
    bronchospasmSeverity: 0,
    perfusionIndex: props.state?.perfusionIndex ?? 0.8,
    artifacts: props.waveformArtifacts,
    ventilating: (props.state?.respiratoryRateBpm ?? 0) > 0,
    mechanicalPulse: props.mechanicalPulse,
  }), [props.rhythm, props.state, props.waveformArtifacts, props.mechanicalPulse]);

  const alarmFor = (field: string): 'critical' | 'warning' | 'advisory' | null => {
    const alarm = props.alarms.find((candidate) => candidate.parameter === field);
    return alarm ? alarm.priority : null;
  };

  const visibleTracks = new Set(tracks.map((track) => track.id));

  return (
    <div className="monitor">
      <AlarmRail
        alarms={props.alarms.map((alarm) => ({
          id: alarm.alarmId, priority: alarm.priority, message: alarm.message,
          silencedUntilTick: alarm.silencedUntilTick,
        }))}
        tick={props.tick}
        onSilence={props.onSilence}
      />
      <div className="monitor__body">
        <div className="monitor__traces">
          <WaveformCanvas
            tracks={tracks}
            blocks={props.blocks}
            reducedMotion={props.reducedMotion}
            height={props.canvasHeight}
            {...(props.onFrame ? { onFrame: props.onFrame } : {})}
          />
          {/* Each trace's persistent text label, so identity never rests on colour. */}
          <ul className="visually-hidden">
            {TRACKS.filter((track) => visibleTracks.has(track.signal)).map((track) => (
              <li key={track.signal}>{track.label}</li>
            ))}
          </ul>
          <div className="visually-hidden" id="waveform-descriptions">
            <h3>Waveform morphology</h3>
            <dl>
              {descriptions.filter((d) => visibleTracks.has(d.signal)).map((description) => (
                <div key={description.signal}>
                  <dt>{description.label}</dt>
                  <dd>{description.description}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>

        <div className="monitor__tiles">
          {TILES.map((tile) => {
            const spec = FIELDS[tile.field];
            const invalid = props.invalidParameters.has(tile.field);
            return (
              <VitalTile
                key={tile.field}
                name={tile.name}
                value={invalid || !props.state ? null : props.state[tile.field] ?? null}
                unit={spec.unit}
                precision={spec.precision}
                traceToken={tile.traceToken}
                {...(props.showLimits && tile.lowLimit !== undefined ? { lowLimit: tile.lowLimit } : {})}
                {...(props.showLimits && tile.highLimit !== undefined ? { highLimit: tile.highLimit } : {})}
                alarm={alarmFor(tile.field)}
                {...(tile.invalidReason ? { invalidReason: tile.invalidReason } : {})}
                reasonApplies={invalid && props.state !== null}
                artifact={props.artifactParameters.has(tile.field)}
                {...(tile.field === 'depthIndex' && props.modelConfidence
                  ? { confidence: props.modelConfidence } : {})}
                onOpenWhy={() => props.onWhy(tile.field)}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}
