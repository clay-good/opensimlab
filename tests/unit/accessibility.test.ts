/** Acceptance tests for platform/accessibility's non-visual channel. */
import { describe, expect, it } from 'vitest';
import {
  ANNOUNCE_THRESHOLDS, SHORTCUTS, announcementsFor, stateSummary, thresholdSignature,
  mechanicalPulseFromState, waveformDescriptions,
} from '@anesthesia/ui/accessibility';
import { VirtualPatient, RESPIRATORY_PROFILES, type PatientProfile } from '@anesthesia/physiology';
import { AnesthesiaEngine } from '@anesthesia/engine';
import { ROUTINE_INDUCTION } from '@anesthesia/scenarios/routine-induction';
import { createRng } from '@platform/kernel/rng';

const PROFILE: PatientProfile = {
  hemodynamics: {
    baselineHeartRateBpm: 72, baselineMapMmHg: 90, baselineStrokeVolumeMl: 70,
    arterialStiffness: 1, fixedStrokeVolume: false, baroreflexGain: 1,
    bloodVolumeMl: 5000, hemoglobinGPerDl: 14,
  },
  respiratory: RESPIRATORY_PROFILES.healthy,
  airway: { difficulty: 0, difficultMaskVentilation: false },
  coreTemperatureC: 36.6,
  ageYears: 40,
};

describe('Requirement: Screen Reader Access To Live Physiology', () => {
  it('Scenario: Meaningful change is announced, noise is not', () => {
    // A one beat per minute drift crosses nothing and says nothing.
    const drift = announcementsFor(
      { heartRateBpm: 72, spo2Percent: 99, meanArterialMmHg: 88, etco2MmHg: 38, depthIndex: 50 },
      { heartRateBpm: 73, spo2Percent: 99, meanArterialMmHg: 88, etco2MmHg: 38, depthIndex: 50 },
      [],
    );
    expect(drift).toHaveLength(0);

    // Repeated drift, still crossing nothing, still says nothing.
    let previous = { heartRateBpm: 70, spo2Percent: 99, meanArterialMmHg: 88, etco2MmHg: 38, depthIndex: 50 };
    for (let i = 0; i < 20; i += 1) {
      const next = { ...previous, heartRateBpm: previous.heartRateBpm + 1 };
      expect(announcementsFor(previous, next, [])).toHaveLength(0);
      previous = next;
      if (previous.heartRateBpm >= 99) break;
    }
  });

  it('announces a threshold crossing, naming the parameter, the value and the severity', () => {
    const announcements = announcementsFor(
      { heartRateBpm: 72, spo2Percent: 93, meanArterialMmHg: 88, etco2MmHg: 38, depthIndex: 50 },
      { heartRateBpm: 72, spo2Percent: 82, meanArterialMmHg: 88, etco2MmHg: 38, depthIndex: 50 },
      [{
        alarmId: 'spo2-very-low', priority: 'high', parameter: 'spo2Percent', value: 82,
        unit: '%', message: 'Oxygen saturation critically low', sinceTick: 1, silencedUntilTick: null,
      }],
    );
    expect(announcements.length).toBeGreaterThan(0);
    const text = announcements.map((a) => a.text).join(' ');
    expect(text).toContain('Oxygen saturation');
    expect(text).toContain('82');
    expect(text).toContain('High priority');
    expect(announcements.some((a) => a.severity === 'critical')).toBe(true);
  });

  it('declares thresholds for the parameters that matter', () => {
    expect(Object.keys(ANNOUNCE_THRESHOLDS)).toContain('spo2Percent');
    expect(Object.keys(ANNOUNCE_THRESHOLDS)).toContain('meanArterialMmHg');
    // The signature changes only when a side changes.
    const a = thresholdSignature({ spo2Percent: 99, meanArterialMmHg: 88, heartRateBpm: 72, etco2MmHg: 38, depthIndex: 50 });
    const b = thresholdSignature({ spo2Percent: 98, meanArterialMmHg: 88, heartRateBpm: 72, etco2MmHg: 38, depthIndex: 50 });
    const c = thresholdSignature({ spo2Percent: 89, meanArterialMmHg: 88, heartRateBpm: 72, etco2MmHg: 38, depthIndex: 50 });
    expect(a).toBe(b);
    expect(a).not.toBe(c);
  });

  it('Scenario: Full state is available on demand', () => {
    const patient = new VirtualPatient(PROFILE, createRng(1));
    const summary = stateSummary(patient.snapshot(), {
      alarms: [],
      infusions: [{ drugId: 'remifentanil', rate: 17, unit: 'µg/min' }],
      ventilator: { mode: 'volume-control', tidalVolumeMl: 500, respiratoryRateBpm: 12, fio2: 0.5, delivering: true },
      invalid: new Set(),
    });
    // All current vitals, active infusions, ventilator settings and active alarms.
    expect(summary).toContain('Heart rate');
    expect(summary).toContain('Oxygen saturation');
    expect(summary).toContain('remifentanil');
    expect(summary).toContain('Ventilator');
    expect(summary).toContain('No active alarms');
  });

  it('states that a value is not measurable rather than reading a stale one', () => {
    const patient = new VirtualPatient(PROFILE, createRng(1));
    const summary = stateSummary(patient.snapshot(), {
      alarms: [], infusions: [],
      ventilator: { mode: 'manual', tidalVolumeMl: 0, respiratoryRateBpm: 0, fio2: 0.21, delivering: false },
      invalid: new Set(['spo2Percent']),
    });
    expect(summary).toContain('not measurable');
    expect(summary).toContain('Probe not reading');
  });

  it('Scenario: Waveforms have a non-visual equivalent', () => {
    const descriptions = waveformDescriptions({
      rhythm: 'sinus', bronchospasmSeverity: 0, airwayPatencyFraction: 1, perfusionIndex: 0.8,
      artifacts: new Set(), ventilating: true, mechanicalPulse: true,
    });
    expect(descriptions).toHaveLength(4);
    for (const description of descriptions) {
      expect(description.description.length).toBeGreaterThan(20);
    }
    // The rhythm is named, the capnogram shape is named, and the arterial shape is named.
    expect(descriptions[0]?.description).toContain('P wave');
    expect(descriptions[2]?.description).toContain('alpha angle');
    expect(descriptions[1]?.description).toContain('dicrotic notch');
  });

  it('describes normal baseline pulses from patient state even before ventilation starts', () => {
    const engine = new AnesthesiaEngine({
      scenario: ROUTINE_INDUCTION, seed: 7, practiceRegion: 'US',
    });
    const arterial: number[] = [];
    const pleth: number[] = [];
    let result = engine.step();
    for (let tick = 0; tick < 20; tick += 1) {
      result = engine.step();
      arterial.push(...result.waveforms.arterial.samples);
      pleth.push(...result.waveforms.pleth.samples);
    }
    // The canvas source was already truthful: both mechanical traces contain
    // real signal while the ventilator is off.
    expect(arterial.some((sample) => Math.abs(sample) > 1)).toBe(true);
    expect(pleth.some((sample) => Math.abs(sample) > 0.01)).toBe(true);
    expect(result.equipment.ventilator.delivering).toBe(false);

    const descriptions = waveformDescriptions({
      rhythm: 'sinus', bronchospasmSeverity: 0, airwayPatencyFraction: 1,
      perfusionIndex: result.state.perfusionIndex, artifacts: new Set(),
      ventilating: result.state.respiratoryRateBpm > 0,
      mechanicalPulse: mechanicalPulseFromState(result.state),
    });
    expect(descriptions[1]?.description).toContain('dicrotic notch');
    expect(descriptions[3]?.description).toContain('Regular pulses');
    expect(mechanicalPulseFromState({
      ...result.state, heartRateBpm: 0, strokeVolumeMl: 0, cardiacOutputLPerMin: 0,
    })).toBe(false);
  });

  it('names an artifact in the description rather than describing physiology', () => {
    const damped = waveformDescriptions({
      rhythm: 'sinus', bronchospasmSeverity: 0, airwayPatencyFraction: 1, perfusionIndex: 0.8,
      artifacts: new Set(['arterial-damping']), ventilating: true, mechanicalPulse: true,
    });
    expect(damped[1]?.description).toContain('monitoring problem');
    const cautery = waveformDescriptions({
      rhythm: 'sinus', bronchospasmSeverity: 0, airwayPatencyFraction: 1, perfusionIndex: 0.8,
      artifacts: new Set(['electrocautery']), ventilating: true, mechanicalPulse: true,
    });
    expect(cautery[0]?.description).toContain('interference');
  });

  it('describes the shark fin when the airway is obstructed', () => {
    const obstructed = waveformDescriptions({
      rhythm: 'sinus', bronchospasmSeverity: 0.8, airwayPatencyFraction: 1, perfusionIndex: 0.8,
      artifacts: new Set(), ventilating: true, mechanicalPulse: true,
    });
    expect(obstructed[2]?.description).toContain('Shark-fin');
  });

  it('describes complete upper-airway closure without naming a diagnosis or a shark fin', () => {
    const closed = waveformDescriptions({
      rhythm: 'sinus', bronchospasmSeverity: 0, airwayPatencyFraction: 0, perfusionIndex: 0.8,
      artifacts: new Set(), ventilating: true, mechanicalPulse: true,
    });
    expect(closed[2]?.description).toContain('No waveform: no gas is moving.');
    expect(closed[2]?.description.toLowerCase()).not.toContain('laryngospasm');
    expect(closed[2]?.description).not.toContain('Shark-fin');
  });

  it('includes active airway support in the on-demand state summary', () => {
    const patient = new VirtualPatient(PROFILE, createRng(1));
    const summary = stateSummary(patient.snapshot(), {
      alarms: [], infusions: [],
      ventilator: {
        mode: 'manual', tidalVolumeMl: 500, respiratoryRateBpm: 12,
        fio2: 1, delivering: true,
      },
      invalid: new Set(), jawThrustCpapSecondsRemaining: 12,
    });
    expect(summary).toContain('Jaw thrust and continuous positive airway pressure are being applied.');
    expect(summary.toLowerCase()).not.toContain('laryngospasm');
  });

  it('reports accepted crisis support and exposure without naming a diagnosis', () => {
    const patient = new VirtualPatient(PROFILE, createRng(1));
    const summary = stateSummary(patient.snapshot(), {
      alarms: [], infusions: [],
      ventilator: {
        mode: 'volume-control', tidalVolumeMl: 500, respiratoryRateBpm: 12,
        fio2: 1, delivering: true,
      },
      invalid: new Set(), epinephrineLabel: 'adrenaline',
      resuscitation: {
        epinephrineEffectFraction: 0.4,
        epinephrineTotalMicrograms: 50,
        crystalloidTotalMl: 1000,
      },
      lastExposure: { agentId: 'cefazolin', tick: 600 },
    });
    expect(summary).toContain('adrenaline 50 micrograms intravenous');
    expect(summary).toContain('balanced crystalloid 1000 millilitres');
    expect(summary).toContain('Most recent modeled trigger exposure: cefazolin.');
    expect(summary.toLowerCase()).not.toContain('anaphylaxis');
  });

  it('says the plethysmogram is non-pulsatile in pulseless electrical activity', () => {
    const pea = waveformDescriptions({
      rhythm: 'pea', bronchospasmSeverity: 0, airwayPatencyFraction: 1, perfusionIndex: 0.8,
      artifacts: new Set(), ventilating: true, mechanicalPulse: false,
    });
    expect(pea[3]?.description).toContain('Non-pulsatile');
    expect(pea[1]?.description).toContain('Flat');
  });
});

describe('Requirement: Complete Keyboard Operation', () => {
  it('documents shortcuts for the time-critical actions', () => {
    const timeCritical = SHORTCUTS.filter((s) => s.timeCritical);
    expect(timeCritical.length).toBeGreaterThanOrEqual(4);
    // Drug administration, ventilation and alarm handling are all reachable.
    const actions = SHORTCUTS.map((s) => s.action.toLowerCase()).join(' ');
    expect(actions).toContain('dose');
    expect(actions).toContain('ventilat');
    expect(actions).toContain('alarm');
    // Every shortcut is uniquely bound.
    expect(new Set(SHORTCUTS.map((s) => s.keys)).size).toBe(SHORTCUTS.length);
  });
});
