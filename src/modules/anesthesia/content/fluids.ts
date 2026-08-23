/** Fluids supported by the current circulation teaching model. */

export interface FluidProduct {
  readonly id: string;
  readonly name: string;
  readonly presetsMl: readonly number[];
  readonly retainedFraction: number;
}

export const FLUIDS: readonly FluidProduct[] = [
  {
    id: 'balanced-crystalloid',
    name: 'Balanced crystalloid',
    presetsMl: [250, 500, 1000],
    retainedFraction: 0.25,
  },
];

/** Larger single entries are rejected as input errors rather than treated as physiology. */
export const MAX_FLUID_BOLUS_ML = 5000;

export function getFluid(id: string): FluidProduct | undefined {
  return FLUIDS.find((fluid) => fluid.id === id);
}
