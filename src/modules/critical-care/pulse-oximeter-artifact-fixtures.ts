import type { PulseOximeterArtifactAction } from './pulse-oximeter-artifact';

/**
 * Reference transcripts for the pulse-oximeter artifact lesson.
 *
 * The common-error path is the one a persuasive story invites: the discordance
 * is recognised, the pleth is inspected, and the learner jumps to the clean-site
 * reading — skipping the probe path and, more importantly, the independent
 * arterial measurement that is the only thing separating a diagnosis from an
 * opinion. The recovery path skips each intervening step in turn, is refused for
 * both, and still completes from the same positions.
 */
export const PULSE_OXIMETER_ARTIFACT_FIXTURES = {
  scenarioId: 'pulse-oximeter-motion-artifact', contentVersion: '0.1.0', seed: 3067,
  noAction: [],
  expert: [
    [0, 'recognize-pulse-oximeter-discordance'],
    [1, 'inspect-pleth-and-pulse-rate-coherence'],
    [2, 'review-probe-motion-and-perfusion'],
    [3, 'corroborate-oxygenation-independently'],
    [4, 'reassess-pulse-oximeter-signal'],
  ],
  commonError: [
    [0, 'recognize-pulse-oximeter-discordance'],
    [1, 'inspect-pleth-and-pulse-rate-coherence'],
    // Straight to the clean site, on the strength of a story.
    [2, 'reassess-pulse-oximeter-signal'],
  ],
  recovery: [
    // The pleth before the discordance has been recognised.
    [0, 'inspect-pleth-and-pulse-rate-coherence'],
    [1, 'recognize-pulse-oximeter-discordance'],
    [2, 'inspect-pleth-and-pulse-rate-coherence'],
    [3, 'review-probe-motion-and-perfusion'],
    // The clean-site reading before oxygenation has been corroborated.
    [4, 'reassess-pulse-oximeter-signal'],
    [5, 'corroborate-oxygenation-independently'],
    [6, 'reassess-pulse-oximeter-signal'],
  ],
} as const satisfies {
  scenarioId: string; contentVersion: string; seed: number;
  noAction: readonly (readonly [number, PulseOximeterArtifactAction])[];
  expert: readonly (readonly [number, PulseOximeterArtifactAction])[];
  commonError: readonly (readonly [number, PulseOximeterArtifactAction])[];
  recovery: readonly (readonly [number, PulseOximeterArtifactAction])[];
};
