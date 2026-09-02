import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { PrerenderedBody } from '@routes/Prerendered';
import { ActionCockpit, crisisResponseAvailability, type ActionCockpitProps } from '@anesthesia/ui/ActionCockpit';
import { UNITED_STATES } from '@anesthesia/region/profiles';
import { FOCAL_MOTOR_STATUS_EPILEPTICUS_ESCALATION as SCENARIO } from '../../src/modules/neurology/scenarios/focal-motor-status-epilepticus-escalation';
const markup = (assessment: NonNullable<ActionCockpitProps['resuscitation']['neurologyFocalMotorStatusAssessment']>, extra: {
  neurologyFocalMotorStatusGuidance?: ActionCockpitProps['neurologyFocalMotorStatusGuidance'];
  neurologyFocalMotorStatusDemonstrating?: boolean;
} = {}) => renderToStaticMarkup(createElement(ActionCockpit, { scenario: SCENARIO, region: UNITED_STATES, infusions: [], hypnoticLine: { connected: true, inspected: false }, resuscitation: { epinephrineEffectFraction: 0, epinephrineTotalMicrograms: 0, lastEpinephrineTick: null, crystalloidTotalMl: 0, dantroleneTotalMg: 0, dantroleneEffectFraction: 0, lastDantroleneTick: null, activeCooling: false, neurologyFocalMotorStatusAssessment: assessment }, lastExposure: null, syringeRemaining: {}, ventilator: { mode: 'manual', tidalVolumeMl: 450, respiratoryRateBpm: 10, fio2: 1, peep: 0, delivering: true, sevofluranePercent: 0, freshGasFlowLPerMin: 10 }, intubated: false, airwayAttempts: 0, lastGrade: null, jawThrustCpapSecondsRemaining: 0, airwayDevice: 'facemask', supraglotticInsertionSecondsRemaining: 0, helpRequestedAtTick: null, muscleRigidityFraction: 0, onBolus: () => {}, onInfusion: () => {}, onHypnoticLine: () => {}, onFluid: () => {}, onVentilator: () => {}, onLaryngoscopy: () => {}, onAirwayManeuver: () => {}, onEpinephrine: () => {}, onDantrolene: () => {}, onCallForHelp: () => {}, onAirwayDevice: () => {}, onActiveCooling: () => {}, onDrugCard: () => {}, onNeurologyFocalMotorStatusResponse: () => {}, ...extra } satisfies ActionCockpitProps));

const EMPTY = { trajectoryAtTick: null, recognitionAtTick: null, ownershipAtTick: null, safetyAtTick: null, laterAtTick: null, handoffAtTick: null };
const LABELS = ['Review clock + motor evolution', 'Recognize focal motor status', 'Activate qualified status ownership', 'Review airway + glucose + causes', 'Review the minute-26 motor report', 'Hand off active status + cause risk'];
const lessonButtons = (html: string) => [...html.matchAll(/<button[^>]*>(.*?)<\/button>/g)]
  .map((match) => match[1]!).filter((label) => LABELS.some((known) => label.includes(known)));

describe('Neurology focal-motor-status experience', () => {
  it('is discoverable at its exact calm route', () => {
    const index = renderToStaticMarkup(createElement(PrerenderedBody, { path: '/neurology' }));
    expect(index).toContain('href="/neurology/scenario/focal-motor-status-epilepticus-escalation"');
    expect(index).toContain('Focal motor status epilepticus escalation');
    const route = renderToStaticMarkup(createElement(PrerenderedBody, { path: '/neurology/scenario/focal-motor-status-epilepticus-escalation' }));
    expect(route).toContain('<h1>Focal motor status epilepticus escalation</h1>');
  });

  it('fails closed and exposes one calm cognitive action at a time', () => {
    expect(crisisResponseAvailability(SCENARIO).hasNeurologyFocalMotorStatusResponse).toBe(true);
    expect(crisisResponseAvailability({ ...SCENARIO, timeline: SCENARIO.timeline.slice(0, 1) }).hasNeurologyFocalMotorStatusResponse).toBe(false);
    const states = [EMPTY,
      { ...EMPTY, trajectoryAtTick: 0 },
      { ...EMPTY, trajectoryAtTick: 0, recognitionAtTick: 1 },
      { ...EMPTY, trajectoryAtTick: 0, recognitionAtTick: 1, ownershipAtTick: 2 },
      { ...EMPTY, trajectoryAtTick: 0, recognitionAtTick: 1, ownershipAtTick: 2, safetyAtTick: 3 },
      { ...EMPTY, trajectoryAtTick: 0, recognitionAtTick: 1, ownershipAtTick: 2, safetyAtTick: 3, laterAtTick: 4 },
      { trajectoryAtTick: 0, recognitionAtTick: 1, ownershipAtTick: 2, safetyAtTick: 3, laterAtTick: 4, handoffAtTick: 5 }];
    expect(states.map((state) => lessonButtons(markup(state)).length)).toEqual([1, 1, 1, 1, 1, 1, 0]);
    expect(markup(states[0]!)).toContain('Less movement is not over.');
    const later = markup(states[4]!);
    expect(later).toContain('What is still moving?');
    expect(later).toContain('Qualified ownership is active. Review the fixed later motor report.');
    expect(markup(states[5]!)).toContain('Recovery, cause, and treatment effect remain open.');
    for (const html of states.map((state) => markup(state))) {
      expect(lessonButtons(html).join(' ')).not.toMatch(/history|examin|auscultat|sample|acquire|calculat|score|time the|lorazepam|midazolam|levetiracetam|benzodiaz|propofol|eeg|intubat|anesthe|sedat|dose|route|drug|infusion|oxygen|prescri|procedure|diagnos|exclude|disposition|discharge|prognos/iu);
    }
  });
});

describe('Focal-motor-status tutor and worked example', () => {
  const named = { ...EMPTY, trajectoryAtTick: 0, recognitionAtTick: 1 };

  it('says nothing at all on the unassisted setting', () => {
    expect(markup(EMPTY)).not.toContain('A moment to think');
    expect(markup(EMPTY, { neurologyFocalMotorStatusGuidance: 'unassisted' })).not.toContain('A moment to think');
  });

  it('reads the learner’s own recorded steps when guidance is on', () => {
    const opening = markup(EMPTY, { neurologyFocalMotorStatusGuidance: 'guided' });
    expect(opening).toContain('A moment to think');
    expect(opening).toContain('Count this as one event');
    const next = markup(named, { neurologyFocalMotorStatusGuidance: 'guided' });
    expect(next).toContain('Escalate on what you can see');
    expect(next).not.toContain('Count this as one event');
  });

  it('says quieter is not stopped', () => {
    const html = markup({ ...EMPTY, trajectoryAtTick: 0 }, { neurologyFocalMotorStatusGuidance: 'guided' });
    expect(html).toContain('Less dramatic movement is not seizure resolution');
    expect(html).toContain('the room relaxes and the clock keeps running');
  });

  it('goes quiet once the handoff is recorded', () => {
    const ended = { trajectoryAtTick: 0, recognitionAtTick: 1, ownershipAtTick: 2, safetyAtTick: 3, laterAtTick: 4, handoffAtTick: 5 };
    expect(markup(ended, { neurologyFocalMotorStatusGuidance: 'guided' })).not.toContain('A moment to think');
  });

  it('leaves the controls visible but inert while the example runs', () => {
    const label = 'Review clock + motor evolution';
    expect(markup(EMPTY)).toContain(label);
    const watching = markup(EMPTY, { neurologyFocalMotorStatusGuidance: 'guided', neurologyFocalMotorStatusDemonstrating: true });
    expect(watching).toContain(label);
    expect(watching).toContain('aria-disabled="true"');
    expect(watching).toContain('Watching the worked example');
    expect(watching).not.toContain('A moment to think');
  });
});
