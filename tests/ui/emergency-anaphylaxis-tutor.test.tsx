/** @vitest-environment jsdom */
/**
 * The tutor panel and worked-example inertness for the emergency anaphylaxis
 * tray. tests/ui/emergency-anaphylaxis.test.tsx already covers the tray's
 * pre-existing behaviour and is left alone; this is its sibling.
 */
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { ActionCockpit, crisisResponseAvailability, type ActionCockpitProps } from '@anesthesia/ui/ActionCockpit';
import { UNITED_STATES } from '@anesthesia/region/profiles';
import { ANAPHYLAXIS as SCENARIO } from '../../src/modules/emergency-medicine/scenarios/anaphylaxis';

const base = (over: Record<string, unknown>) => ({
  patternReviewedAtTick: null, positionedAndHelpedAtTick: null, imEpinephrineAtTick: null,
  oxygenAtTick: null, crystalloidAtTick: null, reassessedAtTick: null,
  ...over,
} as NonNullable<ActionCockpitProps['resuscitation']['emergencyAnaphylaxisAssessment']>);

const EMPTY = base({});
const PATTERN = base({ patternReviewedAtTick: 0 });
const POSITIONED = base({ patternReviewedAtTick: 0, positionedAndHelpedAtTick: 1 });
const DRUG = base({ patternReviewedAtTick: 0, positionedAndHelpedAtTick: 1, imEpinephrineAtTick: 2 });
const OXYGEN = base({ patternReviewedAtTick: 0, positionedAndHelpedAtTick: 1, imEpinephrineAtTick: 2, oxygenAtTick: 3 });
const FLUID_ONLY = base({ patternReviewedAtTick: 0, positionedAndHelpedAtTick: 1, imEpinephrineAtTick: 2, crystalloidAtTick: 3 });
const SUPPORTED = base({ patternReviewedAtTick: 0, positionedAndHelpedAtTick: 1, imEpinephrineAtTick: 2, oxygenAtTick: 3, crystalloidAtTick: 4 });
const DONE = base({ patternReviewedAtTick: 0, positionedAndHelpedAtTick: 1, imEpinephrineAtTick: 2, oxygenAtTick: 3, crystalloidAtTick: 4, reassessedAtTick: 5 });
const STATES = [EMPTY, PATTERN, POSITIONED, DRUG, OXYGEN, FLUID_ONLY, SUPPORTED, DONE];

const LABELS = ['Review systemic pattern', 'Position + call for help',
  'Give 500 µg epinephrine IM', 'Record high-flow oxygen',
  'Begin fixed 1,500 mL crystalloid', 'Reassess airway + perfusion'];

const props = (
  assessment: NonNullable<ActionCockpitProps['resuscitation']['emergencyAnaphylaxisAssessment']>,
  extra: Partial<ActionCockpitProps> = {},
): ActionCockpitProps => ({
  scenario: SCENARIO, region: UNITED_STATES, infusions: [], hypnoticLine: { connected: true, inspected: false },
  resuscitation: { epinephrineEffectFraction: 0, epinephrineTotalMicrograms: 0, lastEpinephrineTick: null, crystalloidTotalMl: 0, dantroleneTotalMg: 0, dantroleneEffectFraction: 0, lastDantroleneTick: null, activeCooling: false, emergencyAnaphylaxisAssessment: assessment },
  lastExposure: null, syringeRemaining: {},
  ventilator: { mode: 'manual', tidalVolumeMl: 480, respiratoryRateBpm: 18, fio2: 0.21, peep: 0, delivering: false, sevofluranePercent: 0, freshGasFlowLPerMin: 10 },
  intubated: false, airwayAttempts: 0, lastGrade: null, jawThrustCpapSecondsRemaining: 0, airwayDevice: 'facemask',
  supraglotticInsertionSecondsRemaining: 0, helpRequestedAtTick: null, muscleRigidityFraction: 0,
  onBolus: () => {}, onInfusion: () => {}, onHypnoticLine: () => {}, onFluid: () => {}, onVentilator: () => {},
  onLaryngoscopy: () => {}, onAirwayManeuver: () => {}, onEpinephrine: () => {}, onDantrolene: () => {},
  onCallForHelp: () => {}, onAirwayDevice: () => {}, onActiveCooling: () => {}, onDrugCard: () => {},
  onEmergencyAnaphylaxisResponse: () => {}, ...extra,
});

const markup = (
  assessment: NonNullable<ActionCockpitProps['resuscitation']['emergencyAnaphylaxisAssessment']>,
  extra: Partial<ActionCockpitProps> = {},
) => renderToStaticMarkup(createElement(ActionCockpit, props(assessment, extra)));

const lessonButtons = (html: string) => [...html.matchAll(/<button[^>]*>(.*?)<\/button>/g)]
  .map((match) => match[1]!).filter((label) => LABELS.some((known) => label.includes(known)));

const openCount = (html: string) => [...html.matchAll(/<button[^>]*>(.*?)<\/button>/g)]
  .filter((match) => LABELS.some((known) => match[1]!.includes(known)))
  .filter((match) => !/ disabled=""/.test(match[0])).length;

describe('Emergency anaphylaxis tray gates', () => {
  it('fails closed on the timeline target rather than the scenario id', () => {
    expect(crisisResponseAvailability(SCENARIO).hasEmergencyAnaphylaxisResponse).toBe(true);
    expect(crisisResponseAvailability({
      ...SCENARIO, timeline: SCENARIO.timeline.filter((event) => event.type !== 'narrative'),
    }).hasEmergencyAnaphylaxisResponse).toBe(false);
  });

  it('keeps all six recorded steps on screen', () => {
    for (const state of STATES) {
      expect(lessonButtons(markup(state))).toHaveLength(6);
    }
  });

  it('opens one step at a time until the drug, then both adjuncts together', () => {
    expect(openCount(markup(EMPTY))).toBe(1);
    expect(openCount(markup(PATTERN))).toBe(1);
    expect(openCount(markup(POSITIONED))).toBe(1);
    expect(openCount(markup(DRUG))).toBe(2);
    expect(openCount(markup(OXYGEN))).toBe(1);
    expect(openCount(markup(FLUID_ONLY))).toBe(1);
    expect(openCount(markup(SUPPORTED))).toBe(1);
    expect(openCount(markup(DONE))).toBe(0);
  });

  it('holds both adjuncts shut until the intramuscular drug is recorded', () => {
    const adjunctsOpen = (html: string) => [...html.matchAll(/<button[^>]*>(.*?)<\/button>/g)]
      .filter((match) => /Record high-flow oxygen|Begin fixed 1,500 mL crystalloid/.test(match[1]!))
      .some((match) => !/ disabled=""/.test(match[0]));
    for (const state of [EMPTY, PATTERN, POSITIONED]) {
      expect(adjunctsOpen(markup(state))).toBe(false);
    }
    expect(adjunctsOpen(markup(DRUG))).toBe(true);
  });
});

describe('Emergency anaphylaxis tutor and worked example', () => {
  it('says nothing at all on the unassisted setting', () => {
    expect(markup(EMPTY)).not.toContain('A moment to think');
    expect(markup(EMPTY, { emergencyAnaphylaxisGuidance: 'unassisted' })).not.toContain('A moment to think');
  });

  it('reads the learner’s own recorded steps when guidance is on', () => {
    const opening = markup(EMPTY, { emergencyAnaphylaxisGuidance: 'guided' });
    expect(opening).toContain('A moment to think');
    expect(opening).toContain('What is absent is the skin');
    const positioning = markup(PATTERN, { emergencyAnaphylaxisGuidance: 'guided' });
    expect(positioning).toContain('in the act of sitting or standing them');
    expect(positioning).not.toContain('What is absent is the skin');
  });

  it('names the refusal on the adjuncts as the lesson', () => {
    const drug = markup(POSITIONED, { emergencyAnaphylaxisGuidance: 'guided' });
    expect(drug).toContain('the interval most consistently found in the fatal cases');
    expect(drug).toContain('the control does not offer it');
  });

  it('puts the fluid claim where every path passes through', () => {
    const adjuncts = markup(DRUG, { emergencyAnaphylaxisGuidance: 'guided' });
    expect(adjuncts).toContain('the fluid is not an afterthought');
    expect(adjuncts).toContain('neither adjunct is a substitute for a second dose of epinephrine');
  });

  it('picks up the missing adjunct whichever one the learner left', () => {
    expect(markup(FLUID_ONLY, { emergencyAnaphylaxisGuidance: 'guided' }))
      .toContain('It buys time; it does not treat the mechanism');
    expect(markup(OXYGEN, { emergencyAnaphylaxisGuidance: 'guided' }))
      .toContain('replacing something that has genuinely gone');
  });

  it('goes quiet once the reassessment is recorded', () => {
    expect(markup(DONE, { emergencyAnaphylaxisGuidance: 'guided' })).not.toContain('A moment to think');
  });

  it('leaves the controls visible but inert while the example runs', () => {
    const label = LABELS[0]!;
    expect(markup(EMPTY)).toContain(label);
    const watching = markup(EMPTY, { emergencyAnaphylaxisGuidance: 'guided', emergencyAnaphylaxisDemonstrating: true });
    expect(watching).toContain(label);
    expect(watching).toContain('aria-disabled="true"');
    expect(watching).toContain('Watching the worked example');
    expect(watching).not.toContain('A moment to think');
  });
});
