import type { MyxedemaAction } from './myxedema';

export const MYXEDEMA_FIXTURES = {
  scenarioId: 'myxedema-coma-ventilation-and-steroid-sequence', contentVersion: '0.1.1', seed: 4904,
  noAction: [],
  expert: [[0, 'ventilate'], [1, 'hydrocortisone'], [2, 'levothyroxine'], [3, 'supportive-care'],
    [4, 'call-support'], [3000, 'reassess'], [36004, 'reassess'], [36005, 'handoff']],
  commonError: [[0, 'oxygen-only'], [1, 'levothyroxine'], [2, 'wait-for-labs'], [3, 'rapid-rewarming'],
    [4, 'call-support'], [3000, 'reassess']],
  recovery: [[0, 'oxygen-only'], [1, 'levothyroxine'], [2, 'wait-for-labs'], [3, 'rapid-rewarming'],
    [4, 'call-support'], [3000, 'reassess'], [9001, 'ventilate'], [9002, 'hydrocortisone'],
    [9003, 'levothyroxine'], [9004, 'supportive-care'], [12001, 'reassess'], [45004, 'reassess'], [45005, 'handoff']],
} as const satisfies {
  scenarioId: string; contentVersion: string; seed: number;
  noAction: readonly (readonly [number, MyxedemaAction])[];
  expert: readonly (readonly [number, MyxedemaAction])[];
  commonError: readonly (readonly [number, MyxedemaAction])[];
  recovery: readonly (readonly [number, MyxedemaAction])[];
};
