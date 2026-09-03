/** @vitest-environment jsdom */
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { PrerenderedBody } from '@routes/Prerendered';
import { describe, expect, it } from 'vitest';
import { ActionCockpit, crisisResponseAvailability, type ActionCockpitProps } from '@anesthesia/ui/ActionCockpit';
import { UNITED_STATES } from '@anesthesia/region/profiles';
import { AUTO_PEEP as SCENARIO } from '../../src/modules/critical-care/scenarios/auto-peep';

const base = (over: Record<string, unknown>) => ({
  flowAtTick: null, measurementAtTick: null, classificationAtTick: null,
  correctionAtTick: null, reassessmentAtTick: null,
  ...over,
} as NonNullable<ActionCockpitProps['resuscitation']['autoPeepAssessment']>);

const EMPTY = base({});
const FLOW = base({ flowAtTick: 0 });
const MEASURED = base({ flowAtTick: 0, measurementAtTick: 1 });
const CLASSIFIED = base({ flowAtTick: 0, measurementAtTick: 1, classificationAtTick: 2 });
const CORRECTED = base({ flowAtTick: 0, measurementAtTick: 1, classificationAtTick: 2, correctionAtTick: 3 });
const DONE = base({ flowAtTick: 0, measurementAtTick: 1, classificationAtTick: 2, correctionAtTick: 3, reassessmentAtTick: 4 });
const STATES = [EMPTY, FLOW, MEASURED, CLASSIFIED, CORRECTED, DONE];

const LABELS = ['Review patient + expiratory flow', 'Review passive expiratory hold',
  'Classify the bounded pattern', 'Treat resistance + preserve exhalation',
  'Review 10-minute response'];

const props = (
  assessment: NonNullable<ActionCockpitProps['resuscitation']['autoPeepAssessment']>,
  extra: Partial<ActionCockpitProps> = {},
): ActionCockpitProps => ({
  scenario: SCENARIO, region: UNITED_STATES, infusions: [], hypnoticLine: { connected: true, inspected: false },
  resuscitation: { epinephrineEffectFraction: 0, epinephrineTotalMicrograms: 0, lastEpinephrineTick: null, crystalloidTotalMl: 0, dantroleneTotalMg: 0, dantroleneEffectFraction: 0, lastDantroleneTick: null, activeCooling: false, autoPeepAssessment: assessment },
  lastExposure: null, syringeRemaining: {},
  ventilator: { mode: 'volume-control', tidalVolumeMl: 480, respiratoryRateBpm: 28, fio2: 0.4, peep: 5, delivering: true, sevofluranePercent: 0, freshGasFlowLPerMin: 0.5 },
  intubated: true, airwayAttempts: 0, lastGrade: null, jawThrustCpapSecondsRemaining: 0, airwayDevice: 'tracheal-tube',
  supraglotticInsertionSecondsRemaining: 0, helpRequestedAtTick: null, muscleRigidityFraction: 0,
  onBolus: () => {}, onInfusion: () => {}, onHypnoticLine: () => {}, onFluid: () => {}, onVentilator: () => {},
  onLaryngoscopy: () => {}, onAirwayManeuver: () => {}, onEpinephrine: () => {}, onDantrolene: () => {},
  onCallForHelp: () => {}, onAirwayDevice: () => {}, onActiveCooling: () => {}, onDrugCard: () => {},
  onAutoPeepResponse: () => {}, ...extra,
});

const markup = (
  assessment: NonNullable<ActionCockpitProps['resuscitation']['autoPeepAssessment']>,
  extra: Partial<ActionCockpitProps> = {},
) => renderToStaticMarkup(createElement(ActionCockpit, props(assessment, extra)));

const lessonButtons = (html: string) => [...html.matchAll(/<button[^>]*>(.*?)<\/button>/g)]
  .map((match) => match[1]!).filter((label) => LABELS.some((known) => label.includes(known)));

describe('Auto-PEEP experience', () => {
  it('is discoverable at its exact route', () => {
    const index = renderToStaticMarkup(createElement(PrerenderedBody, { path: '/critical-care' }));
    expect(index).toContain('href="/critical-care/scenario/auto-peep"');
    const route = renderToStaticMarkup(createElement(PrerenderedBody, { path: '/critical-care/scenario/auto-peep' }));
    expect(route).toContain(`<h1>${SCENARIO.metadata.title}</h1>`);
  });

  it('fails closed on the timeline target rather than the scenario id', () => {
    expect(crisisResponseAvailability(SCENARIO).hasAutoPeepResponse).toBe(true);
    expect(crisisResponseAvailability({
      ...SCENARIO,
      timeline: SCENARIO.timeline.filter((event) => event.target !== 'auto-peep'),
    }).hasAutoPeepResponse).toBe(false);
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
    for (const state of [EMPTY, FLOW, MEASURED, CLASSIFIED, CORRECTED]) {
      expect(openCount(markup(state))).toBe(1);
    }
    expect(openCount(markup(DONE))).toBe(0);
  });

  it('never offers a rate, a volume, a PEEP setting, or a drug', () => {
    expect(markup(EMPTY)).toContain('Watch the breath leave.');
    expect(markup(CLASSIFIED)).toContain('Make room for the next breath.');
    for (const html of STATES.map((state) => markup(state))) {
      expect(lessonButtons(html).join(' ')).not.toMatch(/examin|salbutamol|albuterol|\bmg\b|\bmL\b|cm H|sedat|paralys|diagnos|prognos/iu);
    }
  });
});

describe('Auto-PEEP tutor and worked example', () => {
  it('says nothing at all on the unassisted setting', () => {
    expect(markup(EMPTY)).not.toContain('A moment to think');
    expect(markup(EMPTY, { autoPeepGuidance: 'unassisted' })).not.toContain('A moment to think');
  });

  it('reads the learner’s own recorded steps when guidance is on', () => {
    const opening = markup(EMPTY, { autoPeepGuidance: 'guided' });
    expect(opening).toContain('A moment to think');
    expect(opening).toContain('resistance rather than stiff lungs');
    const measure = markup(FLOW, { autoPeepGuidance: 'guided' });
    expect(measure).toContain('a reading that means nothing');
    expect(measure).not.toContain('resistance rather than stiff lungs');
  });

  it('links the trapped pressure to her blood pressure', () => {
    expect(markup(MEASURED, { autoPeepGuidance: 'guided' }))
      .toContain('which is why her blood pressure is what it is');
  });

  it('names the rate as the setting that looks like it is helping', () => {
    expect(markup(CLASSIFIED, { autoPeepGuidance: 'guided' }))
      .toContain('the setting that looks like it is helping her carbon dioxide');
  });

  it('goes quiet once the response is reassessed', () => {
    expect(markup(DONE, { autoPeepGuidance: 'guided' })).not.toContain('A moment to think');
  });

  it('leaves the controls visible but inert while the example runs', () => {
    const label = LABELS[0]!;
    expect(markup(EMPTY)).toContain(label);
    const watching = markup(EMPTY, { autoPeepGuidance: 'guided', autoPeepDemonstrating: true });
    expect(watching).toContain(label);
    expect(watching).toContain('aria-disabled="true"');
    expect(watching).toContain('Watching the worked example');
    expect(watching).not.toContain('A moment to think');
  });
});
