/**
 * The emergency-medicine module's limitations.
 *
 * Split out of the single register so a module's cockpit chunk carries its own entries and not the
 * other fourteen modules'. An entry is filed here if a emergency-medicine scenario names it through `briefIn`
 * or declares it in its own metadata; a few entries are named by scenarios in two modules and are
 * filed in both. The complete register is assembled in `../limitations.ts`.
 */

import type { Limitation } from './types';

export const EMERGENCY_MEDICINE_LIMITATIONS: readonly Limitation[] = [
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
];
