/** @vitest-environment jsdom */
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { PrerenderedBody } from '@routes/Prerendered';
import { describe, expect, it } from 'vitest';
import { ActionCockpit, crisisResponseAvailability, type ActionCockpitProps } from '@anesthesia/ui/ActionCockpit';
import { UNITED_STATES } from '@anesthesia/region/profiles';
import { ENDOTRACHEAL_TUBE_MIGRATION_AFTER_REPOSITIONING as SCENARIO } from '../../src/modules/critical-care/scenarios/endotracheal-tube-migration-after-repositioning';

const base = (over: Record<string, unknown>) => ({
  recognizedAtTick: null, supportedAtTick: null, positionReviewedAtTick: null,
  correctionAtTick: null, reassessedAtTick: null,
  ...over,
} as NonNullable<ActionCockpitProps['resuscitation']['endotrachealTubeMigrationAssessment']>);

const EMPTY = base({});
const RECOGNIZED = base({ recognizedAtTick: 0 });
const SUPPORTED = base({ recognizedAtTick: 0, supportedAtTick: 1 });
const POSITION = base({ recognizedAtTick: 0, supportedAtTick: 1, positionReviewedAtTick: 2 });
const CORRECTED = base({ recognizedAtTick: 0, supportedAtTick: 1, positionReviewedAtTick: 2, correctionAtTick: 3 });
const DONE = base({ recognizedAtTick: 0, supportedAtTick: 1, positionReviewedAtTick: 2, correctionAtTick: 3, reassessedAtTick: 4 });
const STATES = [EMPTY, RECOGNIZED, SUPPORTED, POSITION, CORRECTED, DONE];

const LABELS = ['Recognize the post-turn change', 'Bridge oxygenation + escalate',
  'Integrate depth + bilateral ventilation', 'Record experienced correction intent',
  'Reassess position + gas exchange'];

const props = (
  assessment: NonNullable<ActionCockpitProps['resuscitation']['endotrachealTubeMigrationAssessment']>,
  extra: Partial<ActionCockpitProps> = {},
): ActionCockpitProps => ({
  scenario: SCENARIO, region: UNITED_STATES, infusions: [], hypnoticLine: { connected: true, inspected: false },
  resuscitation: { epinephrineEffectFraction: 0, epinephrineTotalMicrograms: 0, lastEpinephrineTick: null, crystalloidTotalMl: 0, dantroleneTotalMg: 0, dantroleneEffectFraction: 0, lastDantroleneTick: null, activeCooling: false, endotrachealTubeMigrationAssessment: assessment },
  lastExposure: null, syringeRemaining: {},
  ventilator: { mode: 'volume-control', tidalVolumeMl: 420, respiratoryRateBpm: 18, fio2: 0.5, peep: 8, delivering: true, sevofluranePercent: 0, freshGasFlowLPerMin: 10 },
  intubated: true, airwayAttempts: 1, lastGrade: null, jawThrustCpapSecondsRemaining: 0, airwayDevice: 'tracheal-tube',
  supraglotticInsertionSecondsRemaining: 0, helpRequestedAtTick: null, muscleRigidityFraction: 0,
  onBolus: () => {}, onInfusion: () => {}, onHypnoticLine: () => {}, onFluid: () => {}, onVentilator: () => {},
  onLaryngoscopy: () => {}, onAirwayManeuver: () => {}, onEpinephrine: () => {}, onDantrolene: () => {},
  onCallForHelp: () => {}, onAirwayDevice: () => {}, onActiveCooling: () => {}, onDrugCard: () => {},
  onEndotrachealTubeMigrationResponse: () => {}, ...extra,
});

const markup = (
  assessment: NonNullable<ActionCockpitProps['resuscitation']['endotrachealTubeMigrationAssessment']>,
  extra: Partial<ActionCockpitProps> = {},
) => renderToStaticMarkup(createElement(ActionCockpit, props(assessment, extra)));

const lessonButtons = (html: string) => [...html.matchAll(/<button[^>]*>(.*?)<\/button>/g)]
  .map((match) => match[1]!).filter((label) => LABELS.some((known) => label.includes(known)));

describe('Post-repositioning tube migration experience', () => {
  it('is discoverable at its exact route', () => {
    const index = renderToStaticMarkup(createElement(PrerenderedBody, { path: '/critical-care' }));
    expect(index).toContain('href="/critical-care/scenario/endotracheal-tube-migration-after-repositioning"');
    const route = renderToStaticMarkup(createElement(PrerenderedBody, { path: '/critical-care/scenario/endotracheal-tube-migration-after-repositioning' }));
    expect(route).toContain(`<h1>${SCENARIO.metadata.title}</h1>`);
  });

  it('fails closed on the timeline target rather than the scenario id', () => {
    expect(crisisResponseAvailability(SCENARIO).hasEndotrachealTubeMigrationResponse).toBe(true);
    expect(crisisResponseAvailability({
      ...SCENARIO,
      timeline: SCENARIO.timeline.filter((event) => event.target !== 'endotracheal-tube-migration-after-repositioning'),
    }).hasEndotrachealTubeMigrationResponse).toBe(false);
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
    for (const state of [EMPTY, RECOGNIZED, SUPPORTED, POSITION, CORRECTED]) {
      expect(openCount(markup(state))).toBe(1);
    }
    expect(openCount(markup(DONE))).toBe(0);
  });

  it('never offers a withdrawal distance, a setting, or an image', () => {
    expect(markup(EMPTY)).toContain('After every move, earn the airway again.');
    expect(markup(SUPPORTED)).toContain('Support first. Correct with proof.');
    for (const html of STATES.map((state) => markup(state))) {
      expect(lessonButtons(html).join(' ')).not.toMatch(/withdraw|\bcm\b|x-ray|bronchoscop|tidal volume|diagnos|prognos/iu);
    }
  });
});

describe('Post-repositioning tube migration tutor and worked example', () => {
  it('says nothing at all on the unassisted setting', () => {
    expect(markup(EMPTY)).not.toContain('A moment to think');
    expect(markup(EMPTY, { endotrachealTubeMigrationGuidance: 'unassisted' })).not.toContain('A moment to think');
  });

  it('reads the learner’s own recorded steps when guidance is on', () => {
    const opening = markup(EMPTY, { endotrachealTubeMigrationGuidance: 'guided' });
    expect(opening).toContain('A moment to think');
    expect(opening).toContain('a resistance problem rather than a stiff lung');
    const support = markup(RECOGNIZED, { endotrachealTubeMigrationGuidance: 'guided' });
    expect(support).toContain('the answer can wait ninety seconds');
    expect(support).not.toContain('a resistance problem rather than a stiff lung');
  });

  it('calls the depth change persuasive rather than decisive', () => {
    expect(markup(SUPPORTED, { endotrachealTubeMigrationGuidance: 'guided' }))
      .toContain('a mark is a proxy for a position');
  });

  it('refuses to make 22 cm a rule', () => {
    expect(markup(POSITION, { endotrachealTubeMigrationGuidance: 'guided' }))
      .toContain('not a depth to carry to the next patient');
  });

  it('goes quiet once the response is reassessed', () => {
    expect(markup(DONE, { endotrachealTubeMigrationGuidance: 'guided' })).not.toContain('A moment to think');
  });

  it('leaves the controls visible but inert while the example runs', () => {
    const label = LABELS[0]!;
    expect(markup(EMPTY)).toContain(label);
    const watching = markup(EMPTY, { endotrachealTubeMigrationGuidance: 'guided', endotrachealTubeMigrationDemonstrating: true });
    expect(watching).toContain(label);
    expect(watching).toContain('aria-disabled="true"');
    expect(watching).toContain('Watching the worked example');
    expect(watching).not.toContain('A moment to think');
  });
});
