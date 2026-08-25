/** @vitest-environment jsdom */
import { act, createElement } from 'react';
import { createRoot } from 'react-dom/client';
import { describe, expect, it, vi } from 'vitest';
import { ActionCockpit, type ActionCockpitProps } from '@anesthesia/ui/ActionCockpit';
import { UNITED_STATES } from '@anesthesia/region/profiles';
import { ENDOTRACHEAL_TUBE_MIGRATION_AFTER_REPOSITIONING as SCENARIO } from '../../src/modules/critical-care/scenarios/endotracheal-tube-migration-after-repositioning';

describe('Requirement: post-repositioning tube migration stays multi-signal and bounded', () => {
  it('keeps movement, bilateral ventilation, support, correction, and proof visible', () => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    const container = document.createElement('div'); document.body.appendChild(container);
    const root = createRoot(container); const onAction = vi.fn();
    const props = { scenario: SCENARIO, region: UNITED_STATES, infusions: [],
      hypnoticLine: { connected: true, inspected: false }, resuscitation: {
        epinephrineEffectFraction: 0, epinephrineTotalMicrograms: 0, lastEpinephrineTick: null,
        crystalloidTotalMl: 0, dantroleneTotalMg: 0, dantroleneEffectFraction: 0,
        lastDantroleneTick: null, activeCooling: false,
        endotrachealTubeMigrationAssessment: { recognizedAtTick: null, supportedAtTick: null,
          positionReviewedAtTick: null, correctionAtTick: null, reassessedAtTick: null } },
      lastExposure: null, syringeRemaining: {}, ventilator: { mode: 'volume-control',
        tidalVolumeMl: 420, respiratoryRateBpm: 18, fio2: 0.5, peep: 0, delivering: true,
        sevofluranePercent: 0, freshGasFlowLPerMin: 10 }, intubated: true, airwayAttempts: 0,
      lastGrade: null, jawThrustCpapSecondsRemaining: 0, airwayDevice: 'tracheal-tube',
      supraglotticInsertionSecondsRemaining: 0, helpRequestedAtTick: null,
      muscleRigidityFraction: 0, onBolus: () => {}, onInfusion: () => {}, onHypnoticLine: () => {},
      onFluid: () => {}, onVentilator: () => {}, onLaryngoscopy: () => {}, onAirwayManeuver: () => {},
      onCallForHelp: () => {}, onAirwayDevice: () => {}, onEpinephrine: () => {}, onDantrolene: () => {},
      onActiveCooling: () => {}, onEndotrachealTubeMigrationResponse: onAction, onDrugCard: () => {},
    } satisfies ActionCockpitProps;
    act(() => root.render(createElement(ActionCockpit, props)));
    expect(container.querySelector('[role="tablist"]')).toBeNull();
    expect(container.textContent).toContain('After every move, earn the airway again.');
    expect(container.textContent).toContain('22 → 25 cm · left markedly reduced · Ppeak 36');
    expect(container.textContent).toContain('Support first. Correct with proof.');
    expect(container.textContent).toContain('Exact depth is a case fact, not a target.');
    const first = [...container.querySelectorAll('button')]
      .find((button) => button.textContent?.includes('Recognize the post-turn change'));
    act(() => first?.click());
    expect(onAction).toHaveBeenCalledWith('recognize-post-repositioning-ventilation-change');
    act(() => root.unmount()); container.remove();
  });
});
