import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import { objectiveFindings } from '@anesthesia/ui/Debrief';
import { validateScenario } from '@anesthesia/scenarios/schema';
import { ACUTE_ISCHEMIC_STROKE as SCENARIO } from '../../src/modules/emergency-medicine/scenarios/acute-ischemic-stroke';

describe('emergency acute ischemic stroke', () => {
  it('validates a bounded disabling-stroke and LVO pathway', () => {
    expect(validateScenario(SCENARIO)).toEqual([]);
    expect(SCENARIO.timeline.map((event) => event.message).join(' ')).toContain(
      'Last known well was 70 minutes ago',
    );
    expect(SCENARIO.timeline.map((event) => event.message).join(' ')).toContain(
      'CTA shows a left M1 occlusion',
    );
    expect(SCENARIO.metadata.limitations).toHaveLength(3);
  });

  it('requires both ordered reperfusion tracks and scores the clock-explicit handoff', () => {
    const subject = new AnesthesiaEngine({ scenario: SCENARIO, seed: 70, practiceRegion: 'US' });
    const onset = subject.step();
    const apply = (action: string) => subject.apply({
      tick: subject.tick, type: 'acute-ischemic-stroke-response', payload: { action },
    });
    apply('review-stroke-presentation');
    apply('activate-stroke-system');
    apply('review-stroke-imaging-and-eligibility');
    apply('record-tenecteplase-20-mg-intent');
    apply('activate-thrombectomy-transfer');
    apply('reassess-and-handoff-stroke');
    const completed = subject.step();
    expect(completed.equipment.resuscitation.acuteIschemicStrokeAssessment).toMatchObject({
      presentationReviewedAtTick: expect.any(Number), systemActivatedAtTick: expect.any(Number),
      imagingReviewedAtTick: expect.any(Number), tenecteplaseAtTick: expect.any(Number),
      thrombectomyActivatedAtTick: expect.any(Number), reassessedAtTick: expect.any(Number),
    });
    const tenecteplase = completed.events.find(
      (event) => /^acute-stroke-tenecteplase-\d+$/.test(event.eventId),
    );
    expect(tenecteplase?.data).toMatchObject({ intentOnly: true, drugId: 'tenecteplase',
      doseMg: 20, doseMgPerKg: 0.25, weightKg: 80 });
    expect(completed.events.find((event) => event.eventId.startsWith('acute-stroke-reassessed-'))
      ?.message).toContain('no treatment response is claimed');
    const log = [...onset.events, ...completed.events];
    const history = [{ tick: onset.tick, state: onset.state, concentrations: [] },
      { tick: completed.tick, state: completed.state, concentrations: [] }] as never;
    expect(objectiveFindings(SCENARIO, history, 0, 0, [], log)
      .map((finding) => finding.outcome)).toEqual(['met', 'met', 'met', 'met', 'met']);
  });

  it('refuses out-of-order, duplicate, and unsupported shortcut actions', () => {
    const subject = new AnesthesiaEngine({ scenario: SCENARIO, seed: 71, practiceRegion: 'US' });
    subject.step();
    const apply = (action: string) => subject.apply({
      tick: subject.tick, type: 'acute-ischemic-stroke-response', payload: { action },
    });
    apply('record-tenecteplase-20-mg-intent');
    apply('activate-thrombectomy-transfer');
    apply('unknown-shortcut');
    const refused = subject.step();
    expect(refused.equipment.resuscitation.acuteIschemicStrokeAssessment).toMatchObject({
      presentationReviewedAtTick: null, tenecteplaseAtTick: null,
      thrombectomyActivatedAtTick: null, reassessedAtTick: null,
    });
    expect(refused.events.some((event) => event.eventId.startsWith('acute-stroke-order-refused-')))
      .toBe(true);
    expect(refused.events.some((event) => event.eventId.startsWith('acute-stroke-refused-')))
      .toBe(true);
    const history = [{ tick: refused.tick, state: refused.state, concentrations: [] }] as never;
    expect(objectiveFindings(SCENARIO, history, 0, 0, [], refused.events)
      .map((finding) => finding.outcome)).toEqual([
      'not-met', 'not-met', 'not-met', 'not-met', 'not-met',
    ]);
  });
});
