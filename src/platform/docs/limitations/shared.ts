/**
 * Limitations that no scenario briefing names.
 *
 * They belong to the register rather than to a module, so they are published on the limitations
 * page and never enter a cockpit chunk.
 */

import type { Limitation } from './types';

export const SHARED_LIMITATIONS: readonly Limitation[] = [
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
];
