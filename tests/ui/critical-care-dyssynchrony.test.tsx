/** @vitest-environment jsdom */
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { PrerenderedBody } from '@routes/Prerendered';
import { describe, expect, it } from 'vitest';
import { ActionCockpit, crisisResponseAvailability, type ActionCockpitProps } from '@anesthesia/ui/ActionCockpit';
import { UNITED_STATES } from '@anesthesia/region/profiles';
import { VENTILATOR_DYSSYNCHRONY as SCENARIO } from '../../src/modules/critical-care/scenarios/ventilator-dyssynchrony';

const base = (over: Record<string, unknown>) => ({
  graphicsAtTick: null, driversAtTick: null, classificationAtTick: null,
  correctionAtTick: null, reassessmentAtTick: null,
  ...over,
} as NonNullable<ActionCockpitProps['resuscitation']['ventilatorDyssynchronyAssessment']>);

const EMPTY = base({});
const GRAPHICS = base({ graphicsAtTick: 0 });
const DRIVERS = base({ graphicsAtTick: 0, driversAtTick: 1 });
const CLASSIFIED = base({ graphicsAtTick: 0, driversAtTick: 1, classificationAtTick: 2 });
const CORRECTED = base({ graphicsAtTick: 0, driversAtTick: 1, classificationAtTick: 2, correctionAtTick: 3 });
const DONE = base({ graphicsAtTick: 0, driversAtTick: 1, classificationAtTick: 2, correctionAtTick: 3, reassessmentAtTick: 4 });
const STATES = [EMPTY, GRAPHICS, DRIVERS, CLASSIFIED, CORRECTED, DONE];

const LABELS = ['Read patient + pressure + flow + volume', 'Review pain + drive + airway + mechanics',
  'Classify the bounded pattern', 'Analgesia first + match flow and cycle',
  'Review 10-minute response'];

const props = (
  assessment: NonNullable<ActionCockpitProps['resuscitation']['ventilatorDyssynchronyAssessment']>,
  extra: Partial<ActionCockpitProps> = {},
): ActionCockpitProps => ({
  scenario: SCENARIO, region: UNITED_STATES, infusions: [], hypnoticLine: { connected: true, inspected: false },
  resuscitation: { epinephrineEffectFraction: 0, epinephrineTotalMicrograms: 0, lastEpinephrineTick: null, crystalloidTotalMl: 0, dantroleneTotalMg: 0, dantroleneEffectFraction: 0, lastDantroleneTick: null, activeCooling: false, ventilatorDyssynchronyAssessment: assessment },
  lastExposure: null, syringeRemaining: {},
  ventilator: { mode: 'volume-control', tidalVolumeMl: 420, respiratoryRateBpm: 18, fio2: 0.4, peep: 8, delivering: true, sevofluranePercent: 0, freshGasFlowLPerMin: 0.5 },
  intubated: true, airwayAttempts: 0, lastGrade: null, jawThrustCpapSecondsRemaining: 0, airwayDevice: 'tracheal-tube',
  supraglotticInsertionSecondsRemaining: 0, helpRequestedAtTick: null, muscleRigidityFraction: 0,
  onBolus: () => {}, onInfusion: () => {}, onHypnoticLine: () => {}, onFluid: () => {}, onVentilator: () => {},
  onLaryngoscopy: () => {}, onAirwayManeuver: () => {}, onEpinephrine: () => {}, onDantrolene: () => {},
  onCallForHelp: () => {}, onAirwayDevice: () => {}, onActiveCooling: () => {}, onDrugCard: () => {},
  onVentilatorDyssynchronyResponse: () => {}, ...extra,
});

const markup = (
  assessment: NonNullable<ActionCockpitProps['resuscitation']['ventilatorDyssynchronyAssessment']>,
  extra: Partial<ActionCockpitProps> = {},
) => renderToStaticMarkup(createElement(ActionCockpit, props(assessment, extra)));

const lessonButtons = (html: string) => [...html.matchAll(/<button[^>]*>(.*?)<\/button>/g)]
  .map((match) => match[1]!).filter((label) => LABELS.some((known) => label.includes(known)));

describe('Ventilator-dyssynchrony experience', () => {
  it('is discoverable at its exact route', () => {
    const index = renderToStaticMarkup(createElement(PrerenderedBody, { path: '/critical-care' }));
    expect(index).toContain('href="/critical-care/scenario/ventilator-dyssynchrony"');
    const route = renderToStaticMarkup(createElement(PrerenderedBody, { path: '/critical-care/scenario/ventilator-dyssynchrony' }));
    expect(route).toContain(`<h1>${SCENARIO.metadata.title}</h1>`);
  });

  it('fails closed on the timeline target rather than the scenario id', () => {
    expect(crisisResponseAvailability(SCENARIO).hasVentilatorDyssynchronyResponse).toBe(true);
    expect(crisisResponseAvailability({
      ...SCENARIO,
      timeline: SCENARIO.timeline.filter((event) => event.target !== 'ventilator-dyssynchrony'),
    }).hasVentilatorDyssynchronyResponse).toBe(false);
  });

  it('keeps all five steps on screen, one per declared objective', () => {
    expect(SCENARIO.metadata.objectives).toHaveLength(5);
    for (const state of STATES) {
      expect(lessonButtons(markup(state))).toHaveLength(5);
    }
  });

  it('opens exactly one step at a time, because the chain is the lesson', () => {
    const openCount = (html: string) => [...html.matchAll(/<button[^>]*>(.*?)<\/button>/g)]
      .filter((match) => LABELS.some((known) => match[1]!.includes(known)))
      .filter((match) => !/ disabled=""/.test(match[0])).length;
    for (const state of [EMPTY, GRAPHICS, DRIVERS, CLASSIFIED, CORRECTED]) {
      expect(openCount(markup(state))).toBe(1);
    }
    expect(openCount(markup(DONE))).toBe(0);
  });

  it('never offers sedation, paralysis, a drug, or a setting', () => {
    expect(markup(EMPTY)).toContain('Read the person and the breath.');
    expect(markup(CLASSIFIED)).toContain('Match support. Keep protection.');
    for (const html of STATES.map((state) => markup(state))) {
      expect(lessonButtons(html).join(' ')).not.toMatch(/examin|propofol|fentanyl|rocuron|paralys|sedat|\bmg\b|\bmL\b|diagnos|prognos/iu);
    }
  });
});

describe('Ventilator-dyssynchrony tutor and worked example', () => {
  it('says nothing at all on the unassisted setting', () => {
    expect(markup(EMPTY)).not.toContain('A moment to think');
    expect(markup(EMPTY, { ventilatorDyssynchronyGuidance: 'unassisted' })).not.toContain('A moment to think');
  });

  it('reads the learner’s own recorded steps when guidance is on', () => {
    const opening = markup(EMPTY, { ventilatorDyssynchronyGuidance: 'guided' });
    expect(opening).toContain('A moment to think');
    expect(opening).toContain('a patient pulling harder than the set flow');
    const drivers = markup(GRAPHICS, { ventilatorDyssynchronyGuidance: 'guided' });
    expect(drivers).toContain('nothing to do with the ventilator');
    expect(drivers).not.toContain('a patient pulling harder than the set flow');
  });

  it('treats the double triggering as a consequence', () => {
    expect(markup(DRIVERS, { ventilatorDyssynchronyGuidance: 'guided' }))
      .toContain('the consequence rather than a third finding');
  });

  it('refuses the sedation reflex by name', () => {
    expect(markup(CLASSIFIED, { ventilatorDyssynchronyGuidance: 'guided' }))
      .toContain('no deep-sedation claim and no paralysis');
  });

  it('goes quiet once the response is reassessed', () => {
    expect(markup(DONE, { ventilatorDyssynchronyGuidance: 'guided' })).not.toContain('A moment to think');
  });

  it('leaves the controls visible but inert while the example runs', () => {
    const label = LABELS[0]!;
    expect(markup(EMPTY)).toContain(label);
    const watching = markup(EMPTY, { ventilatorDyssynchronyGuidance: 'guided', ventilatorDyssynchronyDemonstrating: true });
    expect(watching).toContain(label);
    expect(watching).toContain('aria-disabled="true"');
    expect(watching).toContain('Watching the worked example');
    expect(watching).not.toContain('A moment to think');
  });
});
