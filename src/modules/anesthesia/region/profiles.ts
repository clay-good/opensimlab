/**
 * Practice region profiles (platform/practice-region).
 *
 * Each profile is a declarative, versioned data file carrying its own clinical
 * review record. Adding a region requires no code change.
 *
 * Two regions ship in this alpha, chosen deliberately because they differ on
 * exactly the axis that matters: the United States profile has no routine
 * target-controlled infusion, so the region mechanism is exercised rather than
 * merely present.
 */

export interface GuidelineReference {
  readonly name: string;
  readonly issuingBody: string;
  readonly version: string;
  readonly pmid?: string;
}

export interface FormularyPresentation {
  readonly drugId: string;
  /** International Nonproprietary Name. */
  readonly inn: string;
  /** What the drug is commonly called in this region, when it differs. */
  readonly regionalSynonym?: string;
  /** Stable identifiers so a learner can confirm the agent. */
  readonly atc?: string;
  readonly unii?: string;
  /** Standard concentration in this region, stated as mass per volume. */
  readonly concentration: number;
  readonly concentrationUnit: string;
  readonly syringeVolumeMl: number;
}

export interface RegionProfile {
  readonly id: string;
  readonly version: string;
  readonly name: string;
  /** Browser language tags this profile is the best guess for. */
  readonly localeHints: readonly string[];
  readonly unitSystem: 'si' | 'conventional';
  readonly dateFormat: string;
  /** Spellings and terms this region uses in clinical practice. */
  readonly terminology: Readonly<Record<string, string>>;
  readonly targetControlledInfusion: {
    readonly routine: boolean;
    /** The reason, stated to the learner rather than hidden. */
    readonly note: string;
  };
  readonly airwayGuideline: GuidelineReference;
  readonly formulary: readonly FormularyPresentation[];
  /** Agents not available here, with what is used instead. */
  readonly unavailable: readonly { readonly drugId: string; readonly insteadNote: string }[];
  readonly clinicalReview: {
    readonly reviewer: string;
    readonly credential: string;
    readonly reviewedOn: string;
    readonly reviewBy: string;
    /** How much of the profile has been reviewed, stated honestly. */
    readonly completeness: 'complete' | 'partial' | 'unreviewed';
  };
}

export const UNITED_STATES: RegionProfile = {
  id: 'US',
  version: '0.1.0',
  name: 'United States',
  localeHints: ['en-US'],
  unitSystem: 'conventional',
  dateFormat: 'MM/DD/YYYY',
  terminology: {
    anesthesia: 'anesthesia',
    anesthetist: 'anesthesiologist',
    epinephrine: 'epinephrine',
    salbutamol: 'albuterol',
    'operating-room': 'operating room',
    paracetamol: 'acetaminophen',
  },
  targetControlledInfusion: {
    routine: false,
    note: 'Not FDA-approved for routine use in the United States. Manual weight-based infusion '
      + 'schemes are used instead. Target-controlled infusion is available here as a clearly '
      + 'labelled out-of-region learning module, because you may rotate abroad or read '
      + 'literature from a region where it is standard.',
  },
  airwayGuideline: {
    name: 'Practice Guidelines for Management of the Difficult Airway',
    issuingBody: 'American Society of Anesthesiologists',
    version: '2022',
    pmid: '34762729',
  },
  formulary: [
    { drugId: 'propofol', inn: 'propofol', atc: 'N01AX10', concentration: 10, concentrationUnit: 'mg/mL', syringeVolumeMl: 20 },
    { drugId: 'remifentanil', inn: 'remifentanil', atc: 'N01AH06', concentration: 50, concentrationUnit: 'µg/mL', syringeVolumeMl: 20 },
  ],
  unavailable: [],
  clinicalReview: {
    reviewer: 'UNSIGNED',
    credential: 'UNSIGNED',
    reviewedOn: '1970-01-01',
    reviewBy: '1970-01-01',
    completeness: 'unreviewed',
  },
};

export const UNITED_KINGDOM: RegionProfile = {
  id: 'GB',
  version: '0.1.0',
  name: 'United Kingdom',
  localeHints: ['en-GB', 'en-IE'],
  unitSystem: 'si',
  dateFormat: 'DD/MM/YYYY',
  terminology: {
    anesthesia: 'anaesthesia',
    anesthetist: 'anaesthetist',
    epinephrine: 'adrenaline',
    salbutamol: 'salbutamol',
    'operating-room': 'operating theatre',
    paracetamol: 'paracetamol',
  },
  targetControlledInfusion: {
    routine: true,
    note: 'Target-controlled infusion is routine practice here, with plasma and effect-site '
      + 'targeting both in common use. The computed rates are a teaching simulation and are '
      + 'not a dosing recommendation for any real patient.',
  },
  airwayGuideline: {
    name: 'Difficult Airway Society guidelines for management of unanticipated difficult intubation in adults',
    issuingBody: 'Difficult Airway Society',
    version: '2015',
    pmid: '26556848',
  },
  formulary: [
    { drugId: 'propofol', inn: 'propofol', atc: 'N01AX10', concentration: 10, concentrationUnit: 'mg/mL', syringeVolumeMl: 50 },
    { drugId: 'remifentanil', inn: 'remifentanil', atc: 'N01AH06', concentration: 50, concentrationUnit: 'µg/mL', syringeVolumeMl: 50 },
  ],
  unavailable: [],
  clinicalReview: {
    reviewer: 'UNSIGNED',
    credential: 'UNSIGNED',
    reviewedOn: '1970-01-01',
    reviewBy: '1970-01-01',
    completeness: 'unreviewed',
  },
};

export const REGIONS: readonly RegionProfile[] = [UNITED_STATES, UNITED_KINGDOM];

/** Regions with no profile are listed as unrepresented rather than omitted. */
export const UNREPRESENTED_NOTE =
  'Only United States and United Kingdom profiles ship in this alpha. Every other country '
  + 'falls back to the closest of these two, and the interface says which one you are using and '
  + 'what may differ locally. A local clinician can contribute a profile as a data file.';

export interface RegionGuess {
  readonly profile: RegionProfile;
  /** Shown to the learner rather than hidden: why this was pre-selected. */
  readonly reason: string;
  /** True when the guess is a fallback rather than a match. */
  readonly isFallback: boolean;
}

/**
 * The default region: a best guess from the browser locale, with the guess SHOWN
 * and its reason stated. Changing it takes one interaction.
 */
export function guessRegion(languageTags: readonly string[]): RegionGuess {
  for (const tag of languageTags) {
    const match = REGIONS.find((region) => region.localeHints.includes(tag));
    if (match) {
      return {
        profile: match,
        reason: `Based on your browser language (${tag}).`,
        isFallback: false,
      };
    }
  }
  // A language without a region hint: fall back with the fallback stated.
  const primary = languageTags[0] ?? 'unknown';
  const fallback = primary.startsWith('en') ? UNITED_KINGDOM : UNITED_KINGDOM;
  return {
    profile: fallback,
    reason: `No profile matches your browser language (${primary}), so the closest published `
      + `profile — ${fallback.name} — is pre-selected. ${UNREPRESENTED_NOTE}`,
    isFallback: true,
  };
}

/**
 * A region by id, or undefined.
 *
 * This does NOT throw. Its argument routinely comes from stored state or a URL,
 * neither of which is under this application's control, and an unknown id used
 * to take the whole simulator down rather than falling back to a sensible
 * default. Use `requireRegion` where the id is genuinely an internal invariant.
 */
export function getRegion(id: string): RegionProfile | undefined {
  return REGIONS.find((candidate) => candidate.id === id);
}

export function requireRegion(id: string): RegionProfile {
  const region = getRegion(id);
  if (!region) throw new Error(`Unknown practice region: ${id}`);
  return region;
}

/** Terminology lookup. The internal identifier is stable so transcripts stay portable. */
export function term(region: RegionProfile, key: string): string {
  return region.terminology[key] ?? key;
}
