/**
 * TypeScript types mirroring the scenario JSON Schema.
 *
 * The schema in `schema.ts` is the authority for a hand-authored file; these
 * types are the authority for source that consumes one. A scenario file is
 * validated against the schema at load time, so the cast to these types is safe.
 */

import type { EventType } from './event-types';
import type { ContentMaturity } from '@platform/catalog/maturity';

export interface ScenarioObjective {
  readonly id: string;
  readonly statement: string;
  readonly measure: string;
}

export interface ClinicalReviewRecord {
  readonly reviewer: string;
  readonly credential: string;
  readonly institution?: string;
  readonly competingInterests?: string;
  readonly reviewedOn: string;
  readonly reviewBy: string;
  readonly contentVersion: string;
  readonly sources: readonly string[];
}

export interface ScenarioMetadata {
  readonly id: string;
  readonly version: string;
  readonly maturity: ContentMaturity;
  readonly title: string;
  readonly author: string;
  readonly license: string;
  readonly estimatedMinutes: number;
  readonly difficulty: 'introductory' | 'intermediate' | 'advanced';
  readonly objectives: readonly ScenarioObjective[];
  readonly clinicalReview: ClinicalReviewRecord;
  readonly limitations?: readonly string[];
}

export interface PatientBaseline {
  readonly heartRateBpm: number;
  readonly meanArterialMmHg: number;
  readonly strokeVolumeMl: number;
  readonly hemoglobinGPerDl: number;
  readonly bloodVolumeMl: number;
  readonly coreTemperatureC: number;
  readonly arterialStiffness: number;
  readonly baroreflexGain: number;
  readonly fixedStrokeVolume: boolean;
}

export interface ScenarioPatient {
  readonly ageYears: number;
  readonly sex: 'male' | 'female';
  readonly heightCm: number;
  readonly weightKg: number;
  readonly asaClass: number;
  readonly diagnosis: string;
  readonly procedure: string;
  readonly comorbidities?: readonly string[];
  readonly medications?: readonly string[];
  readonly allergies?: readonly string[];
  readonly fasting?: string;
  readonly baseline: PatientBaseline;
  readonly airway: {
    readonly difficulty: number;
    readonly difficultMaskVentilation: boolean;
    readonly assessment?: string;
  };
  readonly respiratory: { readonly profile: 'healthy' | 'moderately-ill' | 'obese' | 'healthy-child' };
}

export interface ScenarioEquipment {
  readonly monitoring: readonly string[];
  readonly ventilator: {
    readonly mode: 'volume-control' | 'pressure-control' | 'manual';
    readonly fio2: number;
    readonly tidalVolumeMl: number;
    readonly respiratoryRateBpm: number;
    readonly freshGasFlowLPerMin?: number;
    readonly delivering: boolean;
  };
}

export interface FormularyPreset {
  readonly label: string;
  readonly amount: number;
  readonly unit: string;
}

export interface FormularyEntry {
  readonly drugId: string;
  readonly modelId?: string;
  /** Which cockpit trays may administer this drug. Omitted means both. */
  readonly deliveryModes?: readonly ('bolus' | 'infusion')[];
  readonly concentration: number;
  readonly concentrationUnit: string;
  readonly syringeVolumeMl: number;
  readonly typicalDose: number;
  readonly presets: readonly FormularyPreset[];
}

export interface TimelineEvent {
  readonly id: string;
  readonly type: EventType;
  readonly atTick?: number;
  readonly when?: string;
  readonly repeatable?: boolean;
  readonly value?: number;
  readonly durationTicks?: number;
  /**
   * What the event acts on, for the types that need naming rather than sizing:
   * the rhythm for `rhythm-change`, the artifact for `artifact`, and which piece
   * of equipment failed for `equipment-failure`.
   */
  readonly target?: string;
  readonly message?: string;
  readonly severity?: 'info' | 'advisory' | 'warning' | 'critical' | 'artifact';
}

export interface RubricItem {
  readonly id: string;
  readonly objectiveId: string;
  readonly question: string;
  readonly concept?: string;
}

export interface Scenario {
  readonly schemaVersion: number;
  readonly metadata: ScenarioMetadata;
  readonly patient: ScenarioPatient;
  readonly equipment: ScenarioEquipment;
  readonly formulary: readonly FormularyEntry[];
  readonly timeline: readonly TimelineEvent[];
  readonly debrief: { readonly rubric: readonly RubricItem[] };
}
