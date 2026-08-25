/** @vitest-environment jsdom */
import { act, createElement } from 'react';
import { createRoot } from 'react-dom/client';
import { describe, expect, it, vi } from 'vitest';
import { ActionCockpit, type ActionCockpitProps } from '@anesthesia/ui/ActionCockpit';
import { waveformDescriptions } from '@anesthesia/ui/accessibility';
import { UNITED_STATES } from '@anesthesia/region/profiles';
import { PULSE_OXIMETER_MOTION_ARTIFACT as SCENARIO } from '../../src/modules/critical-care/scenarios/pulse-oximeter-motion-artifact';

describe('Requirement: pulse-ox artifact remains separate from oxygenation', () => {
  it('keeps signal confidence, corroboration, and unstable-patient guardrails visible', () => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    const container = document.createElement('div'); document.body.appendChild(container);
    const root = createRoot(container); const onAction = vi.fn();
    const props = { scenario: SCENARIO, region: UNITED_STATES, infusions: [],
      hypnoticLine: { connected: true, inspected: false }, resuscitation: {
        epinephrineEffectFraction: 0, epinephrineTotalMicrograms: 0, lastEpinephrineTick: null,
        crystalloidTotalMl: 0, dantroleneTotalMg: 0, dantroleneEffectFraction: 0,
        lastDantroleneTick: null, activeCooling: false,
        pulseOximeterArtifactAssessment: { discordanceAtTick: null, plethAtTick: null,
          probePerfusionAtTick: null, corroboratedAtTick: null, reassessedAtTick: null,
          displayedSpo2Percent: 82, displayedPulseRateBpm: 132, signalQuality: 'poor' } },
      lastExposure: null, syringeRemaining: {}, ventilator: { mode: 'manual',
        tidalVolumeMl: 500, respiratoryRateBpm: 16, fio2: 0.28, peep: 0, delivering: false,
        sevofluranePercent: 0, freshGasFlowLPerMin: 4 }, intubated: false, airwayAttempts: 0,
      lastGrade: null, jawThrustCpapSecondsRemaining: 0, airwayDevice: 'facemask',
      supraglotticInsertionSecondsRemaining: 0, helpRequestedAtTick: null,
      muscleRigidityFraction: 0, onBolus: () => {}, onInfusion: () => {}, onHypnoticLine: () => {},
      onFluid: () => {}, onVentilator: () => {}, onLaryngoscopy: () => {}, onAirwayManeuver: () => {},
      onCallForHelp: () => {}, onAirwayDevice: () => {}, onEpinephrine: () => {}, onDantrolene: () => {},
      onActiveCooling: () => {}, onPulseOximeterArtifactResponse: onAction, onDrugCard: () => {},
    } satisfies ActionCockpitProps;
    act(() => root.render(createElement(ActionCockpit, props)));
    expect(container.querySelector('[role="tablist"]')).toBeNull();
    expect(container.textContent).toContain('Trust the signal, not just the number.');
    expect(container.textContent).toContain('82% display · pulse 132 · ECG 86');
    expect(container.textContent).toContain('A clean capnogram cannot exclude hypoxemia.');
    expect(container.textContent).toContain('If the patient is unstable, support and escalate in parallel.');
    const first = [...container.querySelectorAll('button')]
      .find((button) => button.textContent?.includes('Separate display from patient'));
    act(() => first?.click());
    expect(onAction).toHaveBeenCalledWith('recognize-pulse-oximeter-discordance');
    const descriptions = waveformDescriptions({ rhythm: 'sinus', bronchospasmSeverity: 0,
      airwayPatencyFraction: 1, perfusionIndex: 0.8, artifacts: new Set(['pleth']),
      ventilating: true, mechanicalPulse: true });
    expect(descriptions.find((entry) => entry.signal === 'pleth')?.description)
      .toContain('Artifact-affected');
    expect(descriptions.find((entry) => entry.signal === 'capno')?.description)
      .toContain('Normal rectangular');
    act(() => root.unmount()); container.remove();
  });
});
