/** @vitest-environment jsdom */
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { PrerenderedBody } from '@routes/Prerendered';
import { describe, expect, it } from 'vitest';
import { ActionCockpit, crisisResponseAvailability, type ActionCockpitProps } from '@anesthesia/ui/ActionCockpit';
import { UNITED_STATES } from '@anesthesia/region/profiles';
import { INTRACRANIAL_HYPERTENSION as SCENARIO } from '../../src/modules/critical-care/scenarios/intracranial-hypertension';

const base = (over: Record<string, unknown>) => ({
  recognitionAtTick: null, contextAtTick: null, protectionAtTick: null,
  rescueAtTick: null, reassessmentAtTick: null,
  ...over,
} as NonNullable<ActionCockpitProps['resuscitation']['intracranialHypertensionAssessment']>);

const EMPTY = base({});
const RECOGNIZED = base({ recognitionAtTick: 0 });
const CONTEXT = base({ recognitionAtTick: 0, contextAtTick: 1 });
const PROTECTED = base({ recognitionAtTick: 0, contextAtTick: 1, protectionAtTick: 2 });
const RESCUED = base({ recognitionAtTick: 0, contextAtTick: 1, protectionAtTick: 2, rescueAtTick: 3 });
const DONE = base({ recognitionAtTick: 0, contextAtTick: 1, protectionAtTick: 2, rescueAtTick: 3, reassessmentAtTick: 4 });
const STATES = [EMPTY, RECOGNIZED, CONTEXT, PROTECTED, RESCUED, DONE];

const LABELS = ['Recognize ICP crisis + activate help', 'Review monitor + whole context',
  'Activate first-tier brain protection', 'Activate individualized hyperosmolar rescue',
  'Review ICP + CPP trajectory'];

const props = (
  assessment: NonNullable<ActionCockpitProps['resuscitation']['intracranialHypertensionAssessment']>,
  extra: Partial<ActionCockpitProps> = {},
): ActionCockpitProps => ({
  scenario: SCENARIO, region: UNITED_STATES, infusions: [], hypnoticLine: { connected: true, inspected: false },
  resuscitation: { epinephrineEffectFraction: 0, epinephrineTotalMicrograms: 0, lastEpinephrineTick: null, crystalloidTotalMl: 0, dantroleneTotalMg: 0, dantroleneEffectFraction: 0, lastDantroleneTick: null, activeCooling: false, intracranialHypertensionAssessment: assessment },
  lastExposure: null, syringeRemaining: {},
  ventilator: { mode: 'volume-control', tidalVolumeMl: 480, respiratoryRateBpm: 16, fio2: 0.35, peep: 6, delivering: true, sevofluranePercent: 0, freshGasFlowLPerMin: 10 },
  intubated: true, airwayAttempts: 1, lastGrade: null, jawThrustCpapSecondsRemaining: 0, airwayDevice: 'tracheal-tube',
  supraglotticInsertionSecondsRemaining: 0, helpRequestedAtTick: null, muscleRigidityFraction: 0,
  onBolus: () => {}, onInfusion: () => {}, onHypnoticLine: () => {}, onFluid: () => {}, onVentilator: () => {},
  onLaryngoscopy: () => {}, onAirwayManeuver: () => {}, onEpinephrine: () => {}, onDantrolene: () => {},
  onCallForHelp: () => {}, onAirwayDevice: () => {}, onActiveCooling: () => {}, onDrugCard: () => {},
  onIntracranialHypertensionResponse: () => {}, ...extra,
});

const markup = (
  assessment: NonNullable<ActionCockpitProps['resuscitation']['intracranialHypertensionAssessment']>,
  extra: Partial<ActionCockpitProps> = {},
) => renderToStaticMarkup(createElement(ActionCockpit, props(assessment, extra)));

const lessonButtons = (html: string) => [...html.matchAll(/<button[^>]*>(.*?)<\/button>/g)]
  .map((match) => match[1]!).filter((label) => LABELS.some((known) => label.includes(known)));

describe('Intracranial hypertension experience', () => {
  it('is discoverable at its exact route', () => {
    const index = renderToStaticMarkup(createElement(PrerenderedBody, { path: '/critical-care' }));
    expect(index).toContain('href="/critical-care/scenario/intracranial-hypertension"');
    const route = renderToStaticMarkup(createElement(PrerenderedBody, { path: '/critical-care/scenario/intracranial-hypertension' }));
    expect(route).toContain(`<h1>${SCENARIO.metadata.title}</h1>`);
  });

  it('fails closed on the timeline target rather than the scenario id', () => {
    expect(crisisResponseAvailability(SCENARIO).hasIntracranialHypertensionResponse).toBe(true);
    expect(crisisResponseAvailability({
      ...SCENARIO,
      timeline: SCENARIO.timeline.filter((event) => event.target !== 'intracranial-hypertension'),
    }).hasIntracranialHypertensionResponse).toBe(false);
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
    for (const state of [EMPTY, RECOGNIZED, CONTEXT, PROTECTED, RESCUED]) {
      expect(openCount(markup(state))).toBe(1);
    }
    expect(openCount(markup(DONE))).toBe(0);
  });

  it('never offers an agent, a dose, or a ventilator target', () => {
    expect(markup(EMPTY)).toContain('Lower pressure. Preserve perfusion.');
    expect(markup(CONTEXT)).toContain('Treat pressure. Protect the patient.');
    for (const html of STATES.map((state) => markup(state))) {
      expect(lessonButtons(html).join(' ')).not.toMatch(/mannitol|hypertonic|\bg\/kg\b|\bmL\b|hyperventilat|diagnos|prognos/iu);
    }
  });
});

describe('Intracranial hypertension tutor and worked example', () => {
  it('says nothing at all on the unassisted setting', () => {
    expect(markup(EMPTY)).not.toContain('A moment to think');
    expect(markup(EMPTY, { intracranialHypertensionGuidance: 'unassisted' })).not.toContain('A moment to think');
  });

  it('reads the learner’s own recorded steps when guidance is on', () => {
    const opening = markup(EMPTY, { intracranialHypertensionGuidance: 'guided' });
    expect(opening).toContain('A moment to think');
    expect(opening).toContain('the figure the brain actually experiences');
    const context = markup(RECOGNIZED, { intracranialHypertensionGuidance: 'guided' });
    expect(context).toContain('ask whether something is causing it');
    expect(context).not.toContain('the figure the brain actually experiences');
  });

  it('names the mechanical problem osmotherapy cannot fix', () => {
    expect(markup(CONTEXT, { intracranialHypertensionGuidance: 'guided' }))
      .toContain('a partly obstructed drainage route that osmotherapy will not open');
  });

  it('states the lean without turning it into a rule', () => {
    expect(markup(PROTECTED, { intracranialHypertensionGuidance: 'guided' }))
      .toContain('there is a lean, and it is not a rule');
  });

  it('goes quiet once the trajectory is reassessed', () => {
    expect(markup(DONE, { intracranialHypertensionGuidance: 'guided' })).not.toContain('A moment to think');
  });

  it('leaves the controls visible but inert while the example runs', () => {
    const label = LABELS[0]!;
    expect(markup(EMPTY)).toContain(label);
    const watching = markup(EMPTY, { intracranialHypertensionGuidance: 'guided', intracranialHypertensionDemonstrating: true });
    expect(watching).toContain(label);
    expect(watching).toContain('aria-disabled="true"');
    expect(watching).toContain('Watching the worked example');
    expect(watching).not.toContain('A moment to think');
  });
});
