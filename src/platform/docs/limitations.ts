/**
 * The limitations register (platform/clinical-governance → The Limitations Register).
 *
 * Each entry names the specific simplification, the clinical situation where it
 * would mislead, and the correct clinical understanding. It is linked from the
 * interface, not buried in a repository file, and a scenario whose teaching points
 * sit near one of these names it in the briefing.
 */

export interface Limitation {
  readonly id: string;
  /**
   * One short sentence, for the scenario briefing.
   *
   * `simplification` is written for someone reading the register and runs to a
   * paragraph. A briefing needs a line. Without one, briefings printed the raw
   * id — a learner opening the bronchospasm scenario was shown the bullet
   * "no-shunt-or-dead-space-dynamics".
   */
  readonly headline: string;
  readonly simplification: string;
  readonly whereItMisleads: string;
  readonly correctUnderstanding: string;
  /** Scenarios that should name this in their briefing. */
  readonly briefIn: readonly string[];
}

export const LIMITATIONS: readonly Limitation[] = [
  {
    id: 'crystalloid-volume-model',
    headline: 'Crystalloid retains a fixed 25% intravascular fraction here; redistribution, electrolytes, and fluid rate are not modeled.',
    simplification: 'A crystalloid bolus acts on the next simulation tick and exactly 25% remains '
      + 'in the circulation. The added plasma dilutes hemoglobin, but there is no time-dependent '
      + 'redistribution, renal loss, electrolyte effect, or distinction between crystalloid formulations.',
    whereItMisleads: 'Reading the response to a fluid bolus as an individualized prediction, or '
      + 'using this case to choose a product, rate, or endpoint for real hemorrhage resuscitation.',
    correctUnderstanding: 'Fluid response depends on the patient, the product, the rate, ongoing '
      + 'loss, capillary permeability, and repeated reassessment. Crystalloid is only a bridge in '
      + 'major hemorrhage; definitive replacement includes blood products and hemorrhage control.',
    briefIn: [
      'unexpected-intraoperative-hemorrhage', 'hypotension-after-induction',
      'perioperative-anaphylaxis-after-antibiotic', 'blood-bank-handoff',
    ],
  },
  {
    id: 'ventilation-modes-are-not-distinguished',
    headline: 'Volume control and pressure control ventilate identically here: there is no airway-pressure or compliance model, so falling tidal volume at a fixed pressure cannot be shown.',
    simplification: 'Volume control and pressure control ventilate identically. There is no '
      + 'airway-pressure or lung-compliance model, so the delivered tidal volume is always the one '
      + 'set, whichever mode is selected.',
    whereItMisleads: 'Any question about what changes when you switch modes, about peak versus '
      + 'plateau pressure, or about what a pressure-controlled breath does to a patient whose '
      + 'compliance is falling — a bronchospasm, for instance, where the difference is the whole '
      + 'point.',
    correctUnderstanding: 'In volume control the tidal volume is guaranteed and the airway '
      + 'pressure is whatever the lung demands; in pressure control the pressure is guaranteed and '
      + 'the volume falls as compliance falls. Falling tidal volume at a fixed pressure is an '
      + 'early sign of worsening compliance, and this simulator cannot show it to you.',
    briefIn: ['bronchospasm'],
  },
  {
    id: 'bronchospasm-response-is-bounded',
    headline: 'Bronchospasm treatment is a bounded adult teaching response; examination, circuit delivery, repeat timing, advanced drugs, and individualized response are not modeled.',
    simplification: 'A confirmed 5 mg nebulized salbutamol action reduces modeled lower-airway '
      + 'obstruction on a fixed trajectory. The simulator does not model auscultation, tube or '
      + 'circuit checks, suction, nebulizer placement, HME removal, circuit delivery losses, '
      + 'repeat-dose timing, second-line drugs, dynamic hyperinflation, or individualized response.',
    whereItMisleads: 'Treating improvement after the button as proof of diagnosis, assuming the '
      + 'displayed dose reached the lung, or using the fixed response to predict a real patient.',
    correctUnderstanding: 'Call for help, use 100% oxygen, deepen anesthesia, stop stimulation, '
      + 'exclude mechanical and diagnostic alternatives, deliver a bronchodilator effectively, '
      + 'and reassess against the current applicable emergency guidance.',
    briefIn: ['bronchospasm'],
  },
  {
    id: 'volatile-circulatory-effect-is-a-teaching-model',
    headline: 'How far a volatile agent drops the blood pressure is an Open Sim Lab teaching model, not a published figure.',
    simplification: 'Sevoflurane\'s effect on the depth index is anchored to a published quantity '
      + '— the MAC fraction at which a processed-EEG index sits at its midpoint, about one MAC — '
      + 'but its effect on blood pressure is an Open Sim Lab teaching model: fixed fractional falls '
      + 'in vascular resistance and stroke volume per MAC, plus a blunted baroreflex.',
    whereItMisleads: 'Reading the exact pressure fall for a given vaporizer setting as a '
      + 'prediction. The direction and the rough magnitude are right; the number is not published '
      + 'and individual variation is large, particularly in the elderly and the hypovolaemic, '
      + 'where the same MAC costs far more pressure than this model shows.',
    correctUnderstanding: 'Volatile agents cause dose-dependent vasodilation and myocardial '
      + 'depression and blunt the baroreflex, which is why volatile hypotension keeps falling '
      + 'until the vaporizer is turned down, and why the elderly and the hypovolaemic tolerate '
      + 'far less agent than a fit young adult.',
    briefIn: [
      'routine-inhalational-maintenance', 'quantitative-neuromuscular-reversal',
      'routine-pediatric-inhalational-induction',
    ],
  },
  {
    id: 'hypoxic-collapse-is-a-teaching-model',
    headline: 'How the circulation fails from hypoxaemia is an Open Sim Lab teaching model: the sequence is right, the exact thresholds are not published.',
    simplification: 'The circulation\'s response to hypoxaemia — a sympathetic tachycardia as the '
      + 'saturation falls, then bradycardia and falling output as the myocardium fails, then '
      + 'asystole — is an Open Sim Lab teaching model. The sequence is not in doubt; where each '
      + 'threshold sits in an individual patient is not established to the standard this project '
      + 'requires before calling something published.',
    whereItMisleads: 'Reading a specific saturation off this simulator as the point at which a '
      + 'real patient will become bradycardic or arrest. The order of events and the rough '
      + 'timescale are defensible. The numbers are not a prediction for anybody.',
    correctUnderstanding: 'Hypoxaemia severe enough to impair the myocardium causes bradycardia '
      + 'and then asystole, and this is why an unrelieved airway problem kills. A rising heart '
      + 'rate with a falling saturation is the early warning and is where the problem is still '
      + 'fixable; a falling heart rate with a falling saturation is very late.',
    briefIn: ['rapid-desaturation'],
  },
  {
    id: 'no-resuscitation',
    headline: 'Hypoxic arrest outside the scripted VF case remains irreversible and has no resuscitation actions.',
    simplification: 'A hypoxic arrest reached through the physiology remains terminal in that session. '
      + 'The bounded VF case has separate scripted compressions, epinephrine, defibrillation, and ROSC; '
      + 'those actions do not retrofit recovery into other scenarios.',
    whereItMisleads: 'Concluding that restoring oxygen to an arrested patient is what brings them '
      + 'back, or practising anything about cardiac arrest management here. An earlier build did '
      + 'let the circulation return on its own once oxygen was restored, which taught exactly the '
      + 'wrong lesson.',
    correctUnderstanding: 'A hypoxic cardiac arrest is managed as a cardiac arrest: compressions, '
      + 'oxygenation, adrenaline, and treatment of the cause, following a resuscitation algorithm. '
      + 'Correcting the hypoxaemia is necessary and is not by itself sufficient. Learn arrest '
      + 'management where it is actually taught, not here.',
    briefIn: ['rapid-desaturation'],
  },
  {
    id: 'respiratory-depression-is-calibrated',
    headline: "Propofol's respiratory dose-response is an Open Sim Lab calibration, so the direction and rough timescale of apnoea are defensible but the exact duration is not a published number.",
    simplification: 'Propofol\'s respiratory dose-response is an Open Sim Lab calibration, not a '
      + 'transcribed published model. Its shape is chosen so that an induction dose stops the '
      + 'patient breathing and a sedative dose does not, and so that breathing returns as the '
      + 'drug redistributes.',
    whereItMisleads: 'Any attempt to read a specific apnoea duration off this simulator as if it '
      + 'were a prediction for a real patient. The direction and the rough timescale are '
      + 'defensible; the exact number is not a published one.',
    correctUnderstanding: 'How long a given patient stays apnoeic after induction varies widely '
      + 'and is not something a screen can tell you. What transfers is that the respiratory '
      + 'endpoint is more sensitive than the hypnotic one.',
    briefIn: [],
  },
  {
    id: 'oxyhaemoglobin-curve-is-fixed',
    headline: 'The oxyhaemoglobin dissociation curve does not shift with temperature, pH or carbon dioxide.',
    simplification: 'The oxyhaemoglobin dissociation curve does not shift. Saturation is a '
      + 'function of arterial oxygen tension alone, with no Bohr effect and no temperature term, '
      + 'even when core temperature changes in the malignant-hyperthermia teaching model.',
    whereItMisleads: 'Anywhere a shift is the teaching point: the acidotic or hypercapnic patient '
      + 'unloading oxygen more readily at the tissue, the hypothermic patient holding on to it, '
      + 'and stored-blood transfusion.',
    correctUnderstanding: 'Acidosis, hypercapnia and pyrexia move the curve right, so the same '
      + 'saturation corresponds to a higher oxygen tension and oxygen is given up more readily at '
      + 'the tissues. Here the curve is frozen at its normal position.',
    briefIn: ['early-malignant-hyperthermia-during-volatile-anesthesia'],
  },
  {
    id: 'no-shunt-or-dead-space-dynamics',
    headline: 'There is no shunt or ventilation-perfusion model, so the oxygen gradient never widens with atelectasis, position or one-lung ventilation.',
    simplification: 'The alveolar-to-arterial oxygen gradient is a fixed constant per patient '
      + 'profile. There is no shunt fraction and no ventilation-perfusion model, so the gradient '
      + 'does not widen with apnoea, atelectasis, position or one-lung ventilation, and positive '
      + 'end-expiratory pressure cannot narrow it.',
    whereItMisleads: 'Recruitment, laparoscopy, the obese patient in Trendelenburg, and any '
      + 'desaturation whose mechanism is shunt rather than hypoventilation.',
    correctUnderstanding: 'Most intraoperative hypoxaemia is a shunt problem, and the difference '
      + 'between a shunt and hypoventilation is what decides whether more oxygen or more pressure '
      + 'is the answer. This simulator cannot teach that distinction.',
    briefIn: [],
  },
  {
    id: 'bolus-injection-is-instantaneous',
    headline: 'A bolus arrives all at once, so injection rate has no effect and nothing that depends on giving a drug slowly can be shown.',
    simplification: 'A bolus enters the central compartment instantaneously. Injection rate is '
      + 'not modelled, so a dose given over two seconds and the same dose given over sixty behave '
      + 'identically.',
    whereItMisleads: 'Remifentanil in particular: the drug card correctly warns that a rapid '
      + 'bolus causes bradycardia and chest-wall rigidity, and this simulator will let a learner '
      + 'do exactly that with no consequence at all. The same applies to the peak-plasma spike '
      + 'that drives propofol induction hypotension.',
    correctUnderstanding: 'How fast you push it changes the peak plasma concentration and the '
      + 'haemodynamic response, sometimes more than how much you push.',
    briefIn: ['routine-induction', 'routine-geriatric-induction', 'obstetric-general-anesthesia'],
  },
  {
    id: 'opioid-alone-hypnosis',
    headline: 'The response surface gives the opioid more hypnotic effect of its own than it has clinically.',
    simplification: 'The Greco response surface necessarily gives remifentanil a hypnotic effect '
      + 'of its own. At 8 ng/mL with no propofol it predicts a depth index around 76.',
    whereItMisleads: 'Any attempt to explore what the opioid alone does to depth. Clinically, '
      + 'remifentanil alone is a poor hypnotic and barely moves a processed EEG index.',
    correctUnderstanding: 'Opioids blunt the response to stimulation far more than they produce '
      + 'unconsciousness. An opioid-heavy technique with too little hypnotic is a recognised route '
      + 'to awareness, and this surface understates that risk.',
    briefIn: ['awareness-under-paralysis', 'routine-inhalational-maintenance'],
  },
  {
    id: 'geriatric-induction-is-one-bounded-profile',
    headline: 'This is one stable older-adult teaching profile, not a geriatric dose predictor or a model of frailty.',
    simplification: 'The Eleveld population model applies its age covariate to this fictional '
      + '76-year-old patient. The authored arterial stiffness and baroreflex settings create one '
      + 'deterministic teaching trajectory; they are not inferred from clinical measurements.',
    whereItMisleads: 'Choosing a dose for an individual older adult, or predicting the effects of '
      + 'frailty, cognitive impairment, delirium risk, organ dysfunction, polypharmacy, or reduced reserve.',
    correctUnderstanding: 'Older-adult induction is titrated to observed clinical response and '
      + 'context. Age is only one contributor, and this trajectory cannot replace patient assessment.',
    briefIn: ['routine-geriatric-induction'],
  },
  {
    id: 'awareness-risk-is-not-consciousness-or-recall',
    headline: 'The scenario models a drug-delivery pattern associated with awareness risk; it does not model consciousness, distress, memory, or recall.',
    simplification: 'A rising predicted depth index after hypnotic delivery stops marks a '
      + 'pharmacologic warning pattern. There is no consciousness or memory state and the '
      + 'simulator cannot determine whether this patient would experience or later report awareness.',
    whereItMisleads: 'Treating a threshold crossing as proof that awareness occurred, or treating '
      + 'a value below the threshold as proof that it did not.',
    correctUnderstanding: 'Accidental awareness is a clinical outcome assessed from the patient, '
      + 'not inferred with certainty from one modeled concentration or processed index.',
    briefIn: ['awareness-under-paralysis'],
  },
  {
    id: 'depth-index-is-a-drug-model-not-an-eeg',
    headline: 'Predicted depth is computed from drug concentrations here; it is not a processed EEG or a measurement from the patient.',
    simplification: 'The displayed depth index is calculated from the propofol-remifentanil '
      + 'response surface. Electrode signal, electromyographic artifact, and patient-specific EEG '
      + 'response are absent.',
    whereItMisleads: 'Using this number as though it were a real processed-electroencephalogram '
      + 'monitor, especially while judging awareness risk.',
    correctUnderstanding: 'Processed EEG is one imperfect source of information interpreted '
      + 'alongside drug delivery, end-tidal agent where applicable, clinical context, and the patient.',
    briefIn: [
      'awareness-under-paralysis', 'routine-inhalational-maintenance',
      'routine-geriatric-induction', 'routine-pediatric-inhalational-induction',
    ],
  },
  {
    id: 'tiva-line-disconnection-is-a-teaching-model',
    headline: 'The TIVA-line failure is a binary delivery switch: the pump keeps its commanded rate while modeled propofol delivery is either connected or absent.',
    simplification: 'The model separates the commanded pump rate from delivered propofol with a '
      + 'single connected state. It does not model dead space, partial extravasation, backflow, '
      + 'pressure alarms, cannula failure, or drug remaining in the line.',
    whereItMisleads: 'Predicting how quickly a particular real disconnection becomes apparent or '
      + 'how a specific pump, cannula, or line configuration behaves.',
    correctUnderstanding: 'A running pump does not prove intravenous delivery. The visible '
      + 'cannula and line require direct inspection throughout TIVA, especially during transfer '
      + 'and when neuromuscular blockade removes movement as a warning.',
    briefIn: ['awareness-under-paralysis'],
  },
  {
    id: 'peep-not-modelled',
    headline: 'PEEP is recorded but changes nothing: neither oxygenation nor venous return responds to it.',
    simplification: 'Positive end-expiratory pressure can be set and the machine holds it, but '
      + 'its physiological effect is not modelled. It changes neither functional residual '
      + 'capacity, nor shunt fraction, nor venous return.',
    whereItMisleads: 'Any case where recruitment is the point: obesity, laparoscopy, one-lung '
      + 'ventilation, or a desaturation that real positive end-expiratory pressure would fix.',
    correctUnderstanding: 'Positive end-expiratory pressure recruits collapsed alveoli and '
      + 'reduces shunt, and at the same time raises intrathoracic pressure and can drop cardiac '
      + 'output. Here it does neither, so it will not rescue a saturation and will not cost you '
      + 'a blood pressure.',
    briefIn: [],
  },
  {
    id: 'laryngospasm-initial-measures-are-a-teaching-model',
    headline: 'Jaw thrust and continuous positive airway pressure are one fixed 90-second teaching maneuver here, not separate physical skills or a clinical duration.',
    simplification: 'One action represents holding a jaw thrust and continuous positive airway '
      + 'pressure for 90 simulated seconds. This duration bounds the interaction; it is not a '
      + 'clinical recommendation. Relief depends on that hold, active ventilation, delivered '
      + 'oxygen, and modeled anesthetic depth; hand position, mask seal, airway pressure, and '
      + 'partial clinical response are not simulated.',
    whereItMisleads: 'Using successful button timing as evidence that the learner can perform the '
      + 'maneuver, obtain a mask seal, select safe pressure, or recognize every presentation.',
    correctUnderstanding: 'Initial management requires opening the airway, 100% oxygen with '
      + 'continuous positive pressure, avoiding further stimulation, and deepening anesthesia '
      + 'while repeatedly reassessing ventilation and escalation needs.',
    briefIn: ['laryngospasm-after-airway-stimulation'],
  },
  {
    id: 'no-refractory-laryngospasm-pathway',
    headline: 'This case stops at initial measures: there is no suction, separate airway adjunct, succinylcholine, intubation rescue, or refractory pathway.',
    simplification: 'The cockpit can model the initial jaw-thrust/CPAP hold, oxygen delivery, and '
      + 'propofol deepening. It does not offer suction, an oropharyngeal airway, removal of blood '
      + 'or secretions, succinylcholine, or the complete escalation sequence.',
    whereItMisleads: 'Treating initial modeled relief as a complete laryngospasm algorithm, or '
      + 'continuing the same measures while oxygenation deteriorates in a refractory event.',
    correctUnderstanding: 'Persistent closure or falling saturation requires immediate escalation '
      + 'through the applicable clinical algorithm, including removal of the trigger, help, '
      + 'additional airway measures, and neuromuscular blockade when indicated.',
    briefIn: ['laryngospasm-after-airway-stimulation'],
  },
  {
    id: 'no-negative-pressure-pulmonary-edema',
    headline: 'Negative-pressure pulmonary edema, aspiration, and post-obstruction monitoring are not modeled after laryngospasm.',
    simplification: 'The respiratory model ends with restoration of airway patency. It does not '
      + 'create pulmonary edema from inspiratory effort against a closed glottis, aspiration from '
      + 'regurgitation, or a later oxygenation problem after apparent relief.',
    whereItMisleads: 'Assuming that restored capnography and saturation end the clinical problem '
      + 'after a prolonged or severe episode.',
    correctUnderstanding: 'After significant laryngospasm, reassess for aspiration, pulmonary '
      + 'edema, hypoxemia, and the need for continued observation or respiratory support.',
    briefIn: ['laryngospasm-after-airway-stimulation'],
  },
  {
    id: 'anaphylaxis-syndrome-is-a-teaching-model',
    headline: 'The anaphylaxis syndrome is a bounded teaching model of vasodilation, plasma leak, and bronchospasm, not an individualized prediction or diagnosis.',
    simplification: 'A single severity couples systemic vascular resistance loss, plasma-only '
      + 'capillary leak, and lower-airway obstruction. Real presentations vary widely, and the '
      + 'displayed trajectory is not a diagnostic test or patient-specific forecast.',
    whereItMisleads: 'Inferring that one combination, timing, or treatment response establishes '
      + 'anaphylaxis, or that a different presentation excludes it.',
    correctUnderstanding: 'Perioperative anaphylaxis is a clinical diagnosis based on the event '
      + 'context, evolving physiology, response to treatment, and subsequent specialist investigation.',
    briefIn: ['perioperative-anaphylaxis-after-antibiotic'],
  },
  {
    id: 'no-cutaneous-signs-or-tryptase',
    headline: 'Rash, swelling, other cutaneous signs, and serum tryptase sampling or results are not modeled.',
    simplification: 'The patient display shows circulation, ventilation, and oxygenation only. '
      + 'It cannot show skin findings, airway edema, laboratory sampling, or later confirmatory investigation.',
    whereItMisleads: 'Treating the absence of a visible rash on screen as clinical absence, or '
      + 'treating the simulated physiologic pattern as laboratory confirmation.',
    correctUnderstanding: 'Skin signs can be absent or obscured perioperatively. Record timing, '
      + 'obtain appropriate samples, and arrange specialist follow-up under the applicable pathway.',
    briefIn: ['perioperative-anaphylaxis-after-antibiotic'],
  },
  {
    id: 'anaphylaxis-initial-treatment-only',
    headline: 'This case models only initial oxygen, intravenous epinephrine, and crystalloid actions, not the complete or refractory anaphylaxis algorithm.',
    simplification: 'There is no trigger-removal control, call-for-help or team behavior, '
      + 'epinephrine infusion, alternative vasopressor strategy, glucagon, arrest response, '
      + 'critical-care transfer, massive-transfusion protocol, or post-event investigation '
      + 'workflow. Generic packed-red-cell physiology is available but is not part of the '
      + 'bounded anaphylaxis response or its evaluation; other blood products are absent.',
    whereItMisleads: 'Continuing the bounded initial actions when shock is refractory, or assuming '
      + 'a successful modeled response completes clinical management.',
    correctUnderstanding: 'Use the current perioperative algorithm, remove possible triggers, '
      + 'call for help, repeat and escalate epinephrine and fluids as indicated, and complete '
      + 'post-event documentation, sampling, and referral.',
    briefIn: ['perioperative-anaphylaxis-after-antibiotic'],
  },
  {
    id: 'malignant-hyperthermia-is-a-teaching-model',
    headline: 'The hypermetabolic carbon-dioxide, heart-rate, rigidity, and heat trajectories are bounded teaching models, not individualized predictions or a diagnostic test.',
    simplification: 'One latent severity drives excess carbon-dioxide production, tachycardia, '
      + 'displayed generalized rigidity, and delayed heat generation after genuine end-tidal '
      + 'volatile exposure. The ordering is source-grounded; the exact values and timing are an '
      + 'Open Sim Lab calibration.',
    whereItMisleads: 'Reading a threshold or treatment response as proof of malignant '
      + 'hyperthermia, or expecting every susceptible patient to follow this trajectory.',
    correctUnderstanding: 'Malignant hyperthermia is suspected from an evolving clinical pattern '
      + 'and exposure context. Treat promptly while considering alternatives and arrange '
      + 'appropriate post-event investigation.',
    briefIn: ['early-malignant-hyperthermia-during-volatile-anesthesia'],
  },
  {
    id: 'dantrolene-course-is-a-teaching-model',
    headline: 'Dantrolene is an instantaneous 2.5 mg/kg IV teaching action here; vial preparation, product differences, adverse effects, and individualized repeat requirements are not modeled.',
    simplification: 'An accepted action immediately adds a bounded relief effect. The simulator '
      + 'does not model reconstitution time, staff needed to prepare vials, large-bore access, '
      + 'product concentration, cumulative-dose toxicity, weakness, or a patient-specific dose course.',
    whereItMisleads: 'Using button speed as evidence that dantrolene can be prepared and delivered '
      + 'that quickly, or assuming one modeled dose is always sufficient.',
    correctUnderstanding: 'Give 2.5 mg/kg IV dantrolene promptly and repeat as needed until '
      + 'carbon dioxide, rigidity, heart rate, and the wider clinical picture improve, using the '
      + 'current protocol and available formulation.',
    briefIn: ['early-malignant-hyperthermia-during-volatile-anesthesia'],
  },
  {
    id: 'rigidity-is-observable-status-only',
    headline: 'Generalized rigidity is a modeled status value, not a physical examination, masseter assessment, or validated measurement.',
    simplification: 'A fraction from zero to one drives a plain-language rigidity status. There '
      + 'is no muscle force, jaw examination, fasciculation, compartment pressure, or physical skill.',
    whereItMisleads: 'Treating the displayed fraction as a clinical scale or assuming absence on '
      + 'screen excludes a real muscular sign.',
    correctUnderstanding: 'Assess rigidity clinically in context. Masseter spasm and generalized '
      + 'rigidity are important findings, but their presence and timing vary.',
    briefIn: ['early-malignant-hyperthermia-during-volatile-anesthesia'],
  },
  {
    id: 'malignant-hyperthermia-initial-response-only',
    headline: 'This case stops at early recognition and initial response; it is not the complete MHAUS or EMHG malignant-hyperthermia protocol.',
    simplification: 'The cockpit can stop volatile delivery, raise fresh-gas flow, hyperventilate '
      + 'with oxygen, give dantrolene, and start or stop bounded cooling. It does not model '
      + 'succinylcholine or masseter spasm, charcoal filters or circuit replacement, blood gases, '
      + 'acidosis, potassium, dysrhythmia treatment, rhabdomyolysis, urine output, coagulation, '
      + 'team actions, hotline use, intensive care, recurrence, or confirmatory referral.',
    whereItMisleads: 'Treating improvement in the initial modeled signs as completion of acute '
      + 'management or readiness to end monitoring.',
    correctUnderstanding: 'Follow the complete current protocol, including help, trigger removal, '
      + 'dantrolene repetition, temperature-guided cooling, laboratory-guided complication '
      + 'management, monitoring, transfer, and post-event investigation.',
    briefIn: ['early-malignant-hyperthermia-during-volatile-anesthesia'],
  },
  {
    id: 'no-regional-anaesthesia',
    headline: 'Regional anaesthesia is not modelled at all — no block, no spread, no failure.',
    simplification: 'Regional anaesthesia and block spread are not modelled at all.',
    whereItMisleads: 'Any case where a block would change the opioid requirement, the haemodynamics, '
      + 'or the recovery. The LAST case scripts a toxicity exposure; it does not simulate a block or derive toxicity from an injected dose.',
    correctUnderstanding: 'A working block changes the whole anaesthetic plan. Nothing you learn '
      + 'here about opioid dosing transfers to a patient with a block in place.',
    briefIn: ['local-anesthetic-systemic-toxicity'],
  },
  {
    id: 'last-syndrome-is-a-teaching-model',
    headline: 'The local-anesthetic toxicity trajectory is a deterministic teaching model, not a dose-to-concentration or diagnostic model.',
    simplification: 'A scripted bupivacaine exposure starts bounded seizure status, bradycardia, '
      + 'and myocardial depression. The engine does not calculate exposure from injection dose, site, uptake, or plasma concentration.',
    whereItMisleads: 'Predicting whether, when, or how an individual patient will develop LAST, '
      + 'or treating this sequence as required for the diagnosis.',
    correctUnderstanding: 'LAST can present variably. Diagnose and treat from the clinical context '
      + 'and current guidance; this case rehearses one observable pattern and initial response.',
    briefIn: ['local-anesthetic-systemic-toxicity'],
  },
  {
    id: 'last-initial-response-only',
    headline: 'This case implements the bounded initial ASRA 2020 LAST response, not refractory resuscitation or follow-up.',
    simplification: 'The cockpit supports oxygen and ventilation, an agent-class benzodiazepine '
      + 'action without dose pharmacology, reduced-dose epinephrine, and the initial weight-banded '
      + '20% lipid bolus and infusion. Repeat bolus, doubled infusion, dysrhythmia treatment, '
      + 'compressions, defibrillation, cardiopulmonary bypass, team actions, transport, and observation are absent.',
    whereItMisleads: 'Treating modeled improvement as completion of the checklist, proof of diagnosis, '
      + 'or a guarantee of recovery.',
    correctUnderstanding: 'Use the complete current ASRA checklist, obtain help, reassess continuously, '
      + 'escalate refractory instability, and continue post-event care outside this bounded simulation.',
    briefIn: ['local-anesthetic-systemic-toxicity'],
  },
  {
    id: 'cardiac-arrest-response-is-bounded',
    headline: 'The arrest case is one deterministic third-cycle VF teaching path, not a complete resuscitation model.',
    simplification: 'A scripted rhythm event creates pulseless VF after two prior shocks. Accepted '
      + 'compressions, 1 mg IV/IO epinephrine, and the declared 200 J biphasic setting permit '
      + 'deterministic conversion. Reversible causes, recurrent or refractory arrest, antiarrhythmics, '
      + 'device-specific waveforms, and individualized survival are not modeled.',
    whereItMisleads: 'Treating screen conversion as a prediction of real defibrillation success or '
      + 'using 200 J without following the actual defibrillator manufacturer recommendation.',
    correctUnderstanding: 'Follow the current resuscitation algorithm and the actual defibrillator. '
      + 'Shockable rhythm, CPR quality, minimized pauses, reversible causes, and repeated reassessment '
      + 'matter; a deterministic screen outcome does not predict survival.',
    briefIn: ['persistent-vf-cardiac-arrest'],
  },
  {
    id: 'cardiac-arrest-actions-are-screen-proxies',
    headline: 'Buttons record resuscitation intent; they cannot teach compression quality, pad safety, access, or team performance.',
    simplification: 'Starting compressions creates a fixed 110/min low-flow proxy. The simulator does '
      + 'not measure depth, recoil, fraction, pauses, fatigue, ventilation coordination, pad contact, '
      + 'shock clearance, or physical drug administration.',
    whereItMisleads: 'Equating successful button use with competent cardiopulmonary resuscitation or safe defibrillation.',
    correctUnderstanding: 'CPR, defibrillation, and crisis teamwork are psychomotor and team skills. '
      + 'Use hands-on training with feedback and supervised resuscitation education.',
    briefIn: ['persistent-vf-cardiac-arrest'],
  },
  {
    id: 'no-post-cardiac-arrest-care',
    headline: 'The case stops at initial modeled ROSC and does not implement post-cardiac-arrest care.',
    simplification: 'After rhythm conversion the case records initial ROSC only. It does not model '
      + 'hemodynamic stabilization, oxygen and ventilation targets, electrocardiography, coronary '
      + 'intervention, temperature control, seizure management, prognosis, intensive care, or recurrence.',
    whereItMisleads: 'Treating rhythm conversion as completion of care or as a guarantee of neurologic recovery.',
    correctUnderstanding: 'ROSC begins a time-critical post-arrest pathway. Continue with the current '
      + 'post-cardiac-arrest algorithm and individualized critical care.',
    briefIn: ['persistent-vf-cardiac-arrest'],
  },
  {
    id: 'paedfusor-pk-does-not-validate-pediatric-depth',
    headline: 'Paedfusor supplies pediatric propofol kinetics, but the predicted depth response remains an Open Sim Lab teaching calibration.',
    simplification: 'The age-1-to-12 Paedfusor compartments and effect-site equilibration drive '
      + 'concentration. The source does not provide the pediatric depth-index pharmacodynamics '
      + 'this simulator displays, so the existing concentration-to-depth response is not labeled published.',
    whereItMisleads: 'Treating a displayed depth number, loss-of-consciousness threshold, or dose '
      + 'response as validated for a real child.',
    correctUnderstanding: 'Paedfusor predicts population-average propofol concentration from dose '
      + 'and time. Pediatric clinical effect must be assessed directly and dosing titrated to response.',
    briefIn: ['routine-pediatric-iv-induction'],
  },
  {
    id: 'pediatric-respiratory-profile-is-a-teaching-model',
    headline: 'The 6-year-old respiratory profile combines published size equations into one deterministic teaching patient.',
    simplification: 'Functional residual capacity, oxygen consumption, carbon-dioxide production, '
      + 'and dead space scale from age and weight. Functional residual capacity uses the published '
      + 'Thorsteinsson nonlinear weight regression from healthy anesthetized children aged 0.1–11.2 years. '
      + 'Carbon-dioxide storage retains an adult teaching calibration scaled by weight.',
    whereItMisleads: 'Predicting an individual child\'s safe apnea time or assuming children of '
      + 'different ages, illness, body composition, airway anatomy, or anesthetic state share this trajectory.',
    correctUnderstanding: 'Children generally have less oxygen reserve relative to metabolic '
      + 'demand than adults, but the margin varies substantially. Use observed oxygenation, '
      + 'ventilation, and age-appropriate clinical guidance rather than this trace as a timer.',
    briefIn: ['routine-pediatric-iv-induction', 'routine-pediatric-inhalational-induction'],
  },
  {
    id: 'pediatric-hemodynamic-maturation-is-not-modeled',
    headline: 'The child starts at pediatric vital signs, but the cardiovascular response equations are not developmentally matured.',
    simplification: 'The scenario supplies a child-sized baseline blood volume, stroke volume, '
      + 'heart rate, and pressure. Baroreflex, anesthetic vasodilation, myocardial depression, '
      + 'and hypoxic failure otherwise use the same teaching equations as adults.',
    whereItMisleads: 'Using the pressure or heart-rate trajectory to select a pediatric dose, '
      + 'intervention threshold, or prediction of cardiovascular reserve.',
    correctUnderstanding: 'Pediatric cardiovascular physiology and anesthetic responses vary '
      + 'with developmental stage. This case teaches monitoring and sequence, not a validated hemodynamic trajectory.',
    briefIn: ['routine-pediatric-iv-induction', 'routine-pediatric-inhalational-induction'],
  },
  {
    id: 'pediatric-airway-equipment-sizing-is-not-modeled',
    headline: 'Pediatric airway anatomy, device size, cuff pressure, and placement depth are not modeled.',
    simplification: 'The same generic mask-ventilation and laryngoscopy controls used for adults '
      + 'remain available. There is no device inventory, pediatric sizing calculation, pressure, '
      + 'depth mark, leak, or age-specific airway success model.',
    whereItMisleads: 'Treating a successful screen action as practice choosing or placing a real pediatric airway device.',
    correctUnderstanding: 'Select, place, and confirm pediatric airway equipment using the child\'s '
      + 'anatomy, weight, current guidance, and direct clinical evidence.',
    briefIn: ['routine-pediatric-iv-induction', 'routine-pediatric-inhalational-induction'],
  },
  {
    id: 'pediatric-case-is-one-bounded-profile',
    headline: 'This is one healthy 6-year-old weighing 20 kg, not a model of infancy, adolescence, obesity, or pediatric disease.',
    simplification: 'One age, weight, height, healthy respiratory profile, and ASA I baseline are '
      + 'deliberately bundled so every stated assumption can be inspected.',
    whereItMisleads: 'Generalizing the case to a neonate, infant, adolescent, child with obesity, '
      + 'or child with cardiac, respiratory, metabolic, or developmental disease.',
    correctUnderstanding: 'Pediatric anesthesia spans changing physiology and pharmacology. '
      + 'Reassess model choice and every setting when the child differs from this bounded profile.',
    briefIn: ['routine-pediatric-iv-induction', 'routine-pediatric-inhalational-induction'],
  },
  {
    id: 'pediatric-emergence-is-not-modeled',
    headline: 'The pediatric case ends after induction and stable ventilation; emergence and recovery are absent.',
    simplification: 'There is no maintenance plan, wake-up trajectory, extubation, emergence '
      + 'delirium, postoperative nausea, pain, airway obstruction, or recovery discharge assessment.',
    whereItMisleads: 'Treating a stable induction as completion of an anesthetic or evidence of safe recovery.',
    correctUnderstanding: 'Maintenance, emergence, airway removal, and recovery each require a '
      + 'separate pediatric plan and continued observation.',
    briefIn: ['routine-pediatric-iv-induction', 'routine-pediatric-inhalational-induction'],
  },
  {
    id: 'pediatric-inhalational-induction-behavior-is-not-modeled',
    headline: 'The inhalational-induction screen models agent wash-in, not the child, the mask, consciousness, airway reflexes, or respiratory depression.',
    simplification: 'The vaporizer drives a first-order end-tidal teaching signal and bounded depth '
      + 'and circulatory responses. Cooperation, distress, parental presence, mask seal, leak, '
      + 'breath-by-breath technique, excitement, breath-holding, coughing, obstruction, '
      + 'laryngospasm, apnea, and volatile respiratory depression are absent.',
    whereItMisleads: 'Treating a smooth trace as a smooth real induction, or using a displayed '
      + 'depth or MAC threshold as proof of unconsciousness, immobility, airway readiness, or safety.',
    correctUnderstanding: 'A pediatric inhalational induction requires direct observation of the '
      + 'child, ventilation, airway patency, mask delivery, physiology, and the full clinical context. '
      + 'Machine and end-tidal signals support that assessment but cannot replace it.',
    briefIn: ['routine-pediatric-inhalational-induction'],
  },
  {
    id: 'prbc-fixed-unit-model',
    headline: 'Packed red cells are an instantaneous fixed-unit teaching model, not a transfusion workflow.',
    simplification: 'An adult action adds exactly 300 mL and 60 g hemoglobin per unit on the next '
      + '100 ms tick, with a two-unit cumulative cap. Product variation, delivery time, storage, '
      + 'warming, compatibility, crossmatch, reactions, calcium, and electrolytes are absent. '
      + 'The control is stocked only while modeled hemorrhage is active. The hemorrhage scenarios model '
      + 'fixed-unit plasma separately; packed red cells themselves do not restore clotting factors.',
    whereItMisleads: 'Choosing, preparing, checking, timing, monitoring, or responding to a real transfusion.',
    correctUnderstanding: 'Real packed-red-cell components vary, require compatibility and bedside '
      + 'checks, are administered over time, and can cause serious reactions including TACO and TRALI.',
    briefIn: ['unexpected-intraoperative-hemorrhage', 'dilutional-coagulopathy', 'blood-bank-handoff'],
  },
  {
    id: 'bounded-dilutional-coagulopathy',
    headline: 'Coagulation is a dilution-only teaching model, not a bleeding or massive-transfusion prediction.',
    simplification: 'Normal factor and fibrinogen mass are removed proportionally with blood and plasma leak, diluted by retained crystalloid and red-cell volume, and restored toward baseline by fixed 275 mL plasma units. PT ratio is the inverse normalized factor concentration; scenarios default to normal factor concentration and 3 g/L fibrinogen but may declare a bounded starting dilution state. Results and plasma effects are instantaneous.',
    whereItMisleads: 'Consumptive coagulopathy, hyperfibrinolysis, obstetric or trauma-specific targets, anticoagulants, liver disease, hypothermia, acidosis, viscoelastic testing, and protocolized massive transfusion.',
    correctUnderstanding: 'Real major hemorrhage requires source control, repeated laboratory or viscoelastic assessment, local protocol activation, and targeted blood-component support. Plasma dosing and response vary and can cause serious harm.',
    briefIn: ['unexpected-intraoperative-hemorrhage', 'dilutional-coagulopathy'],
  },
  {
    id: 'plasma-panel-is-instantaneous',
    headline: 'The coagulation panel and plasma response are instantaneous teaching events.',
    simplification: 'PT ratio and fibrinogen are available immediately, and an accepted whole-unit plasma action changes both on the next 100 ms tick. Sampling, transport, processing, issue, infusion time, and biologic response delay are absent.',
    whereItMisleads: 'Predicting when a real result or component will be available, how quickly it can be administered, or the response of an individual patient.',
    correctUnderstanding: 'Real hemorrhage care uses local protocols, repeated clinical assessment, laboratory or viscoelastic testing, product checks, controlled administration, and monitoring for effect and harm.',
    briefIn: ['dilutional-coagulopathy'],
  },
  {
    id: 'blood-bank-handoff-is-instantaneous',
    headline: 'The blood-bank request is an instantaneous teaching handoff, not a compatibility workflow.',
    simplification: 'One confirmed request immediately releases the bounded adult products while active hemorrhage continues. There is no specimen, patient or unit ABO/RhD type, antibody screen, crossmatch, inventory, delay, emergency-release authorization, bedside check, or issue record.',
    whereItMisleads: 'Choosing a component, estimating availability, bypassing testing, documenting emergency release, or checking a real unit and recipient.',
    correctUnderstanding: 'Real transfusion services identify the recipient, test and select compatible components under local procedures, document any emergency release, and complete bedside identification checks. Urgency changes the authorized workflow; it does not make compatibility irrelevant.',
    briefIn: ['unexpected-intraoperative-hemorrhage', 'dilutional-coagulopathy', 'blood-bank-handoff'],
  },
  {
    id: 'no-coagulopathy',
    headline: 'Coagulation is not modelled, so bleeding never becomes a clotting problem.',
    simplification: 'Coagulation is not modelled. Blood loss removes volume and haemoglobin, and '
      + 'bounded packed red cells restore only volume and hemoglobin mass.',
    whereItMisleads: 'Massive transfusion, where dilutional and consumptive coagulopathy drives '
      + 'management as much as volume does.',
    correctUnderstanding: 'In real major haemorrhage the clotting is often the problem, and '
      + 'replacing volume without addressing it makes the bleeding worse.',
    briefIn: [],
  },
  {
    id: 'acid-base-approximate',
    headline: 'Acid-base is approximated: there is no metabolic compensation and no lactate.',
    simplification: 'Acid-base compensation is approximated by the carbon dioxide model alone. '
      + 'There is no metabolic component, no base excess, and no renal compensation.',
    whereItMisleads: 'Prolonged cases, sepsis, diabetic emergencies, and any situation where a '
      + 'metabolic acidosis would be driving the respiratory pattern.',
    correctUnderstanding: 'Arterial carbon dioxide is one axis of acid-base status. A normal '
      + 'end-tidal value does not mean a normal pH.',
    briefIn: [],
  },
  {
    id: 'fresh-gas-flow-is-a-teaching-model',
    headline: 'Fresh gas flow scales a calibrated volatile wash-in and washout time constant; there is no breathing-circuit, uptake, rebreathing, or agent-consumption model.',
    simplification: 'The original 2.5-minute volatile time constant is divided by bounded fresh '
      + 'gas flow. This gives the correct direction and a usable crisis response but does not '
      + 'represent circuit volume, patient uptake, agent solubility, rebreathing, or consumption.',
    whereItMisleads: 'Predicting a real end-tidal concentration, washout time, or agent use from a '
      + 'specific fresh-gas flow, especially during low-flow anesthesia or workstation flushing.',
    correctUnderstanding: 'Fresh-gas flow, circuit volume, uptake, solubility, and ventilation all '
      + 'shape volatile wash-in and washout. Here flow changes one teaching-model time constant only.',
    briefIn: [
      'routine-induction', 'early-malignant-hyperthermia-during-volatile-anesthesia',
      'routine-inhalational-maintenance', 'routine-pediatric-inhalational-induction',
    ],
  },
  {
    id: 'no-neuromuscular-blockade',
    headline: 'This scenario has no blocking agent, so it cannot teach neuromuscular blockade.',
    simplification: 'The routine-induction scenario omits neuromuscular blockade from its '
      + 'formulary. It therefore cannot demonstrate onset, recovery, or reversal.',
    whereItMisleads: 'Treating the routine case as a complete model of clinical induction, where '
      + 'a blocking agent would commonly be part of the airway plan.',
    correctUnderstanding: 'Extubating below a train-of-four ratio of 0.9 is residual blockade, and '
      + 'a qualitative twitch assessment cannot exclude it. Use the rapid-sequence case to '
      + 'explore modeled rocuronium onset and spontaneous recovery.',
    briefIn: ['routine-induction'],
  },
  {
    id: 'rocuronium-course-is-a-teaching-model',
    headline: 'Rocuronium onset and recovery are an Open Sim Lab teaching model, not an individual prediction.',
    simplification: 'The rocuronium course is calibrated to published onset and duration ranges '
      + 'rather than transcribed as a validated population pharmacokinetic model.',
    whereItMisleads: 'Reading the time to a train-of-four count of zero, or the recovery time, as '
      + 'a prediction for a real patient.',
    correctUnderstanding: 'Rocuronium onset and duration vary with dose, circulation, age, and '
      + 'patient factors. Quantitative monitoring, not elapsed time alone, measures recovery.',
    briefIn: ['rapid-sequence-induction', 'quantitative-neuromuscular-reversal', 'obstetric-general-anesthesia'],
  },
  {
    id: 'tof-monitor-is-an-idealized-teaching-signal',
    headline: 'The train-of-four display is an idealized model signal, not a peripheral-nerve-stimulation procedure or a commercial monitor.',
    simplification: 'Count, ratio, and post-tetanic count are derived directly from modeled '
      + 'rocuronium effect. Electrode placement, stimulation site, calibration, signal quality, '
      + 'movement artifact, device algorithms, and physical technique are absent.',
    whereItMisleads: 'Treating a clean screen number as proof that a real monitor is configured '
      + 'correctly, or treating this browser as practice in nerve-stimulator placement and use.',
    correctUnderstanding: 'Quantitative monitoring requires correct site, setup, calibration, '
      + 'signal assessment, and interpretation in the full clinical context.',
    briefIn: ['quantitative-neuromuscular-reversal'],
  },
  {
    id: 'peripheral-tof-does-not-prove-laryngeal-conditions',
    headline: 'A peripheral train-of-four measurement does not guarantee conditions at the larynx.',
    simplification: 'The scenario uses a peripheral train-of-four endpoint as an observable proxy '
      + 'for allowing block to develop; it does not model different onset at different muscles.',
    whereItMisleads: 'Treating a count of zero at the hand as proof of intubating conditions.',
    correctUnderstanding: 'Neuromuscular block develops and recovers differently across muscle '
      + 'groups. Peripheral monitoring informs timing but does not inspect the larynx.',
    briefIn: ['rapid-sequence-induction', 'obstetric-general-anesthesia'],
  },
  {
    id: 'neuromuscular-reversal-is-bounded-without-emergence',
    headline: 'Reversal is a bounded quantitative teaching effect; emergence, extubation, and recovery-room outcomes are not simulated.',
    simplification: 'Sugammadex follows the specified 2/4 mg/kg depth branches. Neostigmine with '
      + 'an antimuscarinic is accepted only during minimal block. The post-tetanic count is an '
      + 'auto-derived teaching proxy; stimulation technique is not modeled. There is no dose '
      + 'pharmacology, antimuscarinic identity or adverse-effect model, emergence, airway removal, '
      + 'recurrent block, hypersensitivity, or postoperative weakness.',
    whereItMisleads: 'Predicting an individual recovery time or treating a screen ratio as proof '
      + 'that a real patient is otherwise ready for extubation.',
    correctUnderstanding: 'Current guidance calls for quantitative recovery to a train-of-four '
      + 'ratio of at least 0.9 before extubation and chooses reversal according to block depth.',
    briefIn: ['rapid-sequence-induction', 'quantitative-neuromuscular-reversal'],
  },
  {
    id: 'no-aspiration-or-regurgitation',
    headline: 'A full stomach changes the teaching plan here, but regurgitation and aspiration are not modeled.',
    simplification: 'The patient is described as having a full stomach, but no gastric-volume, '
      + 'regurgitation, aspiration, or aspiration-pneumonitis physiology exists in the engine.',
    whereItMisleads: 'Interpreting an uneventful run as evidence that a particular technique '
      + 'prevented aspiration.',
    correctUnderstanding: 'Aspiration risk is the reason the airway plan changes. This simulator '
      + 'can exercise preparation and timing, not estimate that risk or reproduce the event.',
    briefIn: ['rapid-sequence-induction', 'obstetric-general-anesthesia'],
  },
  {
    id: 'interaction-coefficient-calibrated',
    headline: 'The hypnotic-opioid interaction coefficient is an Open Sim Lab calibration, not a transcribed published value.',
    simplification: 'The propofol–remifentanil interaction uses a published response-surface FORM '
      + 'with a coefficient calibrated by Open Sim Lab rather than transcribed from a paper.',
    whereItMisleads: 'Any quantitative conclusion about exactly how much propofol a given '
      + 'remifentanil concentration spares.',
    correctUnderstanding: 'The direction and the rough magnitude of the synergy are right. The '
      + 'exact numbers are ours, not the literature\'s, and are marked as a teaching model.',
    briefIn: ['routine-induction'],
  },
  {
    id: 'difficult-airway-failure-and-mask-ventilation-are-teaching-bounds',
    headline: 'The difficult-airway cases script failed tracheal attempts and an authored facemask delivery fraction so each rescue decision is reproducible.',
    simplification: 'Every tracheal attempt in these cases is configured to fail while retaining the '
      + 'sampled view, duration, and trauma. After the first attempt begins, assisted facemask tidal '
      + 'volume is fixed at the scenario\'s declared fraction until a supraglottic airway is placed. Preoxygenation '
      + 'before the unanticipated difficulty remains unaffected. There is no changing mask seal, airway '
      + 'pressure, two-person technique, oral airway, or operator-dependent improvement.',
    whereItMisleads: 'Reading the sampled view or fixed marginal facemask response as an individual '
      + 'prediction, or treating unchanged screen controls as evidence that a real mask technique cannot improve.',
    correctUnderstanding: 'Difficult-airway rescue is dynamic. Repositioning, adjuncts, two-person '
      + 'technique, neuromuscular block, device choice, and operator skill can all change oxygenation.',
    briefIn: ['difficult-airway-supraglottic-rescue', 'repeated-laryngoscopy-harm'],
  },
  {
    id: 'repeated-laryngoscopy-trauma-is-a-teaching-model',
    headline: 'Each accepted laryngoscopy adds a bounded airway-trauma value that worsens later view probabilities; swelling, bleeding, and physical injury are not modeled.',
    simplification: 'The shared airway model adds a fixed grade-dependent trauma value when an '
      + 'attempt begins. That value shifts later sampled views toward worse grades, while the attempt '
      + 'also consumes simulated time without ventilation. It does not create edema, bleeding, tissue '
      + 'injury, airway obstruction, aspiration, or patient-specific anatomy changes.',
    whereItMisleads: 'Reading a later view, attempt duration, saturation, or rescue success as a '
      + 'prediction of the effect of another attempt in a real patient.',
    correctUnderstanding: 'Repeated airway instrumentation can cause trauma, make subsequent '
      + 'management harder, and spend oxygen reserve. Limit attempts, change the plan, call for help, '
      + 'and keep oxygenation central under the applicable difficult-airway guidance.',
    briefIn: ['repeated-laryngoscopy-harm'],
  },
  {
    id: 'supraglottic-airway-placement-is-an-abstraction',
    headline: 'Supraglottic placement is a fixed 15-second successful teaching action, not a physical skill or patient-specific success model.',
    simplification: 'The action interrupts assisted ventilation for 15 simulated seconds and then '
      + 'provides a full modeled route for delivered breaths. It has no device size, generation, '
      + 'cuff pressure, leak, malposition, gastric drainage, insertion trauma, or repeated-attempt model.',
    whereItMisleads: 'Treating a successful button action as evidence of device selection, insertion '
      + 'skill, seal quality, aspiration protection, or likely success in a real difficult airway.',
    correctUnderstanding: 'A supraglottic airway can restore oxygenation after failed intubation, '
      + 'but placement and ventilation must be assessed clinically and attempts must remain limited.',
    briefIn: ['difficult-airway-supraglottic-rescue', 'repeated-laryngoscopy-harm'],
  },
  {
    id: 'airway-help-request-does-not-model-a-team',
    headline: 'The help control records escalation timing; no additional clinician arrives or performs an airway action.',
    simplification: 'One accepted action records that airway help was requested. The simulator has '
      + 'no roles, arrival delay, shared mental model, closed-loop communication, equipment handoff, '
      + 'or change in success probability from a more experienced operator.',
    whereItMisleads: 'Treating a logged request as evidence of effective communication, team response, '
      + 'or crisis-resource-management performance.',
    correctUnderstanding: 'Call for skilled help early, state the airway problem clearly, assign '
      + 'tasks, and use closed-loop communication while oxygenation remains the priority.',
    briefIn: ['difficult-airway-supraglottic-rescue', 'repeated-laryngoscopy-harm'],
  },
  {
    id: 'no-cico-or-front-of-neck-airway',
    headline: 'This is a can-oxygenate rescue case; it does not model failed supraglottic ventilation or emergency front-of-neck access.',
    simplification: 'The configured supraglottic airway succeeds. The scenario cannot progress to '
      + 'cannot-intubate-cannot-oxygenate physiology, cricothyrotomy, surgical airway equipment, or '
      + 'the immediate role and task sequence required for that emergency.',
    whereItMisleads: 'Continuing supraglottic attempts while oxygenation fails, or believing this '
      + 'case rehearses the final rescue pathway.',
    correctUnderstanding: 'Failure to oxygenate through facemask and supraglottic routes requires '
      + 'immediate progression through the applicable emergency front-of-neck-airway algorithm.',
    briefIn: ['difficult-airway-supraglottic-rescue', 'repeated-laryngoscopy-harm'],
  },
  {
    id: 'no-post-supraglottic-airway-plan',
    headline: 'The case ends after rescue oxygenation and does not choose whether to wake, intubate through the device, proceed, or use another airway plan.',
    simplification: 'Once sustained gas exchange returns, there is no emergence, wake-up action, '
      + 'fiberoptic or video-guided intubation through the device, exchange technique, tracheostomy, '
      + 'aspiration consequence, or decision to proceed with surgery.',
    whereItMisleads: 'Treating restored capnography as the end of difficult-airway management or as '
      + 'permission to proceed with the planned operation.',
    correctUnderstanding: 'Once oxygenation is restored, stop, reassess urgency and aspiration risk, '
      + 'and make an explicit next plan with the team using the applicable guideline.',
    briefIn: ['difficult-airway-supraglottic-rescue', 'repeated-laryngoscopy-harm'],
  },
  {
    id: 'term-pregnancy-respiratory-profile-is-calibrated',
    headline: 'Term pregnancy uses one calibrated oxygen-reserve profile, not individualized maternal physiology.',
    simplification: 'One fixed profile reduces functional residual capacity and increases oxygen '
      + 'consumption so apnea is less forgiving than in the healthy-adult profile. It does not vary '
      + 'with gestation, position, body habitus, labor, disease, fetal state, or an individual airway.',
    whereItMisleads: 'Using the displayed time to desaturation as a prediction for a pregnant patient, '
      + 'or assuming the model contains the full respiratory and cardiovascular physiology of pregnancy.',
    correctUnderstanding: 'Pregnancy reduces oxygen reserve and increases oxygen demand, but the '
      + 'margin varies. Use direct monitoring, preparation, and the applicable obstetric airway plan.',
    briefIn: ['obstetric-general-anesthesia'],
  },
  {
    id: 'obstetric-general-anesthesia-stops-before-delivery',
    headline: 'The obstetric general-anesthesia lesson stops after maternal gas exchange returns.',
    simplification: 'There is no fetal monitor, uterine displacement, surgical incision, delivery, '
      + 'cord clamping, volatile maintenance, uterine tone, hemorrhage, neonatal transition, drug '
      + 'transfer, maternal awareness, emergence, extubation, or postoperative care.',
    whereItMisleads: 'Treating a completed induction sequence as rehearsal of cesarean anesthesia '
      + 'or as evidence about fetal, neonatal, hemorrhage, awareness, or recovery outcomes.',
    correctUnderstanding: 'Obstetric general anesthesia is a multidisciplinary course extending '
      + 'well beyond induction. This screen rehearses only preparation through initial ventilation.',
    briefIn: ['obstetric-general-anesthesia'],
  },
  {
    id: 'preeclampsia-response-is-a-bounded-teaching-trajectory',
    headline: 'The preeclampsia response is one bounded monitor trajectory, not individualized diagnosis or pharmacology.',
    simplification: 'The case declares persistent severe-range hypertension, accepts one repeat '
      + 'pressure, one 20 mg IV labetalol branch, and one 4 g IV magnesium-sulfate branch. Labetalol '
      + 'reduces pressure and heart rate on a fixed teaching trajectory. Magnesium records seizure '
      + 'prophylaxis without changing pressure. There is no measurement error, infusion duration, '
      + 'maintenance regimen, pharmacokinetics, renal adjustment, serum level, reflex examination, '
      + 'toxicity, seizure, pulmonary edema, laboratory testing, or alternative-agent escalation.',
    whereItMisleads: 'Predicting an individual response, using the screen to diagnose preeclampsia, '
      + 'or treating the listed branch as a complete severe-hypertension or magnesium protocol.',
    correctUnderstanding: 'Persistent severe hypertension in pregnancy is an emergency requiring '
      + 'prompt protocolized treatment and reassessment. Magnesium is used for seizure prophylaxis, '
      + 'not as the antihypertensive. Use direct measurements and the current local obstetric protocol.',
    briefIn: ['preeclampsia-urgent-delivery'],
  },
  {
    id: 'preeclampsia-lesson-stops-before-anesthesia-and-delivery',
    headline: 'The preeclampsia lesson stops after initial maternal reassessment.',
    simplification: 'The urgent-delivery decision is already made. There is no diagnostic workup, '
      + 'platelet count, liver or renal testing, proteinuria assessment, fetal monitoring, fluid '
      + 'strategy, delivery timing or route, uterine displacement, anesthetic choice, neuraxial '
      + 'procedure, general anesthesia, surgery, postpartum course, or team workflow.',
    whereItMisleads: 'Treating completion as rehearsal of preeclampsia diagnosis, anesthetic '
      + 'planning, cesarean delivery, or postpartum management.',
    correctUnderstanding: 'Urgent delivery in preeclampsia requires multidisciplinary assessment '
      + 'and a complete maternal and fetal plan. This screen rehearses only confirmation, one '
      + 'initial medication branch, and pressure reassessment.',
    briefIn: ['preeclampsia-urgent-delivery'],
  },
  {
    id: 'high-spinal-injector-is-a-teaching-trajectory',
    headline: 'The modeled high-spinal pattern is a calibrated trajectory, not a block-height or obstetric model.',
    simplification: 'A manual injection or authored event ramps one bounded drive that lowers heart rate, vascular '
      + 'tone, cardiac output, pressure, and unassisted breathing. It does not calculate neuraxial '
      + 'dose, spread, sensory or motor level, pregnancy physiology, aortocaval compression, or '
      + 'patient-specific onset. Ephedrine changes bounded vascular tone without modeling its full '
      + 'pharmacology, anticholinergics, or an individualized response.',
    whereItMisleads: 'Predicting the extent, speed, presentation, or outcome of a real high central '
      + 'neuraxial block from the displayed values.',
    correctUnderstanding: 'High central neuraxial block can progress rapidly to hypotension, '
      + 'bradycardia, breathing difficulty, apnea, and unconsciousness; assess the patient and '
      + 'support airway, breathing, and circulation using the applicable emergency guidance.',
    briefIn: ['high-spinal-after-epidural-top-up'],
  },
  {
    id: 'venous-air-embolism-injector-is-a-teaching-trajectory',
    headline: 'The modeled venous-air-embolism pattern is a calibrated monitor trajectory, not a gas-volume or diagnostic model.',
    simplification: 'A manual injection or authored event rapidly lowers modeled pulmonary-flow observables, '
      + 'end-tidal carbon dioxide, pressure, cardiac output, and oxygen saturation. It does not '
      + 'represent gas volume, embolus location, cerebral or paradoxical embolism, neurologic '
      + 'injury, imaging, aspiration, hyperbaric therapy, or physical source-control technique. '
      + 'Accepted source-control intent stops new entry and clears the residual pattern on a fixed '
      + '60-second teaching time constant.',
    whereItMisleads: 'Using the displayed change to diagnose an air embolism, estimate its size or '
      + 'location, or predict a particular patient outcome.',
    correctUnderstanding: 'A sudden end-tidal carbon-dioxide decrease and cardiopulmonary compromise '
      + 'during a compatible procedure require immediate clinical assessment and management; the '
      + 'monitor pattern is not specific to one diagnosis.',
    briefIn: ['venous-air-embolism-during-line-removal'],
  },
  {
    id: 'pneumothorax-response-is-a-teaching-trajectory',
    headline: 'The pleural crisis is one bounded monitor trajectory, not a gas-volume or diagnostic model.',
    simplification: 'One authored drive lowers modeled cardiac output, pressure, end-tidal carbon '
      + 'dioxide, and saturation, then clears on fixed teaching time constants after accepted '
      + 'decompression intent. It does not calculate pleural gas volume, pressure, lung injury, '
      + 'barotrauma, or an individual clinical course.',
    whereItMisleads: 'Using the displayed values to diagnose pneumothorax, estimate severity, or '
      + 'predict a real patient’s deterioration or recovery.',
    correctUnderstanding: 'A combined breathing and circulation deterioration during positive-pressure '
      + 'ventilation requires immediate systematic assessment and cause-directed management.',
    briefIn: ['pneumothorax-under-positive-pressure'],
  },
  {
    id: 'no-airway-pressure-or-compliance-model',
    headline: 'The pressure alarm is declared; airway pressure and lung compliance are not numerical engine states.',
    simplification: 'The timeline declares a rising airway-pressure alarm while the engine models '
      + 'the associated oxygenation and circulation trajectory. It cannot reproduce a pressure '
      + 'waveform, delivered-volume change, manual bag feel, resistance, or compliance.',
    whereItMisleads: 'Reading the screen as a ventilator mechanics model or using it to distinguish '
      + 'pneumothorax from tube, circuit, bronchospasm, gas-trapping, or surgical causes.',
    correctUnderstanding: 'Increased airway pressure requires direct patient, airway, breathing-system, '
      + 'and ventilator assessment using the real equipment and clinical context.',
    briefIn: ['pneumothorax-under-positive-pressure'],
  },
  {
    id: 'no-procedure-or-equipment-selection',
    headline: 'Decompression is an intent control, not a procedural trainer.',
    simplification: 'One confirmed action records immediate left-chest decompression intent. There '
      + 'is no site choice, imaging, needle, thoracostomy, drain, equipment, anatomy, sterility, '
      + 'technical success, complication, or local protocol.',
    whereItMisleads: 'Treating a successful browser action as evidence of procedural knowledge or skill.',
    correctUnderstanding: 'Chest decompression requires current local guidance, appropriate expertise, '
      + 'equipment, and supervised hands-on procedural training.',
    briefIn: ['pneumothorax-under-positive-pressure'],
  },
  {
    id: 'aspiration-risk-choice-is-a-bounded-vignette',
    headline: 'The aspiration-risk lesson records one vignette decision, not an individualized risk estimate.',
    simplification: 'One fictional elective patient has a declared semaglutide escalation phase, '
      + 'active nausea and bloating, an ordinary fasting interval, and two bounded classification '
      + 'and disposition choices. The browser does not calculate gastric emptying or aspiration probability.',
    whereItMisleads: 'Applying the case’s disposition to every patient taking a GLP-1 medicine or '
      + 'treating a completed screen as a comprehensive preanesthetic assessment.',
    correctUnderstanding: 'Current guidance emphasizes patient-specific, multidisciplinary decisions '
      + 'that balance medication benefit, delayed-emptying risk, symptoms, procedure urgency, and available safeguards.',
    briefIn: ['aspiration-risk-recognition'],
  },
  {
    id: 'no-gastric-content-or-aspiration-physiology',
    headline: 'No stomach contents, regurgitation, aspiration, or lung injury are simulated.',
    simplification: 'The scenario keeps normal physiology while recording reasoning actions. It cannot '
      + 'show whether the stomach is empty, whether aspiration would occur, or what its consequences would be.',
    whereItMisleads: 'Reading a fasting interval or a successful decision path as proof of an empty '
      + 'stomach, prevented aspiration, or predicted outcome.',
    correctUnderstanding: 'Fasting history is one part of a broader assessment; real findings, local '
      + 'policy, available testing, and clinical judgment determine management.',
    briefIn: ['aspiration-risk-recognition'],
  },
  {
    id: 'no-ultrasound-or-airway-technique-instruction',
    headline: 'The lesson does not teach gastric ultrasound, rapid-sequence induction, or another airway technique.',
    simplification: 'Guidance-supported options are named only as excluded context. There are no images, '
      + 'measurements, anatomic steps, equipment choices, psychomotor actions, or claims of technical success.',
    whereItMisleads: 'Treating the vignette as procedural training or as endorsement of one universal anesthetic plan.',
    correctUnderstanding: 'Use current local guidance, supervised training, appropriate equipment, and '
      + 'shared clinical judgment for gastric assessment and airway management.',
    briefIn: ['aspiration-risk-recognition'],
  },
  {
    id: 'capnography-sampling-line-obstruction-is-display-only',
    headline: 'The obstructed sampling line changes the capnography display, not patient ventilation.',
    simplification: 'One fixed artifact flattens the sampled waveform and removes the displayed '
      + 'end-tidal number while canonical respiratory state, saturation, and the plethysmogram '
      + 'continue unchanged. Reconnection clears it immediately on the next engine tick.',
    whereItMisleads: 'Predicting the behavior, alarm timing, or troubleshooting steps of a real '
      + 'water trap, kink, leak, secretion, pump, analyzer, calibration fault, or diluted sample.',
    correctUnderstanding: 'Unexpected capnography loss requires immediate patient and equipment '
      + 'assessment. Independent evidence helps distinguish loss of ventilation from loss of the '
      + 'sampling signal, but stable saturation alone does not prove adequate ventilation.',
    briefIn: ['capnography-sampling-line-obstruction'],
  },
  {
    id: 'capnography-cross-check-is-screen-intent',
    headline: 'The ventilation cross-check records a decision, not a physical examination or equipment skill.',
    simplification: 'One button records that the learner compared the available respiratory rate, '
      + 'saturation, plethysmogram, and breath-delivery state. It cannot see chest or bag movement, '
      + 'hear breath sounds, inspect tubing, assess the airway, or judge communication.',
    whereItMisleads: 'Treating a successful screen action as evidence of clinical examination, '
      + 'device troubleshooting, airway management, or team performance.',
    correctUnderstanding: 'Use the monitor alongside direct patient observation and systematic '
      + 'equipment assessment. Those psychomotor and team skills require supervised practice.',
    briefIn: ['capnography-sampling-line-obstruction'],
  },
  {
    id: 'arterial-pressure-artifact-is-display-only',
    headline: 'The arterial-line faults change the invasive display, not canonical circulation.',
    simplification: 'A fixed 20 cm height error subtracts 15 mmHg from displayed MAP and a fixed '
      + 'over-damping artifact blunts waveform morphology. Neither changes the patient state.',
    whereItMisleads: 'Predicting a real device, tubing set, patient position, arterial site, or '
      + 'the accuracy of an individual invasive pressure measurement.',
    correctUnderstanding: 'Interpret invasive pressure only after checking the reference level, '
      + 'zero, waveform quality, clinical context, and an independent measure when readings are implausible.',
    briefIn: ['arterial-pressure-transducer-artifact'],
  },
  {
    id: 'arterial-line-actions-are-screen-intent',
    headline: 'Leveling, zeroing, waveform assessment, and tubing replacement are intent controls, not physical skills tests.',
    simplification: 'The controls accept a named diagnostic or corrective intent and change the '
      + 'bounded sensor state deterministically. They cannot observe setup, flushing, air bubbles, '
      + 'sterility, tubing, stopcocks, transducer position, or the learner’s hands.',
    whereItMisleads: 'Treating success in the browser as certification of arterial-line setup, '
      + 'troubleshooting, infection control, or equipment competence.',
    correctUnderstanding: 'Arterial pressure measurement is a technical skill that requires '
      + 'supervised equipment-specific practice alongside interpretation training.',
    briefIn: ['arterial-pressure-transducer-artifact'],
  },
  {
    id: 'nibp-is-a-delayed-independent-sample',
    headline: 'The cuff is a fixed delayed sample of canonical MAP, not a full oscillometric device model.',
    simplification: 'A cuff cycle takes exactly 20 simulated seconds and returns canonical MAP at '
      + 'completion. Cuff size, placement, motion, rhythm, arm position, inflation, deflation, '
      + 'systolic and diastolic estimation, failed cycles, and device error are absent.',
    whereItMisleads: 'Assuming a real cuff is always accurate, always succeeds, or should agree '
      + 'exactly with an arterial catheter at every site and moment.',
    correctUnderstanding: 'Non-invasive and invasive measurements each have limitations. Use '
      + 'appropriate technique, assess signal quality and context, and investigate clinically important disagreement.',
    briefIn: ['arterial-pressure-transducer-artifact'],
  },
  {
    id: 'circle-system-rebreathing-is-a-bounded-teaching-trajectory',
    headline: 'The exhausted-absorbent response is a declared teaching curve, not a workstation or patient prediction.',
    simplification: 'One authored equipment failure raises inspired carbon dioxide toward 8 mmHg '
      + 'at 1 L/min fresh-gas flow over a fixed 45-second time constant. Higher flow reduces that '
      + 'target on a fixed curve; replacement clears it with a fixed 10-second washout. Inspired '
      + 'carbon dioxide is added to the existing end-tidal value without a full carbon-dioxide '
      + 'production, distribution, ventilation, acid-base, sympathetic, or intracranial model.',
    whereItMisleads: 'Predicting absorber life, canister breakthrough, inspired or arterial carbon '
      + 'dioxide, alarm timing, hemodynamic effects, or response for a real patient or machine.',
    correctUnderstanding: 'A raised inspired carbon-dioxide baseline during circle-system use '
      + 'requires prompt patient and equipment assessment. Follow the workstation instructions '
      + 'and local response process; flow and replacement behavior are device- and context-specific.',
    briefIn: ['circle-system-rebreathing'],
  },
  {
    id: 'breathing-circuit-actions-are-screen-intent',
    headline: 'Capnogram assessment and absorbent replacement are intent controls, not equipment-skills certification.',
    simplification: 'Buttons record interpretation and corrective intent. The simulator cannot '
      + 'inspect the patient, breathing hoses, valves, seals, canister, granules, color indicator, '
      + 'workstation pause mode, backup circuit, or the learner’s physical technique.',
    whereItMisleads: 'Treating a successful browser action as proof of systematic machine '
      + 'troubleshooting, safe canister exchange, or competence on a particular workstation.',
    correctUnderstanding: 'Circle-system troubleshooting and absorbent exchange require '
      + 'supervised, equipment-specific practice with the manufacturer’s instructions and a backup plan.',
    briefIn: ['circle-system-rebreathing'],
  },
  {
    id: 'routine-maintenance-is-a-bounded-teaching-trajectory',
    headline: 'The changing maintenance case is a fixed teaching trajectory, not an individualized anesthetic plan or dose recommendation.',
    simplification: 'A fictional patient starts with fixed ventilation and volatile delivery, then '
      + 'receives one scripted surgical-stimulus window. The expert transcript uses one '
      + 'remifentanil infusion inside the US label range and stops it when that stimulus ends.',
    whereItMisleads: 'Copying the starting volatile setting, expert infusion rate, timing, depth '
      + 'range, or hemodynamic response into care of a real patient, or assuming every surgical '
      + 'stimulus can be anticipated this precisely.',
    correctUnderstanding: 'Maintenance anesthesia is individualized from the procedure, patient, '
      + 'drug delivery, ventilation, monitoring, direct observation, and repeated reassessment. '
      + 'The fixed values here exist only to make planning and reassessment reproducible.',
    briefIn: ['routine-inhalational-maintenance'],
  },
  {
    id: 'initial-maintenance-state-is-not-an-individual-prediction',
    headline: 'The established maintenance setup is a scenario starting condition, not a patient-specific anesthetic plan.',
    simplification: 'The case starts with a tracheal tube, volume-controlled breaths, 1.6% delivered '
      + 'sevoflurane, 50% oxygen, and 1 L/min fresh-gas flow. It does not model the induction, '
      + 'intubation, tube confirmation, surgical stimulation, analgesia, or individualized maintenance choice that preceded it.',
    whereItMisleads: 'Using the starting settings as a recommended anesthetic, dose, ventilation '
      + 'strategy, or evidence that a particular patient is adequately anesthetized.',
    correctUnderstanding: 'Maintenance anesthesia and ventilation must be individualized and '
      + 'continuously assessed. These fixed settings exist only to create a stable equipment-diagnosis window.',
    briefIn: ['circle-system-rebreathing'],
  },
  {
    id: 'no-team-or-communication',
    headline: 'There is no team: nobody to ask, nobody to hand over to, and no communication to get wrong.',
    simplification: 'There is no surgeon, no scrub team, no assistant, and no communication of any '
      + 'kind.',
    whereItMisleads: 'Crisis management, where most of what determines the outcome is who you '
      + 'called, when, and what you said.',
    correctUnderstanding: 'Crisis resource management is a team skill. This simulator cannot teach '
      + 'it and mannequin-based simulation remains necessary for it.',
    briefIn: ['unexpected-intraoperative-hemorrhage', 'blood-bank-handoff', 'obstetric-general-anesthesia', 'pneumothorax-under-positive-pressure'],
  },
  {
    id: 'parameters-unverified',
    headline: 'No model parameter has been independently checked by a second person against a second source, so none carries the Published label.',
    simplification: 'Every pharmacology parameter in this build is transcribed from its primary '
      + 'publication but has NOT had the independent second-source check the project requires.',
    whereItMisleads: 'Any use of a specific number from this simulator as a fact. A mistyped digit '
      + 'would not yet have been caught by the process designed to catch it.',
    correctUnderstanding: 'Treat the concentrations here as illustrative of the shape of the '
      + 'curves, not as validated values. The validation report says which models are affected: all of them.',
    briefIn: ['routine-induction'],
  },
];

export function limitationsFor(scenarioId: string): Limitation[] {
  return LIMITATIONS.filter((limitation) => limitation.briefIn.includes(scenarioId));
}
