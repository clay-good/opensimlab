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
    id: 'pulse-oximeter-artifact-display-and-corroboration-are-authored',
    headline: 'The false 82% display, poor pleth, pulse mismatch, arterial panel, and clean-site response are fixed teaching facts, not device predictions.',
    simplification: 'One declared motion and low-local-perfusion state produces a fixed false 82% '
      + 'display, pulse-rate mismatch, and noisy low-amplitude pleth while canonical oxygenation '
      + 'remains stable. Real devices filter, delay, alarm, fail, and recover differently.',
    whereItMisleads: 'Predicting how far or how fast a particular monitor will drift, or treating '
      + 'a similar discordance as proof that the reading is artifact.',
    correctUnderstanding: 'Judge the whole patient, signal quality, pulse-rate coherence, probe '
      + 'site and perfusion, trend, and independent oxygenation evidence. Support an unstable '
      + 'patient while checking the signal, and keep true hypoxemia and other limitations open.',
    briefIn: ['pulse-oximeter-motion-artifact'],
  },
  {
    id: 'pulse-oximeter-controls-record-review-intent-only',
    headline: 'Pulse-oximeter controls reveal authored observations; they do not inspect, reposition, or validate a real probe or monitor.',
    simplification: 'Button presses reveal fixed pleth, pulse-rate, probe-site, perfusion, patient, '
      + 'arterial-panel, and reassessment facts without any physical action or device interaction.',
    whereItMisleads: 'Using completion as evidence of probe-placement, perfusion-assessment, blood '
      + 'sampling, monitor-configuration, or troubleshooting skill.',
    correctUnderstanding: 'Those are physical and local-device competencies requiring supervised '
      + 'practice, applicable instructions, and real equipment.',
    briefIn: ['pulse-oximeter-motion-artifact'],
  },
  {
    id: 'no-live-probe-assessment-arterial-sampling-diagnosis-treatment-or-outcome',
    headline: 'The case does not examine the patient, sample blood, diagnose artifact or hypoxemia, deliver care, or predict outcome.',
    simplification: 'All observations, arterial values, and the clean-site response are authored '
      + 'proxies. No oxygen, treatment, escalation, or monitor action occurs.',
    whereItMisleads: 'Reading the fixed arterial panel as a performed test, the improved display as '
      + 'proof of diagnosis, or the stable patient as permission to delay support in real instability.',
    correctUnderstanding: 'Clinical assessment, support, testing, diagnosis, treatment, and '
      + 'reassessment occur in parallel according to the patient and local systems.',
    briefIn: ['pulse-oximeter-motion-artifact'],
  },
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
    id: 'emergency-anaphylaxis-findings-are-authored',
    headline: 'The emergency anaphylaxis presentation is authored, not diagnosed from a complete examination or differential.',
    simplification: 'One fixed food-exposure vignette supplies lip and tongue swelling, wheeze, hypoxemia, hypotension, and impaired perfusion. Skin findings, examination acquisition, and competing diagnoses are absent.',
    whereItMisleads: 'Treating the scripted pattern or its response as diagnostic proof, or assuming anaphylaxis requires the same findings in every patient.',
    correctUnderstanding: 'Recognize anaphylaxis clinically from the evolving exposure context and airway, breathing, or circulation compromise, with or without skin findings, while continuing real differential assessment.',
    briefIn: ['anaphylaxis'],
  },
  {
    id: 'emergency-anaphylaxis-actions-are-bounded',
    headline: 'The emergency response offers fixed adult teaching actions, not a dose, device, fluid, or airway calculator.',
    simplification: 'The screen records recumbent positioning, help, 500 micrograms of IM epinephrine, high-flow oxygen, and a fixed 1,500 mL isotonic-crystalloid bolus. It does not individualize preparation, delivery, access, rate, or response.',
    whereItMisleads: 'Copying the fixed adult actions into another patient, age group, setting, formulation, or local protocol without verification.',
    correctUnderstanding: 'Use the current local anaphylaxis pathway and patient-specific assessment; intramuscular epinephrine is first-line, while oxygen and fluid support follow clinical need.',
    briefIn: ['anaphylaxis'],
  },
  {
    id: 'no-refractory-anaphylaxis-airway-or-outcome',
    headline: 'Repeat dosing, refractory anaphylaxis, airway intervention, observation, referral, recurrence, and outcome are outside this initial-response case.',
    simplification: 'The case ends after one fixed first-line sequence and serial reassessment. It has no repeat-dose clock, infusion, adjunct medication, airway procedure, arrest pathway, biphasic reaction, discharge, or follow-up workflow.',
    whereItMisleads: 'Assuming modeled improvement completes care or that the initial sequence is sufficient when airway, breathing, or circulation problems persist.',
    correctUnderstanding: 'Continue frequent reassessment, repeat and escalate treatment under the current pathway when needed, and complete appropriate observation, safety planning, and specialist follow-up.',
    briefIn: ['anaphylaxis'],
  },
  {
    id: 'adult-asthma-findings-and-peak-flow-are-authored',
    headline: 'The adult asthma severity, immediate-mimic review, and peak-flow results are authored findings, not acquired measurements or diagnosis.',
    simplification: 'One fixed severe presentation supplies speech, work-of-breathing, wheeze, saturation, and peak-flow findings before and after initial treatment. Examination, spirometry, blood gas, imaging, and broader differential testing are absent.',
    whereItMisleads: 'Treating wheeze, the fixed peak-flow values, or the bounded response as proof of asthma or exclusion of another cause.',
    correctUnderstanding: 'Assess acute asthma severity from the whole presentation while checking alternative causes, and obtain real measurements where appropriate without delaying urgent treatment.',
    briefIn: ['adult-asthma'],
  },
  {
    id: 'adult-asthma-treatment-is-a-fixed-intent-bundle',
    headline: 'The adult asthma controls are a fixed initial teaching bundle, not an inhaler, oxygen, or prescription calculator.',
    simplification: 'The screen records controlled oxygen, a fixed 6-puff salbutamol plus 4-puff ipratropium pMDI-and-spacer bundle, and dose-free systemic-corticosteroid intent. Technique, strength, lung delivery, toxicity, drug selection, dose, and route are not assessed.',
    whereItMisleads: 'Copying the fixed bundle into a different severity, patient, inhaler formulation, resource setting, or local pathway.',
    correctUnderstanding: 'Use current local guidance, available formulations, patient-specific severity and response, careful oxygen targets, and verified inhaler technique.',
    briefIn: ['adult-asthma'],
  },
  {
    id: 'no-advanced-asthma-support-disposition-or-prevention',
    headline: 'Repeat bronchodilators, magnesium, ventilatory support, disposition, discharge treatment, and future-risk reduction are outside this initial-response vignette.',
    simplification: 'The case ends after one initial bundle and reassessment. It has no repeat cycle, toxicity trajectory, blood gas, non-invasive or invasive ventilation, critical-care escalation, admission decision, discharge prescription, technique review, adherence review, trigger workup, or action plan.',
    whereItMisleads: 'Assuming partial modeled improvement completes acute care or that preventing the next exacerbation can wait indefinitely.',
    correctUnderstanding: 'Continue severity- and response-based escalation, determine safe disposition, and address ICS-containing treatment, technique, adherence, triggers, and a written action plan after stabilization.',
    briefIn: ['adult-asthma'],
  },
  {
    id: 'copd-exacerbation-findings-and-blood-gases-are-authored',
    headline: 'The COPD severity, mimic review, sputum finding, and blood gases are authored, not acquired measurements or diagnosis.',
    simplification: 'One fixed moderate presentation supplies symptoms, signs, oxygenation, sputum, and blood-gas findings before and after initial treatment. Examination, sampling, imaging, ECG, microbiology, and broader differential testing are absent.',
    whereItMisleads: 'Treating the fixed blood gases, purulent sputum, or bounded response as proof of COPD exacerbation or exclusion of pneumonia, heart failure, pulmonary embolism, or another cause.',
    correctUnderstanding: 'Assess the whole acute presentation, consider important mimics and contributors, and obtain real measurements where appropriate without delaying urgent support.',
    briefIn: ['copd-exacerbation'],
  },
  {
    id: 'copd-exacerbation-treatment-is-fixed-or-intent-only',
    headline: 'The COPD controls are a fixed initial teaching bundle, not an oxygen, inhaler, nebulizer, drug, antibiotic, or prescription calculator.',
    simplification: 'The screen records controlled oxygen, air-driven short-acting bronchodilator intent, a fixed 5-day prednisone-equivalent intent, and antibiotic intent from purulent sputum. Formulation, technique, lung delivery, toxicity, contraindications, cultures, resistance, agent selection, dose delivery, and prescription are not assessed.',
    whereItMisleads: 'Copying the fixed intents into a different patient, exacerbation phenotype, resource setting, microbiology context, or local pathway.',
    correctUnderstanding: 'Use current local guidance, available formulations, patient-specific severity, prior results, contraindications, response, careful oxygen titration, and verified delivery technique.',
    briefIn: ['copd-exacerbation'],
  },
  {
    id: 'no-copd-ventilatory-support-disposition-or-prevention',
    headline: 'Repeat treatment, noninvasive or invasive ventilation, disposition, maintenance treatment, and future-risk reduction are outside this initial-response vignette.',
    simplification: 'The case ends after one initial sequence and reassessment. It has no repeat bronchodilator cycle, serial deterioration, ventilatory device setup, intensive-care pathway, admission or discharge decision, smoking-cessation support, vaccination review, maintenance-inhaler plan, rehabilitation, or follow-up workflow.',
    whereItMisleads: 'Assuming modeled improvement completes acute care or that the absence of acidosis in one authored repeat blood gas guarantees continued stability.',
    correctUnderstanding: 'Continue serial clinical and blood-gas review, escalate respiratory support when indicated, determine safe disposition, and address maintenance treatment and exacerbation prevention after stabilization.',
    briefIn: ['copd-exacerbation'],
  },
  {
    id: 'acute-pulmonary-edema-findings-are-authored',
    headline: 'The pulmonary-edema examination, ECG, radiograph, ultrasound, mimic, and precipitant findings are authored, not acquired tests or diagnosis.',
    simplification: 'One fixed hypertensive presentation supplies respiratory, congestion, pressure, perfusion, ECG, radiograph, and focused-ultrasound statements. Examination and test acquisition, biomarkers, renal and electrolyte results, and broader differential workup are absent.',
    whereItMisleads: 'Treating crackles, B-lines, opacity, preserved systolic contraction, or the bounded response as diagnostic proof or exclusion of ACS, pulmonary embolism, infection, valve disease, or another cause.',
    correctUnderstanding: 'Assess the whole acute-heart-failure pattern, investigate dangerous alternatives and precipitants, and obtain real tests without delaying urgent respiratory support.',
    briefIn: ['acute-pulmonary-edema'],
  },
  {
    id: 'pulmonary-edema-support-and-treatment-are-intent-controls',
    headline: 'The pulmonary-edema controls are bounded support and treatment intents, not an NIV, oxygen, diuretic, vasodilator, or prescription calculator.',
    simplification: 'The screen displays one fixed positive-pressure and oxygen setting, records dose-free loop-diuretic and vasodilator intents, and applies authored respiratory and pressure anchors. It does not assess interface fit, synchrony, drug choice, dose, delivery, titration, contraindications, urine output, renal function, electrolytes, or individual response.',
    whereItMisleads: 'Copying the displayed support setting or treatment intents into a different pressure, perfusion, right-heart, valve, renal, or respiratory context.',
    correctUnderstanding: 'Select, monitor, and titrate support and treatment to the real patient, contraindications, hemodynamics, response, current guidance, and local expertise.',
    briefIn: ['acute-pulmonary-edema'],
  },
  {
    id: 'no-pulmonary-edema-precipitant-disposition-or-outcome',
    headline: 'Precipitant treatment, serial decongestion, invasive ventilation, shock, disposition, chronic therapy, and outcome are outside this initial-response vignette.',
    simplification: 'The case ends after one support setting, two treatment intents, and reassessment. It has no ACS or arrhythmia treatment, mechanical-emergency pathway, diuresis trajectory, resistant congestion, NIV failure, intubation, cardiogenic-shock response, admission decision, chronic-therapy optimization, or follow-up workflow.',
    whereItMisleads: 'Assuming early improvement completes acute care or that pressure and oxygenation response establishes the precipitant or safe disposition.',
    correctUnderstanding: 'Continue monitoring, investigate and treat the precipitant, measure decongestion and organ response, escalate failed support, and determine appropriate admission and longitudinal care.',
    briefIn: ['acute-pulmonary-edema'],
  },
  {
    id: 'pulmonary-embolism-findings-and-deterioration-are-authored',
    headline: 'The confirmed PE, severity category, and deterioration are fixed teaching facts, not acquired findings or a predictive model.',
    simplification: 'Authored CT, RV, biomarker, respiratory, pressure, perfusion, and lactate statements create one Category C3R-to-E1 sequence. No test acquisition, diagnostic uncertainty, complete score, measurement error, competing illness, or variable trajectory is modeled.',
    whereItMisleads: 'Treating the category as a live calculator, assuming every PE deteriorates this way, or using the sequence to diagnose or predict an individual patient.',
    correctUnderstanding: 'Acute PE severity is serial and patient-specific; integrate clinical state, hemodynamics, respiratory support, biomarkers, and RV findings as new evidence arrives.',
    briefIn: ['pulmonary-embolism-deterioration'],
  },
  {
    id: 'pulmonary-embolism-support-anticoagulation-and-reperfusion-are-intent-controls',
    headline: 'Oxygen, anticoagulation, team activation, and reperfusion are bounded intents, not treatment selectors or procedure controls.',
    simplification: 'The lab records a fixed oxygen display and dose-free intents. It does not choose a device, anticoagulant, dose, monitoring plan, vasoactive support, reperfusion modality, or procedural technique.',
    whereItMisleads: 'Copying the displayed oxygen value, interpreting a click as treatment delivery, or assuming one reperfusion strategy suits every bleeding risk, anatomy, resource setting, or trajectory.',
    correctUnderstanding: 'Real treatment requires immediate bedside support, contraindication review, appropriate anticoagulation, multidisciplinary expertise, local capability, and continuous reassessment.',
    briefIn: ['pulmonary-embolism-deterioration'],
  },
  {
    id: 'no-pulmonary-embolism-procedure-disposition-or-outcome',
    headline: 'The vignette stops at urgent reperfusion planning and does not perform rescue therapy, transfer the patient, or predict outcome.',
    simplification: 'Thrombolysis, catheter therapy, thrombectomy, embolectomy, mechanical support, ventilation, complications, transport, admission, follow-up, and recurrence prevention are absent.',
    whereItMisleads: 'Assuming escalation stabilizes the patient, delaying local rescue processes, or inferring that the final low pressure is a treatment response or prognosis.',
    correctUnderstanding: 'Category E cardiopulmonary failure requires immediate resource-specific rescue, hemodynamic and respiratory support, and ongoing critical care beyond this lesson.',
    briefIn: ['pulmonary-embolism-deterioration'],
  },
  {
    id: 'stemi-findings-are-authored',
    headline: 'The symptom history, diagnostic 12-lead ECG, pressure, oxygenation, mimics, and PCI-capable setting are fixed teaching facts.',
    simplification: 'One authored presentation supplies the ECG and clinical pattern without test acquisition, lead-placement error, live interpretation, evolving ischemia, biomarkers, imaging, diagnostic uncertainty, or competing data.',
    whereItMisleads: 'Treating the bedside lead-II waveform as a diagnostic 12-lead, using the case as proof of STEMI, or assuming all occlusion patterns and mimics look this way.',
    correctUnderstanding: 'Acquire and interpret a real 12-lead promptly, integrate the entire clinical picture, repeat testing when needed, and pursue urgent reperfusion for an eligible STEMI pattern.',
    briefIn: ['stemi'],
  },
  {
    id: 'stemi-reperfusion-and-antithrombotics-are-intent-controls',
    headline: 'Pathway activation, primary PCI, aspirin, P2Y12 inhibition, and anticoagulation are bounded intents, not orders or treatment selectors.',
    simplification: 'The vignette records a guideline aspirin loading range and otherwise dose-free intents. It does not activate a real team, deliver medication, select agents, assess bleeding risk, perform transport, or open an artery.',
    whereItMisleads: 'Reading a click as treatment delivery, copying the range without checking contraindications and prior therapy, or assuming activation guarantees timely reperfusion.',
    correctUnderstanding: 'Real STEMI care requires immediate local system activation, verified medication delivery, individualized antithrombotic choices, continuous monitoring, and measured treatment times.',
    briefIn: ['stemi'],
  },
  {
    id: 'no-stemi-procedure-complication-disposition-or-outcome',
    headline: 'The lesson ends at pre-reperfusion handoff and does not model PCI, fibrinolysis, complications, disposition, secondary prevention, or outcome.',
    simplification: 'Angiography, access, lesion anatomy, stents, reperfusion, infarct size, arrhythmia, shock, heart failure, mechanical complications, transfer, admission, rehabilitation, and longitudinal care are absent.',
    whereItMisleads: 'Assuming stable authored vital signs guarantee an uncomplicated course, that handoff completes treatment, or that this PCI-capable pathway applies unchanged when timely PCI is unavailable.',
    correctUnderstanding: 'STEMI remains time-critical through reperfusion and subsequent monitored care; strategy and rescue depend on patient factors, timing, contraindications, and regional capability.',
    briefIn: ['stemi'],
  },
  {
    id: 'unstable-tachycardia-rhythm-and-instability-are-authored',
    headline: 'The rhythm width, regularity, rate, and hemodynamic instability are fixed teaching facts, not a live rhythm diagnosis.',
    simplification: 'A fixed 12-lead statement and whole-patient findings create one unstable narrow-complex pattern. The waveform generator does not encode atrial mechanism, and no ECG acquisition, artifact, evolving rhythm, or alternative cause is modeled.',
    whereItMisleads: 'Using the bedside teaching trace to diagnose an SVT mechanism, assuming tachycardia always causes the instability, or generalizing this fixed response to an individual patient.',
    correctUnderstanding: 'Assess whether the rate is appropriate for the clinical condition, acquire a diagnostic ECG when feasible, and integrate rhythm with pressure, brain, chest, heart failure, and perfusion findings.',
    briefIn: ['unstable-narrow-complex-tachycardia'],
  },
  {
    id: 'synchronized-cardioversion-is-an-intent-control',
    headline: 'Preparation and synchronized cardioversion are intent controls, not defibrillator operation or procedural training.',
    simplification: 'The lesson records help, monitoring, access, pad preparation, and a synchronized-shock intent, then applies a fixed response. It does not place pads, verify synchronization, choose energy, charge, clear, shock, or deliver sedation.',
    whereItMisleads: 'Assuming a click proves safe synchronization or shock delivery, copying an energy value from another device, or delaying urgent treatment to complete optional sedation.',
    correctUnderstanding: 'Use a familiar device and current local process, verify synchronization carefully, sedate when feasible without delaying urgent cardioversion, and reassess immediately.',
    briefIn: ['unstable-narrow-complex-tachycardia'],
  },
  {
    id: 'no-tachycardia-energy-sedation-procedure-recurrence-or-outcome',
    headline: 'Energy, sedation, device technique, refractory treatment, recurrence, causal diagnosis, disposition, and outcome are outside the vignette.',
    simplification: 'The case ends after one authored rhythm and perfusion response. It has no adenosine or other drug pathway, repeated cardioversion, airway event, recurrence, anticoagulation decision, electrophysiology evaluation, admission, or follow-up.',
    whereItMisleads: 'Assuming the fixed conversion predicts success, that one reassessment completes care, or that narrow-complex tachycardias share the same subsequent management.',
    correctUnderstanding: 'Prepare for failed or recurrent cardioversion, investigate and treat the cause, obtain expert help, and determine ongoing rhythm-specific monitoring and care.',
    briefIn: ['unstable-narrow-complex-tachycardia'],
  },
  {
    id: 'unstable-bradycardia-rhythm-and-compromise-are-authored',
    headline: 'The sinus bradycardia, palpable pulse, and cardiopulmonary compromise are fixed teaching facts, not a live diagnosis.',
    simplification: 'A fixed monitor rhythm and whole-patient findings create one unstable bradycardia pattern. No ECG acquisition, artifact, conduction diagnosis, evolving rhythm, or causal test is modeled.',
    whereItMisleads: 'Assuming every rate below 50/min is unstable, treating the bedside trace as a complete diagnosis, or attributing compromise to bradycardia without evaluating the patient and reversible causes.',
    correctUnderstanding: 'Judge whether the rate is appropriate for the clinical condition and integrate rhythm with pulse, pressure, mental status, ischemic discomfort, heart failure, perfusion, and cause assessment.',
    briefIn: ['unstable-bradycardia'],
  },
  {
    id: 'bradycardia-support-and-atropine-are-intent-controls',
    headline: 'Support and the fixed atropine action record intent; they do not deliver oxygen, establish access, or administer medication.',
    simplification: 'The lesson records a support bundle and one 1 mg IV atropine intent, then applies an authored response. It does not verify oxygen flow, obtain access, prepare medication, deliver a bolus, or assess contraindications.',
    whereItMisleads: 'Reading a click as completed treatment, copying the fixed dose without using a current local process, or assuming atropine reliably corrects every unstable bradycardia.',
    correctUnderstanding: 'Verify each intervention, monitor the pulse and whole patient continuously, use current local medication safeguards, and be ready to escalate if compromise persists.',
    briefIn: ['unstable-bradycardia'],
  },
  {
    id: 'no-bradycardia-pacing-infusions-cause-procedure-recurrence-or-outcome',
    headline: 'Repeated atropine, pacing, adrenergic infusions, causal treatment, recurrence, disposition, and outcome are outside the vignette.',
    simplification: 'The case ends after one authored response. It has no transcutaneous or transvenous pacing, electrical or mechanical capture, sedation, dopamine or epinephrine infusion, repeated medication, definitive cause, admission, or follow-up.',
    whereItMisleads: 'Assuming the fixed response predicts success, that one reassessment completes care, or that sinus bradycardia and high-degree block share the same response.',
    correctUnderstanding: 'Continue reversible-cause evaluation and prepare for pacing, rate-accelerating infusion, expert consultation, and transvenous pacing when indicated by persistent compromise and rhythm context.',
    briefIn: ['unstable-bradycardia'],
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
    briefIn: ['quantitative-neuromuscular-reversal', 'emergence-with-residual-blockade'],
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
    id: 'emergence-residual-blockade-is-a-static-decision-vignette',
    headline: 'The emergence ratio is a static authored snapshot, not a drug course or individual recovery prediction.',
    simplification: 'The scenario starts and remains at a quantitative train-of-four ratio of '
      + '0.72 so the learner can resolve a single conflict between clinical signs, qualitative '
      + 'assessment, and quantitative monitoring. No administered blocker or elapsed recovery '
      + 'course produces that value inside the vignette.',
    whereItMisleads: 'Predicting how long residual blockade will last or inferring a drug dose, '
      + 'concentration, or reversal response from the static display.',
    correctUnderstanding: 'Recovery varies by drug, dose, timing, patient, and treatment. Use '
      + 'correctly configured quantitative monitoring and repeated assessment rather than this fixture.',
    briefIn: ['emergence-with-residual-blockade'],
  },
  {
    id: 'no-extubation-or-recovery-physiology',
    headline: 'This decision snapshot preserves a secured airway; it does not simulate recovery, consciousness, or extubation.',
    simplification: 'The accepted protective plan records that the tracheal tube and delivered '
      + 'ventilation remain in place. There is no spontaneous neuromuscular recovery, reversal '
      + 'choice, awakening, airway-reflex assessment, tube removal, or postoperative course.',
    whereItMisleads: 'Treating the accepted choice as a complete emergence plan or using a ratio '
      + 'alone as proof of extubation readiness.',
    correctUnderstanding: 'Quantitative neuromuscular recovery is necessary after nondepolarizing '
      + 'blockade, but extubation also requires a broader patient, airway, ventilation, oxygenation, '
      + 'and anesthetic assessment that this vignette does not perform.',
    briefIn: ['emergence-with-residual-blockade'],
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
    correctUnderstanding: 'A combined breathing and circulation deterioration in a compatible '
      + 'context requires immediate systematic assessment and cause-directed management.',
    briefIn: ['pneumothorax-under-positive-pressure', 'obstructive-shock-tension-pneumothorax'],
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
    id: 'obstructive-pleural-findings-are-authored',
    headline: 'The trauma history, unilateral breathing findings, hypoxia, and shock are fixed teaching facts.',
    simplification: 'A click reveals one authored bilateral assessment without examination '
      + 'technique, POCUS acquisition, imaging, diagnostic uncertainty, or competing injuries.',
    whereItMisleads: 'Treating the case as a diagnostic test, assuming every tension pneumothorax '
      + 'has this presentation, or generalizing its findings to an individual patient.',
    correctUnderstanding: 'Unstable traumatic chest disease requires immediate repeated clinical '
      + 'assessment, integration of mechanism and physiology, and skilled cause-directed treatment.',
    briefIn: ['obstructive-shock-tension-pneumothorax'],
  },
  {
    id: 'no-obstructive-shock-differential-or-outcome',
    headline: 'The vignette does not simulate the full obstructive-shock differential, later pleural care, recurrence, or outcome.',
    simplification: 'The authored left-sided pattern clears after one intent action; tamponade, '
      + 'pulmonary embolism, hemorrhage, airway causes, drainage, recurrence, and disposition are absent.',
    whereItMisleads: 'Assuming the fixed cause is proven, skipping competing threats, treating '
      + 'monitor improvement as procedural success, or inferring recovery and safe disposition.',
    correctUnderstanding: 'Real care requires continued reassessment, definitive pleural management, '
      + 'evaluation for concurrent threats, monitoring for recurrence, and trauma-system escalation.',
    briefIn: ['obstructive-shock-tension-pneumothorax'],
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
    briefIn: ['pneumothorax-under-positive-pressure', 'obstructive-shock-tension-pneumothorax'],
  },
  {
    id: 'tamponade-findings-and-pocus-are-authored',
    headline: 'The penetrating-trauma context, perfusion findings, and focused POCUS statement are fixed teaching facts.',
    simplification: 'Controls reveal one authored whole-patient pattern and pericardial-fluid/right-sided-collapse '
      + 'statement without examination or image acquisition, views, artifacts, interpretation error, or competing data.',
    whereItMisleads: 'Treating the case as a diagnostic test, assuming one ultrasound statement proves '
      + 'tamponade, or reading a click as evidence of POCUS competence.',
    correctUnderstanding: 'Unstable penetrating chest trauma requires immediate repeated assessment and '
      + 'expert integration of mechanism, physiology, imaging when feasible, and concurrent threats.',
    briefIn: ['cardiac-tamponade'],
  },
  {
    id: 'tamponade-physiology-is-a-teaching-trajectory',
    headline: 'The tamponade drive is a bounded obstructive-circulation trajectory, not a pericardial pressure or injury model.',
    simplification: 'One authored drive lowers stroke volume, cardiac output, pressure, and end-tidal '
      + 'carbon dioxide and remains active after escalation intent because treatment is not simulated.',
    whereItMisleads: 'Using displayed values to estimate pericardial blood, pressure, injury severity, '
      + 'time to arrest, technical success, or an individual response.',
    correctUnderstanding: 'Tamponade physiology and response vary with accumulation rate, volume status, '
      + 'injury, ventilation, and treatment; monitor trends require direct patient reassessment.',
    briefIn: ['cardiac-tamponade'],
  },
  {
    id: 'tamponade-control-is-intent-only',
    headline: 'Definitive tamponade control is an escalation intent, not pericardiocentesis or thoracotomy instruction.',
    simplification: 'One control records immediate transfer to trauma, surgical, and resuscitation capability; '
      + 'the simulator performs no access, drainage, incision, repair, transport, or team action.',
    whereItMisleads: 'Treating the browser response as a procedure choice, protocol, proof of competence, '
      + 'or evidence that a real obstruction has been relieved.',
    correctUnderstanding: 'Traumatic tamponade requires immediate expert, system-specific definitive care; '
      + 'procedure selection depends on arrest state, setting, expertise, equipment, and injury.',
    briefIn: ['cardiac-tamponade'],
  },
  {
    id: 'no-tamponade-procedure-differential-or-outcome',
    headline: 'The vignette omits procedure selection, concurrent injuries, full shock differential, arrest, complications, and outcome.',
    simplification: 'The fixed case closes at escalation and serial monitor review; pleural injury, hemorrhage, '
      + 'aortic injury, pulmonary embolism, arrest, recurrence, disposition, and prognosis are absent.',
    whereItMisleads: 'Assuming the fixed cause is proven, delaying care for a fuller browser sequence, '
      + 'ignoring concurrent threats, or inferring survival from the bounded monitor trajectory.',
    correctUnderstanding: 'Real trauma resuscitation addresses concurrent reversible causes in parallel and '
      + 'continues through definitive repair, complication surveillance, and critical care.',
    briefIn: ['cardiac-tamponade'],
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
    id: 'delayed-emergence-is-a-bounded-differential-vignette',
    headline: 'Delayed emergence is reduced to one ordered differential; this is not a complete assessment or an individual diagnosis.',
    simplification: 'The learner reviews immediate support, recorded exposures, four fixed '
      + 'reversible categories, and one focused neurologic examination in a prescribed order.',
    whereItMisleads: 'Treating the short sequence as exhaustive, assuming every delayed emergence '
      + 'presents this way, or using completion as evidence that a real patient has been fully assessed.',
    correctUnderstanding: 'Delayed emergence requires immediate support and a systematic '
      + 'patient-specific differential that adapts to the history, examination, monitoring, and response.',
    briefIn: ['delayed-emergence-differential'],
  },
  {
    id: 'fixed-bedside-results-do-not-model-laboratory-testing',
    headline: 'The displayed glucose, carbon dioxide, sodium, and temperature are fixed teaching findings, not simulated tests or a complete metabolic workup.',
    simplification: 'Four authored values appear immediately after the learner selects the bounded '
      + 'review. There is no specimen, device, delay, uncertainty, artifact, trend, or additional result.',
    whereItMisleads: 'Inferring that these are the only relevant reversible causes, that a single '
      + 'normal value excludes a category, or that the browser teaches test selection and interpretation.',
    correctUnderstanding: 'Testing and interpretation depend on the clinical context, test quality, '
      + 'timing, trends, and the broader differential. These values only narrow this fictional case.',
    briefIn: ['delayed-emergence-differential'],
  },
  {
    id: 'no-neurologic-diagnosis-treatment-or-outcome',
    headline: 'The focal examination changes urgency here, but no neurologic diagnosis, imaging, treatment, workflow, or outcome is modeled.',
    simplification: 'One fixed asymmetric motor response and gaze preference unlock an urgent '
      + 'escalation choice while the existing airway and ventilation remain supported.',
    whereItMisleads: 'Naming a diagnosis from the browser finding, predicting imaging, choosing '
      + 'treatment, or treating the accepted escalation as a complete emergency response.',
    correctUnderstanding: 'A new focal neurologic pattern during delayed emergence warrants urgent '
      + 'evaluation and coordinated real-world care; diagnosis and management require capabilities absent here.',
    briefIn: ['delayed-emergence-differential'],
  },
  {
    id: 'extubation-readiness-findings-are-fixed',
    headline: 'Every extubation-readiness finding is authored and immediate; the browser does not measure consciousness, breathing, reflexes, or airway condition.',
    simplification: 'Command following, cough, secretion clearance, spontaneous breathing, gas '
      + 'exchange, airway condition, and resource availability are fixed results revealed in order.',
    whereItMisleads: 'Treating a clicked review as physical examination, accepting one displayed '
      + 'threshold as sufficient, or transferring the exact values to an individual patient.',
    correctUnderstanding: 'Extubation readiness requires direct, repeated assessment of the whole '
      + 'patient and airway. Each finding must be interpreted in its clinical context.',
    briefIn: ['extubation-readiness'],
  },
  {
    id: 'low-risk-awake-extubation-only',
    headline: 'This vignette covers one declared low-risk awake-extubation decision, not deep extubation or an at-risk airway strategy.',
    simplification: 'The fictional airway was uncomplicated and has no declared edema, bleeding, '
      + 'distortion, airway surgery, or other new concern. Skilled help and a reintubation plan are available.',
    whereItMisleads: 'Generalizing the low-risk path to a difficult, changed, pediatric, critical-care, '
      + 'deep-extubation, aspiration-risk, or otherwise at-risk situation.',
    correctUnderstanding: 'Risk stratification and a patient-specific strategy precede extubation. '
      + 'At-risk and advanced techniques require expertise and capabilities absent from this browser.',
    briefIn: ['extubation-readiness'],
  },
  {
    id: 'no-airway-removal-or-postextubation-outcome',
    headline: 'The accepted decision records readiness only; tube removal, airway technique, rescue, monitoring, and post-extubation outcome are not simulated.',
    simplification: 'The tracheal tube and delivered ventilation remain in engine state after the '
      + 'learner records readiness. No cuff, suction, position, oxygen-delivery, removal, or recovery action follows.',
    whereItMisleads: 'Treating the control as procedural rehearsal, assuming extubation succeeded, '
      + 'or inferring that post-extubation airway patency and breathing were confirmed.',
    correctUnderstanding: 'Extubation is a planned procedure with continuous oxygen delivery, '
      + 'monitoring, skilled assistance, rescue readiness, and post-extubation reassessment.',
    briefIn: ['extubation-readiness'],
  },
  {
    id: 'post-extubation-obstruction-is-a-bounded-teaching-trajectory',
    headline: 'The post-extubation airway response is a deterministic teaching trajectory, not an individual prediction.',
    simplification: 'One scripted soft-tissue obstruction lowers gas flow and resolves at a fixed '
      + 'rate only while the declared jaw-thrust, continuous-pressure, and oxygen controls are active.',
    whereItMisleads: 'Inferring a real patient response time, pressure requirement, oxygen reserve, '
      + 'or probability of recovery from the displayed trace.',
    correctUnderstanding: 'Real response depends on cause, anatomy, depth, residual drugs, position, '
      + 'equipment, technique, and time. Reassess continuously and escalate when simple support fails.',
    briefIn: ['post-extubation-obstruction'],
  },
  {
    id: 'soft-tissue-obstruction-only',
    headline: 'This lesson models reduced pharyngeal tone only; it does not diagnose every cause of obstruction after extubation.',
    simplification: 'The authored snoring, paradoxical effort, low tidal volume, and smaller capnogram '
      + 'are assigned to one reversible soft-tissue collapse state.',
    whereItMisleads: 'Using improvement or non-improvement to exclude laryngospasm, edema, blood, '
      + 'secretions, aspiration, device problems, respiratory depression, or other causes.',
    correctUnderstanding: 'Post-extubation obstruction has a broad, time-critical differential. '
      + 'Findings and response guide assessment but do not replace it.',
    briefIn: ['post-extubation-obstruction'],
  },
  {
    id: 'no-refractory-post-extubation-airway-pathway',
    headline: 'The browser stops after initial airway support and recovery; adjuncts, reintubation, complications, and team performance are absent.',
    simplification: 'The available path recruits help, changes the machine controls, applies one '
      + 'held maneuver, and observes gas-exchange recovery.',
    whereItMisleads: 'Treating completion as a full failed-airway algorithm or evidence that '
      + 'post-obstructive pulmonary edema, aspiration, or recurrent obstruction cannot occur.',
    correctUnderstanding: 'Persistent or recurrent compromise requires immediate skilled escalation, '
      + 'additional airway techniques and devices, and continued post-extubation monitoring.',
    briefIn: ['post-extubation-obstruction'],
  },
  {
    id: 'opioid-ventilatory-impairment-is-a-fixed-central-drive-model',
    headline: 'This lesson isolates a fixed central-drive depression pattern; it does not model the full OIVI triad or an individual opioid exposure.',
    simplification: 'One event lowers spontaneous rate much more than breath size while the airway '
      + 'remains patent and supplemental oxygen initially supports saturation.',
    whereItMisleads: 'Inferring morphine dose, pharmacokinetics, arterial carbon dioxide, sedation '
      + 'score, probability, or excluding upper-airway obstruction and other depressants.',
    correctUnderstanding: 'OIVI can combine central depression, reduced upper-airway tone, and '
      + 'sedation. Detection and treatment depend on the whole patient, exposure, and trends.',
    briefIn: ['opioid-induced-ventilatory-impairment'],
  },
  {
    id: 'naloxone-is-intent-not-dose-or-pharmacology',
    headline: 'Naloxone is an escalation intent here, not a dose recommendation, administration simulation, or predicted response.',
    simplification: 'An accepted intent lowers the central-drive impairment along one deterministic '
      + 'curve after further opioid is held.',
    whereItMisleads: 'Transferring a response time, selecting a dose or route, or assuming reversal '
      + 'preserves analgesia and avoids withdrawal, adverse effects, or recurrent depression.',
    correctUnderstanding: 'Naloxone use is titrated to the patient and clinical severity while '
      + 'ventilation is supported; response and recurrence require continued reassessment.',
    briefIn: ['opioid-induced-ventilatory-impairment'],
  },
  {
    id: 'no-pain-withdrawal-recurrence-or-monitoring-workflow',
    headline: 'The scenario stops at initial spontaneous recovery; pain, withdrawal, repeated reversal, and ongoing monitoring workflow are absent.',
    simplification: 'A fixed exposure, one opioid hold, one reversal intent, machine support, and a '
      + 'brief spontaneous reassessment form the complete browser path.',
    whereItMisleads: 'Treating the recovered trace as safe discharge, assuming the opioid effect '
      + 'cannot outlast reversal, or ignoring analgesia and other causes of sedation.',
    correctUnderstanding: 'Initial improvement does not end care. Continued observation, repeat '
      + 'assessment, analgesia planning, and escalation depend on patient-specific risk and response.',
    briefIn: ['opioid-induced-ventilatory-impairment'],
  },
  {
    id: 'perioperative-temperature-course-is-a-fixed-teaching-target',
    headline: 'The cooling and rewarming curves approach fixed teaching targets; they are not an energy-balance or individual-patient model.',
    simplification: 'One scripted interruption moves core temperature toward 35.5°C, and accepted '
      + 'active warming moves it toward 36.6°C along deterministic curves.',
    whereItMisleads: 'Inferring a real rate of heat loss or rewarming, predicting a patient’s '
      + 'temperature, or transferring the displayed trajectory across procedures and environments.',
    correctUnderstanding: 'Perioperative temperature depends on redistribution, anesthetic state, '
      + 'exposure, ambient conditions, patient factors, fluids, equipment, and time.',
    briefIn: ['hypothermia-and-rewarming'],
  },
  {
    id: 'warming-actions-have-no-device-or-heat-transfer-model',
    headline: 'Surface and fluid warming are recorded intents, not device setup, delivery, or heat-transfer simulations.',
    simplification: 'Buttons record confirmation, active surface warming, and warming of one fixed '
      + '700 mL crystalloid exposure. Only surface warming changes the teaching target.',
    whereItMisleads: 'Treating a click as device competence, assuming settings or contact are safe, '
      + 'or reading a fluid-warming action as a quantified thermal effect.',
    correctUnderstanding: 'Real warming requires appropriate equipment, setup, monitoring, skin '
      + 'assessment, fluid-delivery workflow, and adjustment to the patient’s response.',
    briefIn: ['hypothermia-and-rewarming'],
  },
  {
    id: 'no-hypothermia-complications-comfort-or-disposition',
    headline: 'The stable vignette does not model shivering, comfort, coagulopathy, infection, drug effects, cardiac events, or transfer decisions.',
    simplification: 'Temperature is the only patient variable altered by the scripted thermal state; '
      + 'the scenario ends after a bounded rewarming observation.',
    whereItMisleads: 'Assuming a stable trace excludes complications, proves comfort, or establishes '
      + 'readiness for emergence, recovery discharge, or ward transfer.',
    correctUnderstanding: 'Hypothermia can affect multiple systems and perioperative workflows. '
      + 'Whole-patient assessment and local policy determine ongoing care and disposition.',
    briefIn: ['hypothermia-and-rewarming'],
  },
  {
    id: 'perioperative-glucose-results-are-fixed-teaching-values',
    headline: 'The elevated and repeat glucose results are fixed teaching values, not measurements produced by a metabolic model.',
    simplification: 'One event exposes 238 mg/dL and one eligible repeat records 174 mg/dL after '
      + '30 simulated minutes.',
    whereItMisleads: 'Predicting a patient’s glucose trajectory, treatment response, infection '
      + 'risk, length of stay, or outcome from the displayed values.',
    correctUnderstanding: 'Perioperative glucose reflects diabetes phenotype, stress, medications, '
      + 'nutrition, organ function, surgery, sampling, treatment, and time.',
    briefIn: ['perioperative-hyperglycemia'],
  },
  {
    id: 'insulin-action-is-intent-without-dose-or-delivery',
    headline: 'The insulin control records institutional-protocol intent; it does not choose, calculate, prepare, or deliver insulin.',
    simplification: 'An accepted action starts a fixed response clock without a drug, dose, route, '
      + 'infusion, pump, pharmacokinetic, or hypoglycemia model.',
    whereItMisleads: 'Treating the button as an insulin order or assuming the fixed repeat value '
      + 'demonstrates the effect of a real dose.',
    correctUnderstanding: 'Insulin selection and administration require local protocols, patient '
      + 'factors, active monitoring, and a plan to prevent and treat hypoglycemia.',
    briefIn: ['perioperative-hyperglycemia'],
  },
  {
    id: 'no-hyperglycemic-crisis-electrolyte-or-nutrition-model',
    headline: 'The stable vignette does not assess hyperglycemic crisis, electrolytes, ketones, fluids, nutrition, or medication reconciliation.',
    simplification: 'The lesson contains an isolated elevated glucose cue and no acid-base, '
      + 'electrolyte, ketone, osmolar, renal, or nutritional state.',
    whereItMisleads: 'Assuming an isolated result excludes diabetic ketoacidosis or hyperosmolar '
      + 'state, or transferring this response to an unstable, fasting, pregnant, pediatric, or critically ill patient.',
    correctUnderstanding: 'Clinical context determines the differential, investigations, target, '
      + 'treatment, monitoring interval, and perioperative medication plan.',
    briefIn: ['perioperative-hyperglycemia'],
  },
  {
    id: 'cied-record-and-procedure-are-fixed-vignette-facts',
    headline: 'The pacemaker record, pacing dependence, magnet response, and procedure details are fixed teaching facts.',
    simplification: 'Two review actions reveal one complete device record and one anticipated '
      + 'electrosurgery pattern without obtaining or validating live data.',
    whereItMisleads: 'Treating the displayed record as an interrogation, assuming the same response '
      + 'for another device, or transferring the plan to another procedure or position.',
    correctUnderstanding: 'CIED planning requires the actual device, indication, recent function, '
      + 'pacing dependence, magnet behavior, procedure, position, interference source, and local team.',
    briefIn: ['pacemaker-and-cautery-planning'],
  },
  {
    id: 'no-device-programming-magnet-or-electrosurgery-model',
    headline: 'The plan records intent; no programming, magnet effect, pacing, sensing, current path, or electrosurgery is simulated.',
    simplification: 'Buttons record reviews and a coordinated plan while physiology and device '
      + 'function remain unchanged.',
    whereItMisleads: 'Reading a click as a device order, programming competence, confirmed magnet '
      + 'capture, safe dispersive-electrode placement, or proof that interference cannot occur.',
    correctUnderstanding: 'Device changes and electrosurgery mitigation require trained personnel, '
      + 'manufacturer-specific knowledge, appropriate equipment, monitoring, and verification.',
    briefIn: ['pacemaker-and-cautery-planning'],
  },
  {
    id: 'no-cied-malfunction-emergency-or-team-performance',
    headline: 'The stable preoperative vignette does not model pacing inhibition, inappropriate therapy, device damage, emergency response, or team performance.',
    simplification: 'The lesson ends after documentation of backup and restoration intent; no '
      + 'intraoperative electromagnetic-interference event occurs.',
    whereItMisleads: 'Assuming planning guarantees an uncomplicated course or demonstrates response '
      + 'to loss of capture, bradycardia, tachytherapy, hemodynamic instability, or failed restoration.',
    correctUnderstanding: 'Real care needs continuous patient monitoring, immediately available '
      + 'backup, explicit roles, response protocols, and verified restoration before monitored care ends.',
    briefIn: ['pacemaker-and-cautery-planning'],
  },
  {
    id: 'postoperative-handoff-content-is-a-fixed-vignette',
    headline: 'Every patient, course, current-state, risk, action, timing, and ownership detail is fixed teaching content.',
    simplification: 'Six accepted buttons reveal and order prewritten blocks; the learner cannot '
      + 'omit, distort, prioritize, or add information inside them.',
    whereItMisleads: 'Treating completion as proof that a learner selected accurate, concise, '
      + 'relevant content or adapted it to a real patient and receiving team.',
    correctUnderstanding: 'Real handoffs require verified patient-specific information, judgment '
      + 'about salience and uncertainty, and adaptation to local tools and the receiver’s needs.',
    briefIn: ['postoperative-handoff'],
  },
  {
    id: 'handoff-controls-record-events-not-communication-quality',
    headline: 'The controls record an ordered transcript; they do not measure whether communication was heard, understood, respectful, concise, or complete.',
    simplification: 'Receiver readiness, questions, synthesis, and acknowledgment are boolean '
      + 'teaching events without voice, language, interruption, or behavioral evidence.',
    whereItMisleads: 'Reading a completed sequence as competence in closed-loop communication, '
      + 'teamwork, situational awareness, advocacy, or speaking up across hierarchy.',
    correctUnderstanding: 'Communication performance requires observation, feedback, and practice '
      + 'with people in realistic workflow, including ambiguity, distraction, and questions.',
    briefIn: ['postoperative-handoff'],
  },
  {
    id: 'no-bedside-transfer-staffing-documentation-or-outcome',
    headline: 'The vignette does not model bedside setup, examination, staffing, workload, documentation, clinical action, deterioration, or outcome.',
    simplification: 'Responsibility changes only in simulator state after acknowledgment; no real '
      + 'person, record, monitor, medication, task, or care setting changes.',
    whereItMisleads: 'Assuming the interface completes institutional transfer requirements, proves '
      + 'readiness, assigns real liability, or ensures that pending actions occur.',
    correctUnderstanding: 'Local policy, appropriate staffing, connected monitoring, bedside '
      + 'assessment, documentation, task completion, escalation, and ongoing care remain essential.',
    briefIn: ['postoperative-handoff'],
  },
  {
    id: 'shock-findings-are-a-fixed-vignette',
    headline: 'The skin, mentation, urine output, pressure, lactate, and response findings are fixed teaching facts.',
    simplification: 'Assessment controls reveal one authored presentation and one authored '
      + 'post-challenge state without measurement error, evolving disease, or competing observations.',
    whereItMisleads: 'Treating completion as a bedside examination, assuming the displayed pattern '
      + 'is typical of every shock state, or predicting how a real patient will respond.',
    correctUnderstanding: 'Shock assessment is serial and patient-specific. Findings, trajectory, '
      + 'measurement quality, comorbidity, and treatment response must be integrated at the bedside.',
    briefIn: ['undifferentiated-shock'],
  },
  {
    id: 'shock-ultrasound-and-plr-are-authored-results',
    headline: 'Focused cardiac ultrasound and passive-leg-raise results are authored findings, not acquired skills or simulated measurements.',
    simplification: 'A click reveals fixed ventricular, pericardial, preload, and dynamic-response '
      + 'statements without image acquisition, windows, artifacts, operator error, or stroke-volume measurement.',
    whereItMisleads: 'Reading the interface as proof of ultrasound or passive-leg-raise competence, '
      + 'or treating a fixed positive response as diagnostic of the cause of shock.',
    correctUnderstanding: 'Focused ultrasound and dynamic tests require correct acquisition, '
      + 'interpretation in context, and awareness of technical and physiologic limitations.',
    briefIn: ['undifferentiated-shock'],
  },
  {
    id: 'no-shock-etiology-definitive-treatment-or-outcome',
    headline: 'The vignette does not diagnose the cause of shock or model definitive treatment, vasopressors, procedures, deterioration, or outcome.',
    simplification: 'The lesson ends after one bounded fluid response and explicit escalation; '
      + 'the unresolved etiology and all subsequent care remain outside the state transition.',
    whereItMisleads: 'Treating the fluid response as proof of diagnosis, continuing fluid without '
      + 'a target, delaying source control or other definitive care, or assuming improvement means recovery.',
    correctUnderstanding: 'Resuscitation and etiologic workup proceed together. Real care requires '
      + 'repeated perfusion assessment, targeted support, timely definitive treatment, and escalation.',
    briefIn: ['undifferentiated-shock'],
  },
  {
    id: 'sepsis-findings-and-results-are-authored',
    headline: 'The infection clues, organ dysfunction, perfusion findings, lactate, and post-fluid state are fixed teaching facts.',
    simplification: 'Controls reveal one authored presentation and reassessment without examination '
      + 'technique, diagnostic uncertainty, sampling error, contamination, evolving illness, or competing data.',
    whereItMisleads: 'Treating the case as a sepsis screen or diagnostic test, assuming one pattern '
      + 'is typical of every patient, or generalizing its response to a real person.',
    correctUnderstanding: 'Sepsis is a clinical diagnosis requiring repeated patient-specific '
      + 'assessment, diagnostic evaluation, source investigation, and revision as evidence changes.',
    briefIn: ['septic-shock'],
  },
  {
    id: 'sepsis-treatment-controls-record-bounded-intent',
    headline: 'Cultures, antimicrobials, crystalloid, norepinephrine, and source control are bounded teaching intents.',
    simplification: 'The vignette records a guideline-shaped sequence and supplies only a generic '
      + 'fluid and vasopressor teaching response. It does not perform real orders, delivery, or procedures.',
    whereItMisleads: 'Reading a button as an order, using the interface to select a drug or dose, '
      + 'or assuming intent proves timely, safe, or effective treatment.',
    correctUnderstanding: 'Real treatment requires allergy and medication reconciliation, local '
      + 'microbiology and protocols, appropriate access and monitoring, trained teams, and frequent reassessment.',
    briefIn: ['septic-shock'],
  },
  {
    id: 'no-sepsis-pathogen-procedure-dose-or-outcome',
    headline: 'The vignette does not identify a pathogen, choose an antimicrobial, provide a vasopressor dose, perform source control, or predict outcome.',
    simplification: 'A probable urinary source and persistent shock close at escalation; definitive '
      + 'diagnosis, imaging, drainage, consultation, adverse effects, deterioration, and disposition are absent.',
    whereItMisleads: 'Assuming the suspected source is confirmed, copying a treatment value to a '
      + 'real patient, delaying local escalation, or inferring recovery from a directional monitor response.',
    correctUnderstanding: 'Resuscitation, antimicrobial stewardship, source diagnosis and control, '
      + 'organ support, monitoring, and prognosis are patient- and system-specific continuing processes.',
    briefIn: ['septic-shock'],
  },
  {
    id: 'trauma-findings-and-source-are-authored',
    headline: 'The mechanism, pelvic injury pattern, perfusion findings, lactate, and concealed bleeding source are fixed teaching facts.',
    simplification: 'A click reveals one authored presentation without examination technique, '
      + 'diagnostic uncertainty, competing injuries, measurement error, imaging, or evolving anatomy.',
    whereItMisleads: 'Treating the case as a diagnostic test, assuming an unstable pelvis is the '
      + 'only bleeding source, or generalizing this response to an individual patient.',
    correctUnderstanding: 'Traumatic shock requires repeated patient-specific assessment that '
      + 'integrates mechanism, anatomy, physiology, response, and concurrent threats.',
    briefIn: ['hemorrhagic-shock'],
  },
  {
    id: 'trauma-control-and-major-hemorrhage-actions-are-intents',
    headline: 'Pelvic stabilization, major-hemorrhage activation, monitoring, and definitive-control escalation are bounded teaching intents.',
    simplification: 'The vignette records a guideline-shaped response and a fixed 2-unit red-cell '
      + 'bridge. It does not place a device, activate a real team, order products, or stop bleeding.',
    whereItMisleads: 'Reading a button as a procedure or protocol, assuming intent proves correct '
      + 'execution, or delaying definitive control until resuscitation is complete.',
    correctUnderstanding: 'Bleeding control and damage-control resuscitation proceed in parallel '
      + 'through trained teams, local systems, appropriate monitoring, and frequent reassessment.',
    briefIn: ['hemorrhagic-shock'],
  },
  {
    id: 'no-trauma-protocol-procedure-ratio-or-outcome',
    headline: 'The vignette does not teach a trauma protocol, perform a procedure, prescribe component ratios, or predict outcome.',
    simplification: 'TXA, calcium, plasma, platelets, fibrinogen replacement, warming delivery, '
      + 'imaging, packing, embolization, operation, transport, and subsequent transfusion are absent.',
    whereItMisleads: 'Copying a product sequence to a real patient, treating red cells as source '
      + 'control, ignoring local protocols, or inferring recovery from a directional monitor response.',
    correctUnderstanding: 'Real hemorrhage care is patient-, injury-, time-, inventory-, and '
      + 'system-specific, with local massive-hemorrhage protocols and immediate control capability.',
    briefIn: ['hemorrhagic-shock'],
  },
  {
    id: 'status-epilepticus-pattern-and-response-are-bounded',
    headline: 'Seizure duration, visible convulsions, vital signs, glucose, and treatment response are fixed teaching facts, not diagnostic measurements or individual predictions.',
    simplification: 'One authored adult has generalized convulsive activity beyond 5 minutes, fixed '
      + 'heart-rate, respiratory-rate, oxygen-saturation, and glucose observations, and cessation '
      + 'of the visible seizure signal after one fixed lorazepam action. Consciousness, EEG '
      + 'activity, neurologic injury, and drug kinetics are absent.',
    whereItMisleads: 'Treating the screen as seizure recognition, EEG interpretation, a guarantee '
      + 'of benzodiazepine response, or evidence that convulsive cessation ends the emergency.',
    correctUnderstanding: 'Status epilepticus is time-critical and patient-specific. Reassess '
      + 'airway, ventilation, circulation, glucose, visible and electrographic seizure activity, '
      + 'treatment response, and etiology continuously.',
    briefIn: [],
  },
  {
    id: 'status-epilepticus-controls-are-screen-proxies',
    headline: 'Buttons record stabilization and medication actions; they cannot teach physical seizure care, airway skill, access, glucose testing, or drug delivery.',
    simplification: 'The interface records injury protection, positioning, suction readiness, '
      + 'oxygen, monitoring, access, help, glucose, and a fixed 4 mg IV lorazepam action without '
      + 'performing or assessing any physical task.',
    whereItMisleads: 'Equating ordered button use with competent resuscitation, medication safety, '
      + 'airway management, or team performance.',
    correctUnderstanding: 'These are psychomotor, medication, and team skills requiring local '
      + 'protocols, trained people, functioning equipment, supervised practice, and bedside reassessment.',
    briefIn: [],
  },
  {
    id: 'no-status-second-line-eeg-cause-airway-recurrence-or-outcome',
    headline: 'The case stops after first-line treatment and reassessment; second-line therapy, EEG, airway procedures, etiology, recurrence, disposition, and outcome are outside it.',
    simplification: 'The lesson names the persistent-or-recurrent seizure escalation boundary but '
      + 'does not stock alternate benzodiazepines, repeat doses, fosphenytoin, levetiracetam, '
      + 'valproate, anesthetic infusions, or diagnostic and critical-care pathways.',
    whereItMisleads: 'Delaying second-line treatment, assuming visible seizure cessation proves '
      + 'electrographic resolution, or treating initial response as completion of care.',
    correctUnderstanding: 'Persistent or recurrent status requires prompt protocol-based '
      + 'escalation, continued airway and physiologic support, EEG when indicated, etiologic '
      + 'evaluation and treatment, and appropriate critical care.',
    briefIn: [],
  },
  {
    id: 'acute-ischemic-stroke-findings-and-eligibility-are-authored',
    headline: 'The deficit, last-known-well time, glucose, blood pressure, imaging, and eligibility findings are authored facts, not acquired or adjudicated clinical data.',
    simplification: 'One fixed adult has disabling aphasia and right weakness, a 70-minute clock, '
      + 'glucose 112 mg/dL, BP 168/94 mmHg, no hemorrhage on authored CT, a left M1 occlusion on '
      + 'authored CTA, and no authored thrombolysis contraindication.',
    whereItMisleads: 'Treating the vignette as neurologic examination, stroke scoring, image '
      + 'interpretation, blood-pressure management, or proof that a real patient is eligible for reperfusion.',
    correctUnderstanding: 'Real eligibility requires a rapid expert history and examination, '
      + 'verified timing, glucose and pressure assessment, appropriate imaging, contraindication '
      + 'review, and local stroke-system judgment.',
    briefIn: ['acute-ischemic-stroke'],
  },
  {
    id: 'acute-ischemic-stroke-controls-are-screen-proxies',
    headline: 'Stroke-system, thrombolysis, transfer, surveillance, and handoff buttons record teaching intents; they do not perform care.',
    simplification: 'The interface records parallel workflow and one fixed local-protocol 20 mg IV '
      + 'tenecteplase intent for an authored 80 kg patient without activating a real team, acquiring '
      + 'access or imaging, preparing medication, arranging transport, or assessing execution.',
    whereItMisleads: 'Equating an ordered button sequence with competent examination, medication '
      + 'safety, team coordination, transport, procedure selection, or handoff performance.',
    correctUnderstanding: 'These tasks require trained teams, local protocols, functioning systems, '
      + 'real-time communication, supervised procedural skill, and continuous bedside reassessment.',
    briefIn: ['acute-ischemic-stroke'],
  },
  {
    id: 'no-live-stroke-score-imaging-drug-procedure-reperfusion-complication-or-outcome',
    headline: 'The case does not calculate a live stroke score, interpret imaging, deliver a drug, perform thrombectomy, model reperfusion, or predict complications or outcome.',
    simplification: 'Deficits remain authored after the treatment intent. No alteplase branch, '
      + 'extended-window selection, blood-pressure intervention, hemorrhage, angioedema, infarct '
      + 'evolution, vessel recanalization, procedure, post-reperfusion care, disposition, or prognosis is modeled.',
    whereItMisleads: 'Assuming the fixed dose is universally preferred, waiting for a modeled '
      + 'response before thrombectomy transfer, or inferring improvement, safety, reperfusion, or outcome.',
    correctUnderstanding: 'Agent choice and reperfusion pathways follow current guidelines and '
      + 'local protocols. Eligible large-vessel-occlusion care proceeds urgently, with surveillance '
      + 'and definitive treatment continuing beyond this vignette.',
    briefIn: ['acute-ischemic-stroke'],
  },
  {
    id: 'ich-findings-deterioration-and-response-are-authored',
    headline: 'The neurologic change, airway status, pressure, glucose, CT, anticoagulant history, and INR are authored facts, not acquired findings.',
    simplification: 'One fixed adult has decreasing eye opening and coherent speech, BP 202/112 '
      + 'mmHg, glucose 126 mg/dL, a 28 mL right thalamic hemorrhage with intraventricular extension '
      + 'and early hydrocephalus, warfarin exposure, and INR 3.2.',
    whereItMisleads: 'Treating the screen as neurologic examination, consciousness scoring, airway '
      + 'assessment, CT interpretation, expansion prediction, or coagulopathy diagnosis.',
    correctUnderstanding: 'Real deterioration requires repeated expert neurologic and whole-patient '
      + 'assessment, verified medication and laboratory data, appropriate imaging, and continuous monitoring.',
    briefIn: ['intracranial-hemorrhage-deterioration'],
  },
  {
    id: 'ich-reversal-pressure-and-transfer-controls-are-screen-proxies',
    headline: 'Reversal, pressure-control, airway-readiness, transfer, and handoff buttons record teaching intents; they do not perform care.',
    simplification: 'The interface records stopping warfarin, urgent 4-factor PCC plus IV vitamin K '
      + 'intent, one bounded pressure strategy, and specialist transfer without selecting a dose, '
      + 'delivering treatment, or arranging transport.',
    whereItMisleads: 'Equating ordered buttons with competent reversal dosing, infusion titration, '
      + 'airway management, team coordination, neurosurgical selection, or handoff performance.',
    correctUnderstanding: 'These actions require current local protocols, trained teams, pharmacy '
      + 'and specialist support, functioning equipment, supervised skills, and bedside reassessment.',
    briefIn: ['intracranial-hemorrhage-deterioration'],
  },
  {
    id: 'no-live-ich-exam-imaging-drug-airway-procedure-expansion-or-outcome',
    headline: 'The case does not examine the patient, interpret imaging, dose or deliver reversal, manage an airway, drain hydrocephalus, evacuate blood, or model outcome.',
    simplification: 'No alternative anticoagulant branch, serial CT, INR correction, pressure '
      + 'response, cerebral perfusion, herniation, seizure, thrombosis, ventricular drain, surgery, '
      + 'critical-care course, disposition, or prognosis is modeled.',
    whereItMisleads: 'Assuming the fixed pressure boundary fits every hemorrhage, inferring that '
      + 'recorded intent stops expansion, or delaying airway or neurosurgical action for a screen response.',
    correctUnderstanding: 'ICH care is patient-, trajectory-, anticoagulant-, and system-specific. '
      + 'Reversal, smooth pressure control, airway support when needed, and specialist escalation '
      + 'proceed urgently with serial reassessment.',
    briefIn: ['intracranial-hemorrhage-deterioration'],
  },
  {
    id: 'dka-diagnosis-panels-and-response-are-authored',
    headline: 'The DKA symptoms, volume status, biochemical panels, precipitant, and treatment course are authored facts, not acquired measurements or individual predictions.',
    simplification: 'One fixed adult has moderate DKA, hypokalemia, dehydration, and a kinked '
      + 'insulin set, followed by fixed potassium, unresolved-treatment, and resolution panels.',
    whereItMisleads: 'Treating the screen as examination, glucose or ketone testing, blood-gas or '
      + 'electrolyte interpretation, severity assignment, precipitant diagnosis, or response prediction.',
    correctUnderstanding: 'Real DKA requires repeated whole-patient assessment, direct plasma '
      + 'ketone and venous acid-base testing, electrolytes, renal function, glucose, and precipitant evaluation.',
    briefIn: ['diabetic-ketoacidosis'],
  },
  {
    id: 'dka-fluid-potassium-insulin-dextrose-and-transition-controls-are-proxies',
    headline: 'Fluid, potassium, insulin, dextrose, monitoring, and transition buttons record teaching intents; they do not prescribe or deliver treatment.',
    simplification: 'The interface enforces a guideline-shaped order without choosing patient-specific '
      + 'fluid volumes, electrolyte doses, insulin rates, dextrose concentration, access, pumps, or overlap timing.',
    whereItMisleads: 'Equating ordered buttons with competent prescribing, compounding, infusion '
      + 'management, laboratory surveillance, device repair, education, or handoff performance.',
    correctUnderstanding: 'Use current local protocols, trained teams, functioning equipment, '
      + 'frequent verified measurements, bedside reassessment, and supervised medication skills.',
    briefIn: ['diabetic-ketoacidosis'],
  },
  {
    id: 'no-live-dka-labs-infusion-electrolyte-fluid-complication-or-outcome',
    headline: 'The case does not run live labs, calculate fluid or electrolyte deficits, deliver infusions, model clearance, manage complications, or predict outcome.',
    simplification: 'Mixed DKA-HHS, euglycemic DKA, pregnancy, kidney or heart failure, infection, '
      + 'bicarbonate and phosphate branches, hypoglycemia, arrhythmia, edema, thrombosis, acute kidney '
      + 'injury, disposition, recurrence, and prognosis are absent.',
    whereItMisleads: 'Copying the fixed values to another patient, using anion gap or urine ketones '
      + 'alone for resolution, stopping insulin at glucose improvement, or assuming transition is complete.',
    correctUnderstanding: 'DKA treatment is patient- and protocol-specific. Continue serial potassium, '
      + 'glucose, plasma ketone, acid-base, renal, fluid, and precipitant management through safe transition.',
    briefIn: ['diabetic-ketoacidosis'],
  },
  {
    id: 'hyperkalemia-potassium-ecg-and-response-are-authored',
    headline: 'The potassium, ECG pattern, glucose, kidney findings, drivers, and treatment response are authored facts, not acquired measurements or predictions.',
    simplification: 'One fixed adult has confirmed potassium 7.1 mmol/L, authored ECG toxicity, '
      + 'CKD, dehydration, medication drivers, fixed ECG stabilization, and a fixed 1-hour panel.',
    whereItMisleads: 'Treating the screen as specimen validation, laboratory or ECG interpretation, '
      + 'cause diagnosis, arrhythmia assessment, or prediction of calcium or shifting response.',
    correctUnderstanding: 'Real severe hyperkalemia requires immediate whole-patient assessment, '
      + 'verified potassium and glucose, 12-lead ECG, continuous rhythm monitoring, renal data, and serial reassessment.',
    briefIn: ['hyperkalemia-with-ecg-change'],
  },
  {
    id: 'hyperkalemia-calcium-shift-removal-and-monitoring-controls-are-proxies',
    headline: 'Calcium, shifting, removal, cause-control, glucose-monitoring, and reassessment buttons record intents; they do not prescribe or deliver treatment.',
    simplification: 'The interface enforces protect, shift, remove, monitor, and prevent steps without '
      + 'choosing calcium salt or dose, insulin-glucose formulation, beta-agonist dose, binder, diuresis, or dialysis.',
    whereItMisleads: 'Equating ordered buttons with competent IV access, prescribing, delivery, ECG '
      + 'reassessment, hypoglycemia prevention, renal replacement selection, or team performance.',
    correctUnderstanding: 'Use current local protocols, trained teams, verified access and equipment, '
      + 'continuous monitoring, renal expertise, and frequent potassium and glucose checks.',
    briefIn: ['hyperkalemia-with-ecg-change'],
  },
  {
    id: 'no-live-hyperkalemia-ecg-labs-dosing-dialysis-rebound-or-outcome',
    headline: 'The case does not read ECGs, run labs, select doses, deliver drugs, model potassium movement, perform dialysis, or predict rebound or outcome.',
    simplification: 'Pseudohyperkalemia workup, alternate ECG patterns, arrest, acidosis treatment, '
      + 'fluid and urine response, hypoglycemia, repeat calcium, binders, diuretics, dialysis access, '
      + 'later potassium, recurrence, disposition, and prognosis are absent.',
    whereItMisleads: 'Assuming calcium lowers potassium, treating a temporary shift as removal, '
      + 'stopping surveillance after one improved panel, or transferring fixed responses to another patient.',
    correctUnderstanding: 'Membrane protection is temporary and does not lower potassium. Shifting '
      + 'must be paired with removal, driver control, serial ECG, potassium and glucose monitoring, and rebound planning.',
    briefIn: ['hyperkalemia-with-ecg-change'],
  },
  {
    id: 'hyponatremia-neurologic-laboratory-and-response-panels-are-authored',
    headline: 'The seizure, alertness, sodium, glucose, osmolality, urine output, contributors, and first-hour response are authored facts, not acquired findings or predictions.',
    simplification: 'One fixed adult has a witnessed seizure, persistent somnolence, sodium 112 '
      + 'mmol/L, glucose 96 mg/dL, measured osmolality 238 mOsm/kg, chlorthalidone exposure, and a '
      + 'fixed first-hour sodium 117 mmol/L panel with improved alertness and rising urine output.',
    whereItMisleads: 'Treating the screen as neurologic examination, specimen validation, laboratory '
      + 'interpretation, volume assessment, etiologic diagnosis, or prediction of hypertonic-saline response.',
    correctUnderstanding: 'Real severe symptomatic hyponatremia requires repeated whole-patient '
      + 'assessment, verified serum sodium, glucose and tonicity, close neurologic observation, urine '
      + 'monitoring, serial labs, and urgent exclusion and treatment of concurrent emergencies.',
    briefIn: ['severe-hyponatremia-with-seizure'],
  },
  {
    id: 'hyponatremia-stabilization-hypertonic-monitoring-and-cause-controls-are-proxies',
    headline: 'Stabilization, hypertonic-saline, monitoring, cause-control, and overcorrection buttons record teaching intents; they do not prescribe or deliver care.',
    simplification: 'The interface enforces a symptom-led rescue and surveillance order without '
      + 'choosing a regional saline concentration or bolus, obtaining access, delivering fluid, '
      + 'performing an airway intervention, treating seizure, or managing a water diuresis.',
    whereItMisleads: 'Equating ordered buttons with competent examination, access, prescribing, '
      + 'infusion, airway or seizure care, serial testing, volume classification, consultation, or rescue skill.',
    correctUnderstanding: 'Use current local protocols, trained teams, a close-monitoring setting, '
      + 'verified measurements, specialist support, and repeated bedside assessment throughout rescue and correction.',
    briefIn: ['severe-hyponatremia-with-seizure'],
  },
  {
    id: 'no-live-hyponatremia-exam-labs-dosing-correction-cause-rescue-or-outcome',
    headline: 'The case does not examine the patient, run labs, select or deliver a bolus, model sodium correction, diagnose the cause, reverse overcorrection, or predict outcome.',
    simplification: 'Alternate acute and chronic causes, pseudohyponatremia, hyperosmolar states, '
      + 'adrenal or thyroid emergencies, hypokalemia, alcohol use, malnutrition, liver disease, '
      + 'osmotic demyelination, airway deterioration, recurrent seizure, disposition, and prognosis are absent.',
    whereItMisleads: 'Copying fixed values or ceilings without the patient and regional protocol, '
      + 'chasing a normal sodium, assuming one improved panel ends risk, or waiting for the simulator '
      + 'instead of acting on recurrent symptoms or accelerating correction.',
    correctUnderstanding: 'The immediate goal is relief of dangerous cerebral edema with a small '
      + 'controlled rise, followed by patient-specific correction limits, cause treatment, serial '
      + 'sodium and urine monitoring, and prompt specialist action if correction accelerates.',
    briefIn: ['severe-hyponatremia-with-seizure'],
  },
  {
    id: 'opioid-toxicity-pattern-response-and-recurrence-are-authored',
    headline: 'The exposure, pulse, breathing, oxygenation, carbon dioxide, pupils, glucose, initial response, and recurrence are authored facts, not acquired findings or predictions.',
    simplification: 'One fixed adult has reported fentanyl exposure, a definite pulse, respirations '
      + '4/min, SpO₂ 78%, end-tidal CO₂ 68 mmHg, pinpoint pupils, and normal glucose, followed by '
      + 'fixed initial improvement and recurrent respiratory depression at 25 minutes.',
    whereItMisleads: 'Treating the screen as examination, pulse confirmation, capnography or glucose '
      + 'acquisition, opioid diagnosis, co-exposure exclusion, or prediction of ventilation or naloxone response.',
    correctUnderstanding: 'Real suspected opioid poisoning requires immediate whole-patient and '
      + 'airway assessment, pulse and breathing confirmation, standard resuscitation, verified '
      + 'monitoring, glucose review, repeated reassessment, and an open differential.',
    briefIn: ['opioid-toxicity'],
  },
  {
    id: 'opioid-ventilation-antagonist-monitoring-and-handoff-controls-are-proxies',
    headline: 'Airway, ventilation, naloxone, monitoring, recurrence, observation, and discharge-safety buttons record intents; they do not perform care.',
    simplification: 'The interface enforces breathing support before waiting for antagonist effect '
      + 'and keeps recurrence visible without opening an airway, ventilating, selecting a product, '
      + 'route or dose, delivering medication, monitoring a patient, or dispensing take-home naloxone.',
    whereItMisleads: 'Equating ordered buttons with competent airway or bag-mask technique, dose '
      + 'titration, access, monitoring, withdrawal management, counseling, treatment linkage, or discharge skill.',
    correctUnderstanding: 'Use current protocols, trained teams, effective ventilation, verified '
      + 'monitoring, repeated antagonist when indicated, health care observation, harm-reduction '
      + 'resources, and patient-centered substance-use treatment pathways.',
    briefIn: ['opioid-toxicity'],
  },
  {
    id: 'no-live-opioid-exam-airway-drug-coexposure-recurrence-disposition-or-outcome',
    headline: 'The case does not examine the patient, confirm a pulse, ventilate, deliver an antagonist, model drug effects, diagnose co-exposure, determine observation, or predict outcome.',
    simplification: 'Alternate opioids, dose and route, mixed sedatives or stimulants, head injury, '
      + 'stroke, seizure, hypoglycemia, aspiration, pulmonary edema, severe withdrawal, agitation, '
      + 'cardiac arrest, pregnancy, later recurrence, disposition, and prognosis are absent.',
    whereItMisleads: 'Withholding ventilation while waiting for naloxone, demanding full arousal, '
      + 'assuming a response proves opioid-only toxicity, treating one improvement as durable, or '
      + 'copying the fixed 25-minute recurrence to another patient.',
    correctUnderstanding: 'Support ventilation immediately, give an opioid antagonist without '
      + 'interrupting standard resuscitation, target normal breathing, keep other causes open, and '
      + 'observe until consciousness and vital signs are normal and recurrence risk is low.',
    briefIn: ['opioid-toxicity'],
  },
  {
    id: 'heat-stroke-temperature-neurologic-cooling-and-organ-panels-are-authored',
    headline: 'The exertion, neurologic state, rectal temperature, glucose, sodium, cooling response, and organ-surveillance panel are authored facts, not acquired findings or predictions.',
    simplification: 'One fixed runner has confusion and rectal core temperature 41.3°C with normal '
      + 'glucose and sodium, followed by a fixed 14-minute 38.9°C panel and a declared multiorgan '
      + 'surveillance handoff.',
    whereItMisleads: 'Treating the screen as neurologic examination, rectal measurement, glucose or '
      + 'sodium testing, exclusion of mimics, or prediction of cooling rate, response, or organ injury.',
    correctUnderstanding: 'Real heat stroke requires immediate whole-patient assessment, reliable '
      + 'core-temperature measurement when available, rapid active cooling, continuous monitoring, '
      + 'repeat examination, and serial laboratory and organ-function review.',
    briefIn: ['exertional-heat-stroke'],
  },
  {
    id: 'heat-stroke-support-immersion-monitoring-and-handoff-controls-are-proxies',
    headline: 'Support, clothing removal, immersion, monitoring, cooling-stop, transport, and surveillance buttons record intents; they do not perform care.',
    simplification: 'The interface enforces a rapid-cooling sequence without examining the patient, '
      + 'removing clothing, opening an airway, immersing safely, choosing water temperature, measuring '
      + 'cooling rate, preventing aspiration, transporting, drawing labs, or treating complications.',
    whereItMisleads: 'Equating ordered buttons with competent resuscitation, immersion safety, core '
      + 'monitoring, cooling logistics, fluid care, transport coordination, or critical-care management.',
    correctUnderstanding: 'Use current protocols, trained teams, the fastest safe available cooling '
      + 'method, preserved airway access, continuous core monitoring, coordinated transfer, and '
      + 'ongoing organ-support capability.',
    briefIn: ['exertional-heat-stroke'],
  },
  {
    id: 'no-live-heat-stroke-exam-cooling-fluids-labs-complications-transport-or-outcome',
    headline: 'The case does not examine, measure, cool, give fluids, run labs, treat complications, coordinate real transport, or predict outcome.',
    simplification: 'Classic heat stroke, exercise-associated hyponatremia, hypoglycemia, infection, '
      + 'stimulants, serotonin toxicity, malignant hyperthermia, seizures, shock, liver failure, '
      + 'kidney injury, rhabdomyolysis, coagulopathy, cerebral edema, disposition, and prognosis are absent.',
    whereItMisleads: 'Waiting for a modeled response, using antipyretics or dantrolene, delaying rapid '
      + 'cooling for transport, continuing cooling below the stop target, or assuming temperature '
      + 'improvement excludes delayed organ injury.',
    correctUnderstanding: 'Heat stroke is a time-critical hyperthermia emergency. Cool rapidly, stop '
      + 'near the guideline target to avoid overshoot, and continue serial neurologic and multiorgan '
      + 'surveillance after the temperature improves.',
    briefIn: ['exertional-heat-stroke'],
  },
  {
    id: 'trauma-findings-interventions-and-reassessment-are-authored',
    headline: 'The mechanism, injuries, examination findings, vital signs, imaging statement, intervention effects, and repeated survey are authored facts, not acquired findings or predictions.',
    simplification: 'One fixed adult has a catastrophic limb bleed after failed pressure, patent '
      + 'airway, bilateral breathing, shock, unstable-pelvis pattern, confusion, and hypothermia, '
      + 'followed by fixed intervention and repeated-survey panels.',
    whereItMisleads: 'Treating the screen as trauma examination, spinal assessment, pulse or pressure '
      + 'confirmation, bleeding-source diagnosis, FAST interpretation, or prediction of response or injury.',
    correctUnderstanding: 'Real major trauma requires rapid repeated whole-patient examination, '
      + 'verified monitoring, immediate threat treatment, senior trauma leadership, and direct '
      + 'definitive-control planning as findings evolve.',
    briefIn: ['trauma-primary-survey'],
  },
  {
    id: 'trauma-survey-hemorrhage-airway-pelvis-imaging-and-handoff-controls-are-proxies',
    headline: 'Survey, hemorrhage, airway, breathing, pelvis, blood, imaging, warming, repeat, and handoff buttons record intents; they do not perform care.',
    simplification: 'The interface enforces a <C>ABCDE sequence without applying pressure or a '
      + 'tourniquet, stabilizing the spine, examining or supporting an airway or chest, obtaining '
      + 'access, delivering blood or drugs, binding a pelvis, imaging, warming, or transferring.',
    whereItMisleads: 'Equating ordered buttons with competent examination, procedure, resuscitation, '
      + 'imaging, team leadership, communication, transfer, or definitive-control performance.',
    correctUnderstanding: 'Use current regional trauma and hemorrhage protocols, trained teams, '
      + 'working equipment, repeated bedside assessment, explicit intervention times and trends, '
      + 'and direct surgical or interventional coordination.',
    briefIn: ['trauma-primary-survey'],
  },
  {
    id: 'no-live-trauma-exam-procedure-blood-imaging-definitive-control-transfer-or-outcome',
    headline: 'The case does not examine, stabilize, control bleeding, ventilate, deliver blood or drugs, image, operate, transfer, or predict outcome.',
    simplification: 'Alternate mechanisms, airway loss, tension pneumothorax, tamponade, traumatic '
      + 'brain or spinal injury, solid-organ injury, fractures, anticoagulation, pregnancy, arrest, '
      + 'coagulopathy, massive-transfusion complications, secondary survey, disposition, and prognosis are absent.',
    whereItMisleads: 'Fixating on the visible limb, skipping a currently stable A or B, treating FAST '
      + 'as exclusion, delaying control for whole-body CT, continuing survey instead of treating a '
      + 'new threat, or assuming one improved panel closes hemorrhage risk.',
    correctUnderstanding: 'Treat immediate threats as they are found, complete and repeat <C>ABCDE, '
      + 'minimize heat loss and nonessential delay, use imaging to direct rather than postpone '
      + 'intervention in instability, and move rapidly to definitive hemorrhage control.',
    briefIn: ['trauma-primary-survey'],
  },
  {
    id: 'aortic-presentation-asymmetry-and-response-are-authored',
    headline: 'The pain, ECG, bilateral pressures, pulses, limb perfusion, neurologic findings, timing, and treatment response are authored facts, not acquired findings or predictions.',
    simplification: 'One fixed adult progresses from abrupt pain with initially symmetric territories '
      + 'to a fixed inter-arm pressure difference, pulse deficits, cool limb, focal drift, and bounded response.',
    whereItMisleads: 'Treating the screen as examination, blood-pressure verification, vascular or '
      + 'neurologic diagnosis, ECG interpretation, malperfusion measurement, or prediction of evolution.',
    correctUnderstanding: 'Real acute aortic syndromes require repeated whole-patient examination, '
      + 'verified bilateral measurements, parallel dangerous-differential assessment, expert imaging, '
      + 'and immediate multidisciplinary management as findings evolve.',
    briefIn: ['acute-aortic-syndrome'],
  },
  {
    id: 'aortic-assessment-escalation-anti-impulse-and-imaging-controls-are-proxies',
    headline: 'Assessment, escalation, analgesia, anti-impulse, imaging, repeat, and handoff buttons record intents; they do not perform care.',
    simplification: 'The interface enforces a serial reasoning sequence without examining the patient, '
      + 'placing an arterial line, selecting or delivering medication, transporting, imaging, consulting, '
      + 'or handing off to a real team.',
    whereItMisleads: 'Equating ordered buttons with competent cardiovascular or neurologic examination, '
      + 'drug titration, perfusion protection, imaging selection, consultation, transfer, or team performance.',
    correctUnderstanding: 'Use current regional acute-aortic pathways, trained teams, continuous '
      + 'monitoring, patient-specific contraindication review, titration that preserves organ perfusion, '
      + 'and direct aortic-center coordination.',
    briefIn: ['acute-aortic-syndrome'],
  },
  {
    id: 'no-live-aortic-diagnosis-risk-score-drug-delivery-imaging-procedure-transfer-or-outcome',
    headline: 'The case does not diagnose, calculate a risk score, deliver drugs, image, operate, transfer, or predict outcome.',
    simplification: 'Rupture, tamponade, acute aortic regurgitation, coronary involvement, spinal, renal '
      + 'or mesenteric malperfusion, pregnancy, connective-tissue disease, contrast constraints, shock, '
      + 'arrest, alternate phenotypes, procedures, disposition, and prognosis are absent.',
    whereItMisleads: 'Excluding aortic disease after one symmetric exam, treating evolving deficits as '
      + 'isolated coronary or stroke disease, lowering pressure below organ perfusion, delaying escalation, '
      + 'or assuming imaging intent establishes anatomy or an operation.',
    correctUnderstanding: 'Keep dangerous alternatives open, repeat pulse, pressure, perfusion, and '
      + 'neurologic assessment, escalate new discordance immediately, reduce aortic wall stress while '
      + 'preserving organs, and obtain definitive imaging and surgical evaluation without avoidable delay.',
    briefIn: ['acute-aortic-syndrome'],
  },
  {
    id: 'ards-findings-settings-and-response-are-authored',
    headline: 'The ARDS context, gases, pressures, synchrony, circulation, settings, and response are authored facts, not measurements or predictions.',
    simplification: 'One fixed adult moves from a high plateau-pressure pattern to fixed protective-setting and reassessment panels.',
    whereItMisleads: 'Treating the screen as diagnosis, blood-gas sampling, ventilator measurement, mechanics, or individualized response prediction.',
    correctUnderstanding: 'Real ARDS care requires verified airway and ventilator data, serial whole-patient assessment, and individualized multidisciplinary management.',
    briefIn: ['ards-lung-protective-ventilation'],
  },
  {
    id: 'ards-ventilator-reassessment-peep-and-prone-controls-are-proxies',
    headline: 'Ventilator, reassessment, PEEP, oxygen, and prone buttons record intents; they do not perform ICU care.',
    simplification: 'The interface enforces an evidence-based sequence without programming equipment, measuring pressure, titrating support, or turning a patient.',
    whereItMisleads: 'Equating ordered controls with respiratory-therapy, ventilator, sedation, paralysis, proning, monitoring, or team competence.',
    correctUnderstanding: 'Use trained teams, verified equipment, current protocols, serial gas and mechanics review, and explicit device and hemodynamic safeguards.',
    briefIn: ['ards-lung-protective-ventilation'],
  },
  {
    id: 'no-live-ards-diagnosis-ventilator-management-proning-procedure-or-outcome',
    headline: 'The case does not diagnose ARDS, manage a ventilator, prone, perform procedures, select ECMO, or predict outcome.',
    simplification: 'Alternate lung and cardiac disease, dead space, auto-PEEP, chest-wall effects, contraindications, sedation, paralysis, fluids, and liberation are absent.',
    whereItMisleads: 'Using actual weight for tidal volume, normalizing gas values at the expense of protection, or treating a prone control as procedural skill.',
    correctUnderstanding: 'Base tidal volume on predicted body weight, limit inspiratory pressure, reassess the whole patient, and escalate with trained ICU teams.',
    briefIn: ['ards-lung-protective-ventilation'],
  },
  {
    id: 'escalating-hypoxemia-findings-and-response-are-authored',
    headline: 'The saturation trend, gas, equipment, airway, chest, pressure, circulation, and response panels are authored facts.',
    simplification: 'One fixed ventilated adult progresses through a reproducible decline, structured bedside panel, and 15-minute reassessment.',
    whereItMisleads: 'Treating the screen as signal validation, examination, measurement, diagnosis, or an individualized response prediction.',
    correctUnderstanding: 'Real deterioration requires immediate support, verified signals and equipment, direct examination, serial data, and expert reassessment.',
    briefIn: ['escalating-hypoxemia'],
  },
  {
    id: 'escalating-hypoxemia-equipment-airway-and-examination-controls-are-proxies',
    headline: 'Source, circuit, capnography, tube, suction-path, chest, and support buttons record intents; they do not perform ICU care.',
    simplification: 'The interface enforces an outside-in reasoning sequence without touching equipment, passing a catheter, examining the chest, or delivering oxygen.',
    whereItMisleads: 'Equating ordered buttons with respiratory-therapy, airway, ventilator, examination, troubleshooting, rescue, or team competence.',
    correctUnderstanding: 'Use trained teams, continuous monitoring, verified backup oxygenation, equipment-specific checks, and direct airway and chest assessment.',
    briefIn: ['escalating-hypoxemia'],
  },
  {
    id: 'no-live-hypoxemia-diagnosis-ventilator-management-procedure-or-outcome',
    headline: 'The case does not diagnose hypoxemia, manage a ventilator, perform rescue procedures, or predict outcome.',
    simplification: 'Tube and circuit intermittency, pneumothorax, embolism, edema, atelectasis, infection, bronchospasm, shunt severity, recruitment, and advanced rescue remain unresolved.',
    whereItMisleads: 'Assuming a passed check excludes danger, copying the fixed response, or delaying imaging, direct reassessment, or escalation.',
    correctUnderstanding: 'Support oxygenation, search systematically, keep dangerous alternatives open, obtain indicated tests, and individualize support with the ICU team.',
    briefIn: ['escalating-hypoxemia'],
  },
  {
    id: 'dyssynchrony-patient-graphics-drivers-and-response-are-authored',
    headline: 'The effort, graphics, mechanics, driver, classification, and response panels are authored facts.',
    simplification: 'One fixed adult has a reproducible flow-starvation and premature-cycling pattern with double triggering and a fixed 10-minute response.',
    whereItMisleads: 'Treating the screen as physical assessment, waveform acquisition, phenotype diagnosis, or individualized response prediction.',
    correctUnderstanding: 'Real dyssynchrony requires direct patient assessment, ventilator graphics and mechanics, airway and equipment checks, and serial expert interpretation.',
    briefIn: ['ventilator-dyssynchrony'],
  },
  {
    id: 'dyssynchrony-waveform-ventilator-and-analgesia-controls-are-proxies',
    headline: 'Patient, waveform, driver, analgesia, flow, cycling, and reassessment buttons record intents; they do not perform care.',
    simplification: 'The interface enforces a reasoning sequence without examining the patient, acquiring graphics, programming a ventilator, or delivering analgesia.',
    whereItMisleads: 'Equating ordered controls with respiratory-therapy, waveform, ventilator, airway, pain, sedation, prescribing, or team competence.',
    correctUnderstanding: 'Use trained bedside teams, validated assessment, equipment-specific graphics and mechanics, cause-directed care, and explicit lung-protection safeguards.',
    briefIn: ['ventilator-dyssynchrony'],
  },
  {
    id: 'no-live-dyssynchrony-diagnosis-ventilator-prescribing-procedure-or-outcome',
    headline: 'The case does not diagnose dyssynchrony, prescribe drugs, program a ventilator, perform procedures, or predict outcome.',
    simplification: 'Trigger, cycling, reverse-trigger, ineffective-effort, auto-PEEP, obstructive, neurologic, metabolic, airway, device, sedation, and disease phenotypes are incomplete.',
    whereItMisleads: 'Assuming one graphic proves a mechanism, copying an adjustment, or using deep sedation or paralysis as a generic waveform treatment.',
    correctUnderstanding: 'Name the phase and likely mechanism, treat reversible drivers, preserve lung protection, adjust support with the ICU team, and reassess the patient and delivered breath.',
    briefIn: ['ventilator-dyssynchrony'],
  },
  {
    id: 'auto-peep-flow-mechanics-and-response-are-authored',
    headline: 'The flow, timing, pressure, hold, gas, circulation, and response panels are authored facts.',
    simplification: 'One fixed adult has reproducible obstructive dynamic hyperinflation, a valid passive hold, and a fixed 10-minute response.',
    whereItMisleads: 'Treating the screen as physical assessment, waveform or mechanics acquisition, diagnosis, or individualized response prediction.',
    correctUnderstanding: 'Real auto-PEEP assessment combines the patient, real-time graphics, valid mechanics, airway and equipment checks, gas exchange, and serial hemodynamics.',
    briefIn: ['auto-peep'],
  },
  {
    id: 'auto-peep-expiratory-hold-airway-and-ventilator-controls-are-proxies',
    headline: 'Flow review, expiratory hold, obstruction treatment, ventilator adjustment, and reassessment buttons record intents; they do not perform care.',
    simplification: 'The interface enforces a reasoning sequence without examining the patient, acquiring a waveform, occluding flow, manipulating equipment, or delivering treatment.',
    whereItMisleads: 'Equating ordered controls with respiratory-therapy, mechanics, airway, ventilator, prescribing, procedural, or team competence.',
    correctUnderstanding: 'Use trained bedside teams, equipment-specific graphics and mechanics, valid passive measurements, cause-directed care, and immediate reassessment.',
    briefIn: ['auto-peep'],
  },
  {
    id: 'no-live-auto-peep-diagnosis-ventilator-prescribing-procedure-or-outcome',
    headline: 'The case does not diagnose auto-PEEP, prescribe drugs, program a ventilator, perform procedures, or predict outcome.',
    simplification: 'Heterogeneous time constants, airway closure, active effort, alternate obstruction, pneumothorax, equipment faults, emergencies, and external-PEEP responses are incomplete.',
    whereItMisleads: 'Assuming one graphic or hold proves the mechanism, copying fixed settings, or applying external PEEP without checking flow limitation and response.',
    correctUnderstanding: 'Treat the cause, preserve expiratory time and lung protection, individualize support with the ICU team, and recheck the patient, graphics, mechanics, gas, and circulation.',
    briefIn: ['auto-peep'],
  },
  {
    id: 'mucus-plugging-findings-clearance-and-response-are-authored',
    headline: 'The secretion, sounds, graphics, mechanics, clearance, imaging, and response panels are authored facts.',
    simplification: 'One fixed adult has convergent retained-secretion indicators, partial central-airway improvement, and a persistent focal concern.',
    whereItMisleads: 'Treating the screen as examination, equipment inspection, waveform acquisition, secretion removal, imaging, diagnosis, or response prediction.',
    correctUnderstanding: 'Real assessment combines the patient, artificial airway, circuit, graphics, mechanics, gas exchange, circulation, retrieved material, and serial findings.',
    briefIn: ['mucus-plugging'],
  },
  {
    id: 'mucus-plugging-suction-imaging-and-airway-controls-are-proxies',
    headline: 'Oxygen, suction, imaging, and airway-evaluation buttons record intents; they do not perform care.',
    simplification: 'The interface enforces indication and reassessment without preoxygenating, suctioning, removing secretions, imaging, or performing bronchoscopy.',
    whereItMisleads: 'Equating ordered controls with airway, suction, respiratory-therapy, imaging, bronchoscopy, procedural, or team competence.',
    correctUnderstanding: 'Use trained teams, indicated equipment-specific clearance, complication safeguards, and immediate whole-patient reassessment.',
    briefIn: ['mucus-plugging'],
  },
  {
    id: 'no-live-mucus-plugging-diagnosis-suction-bronchoscopy-or-outcome',
    headline: 'The case does not diagnose mucus plugging, teach suction or bronchoscopy, or predict outcome.',
    simplification: 'Tube migration or obstruction, pneumothorax, atelectasis, consolidation, blood, foreign body, peripheral secretions, recurrence, and complications are incomplete.',
    whereItMisleads: 'Assuming one sign proves a plug, copying a suction technique, using routine saline, or treating bronchoscopy as routine secretion removal.',
    correctUnderstanding: 'Support oxygenation, establish an indication, clear the artificial airway safely, prove the response, and escalate unresolved focal physiology.',
    briefIn: ['mucus-plugging'],
  },
  {
    id: 'unplanned-extubation-findings-failure-and-response-are-authored',
    headline: 'The unplanned event, tolerance findings, failure classification, airway response, and handoff are authored facts.',
    simplification: 'One fixed adult deteriorates after tube displacement and then improves on a reported post-reintubation panel.',
    whereItMisleads: 'Treating the screen as examination, gas sampling, monitoring acquisition, diagnosis, airway confirmation, investigation, or response prediction.',
    correctUnderstanding: 'Real assessment integrates airway protection, work, oxygenation, ventilation, neurologic state, secretions, circulation, trend, and goals of care.',
    briefIn: ['unplanned-extubation'],
  },
  {
    id: 'unplanned-extubation-oxygen-airway-and-confirmation-controls-are-proxies',
    headline: 'Oxygenation, help, reintubation, and confirmation buttons record intents; they do not perform care.',
    simplification: 'The interface enforces an ordered cognitive response without delivering oxygen, ventilating, selecting drugs or equipment, intubating, or confirming placement.',
    whereItMisleads: 'Equating button order with airway, respiratory-therapy, critical-care, team, equipment, or procedural competence.',
    correctUnderstanding: 'Use trained teams, local emergency-airway systems, preoxygenation, hemodynamic preparation, backup planning, placement confirmation, and serial reassessment.',
    briefIn: ['unplanned-extubation'],
  },
  {
    id: 'no-live-unplanned-extubation-diagnosis-airway-procedure-or-outcome',
    headline: 'The case does not diagnose extubation failure, teach airway management, assign fault, or predict outcome.',
    simplification: 'Alternative tolerance trajectories, upper-airway obstruction, aspiration, arrest, difficult reintubation, NIV exceptions, goals-of-care limits, and complications are incomplete.',
    whereItMisleads: 'Automatically reintubating every event, delaying this failing airway with noninvasive support, copying an airway plan, or blaming one person.',
    correctUnderstanding: 'Support immediately, decide from the whole patient, act promptly when failure converges, prove the new airway, and learn from the system non-punitively.',
    briefIn: ['unplanned-extubation'],
  },
  {
    id: 'sbt-readiness-trial-failure-and-recovery-are-authored',
    headline: 'The readiness, trial, intolerance, recovery, and reversible-driver panels are authored facts.',
    simplification: 'One fixed adult appears ready for a trial, develops convergent intolerance at 30 minutes, and recovers after reported restoration of prior support.',
    whereItMisleads: 'Treating the screen as examination, monitoring acquisition, ventilator measurement, gas sampling, diagnosis, or response prediction.',
    correctUnderstanding: 'Real SBT assessment integrates the improving cause, patient, airway, breathing pattern, work, gas exchange, circulation, comfort, and trajectory.',
    briefIn: ['spontaneous-breathing-trial'],
  },
  {
    id: 'sbt-ventilator-assessment-and-support-controls-are-proxies',
    headline: 'Readiness, trial, support-restoration, and reassessment buttons record intents; they do not perform care.',
    simplification: 'The interface enforces an ordered cognitive rehearsal without programming a ventilator, changing oxygen, measuring, treating, or extubating.',
    whereItMisleads: 'Equating button order with respiratory-therapy, ventilator, airway, liberation, assessment, or team competence.',
    correctUnderstanding: 'Use a standardized local protocol, trained teams, continuous observation, explicit stop criteria, safe support restoration, and serial reassessment.',
    briefIn: ['spontaneous-breathing-trial'],
  },
  {
    id: 'no-live-sbt-prescribing-extubation-or-outcome',
    headline: 'The case does not prescribe an SBT method, decide extubation, treat failure, or predict outcome.',
    simplification: 'Alternative trial methods, durations, thresholds, disease trajectories, airway risk, secretion burden, neurologic limits, goals of care, and post-extubation support are incomplete.',
    whereItMisleads: 'Requiring RSBI, increasing FiO₂ to mask intolerance, pushing through failure, copying one threshold, or treating SBT success as extubation permission.',
    correctUnderstanding: 'Standardize readiness and method locally, keep FiO₂ visible, stop when intolerance converges, correct contributors, repeat assessment, and make a separate extubation decision.',
    briefIn: ['spontaneous-breathing-trial'],
  },
  {
    id: 'post-intubation-hypotension-findings-mechanism-and-response-are-authored',
    headline: 'The pressure, perfusion, danger, dynamic-response, mechanism, and support panels are authored facts.',
    simplification: 'One fixed septic adult develops severe hypotension after intubation, appears fluid responsive, and improves after a bounded support proxy.',
    whereItMisleads: 'Treating the screen as examination, pressure acquisition, equipment inspection, ultrasound, passive leg raise, diagnosis, or response prediction.',
    correctUnderstanding: 'Real assessment integrates signal validity, perfusion, airway and ventilation, timing, drugs, preload, tone, pump, obstruction, bleeding, allergy, and serial response.',
    briefIn: ['post-intubation-hypotension'],
  },
  {
    id: 'post-intubation-hypotension-fluid-vasopressor-and-assessment-controls-are-proxies',
    headline: 'Help, dynamic assessment, fluid, vasopressor, and reassessment buttons record intents; they do not perform care.',
    simplification: 'The interface enforces ordered reasoning without examining, performing a leg raise, choosing access or dose, administering fluid or drug, or changing ventilation.',
    whereItMisleads: 'Equating button order with hemodynamic, airway, respiratory-therapy, prescribing, procedural, equipment, or ICU competence.',
    correctUnderstanding: 'Use trained teams, immediate stabilization, cause-directed evaluation, individualized support, safe delivery systems, and frequent whole-patient reassessment.',
    briefIn: ['post-intubation-hypotension'],
  },
  {
    id: 'no-live-post-intubation-shock-diagnosis-prescribing-procedure-or-outcome',
    headline: 'The case does not diagnose shock, choose universal fluid or vasopressor therapy, perform procedures, or predict outcome.',
    simplification: 'Occult bleeding, pulmonary embolism, tension physiology, tamponade, pump failure, anaphylaxis, auto-PEEP, tube problems, drug effects, and septic trajectories are incomplete.',
    whereItMisleads: 'Assuming timing proves one cause, giving unbounded fluid, copying a vasopressor plan, or stopping alternate-cause review when pressure improves.',
    correctUnderstanding: 'Validate, stabilize, search rapidly, use dynamic and serial response to constrain support, and keep the underlying shock work open.',
    briefIn: ['post-intubation-hypotension'],
  },
  {
    id: 'cardiogenic-shock-findings-phenotype-and-response-are-authored',
    headline: 'The perfusion, ECG, echo, congestion, phenotype, and response panels are authored facts.',
    simplification: 'One fixed acute-MI patient has a congested LV-predominant shock pattern and a bounded early response.',
    whereItMisleads: 'Treating the screen as examination, monitoring, ECG or echo acquisition or interpretation, diagnosis, staging, or outcome prediction.',
    correctUnderstanding: 'Real shock care repeatedly integrates trajectory, perfusion, cause, ventricular phenotype, congestion, rhythm, invasive data when needed, and response.',
    briefIn: ['cardiogenic-shock'],
  },
  {
    id: 'cardiogenic-shock-support-and-revascularization-controls-are-proxies',
    headline: 'Team, support, revascularization, and reassessment buttons record intents; they do not perform care.',
    simplification: 'The interface enforces ordered reasoning without delivering oxygen or drugs, choosing access or dose, catheterizing, revascularizing, transferring, or placing support.',
    whereItMisleads: 'Equating button order with cardiovascular, critical-care, prescribing, imaging, catheterization, revascularization, device, or transfer competence.',
    correctUnderstanding: 'Use multidisciplinary shock systems, safe delivery, prompt cause control, and frequent phenotype- and trajectory-linked reassessment.',
    briefIn: ['cardiogenic-shock'],
  },
  {
    id: 'no-live-cardiogenic-shock-diagnosis-prescribing-device-procedure-or-outcome',
    headline: 'The case does not diagnose cardiogenic shock, prescribe a universal support target, select a device, perform revascularization, or predict outcome.',
    simplification: 'Mechanical complications, evolving right-heart or mixed shock, arrhythmia, bleeding, infection, and other causes remain incomplete.',
    whereItMisleads: 'Copying the bridge, withholding all fluid in every phenotype, choosing a routine device, or stopping evaluation when pressure improves.',
    correctUnderstanding: 'Stabilize perfusion, identify and treat the cause promptly, reassess serially, and individualize hemodynamic and temporary support with expert teams.',
    briefIn: ['cardiogenic-shock'],
  },
  {
    id: 'mixed-shock-findings-hemodynamics-and-response-are-authored',
    headline: 'The perfusion, cardiac, infection, catheter, phenotype, and response panels are authored facts.',
    simplification: 'One fixed post-MI patient with pneumonia has low output, high filling pressure, low vascular resistance, and a bounded early response.',
    whereItMisleads: 'Treating the screen as examination, catheter placement, monitoring or test acquisition, calculation, diagnosis, staging, or outcome prediction.',
    correctUnderstanding: 'Real mixed-shock assessment repeatedly integrates cause, output, filling pressure, vascular tone, treatment context, congestion, perfusion, and organ trajectory.',
    briefIn: ['mixed-shock'],
  },
  {
    id: 'mixed-shock-support-and-cause-control-actions-are-proxies',
    headline: 'Team, support, cause-control, and reassessment buttons record intents; they do not perform care.',
    simplification: 'The interface orders reasoning without delivering oxygen, fluid, or drugs, choosing access or dose, treating infection or ischemia, or placing support.',
    whereItMisleads: 'Equating button order with cardiac, critical-care, catheter, prescribing, infectious-disease, procedural, device, or transfer competence.',
    correctUnderstanding: 'Use multidisciplinary teams, safe delivery, parallel cause control, and frequent physiology- and trajectory-linked reassessment.',
    briefIn: ['mixed-shock'],
  },
  {
    id: 'right-ventricular-failure-findings-hemodynamics-and-response-are-authored',
    headline: 'The examination, echo, hemodynamics, and response are authored teaching facts.',
    simplification: 'One fixed pulmonary-hypertension patient has systemic congestion, low output, a pressure-loaded RV pattern, and a bounded early response.',
    whereItMisleads: 'Treating the screen as examination, monitoring, echo or catheter acquisition or interpretation, calculation, diagnosis, staging, or outcome prediction.',
    correctUnderstanding: 'Real RV-failure assessment repeatedly integrates cause, congestion, tissue perfusion, rhythm, oxygenation, RV and LV interaction, filling pressures, output, treatment context, and organ trajectory.',
    briefIn: ['right-ventricular-failure'],
  },
  {
    id: 'right-ventricular-failure-support-and-trigger-actions-are-proxies',
    headline: 'Team, support, trigger, and reassessment buttons record intents; they do not perform care.',
    simplification: 'The interface orders reasoning without delivering oxygen, ventilation, fluid, diuresis, pulmonary-vascular therapy, vasopressors, inotropes, or trigger treatment.',
    whereItMisleads: 'Equating button order with pulmonary-hypertension, cardiac, critical-care, prescribing, imaging, catheter, procedural, device, or transfer competence.',
    correctUnderstanding: 'Actual support is individualized to cause and trajectory by experienced teams, with repeated assessment and no automatic fluid, decongestion, drug, target, or device rule.',
    briefIn: ['right-ventricular-failure'],
  },
  {
    id: 'no-live-right-ventricular-failure-diagnosis-prescribing-procedure-or-outcome',
    headline: 'The case does not diagnose RV failure, prescribe support, perform procedures, select mechanical support, or predict outcome.',
    simplification: 'The trigger search, disease-specific therapy, longitudinal congestion, and escalation pathway remain incomplete.',
    whereItMisleads: 'Copying the panel as cutoffs, applying the same preload plan to every patient, or stopping evaluation when pressure improves.',
    correctUnderstanding: 'Use current local protocols and pulmonary-hypertension, cardiac, shock, imaging, catheter, pharmacy, procedural, and device expertise for real care.',
    briefIn: ['right-ventricular-failure'],
  },
  {
    id: 'massive-pulmonary-embolism-findings-support-and-response-are-authored',
    headline: 'The PE, RV, shock, ventilation, support, and response panels are authored teaching facts.',
    simplification: 'One confirmed Category E2R patient has fixed refractory cardiopulmonary failure and a bounded post-bridge response.',
    whereItMisleads: 'Treating the screen as examination, monitoring, CT, echo, laboratory or hemodynamic acquisition or interpretation, diagnosis, staging, or outcome prediction.',
    correctUnderstanding: 'Real high-risk PE care repeatedly integrates confirmation, shock and respiratory severity, RV function, bleeding, perfusion, ventilation, organ trajectory, resources, and response.',
    briefIn: ['massive-pulmonary-embolism'],
  },
  {
    id: 'massive-pulmonary-embolism-ecmo-and-reperfusion-actions-are-proxies',
    headline: 'Support, ECMO, reperfusion, and reassessment buttons record intents; they do not perform rescue care.',
    simplification: 'The interface orders reasoning without delivering oxygen, ventilation, anticoagulation, fluid, or drugs, cannulating, initiating ECMO, or removing clot.',
    whereItMisleads: 'Equating button order with PERT, shock, perfusion, ECMO, prescribing, catheter, surgical, resuscitation, device, or transfer competence.',
    correctUnderstanding: 'VA-ECMO requires expert candidacy and safe systems, supports circulation and oxygenation rather than removing thrombus, and does not make adjunctive reperfusion automatically beneficial.',
    briefIn: ['massive-pulmonary-embolism'],
  },
  {
    id: 'no-live-massive-pulmonary-embolism-diagnosis-prescribing-device-or-outcome',
    headline: 'The case does not diagnose PE, prescribe therapy, perform CPR or procedures, manage ECMO, or predict outcome.',
    simplification: 'Bleeding, candidacy, cannulation, complications, longitudinal organ recovery, thrombus strategy, and disposition remain incomplete.',
    whereItMisleads: 'Copying the panel as universal thresholds, treating VA-ECMO as clot treatment, or assuming every supported patient needs the same adjunctive intervention.',
    correctUnderstanding: 'Use current protocols and multidisciplinary PE, shock, perfusion, ECMO, pharmacy, imaging, catheter, surgical, and resuscitation expertise for real care.',
    briefIn: ['massive-pulmonary-embolism'],
  },
  {
    id: 'upper-gi-hemorrhage-findings-and-response-are-authored',
    headline: 'The bleeding, perfusion, laboratory, airway, source, and response panels are authored teaching facts.',
    simplification: 'One recurrent nonvariceal ulcer bleed has a fixed ICU presentation and bounded post-bridge response.',
    whereItMisleads: 'Treating the screen as examination, monitoring, specimen or test acquisition or interpretation, diagnosis, hemostasis confirmation, or outcome prediction.',
    correctUnderstanding: 'Real upper-GI-bleed care repeatedly integrates active bleeding, airway, tissue perfusion, laboratory trend, comorbidity, medications, source, treatment, resources, and serial response.',
    briefIn: ['upper-gi-hemorrhage'],
  },
  {
    id: 'upper-gi-hemorrhage-resuscitation-and-hemostasis-actions-are-proxies',
    headline: 'Resuscitation, transfusion, endoscopy, embolization, surgery, and reassessment buttons record intents; they do not perform care.',
    simplification: 'The interface orders reasoning without obtaining access or tests, delivering oxygen, fluid, blood products or drugs, managing an airway, or performing hemostasis.',
    whereItMisleads: 'Equating button order with hemorrhage, blood-bank, endoscopy, interventional-radiology, surgical, airway, prescribing, procedural, or transfer competence.',
    correctUnderstanding: 'Actual resuscitation and hemostasis are individualized to active bleeding, physiology, comorbidity, prior treatment, local protocols, resources, and repeated assessment.',
    briefIn: ['upper-gi-hemorrhage'],
  },
  {
    id: 'no-live-upper-gi-hemorrhage-diagnosis-transfusion-procedure-or-outcome',
    headline: 'The case does not diagnose GI bleeding, prescribe transfusion, manage an airway, perform procedures, or predict outcome.',
    simplification: 'Variceal disease, drug regimens, transfusion complications, procedural findings, recurrent bleeding, longitudinal organ recovery, and disposition remain incomplete.',
    whereItMisleads: 'Treating 7 g/dL as a universal trigger, assuming improved pressure proves hemostasis, or applying a nonvariceal pathway to suspected variceal bleeding.',
    correctUnderstanding: 'Use current local protocols and GI, critical-care, blood-bank, pharmacy, airway, interventional-radiology, and surgical expertise for real care.',
    briefIn: ['upper-gi-hemorrhage'],
  },
  {
    id: 'critical-care-status-epilepticus-findings-and-response-are-authored',
    headline: 'The EEG, neurologic, airway, ventilation, perfusion, laboratory, and response panels are authored teaching facts.',
    simplification: 'One refractory-status patient has fixed persistent electrographic seizures and a bounded post-pathway response.',
    whereItMisleads: 'Treating the screen as examination, monitoring or EEG acquisition or interpretation, diagnosis, seizure quantification, prognosis, or outcome prediction.',
    correctUnderstanding: 'Real refractory-status care repeatedly integrates clinical state, EEG, medication delivery, airway, ventilation, perfusion, temperature, organ function, cause, adverse effects, and serial response.',
    briefIn: [],
  },
  {
    id: 'critical-care-status-epilepticus-eeg-anesthetic-and-cause-actions-are-proxies',
    headline: 'EEG, continuous-anesthetic, organ-support, cause, and reassessment buttons record intents; they do not perform care.',
    simplification: 'The interface orders reasoning without acquiring EEG, delivering oxygen, ventilation, fluid or drugs, managing an airway, or treating a cause.',
    whereItMisleads: 'Equating button order with neurocritical-care, epilepsy, EEG, pharmacy, airway, prescribing, procedural, imaging, or transfer competence.',
    correctUnderstanding: 'Actual therapy and monitoring are individualized to EEG, cause, physiology, organ function, adverse effects, local protocols, and expert reassessment.',
    briefIn: [],
  },
  {
    id: 'no-live-critical-care-status-epilepticus-diagnosis-prescribing-eeg-airway-or-outcome',
    headline: 'The case does not diagnose status, interpret EEG, prescribe therapy, manage an airway, perform procedures, or predict outcome.',
    simplification: 'Agent selection, dosing, EEG target, duration, weaning, recurrence, cause treatment, complications, recovery, and prognosis remain incomplete.',
    whereItMisleads: 'Assuming absent movement proves seizure control, applying one anesthetic or burst-suppression target universally, or treating a brief EEG response as durable recovery.',
    correctUnderstanding: 'Use current local protocols and neurocritical-care, epilepsy, EEG, pharmacy, airway, critical-care, imaging, infectious, immune, toxicology, and procedural expertise for real care.',
    briefIn: [],
  },
  {
    id: 'post-arrest-temperature-findings-and-response-are-authored',
    headline: 'The ROSC, neurologic, temperature, perfusion, ventilation, seizure, cause, and response panels are authored teaching facts.',
    simplification: 'One unresponsive post-arrest patient has a fixed febrile presentation and bounded temperature response.',
    whereItMisleads: 'Treating the screen as examination, monitoring, EEG, laboratory or imaging acquisition or interpretation, diagnosis, neuroprognostication, or outcome prediction.',
    correctUnderstanding: 'Real post-arrest care repeatedly integrates arrest context, cause, brain, temperature, airway, ventilation, perfusion, rhythm, seizures, organ function, treatment, and serial response.',
    briefIn: ['targeted-temperature-management'],
  },
  {
    id: 'post-arrest-temperature-control-and-guardrail-actions-are-proxies',
    headline: 'Temperature protocol, cooling, warming, shivering, organ-support, and reassessment buttons record intents; they do not perform care.',
    simplification: 'The interface orders reasoning without measuring temperature, delivering oxygen, ventilation, fluid or drugs, or using a cooling or warming device.',
    whereItMisleads: 'Equating button order with post-arrest, temperature-device, nursing, pharmacy, airway, prescribing, procedural, or transfer competence.',
    correctUnderstanding: 'Actual temperature control is individualized within current guidance using local protocols, trained teams, continuous measurement, systemic guardrails, and repeated reassessment.',
    briefIn: ['targeted-temperature-management'],
  },
  {
    id: 'no-live-post-arrest-temperature-prescribing-device-prognosis-or-outcome',
    headline: 'The case does not prescribe a target, use a temperature device, manage shivering, prognosticate, or predict outcome.',
    simplification: 'Target selection, device, sedation, shivering therapy, complications, duration beyond 36 hours, rewarming, cause treatment, organ recovery, and prognosis remain incomplete.',
    whereItMisleads: 'Assuming 33°C or any other target is universally superior, using rapid cold-fluid loading, rewarming too quickly, or treating temperature response as neurologic recovery.',
    correctUnderstanding: 'Use current local protocols and post-arrest, cardiac, neurologic, nursing, pharmacy, airway, temperature-device, and prognostication expertise for real care.',
    briefIn: ['targeted-temperature-management'],
  },
  {
    id: 'intracranial-hypertension-findings-and-response-are-authored',
    headline: 'The ICP, CPP, examination, imaging, systemic, driver, and response panels are authored teaching facts.',
    simplification: 'One post-operative severe-TBI patient has a fixed monitored pressure pattern and bounded immediate response.',
    whereItMisleads: 'Treating the screen as examination, ICP waveform or other monitoring acquisition or interpretation, CPP calculation, imaging review, diagnosis, prognosis, or outcome prediction.',
    correctUnderstanding: 'Real intracranial-hypertension care repeatedly integrates monitor fidelity and trend, examination, imaging, injury, physiology, interventions, adverse effects, and serial response.',
    briefIn: ['intracranial-hypertension'],
  },
  {
    id: 'intracranial-hypertension-protection-and-rescue-actions-are-proxies',
    headline: 'Positioning, systemic protection, hyperosmolar rescue, and reassessment buttons record intents; they do not perform care.',
    simplification: 'The interface orders reasoning without positioning the patient, acquiring monitoring, or delivering oxygen, ventilation, fluid, or drugs.',
    whereItMisleads: 'Equating button order with neurocritical-care, neurosurgical, nursing, respiratory, pharmacy, prescribing, procedural, imaging, or transfer competence.',
    correctUnderstanding: 'Actual care is individualized to injury, monitor validity, examination, imaging, autoregulation, physiology, response, local protocols, and expert reassessment.',
    briefIn: ['intracranial-hypertension'],
  },
  {
    id: 'no-live-icp-monitoring-hyperosmolar-prescribing-procedure-prognosis-or-outcome',
    headline: 'The case does not monitor ICP, prescribe osmotherapy, use a drain, image, operate, prognosticate, or predict outcome.',
    simplification: 'Threshold duration, CPP target, agent, concentration, dose, route, fluid strategy, later tiers, drain use, repeat imaging, surgery, recovery, and prognosis remain incomplete.',
    whereItMisleads: 'Treating 22 mmHg as an isolated automatic trigger, forcing CPP above 70, prescribing one hyperosmolar recipe universally, or equating immediate pressure response with recovery.',
    correctUnderstanding: 'Use current local protocols and neurocritical-care, neurosurgical, nursing, respiratory, pharmacy, imaging, procedural, and prognostication expertise for real care.',
    briefIn: ['intracranial-hypertension'],
  },
  {
    id: 'aki-fluid-overload-findings-and-response-are-authored',
    headline: 'The kidney, fluid, weight, respiratory, metabolic, cause, and response panels are authored teaching facts.',
    simplification: 'One severe-AKI patient has fixed harmful fluid accumulation, a poor reported diuretic response, and a bounded immediate trajectory.',
    whereItMisleads: 'Treating the screen as examination, monitoring, fluid accounting, laboratory or imaging acquisition or interpretation, diagnosis, kidney-recovery assessment, or outcome prediction.',
    correctUnderstanding: 'Real AKI care repeatedly integrates baseline and trend, urine, balance, weight, organ function, perfusion, electrolytes, acid-base state, symptoms, causes, treatment, goals, and serial response.',
    briefIn: ['acute-kidney-injury-with-fluid-overload'],
  },
  {
    id: 'aki-fluid-and-kidney-support-actions-are-proxies',
    headline: 'Fluid-limit, diuretic-review, kidney-support, and reassessment buttons record intents; they do not perform care.',
    simplification: 'The interface orders reasoning without measuring balance, changing intake, delivering diuretics, placing access, or providing kidney support.',
    whereItMisleads: 'Equating button order with critical-care, nephrology, nursing, respiratory, pharmacy, nutrition, prescribing, procedural, kidney-support, or transfer competence.',
    correctUnderstanding: 'Actual de-resuscitation and kidney support are individualized to demand, capacity, physiology, complications, recovery potential, preferences, resources, and repeated expert reassessment.',
    briefIn: ['acute-kidney-injury-with-fluid-overload'],
  },
  {
    id: 'no-live-aki-diagnosis-diuretic-kidney-support-prescribing-procedure-or-outcome',
    headline: 'The case does not diagnose AKI, prescribe diuretics, place access, deliver kidney support, determine recovery, or predict outcome.',
    simplification: 'Volume assessment, diuretic strategy, exact urgency, access, modality, dose, anticoagulation, fluid removal, medication clearance, nutrition, duration, recovery, and goals remain incomplete.',
    whereItMisleads: 'Starting support from one creatinine or BUN value, accelerating every severe AKI case, repeating diuretics blindly, or treating immediate negative balance as kidney recovery.',
    correctUnderstanding: 'Use current local protocols and critical-care, nephrology, nursing, respiratory, pharmacy, nutrition, procedural, and shared-decision expertise for real care.',
    briefIn: ['acute-kidney-injury-with-fluid-overload'],
  },
  {
    id: 'severe-acidemia-gas-causes-and-response-are-authored',
    headline: 'The blood gas, chemistry, compensation, causes, and response are authored teaching facts.',
    simplification: 'One septic-shock patient has a fixed repeated sample, mixed metabolic and respiratory acidemia, AKI, and bounded immediate trajectory.',
    whereItMisleads: 'Treating the screen as sample acquisition, validation, calculation, examination, monitoring, ECG, laboratory, acid-base or cause diagnosis, clearance assessment, or outcome prediction.',
    correctUnderstanding: 'Real acidemia care repeatedly confirms sampling and integrates pH, PaCO₂, bicarbonate, electrolytes, albumin, anion gap, lactate, ketones, perfusion, ventilation, kidney function, toxins, treatment, and serial response.',
    briefIn: ['severe-acidemia'],
  },
  {
    id: 'severe-acidemia-stabilization-actions-are-proxies',
    headline: 'Ventilation, cause, buffer, kidney-support, and reassessment buttons record reasoning; they do not perform care.',
    simplification: 'The interface orders a fixed response without assessing mechanics, setting a ventilator, restoring perfusion, controlling infection, or delivering fluid, drugs, antidotes, or kidney support.',
    whereItMisleads: 'Equating button order with airway, ventilation, critical-care, nursing, respiratory, pharmacy, nephrology, toxicology, procedural, or source-control competence.',
    correctUnderstanding: 'Actual stabilization balances safe ventilatory compensation, oxygen delivery, perfusion, cause control, electrolytes, fluid burden, buffer risks, kidney capacity, and repeated expert reassessment.',
    briefIn: ['severe-acidemia'],
  },
  {
    id: 'no-live-acid-base-diagnosis-ventilation-buffer-kidney-support-prescribing-or-outcome',
    headline: 'The case does not diagnose acid-base disease, set ventilation, prescribe buffer, deliver kidney support, or predict outcome.',
    simplification: 'Sampling, formulas, ventilation, fluid and vasoactive care, bicarbonate formulation and delivery, electrolyte and toxin treatment, access, kidney-support prescription, source control, and recovery remain incomplete.',
    whereItMisleads: 'Using one pH as a diagnosis, universal bicarbonate or kidney-support trigger, normal-pH ventilation target, hemodynamic promise, or mortality claim.',
    correctUnderstanding: 'Use current local protocols and critical-care, respiratory, nursing, pharmacy, nephrology, toxicology, infectious-disease, procedural, and shared-decision expertise for real care.',
    briefIn: ['severe-acidemia'],
  },
  {
    id: 'icu-hidden-deterioration-handoff-content-and-response-are-authored',
    headline: 'The outgoing summary, bedside trends, hidden deterioration, and response are authored teaching facts.',
    simplification: 'One shift-change case uses fixed content and a fixed worsening-shock trajectory that contradicts the word stable.',
    whereItMisleads: 'Treating the screen as patient identification, examination, monitoring, trend acquisition, device or infusion verification, laboratory interpretation, record reconciliation, diagnosis, or outcome prediction.',
    correctUnderstanding: 'Real receivers verify identity, current physiology, dated trends, active support from source to patient, devices, medications, orders, pending work, contingencies, and the bedside examination.',
    briefIn: ['icu-handoff-with-hidden-deterioration'],
  },
  {
    id: 'icu-handoff-controls-record-events-not-communication-or-care',
    headline: 'Handoff buttons record ordered events; they do not measure communication or perform escalation or care.',
    simplification: 'Fixed clicks stand in for shared attention, content receipt, bedside cross-check, escalation, receiver synthesis, acceptance, and reassessment.',
    whereItMisleads: 'Equating button order with voice, language, listening, questioning, nonverbal behavior, interruption handling, teamwork, hierarchy, bedside assessment, escalation, or clinical competence.',
    correctUnderstanding: 'Handoff quality depends on accurate local content, trained people, protected attention, active receiver scrutiny, questions, closed-loop synthesis, explicit ownership, and real action.',
    briefIn: ['icu-handoff-with-hidden-deterioration'],
  },
  {
    id: 'no-live-handoff-verification-escalation-treatment-transfer-or-outcome',
    headline: 'The case does not verify a patient, communicate, escalate, treat, transfer responsibility, or predict outcome.',
    simplification: 'Staffing, workload, documentation, EHR use, patient and family participation, device checks, treatment, source control, transfer, disposition, and later trajectory remain incomplete.',
    whereItMisleads: 'Using the interface as a universal script, accepting the outgoing label without bedside reconciliation, or treating a recorded acknowledgment as real transfer of responsibility.',
    correctUnderstanding: 'Use local policy and critical-care, nursing, respiratory, pharmacy, source-control, safety, and communication expertise for real handoffs and deterioration.',
    briefIn: ['icu-handoff-with-hidden-deterioration'],
  },
  {
    id: 'ventilator-disconnection-alarm-findings-reserve-and-response-are-authored',
    headline: 'The alarm, delivered-breath findings, falling oxygen reserve, circuit state, and response are authored teaching facts.',
    simplification: 'One fully dependent ventilated patient has fixed command-delivery discordance, a complete circuit discontinuity, and a bounded restored-support response.',
    whereItMisleads: 'Treating the screen as alarm hearing or interpretation, examination, monitoring, waveform or ventilator-data acquisition, circuit or airway inspection, diagnosis, reserve prediction, or outcome prediction.',
    correctUnderstanding: 'Real clinicians integrate the patient, airway, independent physiology, delivered versus commanded ventilation, pressure, capnography, circuit, ventilator, gas source, alarm configuration, and serial response.',
    briefIn: ['ventilator-circuit-disconnection'],
  },
  {
    id: 'ventilator-disconnection-controls-record-intent-not-device-handling-or-care',
    headline: 'Bridge, inspect, restore, and reassess buttons record intents; they do not handle equipment or deliver care.',
    simplification: 'The interface orders a fixed response without oxygenating, ventilating, tracing tubing, reconnecting a circuit, securing components, or programming a ventilator.',
    whereItMisleads: 'Equating button order with critical-care, nursing, respiratory-therapy, airway, equipment, alarm-management, troubleshooting, procedural, or transfer competence.',
    correctUnderstanding: 'Actual response requires immediate patient support, skilled hands-on inspection and correction, device-specific knowledge, local backup systems, and whole-patient reassessment.',
    briefIn: ['ventilator-circuit-disconnection'],
  },
  {
    id: 'no-live-circuit-inspection-oxygen-ventilation-reconnection-or-outcome',
    headline: 'The case does not inspect a circuit, deliver oxygen or ventilation, reconnect equipment, configure alarms, or predict outcome.',
    simplification: 'Connection location, circuit accessories, airway state, backup device, technique, alarm timing and priority, oxygen-reserve course, durability, and later outcome remain incomplete.',
    whereItMisleads: 'Copying the 10-second teaching delay to another device, silencing an alarm without bedside assessment, trusting commanded settings, or treating reconnection alone as closure.',
    correctUnderstanding: 'Use the specific device instructions, local policy, and critical-care, nursing, respiratory, airway, biomedical, and safety expertise for real equipment events.',
    briefIn: ['ventilator-circuit-disconnection'],
  },
  {
    id: 'vasopressor-delivery-setup-mechanics-and-response-are-authored',
    headline: 'The pump record, tubing setup, delivery delay, shock findings, and response are authored teaching facts.',
    simplification: 'One septic-shock patient has a fixed microinfusion path, delayed catheter-tip arrival, and bounded perfusion response.',
    whereItMisleads: 'Treating the screen as pump-log, pressure, flow, line, catheter, laboratory, or monitoring acquisition or interpretation; shock diagnosis; transit calculation; or outcome prediction.',
    correctUnderstanding: 'Real delivery depends on the specific syringe, pump, mechanical fit, tubing compliance and resistance, valves, connectors, mixing point, downstream volume, carrier, pressure gradients, access, device settings, and serial patient response.',
    briefIn: ['delayed-vasopressor-delivery'],
  },
  {
    id: 'vasopressor-delivery-controls-record-review-and-protocol-intent-only',
    headline: 'Path-review, classification, protocol, and reassessment buttons record intents; they do not manipulate an infusion.',
    simplification: 'The interface orders systems reasoning without touching a syringe, pump, tubing, stopcock, connector, catheter, or patient.',
    whereItMisleads: 'Equating button order with nursing, pharmacy, critical-care, infusion, device, sterile, prescribing, calculation, troubleshooting, or procedural competence.',
    correctUnderstanding: 'Actual correction requires trained bedside staff, the specific device instructions, a validated local protocol, correct medication and access verification, sterile technique, and repeated delivery and patient assessment.',
    briefIn: ['delayed-vasopressor-delivery'],
  },
  {
    id: 'no-live-infusion-calculation-manipulation-drug-delivery-or-outcome',
    headline: 'The case does not calculate, prime, purge, flush, bolus, program, prescribe, compound, or deliver a vasopressor.',
    simplification: 'Concentration, dose, universal transit formula, priming volume, pressure matching, device feature, changeover technique, and ongoing shock prescription remain incomplete.',
    whereItMisleads: 'Copying the fictional setup into care, flushing concentrated drug into a patient, using one formula for a compliant multi-infusion system, or treating a pressure response as proof of one cause.',
    correctUnderstanding: 'Use local medication and device policy plus nursing, pharmacy, critical-care, biomedical, vascular-access, and safety expertise for real high-consequence infusions.',
    briefIn: ['delayed-vasopressor-delivery'],
  },
  {
    id: 'tube-migration-position-ventilation-and-response-are-authored',
    headline: 'The tube marks, unilateral ventilation, pressures, gas exchange, typed migration, and response are authored teaching facts.',
    simplification: 'One ventilated ICU patient has a fixed post-turn change, right-mainstem position, and bounded multi-signal response.',
    whereItMisleads: 'Treating the screen as patient examination, auscultation, monitoring or ventilator-data acquisition, depth measurement, cuff or securement inspection, diagnosis, or outcome prediction.',
    correctUnderstanding: 'Real clinicians reassess the patient, airway, bilateral ventilation, capnography, delivered breaths, pressures, circuit, securement, depth, oxygenation, and serial response after movement.',
    briefIn: ['endotracheal-tube-migration-after-repositioning'],
  },
  {
    id: 'tube-migration-controls-record-assessment-support-and-correction-intent-only',
    headline: 'Recognition, support, review, correction, and reassessment buttons record intents; they do not perform airway care.',
    simplification: 'Five ordered clicks stand in for skilled team escalation, immediate support, airway-position assessment, experienced correction, resecurement, and response proof.',
    whereItMisleads: 'Equating button order with critical-care, respiratory-therapy, airway, examination, equipment, procedural, teamwork, or crisis-management competence.',
    correctUnderstanding: 'Actual response requires immediate support, experienced hands, local airway and device procedures, physical reassessment, and repeated whole-patient verification.',
    briefIn: ['endotracheal-tube-migration-after-repositioning'],
  },
  {
    id: 'no-live-auscultation-tube-handling-imaging-diagnosis-or-outcome',
    headline: 'The case does not examine or turn a patient, auscultate, inspect equipment, manipulate a tube, acquire imaging, diagnose, or predict outcome.',
    simplification: 'The 22 cm and 25 cm marks and 3-minute response belong only to this authored case; depth, anatomy, technique, alternatives, durability, disposition, and later outcome remain incomplete.',
    whereItMisleads: 'Copying the fictional depth as a target, using capnography alone to prove correct depth, physically correcting a tube without immediate support and skilled verification, or closing alternate causes too early.',
    correctUnderstanding: 'Use patient-specific anatomy and findings, experienced airway help, local policy, appropriate confirmation methods, and critical-care and respiratory expertise for real airway-position events.',
    briefIn: ['endotracheal-tube-migration-after-repositioning'],
  },
  {
    id: 'septic-shock-resuscitation-trajectory-and-response-are-authored',
    headline: 'The prior-care record, perfusion trajectory, dynamic response, lung panel, suspected source, and 10-minute response are authored teaching facts.',
    simplification: 'One ICU patient has fixed persistent hypoperfusion after reported early therapy, a 2% passive-leg-raise response, diffuse B-lines, and a bounded later panel.',
    whereItMisleads: 'Treating the screen as examination, monitoring, sample or ultrasound acquisition or interpretation, delivery verification, fluid-responsiveness measurement, shock classification, or outcome prediction.',
    correctUnderstanding: 'Real resuscitation repeatedly integrates verified treatment delivery, pressure, brain, skin, kidney, lactate context, dynamic response, lung tolerance, cardiac function, source, and serial trajectory.',
    briefIn: ['septic-shock-resuscitation'],
  },
  {
    id: 'septic-shock-resuscitation-controls-record-review-and-plan-intent-only',
    headline: 'Context, perfusion, fluid-response, support, source-control, and reassessment buttons record review and plan intents only.',
    simplification: 'Five ordered clicks stand in for multidisciplinary bedside assessment and an individualized resuscitation and source-control loop.',
    whereItMisleads: 'Equating button order with critical-care, nursing, pharmacy, respiratory, ultrasound, hemodynamic, medication, procedural, source-control, or teamwork competence.',
    correctUnderstanding: 'Actual care requires trained teams, local protocols, verified delivery and access, skilled measurements, patient-specific targets, direct procedures, and repeated response assessment.',
    briefIn: ['septic-shock-resuscitation'],
  },
  {
    id: 'no-live-sepsis-measurement-prescribing-source-control-or-outcome',
    headline: 'The case does not examine, measure, sample, scan, calculate, diagnose, prescribe, deliver treatment, perform source control, or predict outcome.',
    simplification: 'The reported 30 mL/kg, +2% response, B-lines, hemodynamic values, suspected biliary source, and short response belong only to this authored case.',
    whereItMisleads: 'Copying a value as a universal cutoff, chasing MAP or lactate with unselected fluid, assuming a running command reached the patient, delaying source control, or inferring recovery from modest improvement.',
    correctUnderstanding: 'Use current local sepsis and device protocols plus critical-care, nursing, pharmacy, respiratory, infectious-disease, procedural, surgical, and source-control expertise for real care.',
    briefIn: ['septic-shock-resuscitation'],
  },
  {
    id: 'no-live-mixed-shock-diagnosis-prescribing-hemodynamic-procedure-or-outcome',
    headline: 'The case does not diagnose mixed shock, define universal catheter cutoffs, prescribe support, perform procedures, or predict outcome.',
    simplification: 'Concurrent treatment alters hemodynamics, and evolving mechanical, right-heart, obstructive, bleeding, medication, infection, and equipment causes remain incomplete.',
    whereItMisleads: 'Copying the numbers as cutoffs, giving the same support to every phenotype, loading fluid despite congestion, or letting a mixed label close either cause.',
    correctUnderstanding: 'Treat proposed ranges as prompts, interpret them in treatment context, support perfusion, address every active cause, and reassess serially.',
    briefIn: ['mixed-shock'],
  },
  {
    id: 'stable-chest-pain-history-likelihood-and-plan-are-authored',
    headline: 'The symptom history, risk factors, resting ECG report, likelihood tier, and testing discussion are authored teaching facts.',
    simplification: 'One outpatient has a fixed stable exertional pattern and a fixed not-very-low risk-factor-weighted clinical-likelihood label without a calculated score.',
    whereItMisleads: 'Treating the screen as history-taking, examination, ECG interpretation, risk calculation, diagnosis, test selection, or prediction for a real person.',
    correctUnderstanding: 'Real evaluation integrates the full patient history, examination, ECG, risk factors, preferences, comorbidity, local expertise, access, and serial change.',
    briefIn: ['stable-chest-pain-evaluation'],
  },
  {
    id: 'stable-chest-pain-controls-record-review-and-shared-plan-intent-only',
    headline: 'The ordered buttons record review, shared-plan, follow-up, and safety-net intent; they do not deliver cardiovascular care.',
    simplification: 'Five clicks stand in for clinical assessment, likelihood estimation, shared decision-making, testing discussion, follow-up, and communication.',
    whereItMisleads: 'Equating button order with history, examination, communication, diagnostic reasoning, test selection, documentation, or cardiology competence.',
    correctUnderstanding: 'Actual care requires a patient-specific clinical evaluation, meaningful shared decisions, local testing pathways, clear communication, and longitudinal follow-up.',
    briefIn: ['stable-chest-pain-evaluation'],
  },
  {
    id: 'no-live-cardiac-testing-diagnosis-prescribing-prognosis-or-outcome',
    headline: 'The lab does not acquire or interpret cardiac tests, calculate a score, diagnose, prescribe, determine disposition, or predict outcome.',
    simplification: 'No examination, exercise-capacity measurement, ECG acquisition, calcium score, CCTA, stress test, angiography, treatment, event, or outcome is modeled.',
    whereItMisleads: 'Using the authored likelihood tier as a patient-specific tool, assuming one universal test, or inferring coronary disease, ischemia, safety, prognosis, or treatment benefit.',
    correctUnderstanding: 'Use current local pathways and qualified clinical judgment to evaluate acute change, estimate likelihood, select or defer testing, manage risk, and arrange follow-up.',
    briefIn: ['stable-chest-pain-evaluation'],
  },
  {
    id: 'nstemi-serial-findings-and-risk-tier-are-authored',
    headline: 'The symptom course, serial ECG reports, troponin values, NSTEMI conclusion, and high-risk tier are authored teaching facts.',
    simplification: 'One inpatient has a fixed resolved symptom episode, dynamic ECG reports, assay-bounded troponin rise, and no current very-high-risk feature without live acquisition or calculation.',
    whereItMisleads: 'Treating the bedside trace as a diagnostic 12-lead, the troponin values as transferable between assays, or the authored risk tier as a patient-specific score or diagnosis.',
    correctUnderstanding: 'Real assessment integrates current symptoms, examination, serial diagnostic ECGs, assay-specific troponin change, competing injury causes, comorbidity, and repeated risk assessment.',
    briefIn: ['nstemi-risk-reassessment'],
  },
  {
    id: 'nstemi-controls-record-reassessment-and-plan-intent-only',
    headline: 'The ordered controls record serial review, danger screening, strategy, monitoring, and ownership intent; they do not deliver ACS care.',
    simplification: 'Five clicks stand in for multidisciplinary assessment, communication, regional pathway use, bleeding-risk review, monitoring, and handoff.',
    whereItMisleads: 'Equating the sequence with examination, ECG or laboratory interpretation, risk calculation, prescribing, communication, angiography planning, or cardiology competence.',
    correctUnderstanding: 'Actual care requires qualified teams, real-time assessment, verified test results, local ACS pathways, patient-specific treatment, communication, and repeated response review.',
    briefIn: ['nstemi-risk-reassessment'],
  },
  {
    id: 'no-live-nstemi-testing-scoring-treatment-procedure-prognosis-or-outcome',
    headline: 'The lab does not acquire tests, calculate scores, prescribe, perform angiography or revascularization, determine universal timing, or predict outcome.',
    simplification: 'No live ECG, troponin, imaging, GRACE or bleeding score, medication, transfer, angiography, PCI, surgery, infarct trajectory, complication, or outcome is modeled.',
    whereItMisleads: 'Copying a fictional value or timing, using one regional strategy everywhere, assuming pain resolution lowers risk, or inferring procedural benefit, prognosis, or safety.',
    correctUnderstanding: 'Use current regional guidance and local pathways to integrate evolving ischemic and bleeding risk, patient preferences, capability, treatment, invasive timing, and longitudinal care.',
    briefIn: ['nstemi-risk-reassessment'],
  },
  {
    id: 'clinic-stemi-symptoms-ecg-and-stability-are-authored',
    headline: 'The symptom trajectory, diagnostic ECG report, stability, and complication screen are authored teaching facts.',
    simplification: 'One outpatient clinic record supplies fixed symptoms, an inferior-STEMI 12-lead report, vital signs, and selected negative findings without live acquisition or interpretation.',
    whereItMisleads: 'Treating the teaching monitor as a diagnostic 12-lead or the fixed complication screen as examination, diagnosis, or proof that the patient will remain stable.',
    correctUnderstanding: 'Real care requires immediate EMS and regional-system activation plus repeated whole-patient, diagnostic-ECG, rhythm, conduction, right-ventricular, mechanical, bleeding, and alternate-diagnosis assessment.',
    briefIn: ['stemi-recognition-and-first-actions'],
  },
  {
    id: 'clinic-stemi-controls-record-escalation-transfer-and-bridge-intent-only',
    headline: 'The controls record recognition, parallel escalation, clinic-bridge, and handoff intent; they do not deliver STEMI care.',
    simplification: 'Five clicks stand in for EMS activation, regional coordination, patient assessment, monitored transport preparation, aspirin-suitability review, communication, and reassessment.',
    whereItMisleads: 'Equating button order with examination, ECG interpretation, drug administration, transport, communication, reperfusion selection, or cardiology competence.',
    correctUnderstanding: 'Actual care requires qualified teams, immediate system activation, verified findings, patient-specific treatment, real transport, explicit communication, and continuous reassessment.',
    briefIn: ['stemi-recognition-and-first-actions'],
  },
  {
    id: 'no-live-ecg-testing-diagnosis-drug-delivery-reperfusion-disposition-or-outcome',
    headline: 'The lab does not interpret tests, diagnose a real patient, deliver drugs, select reperfusion, transport, determine disposition, or predict outcome.',
    simplification: 'No live ECG, biomarker, imaging, oxygen, aspirin, P2Y12 inhibitor, anticoagulant, fibrinolytic, nitrate, opioid, PCI, transport, complication, or outcome is modeled.',
    whereItMisleads: 'Waiting on a checklist or biomarker, copying the fictional record, assuming one destination or reperfusion strategy, or inferring safety or treatment effect.',
    correctUnderstanding: 'Use current regional protocols and qualified EMS, emergency, and cardiology judgment to activate the system immediately, individualize treatment and destination, and reassess continuously.',
    briefIn: ['stemi-recognition-and-first-actions'],
  },
  {
    id: 'heart-failure-status-response-and-precipitant-are-authored',
    headline: 'The congestion, perfusion, treatment report, serial response, laboratory values, and precipitant context are authored teaching facts.',
    simplification: 'One inpatient has fixed HFrEF, partial decongestion after reported treatment, warm perfusion, a small creatinine change, and residual congestion.',
    whereItMisleads: 'Treating the screen as history, examination, monitoring, fluid-balance verification, laboratory or imaging interpretation, diagnosis, treatment-response measurement, or prognosis for a real person.',
    correctUnderstanding: 'Real assessment verifies treatment delivery and integrates serial symptoms, examination, weight, intake and output, urine output, oxygenation, hemodynamics, kidney function, electrolytes, imaging context, and precipitants.',
    briefIn: ['acute-decompensated-heart-failure'],
  },
  {
    id: 'heart-failure-controls-record-review-and-transition-intent-only',
    headline: 'The ordered controls record status, response, tolerance, transition, readiness, and ownership intent; they do not deliver heart-failure care.',
    simplification: 'Five clicks stand in for multidisciplinary inpatient assessment, individualized decongestion, medication review, education, transition planning, and follow-up.',
    whereItMisleads: 'Equating button order with examination, fluid management, prescribing, medication reconciliation, nursing, pharmacy, dietitian, education, discharge, or cardiology competence.',
    correctUnderstanding: 'Actual care requires qualified teams, verified measurements and treatment delivery, patient-specific decisions, medication reconciliation, education, communication, and repeated bedside reassessment.',
    briefIn: ['acute-decompensated-heart-failure'],
  },
  {
    id: 'no-live-heart-failure-exam-testing-dosing-treatment-disposition-prognosis-or-outcome',
    headline: 'The lab does not examine, acquire tests, calculate targets or doses, prescribe, deliver treatment, select a regimen, determine disposition, or predict outcome.',
    simplification: 'No live examination, weight, balance, urine output, laboratory test, imaging, medication, dose, fluid target, dry weight, response, discharge, readmission, prognosis, or outcome is modeled.',
    whereItMisleads: 'Copying a fictional value as a target, using creatinine or fluid balance alone, assuming clinic weight equals euvolemia, selecting a universal regimen, or inferring readiness or benefit from partial improvement.',
    correctUnderstanding: 'Use current local pathways and qualified multidisciplinary judgment to verify response, individualize decongestion and guideline-directed therapy, correct precipitants, establish readiness, and arrange longitudinal care.',
    briefIn: ['acute-decompensated-heart-failure'],
  },
  {
    id: 'af-rvr-rhythm-duration-risk-and-response-are-authored',
    headline: 'The AF report, stability, duration uncertainty, ventricular function, risk tier, contributor screen, and response are authored teaching facts.',
    simplification: 'One stable patient has fixed AF at 142/min, uncertain duration, preserved LVEF, a not-low stroke-risk label without a score, and a fixed lower-rate response that remains AF.',
    whereItMisleads: 'Treating the teaching trace as a diagnostic ECG, the fixed stability as examination, or the authored duration, contributor, risk, and response record as patient-specific assessment or prediction.',
    correctUnderstanding: 'Real AF care verifies the rhythm and repeatedly integrates hemodynamics, symptoms, perfusion, heart failure, duration, prior history, triggers, ventricular function, thromboembolic and bleeding risk, preferences, and response.',
    briefIn: ['atrial-fibrillation-with-rapid-response'],
  },
  {
    id: 'af-rvr-controls-record-review-and-plan-intent-only',
    headline: 'The ordered controls record stability, context, rate, stroke-prevention, reassessment, and ownership intent; they do not deliver AF care.',
    simplification: 'Five clicks stand in for history, examination, diagnostic review, patient-specific treatment planning, shared decision-making, monitoring, communication, and follow-up.',
    whereItMisleads: 'Equating button order with ECG interpretation, risk calculation, medication selection, anticoagulation, cardioversion planning, communication, documentation, or cardiology competence.',
    correctUnderstanding: 'Actual care requires qualified assessment, a diagnostic ECG, current local pathways, patient-specific rate and rhythm decisions, validated stroke-risk review, shared decisions, and repeated follow-up.',
    briefIn: ['atrial-fibrillation-with-rapid-response'],
  },
  {
    id: 'no-live-af-rvr-ecg-scoring-prescribing-cardioversion-prognosis-or-outcome',
    headline: 'The lab does not interpret an ECG, calculate a score, prescribe or deliver treatment, decide anticoagulation or cardioversion eligibility, or predict outcome.',
    simplification: 'No live ECG, laboratory test, imaging, risk score, rate target, medication, anticoagulant, dose, rhythm conversion, cardioversion, ablation, disposition, recurrence, prognosis, or outcome is modeled.',
    whereItMisleads: 'Using heart rate alone for instability, copying a target or agent, assuming a lower rate removes AF or stroke risk, inferring AF onset from symptom onset, or treating one pathway as universal.',
    correctUnderstanding: 'Use current local AF guidance and qualified judgment to determine stability, duration, contributors, rate or rhythm strategy, stroke prevention, cardioversion safety, monitoring, and longitudinal care.',
    briefIn: ['atrial-fibrillation-with-rapid-response'],
  },
  {
    id: 'post-infarction-shock-findings-support-and-response-are-authored',
    headline: 'The post-PCI findings, verified initial support, worsening perfusion trajectory, consultation context, and later response are authored teaching facts.',
    simplification: 'One non-advanced-center record supplies fixed treatment, pressure, brain, skin, kidney, lactate, congestion, ECG, echo, rhythm, and bleeding snapshots.',
    whereItMisleads: 'Treating the screen as live examination, monitoring, test interpretation, diagnosis, durable culprit-vessel patency, or proof of one shock cause.',
    correctUnderstanding: 'Real care verifies evolving findings and repeatedly reopens ischemic, mechanical, right-heart, rhythm, bleeding, vasodilated, obstructive, treatment, and device contributors.',
    briefIn: ['post-infarction-cardiogenic-shock-escalation'],
  },
  {
    id: 'post-infarction-shock-controls-record-consultation-bridge-and-handoff-intent-only',
    headline: 'The controls record trajectory review, cause review, consultation, bridge, and handoff intent; they do not deliver shock care or authorize transfer.',
    simplification: 'Five clicks stand in for multidisciplinary assessment, regional consultation, potential-transfer evaluation, individualized stabilization planning, communication, and reassessment.',
    whereItMisleads: 'Equating button order with examination, treatment, device selection, transfer acceptance, transport, communication, documentation, or cardiology competence.',
    correctUnderstanding: 'Actual care requires qualified teams, verified real-time data, patient-specific support, candidacy and risk review, accepting-center decisions, safe transport planning, and repeated reassessment.',
    briefIn: ['post-infarction-cardiogenic-shock-escalation'],
  },
  {
    id: 'no-live-post-infarction-shock-testing-treatment-device-transfer-or-outcome',
    headline: 'The lab does not acquire tests, diagnose, prescribe, deliver treatment, select or place a device, perform a procedure or transfer, or predict outcome.',
    simplification: 'No live monitoring, laboratory test, ECG, echo, angiography, hemodynamics, drug, fluid, target, device, PCI, surgery, transport, disposition, prognosis, or outcome is modeled.',
    whereItMisleads: 'Copying a fictional value, assuming a higher pressure resolves shock, selecting routine support, or treating regional consultation as transfer authorization.',
    correctUnderstanding: 'Use current guidance, local pathways, qualified multidisciplinary judgment, regional consultation, shared decisions, and serial assessment for real cardiogenic-shock care.',
    briefIn: ['post-infarction-cardiogenic-shock-escalation'],
  },
  {
    id: 'stable-regular-narrow-rhythm-context-and-response-are-authored',
    headline: 'The regular narrow rhythm, current stability, context, nonconversion, and later sinus response are authored teaching facts.',
    simplification: 'One monitored record supplies fixed rhythm, pressure, perfusion, symptom, contraindication, readiness, and response snapshots without live acquisition.',
    whereItMisleads: 'Treating the teaching trace as a diagnostic ECG, rate as a stability test, or conversion as proof of AVNRT, cure, recurrence risk, or prognosis.',
    correctUnderstanding: 'Real care verifies rhythm and repeatedly integrates whole-patient stability, mechanism alternatives, causes, contraindications, response, adverse effects, preferences, and recurrence.',
    briefIn: ['regular-narrow-complex-tachycardia'],
  },
  {
    id: 'stable-regular-narrow-controls-record-review-and-treatment-intent-only',
    headline: 'The controls record review, monitored readiness, vagal and adenosine intent, response, and follow-up; they do not perform treatment.',
    simplification: 'Six clicks stand in for clinical assessment, monitored preparation, coached maneuver, medication planning, observation, communication, and follow-up.',
    whereItMisleads: 'Equating button order with examination, ECG interpretation, IV placement, maneuver quality, drug preparation or delivery, communication, or cardiology competence.',
    correctUnderstanding: 'Actual care requires qualified teams, verified findings, real monitoring and access, patient-specific contraindication review, safe treatment delivery, and repeated reassessment.',
    briefIn: ['regular-narrow-complex-tachycardia'],
  },
  {
    id: 'no-live-regular-narrow-ecg-diagnosis-drug-cardioversion-ablation-or-outcome',
    headline: 'The lab does not interpret an ECG, diagnose a mechanism, perform a maneuver, deliver medication, cardiovert, ablate, or predict outcome.',
    simplification: 'No live examination, ECG, laboratory test, vagal effort, access, dose, drug, shock, procedure, disposition, recurrence, prognosis, or outcome is modeled.',
    whereItMisleads: 'Copying the fictional values, assuming universal adenosine suitability, treating nonconversion or conversion as diagnostic, or inferring durable success.',
    correctUnderstanding: 'Use current resuscitation and rhythm guidance, local protocols, qualified judgment, patient preferences, and longitudinal cardiology care for real tachycardia.',
    briefIn: ['regular-narrow-complex-tachycardia'],
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
  {
    id: 'stable-wide-complex-rhythm-context-and-responses-are-authored',
    headline: 'The pulsed regular monomorphic wide rhythm, stability, treating-team medication course, nonresponse, and sinus report are authored teaching facts.',
    simplification: 'One monitored record supplies fixed rhythm, pressure, perfusion, history, laboratory, readiness, and response snapshots.',
    whereItMisleads: 'Treating the teaching trace as diagnostic, declaring every WCT to be VT, or reading conversion as proof, cure, recurrence risk, or prognosis.',
    correctUnderstanding: 'Real care repeatedly verifies pulse, stability, morphology, causes, contraindications, response, adverse effects, and pathway changes.',
    briefIn: ['wide-complex-tachycardia'],
  },
  {
    id: 'stable-wide-complex-controls-record-review-readiness-and-treatment-intent-only',
    headline: 'The controls record review, readiness, an authored medication path, escalation intent, and follow-up; they do not deliver treatment.',
    simplification: 'Seven clicks stand in for expert assessment, monitored preparation, treating-team care, observation, communication, and follow-up.',
    whereItMisleads: 'Equating button order with ECG interpretation, access, medication preparation or delivery, synchronization, shock delivery, or cardiology competence.',
    correctUnderstanding: 'Actual care requires qualified teams, verified findings, local protocols, safe delivery, immediate pathway switching, and repeated reassessment.',
    briefIn: ['wide-complex-tachycardia'],
  },
  {
    id: 'no-live-wide-complex-diagnosis-dose-drug-delivery-cardioversion-device-decision-or-outcome',
    headline: 'The lab does not diagnose a mechanism, dose or deliver a drug, operate a defibrillator, cardiovert, decide device therapy, or predict outcome.',
    simplification: 'No live exam, ECG, laboratory test, access, dose, infusion rate, drug delivery, energy, sedation, shock, procedure, disposition, recurrence, prognosis, or outcome is modeled.',
    whereItMisleads: 'Copying values, stacking agents, using verapamil or diltiazem, generalizing the authored sequence, or applying it to unstable, polymorphic, or pulseless rhythms.',
    correctUnderstanding: 'Use current resuscitation guidance, local protocols, qualified judgment, expert consultation, and longitudinal cardiology care for real WCT.',
    briefIn: ['wide-complex-tachycardia'],
  },
  {
    id: 'symptomatic-sinus-bradycardia-record-context-and-correlation-are-authored',
    headline: 'The sinus rhythm, stable physiology, symptom diary, monitor report, contributor context, and correlation are authored teaching facts.',
    simplification: 'One return-visit record supplies fixed rhythm, pressure, symptoms, ECG, patch, laboratory, medication, and exclusion snapshots.',
    whereItMisleads: 'Treating the teaching trace as diagnostic, calling a low rate unstable, or reading correlation as proof of one cause, pacing eligibility, benefit, or prognosis.',
    correctUnderstanding: 'Real care verifies symptoms and rhythm over time and integrates acute stability, alternative causes, reversible context, patient goals, and evolving evidence.',
    briefIn: ['symptomatic-sinus-bradycardia-reassessment'],
  },
  {
    id: 'symptomatic-sinus-bradycardia-controls-record-review-referral-and-handoff-only',
    headline: 'The controls record stability, two parallel review lanes, shared pacing evaluation, and handoff; they do not deliver care.',
    simplification: 'Five clicks stand in for history, examination, diagnostic review, counseling, shared decisions, communication, and follow-up.',
    whereItMisleads: 'Equating button order with examination, ECG or monitor interpretation, medication management, counseling quality, device selection, or cardiology competence.',
    correctUnderstanding: 'Actual care requires qualified assessment, verified longitudinal evidence, individualized reversible-cause work, shared decisions, and repeated follow-up.',
    briefIn: ['symptomatic-sinus-bradycardia-reassessment'],
  },
  {
    id: 'no-live-bradycardia-diagnosis-medication-change-pacing-procedure-or-outcome',
    headline: 'The lab does not diagnose sinus-node dysfunction, change medication, pace, choose or implant a device, or predict outcome.',
    simplification: 'No live exam, ECG, monitor, test, medication change, oxygen, atropine, infusion, pacing, device, procedure, disposition, recurrence, prognosis, benefit, or outcome is modeled.',
    whereItMisleads: 'Using one rate or pause cutoff, stopping necessary therapy, treating chronic symptoms as acute compromise, or applying this SND pathway to high-grade AV block.',
    correctUnderstanding: 'Use current specialty and acute-care guidance, qualified judgment, patient preferences, and explicit pathway switching for real bradycardia.',
    briefIn: ['symptomatic-sinus-bradycardia-reassessment'],
  },
  {
    id: 'complete-heart-block-rhythm-stability-and-context-are-authored',
    headline: 'The complete AV block, escape rhythm, pulse, stability, symptoms, and initial cause panel are authored teaching facts.',
    simplification: 'One urgent rhythm-unit record supplies a fixed diagnostic ECG description, physiology, history, and initial reversible and structural context.',
    whereItMisleads: 'Treating the teaching waveform as a diagnostic ECG, confusing atrial rate with the perfusing ventricular rate, or reading current stability as low risk.',
    correctUnderstanding: 'Real care verifies rhythm, pulse, perfusion, evolving compromise, acquired and reversible context, and pacing needs with qualified teams and real data.',
    briefIn: ['complete-heart-block'],
  },
  {
    id: 'complete-heart-block-controls-record-review-escalation-and-handoff-only',
    headline: 'The controls record review, pacing-capable escalation, elapsed reassessment, and definitive evaluation handoff; they do not deliver care.',
    simplification: 'Five clicks stand in for assessment, continuous monitoring, access and rescue readiness, consultation, shared decisions, communication, and handoff.',
    whereItMisleads: 'Equating button order with examination, ECG interpretation, pad placement, pacing, capture assessment, counseling quality, transfer, or cardiology competence.',
    correctUnderstanding: 'Actual care requires verified findings, qualified teams, immediate pathway switching when compromise develops, and patient-specific temporary and permanent pacing decisions.',
    briefIn: ['complete-heart-block'],
  },
  {
    id: 'no-live-heart-block-diagnosis-treatment-pacing-capture-device-or-outcome',
    headline: 'The lab does not diagnose cause, deliver treatment, pace, assess capture, choose or implant a device, or predict outcome.',
    simplification: 'No live exam, test acquisition or interpretation, oxygen, drug, infusion, pacing setting, sedation, temporary or permanent device, procedure, disposition, prognosis, benefit, or outcome is modeled.',
    whereItMisleads: 'Using rate alone, delaying escalation for atropine or a complete cause panel, inferring capture from monitor complexes, or copying fictional device choices.',
    correctUnderstanding: 'Use current specialty and acute-care guidance, local resources, qualified judgment, shared decisions, and explicit rescue and arrest pathway switching.',
    briefIn: ['complete-heart-block'],
  },
  {
    id: 'torsades-rhythm-pulse-long-qt-context-and-response-are-authored',
    headline: 'The torsades pattern, weak pulse, prolonged-QT context, compromise, and post-team sinus report are authored teaching facts.',
    simplification: 'One monitored-unit record supplies fixed pre-event ECG, rhythm, physiology, laboratory, medication, kidney, and response snapshots.',
    whereItMisleads: 'Treating the teaching waveform as a diagnostic ECG, measuring QT during polymorphic VT, or reading the authored sinus report as proof of cure or one cause.',
    correctUnderstanding: 'Real care verifies pulse and perfusion immediately, uses real ECG and monitoring, treats sustained polymorphic VT as electrically unstable, and reassesses continuously.',
    briefIn: ['torsades-de-pointes'],
  },
  {
    id: 'torsades-controls-record-rescue-prevention-and-handoff-intent-only',
    headline: 'The controls record unsynchronized-shock intent, later review, long-QT recurrence prevention, and handoff; they do not deliver care.',
    simplification: 'Six clicks stand in for emergency assessment, team activation, defibrillation, monitoring, treatment, consultation, communication, and handoff.',
    whereItMisleads: 'Equating button order with pulse or ECG interpretation, shock delivery, magnesium administration, electrolyte correction, pacing, or cardiology competence.',
    correctUnderstanding: 'Actual care requires qualified teams, immediate unsynchronized shock for sustained polymorphic VT, cause-specific treatment, and explicit arrest-pathway switching if the pulse is lost.',
    briefIn: ['torsades-de-pointes'],
  },
  {
    id: 'no-live-torsades-diagnosis-shock-medication-pacing-device-or-outcome',
    headline: 'The lab does not diagnose cause, choose energy, shock, medicate, correct electrolytes, pace, operate a device, or predict outcome.',
    simplification: 'No live exam, test acquisition or interpretation, oxygen, CPR, shock, drug, infusion, electrolyte, pacing, capture, device, procedure, disposition, recurrence, prognosis, benefit, or outcome is modeled.',
    whereItMisleads: 'Delaying shock for magnesium or a checklist, synchronizing polymorphic VT, generalizing magnesium to normal-QT polymorphic VT, or copying fictional values.',
    correctUnderstanding: 'Use current resuscitation guidance, local protocols, verified patient data, qualified judgment, toxicology or electrophysiology expertise, and continuous reassessment.',
    briefIn: ['torsades-de-pointes'],
  },
  {
    id: 'hyperkalemic-conduction-record-treatment-and-response-are-authored',
    headline: 'The pretreatment chemistry and rhythm, reported emergency care, and serial response are authored teaching facts.',
    simplification: 'One post-emergency record supplies fixed potassium, ECG, glucose, prior-care, and current-stability snapshots.',
    whereItMisleads: 'Treating the teaching waveform as diagnostic, assuming one potassium value proves cause, or reading conduction improvement as potassium removal.',
    correctUnderstanding: 'Real care verifies treatment delivery, serial ECG and laboratory findings, pulse and perfusion, glucose, rebound, and alternative causes with qualified teams.',
    briefIn: ['hyperkalemic-conduction-disturbance'],
  },
  {
    id: 'hyperkalemic-conduction-controls-record-review-restraint-and-handoff-only',
    headline: 'The controls record serial review, device restraint, and handoff; they do not deliver treatment or make device decisions.',
    simplification: 'Six clicks stand in for longitudinal record review, consultation, multidisciplinary care, communication, and handoff.',
    whereItMisleads: 'Equating button order with examination, ECG or laboratory interpretation, treatment delivery, pacing, device eligibility, or cardiology competence.',
    correctUnderstanding: 'Actual care uses verified data, qualified teams, current local protocols, continuous monitoring, and patient-specific pacing and device judgment.',
    briefIn: ['hyperkalemic-conduction-disturbance'],
  },
  {
    id: 'no-live-hyperkalemia-treatment-kinetics-pacing-device-or-outcome',
    headline: 'The lab does not model live treatment, potassium or glucose kinetics, pacing, a device, or outcome.',
    simplification: 'No live exam, specimen, ECG, laboratory, drug, dialysis, pacing, capture, device, disposition, prognosis, benefit, or outcome is modeled.',
    whereItMisleads: 'Inferring that calcium lowers potassium, temporary shifting removes potassium, ECG normalization resolves the disturbance, or a reversible state establishes a permanent-device indication.',
    correctUnderstanding: 'Use current protocols, serial verified findings, qualified judgment, and explicit reassessment of reversible and persistent conduction disturbance.',
    briefIn: ['hyperkalemic-conduction-disturbance'],
  },
  {
    id: 'pericardial-tamponade-findings-and-response-are-authored',
    headline: 'The pretreatment tamponade findings, reported drainage, and serial response are fixed teaching facts.',
    simplification: 'One record supplies fixed symptoms, perfusion, pressure, examination claims, echo findings, prior drainage, catheter output, and short-interval reassessment without acquiring any of them.',
    whereItMisleads: 'Treating one sign, effusion size, echo finding, drainage volume, or directional response as a universal diagnostic rule or proof of imaging competence, procedure success, or cure.',
    correctUnderstanding: 'Real tamponade is a clinical diagnosis integrating the patient trajectory with verified findings and imaging; response and risk vary with etiology, accumulation, physiology, and treatment.',
    briefIn: ['pericardial-tamponade'],
  },
  {
    id: 'pericardial-tamponade-drainage-is-prior-care',
    headline: 'Pericardiocentesis and catheter care are reported prior care, not learner-delivered procedures.',
    simplification: 'Controls review a fixed prior-care report and surveillance plan without selecting an approach, handling equipment, draining fluid, manipulating a catheter, assessing technical success, or applying a removal threshold.',
    whereItMisleads: 'Equating button order with pericardiocentesis, catheter-management, complication-recognition, imaging-guidance, or procedural competence.',
    correctUnderstanding: 'Drainage and catheter decisions require experienced operators, verified imaging and physiology, appropriate equipment, local protocols, and supervised procedural training.',
    briefIn: ['pericardial-tamponade'],
  },
  {
    id: 'pericardial-tamponade-etiology-and-recurrence-remain-open',
    headline: 'Active cancer, serosanguineous fluid, improvement, and one stable interval do not prove etiology or freedom from recurrence.',
    simplification: 'Selected fluid studies remain pending, alternate causes stay open, and the case ends after one fixed short-interval reassessment without a durable recurrence trajectory.',
    whereItMisleads: 'Labeling the effusion malignant or idiopathic from context or appearance, treating improvement as cure, or using the fictional interval to predict recurrence or prognosis.',
    correctUnderstanding: 'Etiology-directed testing, serial clinical and imaging reassessment, complication surveillance, and patient-specific follow-up remain necessary after drainage.',
    briefIn: ['pericardial-tamponade'],
  },
  {
    id: 'no-pericardial-testing-procedure-treatment-disposition-prognosis-or-outcome',
    headline: 'The lab does not diagnose cause, acquire tests, perform drainage, deliver treatment, manage a catheter, determine disposition, or predict outcome.',
    simplification: 'No live examination, ECG, monitoring, imaging, sampling, fluid or drug delivery, pericardiocentesis, surgery, catheter action, complication management, disposition, prognosis, recurrence, or outcome is modeled.',
    whereItMisleads: 'Using completion as evidence of diagnostic, imaging, procedural, catheter-care, treatment, oncology, disposition, or prognostic competence.',
    correctUnderstanding: 'Use current specialty guidance, verified patient data, qualified multidisciplinary judgment, local pathways, explicit deterioration triggers, and continued reassessment.',
    briefIn: ['pericardial-tamponade'],
  },
  {
    id: 'right-ventricular-infarction-findings-are-authored',
    headline: 'The right-sided ECG, echo, pressure, perfusion, rhythm, congestion, and later findings are authored reports.',
    simplification: 'One fixed record stands in for serial history, examination, ECG, imaging, monitoring, laboratory review, and team communication.',
    whereItMisleads: 'Treating V4R, clear lungs, JVP, one pressure, or one echo snapshot as universal diagnostic proof, a fluid target, or evidence of acquired interpretation skill.',
    correctUnderstanding: 'Real RV-infarction assessment integrates acute ischemia, whole-patient perfusion and congestion, serial verified ECG and imaging, dangerous alternatives, and current reperfusion pathways.',
    briefIn: ['right-ventricular-infarction'],
  },
  {
    id: 'right-ventricular-infarction-controls-record-review-and-handoff-only',
    headline: 'The controls record review, guardrails, reperfusion readiness, and handoff; they do not deliver care.',
    simplification: 'Five clicks stand in for multidisciplinary acute coronary care, repeated assessment, treatment selection, monitoring, consultation, and handoff.',
    whereItMisleads: 'Equating button order with ECG or echo interpretation, medication judgment, fluid responsiveness, PCI, rhythm rescue, or treatment competence.',
    correctUnderstanding: 'Actual care requires qualified teams, verified findings, continuous reassessment, patient-specific hemodynamic decisions, and uninterrupted time-sensitive reperfusion work.',
    briefIn: ['right-ventricular-infarction'],
  },
  {
    id: 'no-live-right-ventricular-infarction-testing-treatment-reperfusion-or-outcome',
    headline: 'The lab does not acquire tests, deliver fluid or medication, perform reperfusion, select a device, or predict outcome.',
    simplification: 'No live examination, ECG, imaging, laboratory, catheter, fluid, nitrate, diuretic, vasoactive, antithrombotic, oxygen, PCI, pacing, device, disposition, prognosis, or outcome is modeled.',
    whereItMisleads: 'Using completion as evidence of diagnostic, imaging, prescribing, fluid-management, reperfusion, device, rescue, disposition, or prognostic competence.',
    correctUnderstanding: 'Use current acute-coronary guidance, local protocols, verified patient data, qualified multidisciplinary judgment, and explicit rhythm, conduction, shock, mechanical, and pulse-loss rescue pathways.',
    briefIn: ['right-ventricular-infarction'],
  },
  {
    id: 'hypertensive-emergency-findings-and-panels-are-authored',
    headline: 'The pressure, measurement conditions, examination, fundoscopy, laboratory, ECG, echo, and later panels are authored teaching facts.',
    simplification: 'One fixed record stands in for repeated measurement, serial history and examination, monitoring, fundoscopy, specimen collection, ECG, imaging, and team communication.',
    whereItMisleads: 'Treating marked pressure alone as emergency, interpreting a fictional test as a learned skill, or treating the 45-minute and 3-hour snapshots as a universal response trajectory.',
    correctUnderstanding: 'Real hypertensive emergency requires verified measurement plus acute target-organ damage, current syndrome assessment, qualified teams, and serial patient-specific reassessment.',
    briefIn: ['hypertensive-emergency'],
  },
  {
    id: 'hypertensive-emergency-controls-record-review-and-intent-only',
    headline: 'The controls record review, controlled-reduction intent, elapsed panels, and handoff; they do not deliver care.',
    simplification: 'Six clicks stand in for monitored acute care, repeated assessment, treatment selection and titration, specialty consultation, communication, and handoff.',
    whereItMisleads: 'Equating button order with examination, diagnosis, prescribing, pressure targets, treatment delivery, monitoring, or emergency-care competence.',
    correctUnderstanding: 'Actual care uses the current organ-injury syndrome, verified patient data, local protocols, qualified judgment, appropriate monitoring, and explicit deterioration pathways.',
    briefIn: ['hypertensive-emergency'],
  },
  {
    id: 'no-live-hypertensive-emergency-testing-treatment-procedure-disposition-or-outcome',
    headline: 'The lab does not acquire tests, select or deliver treatment, perform a procedure, determine disposition, or predict outcome.',
    simplification: 'No live examination, pressure measurement, monitoring, ECG, fundoscopy, laboratory, imaging, drug, dose, infusion, oxygen, fluid, ventilation, procedure, disposition, prognosis, or outcome is modeled.',
    whereItMisleads: 'Copying fictional values as a drug or target recipe, rapidly normalizing pressure, or using completion as evidence of diagnostic, prescribing, treatment, disposition, or prognostic competence.',
    correctUnderstanding: 'Use current guidance, syndrome-specific pathways, verified measurements and organ findings, qualified multidisciplinary judgment, local treatment protocols, and continuous reassessment.',
    briefIn: ['hypertensive-emergency'],
  },
];

export function limitationsFor(scenarioId: string): Limitation[] {
  return LIMITATIONS.filter((limitation) => limitation.briefIn.includes(scenarioId));
}
