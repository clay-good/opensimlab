/** @vitest-environment jsdom */
/**
 * The tutor panel and worked-example inertness for the emergency
 * status-epilepticus tray. tests/ui/status-epilepticus.test.tsx already covers
 * the tray's pre-existing behaviour and is left alone.
 */
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { PrerenderedBody } from '@routes/Prerendered';
import { describe, expect, it } from 'vitest';
import { ActionCockpit, crisisResponseAvailability, type ActionCockpitProps } from '@anesthesia/ui/ActionCockpit';
import { UNITED_STATES } from '@anesthesia/region/profiles';
import { STATUS_EPILEPTICUS as SCENARIO } from '../../src/modules/emergency-medicine/scenarios/status-epilepticus';

const base = (over: Record<string, unknown>) => ({
  reviewedAtTick: null, supportedAtTick: null, lorazepamAtTick: null, reassessedAtTick: null,
  ...over,
} as NonNullable<ActionCockpitProps['resuscitation']['statusEpilepticusAssessment']>);

const EMPTY = base({});
const REVIEWED = base({ reviewedAtTick: 0 });
const SUPPORTED = base({ reviewedAtTick: 0, supportedAtTick: 1 });
const TREATED = base({ reviewedAtTick: 0, supportedAtTick: 1, lorazepamAtTick: 2 });
const DONE = base({ reviewedAtTick: 0, supportedAtTick: 1, lorazepamAtTick: 2, reassessedAtTick: 3 });
const STATES = [EMPTY, REVIEWED, SUPPORTED, TREATED, DONE];

const props = (
  assessment: NonNullable<ActionCockpitProps['resuscitation']['statusEpilepticusAssessment']>,
  extra: Partial<ActionCockpitProps> = {},
): ActionCockpitProps => ({
  scenario: SCENARIO, region: UNITED_STATES, infusions: [], hypnoticLine: { connected: true, inspected: false },
  resuscitation: { epinephrineEffectFraction: 0, epinephrineTotalMicrograms: 0, lastEpinephrineTick: null, crystalloidTotalMl: 0, dantroleneTotalMg: 0, dantroleneEffectFraction: 0, lastDantroleneTick: null, activeCooling: false, seizureActivityFraction: 1, statusEpilepticusAssessment: assessment } as never,
  lastExposure: null, syringeRemaining: {},
  ventilator: { mode: 'manual', tidalVolumeMl: 480, respiratoryRateBpm: 18, fio2: 0.21, peep: 0, delivering: false, sevofluranePercent: 0, freshGasFlowLPerMin: 10 },
  intubated: false, airwayAttempts: 0, lastGrade: null, jawThrustCpapSecondsRemaining: 0, airwayDevice: 'facemask',
  supraglotticInsertionSecondsRemaining: 0, helpRequestedAtTick: null, muscleRigidityFraction: 0,
  onBolus: () => {}, onInfusion: () => {}, onHypnoticLine: () => {}, onFluid: () => {}, onVentilator: () => {},
  onLaryngoscopy: () => {}, onAirwayManeuver: () => {}, onEpinephrine: () => {}, onDantrolene: () => {},
  onCallForHelp: () => {}, onAirwayDevice: () => {}, onActiveCooling: () => {}, onDrugCard: () => {},
  onStatusEpilepticusResponse: () => {}, ...extra,
});

const markup = (
  assessment: NonNullable<ActionCockpitProps['resuscitation']['statusEpilepticusAssessment']>,
  extra: Partial<ActionCockpitProps> = {},
) => renderToStaticMarkup(createElement(ActionCockpit, props(assessment, extra)));

describe('Emergency status epilepticus experience', () => {
  it('is discoverable at its exact route', () => {
    const index = renderToStaticMarkup(createElement(PrerenderedBody, { path: '/emergency-medicine' }));
    expect(index).toContain('href="/emergency-medicine/scenario/status-epilepticus"');
    const route = renderToStaticMarkup(createElement(PrerenderedBody, { path: '/emergency-medicine/scenario/status-epilepticus' }));
    expect(route).toContain(`<h1>${SCENARIO.metadata.title}</h1>`);
  });

  it('fails closed on the seizure event rather than the scenario id', () => {
    expect(crisisResponseAvailability(SCENARIO).hasStatusEpilepticusResponse).toBe(true);
    expect(crisisResponseAvailability({
      ...SCENARIO, timeline: SCENARIO.timeline.filter((event) => event.type !== 'status-epilepticus'),
    }).hasStatusEpilepticusResponse).toBe(false);
  });

  it('never renders a second benzodiazepine dose or an outcome claim on any control', () => {
    for (const html of STATES.map((state) => markup(state))) {
      const labels = [...html.matchAll(/<button[^>]*>(.*?)<\/button>/g)].map((m) => m[1]!).join(' ');
      expect(labels).not.toMatch(/repeat lorazepam|second dose|restrain|discharg|prognos/iu);
    }
  });
});

describe('Emergency status epilepticus tutor and worked example', () => {
  it('says nothing at all on the unassisted setting', () => {
    expect(markup(EMPTY)).not.toContain('A moment to think');
    expect(markup(EMPTY, { statusEpilepticusGuidance: 'unassisted' })).not.toContain('A moment to think');
  });

  it('reads the learner’s own recorded steps when guidance is on', () => {
    const opening = markup(EMPTY, { statusEpilepticusGuidance: 'guided' });
    expect(opening).toContain('A moment to think');
    expect(opening).toContain('waiting for a biological answer costs neurons');
    const bundle = markup(REVIEWED, { statusEpilepticusGuidance: 'guided' });
    expect(bundle).toContain('the worst kind of apparent success');
    expect(bundle).not.toContain('waiting for a biological answer costs neurons');
  });

  it('names the underdose as the commonest benzodiazepine error', () => {
    expect(markup(SUPPORTED, { statusEpilepticusGuidance: 'guided' }))
      .toContain('giving too little of the right one and then waiting');
  });

  it('holds the second-line boundary at the reassessment', () => {
    expect(markup(TREATED, { statusEpilepticusGuidance: 'guided' }))
      .toContain('rather than a second dose of the same benzodiazepine');
  });

  it('goes quiet once the reassessment is recorded', () => {
    expect(markup(DONE, { statusEpilepticusGuidance: 'guided' })).not.toContain('A moment to think');
  });

  it('leaves the controls visible but inert while the example runs', () => {
    const watching = markup(EMPTY, { statusEpilepticusGuidance: 'guided', statusEpilepticusDemonstrating: true });
    expect(watching).toContain('aria-disabled="true"');
    expect(watching).toContain('Watching the worked example');
    expect(watching).not.toContain('A moment to think');
  });
});
