# engine/pkpd-core Specification

## Purpose

Defines the deterministic pharmacokinetic and pharmacodynamic numerical core of Open-SimLab: the multi-compartment solvers, effect-site kinetics, and concentration-to-effect mapping that turn a dose history into predicted plasma concentration, effect-site concentration, and drug effect. This capability owns the mathematics only; it has no knowledge of the UI, the clock, or scenarios.

## Requirements

### Requirement: Mammillary Compartment Solver

The engine SHALL implement a general N-compartment mammillary pharmacokinetic model parameterized by central volume `V1`, peripheral volumes `V2..Vn`, elimination clearance `CL`, and intercompartmental clearances `Q2..Qn`, solving the coupled system:

```
dA1/dt = R(t) - (CL/V1)*A1 - Σ_k (Qk/V1)*A1 + Σ_k (Qk/Vk)*Ak
dAk/dt = (Qk/V1)*A1 - (Qk/Vk)*Ak                for k = 2..n
Cp(t)  = A1(t) / V1
```

where `A` denotes amount (mg or µg) per compartment and `R(t)` is the instantaneous infusion rate. The solver SHALL support `n = 1`, `2`, and `3`, because the curated Hypnos models span all three.

#### Scenario: Three-compartment propofol bolus reproduces the reference kernel

- **WHEN** a 2 mg/kg propofol bolus is given to the Hypnos reference individual (35 y, 70 kg, 170 cm, male) using `hypnotics_iv.propofol.eleveld_2018`
- **THEN** the computed `Cp(t)` and `Ce(t)` series over 0–60 min match the Hypnos Python reference kernel to within a relative error of 1e-6 at every 1-second sample

#### Scenario: Mass is conserved in the absence of elimination

- **WHEN** the solver runs with `CL = 0` and a single 100 mg bolus for 240 simulated minutes
- **THEN** the sum of amounts across all compartments stays within 1e-9 relative error of 100 mg at every step

#### Scenario: An unsupported compartment count is rejected at load time

- **WHEN** a model descriptor declares `structure.compartments = 4`
- **THEN** the engine refuses to instantiate the model and raises a typed `UnsupportedModelStructure` error naming the model id, rather than silently truncating to three compartments

### Requirement: Effect-Site Compartment

The engine SHALL model the effect site as a volumeless compartment driven by first-order equilibration:

```
dCe/dt = ke0 * (Cp - Ce)
```

The effect-site compartment SHALL NOT feed mass back into the central compartment, and `ke0` SHALL be taken from the model descriptor, never defaulted.

#### Scenario: Hysteresis is visible after a bolus

- **WHEN** a propofol bolus is given under Marsh 1991 (`ke0 = 0.26 min⁻¹`)
- **THEN** peak `Ce` occurs strictly later than peak `Cp`, and `t_peak(Ce) − t_peak(Cp)` falls within 1 second of the analytic value for that `ke0`

#### Scenario: A model without a published ke0 refuses to produce Ce

- **WHEN** a model descriptor has `structure.effect_compartment = false`
- **THEN** the engine exposes `Cp` only, returns `Ce = undefined`, and any consumer requesting `Ce` receives a typed `NoEffectSiteForModel` error instead of a substituted or borrowed `ke0`

### Requirement: Covariate Scaling

The engine SHALL compute model parameters from patient covariates (age, total body weight, height, sex, and any model-specific covariate) using the covariate equations transcribed from the Hypnos dataset, including the shared body-composition equations James 1976, Janmahasatian 2005, and Al-Sallami 2015.

#### Scenario: Schnider lean body mass uses James 1976

- **WHEN** parameters are computed for `hypnotics_iv.propofol.schnider_1998`
- **THEN** `CL` is derived from the James 1976 lean body mass equation, and the resulting `V1`, `V2`, `V3`, `CL`, `Q2`, `Q3` match Hypnos `parameters.csv` for the same covariates to within 1e-9 relative error

#### Scenario: Missing a required covariate is a hard error

- **WHEN** a model requires height and the patient descriptor omits it
- **THEN** parameter computation fails with a typed `MissingCovariate` error naming both the covariate and the model id, and no simulation step runs

### Requirement: Sigmoid Emax Pharmacodynamics

The engine SHALL map effect-site concentration to effect using the sigmoidal Emax (Hill) relationship:

```
Effect(Ce) = E0 + (Emax − E0) * Ce^γ / (Ce50^γ + Ce^γ)
```

with `E0`, `Emax`, `Ce50`, and `γ` supplied by the PD model descriptor. Models that publish asymmetric slopes (for example the Eleveld two-slope BIS sigmoid, `hypnotics_iv.propofol.eleveld_bis`) SHALL apply the appropriate `γ` on each side of `Ce50`.

#### Scenario: Propofol BIS falls into the surgical range

- **WHEN** the reference adult reaches a steady effect-site propofol concentration of 3.0 µg/mL under `pd_effect.propofol.eleveld_bis`
- **THEN** the reported BIS lies within the closed interval [40, 60]

#### Scenario: The two-slope sigmoid is continuous at Ce50

- **WHEN** effect is evaluated at `Ce50 − ε` and `Ce50 + ε` for `ε = 1e-9`
- **THEN** the two results differ by less than 1e-6 BIS units, proving the piecewise slope introduces no discontinuity

### Requirement: Drug Interaction Response Surface

The engine SHALL model hypnotic–opioid synergy using a published response-surface model rather than by adding independent effects. The propofol–remifentanil surface SHALL use the Hypnos `interaction.propofol_remifentanil` descriptor.

#### Scenario: Remifentanil deepens hypnosis at fixed propofol

- **WHEN** effect-site propofol is held at 2.0 µg/mL and effect-site remifentanil is raised from 0 to 4 ng/mL
- **THEN** the predicted BIS decreases monotonically, and the decrease is strictly larger than the sum of each drug's isolated effect at those concentrations

#### Scenario: The surface degrades to the single-drug curve

- **WHEN** effect-site remifentanil is exactly 0
- **THEN** the surface returns the identical value to the standalone propofol BIS model, within 1e-9

### Requirement: Fixed-Step Deterministic Integration

The engine SHALL advance state using a fixed-step integrator at a simulation step of 100 ms, using the analytic matrix-exponential solution over each step for the linear compartment system and RK4 for any non-linear submodel. Integration SHALL be free of wall-clock, `Date`, or unseeded randomness so that identical inputs always yield bit-identical outputs.

#### Scenario: Replay is bit-identical

- **WHEN** the same recorded dose-and-event history is replayed twice in separate browser sessions on different machines
- **THEN** every emitted state sample is bit-identical, verified by comparing a SHA-256 hash of the serialized 100 ms state trace

#### Scenario: Step size is decoupled from frame rate

- **WHEN** the render loop drops from 60 fps to 12 fps for 5 seconds
- **THEN** the solver still executes exactly 10 steps per simulated second, and the state at the end of the interval matches the 60 fps run to within 1e-9

#### Scenario: Wall-clock stall does not fast-forward the patient

- **WHEN** the browser tab is backgrounded for 10 minutes at 1× speed
- **THEN** on resume the engine advances at most a bounded catch-up window of 5 simulated seconds and then continues in real time, rather than integrating 10 minutes of accumulated lag in one burst

### Requirement: Numeric Parity With The Hypnos Reference

The repository SHALL contain a golden-vector test suite generated from the Hypnos Python kernels, covering every implemented model, and CI SHALL fail if any TypeScript output diverges beyond the stated tolerance.

#### Scenario: A drifting kernel blocks the build

- **WHEN** a code change alters propofol `Cp` at any golden sample by more than 1e-6 relative error
- **THEN** the CI parity job fails and reports the model id, the sample time, and both values

#### Scenario: Golden vectors record their provenance

- **WHEN** a golden vector file is inspected
- **THEN** it names the Hypnos dataset version, the model id, the covariates, the dose schedule, and the Hypnos commit hash used to generate it
