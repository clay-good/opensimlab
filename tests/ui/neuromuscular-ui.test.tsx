/** @vitest-environment jsdom */
import { renderToStaticMarkup } from 'react-dom/server';
import { act, createElement } from 'react';
import { createRoot } from 'react-dom/client';
import { describe, expect, it, vi } from 'vitest';
import { MonitorRegion } from '@anesthesia/ui/MonitorRegion';
import { formularyForMode, NeuromuscularReversalTray } from '@anesthesia/ui/ActionCockpit';
import { stateSummary } from '@anesthesia/ui/accessibility';
import type { FormularyEntry } from '@anesthesia/scenarios/types';

const FORMULARY: FormularyEntry[] = [
  {
    drugId: 'propofol', concentration: 10, concentrationUnit: 'mg/mL', syringeVolumeMl: 20,
    typicalDose: 100, presets: [{ label: '100 mg', amount: 100, unit: 'mg' }],
  },
  {
    drugId: 'rocuronium', deliveryModes: ['bolus'], concentration: 10,
    concentrationUnit: 'mg/mL', syringeVolumeMl: 10, typicalDose: 60,
    presets: [{ label: '0.6 mg/kg', amount: 0.6, unit: 'mg/kg' }],
  },
];

const STATE = {
  heartRateBpm: 72, meanArterialMmHg: 82, etco2MmHg: 36, spo2Percent: 99,
  depthIndex: 45, coreTemperatureC: 36.7, fio2: 1, trainOfFourRatio: 0.08, trainOfFourCount: 0,
};

function monitor(showTrainOfFour: boolean): string {
  return renderToStaticMarkup(<MonitorRegion
    state={STATE}
    blocks={[]}
    alarms={[]}
    tick={0}
    invalidParameters={new Set()}
    artifactParameters={new Set()}
    waveformArtifacts={new Set()}
    rhythm="sinus"
    airwayPatencyFraction={1}
    bronchospasmSeverity={0}
    mechanicalPulse={false}
    reducedMotion
    colorblindSafe={false}
    showLimits
    primaryTracesOnly={false}
    canvasHeight={320}
    onSilence={() => undefined}
    onWhy={() => undefined}
    showTrainOfFour={showTrainOfFour}
    neuromuscularConfidence={{ label: 'Teaching model', kind: 'teaching' }}
  />);
}

describe('neuromuscular controls and monitoring', () => {
  it('offers rocuronium as a bolus and never invents an infusion control', () => {
    expect(formularyForMode(FORMULARY, 'bolus').map((drug) => drug.drugId))
      .toEqual(['propofol', 'rocuronium']);
    expect(formularyForMode(FORMULARY, 'infusion').map((drug) => drug.drugId))
      .toEqual(['propofol']);
  });

  it('shows a quantitative, fully named TOF value only when the scenario declares it', () => {
    const shown = monitor(true);
    expect(shown).toContain('Train-of-four');
    expect(shown).toContain('0.08');
    expect(shown).toContain('Teaching model');
    expect(shown).toContain('count 0');
    expect(shown).toContain('aria-label="Train-of-four: 0.08');
    expect(monitor(false)).not.toContain('Train-of-four');
  });

  it('shows the qualitative assessment missing residual blockade that the ratio detects', () => {
    const residual = renderToStaticMarkup(<MonitorRegion
      state={{ ...STATE, trainOfFourRatio: 0.6, trainOfFourCount: 4 }}
      blocks={[]} alarms={[]} tick={0} invalidParameters={new Set()}
      artifactParameters={new Set()} waveformArtifacts={new Set()} rhythm="sinus"
      airwayPatencyFraction={1} bronchospasmSeverity={0} mechanicalPulse={false}
      reducedMotion colorblindSafe={false} showLimits primaryTracesOnly={false}
      canvasHeight={320} onSilence={() => undefined} onWhy={() => undefined}
      showTrainOfFour neuromuscularConfidence={{ label: 'Teaching model', kind: 'teaching' }}
    />);
    expect(residual).toContain('0.60');
    expect(residual).toContain('qualitative no detectable fade');
  });

  it('includes the conditional value in the on-demand screen-reader summary', () => {
    const common = { alarms: [], infusions: [], ventilator: {
      mode: 'manual', tidalVolumeMl: 500, respiratoryRateBpm: 12, fio2: 1, delivering: false,
    }, invalid: new Set<string>() };
    const summary = stateSummary(STATE as never, {
      ...common,
      showTrainOfFour: true,
      resuscitation: {
        epinephrineEffectFraction: 0, epinephrineTotalMicrograms: 0, crystalloidTotalMl: 0,
        postTetanicCount: 1,
        lastNeuromuscularReversal: { agent: 'sugammadex', doseMgPerKg: 4, tick: 100 },
      },
      showEpinephrineSupport: false,
    });
    expect(summary)
      .toContain('Train-of-four ratio: 0.08');
    expect(summary)
      .toContain('Train-of-four count: 0 of 4');
    expect(summary).toContain('Auto-derived post-tetanic-count teaching proxy: 1');
    expect(summary).toContain('Last accepted neuromuscular reversal: sugammadex 4');
    expect(stateSummary(STATE as never, common)).not.toContain('Train-of-four ratio');
  });

  it('makes depth-matched reversal keyboard-operable with two-step confirmation', () => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    const container = document.createElement('div');
    document.body.appendChild(container);
    const root = createRoot(container);
    const onReverse = vi.fn();
    act(() => root.render(createElement(NeuromuscularReversalTray, {
      trainOfFourRatio: 0, trainOfFourCount: 0, postTetanicCount: 1,
      lastReversal: null, onReverse,
    })));
    const button = (label: string) => [...container.querySelectorAll('button')]
      .find((entry) => entry.textContent?.trim() === label) as HTMLButtonElement | undefined;
    expect(button('Sugammadex 2 mg/kg IV')?.disabled).toBe(true);
    expect(button('Sugammadex 4 mg/kg IV')?.disabled).toBe(false);
    expect(button('Neostigmine + antimuscarinic IV')?.disabled).toBe(true);
    expect(container.textContent).toContain('auto-derived PTC teaching proxy 1');
    act(() => { button('Sugammadex 4 mg/kg IV')!.focus(); button('Sugammadex 4 mg/kg IV')!.click(); });
    expect(onReverse).not.toHaveBeenCalled();
    act(() => button('Give reversal')!.click());
    expect(onReverse).toHaveBeenCalledWith('sugammadex', 4);
    act(() => root.unmount());
    container.remove();
  });

  it('offers combined neostigmine only during minimal block', () => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    const container = document.createElement('div');
    document.body.appendChild(container);
    const root = createRoot(container);
    const onReverse = vi.fn();
    const renderTray = (trainOfFourCount: number, trainOfFourRatio: number) => act(() => root.render(
      createElement(NeuromuscularReversalTray, {
        trainOfFourRatio, trainOfFourCount, postTetanicCount: 0,
        lastReversal: null, onReverse,
      }),
    ));
    const button = () => [...container.querySelectorAll('button')]
      .find((entry) => entry.textContent?.trim() === 'Neostigmine + antimuscarinic IV') as HTMLButtonElement;
    renderTray(3, 0.6);
    expect(button().disabled).toBe(true);
    renderTray(4, 0.39);
    expect(button().disabled).toBe(true);
    renderTray(4, 0.6);
    expect(button().disabled).toBe(false);
    act(() => button().click());
    act(() => ([...container.querySelectorAll('button')]
      .find((entry) => entry.textContent?.trim() === 'Give reversal') as HTMLButtonElement).click());
    expect(onReverse).toHaveBeenCalledWith('neostigmine');
    act(() => root.unmount());
    container.remove();
  });
});
