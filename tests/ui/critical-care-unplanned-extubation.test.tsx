/** @vitest-environment jsdom */
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { PrerenderedBody } from '@routes/Prerendered';
import { describe, expect, it } from 'vitest';
import { ActionCockpit, crisisResponseAvailability, type ActionCockpitProps } from '@anesthesia/ui/ActionCockpit';
import { UNITED_STATES } from '@anesthesia/region/profiles';
import { UNPLANNED_EXTUBATION as SCENARIO } from '../../src/modules/critical-care/scenarios/unplanned-extubation';

const base = (over: Record<string, unknown>) => ({
  supportAtTick: null, assessmentAtTick: null, failureAtTick: null,
  airwayPlanAtTick: null, reassessmentAtTick: null,
  ...over,
} as NonNullable<ActionCockpitProps['resuscitation']['unplannedExtubationAssessment']>);

const EMPTY = base({});
const SUPPORTED = base({ supportAtTick: 0 });
const ASSESSED = base({ supportAtTick: 0, assessmentAtTick: 1 });
const CLASSIFIED = base({ supportAtTick: 0, assessmentAtTick: 1, failureAtTick: 2 });
const PLANNED = base({ supportAtTick: 0, assessmentAtTick: 1, failureAtTick: 2, airwayPlanAtTick: 3 });
const DONE = base({ supportAtTick: 0, assessmentAtTick: 1, failureAtTick: 2, airwayPlanAtTick: 3, reassessmentAtTick: 4 });
const STATES = [EMPTY, SUPPORTED, ASSESSED, CLASSIFIED, PLANNED, DONE];

const LABELS = ['Oxygenate + call airway help', 'Read the whole-patient panel',
  'Classify this trajectory as failing', 'Record prompt reintubation plan',
  'Prove placement + hand off learning'];

const props = (
  assessment: NonNullable<ActionCockpitProps['resuscitation']['unplannedExtubationAssessment']>,
  extra: Partial<ActionCockpitProps> = {},
): ActionCockpitProps => ({
  scenario: SCENARIO, region: UNITED_STATES, infusions: [], hypnoticLine: { connected: true, inspected: false },
  resuscitation: { epinephrineEffectFraction: 0, epinephrineTotalMicrograms: 0, lastEpinephrineTick: null, crystalloidTotalMl: 0, dantroleneTotalMg: 0, dantroleneEffectFraction: 0, lastDantroleneTick: null, activeCooling: false, unplannedExtubationAssessment: assessment },
  lastExposure: null, syringeRemaining: {},
  ventilator: { mode: 'manual', tidalVolumeMl: 450, respiratoryRateBpm: 36, fio2: 1, peep: 0, delivering: false, sevofluranePercent: 0, freshGasFlowLPerMin: 0.5 },
  intubated: false, airwayAttempts: 0, lastGrade: null, jawThrustCpapSecondsRemaining: 0, airwayDevice: 'facemask',
  supraglotticInsertionSecondsRemaining: 0, helpRequestedAtTick: null, muscleRigidityFraction: 0,
  onBolus: () => {}, onInfusion: () => {}, onHypnoticLine: () => {}, onFluid: () => {}, onVentilator: () => {},
  onLaryngoscopy: () => {}, onAirwayManeuver: () => {}, onEpinephrine: () => {}, onDantrolene: () => {},
  onCallForHelp: () => {}, onAirwayDevice: () => {}, onActiveCooling: () => {}, onDrugCard: () => {},
  onUnplannedExtubationResponse: () => {}, ...extra,
});

const markup = (
  assessment: NonNullable<ActionCockpitProps['resuscitation']['unplannedExtubationAssessment']>,
  extra: Partial<ActionCockpitProps> = {},
) => renderToStaticMarkup(createElement(ActionCockpit, props(assessment, extra)));

const lessonButtons = (html: string) => [...html.matchAll(/<button[^>]*>(.*?)<\/button>/g)]
  .map((match) => match[1]!).filter((label) => LABELS.some((known) => label.includes(known)));

describe('Unplanned-extubation experience', () => {
  it('is discoverable at its exact route', () => {
    const index = renderToStaticMarkup(createElement(PrerenderedBody, { path: '/critical-care' }));
    expect(index).toContain('href="/critical-care/scenario/unplanned-extubation"');
    const route = renderToStaticMarkup(createElement(PrerenderedBody, { path: '/critical-care/scenario/unplanned-extubation' }));
    expect(route).toContain(`<h1>${SCENARIO.metadata.title}</h1>`);
  });

  it('fails closed on the timeline target rather than the scenario id', () => {
    expect(crisisResponseAvailability(SCENARIO).hasUnplannedExtubationResponse).toBe(true);
    expect(crisisResponseAvailability({
      ...SCENARIO,
      timeline: SCENARIO.timeline.filter((event) => event.target !== 'unplanned-extubation'),
    }).hasUnplannedExtubationResponse).toBe(false);
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
    for (const state of [EMPTY, SUPPORTED, ASSESSED, CLASSIFIED, PLANNED]) {
      expect(openCount(markup(state))).toBe(1);
    }
    expect(openCount(markup(DONE))).toBe(0);
  });

  it('never offers to intubate, name a drug, or reach for noninvasive support', () => {
    expect(markup(EMPTY)).toContain('The tube is out. Read the patient.');
    expect(markup(CLASSIFIED)).toContain('Don’t rent time from failure.');
    for (const html of STATES.map((state) => markup(state))) {
      expect(lessonButtons(html).join(' ')).not.toMatch(/examin|ketamine|rocuron|propofol|laryngoscop|\bBiPAP\b|\bNIV\b|\bmg\b|diagnos|prognos/iu);
    }
  });
});

describe('Unplanned-extubation tutor and worked example', () => {
  it('says nothing at all on the unassisted setting', () => {
    expect(markup(EMPTY)).not.toContain('A moment to think');
    expect(markup(EMPTY, { unplannedExtubationGuidance: 'unassisted' })).not.toContain('A moment to think');
  });

  it('reads the learner’s own recorded steps when guidance is on', () => {
    const opening = markup(EMPTY, { unplannedExtubationGuidance: 'guided' });
    expect(opening).toContain('A moment to think');
    expect(opening).toContain('a step rather than a courtesy');
    const assess = markup(SUPPORTED, { unplannedExtubationGuidance: 'guided' });
    expect(assess).toContain('This is the step worth defending');
    expect(assess).not.toContain('a step rather than a courtesy');
  });

  it('counts the converging axes', () => {
    expect(markup(ASSESSED, { unplannedExtubationGuidance: 'guided' }))
      .toContain('Four separate axes converge');
  });

  it('refuses noninvasive support here without dismissing it generally', () => {
    const html = markup(CLASSIFIED, { unplannedExtubationGuidance: 'guided' });
    expect(html).toContain('taken from the intubation that is going to happen anyway');
    expect(html).toContain('different from noninvasive support having no place');
  });

  it('goes quiet once the response is reassessed', () => {
    expect(markup(DONE, { unplannedExtubationGuidance: 'guided' })).not.toContain('A moment to think');
  });

  it('leaves the controls visible but inert while the example runs', () => {
    const label = LABELS[0]!;
    expect(markup(EMPTY)).toContain(label);
    const watching = markup(EMPTY, { unplannedExtubationGuidance: 'guided', unplannedExtubationDemonstrating: true });
    expect(watching).toContain(label);
    expect(watching).toContain('aria-disabled="true"');
    expect(watching).toContain('Watching the worked example');
    expect(watching).not.toContain('A moment to think');
  });
});
