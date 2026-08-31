/**
 * The module registry (platform/module-contract).
 *
 * A specialty module declares its route segment, display name, description,
 * audience and status. The landing page's module directory renders from these
 * declarations rather than from a hand-maintained list, and a new module mounts
 * by registration alone.
 *
 * The platform contains no specialty-specific logic. Nothing in this file names a
 * drug, an index, or a ventilator.
 */

export type ModuleStatus = 'available' | 'planned';

export interface TimescaleDeclaration {
  /** The unit the module's clock is displayed in. */
  readonly unit: 'seconds' | 'minutes' | 'hours' | 'days';
  /** Solver step size in seconds, set from the declaration rather than fixed. */
  readonly stepSeconds: number;
  /** Speed multipliers appropriate to this timescale. */
  readonly speeds: readonly number[];
}

export interface ModuleDeclaration {
  readonly id: string;
  /** The route segment, without a leading slash. */
  readonly route: string;
  readonly displayName: string;
  readonly status: ModuleStatus;
  /**
   * How many scenarios the module ships, declared here rather than counted from
   * the scenario arrays.
   *
   * The front door shows this number beside every module name, and the front
   * door is budgeted separately and forbidden from importing a single scenario
   * file (`tests/integration/landing-bundle.test.ts`). A declared count is the
   * only way it can state one. `tests/unit/discoverability.test.ts` asserts each
   * declaration against the real array length, so a scenario added without
   * updating this number fails the build rather than under-selling the module.
   *
   * A planned module declares zero.
   */
  readonly scenarioCount: number;
  readonly timescale: TimescaleDeclaration;
}

export const MODULES: readonly ModuleDeclaration[] = [
  {
    id: 'anesthesia',
    route: 'anesthesia',
    displayName: 'Anesthesia',
    status: 'available',
    scenarioCount: 39,
    timescale: { unit: 'seconds', stepSeconds: 0.1, speeds: [1, 2, 5, 60] },
  },
  {
    id: 'emergency-medicine',
    route: 'emergency-medicine',
    displayName: 'Emergency medicine',
    status: 'available',
    scenarioCount: 25,
    timescale: { unit: 'seconds', stepSeconds: 0.1, speeds: [1, 2, 5, 60] },
  },
  {
    id: 'cardiology',
    route: 'cardiology',
    displayName: 'Cardiology',
    status: 'available',
    scenarioCount: 17,
    timescale: { unit: 'minutes', stepSeconds: 1, speeds: [1, 5, 30, 120] },
  },
  {
    id: 'respiratory-medicine',
    route: 'respiratory-medicine',
    displayName: 'Respiratory medicine',
    status: 'available',
    scenarioCount: 15,
    timescale: { unit: 'seconds', stepSeconds: 0.1, speeds: [1, 2, 5, 60] },
  },
  {
    id: 'pediatrics',
    route: 'pediatrics',
    displayName: 'Pediatrics',
    status: 'available',
    scenarioCount: 16,
    timescale: { unit: 'seconds', stepSeconds: 0.1, speeds: [1, 2, 5, 60] },
  },
  {
    id: 'neurology',
    route: 'neurology',
    displayName: 'Neurology',
    status: 'available',
    scenarioCount: 15,
    timescale: { unit: 'seconds', stepSeconds: 0.1, speeds: [1, 2, 5, 60] },
  },
  {
    id: 'toxicology',
    route: 'toxicology',
    displayName: 'Toxicology',
    status: 'available',
    scenarioCount: 15,
    timescale: { unit: 'seconds', stepSeconds: 0.1, speeds: [1, 2, 5, 60] },
  },
  {
    id: 'obstetrics',
    route: 'obstetrics',
    displayName: 'Obstetrics',
    status: 'available',
    scenarioCount: 15,
    timescale: { unit: 'seconds', stepSeconds: 0.1, speeds: [1, 2, 5, 60] },
  },
  {
    id: 'neonatology',
    route: 'neonatology',
    displayName: 'Neonatology',
    status: 'available',
    scenarioCount: 11,
    timescale: { unit: 'seconds', stepSeconds: 0.1, speeds: [1, 2, 5, 60] },
  },
  {
    id: 'endocrine-metabolic',
    route: 'endocrine-metabolic',
    displayName: 'Endocrine and metabolic medicine',
    status: 'available',
    scenarioCount: 12,
    timescale: { unit: 'seconds', stepSeconds: 0.1, speeds: [1, 2, 5, 60] },
  },
  {
    id: 'renal-electrolyte',
    route: 'renal-electrolyte',
    displayName: 'Renal and electrolyte medicine',
    status: 'available',
    scenarioCount: 6,
    timescale: { unit: 'seconds', stepSeconds: 0.1, speeds: [1, 2, 5, 60] },
  },
  {
    id: 'infectious-disease',
    route: 'infectious-disease',
    displayName: 'Infectious disease',
    status: 'available',
    scenarioCount: 10,
    timescale: { unit: 'seconds', stepSeconds: 0.1, speeds: [1, 2, 5, 60] },
  },
  {
    id: 'medical-surgical-nursing',
    route: 'medical-surgical-nursing',
    displayName: 'Nursing',
    status: 'available',
    scenarioCount: 9,
    timescale: { unit: 'seconds', stepSeconds: 0.1, speeds: [1, 2, 5, 60] },
  },
  {
    id: 'oncology',
    route: 'oncology',
    displayName: 'Oncology',
    status: 'available',
    scenarioCount: 11,
    // The planned entry assumed chemotherapy over weeks. The lessons this module actually
    // opens with run in minutes of simulated ward and clinic time, like every other module.
    timescale: { unit: 'seconds', stepSeconds: 0.1, speeds: [1, 2, 5, 60] },
  },
  {
    id: 'surgery-trauma',
    route: 'surgery-trauma',
    displayName: 'Surgery and trauma',
    status: 'planned',
    scenarioCount: 0,
    timescale: { unit: 'seconds', stepSeconds: 0.1, speeds: [1, 2, 5, 60] },
  },
  {
    id: 'critical-care',
    route: 'critical-care',
    displayName: 'Critical care',
    status: 'available',
    scenarioCount: 24,
    timescale: { unit: 'seconds', stepSeconds: 0.1, speeds: [1, 2, 5, 60] },
  },
];

export function getModule(id: string): ModuleDeclaration {
  const module = MODULES.find((candidate) => candidate.id === id);
  if (!module) throw new Error(`Unknown module: ${id}`);
  return module;
}

export function availableModules(): ModuleDeclaration[] {
  return MODULES.filter((module) => module.status === 'available');
}

export function plannedModules(): ModuleDeclaration[] {
  return MODULES.filter((module) => module.status === 'planned');
}

/**
 * Where a visitor is pointed when they want to know when a planned module ships.
 * No email address is requested, because collecting one would breach the privacy
 * architecture.
 */
export const RELEASE_FEED_URL = 'https://github.com/clay-good/opensimlab/releases';

/** Speed multipliers for a module, from its own timescale declaration. */
export function speedsFor(module: ModuleDeclaration): readonly number[] {
  return module.timescale.speeds;
}
