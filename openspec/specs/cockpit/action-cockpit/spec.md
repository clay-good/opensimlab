# cockpit/action-cockpit Specification

## Purpose

Defines every way a learner acts on the virtual patient: intravenous boluses, continuous infusions and target-controlled infusion, the anesthesia machine and ventilator, fluids and blood products, airway maneuvers, and defibrillation. This is the surface where clinical intent becomes a simulation input.

## Requirements

### Requirement: Intravenous Bolus Administration

The cockpit SHALL provide a syringe tray of the scenario's formulary, each syringe showing drug name, concentration, and a dose entry that accepts both a preset and a free value. Administration SHALL be a two-step confirm to prevent accidental dosing, and SHALL be recordable in under 3 seconds for a preset dose.

#### Scenario: Preset dose is fast and explicit

- **WHEN** the learner selects the propofol syringe and taps the 100 mg preset and confirms
- **THEN** the bolus is applied at the current tick, the event log records drug, dose, units, route, and tick, and the concentration panel shows the resulting plasma spike

#### Scenario: Weight-based dosing is offered and shown both ways

- **WHEN** the learner enters 2 mg/kg for a 70 kg patient
- **THEN** the interface shows both 2 mg/kg and the resulting 140 mg before confirmation, and the log records both

#### Scenario: An implausible dose requires deliberate confirmation

- **WHEN** the entered dose exceeds ten times the scenario's typical dose for that agent
- **THEN** a distinct confirmation appears naming the multiple, the learner may still proceed because teaching overdose is a purpose of the simulator, and the event is marked in the transcript

#### Scenario: An empty syringe cannot be pushed

- **WHEN** a syringe's declared volume is exhausted
- **THEN** further administration from it is refused with an explanation, and drawing up a new syringe is an explicit action

### Requirement: Continuous Infusions

The cockpit SHALL support continuous infusions with rates entered in mass per time or mass per kilogram per time, started, titrated, and stopped at any time, with the running rate visible at all times.

#### Scenario: Rate change takes effect at the tick it is made

- **WHEN** an infusion is changed from 100 to 50 µg/kg/min
- **THEN** the solver's input rate changes at that exact tick, the event log records the old and new rates, and the concentration curve inflects accordingly

#### Scenario: A running infusion is always visible

- **WHEN** any infusion is running
- **THEN** a persistent indicator shows the drug, rate, units, and elapsed infusion time regardless of which cockpit tab is open

### Requirement: Target-Controlled Infusion

The cockpit SHALL provide a target-controlled infusion mode in which the learner sets a target plasma or effect-site concentration and the simulator computes the infusion profile that achieves it. This computation is an Open-SimLab simulation feature and SHALL be implemented in Open-SimLab's own control layer, and SHALL be structurally separated from the forward-only simulation kernel.

#### Scenario: Effect-site targeting overshoots plasma, as real pumps do

- **WHEN** the learner sets an effect-site target of 3.0 µg/mL propofol from zero
- **THEN** the computed profile drives plasma concentration above the target to accelerate effect-site equilibration and then reduces it, and effect-site concentration reaches within 5% of target without sustained overshoot

#### Scenario: Target-controlled infusion is labeled as simulation-only

- **WHEN** target-controlled infusion mode is active
- **THEN** the panel carries a persistent notice that the computed rates are a teaching simulation and are not a dosing recommendation for any real patient

#### Scenario: The engine boundary is enforced in code

- **WHEN** the codebase is inspected
- **THEN** the target-solving code lives outside the simulation kernel module, that module exposes no inverse-control entry point, and an architecture test fails the build if the kernel module gains one

#### Scenario: Targeting refuses an out-of-envelope model

- **WHEN** the active model has been auto-tiered to `D` by an envelope violation
- **THEN** target-controlled infusion mode is unavailable for that model and the reason is stated, because computing a dose profile from a model known to be invalid for this patient is the exact error the simulator teaches against

### Requirement: Anesthesia Machine And Ventilator

The cockpit SHALL provide controls for inspired oxygen fraction, fresh gas flow, ventilation mode (volume control, pressure control, and manual or spontaneous), tidal volume, respiratory rate, positive end-expiratory pressure, inspiratory-to-expiratory ratio, and the sevoflurane vaporizer dial, with measured values displayed alongside set values.

#### Scenario: Set and measured values differ under a leak

- **WHEN** a circuit leak is active
- **THEN** the measured expired tidal volume falls below the set tidal volume, the discrepancy is visible, and the vaporizer wash-in slows

#### Scenario: Apnea in manual mode is the learner's responsibility

- **WHEN** the learner switches to manual mode in a paralyzed patient and does not ventilate
- **THEN** end-tidal carbon dioxide rises, saturation falls after the apnea time, and no automatic rescue occurs

#### Scenario: Hypoxic mixture is prevented

- **WHEN** the learner attempts to set an inspired oxygen fraction below 0.21
- **THEN** the control refuses, matching the hypoxic guard on real anesthesia machines, and explains why

### Requirement: Fluids, Blood Products, And Vasoactive Support

The cockpit SHALL provide crystalloid and colloid boluses, packed red blood cells and other products, and vasoactive agents including phenylephrine, ephedrine, and epinephrine, each with the volume or dose recorded.

#### Scenario: Volume given is tracked cumulatively

- **WHEN** several fluid boluses are given
- **THEN** a running total of crystalloid, colloid, and blood products administered is displayed and included in the debrief

#### Scenario: Vasoactive agents are marked as illustrative

- **WHEN** a vasoactive agent without a curated population model is given
- **THEN** the response is produced by the labeled pedagogical model and the event log entry carries the illustrative marker

### Requirement: Airway And Resuscitation Actions

The cockpit SHALL support airway maneuvers (bag-mask ventilation, oral airway, supraglottic airway, laryngoscopy and intubation with a success model, and surgical airway), chest compressions, and defibrillation with energy selection.

#### Scenario: Intubation success depends on the airway assessment

- **WHEN** the profile declares a difficult airway and the learner attempts direct laryngoscopy
- **THEN** the attempt may fail according to the scenario's success model, each attempt consumes simulated time, saturation falls during apnea, and repeated attempts worsen airway trauma

#### Scenario: Defibrillation matches the rhythm

- **WHEN** the rhythm is ventricular fibrillation and a 200 J shock is delivered
- **THEN** the rhythm may convert per the scenario's model; **AND WHEN** the rhythm is asystole and a shock is delivered, no conversion occurs and the debrief records shocking a non-shockable rhythm

### Requirement: Cockpit Is Fully Operable Without A Mouse

Every cockpit action SHALL be reachable by keyboard and by touch, with touch targets no smaller than 44 by 44 CSS pixels.

#### Scenario: Keyboard-only induction is possible

- **WHEN** a learner using only a keyboard performs a complete induction sequence
- **THEN** every control is reachable in a logical tab order, the focused control is always visibly indicated, and no action requires hover or drag

#### Scenario: Touch targets meet the minimum on a small phone

- **WHEN** the interface renders at a 360 CSS pixel viewport width
- **THEN** every interactive control measures at least 44 by 44 CSS pixels and no two adjacent controls overlap
