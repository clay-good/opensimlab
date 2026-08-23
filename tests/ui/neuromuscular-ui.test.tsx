/** @vitest-environment jsdom */
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { MonitorRegion } from '@anesthesia/ui/MonitorRegion';
import { formularyForMode } from '@anesthesia/ui/ActionCockpit';
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

  it('includes the conditional value in the on-demand screen-reader summary', () => {
    const common = { alarms: [], infusions: [], ventilator: {
      mode: 'manual', tidalVolumeMl: 500, respiratoryRateBpm: 12, fio2: 1, delivering: false,
    }, invalid: new Set<string>() };
    expect(stateSummary(STATE as never, { ...common, showTrainOfFour: true }))
      .toContain('Train-of-four ratio: 0.08');
    expect(stateSummary(STATE as never, { ...common, showTrainOfFour: true }))
      .toContain('Train-of-four count: 0 of 4');
    expect(stateSummary(STATE as never, common)).not.toContain('Train-of-four ratio');
  });
});
