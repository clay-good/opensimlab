import type { ClinicStemiAction } from './clinic-stemi';

/**
 * Reference transcripts for the clinic-STEMI lesson.
 *
 * This engine case authors no refusable choice. The common-error path is the
 * delay the lesson exists to refuse: a complete, careful danger screen with
 * nobody called, and then a reach for the bridge before the route is open. The
 * recovery path takes the unordered pair the other way round and clears the
 * handoff time gate on the second attempt.
 */
export const CLINIC_STEMI_FIXTURES = {
  scenarioId: 'stemi-recognition-and-first-actions', contentVersion: '0.1.1', seed: 3391,
  noAction: [],
  expert: [
    [0, 'reconcile-clinic-stemi-pattern'],
    [1, 'activate-clinic-stemi-transfer'],
    [2, 'screen-clinic-stemi-danger'],
    [3, 'record-clinic-stemi-bridge'],
    [4, 'reassess-clinic-stemi-handoff'],
  ],
  commonError: [
    [0, 'reconcile-clinic-stemi-pattern'],
    // Screening thoroughly while the phone stays on the hook.
    [1, 'screen-clinic-stemi-danger'],
    [2, 'record-clinic-stemi-bridge'],
  ],
  recovery: [
    // The bridge before there is a pattern to bridge from.
    [0, 'record-clinic-stemi-bridge'],
    [1, 'reconcile-clinic-stemi-pattern'],
    // The unordered pair, taken screen-first, then corrected.
    [2, 'screen-clinic-stemi-danger'],
    [3, 'record-clinic-stemi-bridge'],
    [4, 'activate-clinic-stemi-transfer'],
    [5, 'record-clinic-stemi-bridge'],
    // And the handoff time gate, taken too early before it is taken correctly.
    [5, 'reassess-clinic-stemi-handoff'],
    [6, 'reassess-clinic-stemi-handoff'],
  ],
} as const satisfies {
  scenarioId: string; contentVersion: string; seed: number;
  noAction: readonly (readonly [number, ClinicStemiAction])[];
  expert: readonly (readonly [number, ClinicStemiAction])[];
  commonError: readonly (readonly [number, ClinicStemiAction])[];
  recovery: readonly (readonly [number, ClinicStemiAction])[];
};
