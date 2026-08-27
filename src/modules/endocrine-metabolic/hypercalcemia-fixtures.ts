import type { HypercalcemiaAction } from './hypercalcemia';

export const HYPERCALCEMIA_FIXTURES = {
  scenarioId: 'hypercalcemic-crisis-volume-and-bridge', contentVersion: '0.1.0', seed: 4905,
  noAction: [],
  expert: [[0, 'tailored-fluids'], [1, 'calcitonin'], [2, 'assess-cardiorenal'], [3, 'antiresorptive'],
    [4, 'call-support'], [9000, 'reassess'], [144001, 'reassess'], [144002, 'handoff']],
  commonError: [[0, 'unrestricted-fluids'], [1, 'routine-diuretic'], [2, 'wait-for-cause'],
    [3, 'antiresorptive'], [4, 'call-support'], [9000, 'reassess']],
  recovery: [[0, 'unrestricted-fluids'], [1, 'routine-diuretic'], [2, 'wait-for-cause'],
    [3, 'antiresorptive'], [4, 'call-support'], [9000, 'reassess'], [9001, 'tailored-fluids'],
    [9002, 'calcitonin'], [9003, 'assess-cardiorenal'], [9004, 'antiresorptive'],
    [18001, 'reassess'], [153002, 'reassess'], [153003, 'handoff']],
} as const satisfies {
  scenarioId: string; contentVersion: string; seed: number;
  noAction: readonly (readonly [number, HypercalcemiaAction])[];
  expert: readonly (readonly [number, HypercalcemiaAction])[];
  commonError: readonly (readonly [number, HypercalcemiaAction])[];
  recovery: readonly (readonly [number, HypercalcemiaAction])[];
};
