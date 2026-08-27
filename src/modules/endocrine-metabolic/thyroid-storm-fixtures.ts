import type { ThyroidStormAction } from './thyroid-storm';

export const THYROID_FIXTURES = {
  scenarioId: 'thyroid-storm-hemodynamic-risk', contentVersion: '0.1.0', seed: 4903,
  noAction: [],
  expert: [[0, 'synthesis-blockade'], [1, 'supportive-care'], [2, 'call-support'], [3, 'assess-circulation'],
    [4, 'rate-control-review'], [36000, 'iodine'], [108000, 'reassess'], [108001, 'handoff']],
  commonError: [[0, 'wait-for-labs'], [1, 'blanket-beta-blockade'], [2, 'iodine'],
    [3, 'call-support'], [3000, 'reassess']],
  recovery: [[0, 'wait-for-labs'], [1, 'blanket-beta-blockade'], [2, 'iodine'],
    [3, 'call-support'], [3000, 'reassess'], [3001, 'synthesis-blockade'], [3002, 'supportive-care'],
    [3003, 'assess-circulation'], [3004, 'rate-control-review'], [39001, 'iodine'],
    [111001, 'reassess'], [111002, 'handoff']],
} as const satisfies {
  scenarioId: string; contentVersion: string; seed: number;
  noAction: readonly (readonly [number, ThyroidStormAction])[];
  expert: readonly (readonly [number, ThyroidStormAction])[];
  commonError: readonly (readonly [number, ThyroidStormAction])[];
  recovery: readonly (readonly [number, ThyroidStormAction])[];
};
