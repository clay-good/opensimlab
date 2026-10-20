/**
 * Candidate modules, as the About page lists them: proposed, not planned
 * (learning/catalog-growth → Candidate Modules Are Published As Proposals).
 *
 * The documents in `docs/module-proposals/` are the record; this mirror exists
 * because the About page renders in the browser and cannot read them. A test
 * holds the two in step, so a proposal cannot advance here without its
 * document earning it.
 */
export interface ModuleProposalSummary {
  readonly id: string;
  readonly title: string;
  readonly status: 'proposed' | 'breadth-test-passed' | 'planned' | 'declined';
  /** What it would need before it could be planned, in one line. */
  readonly needs: string;
  /** How many of the eight required scenario proposals pass the training-value rule. */
  readonly scenarioProposals: number;
}

export const MODULE_PROPOSALS: readonly ModuleProposalSummary[] = [
  { id: 'office-procedural-sedation', title: 'Office-based procedural sedation', status: 'proposed',
    needs: 'a clinic shell, a bounded regional formulary, and a strong analysis against dose inference',
    scenarioProposals: 0 },
  { id: 'older-adult-acute-care', title: 'Acute care of older adults', status: 'proposed',
    needs: 'cognition-state and medication-reconciliation capabilities and a geriatrics review domain',
    scenarioProposals: 0 },
  { id: 'prehospital-ems', title: 'Prehospital and emergency medical services', status: 'proposed',
    needs: 'a prehospital shell with a transport clock, a handoff capability, and an EMS review domain',
    scenarioProposals: 0 },
  { id: 'psychiatric-emergencies-medical', title: 'Psychiatric emergencies with medical physiology',
    status: 'proposed',
    needs: 'a bounded behavioural-state teaching model and psychiatry and emergency review domains',
    scenarioProposals: 0 },
];
