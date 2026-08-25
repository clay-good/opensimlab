/**
 * The rhythm library (engine/waveform-synthesis → Rhythm Library With Named Morphologies).
 *
 * Each rhythm is a declared parameter set over the McSharry events, plus a
 * declaration of whether it produces a mechanical pulse, plus the published or
 * textbook source describing that morphology so a reviewer can compare rather
 * than judge from memory.
 */

import { MCSHARRY_TABLE_1, type BeatMorphology, type EcgEvent } from './ecg';
import type { RhythmId } from './types';

export interface RhythmDefinition {
  readonly id: RhythmId;
  /** Learner-facing name, also used as the non-visual description of the trace. */
  readonly name: string;
  readonly morphology: BeatMorphology;
  /** Typical rate range in beats per minute, used to sanity-check a scenario. */
  readonly rateRangeBpm: readonly [number, number];
  /** Whether the numeric heart rate can be derived from this trace at all. */
  readonly rateIsMeasurable: boolean;
  /** Source describing this morphology, for the face-validity review. */
  readonly source: string;
  /** One sentence a screen reader can read in place of the trace. */
  readonly morphologyDescription: string;
}

const table = (overrides: Partial<Record<EcgEvent['name'], Partial<EcgEvent>>>): EcgEvent[] =>
  MCSHARRY_TABLE_1.map((event) => ({ ...event, ...(overrides[event.name] ?? {}) }));

const RHYTHM_LIST: readonly RhythmDefinition[] = Object.freeze([
  {
    id: 'sinus',
    name: 'Normal sinus rhythm',
    morphology: { events: table({}), mechanicalPulse: true },
    rateRangeBpm: [60, 100],
    rateIsMeasurable: true,
    source: 'McSharry et al. IEEE Trans Biomed Eng 2003;50:289-94, Table 1.',
    morphologyDescription:
      'Regular narrow complexes, each preceded by a P wave, with an upright T wave.',
  },
  {
    id: 'sinus-bradycardia',
    name: 'Sinus bradycardia',
    morphology: { events: table({}), mechanicalPulse: true },
    rateRangeBpm: [30, 59],
    rateIsMeasurable: true,
    source: 'Same morphology as sinus rhythm at a rate below 60; standard electrocardiography texts.',
    morphologyDescription: 'Sinus morphology at a slow rate, with a long diastolic interval.',
  },
  {
    id: 'sinus-tachycardia',
    name: 'Sinus tachycardia',
    morphology: { events: table({}), mechanicalPulse: true },
    rateRangeBpm: [101, 150],
    rateIsMeasurable: true,
    source: 'Same morphology as sinus rhythm above 100; QT shortens per the Bazett relationship.',
    morphologyDescription: 'Sinus morphology at a fast rate, with a shortened T-P interval.',
  },
  {
    id: 'atrial-fibrillation',
    name: 'Atrial fibrillation',
    morphology: { events: table({ P: { a: 0 } }), mechanicalPulse: true },
    rateRangeBpm: [60, 160],
    rateIsMeasurable: true,
    source: 'Absent P waves with an irregularly irregular ventricular response; standard texts.',
    morphologyDescription:
      'Irregularly irregular narrow complexes with no discernible P waves.',
  },
  {
    id: 'svt',
    name: 'Supraventricular tachycardia',
    morphology: { events: table({ P: { a: 0 }, T: { a: 0.5 } }), mechanicalPulse: true },
    rateRangeBpm: [150, 220],
    rateIsMeasurable: true,
    source: 'Regular narrow-complex tachycardia with P waves buried in the preceding T wave.',
    morphologyDescription: 'Very regular, very fast narrow complexes with no visible P waves.',
  },
  {
    id: 'first-degree-block',
    name: 'First-degree atrioventricular block',
    // A longer PR interval: the P event sits further back on the cycle.
    morphology: { events: table({ P: { theta: -Math.PI / 2.1 } }), mechanicalPulse: true },
    rateRangeBpm: [50, 100],
    rateIsMeasurable: true,
    source: 'PR interval prolonged beyond 200 ms with every P conducted; standard texts.',
    morphologyDescription: 'Sinus rhythm with a visibly long interval between P wave and complex.',
  },
  {
    id: 'complete-heart-block',
    name: 'Complete heart block',
    morphology: {
      events: table({ P: { a: 0 }, Q: { b: 0.14 }, R: { a: 22, b: 0.16 }, S: { b: 0.16 } }),
      mechanicalPulse: true,
      atrialRateBpm: 82,
    },
    rateRangeBpm: [25, 45],
    rateIsMeasurable: true,
    source:
      'Atrioventricular dissociation: regular P waves and a slower, regular escape rhythm, unrelated to each other.',
    morphologyDescription:
      'Slow wide escape complexes with regular P waves marching through them, unrelated to the complexes.',
  },
  {
    id: 'torsades-de-pointes',
    name: 'Torsades de pointes',
    morphology: {
      events: table({
        P: { a: 0 }, Q: { a: -2, b: 0.28 }, R: { a: 17, b: 0.32 },
        S: { a: -7, b: 0.34 }, T: { a: -1, b: 0.48 },
      }),
      mechanicalPulse: true,
      torsadesTwist: true,
    },
    rateRangeBpm: [180, 300],
    rateIsMeasurable: true,
    source: 'Polymorphic ventricular tachycardia with wide complexes that change axis and amplitude around the baseline in long-QT context; 2025 AHA adult advanced life support guideline.',
    morphologyDescription:
      'Rapid wide polymorphic complexes wax, wane, and rotate around the baseline.',
  },
  {
    id: 'ventricular-tachycardia',
    name: 'Ventricular tachycardia',
    morphology: {
      events: table({
        P: { a: 0 },
        Q: { a: -3, b: 0.3 },
        R: { a: 18, b: 0.32 },
        S: { a: -8, b: 0.34 },
        T: { a: -1.2, b: 0.5 },
      }),
      mechanicalPulse: true,
    },
    rateRangeBpm: [140, 220],
    rateIsMeasurable: true,
    source: 'Broad monomorphic complexes at a fast regular rate with discordant T waves.',
    morphologyDescription: 'Fast, wide, uniform complexes with no P waves.',
  },
  {
    id: 'ventricular-fibrillation',
    name: 'Ventricular fibrillation',
    morphology: { events: table({}), mechanicalPulse: false },
    rateRangeBpm: [0, 0],
    rateIsMeasurable: false,
    source: 'Chaotic undulation with no identifiable complexes; standard texts.',
    morphologyDescription:
      'Chaotic coarse undulation with no identifiable complexes and no measurable rate.',
  },
  {
    id: 'asystole',
    name: 'Asystole',
    morphology: { events: table({}), mechanicalPulse: false },
    rateRangeBpm: [0, 0],
    rateIsMeasurable: false,
    source: 'A flat line with only baseline noise.',
    morphologyDescription: 'A flat trace with only low-amplitude baseline noise.',
  },
  {
    id: 'pea',
    name: 'Pulseless electrical activity',
    // Organized electrical activity that ejects no blood: the entire diagnostic point.
    morphology: { events: table({}), mechanicalPulse: false },
    rateRangeBpm: [20, 100],
    rateIsMeasurable: true,
    source:
      'Organized electrical activity without a mechanical pulse; the electrocardiogram alone cannot make the diagnosis.',
    morphologyDescription:
      'Organized complexes on the electrocardiogram with a flat arterial trace and no pulsatile plethysmogram.',
  },
  {
    id: 'paced',
    name: 'Ventricular paced rhythm',
    morphology: {
      events: table({ P: { a: 0 }, Q: { b: 0.13 }, R: { a: 20, b: 0.15 }, S: { a: -9, b: 0.17 }, T: { a: -0.8 } }),
      mechanicalPulse: true,
      pacingSpike: true,
    },
    rateRangeBpm: [60, 90],
    rateIsMeasurable: true,
    source: 'A narrow pacing artifact preceding a broad ventricular complex with discordant repolarization.',
    morphologyDescription: 'A sharp pacing spike before each wide complex, at a fixed regular rate.',
  },
]);

export const RHYTHMS: ReadonlyMap<RhythmId, RhythmDefinition> = new Map(
  RHYTHM_LIST.map((rhythm) => [rhythm.id, rhythm]),
);

export function getRhythm(id: RhythmId): RhythmDefinition {
  const rhythm = RHYTHMS.get(id);
  if (!rhythm) throw new Error(`Unknown rhythm: ${id}`);
  return rhythm;
}

export const RHYTHM_IDS: readonly RhythmId[] = RHYTHM_LIST.map((r) => r.id);
