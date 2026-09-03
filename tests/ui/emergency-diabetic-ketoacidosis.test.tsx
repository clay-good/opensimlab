/** @vitest-environment jsdom */
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { PrerenderedBody } from '@routes/Prerendered';
import { describe, expect, it } from 'vitest';
import { ActionCockpit, crisisResponseAvailability, type ActionCockpitProps } from '@anesthesia/ui/ActionCockpit';
import { UNITED_STATES } from '@anesthesia/region/profiles';
import { DIABETIC_KETOACIDOSIS as SCENARIO } from '../../src/modules/emergency-medicine/scenarios/diabetic-ketoacidosis';

const base = (over: Record<string, unknown>) => ({
  presentationReviewedAtTick: null, fluidsAtTick: null, potassiumAtTick: null,
  insulinAtTick: null, dextroseAtTick: null, transitionAtTick: null,
  ...over,
} as NonNullable<ActionCockpitProps['resuscitation']['diabeticKetoacidosisAssessment']>);

const EMPTY = base({});
const PRESENTATION = base({ presentationReviewedAtTick: 0 });
const FLUIDS = base({ presentationReviewedAtTick: 0, fluidsAtTick: 1 });
const POTASSIUM = base({ presentationReviewedAtTick: 0, fluidsAtTick: 1, potassiumAtTick: 2 });
const INSULIN = base({ presentationReviewedAtTick: 0, fluidsAtTick: 1, potassiumAtTick: 2, insulinAtTick: 3 });
const DEXTROSE = base({ presentationReviewedAtTick: 0, fluidsAtTick: 1, potassiumAtTick: 2, insulinAtTick: 3, dextroseAtTick: 4 });
const DONE = base({ presentationReviewedAtTick: 0, fluidsAtTick: 1, potassiumAtTick: 2, insulinAtTick: 3, dextroseAtTick: 4, transitionAtTick: 5 });
const STATES = [EMPTY, PRESENTATION, FLUIDS, POTASSIUM, INSULIN, DEXTROSE, DONE];

const LABELS = ['Review DKA triad + cause', 'Record fluids + serial monitoring',
  'Replace K + recheck before insulin', 'Record IV insulin protocol intent',
  'Add dextrose + continue insulin', 'Confirm resolution + transition safely'];

const props = (
  assessment: NonNullable<ActionCockpitProps['resuscitation']['diabeticKetoacidosisAssessment']>,
  extra: Partial<ActionCockpitProps> = {},
): ActionCockpitProps => ({
  scenario: SCENARIO, region: UNITED_STATES, infusions: [], hypnoticLine: { connected: true, inspected: false },
  resuscitation: { epinephrineEffectFraction: 0, epinephrineTotalMicrograms: 0, lastEpinephrineTick: null, crystalloidTotalMl: 0, dantroleneTotalMg: 0, dantroleneEffectFraction: 0, lastDantroleneTick: null, activeCooling: false, diabeticKetoacidosisAssessment: assessment },
  lastExposure: null, syringeRemaining: {},
  ventilator: { mode: 'manual', tidalVolumeMl: 480, respiratoryRateBpm: 18, fio2: 0.21, peep: 0, delivering: false, sevofluranePercent: 0, freshGasFlowLPerMin: 10 },
  intubated: false, airwayAttempts: 0, lastGrade: null, jawThrustCpapSecondsRemaining: 0, airwayDevice: 'facemask',
  supraglotticInsertionSecondsRemaining: 0, helpRequestedAtTick: null, muscleRigidityFraction: 0,
  onBolus: () => {}, onInfusion: () => {}, onHypnoticLine: () => {}, onFluid: () => {}, onVentilator: () => {},
  onLaryngoscopy: () => {}, onAirwayManeuver: () => {}, onEpinephrine: () => {}, onDantrolene: () => {},
  onCallForHelp: () => {}, onAirwayDevice: () => {}, onActiveCooling: () => {}, onDrugCard: () => {},
  onDiabeticKetoacidosisResponse: () => {}, ...extra,
});

const markup = (
  assessment: NonNullable<ActionCockpitProps['resuscitation']['diabeticKetoacidosisAssessment']>,
  extra: Partial<ActionCockpitProps> = {},
) => renderToStaticMarkup(createElement(ActionCockpit, props(assessment, extra)));

const lessonButtons = (html: string) => [...html.matchAll(/<button[^>]*>(.*?)<\/button>/g)]
  .map((match) => match[1]!).filter((label) => LABELS.some((known) => label.includes(known)));

const openCount = (html: string) => [...html.matchAll(/<button[^>]*>(.*?)<\/button>/g)]
  .filter((match) => LABELS.some((known) => match[1]!.includes(known)))
  .filter((match) => !/ disabled=""/.test(match[0])).length;

describe('Emergency diabetic ketoacidosis experience', () => {
  it('is discoverable at its exact route', () => {
    const index = renderToStaticMarkup(createElement(PrerenderedBody, { path: '/emergency-medicine' }));
    expect(index).toContain('href="/emergency-medicine/scenario/diabetic-ketoacidosis"');
    const route = renderToStaticMarkup(createElement(PrerenderedBody, { path: '/emergency-medicine/scenario/diabetic-ketoacidosis' }));
    expect(route).toContain(`<h1>${SCENARIO.metadata.title}</h1>`);
  });

  it('fails closed on the timeline target rather than the scenario id', () => {
    expect(crisisResponseAvailability(SCENARIO).hasDiabeticKetoacidosisResponse).toBe(true);
    expect(crisisResponseAvailability({
      ...SCENARIO,
      timeline: SCENARIO.timeline.filter((event) => event.target !== 'diabetic-ketoacidosis'),
    }).hasDiabeticKetoacidosisResponse).toBe(false);
  });

  it('keeps all six recorded steps on screen', () => {
    for (const state of STATES) {
      expect(lessonButtons(markup(state))).toHaveLength(6);
    }
  });

  it('opens exactly one step at a time, because the chain is the lesson', () => {
    for (const state of [EMPTY, PRESENTATION, FLUIDS, POTASSIUM, INSULIN, DEXTROSE]) {
      expect(openCount(markup(state))).toBe(1);
    }
    expect(openCount(markup(DONE))).toBe(0);
  });

  it('says on screen that the potassium is what locks insulin', () => {
    expect(markup(EMPTY)).toContain('Potassium 3.2 mmol/L keeps insulin locked.');
    expect(markup(POTASSIUM)).toContain('insulin gate open');
    expect(markup(DEXTROSE)).toContain('ketoacidosis persists');
  });

  it('states the resolution criteria and excludes the wrong ones', () => {
    expect(markup(EMPTY))
      .toContain('Resolution uses plasma ketone plus pH or bicarbonate, not anion gap or urine ketones alone.');
  });

  it('never offers a dose, a delivery, or an outcome', () => {
    for (const html of STATES.map((state) => markup(state))) {
      expect(lessonButtons(html).join(' '))
        .not.toMatch(/bolus|units\/|\bmL\/h|prognos|discharg/iu);
    }
  });
});

describe('Emergency diabetic ketoacidosis tutor and worked example', () => {
  it('says nothing at all on the unassisted setting', () => {
    expect(markup(EMPTY)).not.toContain('A moment to think');
    expect(markup(EMPTY, { diabeticKetoacidosisGuidance: 'unassisted' })).not.toContain('A moment to think');
  });

  it('reads the learner’s own recorded steps when guidance is on', () => {
    const opening = markup(EMPTY, { diabeticKetoacidosisGuidance: 'guided' });
    expect(opening).toContain('A moment to think');
    expect(opening).toContain('A precipitant you can name is a recurrence you can prevent');
    const fluids = markup(PRESENTATION, { diabeticKetoacidosisGuidance: 'guided' });
    expect(fluids).toContain('what looks like a glucose problem is a water problem');
    expect(fluids).not.toContain('A precipitant you can name is a recurrence you can prevent');
  });

  it('names the potassium gate as the lesson', () => {
    expect(markup(FLUIDS, { diabeticKetoacidosisGuidance: 'guided' }))
      .toContain('does not risk hypokalaemia, it produces it');
  });

  it('names stopping insulin on an improved glucose as the next error', () => {
    expect(markup(INSULIN, { diabeticKetoacidosisGuidance: 'guided' }))
      .toContain('the commonest way this goes wrong after the potassium');
  });

  it('goes quiet once the transition is recorded', () => {
    expect(markup(DONE, { diabeticKetoacidosisGuidance: 'guided' })).not.toContain('A moment to think');
  });

  it('leaves the controls visible but inert while the example runs', () => {
    const label = LABELS[0]!;
    expect(markup(EMPTY)).toContain(label);
    const watching = markup(EMPTY, { diabeticKetoacidosisGuidance: 'guided', diabeticKetoacidosisDemonstrating: true });
    expect(watching).toContain(label);
    expect(watching).toContain('aria-disabled="true"');
    expect(watching).toContain('Watching the worked example');
    expect(watching).not.toContain('A moment to think');
  });
});
