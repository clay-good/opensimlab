/** @vitest-environment jsdom */
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { PrerenderedBody } from '@routes/Prerendered';
import { describe, expect, it } from 'vitest';
import { ActionCockpit, crisisResponseAvailability, type ActionCockpitProps } from '@anesthesia/ui/ActionCockpit';
import { UNITED_STATES } from '@anesthesia/region/profiles';
import { STATUS_EPILEPTICUS as SCENARIO } from '../../src/modules/critical-care/scenarios/status-epilepticus';

const base = (over: Record<string, unknown>) => ({
  recognitionAtTick: null, patternAtTick: null, pathwayAtTick: null,
  causesAtTick: null, reassessmentAtTick: null,
  ...over,
} as NonNullable<ActionCockpitProps['resuscitation']['criticalCareStatusEpilepticusAssessment']>);

const EMPTY = base({});
const RECOGNIZED = base({ recognitionAtTick: 0 });
const PATTERN = base({ recognitionAtTick: 0, patternAtTick: 1 });
const PATHWAY = base({ recognitionAtTick: 0, patternAtTick: 1, pathwayAtTick: 2 });
const CAUSES = base({ recognitionAtTick: 0, patternAtTick: 1, pathwayAtTick: 2, causesAtTick: 3 });
const DONE = base({ recognitionAtTick: 0, patternAtTick: 1, pathwayAtTick: 2, causesAtTick: 3, reassessmentAtTick: 4 });
const STATES = [EMPTY, RECOGNIZED, PATTERN, PATHWAY, CAUSES, DONE];

const LABELS = ['Recognize refractory status + activate help', 'Review EEG + systemic context',
  'Activate continuous therapy + EEG', 'Keep reversible causes active',
  'Review EEG + organ trajectory'];

const props = (
  assessment: NonNullable<ActionCockpitProps['resuscitation']['criticalCareStatusEpilepticusAssessment']>,
  extra: Partial<ActionCockpitProps> = {},
): ActionCockpitProps => ({
  scenario: SCENARIO, region: UNITED_STATES, infusions: [], hypnoticLine: { connected: true, inspected: false },
  resuscitation: { epinephrineEffectFraction: 0, epinephrineTotalMicrograms: 0, lastEpinephrineTick: null, crystalloidTotalMl: 0, dantroleneTotalMg: 0, dantroleneEffectFraction: 0, lastDantroleneTick: null, activeCooling: false, criticalCareStatusEpilepticusAssessment: assessment },
  lastExposure: null, syringeRemaining: {},
  ventilator: { mode: 'volume-control', tidalVolumeMl: 480, respiratoryRateBpm: 18, fio2: 0.4, peep: 5, delivering: true, sevofluranePercent: 0, freshGasFlowLPerMin: 10 },
  intubated: true, airwayAttempts: 1, lastGrade: null, jawThrustCpapSecondsRemaining: 0, airwayDevice: 'tracheal-tube',
  supraglotticInsertionSecondsRemaining: 0, helpRequestedAtTick: null, muscleRigidityFraction: 0,
  onBolus: () => {}, onInfusion: () => {}, onHypnoticLine: () => {}, onFluid: () => {}, onVentilator: () => {},
  onLaryngoscopy: () => {}, onAirwayManeuver: () => {}, onEpinephrine: () => {}, onDantrolene: () => {},
  onCallForHelp: () => {}, onAirwayDevice: () => {}, onActiveCooling: () => {}, onDrugCard: () => {},
  onCriticalCareStatusEpilepticusResponse: () => {}, ...extra,
});

const markup = (
  assessment: NonNullable<ActionCockpitProps['resuscitation']['criticalCareStatusEpilepticusAssessment']>,
  extra: Partial<ActionCockpitProps> = {},
) => renderToStaticMarkup(createElement(ActionCockpit, props(assessment, extra)));

const lessonButtons = (html: string) => [...html.matchAll(/<button[^>]*>(.*?)<\/button>/g)]
  .map((match) => match[1]!).filter((label) => LABELS.some((known) => label.includes(known)));

describe('Refractory status epilepticus chain and boundaries', () => {
  it('is discoverable at its exact route', () => {
    const index = renderToStaticMarkup(createElement(PrerenderedBody, { path: '/critical-care' }));
    expect(index).toContain('href="/critical-care/scenario/status-epilepticus"');
    const route = renderToStaticMarkup(createElement(PrerenderedBody, { path: '/critical-care/scenario/status-epilepticus' }));
    expect(route).toContain(`<h1>${SCENARIO.metadata.title}</h1>`);
  });

  it('fails closed on the timeline target rather than the scenario id', () => {
    expect(crisisResponseAvailability(SCENARIO).hasCriticalCareStatusEpilepticusResponse).toBe(true);
    expect(crisisResponseAvailability({
      ...SCENARIO,
      timeline: SCENARIO.timeline.filter((event) => event.target !== 'critical-care-status-epilepticus'),
    }).hasCriticalCareStatusEpilepticusResponse).toBe(false);
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
    for (const state of [EMPTY, RECOGNIZED, PATTERN, PATHWAY, CAUSES]) {
      expect(openCount(markup(state))).toBe(1);
    }
    expect(openCount(markup(DONE))).toBe(0);
  });

  it('never offers an agent, a dose, or a burst-suppression target', () => {
    expect(markup(EMPTY)).toContain('Movement stopped. The seizure did not.');
    expect(markup(PATTERN)).toContain('Suppress the seizure. Protect the patient.');
    for (const html of STATES.map((state) => markup(state))) {
      expect(lessonButtons(html).join(' ')).not.toMatch(/propofol|midazolam|ketamine|burst|\bmg\b|lumbar|diagnos|prognos/iu);
    }
  });
});

describe('Refractory status epilepticus tutor and worked example', () => {
  it('says nothing at all on the unassisted setting', () => {
    expect(markup(EMPTY)).not.toContain('A moment to think');
    expect(markup(EMPTY, { criticalCareStatusEpilepticusGuidance: 'unassisted' })).not.toContain('A moment to think');
  });

  it('reads the learner’s own recorded steps when guidance is on', () => {
    const opening = markup(EMPTY, { criticalCareStatusEpilepticusGuidance: 'guided' });
    expect(opening).toContain('A moment to think');
    expect(opening).toContain('a still patient looks like a treated patient');
    const pattern = markup(RECOGNIZED, { criticalCareStatusEpilepticusGuidance: 'guided' });
    expect(pattern).toContain('a brain seizing for an hour has a body attached');
    expect(pattern).not.toContain('a still patient looks like a treated patient');
  });

  it('makes the guardrails the content of the pathway step', () => {
    expect(markup(PATTERN, { criticalCareStatusEpilepticusGuidance: 'guided' }))
      .toContain('titrating an anesthetic against seizures you cannot see is guessing');
  });

  it('keeps the cause search open next to a plausible story', () => {
    expect(markup(PATHWAY, { criticalCareStatusEpilepticusGuidance: 'guided' }))
      .toContain('a plausible story is the thing most likely to end the search early');
  });

  it('goes quiet once the trajectory is reassessed', () => {
    expect(markup(DONE, { criticalCareStatusEpilepticusGuidance: 'guided' })).not.toContain('A moment to think');
  });

  it('leaves the controls visible but inert while the example runs', () => {
    const label = LABELS[0]!;
    expect(markup(EMPTY)).toContain(label);
    const watching = markup(EMPTY, { criticalCareStatusEpilepticusGuidance: 'guided', criticalCareStatusEpilepticusDemonstrating: true });
    expect(watching).toContain(label);
    expect(watching).toContain('aria-disabled="true"');
    expect(watching).toContain('Watching the worked example');
    expect(watching).not.toContain('A moment to think');
  });
});
