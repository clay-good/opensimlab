/** @vitest-environment jsdom */
/**
 * The tutor panel and worked-example inertness for the emergency STEMI tray.
 * tests/ui/stemi.test.tsx already covers the tray's pre-existing behaviour and
 * is left alone.
 */
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { PrerenderedBody } from '@routes/Prerendered';
import { describe, expect, it } from 'vitest';
import { ActionCockpit, crisisResponseAvailability, type ActionCockpitProps } from '@anesthesia/ui/ActionCockpit';
import { UNITED_STATES } from '@anesthesia/region/profiles';
import { STEMI as SCENARIO } from '../../src/modules/emergency-medicine/scenarios/stemi';

const base = (over: Record<string, unknown>) => ({
  patternReviewedAtTick: null, pathwayActivatedAtTick: null, aspirinAtTick: null,
  additionalAntithromboticsAtTick: null, reassessedAtTick: null,
  ...over,
} as NonNullable<ActionCockpitProps['resuscitation']['stemiAssessment']>);

const EMPTY = base({});
const PATTERN = base({ patternReviewedAtTick: 0 });
const PATHWAY = base({ patternReviewedAtTick: 0, pathwayActivatedAtTick: 1 });
const ASPIRIN_ONLY = base({ patternReviewedAtTick: 0, aspirinAtTick: 1 });
const ASPIRIN = base({ patternReviewedAtTick: 0, pathwayActivatedAtTick: 1, aspirinAtTick: 2 });
const ALL = base({ patternReviewedAtTick: 0, pathwayActivatedAtTick: 1, aspirinAtTick: 2, additionalAntithromboticsAtTick: 3 });
const DONE = base({ patternReviewedAtTick: 0, pathwayActivatedAtTick: 1, aspirinAtTick: 2, additionalAntithromboticsAtTick: 3, reassessedAtTick: 4 });
const STATES = [EMPTY, PATTERN, PATHWAY, ASPIRIN_ONLY, ASPIRIN, ALL, DONE];

const props = (
  assessment: NonNullable<ActionCockpitProps['resuscitation']['stemiAssessment']>,
  extra: Partial<ActionCockpitProps> = {},
): ActionCockpitProps => ({
  scenario: SCENARIO, region: UNITED_STATES, infusions: [], hypnoticLine: { connected: true, inspected: false },
  resuscitation: { epinephrineEffectFraction: 0, epinephrineTotalMicrograms: 0, lastEpinephrineTick: null, crystalloidTotalMl: 0, dantroleneTotalMg: 0, dantroleneEffectFraction: 0, lastDantroleneTick: null, activeCooling: false, stemiAssessment: assessment },
  lastExposure: null, syringeRemaining: {},
  ventilator: { mode: 'manual', tidalVolumeMl: 480, respiratoryRateBpm: 18, fio2: 0.21, peep: 0, delivering: false, sevofluranePercent: 0, freshGasFlowLPerMin: 10 },
  intubated: false, airwayAttempts: 0, lastGrade: null, jawThrustCpapSecondsRemaining: 0, airwayDevice: 'facemask',
  supraglotticInsertionSecondsRemaining: 0, helpRequestedAtTick: null, muscleRigidityFraction: 0,
  onBolus: () => {}, onInfusion: () => {}, onHypnoticLine: () => {}, onFluid: () => {}, onVentilator: () => {},
  onLaryngoscopy: () => {}, onAirwayManeuver: () => {}, onEpinephrine: () => {}, onDantrolene: () => {},
  onCallForHelp: () => {}, onAirwayDevice: () => {}, onActiveCooling: () => {}, onDrugCard: () => {},
  onStemiResponse: () => {}, ...extra,
});

const markup = (
  assessment: NonNullable<ActionCockpitProps['resuscitation']['stemiAssessment']>,
  extra: Partial<ActionCockpitProps> = {},
) => renderToStaticMarkup(createElement(ActionCockpit, props(assessment, extra)));

describe('Emergency STEMI experience', () => {
  it('is discoverable at its exact route', () => {
    const index = renderToStaticMarkup(createElement(PrerenderedBody, { path: '/emergency-medicine' }));
    expect(index).toContain('href="/emergency-medicine/scenario/stemi"');
    const route = renderToStaticMarkup(createElement(PrerenderedBody, { path: '/emergency-medicine/scenario/stemi' }));
    expect(route).toContain(`<h1>${SCENARIO.metadata.title}</h1>`);
  });

  it('fails closed on the timeline target rather than the scenario id', () => {
    expect(crisisResponseAvailability(SCENARIO).hasStemiResponse).toBe(true);
    expect(crisisResponseAvailability({ ...SCENARIO, timeline: [] }).hasStemiResponse).toBe(false);
  });

  it('never renders an agent name or an outcome claim on any control', () => {
    for (const html of STATES.map((state) => markup(state))) {
      // "hand off for reperfusion" is an authored control label and is the
      // lesson's own content, so the guard is on agent names and outcomes.
      const labels = [...html.matchAll(/<button[^>]*>(.*?)<\/button>/g)].map((m) => m[1]!).join(' ');
      expect(labels).not.toMatch(/ticagrelor|clopidogrel|prasugrel|heparin|reperfused|prognos|discharg/iu);
    }
  });
});

describe('Emergency STEMI tutor and worked example', () => {
  it('says nothing at all on the unassisted setting', () => {
    expect(markup(EMPTY)).not.toContain('A moment to think');
    expect(markup(EMPTY, { emergencyStemiGuidance: 'unassisted' })).not.toContain('A moment to think');
  });

  it('reads the learner’s own recorded steps when guidance is on', () => {
    const opening = markup(EMPTY, { emergencyStemiGuidance: 'guided' });
    expect(opening).toContain('A moment to think');
    expect(opening).toContain('a monitor lead is for rhythm');
    const initial = markup(PATTERN, { emergencyStemiGuidance: 'guided' });
    expect(initial).toContain('Only one of them opens the artery');
    expect(initial).not.toContain('a monitor lead is for rhythm');
  });

  it('puts the load-bearing claim where every path passes through', () => {
    const initial = markup(PATTERN, { emergencyStemiGuidance: 'guided' });
    expect(initial).toContain('which is exactly why the call is the one that gets made third');
    expect(initial).toContain('the necrosis has not had time to be measurable');
  });

  it('picks up the missing lane whichever one the learner left', () => {
    expect(markup(ASPIRIN_ONLY, { emergencyStemiGuidance: 'guided' }))
      .toContain('measured from when they were told');
    expect(markup(PATHWAY, { emergencyStemiGuidance: 'guided' }))
      .toContain('Chewed matters');
    expect(markup(ASPIRIN, { emergencyStemiGuidance: 'guided' }))
      .toContain('This records intents, not a prescription');
  });

  it('treats the absent oxygen mask as a deliberate choice', () => {
    expect(markup(ALL, { emergencyStemiGuidance: 'guided' }))
      .toContain('larger infarcts rather than smaller ones');
  });

  it('goes quiet once the handoff is recorded', () => {
    expect(markup(DONE, { emergencyStemiGuidance: 'guided' })).not.toContain('A moment to think');
  });

  it('leaves the controls visible but inert while the example runs', () => {
    const watching = markup(EMPTY, { emergencyStemiGuidance: 'guided', emergencyStemiDemonstrating: true });
    expect(watching).toContain('aria-disabled="true"');
    expect(watching).toContain('Watching the worked example');
    expect(watching).not.toContain('A moment to think');
  });
});
