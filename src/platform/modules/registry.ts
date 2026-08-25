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
  /** One sentence: what it teaches. */
  readonly description: string;
  /** Who it is for. */
  readonly audience: string;
  /** What a learner should already know. */
  readonly prerequisites: string;
  readonly status: ModuleStatus;
  /** What a planned module will cover. No date is ever promised. */
  readonly plannedScope?: string;
  readonly timescale: TimescaleDeclaration;
}

export const MODULES: readonly ModuleDeclaration[] = [
  {
    id: 'anesthesia',
    route: 'anesthesia',
    displayName: 'Anesthesia',
    description:
      'Induce and maintain general anaesthesia on a virtual patient, and watch what the drugs '
      + 'actually do to the physiology while you do it.',
    audience: 'Medical students on an anaesthesia rotation, first-year residents, and nurse anaesthetist students.',
    prerequisites: 'Basic cardiovascular and respiratory physiology. No prior anaesthesia experience.',
    status: 'available',
    timescale: { unit: 'seconds', stepSeconds: 0.1, speeds: [1, 2, 5, 60] },
  },
  {
    id: 'emergency-medicine',
    route: 'emergency-medicine',
    displayName: 'Emergency medicine',
    description: 'Planned.',
    audience: 'Medical students, emergency medicine residents, and acute-care trainees.',
    prerequisites: 'Basic cardiovascular and respiratory physiology and initial assessment of an acutely ill adult.',
    status: 'planned',
    plannedScope:
      'Twenty-five bounded emergency-department rehearsals spanning undifferentiated shock, '
      + 'respiratory failure, rhythm emergencies, neurologic deterioration, metabolic crises, '
      + 'toxicology, and trauma, beginning with assessment and reassessment of shock.',
    timescale: { unit: 'minutes', stepSeconds: 1, speeds: [1, 5, 30, 120] },
  },
  {
    id: 'cardiology',
    route: 'cardiology',
    displayName: 'Cardiology',
    description: 'Planned.',
    audience: 'Medical students and residents.',
    prerequisites: 'Basic cardiovascular physiology.',
    status: 'planned',
    plannedScope:
      'Acute coronary syndromes, arrhythmia recognition and management, and the haemodynamics of '
      + 'heart failure, using the same waveform engine and the same compartment solver.',
    timescale: { unit: 'minutes', stepSeconds: 1, speeds: [1, 5, 30, 120] },
  },
  {
    id: 'oncology',
    route: 'oncology',
    displayName: 'Oncology',
    description: 'Planned.',
    audience: 'Medical students and residents.',
    prerequisites: 'Basic pharmacology.',
    status: 'planned',
    plannedScope:
      'Chemotherapy exposure and response over weeks rather than minutes, dose adjustment for organ '
      + 'function, and the management of common toxicities.',
    timescale: { unit: 'days', stepSeconds: 3600, speeds: [1, 24, 168] },
  },
  {
    id: 'critical-care',
    route: 'critical-care',
    displayName: 'Critical care',
    description: 'Planned.',
    audience: 'Residents and advanced practice trainees.',
    prerequisites: 'The anaesthesia module, or equivalent familiarity with ventilation and vasoactive support.',
    status: 'planned',
    plannedScope:
      'Ventilator management, shock states, and sedation over hours, reusing the physiology layer '
      + 'with a longer timescale.',
    timescale: { unit: 'hours', stepSeconds: 60, speeds: [1, 10, 60, 360] },
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
