import type { AcuteTracheostomyObstructionAction } from './acute-tracheostomy-obstruction';

/**
 * Reference transcripts for the tracheostomy-patency lesson.
 *
 * The common-error path takes the shortcut that hurts him fastest: pushing
 * positive pressure down a tube with no waveform CO₂ behind it, before any
 * expert help or oxygen has been organized. The recovery path walks into all
 * four refusals — including forcing a catheter and pulling the whole tube —
 * and still reaches a correct handoff.
 */
export const ACUTE_TRACHEOSTOMY_OBSTRUCTION_FIXTURES = {
  scenarioId: 'acute-tracheostomy-obstruction', contentVersion: '0.1.0', seed: 4917,
  noAction: [],
  expert: [
    [0, 'reconcile-acute-tracheostomy-obstruction-anatomy-and-patency'],
    [1, 'activate-acute-tracheostomy-obstruction-help-and-oxygenation'],
    [2, 'review-acute-tracheostomy-obstruction-device-pathway'],
    [3, 'record-acute-tracheostomy-obstruction-inner-cannula-removal'],
    [4, 'reassess-acute-tracheostomy-obstruction-restoration'],
    [5, 'handoff-acute-tracheostomy-obstruction-reassessment'],
  ],
  commonError: [
    [0, 'reconcile-acute-tracheostomy-obstruction-anatomy-and-patency'],
    [1, 'ventilate-through-unverified-tracheostomy'],
  ],
  recovery: [
    [0, 'reconcile-acute-tracheostomy-obstruction-anatomy-and-patency'],
    [1, 'ventilate-through-unverified-tracheostomy'],
    [2, 'wait-for-acute-tracheostomy-obstruction-imaging'],
    [3, 'activate-acute-tracheostomy-obstruction-help-and-oxygenation'],
    [4, 'review-acute-tracheostomy-obstruction-device-pathway'],
    // The second decision point: the inner cannula is now the declared
    // obstruction, and both shortcuts here cost him the stoma he still has.
    [5, 'force-acute-tracheostomy-obstruction-catheter'],
    [6, 'replace-whole-tracheostomy-first'],
    [7, 'record-acute-tracheostomy-obstruction-inner-cannula-removal'],
    [8, 'reassess-acute-tracheostomy-obstruction-restoration'],
    [9, 'handoff-acute-tracheostomy-obstruction-reassessment'],
  ],
} as const satisfies {
  scenarioId: string; contentVersion: string; seed: number;
  noAction: readonly (readonly [number, AcuteTracheostomyObstructionAction])[];
  expert: readonly (readonly [number, AcuteTracheostomyObstructionAction])[];
  commonError: readonly (readonly [number, AcuteTracheostomyObstructionAction])[];
  recovery: readonly (readonly [number, AcuteTracheostomyObstructionAction])[];
};
