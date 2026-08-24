/**
 * The Action Cockpit (design/layout → Action Cockpit Composition,
 * cockpit/action-cockpit).
 *
 * A tab strip of trays. The active infusion summary is pinned and visible
 * whichever tray is open, because a running infusion must never be hidden.
 *
 * Administering a preset dose is a two-step confirm and takes exactly two
 * interactions: select the preset, then confirm.
 */

import { useState } from 'react';
import { Badge, Button, NumericField, SegmentedControl, Slider, SteppedDial, Tabs, Toggle } from '@platform/ui';
import { lastLipidProtocolForWeight, type Scenario } from '@anesthesia/engine';
import type { FormularyEntry } from '@anesthesia/scenarios/types';
import { term, type RegionProfile } from '@anesthesia/region/profiles';
import { FLUIDS } from '@anesthesia/content/fluids';
import { JAW_THRUST_CPAP_SECONDS } from '@anesthesia/physiology';

export type TrayId = 'syringes' | 'infusions' | 'fluids' | 'airway' | 'crisis';

export interface RunningInfusion {
  readonly drugId: string;
  readonly rate: number;
  readonly unit: string;
  readonly elapsedSeconds: number;
}

export interface HypnoticLineStatus {
  readonly connected: boolean;
  readonly inspected: boolean;
}

export interface ActionCockpitProps {
  readonly scenario: Scenario;
  readonly region: RegionProfile;
  readonly infusions: readonly RunningInfusion[];
  readonly hypnoticLine: HypnoticLineStatus;
  readonly resuscitation: {
    readonly epinephrineEffectFraction: number;
    readonly epinephrineTotalMicrograms: number;
    readonly lastEpinephrineTick: number | null;
    readonly crystalloidTotalMl: number;
    readonly dantroleneTotalMg: number;
    readonly dantroleneEffectFraction: number;
    readonly lastDantroleneTick: number | null;
    readonly activeCooling: boolean;
    readonly localAnestheticToxicityFraction?: number;
    readonly seizureActivityFraction?: number;
    readonly seizureSuppressed?: boolean;
    readonly lipidEmulsionTotalMl?: number;
    readonly lipidEmulsionBolusRemainingMl?: number;
    readonly lipidEmulsionInfusionMlPerMin?: number;
    readonly lipidEmulsionEffectFraction?: number;
    readonly lastLipidEmulsionTick?: number | null;
    readonly cardiacArrestActive?: boolean;
    readonly chestCompressionsActive?: boolean;
    readonly chestCompressionSeconds?: number;
    readonly compressionPerfusionFraction?: number;
    readonly arrestEpinephrineTotalMg?: number;
    readonly lastArrestEpinephrineTick?: number | null;
    readonly defibrillationShockCount?: number;
    readonly lastDefibrillationEnergyJ?: number | null;
    readonly roscAtTick?: number | null;
  };
  readonly injectedCrisisIds?: readonly string[];
  readonly lastExposure: { readonly agentId: string; readonly tick: number } | null;
  readonly syringeRemaining: Readonly<Record<string, number>>;
  readonly ventilator: {
    mode: 'volume-control' | 'pressure-control' | 'manual';
    tidalVolumeMl: number;
    respiratoryRateBpm: number;
    fio2: number;
    peep: number;
    delivering: boolean;
    sevofluranePercent: number;
    freshGasFlowLPerMin: number;
  };
  readonly intubated: boolean;
  readonly airwayAttempts: number;
  readonly lastGrade: number | null;
  readonly airwayAttemptInProgress?: boolean;
  readonly airwayAttemptSecondsRemaining?: number;
  readonly jawThrustCpapSecondsRemaining: number;
  readonly airwayDevice: 'facemask' | 'supraglottic-airway' | 'tracheal-tube';
  readonly supraglotticInsertionSecondsRemaining: number;
  readonly helpRequestedAtTick: number | null;
  readonly muscleRigidityFraction: number;
  readonly onBolus: (drugId: string, amount: number, unit: string) => void;
  readonly onInfusion: (drugId: string, rate: number, unit: string) => void;
  readonly onHypnoticLine: (action: 'inspect' | 'reconnect') => void;
  readonly onFluid: (fluidId: string, volumeMl: number) => void;
  readonly onVentilator: (settings: Partial<ActionCockpitProps['ventilator']>) => void;
  readonly onLaryngoscopy: (technique: 'direct' | 'video') => void;
  readonly onAirwayManeuver: (maneuver: 'jaw-thrust-cpap') => void;
  readonly onCallForHelp: () => void;
  readonly onAirwayDevice: (device: 'supraglottic-airway') => void;
  readonly onEpinephrine: (doseMicrograms: number) => void;
  readonly onDantrolene: () => void;
  readonly onActiveCooling: (active: boolean) => void;
  readonly onSeizureSuppression?: () => void;
  readonly onLipidEmulsion?: () => void;
  readonly onChestCompressions?: (active: boolean) => void;
  readonly onArrestEpinephrine?: () => void;
  readonly onDefibrillation?: (energyJ: number) => void;
  readonly onDrugCard: (drugId: string) => void;
}

/** The scenario declares which trays may offer each drug. Existing entries default to both. */
export function formularyForMode(
  formulary: readonly FormularyEntry[],
  mode: 'bolus' | 'infusion',
): FormularyEntry[] {
  return formulary.filter((drug) => drug.deliveryModes?.includes(mode) ?? true);
}

/** One source of truth for both visible rescue trays and the nonvisual state summary. */
export function crisisResponseAvailability(
  scenario: Scenario,
  injectedCrisisIds: readonly string[] = [],
) {
  const injected = new Set(injectedCrisisIds);
  return {
    hasAnaphylaxisResponse: injected.has('anaphylaxis')
      || scenario.timeline.some((event) => event.type === 'anaphylaxis'),
    hasHypermetabolicResponse: injected.has('malignant-hyperthermia')
      || scenario.timeline.some((event) => event.type === 'malignant-hyperthermia'),
    hasLastResponse: injected.has('local-anesthetic-systemic-toxicity')
      || scenario.timeline.some((event) => event.type === 'local-anesthetic-toxicity'),
    hasCardiacArrestResponse: injected.has('cardiac-arrest-shockable')
      || injected.has('cardiac-arrest-non-shockable')
      || scenario.timeline.some((event) => event.type === 'rhythm-change'
        && ['ventricular-fibrillation', 'asystole', 'pea'].includes(event.target ?? '')),
  };
}

/**
 * Four working trays, not placeholder tabs.
 *
 * Fluids & Blood and Resuscitation were tabs containing one sentence each,
 * saying they were not in this build. Two fifths of the action cockpit's tabs
 * led nowhere, on the region a learner spends the session in and which is the
 * first thing to run out of room on a laptop.
 *
 * The honesty is kept and the clutter is not: what is not modelled is now said
 * once, in a line under the trays, where it is read rather than clicked into.
 */
const TRAYS: { id: TrayId; label: string }[] = [
  { id: 'syringes', label: 'Syringes' },
  { id: 'infusions', label: 'Infusions' },
  { id: 'fluids', label: 'Fluids' },
  { id: 'airway', label: 'Airway & Vent' },
];
const CRISIS_TRAY = { id: 'crisis', label: 'Crisis response' } as const;

/**
 * Said once, in the place a learner would go looking for the missing thing.
 *
 * The notice distinguishes the bounded scripted arrest response from hypoxic
 * arrest elsewhere, where resuscitation remains outside the model.
 */
export const NOT_IN_THIS_BUILD =
  'Blood products are not modeled. Crystalloid uses a fixed 25% intravascular retention teaching model. '
  + 'Cardiac-arrest resuscitation actions — compressions, arrest-dose epinephrine, and defibrillation — '
  + 'are available only in the bounded scripted arrest case; a patient with hypoxic arrest elsewhere does not recover.';

export function ActionCockpit(props: ActionCockpitProps) {
  const [tray, setTray] = useState<TrayId>('syringes');
  const {
    hasAnaphylaxisResponse, hasHypermetabolicResponse, hasLastResponse,
    hasCardiacArrestResponse,
  } = crisisResponseAvailability(props.scenario, props.injectedCrisisIds);
  const hasDifficultAirwayResponse = props.scenario.timeline.some(
    (event) => event.type === 'difficult-airway',
  );
  const hasEpinephrineResponse = hasAnaphylaxisResponse || hasLastResponse;
  const hasCrisisResponse = hasEpinephrineResponse || hasHypermetabolicResponse || hasCardiacArrestResponse;
  const trays = hasCrisisResponse ? [...TRAYS, CRISIS_TRAY] : TRAYS;

  return (
    <div className="actions">
      <Tabs
        label="Action trays"
        tabs={trays}
        active={tray}
        onSelect={(id) => setTray(id as TrayId)}
      />

      {/* Pinned: running infusions are visible regardless of the selected tray. */}
      <div className="actions__pinned" role="status" aria-label="Pump settings for running infusions">
        {props.infusions.length === 0
          ? <span>No infusions running</span>
          : props.infusions.map((infusion) => (
            <span key={infusion.drugId} className="numeric">
              Pump set: {infusion.drugId} {infusion.rate.toFixed(1)} {infusion.unit} ·{' '}
              {Math.floor(infusion.elapsedSeconds / 60)}m {Math.floor(infusion.elapsedSeconds % 60)}s
            </span>
          ))}
      </div>

      <div className="actions__tray">
        {tray === 'syringes' && (
          <SyringeTray
            formulary={props.scenario.formulary}
            remaining={props.syringeRemaining}
            weightKg={props.scenario.patient.weightKg}
            onBolus={props.onBolus}
            onDrugCard={props.onDrugCard}
          />
        )}
        {tray === 'infusions' && (
          <InfusionTray
            formulary={props.scenario.formulary}
            region={props.region}
            weightKg={props.scenario.patient.weightKg}
            hypnoticLine={props.hypnoticLine}
            onInfusion={props.onInfusion}
            onHypnoticLine={props.onHypnoticLine}
          />
        )}
        {tray === 'fluids' && (
          <FluidTray
            crystalloidTotalMl={props.resuscitation.crystalloidTotalMl}
            ageYears={props.scenario.patient.ageYears}
            onFluid={props.onFluid}
          />
        )}
        {tray === 'airway' && (
          <AirwayTray
            ventilator={props.ventilator}
            intubated={props.intubated}
            attempts={props.airwayAttempts}
            lastGrade={props.lastGrade}
            attemptInProgress={props.airwayAttemptInProgress ?? false}
            attemptSecondsRemaining={props.airwayAttemptSecondsRemaining ?? 0}
            jawThrustCpapSecondsRemaining={props.jawThrustCpapSecondsRemaining}
            device={props.airwayDevice}
            supraglotticInsertionSecondsRemaining={props.supraglotticInsertionSecondsRemaining}
            helpRequestedAtTick={props.helpRequestedAtTick}
            showDifficultAirwayRescue={hasDifficultAirwayResponse}
            actualBodyWeightKg={props.scenario.patient.weightKg}
            region={props.region}
            onVentilator={props.onVentilator}
            onLaryngoscopy={props.onLaryngoscopy}
            onAirwayManeuver={props.onAirwayManeuver}
            onCallForHelp={props.onCallForHelp}
            onAirwayDevice={props.onAirwayDevice}
          />
        )}
        {tray === 'crisis' && hasCrisisResponse && (
          <div style={{ display: 'grid', gap: 'var(--space-4)' }}>
            {hasEpinephrineResponse && (
              <EpinephrineCrisisTray
                region={props.region}
                epinephrineTotalMicrograms={props.resuscitation.epinephrineTotalMicrograms}
                lastExposure={props.lastExposure}
                lastMaximumMicrograms={hasLastResponse ? props.scenario.patient.weightKg : undefined}
                onEpinephrine={props.onEpinephrine}
              />
            )}
            {hasLastResponse && (
              <LocalAnestheticToxicityTray
                weightKg={props.scenario.patient.weightKg}
                seizureActivityFraction={props.resuscitation.seizureActivityFraction ?? 0}
                seizureSuppressed={props.resuscitation.seizureSuppressed ?? false}
                lipidEmulsionTotalMl={props.resuscitation.lipidEmulsionTotalMl ?? 0}
                lipidEmulsionInfusionMlPerMin={props.resuscitation.lipidEmulsionInfusionMlPerMin ?? 0}
                onSeizureSuppression={props.onSeizureSuppression ?? (() => {})}
                onLipidEmulsion={props.onLipidEmulsion ?? (() => {})}
              />
            )}
            {hasHypermetabolicResponse && (
              <HypermetabolicCrisisTray
                weightKg={props.scenario.patient.weightKg}
                muscleRigidityFraction={props.muscleRigidityFraction}
                dantroleneTotalMg={props.resuscitation.dantroleneTotalMg}
                dantroleneEffectFraction={props.resuscitation.dantroleneEffectFraction}
                activeCooling={props.resuscitation.activeCooling}
                onDantrolene={props.onDantrolene}
                onActiveCooling={props.onActiveCooling}
              />
            )}
            {hasCardiacArrestResponse && (
              <CardiacArrestTray
                active={props.resuscitation.cardiacArrestActive ?? false}
                compressionsActive={props.resuscitation.chestCompressionsActive ?? false}
                compressionSeconds={props.resuscitation.chestCompressionSeconds ?? 0}
                epinephrineTotalMg={props.resuscitation.arrestEpinephrineTotalMg ?? 0}
                shockCount={props.resuscitation.defibrillationShockCount ?? 0}
                lastEnergyJ={props.resuscitation.lastDefibrillationEnergyJ ?? null}
                roscAtTick={props.resuscitation.roscAtTick ?? null}
                onCompressions={props.onChestCompressions ?? (() => {})}
                onEpinephrine={props.onArrestEpinephrine ?? (() => {})}
                onDefibrillation={props.onDefibrillation ?? (() => {})}
              />
            )}
          </div>
        )}
        {/* Inside the scrolling tray, not as a row of its own.
            As a fixed row it cost the tray forty pixels it does not have on a
            laptop with the demonstration strip up, and the dose buttons went
            below the fold. Here it costs nothing and is still found by anyone
            who scrolls to the end looking for the thing that is missing. */}
        <p className="actions__not-modelled field__hint">
          {NOT_IN_THIS_BUILD}{' '}
          <a href="/limitations">The limitations register says what else.</a>
        </p>
      </div>
    </div>
  );
}

function CardiacArrestTray({
  active, compressionsActive, compressionSeconds, epinephrineTotalMg, shockCount, lastEnergyJ,
  roscAtTick, onCompressions, onEpinephrine, onDefibrillation,
}: {
  active: boolean;
  compressionsActive: boolean;
  compressionSeconds: number;
  epinephrineTotalMg: number;
  shockCount: number;
  lastEnergyJ: number | null;
  roscAtTick: number | null;
  onCompressions: (active: boolean) => void;
  onEpinephrine: () => void;
  onDefibrillation: (energyJ: number) => void;
}) {
  const [pending, setPending] = useState<'epinephrine' | number | null>(null);
  const energies = [120, 150, 200];
  return (
    <div className="tray-grid">
      <section className="syringe">
        <div className="syringe__name">Chest compressions</div>
        <div className="syringe__meta">Fixed 110/min teaching action</div>
        <Badge kind="teaching">Teaching model</Badge>
        <p className="syringe__remaining" role="status">
          {roscAtTick !== null ? 'ROSC recorded'
            : active ? `${compressionsActive ? 'Running' : 'Stopped'} · ${compressionSeconds.toFixed(0)} s accepted`
              : 'No scripted arrest active'}
        </p>
        <Button variant={compressionsActive ? 'ghost' : 'primary'} disabled={!active}
          onClick={() => onCompressions(!compressionsActive)}>
          {compressionsActive ? 'Pause compressions' : 'Start compressions'}
        </Button>
        <p className="field__hint">Depth, recoil, interruptions, fatigue, and physical skill are not modeled.</p>
      </section>
      <section className="syringe">
        <div className="syringe__name">Cardiac-arrest epinephrine</div>
        <div className="syringe__meta">1 mg IV · bounded adult action</div>
        <p className="syringe__remaining" role="status">Accepted total: {epinephrineTotalMg.toFixed(0)} mg</p>
        {pending !== 'epinephrine' ? (
          <Button disabled={!active || epinephrineTotalMg > 0} onClick={() => setPending('epinephrine')}>Prepare 1 mg IV</Button>
        ) : (
          <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
            <Button variant="primary" onClick={() => { onEpinephrine(); setPending(null); }}>Give 1 mg IV</Button>
            <Button variant="ghost" onClick={() => setPending(null)}>Cancel</Button>
          </div>
        )}
        <p className="field__hint">The current AHA adult algorithm repeats epinephrine every 3–5 minutes; this case ends at initial ROSC.</p>
      </section>
      <section className="syringe">
        <div className="syringe__name">Biphasic defibrillation</div>
        <div className="syringe__meta">Energy-selected teaching action</div>
        <p className="syringe__remaining" role="status">
          Shocks: {shockCount}{lastEnergyJ === null ? '' : ` · last ${lastEnergyJ} J`}
        </p>
        {typeof pending !== 'number' ? (
          <div className="syringe__presets">
            {energies.map((energy) => <Button key={energy} disabled={!active}
              onClick={() => setPending(energy)}>{energy} J</Button>)}
          </div>
        ) : (
          <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
            <Button variant="primary" onClick={() => { onDefibrillation(pending); setPending(null); }}>
              Deliver {pending} J
            </Button>
            <Button variant="ghost" onClick={() => setPending(null)}>Cancel</Button>
          </div>
        )}
        <p className="field__hint">This declared device converts VF at 200 J under the case conditions. Other devices use manufacturer guidance. Never shock asystole or PEA.</p>
      </section>
    </div>
  );
}

function FluidTray({ crystalloidTotalMl, ageYears, onFluid }: {
  crystalloidTotalMl: number;
  ageYears: number;
  onFluid: (fluidId: string, volumeMl: number) => void;
}) {
  const pediatric = ageYears < 18;
  const [pending, setPending] = useState<{ fluidId: string; volumeMl: number } | null>(null);
  return (
    <div className="tray-grid">
      {FLUIDS.map((fluid) => (
        <section className="syringe" key={fluid.id}>
          <div className="syringe__name">{fluid.name}</div>
          <p className="field__hint">
            Fixed teaching model: {(fluid.retainedFraction * 100).toFixed(0)}% remains intravascular.
          </p>
          <p className="syringe__remaining" role="status">
            Accepted total: {crystalloidTotalMl.toFixed(0)} mL
          </p>
          {pediatric ? (
            <p className="field__hint">
              No pediatric fluid bolus is stocked in this bounded induction case.
            </p>
          ) : pending?.fluidId === fluid.id ? (
            <div style={{ display: 'grid', gap: 'var(--space-2)' }}>
              <span className="numeric">Give {pending.volumeMl} mL?</span>
              <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                <Button
                  variant="primary"
                  compact
                  onClick={() => { onFluid(pending.fluidId, pending.volumeMl); setPending(null); }}
                >
                  Give fluid
                </Button>
                <Button
                  variant="ghost"
                  compact
                  onClick={() => setPending(null)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div className="syringe__presets">
              {fluid.presetsMl.map((volumeMl) => (
                <Button
                  key={volumeMl}
                  compact
                  onClick={() => setPending({ fluidId: fluid.id, volumeMl })}
                >
                  {volumeMl} mL
                </Button>
              ))}
            </div>
          )}
        </section>
      ))}
    </div>
  );
}

function EpinephrineCrisisTray({
  region, epinephrineTotalMicrograms, lastExposure, lastMaximumMicrograms, onEpinephrine,
}: {
  region: RegionProfile;
  epinephrineTotalMicrograms: number;
  lastExposure: { readonly agentId: string; readonly tick: number } | null;
  lastMaximumMicrograms?: number;
  onEpinephrine: (doseMicrograms: number) => void;
}) {
  const [pendingDose, setPendingDose] = useState<number | null>(null);
  const regionalName = term(region, 'epinephrine');
  const displayName = regionalName.charAt(0).toUpperCase() + regionalName.slice(1);
  const doses = (lastMaximumMicrograms === undefined ? [10, 20, 50] : [5, 10, 20, 50])
    .filter((dose) => lastMaximumMicrograms === undefined || dose <= lastMaximumMicrograms);

  return (
    <div className="tray-grid">
      <section className="syringe">
        <div className="syringe__name">{displayName}</div>
        <div className="syringe__meta">Intravenous bolus · dose in micrograms</div>
        <Badge kind="teaching">Teaching model</Badge>
        <p className="field__hint">
          Pre-prepared dose action. Concentration, dilution, pump delivery, and syringe inventory
          are not modeled.
        </p>
        <p className="syringe__remaining" role="status">
          Accepted total: {epinephrineTotalMicrograms.toFixed(0)} µg IV
        </p>
        {pendingDose === null ? (
          <div className="syringe__presets">
            {doses.map((dose) => (
              <Button
                key={dose}
                className="crisis-drug__action"
                onClick={() => setPendingDose(dose)}
              >
                {dose} µg IV
              </Button>
            ))}
          </div>
        ) : (
          <div style={{ display: 'grid', gap: 'var(--space-2)' }}>
            <span className="numeric">Give {pendingDose} µg IV {regionalName}?</span>
            <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
              <Button
                variant="primary"
                className="crisis-drug__action"
                onClick={() => { onEpinephrine(pendingDose); setPendingDose(null); }}
              >
                Give {displayName}
              </Button>
              <Button
                variant="ghost"
                className="crisis-drug__action"
                onClick={() => setPendingDose(null)}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
      </section>
      <section className="card">
        <h3 className="panel__title" style={{ font: 'var(--type-subtitle)' }}>Recent exposure</h3>
        <p className="field__hint">
          {lastExposure
            ? `${lastExposure.agentId} was the most recent modeled trigger exposure.`
            : 'No modeled trigger exposure has been recorded.'}
        </p>
      </section>
    </div>
  );
}

function LocalAnestheticToxicityTray({
  weightKg, seizureActivityFraction, seizureSuppressed, lipidEmulsionTotalMl,
  lipidEmulsionInfusionMlPerMin, onSeizureSuppression, onLipidEmulsion,
}: {
  weightKg: number;
  seizureActivityFraction: number;
  seizureSuppressed: boolean;
  lipidEmulsionTotalMl: number;
  lipidEmulsionInfusionMlPerMin: number;
  onSeizureSuppression: () => void;
  onLipidEmulsion: () => void;
}) {
  const [pending, setPending] = useState<'benzodiazepine' | 'lipid' | null>(null);
  const protocol = lastLipidProtocolForWeight(weightKg);
  const seizureStatus = seizureSuppressed ? 'suppressed after accepted treatment'
    : seizureActivityFraction > 0 ? 'active modeled seizure activity' : 'none observed';

  return (
    <div className="tray-grid">
      <section className="syringe">
        <div className="syringe__name">Seizure suppression</div>
        <div className="syringe__meta">IV benzodiazepine · agent-class action</div>
        <Badge kind="teaching">Teaching model</Badge>
        <p className="syringe__remaining" role="status">Status: {seizureStatus}</p>
        <p className="field__hint">Drug selection, dose, kinetics, and physical administration are not modeled.</p>
        {pending !== 'benzodiazepine' ? (
          <Button className="crisis-drug__action" onClick={() => setPending('benzodiazepine')}>
            Prepare IV benzodiazepine
          </Button>
        ) : (
          <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
            <Button variant="primary" className="crisis-drug__action" onClick={() => {
              onSeizureSuppression(); setPending(null);
            }}>Give benzodiazepine</Button>
            <Button variant="ghost" className="crisis-drug__action" onClick={() => setPending(null)}>Cancel</Button>
          </div>
        )}
      </section>
      <section className="syringe">
        <div className="syringe__name">20% lipid emulsion</div>
        <div className="syringe__meta">ASRA 2020 initial weight-banded protocol</div>
        <Badge kind="teaching">Teaching model</Badge>
        <p className="syringe__remaining" role="status">
          Accepted total: {lipidEmulsionTotalMl.toFixed(0)} mL
          {lipidEmulsionInfusionMlPerMin > 0
            ? ` · ${lipidEmulsionInfusionMlPerMin.toFixed(1)} mL/min running` : ''}
        </p>
        <p className="field__hint">
          {weightKg.toFixed(0)} kg ({protocol.band}): {protocol.initialBolusMl.toFixed(0)} mL initial
          bolus over 3 modeled minutes, then {protocol.infusionMlPerMin.toFixed(1)} mL/min for the
          bounded 20-minute initial course. Safety ceiling{' '}
          {protocol.maxTotalMl.toFixed(0)} mL.
        </p>
        {pending !== 'lipid' ? (
          <Button className="crisis-drug__action" disabled={lipidEmulsionInfusionMlPerMin > 0}
            onClick={() => setPending('lipid')}>
            Start initial lipid protocol
          </Button>
        ) : (
          <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
            <Button variant="primary" className="crisis-drug__action" onClick={() => {
              onLipidEmulsion(); setPending(null);
            }}>Start 20% lipid</Button>
            <Button variant="ghost" className="crisis-drug__action" onClick={() => setPending(null)}>Cancel</Button>
          </div>
        )}
        <p className="field__hint">
          If epinephrine is used, the modeled maximum is 1 µg/kg IV. Vasopressin, beta blockers,
          calcium-channel blockers, and further local anesthetic are not stocked here.
        </p>
      </section>
    </div>
  );
}

function HypermetabolicCrisisTray({
  weightKg, muscleRigidityFraction, dantroleneTotalMg, dantroleneEffectFraction,
  activeCooling, onDantrolene, onActiveCooling,
}: {
  weightKg: number;
  muscleRigidityFraction: number;
  dantroleneTotalMg: number;
  dantroleneEffectFraction: number;
  activeCooling: boolean;
  onDantrolene: () => void;
  onActiveCooling: (active: boolean) => void;
}) {
  const [pending, setPending] = useState(false);
  const doseMg = weightKg * 2.5;
  const rigidity = muscleRigidityFraction >= 0.75 ? 'marked'
    : muscleRigidityFraction >= 0.4 ? 'moderate'
      : muscleRigidityFraction > 0.05 ? 'mild' : 'none observed';

  return (
    <div className="tray-grid">
      <section className="syringe" aria-labelledby="dantrolene-title">
        <div id="dantrolene-title" className="syringe__name">Dantrolene</div>
        <div className="syringe__meta">Intravenous dose · weight-based</div>
        <Badge kind="teaching">Teaching model</Badge>
        <p className="field__hint">
          Pre-prepared dose action. Reconstitution, vial inventory, laboratory treatment, and
          dose adjustment beyond the displayed weight calculation are not modeled.
        </p>
        <p className="syringe__remaining" role="status">
          Accepted total: {dantroleneTotalMg.toFixed(0)} mg IV
          {dantroleneEffectFraction > 0 ? ' · modeled effect active' : ''}
        </p>
        {!pending ? (
          <Button className="crisis-drug__action" onClick={() => setPending(true)}>
            Prepare 2.5 mg/kg IV
          </Button>
        ) : (
          <div style={{ display: 'grid', gap: 'var(--space-2)' }}>
            <span className="numeric">Give 2.5 mg/kg IV = {doseMg.toFixed(0)} mg?</span>
            <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
              <Button
                variant="primary"
                className="crisis-drug__action"
                onClick={() => { onDantrolene(); setPending(false); }}
              >
                Give dantrolene
              </Button>
              <Button
                variant="ghost"
                className="crisis-drug__action"
                onClick={() => setPending(false)}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
      </section>
      <section className="card" aria-labelledby="observable-signs-title">
        <h3 id="observable-signs-title" className="panel__title" style={{ font: 'var(--type-subtitle)' }}>
          Observable signs and support
        </h3>
        <p className="field__hint" role="status">Muscle rigidity: {rigidity}.</p>
        <p className="field__hint" role="status">
          Active cooling: {activeCooling ? 'on' : 'off'}.
        </p>
        <Button
          className="crisis-drug__action"
          variant={activeCooling ? 'ghost' : 'primary'}
          onClick={() => onActiveCooling(!activeCooling)}
        >
          {activeCooling ? 'Stop active cooling' : 'Start active cooling'}
        </Button>
      </section>
    </div>
  );
}

// --- Syringes ---------------------------------------------------------------

function SyringeTray({ formulary, remaining, weightKg, onBolus, onDrugCard }: {
  formulary: readonly FormularyEntry[];
  remaining: Readonly<Record<string, number>>;
  weightKg: number;
  onBolus: (drugId: string, amount: number, unit: string) => void;
  onDrugCard: (drugId: string) => void;
}) {
  return (
    <div className="tray-grid">
      {formularyForMode(formulary, 'bolus').map((drug) => (
        <Syringe
          key={drug.drugId}
          drug={drug}
          remainingMl={remaining[drug.drugId] ?? drug.syringeVolumeMl}
          weightKg={weightKg}
          onBolus={onBolus}
          onDrugCard={onDrugCard}
        />
      ))}
    </div>
  );
}

function Syringe({ drug, remainingMl, weightKg, onBolus, onDrugCard }: {
  drug: FormularyEntry;
  remainingMl: number;
  weightKg: number;
  onBolus: (drugId: string, amount: number, unit: string) => void;
  onDrugCard: (drugId: string) => void;
}) {
  const [pending, setPending] = useState<{ amount: number; unit: string } | null>(null);
  const [free, setFree] = useState<number | ''>('');

  const massOf = (amount: number, unit: string) => (unit.includes('/kg') ? amount * weightKg : amount);
  const massUnit = drug.concentrationUnit.split('/')[0] ?? 'mg';

  return (
    <div className="syringe">
      <div className="syringe__name">{drug.drugId}</div>
      <div className="syringe__meta">
        {drug.concentration} {drug.concentrationUnit} ·{' '}
        <span className="syringe__remaining">{remainingMl.toFixed(1)} mL left</span>
      </div>

      {pending === null ? (
        <>
          <div className="syringe__presets">
            {drug.presets.map((preset) => (
              <Button
                key={preset.label}
                compact
                onClick={() => setPending({ amount: preset.amount, unit: preset.unit })}
              >
                {preset.label}
              </Button>
            ))}
          </div>
          <NumericField
            label="Free dose"
            unit={massUnit}
            value={free}
            min={0}
            step={1}
            onValueChange={setFree}
          />
          {free !== '' && free > 0 && (
            <Button compact onClick={() => setPending({ amount: free, unit: massUnit })}>
              Prepare {free} {massUnit}
            </Button>
          )}
          <Button variant="ghost" compact onClick={() => onDrugCard(drug.drugId)}>
            Drug card
          </Button>
        </>
      ) : (
        <div style={{ display: 'grid', gap: 'var(--space-2)' }}>
          {/* Weight-based dosing is shown BOTH ways before confirmation. */}
          <span className="numeric">
            {pending.amount} {pending.unit}
            {pending.unit.includes('/kg') && ` = ${massOf(pending.amount, pending.unit).toFixed(0)} ${massUnit}`}
          </span>
          {massOf(pending.amount, pending.unit) > drug.typicalDose * 10 && (
            <Badge kind="out-of-range">
              {(massOf(pending.amount, pending.unit) / drug.typicalDose).toFixed(0)}× the typical dose
            </Badge>
          )}
          <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
            <Button
              variant="primary"
              compact
              onClick={() => { onBolus(drug.drugId, pending.amount, pending.unit); setPending(null); setFree(''); }}
            >
              Give
            </Button>
            <Button variant="ghost" compact onClick={() => setPending(null)}>Cancel</Button>
          </div>
        </div>
      )}
    </div>
  );
}

// --- Infusions ---------------------------------------------------------------

function InfusionTray({ formulary, region, weightKg, hypnoticLine, onInfusion, onHypnoticLine }: {
  formulary: readonly FormularyEntry[];
  region: RegionProfile;
  weightKg: number;
  hypnoticLine: HypnoticLineStatus;
  onInfusion: (drugId: string, rate: number, unit: string) => void;
  onHypnoticLine: (action: 'inspect' | 'reconnect') => void;
}) {
  const [rates, setRates] = useState<Record<string, number>>({});
  const [tciOpen, setTciOpen] = useState(false);

  return (
    <div style={{ display: 'grid', gap: 'var(--space-4)' }}>
      <div className="tray-grid">
        {formularyForMode(formulary, 'infusion').map((drug) => {
          const massUnit = drug.concentrationUnit.split('/')[0] ?? 'mg';
          const rate = rates[drug.drugId] ?? 0;
          return (
            <div className="syringe" key={drug.drugId}>
              <div className="syringe__name">{drug.drugId}</div>
              <div className="syringe__meta">Manual weight-based infusion</div>
              <SteppedDial
                label={`${drug.drugId} infusion rate`}
                value={rate}
                step={0.05}
                min={0}
                max={2}
                precision={2}
                unit={`${massUnit}/kg/min`}
                onChange={(value) => setRates((previous) => ({ ...previous, [drug.drugId]: value }))}
              />
              <span className="syringe__remaining">
                = {(rate * weightKg).toFixed(1)} {massUnit}/min
              </span>
              <Button compact onClick={() => onInfusion(drug.drugId, rate, `${massUnit}/kg/min`)}>
                Set rate
              </Button>
            </div>
          );
        })}
      </div>

      <section className="card" aria-labelledby="hypnotic-line-title">
        <h3 id="hypnotic-line-title" className="panel__title" style={{ font: 'var(--type-subtitle)' }}>
          Propofol delivery line
        </h3>
        {!hypnoticLine.inspected ? (
          <>
            <p className="field__hint">Delivery status has not been inspected.</p>
            <Button onClick={() => onHypnoticLine('inspect')}>Inspect propofol line</Button>
          </>
        ) : hypnoticLine.connected ? (
          <>
            <p className="field__hint" role="status">Connected. Delivery matches the pump setpoint.</p>
            <Button onClick={() => onHypnoticLine('inspect')}>Inspect propofol line again</Button>
          </>
        ) : (
          <>
            <p className="field__hint" role="status">
              Disconnected. The pump setpoint is not reaching the patient.
            </p>
            <Button variant="primary" onClick={() => onHypnoticLine('reconnect')}>
              Reconnect propofol line
            </Button>
          </>
        )}
      </section>

      {/* Target-controlled infusion availability follows the practice region. */}
      <section className="card">
        <h3 className="panel__title" style={{ font: 'var(--type-subtitle)' }}>
          Target-controlled infusion
          {!region.targetControlledInfusion.routine && <> <Badge kind="out-of-range">Out of region</Badge></>}
        </h3>
        <p className="field__hint">{region.targetControlledInfusion.note}</p>
        {region.targetControlledInfusion.routine ? (
          <p className="field__hint">
            Available as a first-class control in this region, with plasma and effect-site
            targeting both offered.
          </p>
        ) : (
          <>
            <Toggle
              checked={tciOpen}
              onChange={setTciOpen}
              label="Open the out-of-region learning module anyway"
            />
            {tciOpen && (
              <p className="field__hint">
                Target-controlled infusion works fully here so you can understand it, and every
                screen carries the out-of-region label. The computed rates are a teaching
                simulation and are not a dosing recommendation for any real patient.
              </p>
            )}
          </>
        )}
      </section>
    </div>
  );
}

// --- Airway and ventilator ---------------------------------------------------

function AirwayTray({
  ventilator, intubated, attempts, lastGrade, attemptInProgress, attemptSecondsRemaining,
  jawThrustCpapSecondsRemaining, device, supraglotticInsertionSecondsRemaining,
  helpRequestedAtTick, showDifficultAirwayRescue, region, onVentilator, onLaryngoscopy,
  onAirwayManeuver, onCallForHelp, onAirwayDevice,
  actualBodyWeightKg,
}: {
  ventilator: ActionCockpitProps['ventilator'];
  intubated: boolean;
  attempts: number;
  lastGrade: number | null;
  attemptInProgress: boolean;
  attemptSecondsRemaining: number;
  jawThrustCpapSecondsRemaining: number;
  device: 'facemask' | 'supraglottic-airway' | 'tracheal-tube';
  supraglotticInsertionSecondsRemaining: number;
  helpRequestedAtTick: number | null;
  showDifficultAirwayRescue: boolean;
  actualBodyWeightKg: number;
  region: RegionProfile;
  onVentilator: (settings: Partial<ActionCockpitProps['ventilator']>) => void;
  onLaryngoscopy: (technique: 'direct' | 'video') => void;
  onAirwayManeuver: (maneuver: 'jaw-thrust-cpap') => void;
  onCallForHelp: () => void;
  onAirwayDevice: (device: 'supraglottic-airway') => void;
}) {
  const holdingAirway = jawThrustCpapSecondsRemaining > 0;
  const insertingSupraglottic = supraglotticInsertionSecondsRemaining > 0;
  const helpRequested = helpRequestedAtTick !== null;
  const supraglotticStatus = insertingSupraglottic
    ? 'Supraglottic airway insertion is in progress. Ventilation is interrupted.'
    : device === 'supraglottic-airway'
      ? 'Supraglottic airway placed. It does not deliver breaths automatically. Turn breath delivery on and confirm sustained gas exchange from the capnogram.'
      : device === 'tracheal-tube'
        ? 'The tracheal tube is in place. Supraglottic airway rescue is unavailable.'
        : 'No supraglottic airway insertion has been started.';
  return (
    <div style={{ display: 'grid', gap: 'var(--space-4)' }}>
      <section>
        <h3 className="field__label">Ventilation</h3>
        <div style={{ display: 'grid', gap: 'var(--space-3)', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
          <SegmentedControl
            label="Ventilation mode"
            value={ventilator.mode}
            onChange={(mode) => onVentilator({ mode })}
            options={[
              { value: 'volume-control' as const, label: 'VC', srLabel: 'Volume control' },
              { value: 'pressure-control' as const, label: 'PC', srLabel: 'Pressure control' },
              { value: 'manual' as const, label: 'MAN', srLabel: 'Manual or spontaneous' },
            ]}
          />
          <Toggle
            checked={ventilator.delivering}
            onChange={(delivering) => onVentilator({ delivering })}
            label={ventilator.delivering ? 'Delivering breaths' : 'Not delivering breaths'}
          />
          <Slider
            label="Inspired oxygen fraction"
            value={ventilator.fio2}
            min={0.21}
            max={1}
            step={0.01}
            precision={2}
            onChange={(fio2) => onVentilator({ fio2 })}
          />
          <Slider
            label="Tidal volume"
            unit="mL"
            value={ventilator.tidalVolumeMl}
            min={0}
            max={900}
            step={10}
            onChange={(tidalVolumeMl) => onVentilator({ tidalVolumeMl })}
          />
          <p className="field__hint" aria-live="off">
            {ventilator.tidalVolumeMl} mL ={' '}
            {(ventilator.tidalVolumeMl / actualBodyWeightKg).toFixed(1)} mL/kg actual body weight.
            Conversion only, not a recommended target.
          </p>
          <Slider
            label="Respiratory rate"
            unit="/min"
            value={ventilator.respiratoryRateBpm}
            min={0}
            max={30}
            step={1}
            onChange={(respiratoryRateBpm) => onVentilator({ respiratoryRateBpm })}
          />
          <Slider
            label="Positive end-expiratory pressure"
            unit="cmH₂O"
            value={ventilator.peep}
            min={0}
            max={20}
            step={1}
            onChange={(peep) => onVentilator({ peep })}
          />
          <Slider
            label="Sevoflurane vaporizer"
            unit="vol %"
            value={ventilator.sevofluranePercent}
            min={0}
            max={8}
            step={0.1}
            onChange={(sevofluranePercent) => onVentilator({ sevofluranePercent })}
          />
          <Slider
            label="Fresh gas flow"
            unit="L/min"
            value={ventilator.freshGasFlowLPerMin}
            min={0.5}
            max={15}
            step={0.5}
            precision={1}
            onChange={(freshGasFlowLPerMin) => onVentilator({ freshGasFlowLPerMin })}
          />
        </div>
        <p className="field__hint">
          The inspired oxygen fraction cannot be set below 0.21. Real anaesthesia machines carry
          the same hypoxic guard.
        </p>
      </section>

      <section>
        <h3 className="field__label">Airway</h3>
        <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
          <Button
            aria-describedby="jaw-thrust-cpap-status"
            disabled={holdingAirway}
            onClick={() => onAirwayManeuver('jaw-thrust-cpap')}
          >
            Apply jaw thrust + continuous positive pressure
          </Button>
          <Button
            onClick={() => onLaryngoscopy('direct')}
            disabled={intubated || device !== 'facemask' || attemptInProgress || insertingSupraglottic}
          >
            Direct laryngoscopy
          </Button>
          <Button
            onClick={() => onLaryngoscopy('video')}
            disabled={intubated || device !== 'facemask' || attemptInProgress || insertingSupraglottic}
          >
            Videolaryngoscopy
          </Button>
        </div>
        <p id="jaw-thrust-cpap-status" className="field__hint">
          {holdingAirway
            ? ventilator.delivering
              ? `Jaw thrust and continuous positive pressure in progress: ${Math.ceil(jawThrustCpapSecondsRemaining)} simulated seconds remaining.`
              : `Jaw thrust hold in progress: ${Math.ceil(jawThrustCpapSecondsRemaining)} simulated seconds remaining. The ventilator is not delivering positive pressure.`
            : `Applies a fixed ${JAW_THRUST_CPAP_SECONDS}-second teaching-model hold, not a recommended clinical duration. Assess its effect from gas movement and the capnogram.`}
        </p>
        <p className="field__hint">
          {attemptInProgress
            ? `Attempt in progress: ${attemptSecondsRemaining} simulated seconds remaining. Ventilation is interrupted.`
            : intubated
            ? 'The tube is in and its position is confirmed by the capnogram.'
            : attempts === 0
              ? 'No attempt yet. Each attempt consumes time and the patient is apnoeic throughout.'
              : `${attempts} attempt${attempts === 1 ? '' : 's'} so far`
                + (lastGrade !== null ? `, last view Cormack-Lehane grade ${lastGrade}.` : '.')
                + ' Repeated attempts worsen the view through airway trauma.'}
        </p>
        {showDifficultAirwayRescue && (
          <section aria-labelledby="airway-rescue-title" style={{ marginBlockStart: 'var(--space-3)' }}>
            <h4 id="airway-rescue-title" className="field__label">Airway rescue</h4>
            <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
              <Button
                className="airway-rescue__action"
                aria-describedby="airway-rescue-status"
                disabled={helpRequested}
                onClick={onCallForHelp}
              >
                Call for help
              </Button>
              <Button
                className="airway-rescue__action"
                aria-describedby="airway-rescue-status airway-rescue-countdown"
                disabled={device !== 'facemask' || attemptInProgress || insertingSupraglottic}
                onClick={() => onAirwayDevice('supraglottic-airway')}
              >
                Insert supraglottic airway
              </Button>
            </div>
            <p id="airway-rescue-status" className="field__hint" role="status" aria-live="polite">
              {helpRequested ? 'Help has been requested. ' : 'No help request has been recorded. '}
              {supraglotticStatus}
            </p>
            <p id="airway-rescue-countdown" className="field__hint" aria-live="off">
              {insertingSupraglottic
                ? `Insertion countdown: ${Math.ceil(supraglotticInsertionSecondsRemaining)} simulated seconds remaining.`
                : 'Insertion takes a fixed 15 simulated seconds in this teaching model.'}
            </p>
          </section>
        )}
        <p className="reading__aside">
          Airway protocol: {region.airwayGuideline.name} ({region.airwayGuideline.issuingBody},{' '}
          {region.airwayGuideline.version}).
        </p>
      </section>
    </div>
  );
}
