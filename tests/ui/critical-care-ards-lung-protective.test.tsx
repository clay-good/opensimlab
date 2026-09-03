/** @vitest-environment jsdom */
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { PrerenderedBody } from '@routes/Prerendered';
import { describe, expect, it } from 'vitest';
import { ActionCockpit, crisisResponseAvailability, type ActionCockpitProps } from '@anesthesia/ui/ActionCockpit';
import { UNITED_STATES } from '@anesthesia/region/profiles';
import { ARDS_LUNG_PROTECTIVE_VENTILATION as SCENARIO } from '../../src/modules/critical-care/scenarios/ards-lung-protective-ventilation';

const base = (over: Record<string, unknown>) => ({
  baselineAtTick: null, pbwAtTick: null, protectionAtTick: null,
  reassessmentAtTick: null, escalationAtTick: null,
  ...over,
} as NonNullable<ActionCockpitProps['resuscitation']['ardsLungProtectiveAssessment']>);

const EMPTY = base({});
const BASELINE = base({ baselineAtTick: 0 });
const PBW = base({ baselineAtTick: 0, pbwAtTick: 1 });
const PROTECTED = base({ baselineAtTick: 0, pbwAtTick: 1, protectionAtTick: 2 });
const REASSESSED = base({ baselineAtTick: 0, pbwAtTick: 1, protectionAtTick: 2, reassessmentAtTick: 3 });
const DONE = base({ baselineAtTick: 0, pbwAtTick: 1, protectionAtTick: 2, reassessmentAtTick: 3, escalationAtTick: 4 });
const STATES = [EMPTY, BASELINE, PBW, PROTECTED, REASSESSED, DONE];

const LABELS = ['Review gas + mechanics + circulation', 'Calculate height-based PBW',
  'Set 370 mL + plateau guardrail', 'Review 30-minute response',
  'PEEP/FiO₂ + prolonged prone team'];

const props = (
  assessment: NonNullable<ActionCockpitProps['resuscitation']['ardsLungProtectiveAssessment']>,
  extra: Partial<ActionCockpitProps> = {},
): ActionCockpitProps => ({
  scenario: SCENARIO, region: UNITED_STATES, infusions: [], hypnoticLine: { connected: true, inspected: false },
  resuscitation: { epinephrineEffectFraction: 0, epinephrineTotalMicrograms: 0, lastEpinephrineTick: null, crystalloidTotalMl: 0, dantroleneTotalMg: 0, dantroleneEffectFraction: 0, lastDantroleneTick: null, activeCooling: false, ardsLungProtectiveAssessment: assessment },
  lastExposure: null, syringeRemaining: {},
  ventilator: { mode: 'volume-control', tidalVolumeMl: 500, respiratoryRateBpm: 24, fio2: 0.7, peep: 8, delivering: true, sevofluranePercent: 0, freshGasFlowLPerMin: 10 },
  intubated: true, airwayAttempts: 1, lastGrade: null, jawThrustCpapSecondsRemaining: 0, airwayDevice: 'tracheal-tube',
  supraglotticInsertionSecondsRemaining: 0, helpRequestedAtTick: null, muscleRigidityFraction: 0,
  onBolus: () => {}, onInfusion: () => {}, onHypnoticLine: () => {}, onFluid: () => {}, onVentilator: () => {},
  onLaryngoscopy: () => {}, onAirwayManeuver: () => {}, onEpinephrine: () => {}, onDantrolene: () => {},
  onCallForHelp: () => {}, onAirwayDevice: () => {}, onActiveCooling: () => {}, onDrugCard: () => {},
  onArdsLungProtectiveResponse: () => {}, ...extra,
});

const markup = (
  assessment: NonNullable<ActionCockpitProps['resuscitation']['ardsLungProtectiveAssessment']>,
  extra: Partial<ActionCockpitProps> = {},
) => renderToStaticMarkup(createElement(ActionCockpit, props(assessment, extra)));

const lessonButtons = (html: string) => [...html.matchAll(/<button[^>]*>(.*?)<\/button>/g)]
  .map((match) => match[1]!).filter((label) => LABELS.some((known) => label.includes(known)));

describe('ARDS lung-protective experience', () => {
  it('is discoverable at its exact route', () => {
    const index = renderToStaticMarkup(createElement(PrerenderedBody, { path: '/critical-care' }));
    expect(index).toContain('href="/critical-care/scenario/ards-lung-protective-ventilation"');
    const route = renderToStaticMarkup(createElement(PrerenderedBody, { path: '/critical-care/scenario/ards-lung-protective-ventilation' }));
    expect(route).toContain(`<h1>${SCENARIO.metadata.title}</h1>`);
  });

  it('fails closed on the timeline target rather than the scenario id', () => {
    expect(crisisResponseAvailability(SCENARIO).hasArdsLungProtectiveResponse).toBe(true);
    expect(crisisResponseAvailability({
      ...SCENARIO,
      timeline: SCENARIO.timeline.filter((event) => event.target !== 'ards-lung-protective-ventilation'),
    }).hasArdsLungProtectiveResponse).toBe(false);
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
    for (const state of [EMPTY, BASELINE, PBW, PROTECTED, REASSESSED]) {
      expect(openCount(markup(state))).toBe(1);
    }
    expect(openCount(markup(DONE))).toBe(0);
  });

  it('never offers a paralytic, a recruitment manoeuvre, or a diagnosis', () => {
    expect(markup(EMPTY)).toContain('Size the breath to the lung.');
    expect(markup(PBW)).toContain('Every setting owes you a response.');
    for (const html of STATES.map((state) => markup(state))) {
      // "370 mL" and "PEEP/FiO2" are authored control labels and are the lesson's
      // own content, so the guard is on delivery and procedure language.
      expect(lessonButtons(html).join(' '))
        .not.toMatch(/paralys|paralytic|recruitment|sedat|\bECMO\b|turn her|diagnos|prognos/iu);
    }
  });
});

describe('ARDS lung-protective tutor and worked example', () => {
  it('says nothing at all on the unassisted setting', () => {
    expect(markup(EMPTY)).not.toContain('A moment to think');
    expect(markup(EMPTY, { ardsLungProtectiveGuidance: 'unassisted' })).not.toContain('A moment to think');
  });

  it('reads the learner’s own recorded steps when guidance is on', () => {
    const opening = markup(EMPTY, { ardsLungProtectiveGuidance: 'guided' });
    expect(opening).toContain('A moment to think');
    expect(opening).toContain('the pressure the alveoli actually see at the end of a breath');
    const pbw = markup(BASELINE, { ardsLungProtectiveGuidance: 'guided' });
    expect(pbw).toContain('fat does not add alveoli');
    expect(pbw).not.toContain('the pressure the alveoli actually see at the end of a breath');
  });

  it('insists that volume alone is not protection', () => {
    expect(markup(PBW, { ardsLungProtectiveGuidance: 'guided' }))
      .toContain('volume alone is not protection');
  });

  it('names the trade and refuses to undo it', () => {
    expect(markup(PROTECTED, { ardsLungProtectiveGuidance: 'guided' }))
      .toContain('trades a number you can see for lung injury you cannot');
  });

  it('goes quiet once the escalation is recorded', () => {
    expect(markup(DONE, { ardsLungProtectiveGuidance: 'guided' })).not.toContain('A moment to think');
  });

  it('leaves the controls visible but inert while the example runs', () => {
    const label = LABELS[0]!;
    expect(markup(EMPTY)).toContain(label);
    const watching = markup(EMPTY, { ardsLungProtectiveGuidance: 'guided', ardsLungProtectiveDemonstrating: true });
    expect(watching).toContain(label);
    expect(watching).toContain('aria-disabled="true"');
    expect(watching).toContain('Watching the worked example');
    expect(watching).not.toContain('A moment to think');
  });
});
