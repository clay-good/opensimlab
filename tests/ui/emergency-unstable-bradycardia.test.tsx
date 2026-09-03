/** @vitest-environment jsdom */
/**
 * The tutor panel and worked-example inertness for the emergency
 * unstable-bradycardia tray. tests/ui/unstable-bradycardia.test.tsx already
 * covers the tray's pre-existing behaviour and is left alone.
 */
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { PrerenderedBody } from '@routes/Prerendered';
import { describe, expect, it } from 'vitest';
import { ActionCockpit, crisisResponseAvailability, type ActionCockpitProps } from '@anesthesia/ui/ActionCockpit';
import { UNITED_STATES } from '@anesthesia/region/profiles';
import { UNSTABLE_BRADYCARDIA as SCENARIO } from '../../src/modules/emergency-medicine/scenarios/unstable-bradycardia';

const base = (over: Record<string, unknown>) => ({
  reviewedAtTick: null, supportedAtTick: null, atropineAtTick: null, reassessedAtTick: null,
  ...over,
} as NonNullable<ActionCockpitProps['resuscitation']['unstableBradycardiaAssessment']>);

const EMPTY = base({});
const REVIEWED = base({ reviewedAtTick: 0 });
const SUPPORTED = base({ reviewedAtTick: 0, supportedAtTick: 1 });
const ATROPINE = base({ reviewedAtTick: 0, supportedAtTick: 1, atropineAtTick: 2 });
const DONE = base({ reviewedAtTick: 0, supportedAtTick: 1, atropineAtTick: 2, reassessedAtTick: 3 });
const STATES = [EMPTY, REVIEWED, SUPPORTED, ATROPINE, DONE];

const props = (
  assessment: NonNullable<ActionCockpitProps['resuscitation']['unstableBradycardiaAssessment']>,
  extra: Partial<ActionCockpitProps> = {},
): ActionCockpitProps => ({
  scenario: SCENARIO, region: UNITED_STATES, infusions: [], hypnoticLine: { connected: true, inspected: false },
  resuscitation: { epinephrineEffectFraction: 0, epinephrineTotalMicrograms: 0, lastEpinephrineTick: null, crystalloidTotalMl: 0, dantroleneTotalMg: 0, dantroleneEffectFraction: 0, lastDantroleneTick: null, activeCooling: false, unstableBradycardiaAssessment: assessment },
  lastExposure: null, syringeRemaining: {},
  ventilator: { mode: 'manual', tidalVolumeMl: 480, respiratoryRateBpm: 18, fio2: 0.21, peep: 0, delivering: false, sevofluranePercent: 0, freshGasFlowLPerMin: 10 },
  intubated: false, airwayAttempts: 0, lastGrade: null, jawThrustCpapSecondsRemaining: 0, airwayDevice: 'facemask',
  supraglotticInsertionSecondsRemaining: 0, helpRequestedAtTick: null, muscleRigidityFraction: 0,
  onBolus: () => {}, onInfusion: () => {}, onHypnoticLine: () => {}, onFluid: () => {}, onVentilator: () => {},
  onLaryngoscopy: () => {}, onAirwayManeuver: () => {}, onEpinephrine: () => {}, onDantrolene: () => {},
  onCallForHelp: () => {}, onAirwayDevice: () => {}, onActiveCooling: () => {}, onDrugCard: () => {},
  onUnstableBradycardiaResponse: () => {}, ...extra,
});

const markup = (
  assessment: NonNullable<ActionCockpitProps['resuscitation']['unstableBradycardiaAssessment']>,
  extra: Partial<ActionCockpitProps> = {},
) => renderToStaticMarkup(createElement(ActionCockpit, props(assessment, extra)));

describe('Emergency unstable bradycardia experience', () => {
  it('is discoverable at its exact route', () => {
    const index = renderToStaticMarkup(createElement(PrerenderedBody, { path: '/emergency-medicine' }));
    expect(index).toContain('href="/emergency-medicine/scenario/unstable-bradycardia"');
    const route = renderToStaticMarkup(createElement(PrerenderedBody, { path: '/emergency-medicine/scenario/unstable-bradycardia' }));
    expect(route).toContain(`<h1>${SCENARIO.metadata.title}</h1>`);
  });

  it('fails closed on the timeline target rather than the scenario id', () => {
    expect(crisisResponseAvailability(SCENARIO).hasUnstableBradycardiaResponse).toBe(true);
    expect(crisisResponseAvailability({
      ...SCENARIO, timeline: SCENARIO.timeline.filter((event) => event.type !== 'narrative'),
    }).hasUnstableBradycardiaResponse).toBe(false);
  });

  it('never renders pacing, an infusion, or an outcome claim on any control', () => {
    for (const html of STATES.map((state) => markup(state))) {
      const labels = [...html.matchAll(/<button[^>]*>(.*?)<\/button>/g)].map((m) => m[1]!).join(' ');
      expect(labels).not.toMatch(/pacing|pacer|dopamine|epinephrine infusion|discharg|prognos|resolved/iu);
    }
  });
});

describe('Emergency unstable bradycardia tutor and worked example', () => {
  it('says nothing at all on the unassisted setting', () => {
    expect(markup(EMPTY)).not.toContain('A moment to think');
    expect(markup(EMPTY, { unstableBradycardiaGuidance: 'unassisted' })).not.toContain('A moment to think');
  });

  it('reads the learner’s own recorded steps when guidance is on', () => {
    const opening = markup(EMPTY, { unstableBradycardiaGuidance: 'guided' });
    expect(opening).toContain('A moment to think');
    expect(opening).toContain('a sleeping endurance athlete');
    const support = markup(REVIEWED, { unstableBradycardiaGuidance: 'guided' });
    expect(support).toContain('hypoxia is itself a cause of bradycardia');
    expect(support).not.toContain('a sleeping endurance athlete');
  });

  it('says why positive-pressure ventilation is deliberately not selected', () => {
    expect(markup(REVIEWED, { unstableBradycardiaGuidance: 'guided' }))
      .toContain('costs preload he cannot spare');
  });

  it('says what the atropine buys and when it fails', () => {
    expect(markup(SUPPORTED, { unstableBradycardiaGuidance: 'guided' }))
      .toContain('unreliable when the block is below the node');
  });

  it('refuses to treat a good panel as permission to stop', () => {
    expect(markup(ATROPINE, { unstableBradycardiaGuidance: 'guided' }))
      .toContain('the thing not to take from a good panel is permission to stop');
  });

  it('goes quiet once the reassessment is recorded', () => {
    expect(markup(DONE, { unstableBradycardiaGuidance: 'guided' })).not.toContain('A moment to think');
  });

  it('leaves the controls visible but inert while the example runs', () => {
    const watching = markup(EMPTY, { unstableBradycardiaGuidance: 'guided', unstableBradycardiaDemonstrating: true });
    expect(watching).toContain('aria-disabled="true"');
    expect(watching).toContain('Watching the worked example');
    expect(watching).not.toContain('A moment to think');
  });
});
