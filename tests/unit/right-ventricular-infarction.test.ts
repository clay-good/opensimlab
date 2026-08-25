import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import { validateScenario } from '@anesthesia/scenarios/schema';
import { objectiveFindings } from '@anesthesia/ui/Debrief';
import type { EngineEvent } from '@platform/kernel/protocol';
import { RIGHT_VENTRICULAR_INFARCTION as SCENARIO } from '../../src/modules/cardiology/scenarios/right-ventricular-infarction';
import { STEMI_RECOGNITION_AND_FIRST_ACTIONS as CLINIC_STEMI } from '../../src/modules/cardiology/scenarios/stemi-recognition-and-first-actions';
import { POST_INFARCTION_CARDIOGENIC_SHOCK_ESCALATION as POST_INFARCTION_SHOCK } from '../../src/modules/cardiology/scenarios/post-infarction-cardiogenic-shock-escalation';
import { STEMI as EM_STEMI } from '../../src/modules/emergency-medicine/scenarios/stemi';
import { RIGHT_VENTRICULAR_FAILURE as RV_FAILURE } from '../../src/modules/critical-care/scenarios/right-ventricular-failure';

const ACTIONS = {
  reconcile: 'reconcile-right-ventricular-infarction',
  phenotype: 'review-right-ventricular-infarction-phenotype',
  reperfusion: 'preserve-right-ventricular-infarction-reperfusion',
  support: 'record-right-ventricular-infarction-support',
  handoff: 'handoff-right-ventricular-infarction',
} as const;
function apply(subject: AnesthesiaEngine, action: string,
  type = 'right-ventricular-infarction-response') {
  subject.apply({ tick: subject.tick, type, payload: { action } });
}

describe('cardiology right-ventricular infarction', () => {
  it('is a distinct, valid pre-reperfusion acute RV-ischemia contract', () => {
    expect(validateScenario(SCENARIO)).toEqual([]);
    const narrative = SCENARIO.timeline.map((event) => event.message).join(' ');
    expect(narrative).toContain('1.5 mm ST elevation in V4R');
    expect(narrative).toContain('activated primary-PCI pathway');
    expect(narrative).toContain('no nitrate or reflex diuretic is selected');
    expect(narrative).toContain('No fixed fluid volume, blind fluid loading');
    expect(narrative).toMatch(/no universal prohibition|universal prohibition is supplied/i);
    for (const adjacent of [CLINIC_STEMI, POST_INFARCTION_SHOCK, EM_STEMI, RV_FAILURE]) {
      expect(SCENARIO.metadata.objectives.map(({ id }) => id))
        .not.toEqual(adjacent.metadata.objectives.map(({ id }) => id));
      expect(SCENARIO.debrief.rubric.map(({ question }) => question))
        .not.toEqual(adjacent.debrief.rubric.map(({ question }) => question));
      expect(SCENARIO.timeline.map(({ target }) => target))
        .not.toEqual(adjacent.timeline.map(({ target }) => target));
    }
  });

  it.each([[ACTIONS.reperfusion, ACTIONS.support], [ACTIONS.support, ACTIONS.reperfusion]])(
    'accepts both parallel lane orders but refuses a same-tick handoff', (firstLane, secondLane) => {
      const subject = new AnesthesiaEngine({ scenario: SCENARIO, seed: 141, practiceRegion: 'US' });
      const onset = subject.step();
      expect(onset.state).toMatchObject({ heartRateBpm: 54, systolicMmHg: 86,
        diastolicMmHg: 60, meanArterialMmHg: 69, respiratoryRateBpm: 18, spo2Percent: 96 });
      apply(subject, ACTIONS.reconcile); apply(subject, ACTIONS.phenotype);
      apply(subject, firstLane); apply(subject, secondLane); apply(subject, ACTIONS.handoff);
      const premature = subject.step();
      expect(premature.equipment.resuscitation.rightVentricularInfarctionAssessment).toMatchObject({
        reconciledAtTick: expect.any(Number), phenotypeAtTick: expect.any(Number),
        reperfusionAtTick: expect.any(Number), supportAtTick: expect.any(Number), handoffAtTick: null,
        initialPulsePresent: true, treatmentDeliveredByLearner: false,
        medicationDeliveredByLearner: false, reperfusionPerformedByLearner: false,
        deviceSelected: false, nitrateSelected: false, diureticSelected: false,
        blindFluidLoading: false, fixedFluidVolumeSelected: false,
      });
      expect(premature.events.some((event) =>
        event.eventId.startsWith('right-ventricular-infarction-handoff-time-refused-'))).toBe(true);
      apply(subject, ACTIONS.handoff); const completed = subject.step();
      expect(completed.equipment.resuscitation.rightVentricularInfarctionAssessment?.handoffAtTick)
        .toBeGreaterThan(Math.max(
          completed.equipment.resuscitation.rightVentricularInfarctionAssessment?.reperfusionAtTick ?? 0,
          completed.equipment.resuscitation.rightVentricularInfarctionAssessment?.supportAtTick ?? 0));
      expect(completed.state).toMatchObject({ heartRateBpm: 54, systolicMmHg: 86,
        diastolicMmHg: 60, meanArterialMmHg: 69, spo2Percent: 96 });
      const accepted = [...premature.events, ...completed.events].filter((event) =>
        /^right-ventricular-infarction-(?:reconciled|phenotype-reviewed|reperfusion-preserved|support-recorded|handoff-recorded)-\d+$/.test(event.eventId));
      expect(accepted).toHaveLength(5);
      expect(accepted).not.toEqual(expect.arrayContaining([
        expect.objectContaining({ data: expect.objectContaining({ treatmentDelivered: true }) }),
        expect.objectContaining({ data: expect.objectContaining({ pciPerformed: true }) }),
        expect.objectContaining({ data: expect.objectContaining({ nitrateSelected: true }) }),
        expect.objectContaining({ data: expect.objectContaining({ diureticSelected: true }) }),
        expect.objectContaining({ data: expect.objectContaining({ blindFluidLoading: true }) }),
      ]));
      const history = [{ tick: onset.tick, state: onset.state, concentrations: [] },
        { tick: completed.tick, state: completed.state, concentrations: [] }] as never;
      expect(objectiveFindings(SCENARIO, history, 0, 0, [],
        [...onset.events, ...premature.events, ...completed.events]).map(({ outcome }) => outcome))
        .toEqual(['met', 'met', 'met', 'met', 'met']);
    });

  it('keeps reperfusion available before the RV-focused review can delay it', () => {
    const subject = new AnesthesiaEngine({ scenario: SCENARIO, seed: 144, practiceRegion: 'US' });
    subject.step(); apply(subject, ACTIONS.reconcile); apply(subject, ACTIONS.reperfusion);
    const result = subject.step();
    expect(result.equipment.resuscitation.rightVentricularInfarctionAssessment).toMatchObject({
      reconciledAtTick: expect.any(Number), phenotypeAtTick: null,
      reperfusionAtTick: expect.any(Number), supportAtTick: null,
    });
    expect(result.events.some((event) =>
      /^right-ventricular-infarction-reperfusion-preserved-\d+$/.test(event.eventId))).toBe(true);
  });

  it('refuses raw fluid, hostile treatment recipes, and foreign action families without mutation', () => {
    const hostile = new AnesthesiaEngine({ scenario: SCENARIO, seed: 142, practiceRegion: 'US' });
    const control = new AnesthesiaEngine({ scenario: SCENARIO, seed: 142, practiceRegion: 'US' });
    hostile.step(); control.step();
    hostile.apply({ tick: hostile.tick, type: 'fluid',
      payload: { fluidId: 'balanced-crystalloid', volumeMl: 500 } });
    for (const action of ['give-nitroglycerin', 'give-furosemide', 'give-two-liters',
      'perform-pci', 'acquire-right-sided-ecg', '__proto__']) apply(hostile, action);
    apply(hostile, 'record-loop-diuretic-intent', 'acute-pulmonary-edema-response');
    apply(hostile, 'review-stemi-pattern', 'stemi-response');
    apply(hostile, 'reconcile-clinic-stemi-pattern', 'clinic-stemi-response');
    apply(hostile, 'reconcile-post-infarction-shock-trajectory', 'post-infarction-shock-response');
    apply(hostile, 'recognize-rv-failure-trajectory', 'right-ventricular-failure-response');
    const refused = hostile.step(); const untouched = control.step();
    expect(refused.state).toEqual(untouched.state);
    expect(refused.equipment.resuscitation.crystalloidTotalMl).toBe(0);
    expect(refused.equipment.resuscitation.rightVentricularInfarctionAssessment)
      .toEqual(untouched.equipment.resuscitation.rightVentricularInfarctionAssessment);
    expect(refused.events.some((event) =>
      event.eventId.startsWith('right-ventricular-infarction-fluid-refused-'))).toBe(true);
    expect(refused.events.some((event) => event.eventId.startsWith('fluid-balanced-crystalloid-')))
      .toBe(false);
    expect(refused.events.filter((event) => event.eventId.includes('refused')).length)
      .toBeGreaterThanOrEqual(12);
  });

  it.each([[CLINIC_STEMI, 'clinicStemiAssessment'], [POST_INFARCTION_SHOCK, 'postInfarctionShockAssessment'],
    [EM_STEMI, 'stemiAssessment'], [RV_FAILURE, 'rightVentricularFailureAssessment']] as const)(
    'does not leak into an adjacent scenario', (scenario, assessmentKey) => {
      const subject = new AnesthesiaEngine({ scenario, seed: 143, practiceRegion: 'US' });
      subject.step(); apply(subject, ACTIONS.reconcile); const result = subject.step();
      expect(result.equipment.resuscitation.rightVentricularInfarctionAssessment).toBeUndefined();
      const adjacent = result.equipment.resuscitation[assessmentKey];
      expect(adjacent).toBeDefined();
      expect(Object.values(adjacent as unknown as Record<string, unknown>)
        .filter((value) => typeof value === 'number')).toEqual([]);
      expect(result.events.some((event) =>
        event.eventId.startsWith('right-ventricular-infarction-response-refused-'))).toBe(true);
    });

  it('debriefs only exact accepted events with a strictly later handoff', () => {
    const event = (eventId: string, tick: number): EngineEvent => ({
      eventId, tick, category: 'assessment', severity: 'warning', message: eventId,
    });
    const history = [{ tick: 0, state: {}, concentrations: [] }] as never;
    const exact = [event('right-ventricular-infarction-reconciled-10', 10),
      event('right-ventricular-infarction-phenotype-reviewed-20', 20),
      event('right-ventricular-infarction-reperfusion-preserved-30', 30),
      event('right-ventricular-infarction-support-recorded-30', 30),
      event('right-ventricular-infarction-handoff-recorded-40', 40)];
    expect(objectiveFindings(SCENARIO, history, 0, 0, [], exact).map(({ outcome }) => outcome))
      .toEqual(['met', 'met', 'met', 'met', 'met']);
    const sameTick = [...exact.slice(0, -1),
      event('right-ventricular-infarction-handoff-recorded-30', 30)];
    expect(objectiveFindings(SCENARIO, history, 0, 0, [], sameTick).at(-1)?.outcome).toBe('not-met');
    const foreign = [event('clinic-stemi-pattern-reconciled-10', 10),
      event('stemi-pattern-reviewed-20', 20), event('post-infarction-shock-bridge-recorded-30', 30),
      event('rv-failure-trajectory-reassessed-40', 40),
      event('right-ventricular-infarction-support-refused-50', 50)];
    expect(objectiveFindings(SCENARIO, history, 0, 0, [], foreign)
      .every(({ outcome }) => outcome === 'not-met')).toBe(true);
  });
});
