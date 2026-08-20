/**
 * The validation report (engine/validation → A Public Validation Report).
 *
 * One document that answers "should I trust this?" with numbers, citations,
 * tolerances, and an EXPLICIT unvalidated list. Regenerated each release. It is
 * generated from the same constants the tests assert against, so it cannot drift
 * from what the code actually does.
 */

import { RESPIRATORY_PROFILES, timeToDesaturationMinutes } from '@anesthesia/physiology';
import { MODELS, MODEL_SET_REVISION } from '@anesthesia/pharmacology/registry';
import { macForAge } from '@anesthesia/pharmacology/pd';
import { ENGINE_VERSION } from '@anesthesia/engine';

export interface Benchmark {
  readonly id: string;
  readonly name: string;
  readonly citation: string;
  readonly expected: string;
  readonly observed: string;
  readonly tolerance: string;
  readonly passes: boolean;
}

/**
 * The Varvel framework (Varvel JR, Donoho DL, Shafer SL. J Pharmacokinet Biopharm
 * 1992;20:63-94, PMID 1588504) is the field's standard for computer-controlled
 * infusion performance:
 *
 *   PE_ij        = 100 * (C_obs,ij - C_pred,ij) / C_pred,ij
 *   MDPE_i       = median_j(PE_ij)                bias
 *   MDAPE_i      = median_j(|PE_ij|)              inaccuracy
 *   wobble_i     = median_j(|PE_ij - MDPE_i|)     intra-individual variability
 *   divergence_i = slope of |PE_ij| against t_j   drift, in percent per hour
 */
export interface VarvelResult {
  readonly modelId: string;
  readonly dataset: string | null;
  readonly subjects: number | null;
  readonly samples: number | null;
  readonly mdpe: number | null;
  readonly mdape: number | null;
  readonly wobble: number | null;
  readonly divergence: number | null;
  /** Stated explicitly where no open observed dataset exists. */
  readonly note: string;
}

export function varvelResults(): VarvelResult[] {
  return MODELS.map((model) => ({
    modelId: model.id,
    dataset: null,
    subjects: null,
    samples: null,
    mdpe: null,
    mdape: null,
    wobble: null,
    divergence: null,
    note:
      'NOT VALIDATED AGAINST OBSERVED DATA. No openly licensed dataset of observed concentrations '
      + 'has been obtained for this model, so no MDPE, MDAPE, wobble or divergence is reported. '
      + 'Agreement with another model is not substituted for validation, and this line will stay '
      + 'here until real observed data is analysed.',
  }));
}

/** Physiological benchmarks, each encoded as an automated test with its citation. */
export function physiologicalBenchmarks(): Benchmark[] {
  const apnea = (['healthy', 'moderately-ill', 'obese'] as const).map((profile) => {
    const expected = profile === 'healthy' ? 8 : profile === 'moderately-ill' ? 5 : 2.7;
    const observed = timeToDesaturationMinutes(RESPIRATORY_PROFILES[profile], { preoxygenated: true });
    return {
      id: `apnea-${profile}`,
      name: `Time to 90% saturation after preoxygenated apnoea, ${profile.replace('-', ' ')} adult`,
      citation: 'Benumof JL, Dagg R, Benumof R. Anesthesiology 1997;87:979-82. PMID 9357902.',
      expected: `${expected} minutes`,
      observed: `${observed.toFixed(2)} minutes`,
      tolerance: '±20%',
      passes: Math.abs(observed - expected) / expected <= 0.2,
    };
  });

  const macRatio = macForAge('sevoflurane', 80) / macForAge('sevoflurane', 40);
  const macExpected = Math.pow(10, -0.00269 * 40);

  return [
    ...apnea,
    {
      id: 'iso-mac-age',
      name: 'Age-related minimum alveolar concentration, sevoflurane, 40 to 80 years',
      citation: 'Nickalls RWD, Mapleson WW. Br J Anaesth 2003;91:170-4.',
      expected: `ratio ${macExpected.toFixed(4)}`,
      observed: `ratio ${macRatio.toFixed(4)}`,
      tolerance: '±1%',
      passes: Math.abs(macRatio - macExpected) / macExpected <= 0.01,
    },
  ];
}

export interface UnvalidatedItem {
  readonly item: string;
  readonly reason: string;
}

/** What is NOT validated. Stated explicitly rather than glossed. */
export const UNVALIDATED: readonly UnvalidatedItem[] = [
  {
    item: 'Every pharmacokinetic model in this build',
    reason: 'No openly licensed observed-concentration dataset has been analysed, so no Varvel '
      + 'performance metric is reported for any model.',
  },
  {
    item: 'Every parameter transcription',
    reason: 'Transcribed from the primary publications but not yet independently checked by a '
      + 'second person against a second source, which this project requires before a model may be '
      + 'called published.',
  },
  {
    item: 'The arterial pressure, capnogram and plethysmogram generators',
    reason: 'No published dynamical model equivalent to McSharry exists for these three, so they '
      + 'are Open Sim Lab constructions. They are the most likely items to fail clinical review.',
  },
  {
    item: 'The propofol–remifentanil interaction coefficient',
    reason: 'The Greco interaction FORM is published; the coefficient here is an Open Sim Lab '
      + 'calibration against the observed magnitude of the interaction, not a transcribed value.',
  },
  {
    item: 'Face validity',
    reason: 'The expert face-validity review this development change ends at has not been run. '
      + 'No clinician has rated any waveform or any physiological response.',
  },
  {
    item: 'Educational effectiveness',
    reason: 'No evaluation has been run. The published evidence that screen-based simulation with '
      + 'debriefing improves subsequent performance (Schwid et al., PMID 11302037) is evidence '
      + 'about screen-based simulation in general, not about this product.',
  },
  {
    item: 'The self-hosted type',
    reason: 'Inter and JetBrains Mono are declared with their Latin subsets and their 120 KB budget, '
      + 'but the font files are not yet vendored, so both families currently fall through to the '
      + 'platform system stack. `docs/fonts.md` records the procedure.',
  },
  {
    item: 'Screen reader narration',
    reason: 'Keyboard operability, visible focus, accessible names, target sizes and reflow to '
      + '360 by 780 CSS pixels have been exercised in a browser and are asserted by automated '
      + 'tests. Narration by an actual screen reader has not been listened to by a person, which '
      + 'is the part automation cannot cover. `docs/accessibility-audit.md` records the split.',
  },
  {
    item: 'The frame budget on the reference device',
    reason: 'The harness at /frame-budget exists and the measurement procedure is defined, but no '
      + 'result from a physical mid-range 2020 Android handset has been committed.',
  },
];

export interface ValidationReport {
  readonly engineVersion: string;
  readonly modelSetRevision: string;
  readonly varvel: readonly VarvelResult[];
  readonly benchmarks: readonly Benchmark[];
  readonly unvalidated: readonly UnvalidatedItem[];
  readonly faceValidity: {
    readonly reviewers: number;
    readonly required: number;
    readonly status: string;
  };
  readonly reproduce: string;
}

export function buildValidationReport(): ValidationReport {
  return {
    engineVersion: ENGINE_VERSION,
    modelSetRevision: MODEL_SET_REVISION,
    varvel: varvelResults(),
    benchmarks: physiologicalBenchmarks(),
    unvalidated: UNVALIDATED,
    faceValidity: {
      reviewers: 0,
      required: 3,
      status: 'Not run. The editorial board is empty and recruitment is ongoing.',
    },
    reproduce:
      'Every number in the benchmark table is produced by `npm run test`, from the same constants '
      + 'the application uses. Clone the repository and run it to reproduce them on your own machine.',
  };
}
