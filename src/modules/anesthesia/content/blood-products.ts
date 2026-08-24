/** Blood products supported by the bounded adult transfusion teaching model. */

export interface BloodProduct {
  readonly id: string;
  readonly name: string;
  readonly kind: 'red-cells' | 'plasma';
  readonly volumeMlPerUnit: number;
  readonly hemoglobinGPerUnit: number;
  readonly presetsUnits: readonly number[];
  readonly maxUnitsTotal: number;
}

export const PACKED_RED_BLOOD_CELLS: BloodProduct = {
  id: 'packed-red-blood-cells',
  name: 'Packed red blood cells',
  kind: 'red-cells',
  volumeMlPerUnit: 300,
  hemoglobinGPerUnit: 60,
  presetsUnits: [1, 2],
  maxUnitsTotal: 2,
};

export const FRESH_FROZEN_PLASMA: BloodProduct = {
  id: 'fresh-frozen-plasma',
  name: 'Fresh frozen plasma',
  kind: 'plasma',
  volumeMlPerUnit: 275,
  hemoglobinGPerUnit: 0,
  presetsUnits: [3, 4],
  maxUnitsTotal: 4,
};

export const BLOOD_PRODUCTS: readonly BloodProduct[] = [PACKED_RED_BLOOD_CELLS, FRESH_FROZEN_PLASMA];
export const MAX_PRBC_UNITS_PER_ACTION = 2;
export const MAX_PRBC_UNITS_TOTAL = 2;

export function getBloodProduct(id: string): BloodProduct | undefined {
  return BLOOD_PRODUCTS.find((product) => product.id === id);
}
