/** @vitest-environment jsdom */
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { PrerenderedBody } from '@routes/Prerendered';
import { describe, expect, it } from 'vitest';
import { ActionCockpit, crisisResponseAvailability, type ActionCockpitProps } from '@anesthesia/ui/ActionCockpit';
import { UNITED_STATES } from '@anesthesia/region/profiles';
import { STABLE_CHEST_PAIN_EVALUATION as SCENARIO } from '../../src/modules/cardiology/scenarios/stable-chest-pain-evaluation';

/** The constants this lesson never moves, spread into every state below. */
const NEVER = {
  clinicalLikelihood: 'not-very-low' as const,
  exactScoreCalculated: false as const,
  testPerformed: false as const,
};
const base = (over: Record<string, unknown>) => ({
  stabilityAtTick: null, patternAtTick: null, likelihoodAtTick: null,
  testingAtTick: null, safetyNetAtTick: null,
  ...NEVER, ...over,
} as NonNullable<ActionCockpitProps['resuscitation']['stableChestPainAssessment']>);

const EMPTY = base({});
const STABLE = base({ stabilityAtTick: 0 });
const PATTERN = base({ stabilityAtTick: 0, patternAtTick: 1 });
const LIKELIHOOD = base({ stabilityAtTick: 0, patternAtTick: 1, likelihoodAtTick: 2 });
const TESTING = base({ stabilityAtTick: 0, patternAtTick: 1, likelihoodAtTick: 2, testingAtTick: 3 });
const DONE = base({ stabilityAtTick: 0, patternAtTick: 1, likelihoodAtTick: 2, testingAtTick: 3, safetyNetAtTick: 4 });
const STATES = [EMPTY, STABLE, PATTERN, LIKELIHOOD, TESTING, DONE];

const LABELS = ['Verify stable vs acute change', 'Characterize symptom + function',
  'Review clinical likelihood', 'Share a patient-specific test pathway',
  'Record follow-up + acute-change safety net'];

const props = (
  assessment: NonNullable<ActionCockpitProps['resuscitation']['stableChestPainAssessment']>,
  extra: Partial<ActionCockpitProps> = {},
): ActionCockpitProps => ({
  scenario: SCENARIO, region: UNITED_STATES, infusions: [], hypnoticLine: { connected: true, inspected: false },
  resuscitation: { epinephrineEffectFraction: 0, epinephrineTotalMicrograms: 0, lastEpinephrineTick: null, crystalloidTotalMl: 0, dantroleneTotalMg: 0, dantroleneEffectFraction: 0, lastDantroleneTick: null, activeCooling: false, stableChestPainAssessment: assessment },
  lastExposure: null, syringeRemaining: {},
  ventilator: { mode: 'manual', tidalVolumeMl: 500, respiratoryRateBpm: 14, fio2: 0.21, peep: 0, delivering: false, sevofluranePercent: 0, freshGasFlowLPerMin: 0.5 },
  intubated: false, airwayAttempts: 0, lastGrade: null, jawThrustCpapSecondsRemaining: 0, airwayDevice: 'facemask',
  supraglotticInsertionSecondsRemaining: 0, helpRequestedAtTick: null, muscleRigidityFraction: 0,
  onBolus: () => {}, onInfusion: () => {}, onHypnoticLine: () => {}, onFluid: () => {}, onVentilator: () => {},
  onLaryngoscopy: () => {}, onAirwayManeuver: () => {}, onEpinephrine: () => {}, onDantrolene: () => {},
  onCallForHelp: () => {}, onAirwayDevice: () => {}, onActiveCooling: () => {}, onDrugCard: () => {},
  onStableChestPainResponse: () => {}, ...extra,
});

const markup = (
  assessment: NonNullable<ActionCockpitProps['resuscitation']['stableChestPainAssessment']>,
  extra: Partial<ActionCockpitProps> = {},
) => renderToStaticMarkup(createElement(ActionCockpit, props(assessment, extra)));

const lessonButtons = (html: string) => [...html.matchAll(/<button[^>]*>(.*?)<\/button>/g)]
  .map((match) => match[1]!).filter((label) => LABELS.some((known) => label.includes(known)));

describe('Stable-chest-pain experience', () => {
  it('is discoverable at its exact route', () => {
    const index = renderToStaticMarkup(createElement(PrerenderedBody, { path: '/cardiology' }));
    expect(index).toContain('href="/cardiology/scenario/stable-chest-pain-evaluation"');
    const route = renderToStaticMarkup(createElement(PrerenderedBody, { path: '/cardiology/scenario/stable-chest-pain-evaluation' }));
    expect(route).toContain(`<h1>${SCENARIO.metadata.title}</h1>`);
  });

  it('fails closed on the timeline target rather than the scenario id', () => {
    expect(crisisResponseAvailability(SCENARIO).hasStableChestPainResponse).toBe(true);
    expect(crisisResponseAvailability({
      ...SCENARIO,
      timeline: SCENARIO.timeline.filter((event) => event.target !== 'stable-chest-pain-evaluation'),
    }).hasStableChestPainResponse).toBe(false);
  });

  it('keeps all five steps on screen and disables the ones not yet reachable', () => {
    // Unlike the pediatrics trays, this one shows every step and gates with
    // `disabled` rather than by removing buttons — an authored difference.
    for (const state of STATES) {
      expect(lessonButtons(markup(state))).toHaveLength(5);
    }
  });

  it('never offers a test, a score, a drug, or a diagnosis', () => {
    expect(markup(EMPTY)).toContain('Stable is a trajectory, not a synonym for safe.');
    expect(markup(LIKELIHOOD)).toContain('Estimate before you investigate.');
    for (const html of STATES.map((state) => markup(state))) {
      expect(lessonButtons(html).join(' ')).not.toMatch(/examin|angiogra|stress|treadmill|statin|aspirin|atypical|diagnos|prognos|%/iu);
    }
  });
});

describe('Stable-chest-pain tutor and worked example', () => {
  it('says nothing at all on the unassisted setting', () => {
    expect(markup(EMPTY)).not.toContain('A moment to think');
    expect(markup(EMPTY, { stableChestPainGuidance: 'unassisted' })).not.toContain('A moment to think');
  });

  it('reads the learner’s own recorded steps when guidance is on', () => {
    const opening = markup(EMPTY, { stableChestPainGuidance: 'guided' });
    expect(opening).toContain('A moment to think');
    expect(opening).toContain('before you treat it as stable');
    const pattern = markup(STABLE, { stableChestPainGuidance: 'guided' });
    expect(pattern).toContain('Do not reach for the word');
    expect(pattern).not.toContain('before you treat it as stable');
  });

  it('refuses the word atypical and explains the cost', () => {
    const html = markup(STABLE, { stableChestPainGuidance: 'guided' });
    expect(html).toContain('it performs worse in women');
  });

  it('keeps the likelihood a band and flags the resting ECG', () => {
    const html = markup(PATTERN, { stableChestPainGuidance: 'guided' });
    expect(html).toContain('routinely over-read as reassurance');
    expect(html).toContain('a band and not a percentage');
  });

  it('makes the test choice shared and local', () => {
    const html = markup(LIKELIHOOD, { stableChestPainGuidance: 'guided' });
    expect(html).toContain('no universal right modality');
    expect(html).toContain('is not the best test for him');
  });

  it('goes quiet once the safety net is recorded', () => {
    expect(markup(DONE, { stableChestPainGuidance: 'guided' })).not.toContain('A moment to think');
  });

  it('leaves the controls visible but inert while the example runs', () => {
    const label = LABELS[0]!;
    expect(markup(EMPTY)).toContain(label);
    const watching = markup(EMPTY, { stableChestPainGuidance: 'guided', stableChestPainDemonstrating: true });
    expect(watching).toContain(label);
    expect(watching).toContain('aria-disabled="true"');
    expect(watching).toContain('Watching the worked example');
    expect(watching).not.toContain('A moment to think');
  });
});
