/** Blood products supported by the bounded adult transfusion teaching model. */

export interface BloodProduct {
  readonly id: string;
  readonly name: string;
  readonly volumeMlPerUnit: number;
  readonly hemoglobinGPerUnit: number;
  readonly presetsUnits: readonly number[];
}

export const PACKED_RED_BLOOD_CELLS: BloodProduct = {
  id: 'packed-red-blood-cells',
  name: 'Packed red blood cells',
  volumeMlPerUnit: 300,
  hemoglobinGPerUnit: 60,
  presetsUnits: [1, 2],
};

export const BLOOD_PRODUCTS: readonly BloodProduct[] = [PACKED_RED_BLOOD_CELLS];
export const MAX_PRBC_UNITS_PER_ACTION = 2;
export const MAX_PRBC_UNITS_TOTAL = 2;

export function getBloodProduct(id: string): BloodProduct | undefined {
  return BLOOD_PRODUCTS.find((product) => product.id === id);
}
