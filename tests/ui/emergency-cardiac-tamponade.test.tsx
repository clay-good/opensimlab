/** @vitest-environment jsdom */
/**
 * The tutor panel and worked-example inertness for the emergency
 * cardiac-tamponade tray. tests/ui/cardiac-tamponade.test.tsx already covers
 * the tray's pre-existing behaviour and is left alone.
 */
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { PrerenderedBody } from '@routes/Prerendered';
import { describe, expect, it } from 'vitest';
import { ActionCockpit, crisisResponseAvailability, type ActionCockpitProps } from '@anesthesia/ui/ActionCockpit';
import { UNITED_STATES } from '@anesthesia/region/profiles';
import { CARDIAC_TAMPONADE as SCENARIO } from '../../src/modules/emergency-medicine/scenarios/cardiac-tamponade';

const base = (over: Record<string, unknown>) => ({
  contextReviewedAtTick: null, pocusReviewedAtTick: null,
  definitiveControlAtTick: null, reassessedAtTick: null,
  ...over,
} as NonNullable<ActionCockpitProps['resuscitation']['cardiacTamponadeAssessment']>);

const EMPTY = base({});
const CONTEXT = base({ contextReviewedAtTick: 1 });
const POCUS = base({ contextReviewedAtTick: 1, pocusReviewedAtTick: 2 });
const CONTROL = base({ contextReviewedAtTick: 1, pocusReviewedAtTick: 2, definitiveControlAtTick: 3 });
const DONE = base({ contextReviewedAtTick: 1, pocusReviewedAtTick: 2, definitiveControlAtTick: 3, reassessedAtTick: 4 });
const STATES = [EMPTY, CONTEXT, POCUS, CONTROL, DONE];

const LABELS = ['Review context + perfusion', 'Review fixed POCUS finding',
  'Record immediate definitive-control intent', 'Reassess unresolved perfusion'];

const props = (
  assessment: NonNullable<ActionCockpitProps['resuscitation']['cardiacTamponadeAssessment']>,
  extra: Partial<ActionCockpitProps> = {},
): ActionCockpitProps => ({
  scenario: SCENARIO, region: UNITED_STATES, infusions: [], hypnoticLine: { connected: true, inspected: false },
  resuscitation: { epinephrineEffectFraction: 0, epinephrineTotalMicrograms: 0, lastEpinephrineTick: null, crystalloidTotalMl: 0, dantroleneTotalMg: 0, dantroleneEffectFraction: 0, lastDantroleneTick: null, activeCooling: false, cardiacTamponadeFraction: 0.9, cardiacTamponadeAssessment: assessment },
  lastExposure: null, syringeRemaining: {},
  ventilator: { mode: 'manual', tidalVolumeMl: 480, respiratoryRateBpm: 18, fio2: 0.21, peep: 0, delivering: false, sevofluranePercent: 0, freshGasFlowLPerMin: 10 },
  intubated: false, airwayAttempts: 0, lastGrade: null, jawThrustCpapSecondsRemaining: 0, airwayDevice: 'facemask',
  supraglotticInsertionSecondsRemaining: 0, helpRequestedAtTick: null, muscleRigidityFraction: 0,
  onBolus: () => {}, onInfusion: () => {}, onHypnoticLine: () => {}, onFluid: () => {}, onVentilator: () => {},
  onLaryngoscopy: () => {}, onAirwayManeuver: () => {}, onEpinephrine: () => {}, onDantrolene: () => {},
  onCallForHelp: () => {}, onAirwayDevice: () => {}, onActiveCooling: () => {}, onDrugCard: () => {},
  onCardiacTamponadeAssessment: () => {}, ...extra,
});

const markup = (
  assessment: NonNullable<ActionCockpitProps['resuscitation']['cardiacTamponadeAssessment']>,
  extra: Partial<ActionCockpitProps> = {},
) => renderToStaticMarkup(createElement(ActionCockpit, props(assessment, extra)));

const lessonButtons = (html: string) => [...html.matchAll(/<button[^>]*>(.*?)<\/button>/g)]
  .map((match) => match[1]!).filter((label) => LABELS.some((known) => label.includes(known)));

const openCount = (html: string) => [...html.matchAll(/<button[^>]*>(.*?)<\/button>/g)]
  .filter((match) => LABELS.some((known) => match[1]!.includes(known)))
  .filter((match) => !/ disabled=""/.test(match[0])).length;

describe('Emergency cardiac tamponade experience', () => {
  it('is discoverable at its exact route', () => {
    const index = renderToStaticMarkup(createElement(PrerenderedBody, { path: '/emergency-medicine' }));
    expect(index).toContain('href="/emergency-medicine/scenario/cardiac-tamponade"');
    const route = renderToStaticMarkup(createElement(PrerenderedBody, { path: '/emergency-medicine/scenario/cardiac-tamponade' }));
    expect(route).toContain(`<h1>${SCENARIO.metadata.title}</h1>`);
  });

  it('fails closed on the tamponade event target rather than the scenario id', () => {
    expect(crisisResponseAvailability(SCENARIO).hasCardiacTamponadeResponse).toBe(true);
    expect(crisisResponseAvailability({
      ...SCENARIO, timeline: SCENARIO.timeline.filter((event) => event.type !== 'cardiac-tamponade'),
    }).hasCardiacTamponadeResponse).toBe(false);
  });

  it('keeps all four recorded steps on screen and opens one at a time', () => {
    for (const state of STATES) {
      expect(lessonButtons(markup(state))).toHaveLength(4);
    }
    for (const state of [EMPTY, CONTEXT, POCUS, CONTROL]) {
      expect(openCount(markup(state))).toBe(1);
    }
    expect(openCount(markup(DONE))).toBe(0);
  });

  it('says on screen that the click does not relieve the tamponade', () => {
    const html = markup(CONTROL);
    expect(html).toContain('it does not relieve tamponade');
    expect(markup(DONE)).toContain('definitive care remains urgent');
  });

  it('never offers a procedure, a technique, or an outcome', () => {
    for (const html of STATES.map((state) => markup(state))) {
      // "Reassess unresolved perfusion" is an authored control label, so the
      // guard is on procedure and outcome language, not the bare stems.
      expect(lessonButtons(html).join(' '))
        .not.toMatch(/needle|centesis|thoracotom|\bdrain|\brelieve|\bresolved\b|prognos/iu);
    }
  });
});

describe('Emergency cardiac tamponade tutor and worked example', () => {
  it('says nothing at all on the unassisted setting', () => {
    expect(markup(EMPTY)).not.toContain('A moment to think');
    expect(markup(EMPTY, { cardiacTamponadeGuidance: 'unassisted' })).not.toContain('A moment to think');
  });

  it('reads the learner’s own recorded steps when guidance is on', () => {
    const opening = markup(EMPTY, { cardiacTamponadeGuidance: 'guided' });
    expect(opening).toContain('A moment to think');
    expect(opening).toContain('rather than a tension pneumothorax');
    const pocus = markup(CONTEXT, { cardiacTamponadeGuidance: 'guided' });
    expect(pocus).toContain('an effusion is only tamponade when the circulation says it is');
    expect(pocus).not.toContain('rather than a tension pneumothorax');
  });

  it('explains why there is no procedure on the screen', () => {
    expect(markup(POCUS, { cardiacTamponadeGuidance: 'guided' }))
      .toContain('not something a needle empties');
  });

  it('tells the learner to expect nothing better', () => {
    expect(markup(CONTROL, { cardiacTamponadeGuidance: 'guided' }))
      .toContain('expect it to be no better');
  });

  it('goes quiet once the reassessment is recorded', () => {
    expect(markup(DONE, { cardiacTamponadeGuidance: 'guided' })).not.toContain('A moment to think');
  });

  it('leaves the controls visible but inert while the example runs', () => {
    const label = LABELS[0]!;
    expect(markup(EMPTY)).toContain(label);
    const watching = markup(EMPTY, { cardiacTamponadeGuidance: 'guided', cardiacTamponadeDemonstrating: true });
    expect(watching).toContain(label);
    expect(watching).toContain('aria-disabled="true"');
    expect(watching).toContain('Watching the worked example');
    expect(watching).not.toContain('A moment to think');
  });
});
