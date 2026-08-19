# engine/pkpd-core Specification

## Purpose

Defines the deterministic pharmacokinetic and pharmacodynamic numerical core: the multi-compartment solvers, effect-site kinetics, and concentration-to-effect mapping that turn a dose history into predicted plasma concentration, effect-site concentration, and drug effect. This capability owns the mathematics only; it knows nothing of the interface, the clock, or scenarios.

## Requirements

### Requirement: Mammillary Compartment Solver

The engine SHALL implement a general N-compartment mammillary pharmacokinetic model parameterized by central volume `V1`, peripheral volumes `V2..Vn`, elimination clearance `CL`, and intercompartmental clearances `Q2..Qn`, solving:

```
dA1/dt = R(t) - (CL/V1)*A1 - Σ_k (Qk/V1)*A1 + Σ_k (Qk/Vk)*Ak
dAk/dt = (Qk/V1)*A1 - (Qk/Vk)*Ak                for k = 2..n
Cp(t)  = A1(t) / V1
```

where `A` is amount per compartment and `R(t)` is the instantaneous infusion rate. The solver SHALL support `n = 1`, `2`, and `3`.

#### Scenario: A propofol bolus reproduces published values

- **WHEN** a 2 mg/kg propofol bolus is given to the Eleveld 2018 reference individual (35 y, 70 kg, 170 cm, male)
- **THEN** the computed plasma and effect-site concentrations match the concentration-time points published in the source paper to within the paper's own reported precision, asserted as a test

#### Scenario: Mass is conserved in the absence of elimination

- **WHEN** the solver runs with `CL = 0` and a single 100 mg bolus for 240 simulated minutes
- **THEN** the summed amount across all compartments stays within 1e-9 relative error of 100 mg at every step

#### Scenario: An unsupported compartment count is rejected at load time

- **WHEN** a model declares four compartments
- **THEN** the engine refuses to instantiate it and raises a typed `UnsupportedModelStructure` error naming the model, rather than silently truncating to three

### Requirement: Effect-Site Compartment

The engine SHALL model the effect site as a volumeless compartment driven by first-order equilibration, `dCe/dt = ke0 * (Cp - Ce)`, which SHALL NOT feed mass back into the central compartment. `ke0` SHALL come from the model declaration and SHALL never be defaulted.

#### Scenario: Hysteresis is present and correctly timed

- **WHEN** a propofol bolus is given under a model with `ke0 = 0.26 min⁻¹`
- **THEN** peak effect-site concentration occurs strictly later than peak plasma concentration, and the interval matches the analytic time-to-peak-effect for that `ke0` within 1 second

#### Scenario: A model without a published ke0 produces no effect-site curve

- **WHEN** a model declares no effect compartment
- **THEN** the engine exposes plasma concentration only and any request for effect-site concentration raises a typed `NoEffectSiteForModel` error rather than substituting a borrowed constant

### Requirement: Covariate Scaling

The engine SHALL compute model parameters from patient covariates using the covariate equations declared with each model, including the shared body-composition equations (James 1976, Janmahasatian 2005, Al-Sallami 2015) implemented once and reused.

#### Scenario: A shared body-composition equation has one implementation

- **WHEN** two models both require lean body mass by the same published equation
- **THEN** both call the single shared implementation, verified by a test asserting identical output and by the absence of a duplicate definition

#### Scenario: Missing a required covariate is a hard error

- **WHEN** a model requires height and the patient declaration omits it
- **THEN** parameter computation fails with a typed `MissingCovariate` error naming the covariate and the model, and no simulation step runs

### Requirement: Sigmoid Emax Pharmacodynamics

The engine SHALL map effect-site concentration to effect using the sigmoidal Emax relationship `Effect(Ce) = E0 + (Emax − E0) * Ce^γ / (Ce50^γ + Ce^γ)`, with parameters supplied by the pharmacodynamic model. Models publishing asymmetric slopes SHALL apply the appropriate `γ` on each side of `Ce50`.

#### Scenario: Propofol depth of anesthesia lands in the surgical range

- **WHEN** the reference adult reaches a steady effect-site propofol concentration of 3.0 µg/mL
- **THEN** the reported depth-of-anesthesia index lies within the closed interval [40, 60]

#### Scenario: A two-slope sigmoid is continuous at Ce50

- **WHEN** effect is evaluated at `Ce50 − 1e-9` and `Ce50 + 1e-9`
- **THEN** the results differ by less than 1e-6 index units

### Requirement: Drug Interaction Response Surface

Hypnotic–opioid synergy SHALL be modeled with a published response-surface model, never by summing independent effects.

#### Scenario: Opioid deepens hypnosis more than addition predicts

- **WHEN** effect-site propofol is held at 2.0 µg/mL and effect-site remifentanil rises from 0 to 4 ng/mL
- **THEN** the predicted depth index falls monotonically, and the fall exceeds the sum of each drug's isolated effect at those concentrations

#### Scenario: The surface degrades to the single-drug curve

- **WHEN** effect-site remifentanil is exactly 0
- **THEN** the surface returns the standalone propofol value within 1e-9

### Requirement: Fixed-Step Deterministic Integration

The engine SHALL advance state in fixed 100 ms steps, using the analytic matrix-exponential solution over each step for the linear compartment system and fourth-order Runge-Kutta for any non-linear submodel. Integration SHALL be free of wall-clock reads, `Date`, and unseeded randomness.

#### Scenario: Replay is bit-identical across devices

- **WHEN** the same recorded action history is replayed in separate browser sessions on different machines
- **THEN** every emitted state sample is bit-identical, verified by comparing a SHA-256 hash of the serialized state trace

#### Scenario: Step size is decoupled from frame rate

- **WHEN** the render loop drops from 60 to 12 frames per second for 5 seconds
- **THEN** the solver still executes exactly 10 steps per simulated second and the resulting state matches the 60 fps run within 1e-9

### Requirement: Golden-Trace Regression Suite

The repository SHALL hold golden state traces for a fixed set of canonical cases, and continuous integration SHALL fail on any divergence, so that an unintended change to physiology cannot merge silently.

#### Scenario: A drifting solver blocks the build

- **WHEN** a change alters any golden trace beyond 1e-9 relative error
- **THEN** the regression job fails and reports the case, the sample time, the parameter, and both values

#### Scenario: An intended change is recorded, not hidden

- **WHEN** a change deliberately alters simulated behavior
- **THEN** the pull request must commit the regenerated golden traces together with a written justification, and the changelog records it as a behavior change

#### Scenario: Golden traces record their provenance

- **WHEN** a golden trace file is inspected
- **THEN** it names the model, the covariates, the dose schedule, the engine version, and the commit that generated it
