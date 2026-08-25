import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import { validateScenario } from '@anesthesia/scenarios/schema';
import { objectiveFindings } from '@anesthesia/ui/Debrief';
import { CARDIOGENIC_SHOCK as SCENARIO } from '../../src/modules/critical-care/scenarios/cardiogenic-shock';

describe('critical-care cardiogenic shock', () => {
  it('validates a congested acute-MI shock contract without routine fluid or device claims', () => {
    expect(validateScenario(SCENARIO)).toEqual([]);
    const narrative = SCENARIO.timeline.map((event) => event.message).join(' ');
    expect(narrative).toContain('lactate rising from 3.1 to 4.8 mmol/L');
    expect(narrative).toContain('without primary fluid loading');
    expect(narrative).toContain('no device is routine');
  });

  it('orders trajectory, phenotype, bridge, cause control, and reassessment', () => {
    const subject = new AnesthesiaEngine({ scenario: SCENARIO, seed: 104, practiceRegion: 'US' });
    const onset = subject.step();
    const apply = (action: string) => subject.apply({ tick: subject.tick,
      type: 'cardiogenic-shock-response', payload: { action } });
    for (const action of ['recognize-cardiogenic-shock-trajectory',
      'review-cardiogenic-shock-cause-and-phenotype', 'record-cardiogenic-shock-bridge',
      'escalate-cardiogenic-shock-cause-control',
      'reassess-cardiogenic-shock-trajectory']) apply(action);
    const completed = subject.step();
    expect(completed.equipment.resuscitation.cardiogenicShockAssessment).toMatchObject({
      recognitionAtTick: expect.any(Number), phenotypeAtTick: expect.any(Number),
      bridgeAtTick: expect.any(Number), causeControlAtTick: expect.any(Number),
      reassessmentAtTick: expect.any(Number),
    });
    expect(completed.events.find((event) => /^cardiogenic-shock-bridge-recorded-\d+$/.test(event.eventId))?.data)
      .toMatchObject({ norepinephrine: true, perfusionLinked: true, primaryFluidLoading: false });
    expect(completed.events.find((event) => /^cardiogenic-shock-cause-control-escalated-\d+$/.test(event.eventId))?.data)
      .toMatchObject({ culpritVesselRevascularization: true, routineDevice: false,
        routineImmediateMultivesselIntervention: false });
    const history = [{ tick: onset.tick, state: onset.state, concentrations: [] },
      { tick: completed.tick, state: completed.state, concentrations: [] }] as never;
    expect(objectiveFindings(SCENARIO, history, 0, 0, [], [...onset.events, ...completed.events])
      .map((finding) => finding.outcome)).toEqual(['met', 'met', 'met', 'met', 'met']);
  });

  it('refuses premature, duplicate, and unknown responses', () => {
    const subject = new AnesthesiaEngine({ scenario: SCENARIO, seed: 105, practiceRegion: 'US' });
    subject.step();
    const apply = (action: string) => subject.apply({ tick: subject.tick,
      type: 'cardiogenic-shock-response', payload: { action } });
    apply('record-cardiogenic-shock-bridge'); apply('give-two-liters');
    apply('recognize-cardiogenic-shock-trajectory'); apply('recognize-cardiogenic-shock-trajectory');
    const refused = subject.step();
    expect(refused.equipment.resuscitation.cardiogenicShockAssessment).toMatchObject({
      recognitionAtTick: expect.any(Number), phenotypeAtTick: null, bridgeAtTick: null,
      causeControlAtTick: null, reassessmentAtTick: null,
    });
    expect(refused.events.some((event) => event.eventId.startsWith('cardiogenic-shock-recognition-order-refused-'))).toBe(true);
    expect(refused.events.some((event) => event.eventId.startsWith('cardiogenic-shock-response-refused-'))).toBe(true);
    expect(refused.events.some((event) => event.eventId.startsWith('cardiogenic-shock-recognition-refused-'))).toBe(true);
  });
});
