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
import { FIELDS, qualitativeTwitchAssessment, type StateField } from '@anesthesia/physiology';
import { TRACKS, tilesFor, trackConfigs } from './tracks';
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
  readonly capnographySampleObstructed?: boolean;
  readonly inspiredCo2MmHg?: number;
  readonly arterialDamped?: boolean;
  readonly rhythm: RhythmId;
  readonly airwayPatencyFraction: number;
  readonly bronchospasmSeverity: number;
  readonly mechanicalPulse: boolean;
  readonly reducedMotion: boolean;
  readonly colorblindSafe: boolean;
  readonly showLimits: boolean;
  readonly primaryTracesOnly: boolean;
  readonly showTrainOfFour?: boolean;
  readonly showDepth?: boolean;
  readonly neuromuscularConfidence?: { label: string; kind: 'default' | 'out-of-range' | 'teaching' };
  /**
   * A pixel height, or `fill` to take whatever height the region has. `fill` is
   * what the cockpit uses: a taller window should mean taller waveforms, not a
   * fixed 320 px band with empty space under it.
   */
  readonly canvasHeight: number | 'fill';
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
    bronchospasmSeverity: props.bronchospasmSeverity,
    airwayPatencyFraction: props.airwayPatencyFraction,
    perfusionIndex: props.state?.perfusionIndex ?? 0.8,
    artifacts: props.waveformArtifacts,
    capnographySampleObstructed: props.capnographySampleObstructed,
    inspiredCo2MmHg: props.inspiredCo2MmHg,
    arterialDamped: props.arterialDamped,
    ventilating: (props.state?.respiratoryRateBpm ?? 0) > 0,
    mechanicalPulse: props.mechanicalPulse,
  }), [
    props.rhythm, props.state, props.waveformArtifacts, props.mechanicalPulse,
    props.airwayPatencyFraction, props.bronchospasmSeverity,
    props.capnographySampleObstructed, props.inspiredCo2MmHg, props.arterialDamped,
  ]);

  const alarmFor = (field: string): 'high' | 'medium' | 'low' | null => {
    const alarm = props.alarms.find((candidate) => candidate.parameter === field);
    return alarm ? alarm.priority : null;
  };

  const visibleTracks = new Set(tracks.map((track) => track.id));
  const tiles = tilesFor(props.showTrainOfFour ?? false).filter(
    (tile) => props.showDepth !== false || tile.field !== 'depthIndex',
  );

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
          {tiles.map((tile) => {
            const spec = FIELDS[tile.field];
            const invalid = props.invalidParameters.has(tile.field);
            return (
              <VitalTile
                key={tile.field}
                name={tile.name}
                value={invalid || !props.state ? null : props.state[tile.field] ?? null}
                unit={tile.field === 'trainOfFourRatio' && props.state
                  ? `ratio · count ${props.state.trainOfFourCount?.toFixed(0) ?? '--'} · qualitative ${
                    qualitativeTwitchAssessment(
                      props.state.trainOfFourCount ?? 4, props.state.trainOfFourRatio ?? 1,
                    )
                  }`
                  : spec.unit}
                precision={spec.precision}
                traceToken={tile.traceToken}
                {...(props.showLimits && tile.lowLimit !== undefined ? { lowLimit: tile.lowLimit } : {})}
                {...(props.showLimits && tile.highLimit !== undefined ? { highLimit: tile.highLimit } : {})}
                alarm={alarmFor(tile.field)}
                {...(tile.invalidReason ? { invalidReason: tile.invalidReason } : {})}
                reasonApplies={invalid && props.state !== null}
                artifact={props.artifactParameters.has(tile.field)}
                {...(tile.field === 'depthIndex' && props.modelConfidence
                  ? { confidence: props.modelConfidence }
                  : tile.field === 'trainOfFourRatio' && props.neuromuscularConfidence
                    ? { confidence: props.neuromuscularConfidence } : {})}
                {...(props.artifactParameters.has(tile.field)
                  ? {} : { onOpenWhy: () => props.onWhy(tile.field) })}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}
