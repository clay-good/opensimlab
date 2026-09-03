/** @vitest-environment jsdom */
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { PrerenderedBody } from '@routes/Prerendered';
import { describe, expect, it } from 'vitest';
import { ActionCockpit, crisisResponseAvailability, type ActionCockpitProps } from '@anesthesia/ui/ActionCockpit';
import { UNITED_STATES } from '@anesthesia/region/profiles';
import { SEPTIC_SHOCK_RESUSCITATION as SCENARIO } from '../../src/modules/critical-care/scenarios/septic-shock-resuscitation';

/** The constants this lesson never moves, spread into every state below. */
const NEVER = {
  passiveLegRaiseStrokeVolumeChangePercent: 2,
  blindRepeatFluidOffered: false as const,
};
const base = (over: Record<string, unknown>) => ({
  contextAtTick: null, perfusionAtTick: null, fluidResponseAtTick: null,
  planAtTick: null, reassessedAtTick: null,
  ...NEVER, ...over,
} as NonNullable<ActionCockpitProps['resuscitation']['septicShockResuscitationAssessment']>);

const EMPTY = base({});
const CONTEXT = base({ contextAtTick: 0 });
const PERFUSION = base({ contextAtTick: 0, perfusionAtTick: 1 });
const FLUID = base({ contextAtTick: 0, perfusionAtTick: 1, fluidResponseAtTick: 2 });
const PLAN = base({ contextAtTick: 0, perfusionAtTick: 1, fluidResponseAtTick: 2, planAtTick: 3 });
const DONE = base({ contextAtTick: 0, perfusionAtTick: 1, fluidResponseAtTick: 2, planAtTick: 3, reassessedAtTick: 4 });
const STATES = [EMPTY, CONTEXT, PERFUSION, FLUID, PLAN, DONE];

const LABELS = ['Reconcile care + response', 'Reassess multi-organ perfusion',
  'Review dynamic response + lungs', 'Individualize support + source control',
  'Review 10-minute trajectory'];

const props = (
  assessment: NonNullable<ActionCockpitProps['resuscitation']['septicShockResuscitationAssessment']>,
  extra: Partial<ActionCockpitProps> = {},
): ActionCockpitProps => ({
  scenario: SCENARIO, region: UNITED_STATES, infusions: [], hypnoticLine: { connected: true, inspected: false },
  resuscitation: { epinephrineEffectFraction: 0, epinephrineTotalMicrograms: 0, lastEpinephrineTick: null, crystalloidTotalMl: 0, dantroleneTotalMg: 0, dantroleneEffectFraction: 0, lastDantroleneTick: null, activeCooling: false, septicShockResuscitationAssessment: assessment },
  lastExposure: null, syringeRemaining: {},
  ventilator: { mode: 'manual', tidalVolumeMl: 450, respiratoryRateBpm: 24, fio2: 0.35, peep: 0, delivering: false, sevofluranePercent: 0, freshGasFlowLPerMin: 0.5 },
  intubated: false, airwayAttempts: 0, lastGrade: null, jawThrustCpapSecondsRemaining: 0, airwayDevice: 'facemask',
  supraglotticInsertionSecondsRemaining: 0, helpRequestedAtTick: null, muscleRigidityFraction: 0,
  onBolus: () => {}, onInfusion: () => {}, onHypnoticLine: () => {}, onFluid: () => {}, onVentilator: () => {},
  onLaryngoscopy: () => {}, onAirwayManeuver: () => {}, onEpinephrine: () => {}, onDantrolene: () => {},
  onCallForHelp: () => {}, onAirwayDevice: () => {}, onActiveCooling: () => {}, onDrugCard: () => {},
  onSepticShockResuscitationResponse: () => {}, ...extra,
});

const markup = (
  assessment: NonNullable<ActionCockpitProps['resuscitation']['septicShockResuscitationAssessment']>,
  extra: Partial<ActionCockpitProps> = {},
) => renderToStaticMarkup(createElement(ActionCockpit, props(assessment, extra)));

const lessonButtons = (html: string) => [...html.matchAll(/<button[^>]*>(.*?)<\/button>/g)]
  .map((match) => match[1]!).filter((label) => LABELS.some((known) => label.includes(known)));

describe('Persistent septic-shock experience', () => {
  it('is discoverable at its exact route', () => {
    const index = renderToStaticMarkup(createElement(PrerenderedBody, { path: '/critical-care' }));
    expect(index).toContain('href="/critical-care/scenario/septic-shock-resuscitation"');
    const route = renderToStaticMarkup(createElement(PrerenderedBody, { path: '/critical-care/scenario/septic-shock-resuscitation' }));
    expect(route).toContain(`<h1>${SCENARIO.metadata.title}</h1>`);
  });

  it('fails closed on the timeline target rather than the scenario id', () => {
    expect(crisisResponseAvailability(SCENARIO).hasSepticShockResuscitationResponse).toBe(true);
    expect(crisisResponseAvailability({
      ...SCENARIO,
      timeline: SCENARIO.timeline.filter((event) => event.target !== 'septic-shock-resuscitation'),
    }).hasSepticShockResuscitationResponse).toBe(false);
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
    for (const state of [EMPTY, CONTEXT, PERFUSION, FLUID, PLAN]) {
      expect(openCount(markup(state))).toBe(1);
    }
    expect(openCount(markup(DONE))).toBe(0);
  });

  it('never offers a bolus, a target, a dose, or a drainage procedure', () => {
    expect(markup(EMPTY)).toContain('Resuscitation is a loop, not a liter count.');
    expect(markup(FLUID)).toContain('Fluid needs a target and an exit.');
    for (const html of STATES.map((state) => markup(state))) {
      expect(lessonButtons(html).join(' ')).not.toMatch(/examin|bolus|\bmL\b|mcg|noradren|norepine|ERCP|drain|diagnos|prognos/iu);
    }
  });
});

describe('Persistent septic-shock tutor and worked example', () => {
  it('says nothing at all on the unassisted setting', () => {
    expect(markup(EMPTY)).not.toContain('A moment to think');
    expect(markup(EMPTY, { septicShockResuscitationGuidance: 'unassisted' })).not.toContain('A moment to think');
  });

  it('reads the learner’s own recorded steps when guidance is on', () => {
    const opening = markup(EMPTY, { septicShockResuscitationGuidance: 'guided' });
    expect(opening).toContain('A moment to think');
    expect(opening).toContain('are three separate claims');
    const perfusion = markup(CONTEXT, { septicShockResuscitationGuidance: 'guided' });
    expect(perfusion).toContain('the sixth is the one a MAP target invites you to fix');
    expect(perfusion).not.toContain('are three separate claims');
  });

  it('pairs the dynamic finding with the lungs', () => {
    const html = markup(PERFUSION, { septicShockResuscitationGuidance: 'guided' });
    expect(html).toContain('Two per cent');
    expect(html).toContain('two per cent is not a threshold');
  });

  it('says why the source control is the half that changes her outcome', () => {
    expect(markup(FLUID, { septicShockResuscitationGuidance: 'guided' }))
      .toContain('antimicrobials cannot reach what is not draining');
  });

  it('goes quiet once the trajectory is reassessed', () => {
    expect(markup(DONE, { septicShockResuscitationGuidance: 'guided' })).not.toContain('A moment to think');
  });

  it('leaves the controls visible but inert while the example runs', () => {
    const label = LABELS[0]!;
    expect(markup(EMPTY)).toContain(label);
    const watching = markup(EMPTY, { septicShockResuscitationGuidance: 'guided', septicShockResuscitationDemonstrating: true });
    expect(watching).toContain(label);
    expect(watching).toContain('aria-disabled="true"');
    expect(watching).toContain('Watching the worked example');
    expect(watching).not.toContain('A moment to think');
  });
});
