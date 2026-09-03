/** @vitest-environment jsdom */
/**
 * The tutor panel and worked-example inertness for the emergency
 * trauma-primary-survey tray. tests/ui/trauma-primary-survey.test.tsx already
 * covers the tray's pre-existing behaviour and is left alone.
 */
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { PrerenderedBody } from '@routes/Prerendered';
import { describe, expect, it } from 'vitest';
import { ActionCockpit, crisisResponseAvailability, type ActionCockpitProps } from '@anesthesia/ui/ActionCockpit';
import { UNITED_STATES } from '@anesthesia/region/profiles';
import { TRAUMA_PRIMARY_SURVEY as SCENARIO } from '../../src/modules/emergency-medicine/scenarios/trauma-primary-survey';

const base = (over: Record<string, unknown>) => ({
  activatedAtTick: null, catastrophicHemorrhageAtTick: null, airwayBreathingAtTick: null,
  circulationAtTick: null, disabilityExposureAtTick: null, repeatedAtTick: null,
  ...over,
} as NonNullable<ActionCockpitProps['resuscitation']['traumaPrimarySurveyAssessment']>);

const EMPTY = base({});
const ACTIVATED = base({ activatedAtTick: 0 });
const HEMORRHAGE = base({ activatedAtTick: 0, catastrophicHemorrhageAtTick: 1 });
const AIRWAY = base({ activatedAtTick: 0, catastrophicHemorrhageAtTick: 1, airwayBreathingAtTick: 2 });
const CIRCULATION = base({ activatedAtTick: 0, catastrophicHemorrhageAtTick: 1, airwayBreathingAtTick: 2, circulationAtTick: 3 });
const EXPOSURE = base({ activatedAtTick: 0, catastrophicHemorrhageAtTick: 1, airwayBreathingAtTick: 2, circulationAtTick: 3, disabilityExposureAtTick: 4 });
const DONE = base({ activatedAtTick: 0, catastrophicHemorrhageAtTick: 1, airwayBreathingAtTick: 2, circulationAtTick: 3, disabilityExposureAtTick: 4, repeatedAtTick: 5 });
const STATES = [EMPTY, ACTIVATED, HEMORRHAGE, AIRWAY, CIRCULATION, EXPOSURE, DONE];

const props = (
  assessment: NonNullable<ActionCockpitProps['resuscitation']['traumaPrimarySurveyAssessment']>,
  extra: Partial<ActionCockpitProps> = {},
): ActionCockpitProps => ({
  scenario: SCENARIO, region: UNITED_STATES, infusions: [], hypnoticLine: { connected: true, inspected: false },
  resuscitation: { epinephrineEffectFraction: 0, epinephrineTotalMicrograms: 0, lastEpinephrineTick: null, crystalloidTotalMl: 0, dantroleneTotalMg: 0, dantroleneEffectFraction: 0, lastDantroleneTick: null, activeCooling: false, traumaPrimarySurveyAssessment: assessment },
  lastExposure: null, syringeRemaining: {},
  ventilator: { mode: 'manual', tidalVolumeMl: 480, respiratoryRateBpm: 18, fio2: 0.21, peep: 0, delivering: false, sevofluranePercent: 0, freshGasFlowLPerMin: 10 },
  intubated: false, airwayAttempts: 0, lastGrade: null, jawThrustCpapSecondsRemaining: 0, airwayDevice: 'facemask',
  supraglotticInsertionSecondsRemaining: 0, helpRequestedAtTick: null, muscleRigidityFraction: 0,
  onBolus: () => {}, onInfusion: () => {}, onHypnoticLine: () => {}, onFluid: () => {}, onVentilator: () => {},
  onLaryngoscopy: () => {}, onAirwayManeuver: () => {}, onEpinephrine: () => {}, onDantrolene: () => {},
  onCallForHelp: () => {}, onAirwayDevice: () => {}, onActiveCooling: () => {}, onDrugCard: () => {},
  onTraumaPrimarySurveyResponse: () => {}, ...extra,
});

const markup = (
  assessment: NonNullable<ActionCockpitProps['resuscitation']['traumaPrimarySurveyAssessment']>,
  extra: Partial<ActionCockpitProps> = {},
) => renderToStaticMarkup(createElement(ActionCockpit, props(assessment, extra)));

describe('Emergency trauma primary survey experience', () => {
  it('is discoverable at its exact route', () => {
    const index = renderToStaticMarkup(createElement(PrerenderedBody, { path: '/emergency-medicine' }));
    expect(index).toContain('href="/emergency-medicine/scenario/trauma-primary-survey"');
    const route = renderToStaticMarkup(createElement(PrerenderedBody, { path: '/emergency-medicine/scenario/trauma-primary-survey' }));
    expect(route).toContain(`<h1>${SCENARIO.metadata.title}</h1>`);
  });

  it('fails closed on the timeline target rather than the scenario id', () => {
    expect(crisisResponseAvailability(SCENARIO).hasTraumaPrimarySurveyResponse).toBe(true);
    expect(crisisResponseAvailability({
      ...SCENARIO,
      timeline: SCENARIO.timeline.filter((event) => event.target !== 'trauma-primary-survey'),
    }).hasTraumaPrimarySurveyResponse).toBe(false);
  });

  it('never renders a clear-fluid volume or an outcome claim on any control', () => {
    for (const html of STATES.map((state) => markup(state))) {
      const labels = [...html.matchAll(/<button[^>]*>(.*?)<\/button>/g)].map((m) => m[1]!).join(' ');
      expect(labels).not.toMatch(/crystalloid|saline|\d+\s?(?:L|litres)\b|discharg|prognos/iu);
    }
  });
});

describe('Emergency trauma primary survey tutor and worked example', () => {
  it('says nothing at all on the unassisted setting', () => {
    expect(markup(EMPTY)).not.toContain('A moment to think');
    expect(markup(EMPTY, { traumaPrimarySurveyGuidance: 'unassisted' })).not.toContain('A moment to think');
  });

  it('reads the learner’s own recorded steps when guidance is on', () => {
    const opening = markup(EMPTY, { traumaPrimarySurveyGuidance: 'guided' });
    expect(opening).toContain('A moment to think');
    expect(opening).toContain('A handoff interrupted is a handoff repeated');
    const hemorrhage = markup(ACTIVATED, { traumaPrimarySurveyGuidance: 'guided' });
    expect(hemorrhage).toContain('Stop the bleeding first');
    expect(hemorrhage).not.toContain('A handoff interrupted is a handoff repeated');
  });

  it('carries the reason the C comes first', () => {
    expect(markup(ACTIVATED, { traumaPrimarySurveyGuidance: 'guided' }))
      .toContain('the airway of a patient who has bled out is not a problem anyone gets to solve');
  });

  it('reads persistent shock after external control as internal bleeding', () => {
    expect(markup(AIRWAY, { traumaPrimarySurveyGuidance: 'guided' }))
      .toContain('That means it is inside');
  });

  it('treats re-covering as treatment', () => {
    expect(markup(CIRCULATION, { traumaPrimarySurveyGuidance: 'guided' }))
      .toContain('cold blood does not clot');
  });

  it('goes quiet once the repeat survey is recorded', () => {
    expect(markup(DONE, { traumaPrimarySurveyGuidance: 'guided' })).not.toContain('A moment to think');
  });

  it('leaves the controls visible but inert while the example runs', () => {
    const watching = markup(EMPTY, { traumaPrimarySurveyGuidance: 'guided', traumaPrimarySurveyDemonstrating: true });
    expect(watching).toContain('aria-disabled="true"');
    expect(watching).toContain('Watching the worked example');
    expect(watching).not.toContain('A moment to think');
  });
});
