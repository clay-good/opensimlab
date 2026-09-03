/** @vitest-environment jsdom */
/**
 * The tutor panel and worked-example inertness for the emergency unstable
 * narrow-complex tachycardia tray.
 * tests/ui/unstable-narrow-complex-tachycardia.test.tsx already covers the
 * tray's pre-existing behaviour and is left alone.
 */
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { PrerenderedBody } from '@routes/Prerendered';
import { describe, expect, it } from 'vitest';
import { ActionCockpit, crisisResponseAvailability, type ActionCockpitProps } from '@anesthesia/ui/ActionCockpit';
import { UNITED_STATES } from '@anesthesia/region/profiles';
import { UNSTABLE_NARROW_COMPLEX_TACHYCARDIA as SCENARIO } from '../../src/modules/emergency-medicine/scenarios/unstable-narrow-complex-tachycardia';

const base = (over: Record<string, unknown>) => ({
  reviewedAtTick: null, preparedAtTick: null, cardiovertedAtTick: null, reassessedAtTick: null,
  ...over,
} as NonNullable<ActionCockpitProps['resuscitation']['unstableNarrowTachycardiaAssessment']>);

const EMPTY = base({});
const REVIEWED = base({ reviewedAtTick: 0 });
const PREPARED = base({ reviewedAtTick: 0, preparedAtTick: 1 });
const SHOCKED = base({ reviewedAtTick: 0, preparedAtTick: 1, cardiovertedAtTick: 2 });
const DONE = base({ reviewedAtTick: 0, preparedAtTick: 1, cardiovertedAtTick: 2, reassessedAtTick: 3 });
const STATES = [EMPTY, REVIEWED, PREPARED, SHOCKED, DONE];

const props = (
  assessment: NonNullable<ActionCockpitProps['resuscitation']['unstableNarrowTachycardiaAssessment']>,
  extra: Partial<ActionCockpitProps> = {},
): ActionCockpitProps => ({
  scenario: SCENARIO, region: UNITED_STATES, infusions: [], hypnoticLine: { connected: true, inspected: false },
  resuscitation: { epinephrineEffectFraction: 0, epinephrineTotalMicrograms: 0, lastEpinephrineTick: null, crystalloidTotalMl: 0, dantroleneTotalMg: 0, dantroleneEffectFraction: 0, lastDantroleneTick: null, activeCooling: false, unstableNarrowTachycardiaAssessment: assessment },
  lastExposure: null, syringeRemaining: {},
  ventilator: { mode: 'manual', tidalVolumeMl: 480, respiratoryRateBpm: 18, fio2: 0.21, peep: 0, delivering: false, sevofluranePercent: 0, freshGasFlowLPerMin: 10 },
  intubated: false, airwayAttempts: 0, lastGrade: null, jawThrustCpapSecondsRemaining: 0, airwayDevice: 'facemask',
  supraglotticInsertionSecondsRemaining: 0, helpRequestedAtTick: null, muscleRigidityFraction: 0,
  onBolus: () => {}, onInfusion: () => {}, onHypnoticLine: () => {}, onFluid: () => {}, onVentilator: () => {},
  onLaryngoscopy: () => {}, onAirwayManeuver: () => {}, onEpinephrine: () => {}, onDantrolene: () => {},
  onCallForHelp: () => {}, onAirwayDevice: () => {}, onActiveCooling: () => {}, onDrugCard: () => {},
  onUnstableNarrowTachycardiaResponse: () => {}, ...extra,
});

const markup = (
  assessment: NonNullable<ActionCockpitProps['resuscitation']['unstableNarrowTachycardiaAssessment']>,
  extra: Partial<ActionCockpitProps> = {},
) => renderToStaticMarkup(createElement(ActionCockpit, props(assessment, extra)));

describe('Emergency unstable narrow-complex tachycardia experience', () => {
  it('is discoverable at its exact route', () => {
    const index = renderToStaticMarkup(createElement(PrerenderedBody, { path: '/emergency-medicine' }));
    expect(index).toContain('href="/emergency-medicine/scenario/unstable-narrow-complex-tachycardia"');
    const route = renderToStaticMarkup(createElement(PrerenderedBody, { path: '/emergency-medicine/scenario/unstable-narrow-complex-tachycardia' }));
    expect(route).toContain(`<h1>${SCENARIO.metadata.title}</h1>`);
  });

  it('fails closed on the timeline target rather than the scenario id', () => {
    expect(crisisResponseAvailability(SCENARIO).hasUnstableNarrowTachycardiaResponse).toBe(true);
    expect(crisisResponseAvailability({
      ...SCENARIO, timeline: SCENARIO.timeline.filter((event) => event.type !== 'narrative'),
    }).hasUnstableNarrowTachycardiaResponse).toBe(false);
  });

  it('never renders adenosine, a vagal manoeuvre, or a joule setting on any control', () => {
    for (const html of STATES.map((state) => markup(state))) {
      const labels = [...html.matchAll(/<button[^>]*>(.*?)<\/button>/g)].map((m) => m[1]!).join(' ');
      expect(labels).not.toMatch(/adenosine|valsalva|carotid|\d+\s?J\b|joule|discharg|prognos/iu);
    }
  });
});

describe('Emergency unstable narrow-complex tachycardia tutor and worked example', () => {
  it('says nothing at all on the unassisted setting', () => {
    expect(markup(EMPTY)).not.toContain('A moment to think');
    expect(markup(EMPTY, { emergencySvtGuidance: 'unassisted' })).not.toContain('A moment to think');
  });

  it('reads the learner’s own recorded steps when guidance is on', () => {
    const opening = markup(EMPTY, { emergencySvtGuidance: 'guided' });
    expect(opening).toContain('A moment to think');
    expect(opening).toContain('only one of them has to be answered now');
    const prepare = markup(REVIEWED, { emergencySvtGuidance: 'guided' });
    expect(prepare).toContain('while the machine is still in its bag');
    expect(prepare).not.toContain('only one of them has to be answered now');
  });

  it('treats the sedation clause honestly', () => {
    expect(markup(PREPARED, { emergencySvtGuidance: 'guided' }))
      .toContain('a judgement about the next thirty seconds');
  });

  it('names the absent adenosine as deliberate', () => {
    expect(markup(PREPARED, { emergencySvtGuidance: 'guided' }))
      .toContain('the vagal manoeuvre and the drug are the detour');
  });

  it('goes quiet once the reassessment is recorded', () => {
    expect(markup(DONE, { emergencySvtGuidance: 'guided' })).not.toContain('A moment to think');
  });

  it('leaves the controls visible but inert while the example runs', () => {
    const watching = markup(EMPTY, { emergencySvtGuidance: 'guided', emergencySvtDemonstrating: true });
    expect(watching).toContain('aria-disabled="true"');
    expect(watching).toContain('Watching the worked example');
    expect(watching).not.toContain('A moment to think');
  });
});
