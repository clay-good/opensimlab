/**
 * Module prose lives apart from the declaration because the landing page renders only display
 * names. Shipping four paragraphs per module to every landing visitor cost real bytes against a
 * budget measured in hundreds of them, and nothing on that page ever displayed the text.
 */
export interface ModuleProse {
  /** One sentence: what it teaches. */
  readonly description: string;
  /** Who it is for. */
  readonly audience: string;
  /** What a learner should already know. */
  readonly prerequisites: string;
  /** What a planned module will cover. No date is ever promised. */
  readonly plannedScope?: string;
}


export const MODULE_PROSE: Readonly<Record<string, ModuleProse>> = {
  'anesthesia': {
    description: 'Induce and maintain general anaesthesia on a virtual patient, and watch what the drugs '
      + 'actually do to the physiology while you do it.',
    audience: 'Medical students on an anaesthesia rotation, first-year residents, and nurse anaesthetist students.',
    prerequisites: 'Basic cardiovascular and respiratory physiology. No prior anaesthesia experience.',
  },
  'emergency-medicine': {
    description: 'Assess an undifferentiated emergency patient, test the next useful hypothesis, and '
      + 'reassess the response in short, focused rehearsals.',
    audience: 'Medical students, emergency medicine residents, and acute-care trainees.',
    prerequisites: 'Basic cardiovascular and respiratory physiology and initial assessment of an acutely ill adult.',
    plannedScope: 'Twenty-five bounded emergency-department rehearsals spanning undifferentiated shock, '
      + 'respiratory failure, rhythm emergencies, neurologic deterioration, metabolic crises, '
      + 'toxicology, and trauma, beginning with assessment and reassessment of shock.',
  },
  'cardiology': {
    description: 'Read symptom trajectories, estimate clinical likelihood before testing, and make each cardiology decision earn its place.',
    audience: 'Medical students, residents, and clinicians rehearsing structured cardiovascular assessment.',
    prerequisites: 'Basic cardiovascular physiology and familiarity with focused history-taking.',
    plannedScope: 'Acute coronary syndromes, arrhythmia recognition and management, and the haemodynamics of '
      + 'heart failure, using the same waveform engine and the same compartment solver.',
  },
  'respiratory-medicine': {
    description: 'Practice calm reassessment of obstructive, hypoxemic, pleural, sleep-related, and neuromuscular respiratory failure.',
    audience: 'Medical students, residents, respiratory therapists, and acute-care trainees.',
    prerequisites: 'Basic respiratory physiology and familiarity with focused assessment of an acutely ill adult.',
    plannedScope: 'Fifteen bounded respiratory-medicine rehearsals spanning obstructive disease, oxygenation, '
      + 'ventilatory failure, pleural and parenchymal disease, escalation, longitudinal reassessment, and handoff.',
  },
  'pediatrics': {
    description: 'Practice calm whole-child recognition, reassessment, escalation, and handoff across pediatric emergencies.',
    audience: 'Medical students, residents, nurses, and acute-care trainees caring for children.',
    prerequisites: 'Basic pediatric assessment and respiratory and cardiovascular physiology.',
    plannedScope: 'Sixteen bounded pediatric rehearsals spanning respiratory distress, common respiratory '
      + 'emergencies, sepsis and shock, metabolic and neurologic crises, rhythms, resuscitation, '
      + 'airway obstruction, and safeguarding escalation.',
  },
  'neurology': {
    description: 'Practice calm neurological pattern recognition, serial reassessment, escalation, and handoff across acute brain, spinal cord, neuromuscular, and autonomic emergencies.',
    audience: 'Medical students, residents, nurses, and acute-care trainees assessing neurological change.',
    prerequisites: 'Basic neurological assessment and cardiovascular and respiratory physiology.',
    plannedScope: 'Fifteen bounded neurology rehearsals spanning acute stroke, seizures, central and peripheral '
      + 'neuromuscular decline, infection, raised pressure, spinal emergencies, delirium, and '
      + 'autonomic dysreflexia.',
  },
  'toxicology': {
    description: 'Practice calm recognition, support, antidote boundaries, serial reassessment, and handoff across high-risk poisonings.',
    audience: 'Medical students, residents, nurses, pharmacists, and acute-care trainees assessing suspected poisoning.',
    prerequisites: 'Basic emergency assessment, respiratory and cardiovascular physiology, and medication safety.',
    plannedScope: 'Fifteen bounded toxicology rehearsals spanning opioid, analgesic, cardiovascular, autonomic, '
      + 'metabolic, inhalational, local-anesthetic, and dyshemoglobin emergencies.',
  },
  'obstetrics': {
    description: 'Practice calm recognition, coordinated response, reassessment, and handoff across delivery-room and postpartum emergencies.',
    audience: 'Medical students, residents, midwives, nurses, and acute-care trainees supporting pregnancy and birth.',
    prerequisites: 'Basic obstetric assessment and cardiovascular and respiratory physiology.',
    plannedScope: 'Fifteen bounded obstetric rehearsals spanning postpartum hemorrhage, hypertensive and seizure '
      + 'emergencies, sepsis, collapse, delivery-room escalation, medication safety, airway risk, and maternal-newborn handoff.',
  },
  'neonatology': {
    description: 'Practice calm newborn transition, escalation, reassessment, and handoff while keeping the parent-newborn dyad together.',
    audience: 'Medical students, residents, midwives, nurses, respiratory therapists, and acute-care trainees supporting newborns.',
    prerequisites: 'Basic newborn assessment and respiratory, cardiovascular, and thermal physiology.',
    plannedScope: 'Eleven bounded neonatal rehearsals spanning normal transition, ventilation, bradycardia, '
      + 'respiratory distress, glucose, infection, thermal care, escalation, and handoff.',
  },
  'endocrine-metabolic': {
    description: 'Practice calm metabolic trajectory review, treatment boundaries, transition readiness, and recurrence-aware handoff.',
    audience: 'Medical students, residents, nurses, pharmacists, dietitians, and acute-care trainees supporting metabolic emergencies.',
    prerequisites: 'Basic glucose, electrolyte, acid-base, renal, and cardiovascular physiology.',
    plannedScope: 'Twelve bounded endocrine and metabolic rehearsals spanning hyperglycemic crises, '
      + 'hypoglycemia, adrenal and thyroid emergencies, calcium disorders, sodium and nutrition-related shifts, and perioperative diabetes.',
  },
  'renal-electrolyte': {
    description: 'Practice calm kidney and electrolyte reassessment, immediate protection, treatment boundaries, and recurrence-aware handoff.',
    audience: 'Medical students, residents, nurses, pharmacists, and acute-care trainees supporting kidney and electrolyte emergencies.',
    prerequisites: 'Basic kidney, electrolyte, acid-base, and cardiovascular physiology.',
    plannedScope: 'Twelve bounded renal and electrolyte rehearsals spanning potassium, sodium, calcium, '
      + 'magnesium, acute kidney injury, acid-base disorders, and dialysis-related deterioration.',
  },
  'infectious-disease': {
    description: 'Practice calm recognition of dangerous infection, timely activation, treatment boundaries, serial reassessment, and handoff.',
    audience: 'Medical students, residents, nurses, pharmacists, and acute-care trainees assessing suspected serious infection.',
    prerequisites: 'Basic emergency assessment, cardiovascular and respiratory physiology, and antimicrobial stewardship principles.',
    plannedScope: 'Ten bounded infectious-disease rehearsals spanning invasive bacterial sepsis, soft-tissue and '
      + 'central-nervous-system infection, neutropenic and device-associated risk, and escalation timing.',
  },
  'medical-surgical-nursing': {
    description: 'Practice recognition, escalation, and honest handoff on the ward, where the tools are imperfect and the deterioration is quiet.',
    audience: 'Nursing students, newly registered nurses, and ward teams responsible for recognising and escalating change.',
    prerequisites: 'Basic assessment, vital-sign interpretation, and familiarity with local escalation pathways.',
    plannedScope:
      'Nine bounded ward rehearsals spanning early-warning scores and what they do not exclude, measurement error '
      + 'in the observations themselves, escalation that fails for social reasons, and what a handover loses.',
  },
  'oncology': {
    description: 'Practice the recognition problems cancer treatment creates: an exposure that has already stopped, a complication that arrives late, and a decision that belongs to another team.',
    audience: 'Medical students, residents, and acute and emergency clinicians who meet these patients away from the oncology service.',
    prerequisites: 'Basic pharmacology, history taking, and familiarity with escalation to a treating specialty.',
    plannedScope: 'Eleven bounded haematology and oncology rehearsals spanning delayed immune-related events, '
      + 'treatment emergencies that present without their label, and returning a problem to the team holding the '
      + 'treatment record.',
  },
  'surgery-trauma': {
    description: 'Planned.',
    audience: 'Medical students, surgical and emergency trainees, and teams receiving injured patients.',
    prerequisites: 'Primary-survey familiarity, basic resuscitation, and escalation to a surgical team.',
    plannedScope: 'Ten bounded surgery and trauma rehearsals spanning the deteriorating post-operative patient, '
      + 'injury patterns whose severity is not yet visible, damage-control priorities, and the decision to call '
      + 'for an operation somebody else will do.',
  },
  'critical-care': {
    description: 'Reassess organ support over time and make each ventilator, circulation, and escalation change earn a measured response.',
    audience: 'Residents and advanced practice trainees.',
    prerequisites: 'The anaesthesia module, or equivalent familiarity with ventilation and vasoactive support.',
    plannedScope: 'Twenty-four bounded ICU rehearsals spanning ventilation, shock, neurologic and renal support, '
      + 'device failures, longitudinal reassessment, and handoff, beginning with ARDS ventilation.',
  },
};

export function moduleProse(id: string): ModuleProse {
  const prose = MODULE_PROSE[id];
  if (!prose) throw new Error(`unknown module prose: ${id}`);
  return prose;
}
