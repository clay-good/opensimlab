/**
 * The source register.
 *
 * Every external source this project draws a number, a threshold or a claim from
 * appears here once, with what was taken from it and how the citation itself was
 * checked. A test asserts that every PMID appearing anywhere in the source tree
 * is in this register, so a citation cannot be added to the code without being
 * recorded and checked here.
 *
 * WHY THIS EXISTS. An audit found the age-related MAC relation and all five
 * MAC-at-40 values attributed to Nickalls and Mapleson 2003. They are from
 * Mapleson 1996; the 2003 paper is the iso-MAC charts built on that relation. A
 * reader checking the numbers against the cited paper would not have found them,
 * and nothing in the project would have caught it. A citation nobody can check
 * is worth less than no citation, because it looks like one.
 *
 * `verifiedAgainst` records what the entry was checked against, not somebody's
 * recollection. Every PubMed entry below was confirmed by retrieving its record
 * from the NCBI E-utilities API and comparing author, title, journal, year and
 * pages field by field.
 */

export interface Source {
  /** Stable id, used to reference this source from code and tests. */
  readonly id: string;
  /** PubMed identifier, where the source is indexed there. */
  readonly pmid?: string;
  /**
   * For a standard or guideline rather than a paper: when the issuing body last
   * amended it, and where that was read.
   *
   * A journal article is fixed once published. A standard is not — it is amended
   * and the old version quietly stops being the one anybody follows. This
   * project told learners it was showing them the 2020 revision of the ASA
   * monitoring standards for as long as the current revision was 2025, because
   * nothing here ever went and looked.
   */
  readonly currency?: { readonly lastAmended: string; readonly checkedAt: string };
  readonly authors: string;
  readonly title: string;
  /** Journal or issuing body. */
  readonly publication: string;
  readonly year: number;
  /** Volume and pages, or a version designation for a standard. */
  readonly locator: string;
  /**
   * Deliberately not pinned to a version or a year.
   *
   * For a document the issuing body revises continuously and publishes only as
   * "current", naming a year would go stale silently — which is exactly the
   * failure this register exists to catch. Saying "the current one" stays true.
   * Only set this where a pinned version genuinely does not exist to cite.
   */
  readonly unpinned?: boolean;
  /** Exactly what this project takes from it. Specific, not "pharmacology". */
  readonly usedFor: string;
  /** What the citation was checked against, and when. */
  readonly verifiedAgainst: string;
  readonly verifiedOn: string;
}

const NCBI = 'NCBI E-utilities record, field by field';
const CHECKED = '2026-08-20';

export const SOURCES: readonly Source[] = [
  // --- Pharmacokinetic and pharmacodynamic models ---------------------------
  {
    id: 'absalom-kenny-paedfusor-2005',
    pmid: '15941735',
    authors: 'Absalom A, Kenny G',
    title: 'Paedfusor pharmacokinetic data set',
    publication: 'Br J Anaesth', year: 2005, locator: '95:110',
    usedFor: 'The age-1-to-12 Paedfusor propofol compartment volumes, transfer, elimination, and '
      + 'effect-site equilibration rate constants, and the explicit boundary that this is a pediatric pharmacokinetic '
      + 'model rather than validated pediatric depth pharmacodynamics.',
    verifiedAgainst: NCBI, verifiedOn: '2026-08-23',
  },
  {
    id: 'absalom-paedfusor-accuracy-2003',
    pmid: '14504151',
    authors: 'Absalom A, Amutike D, Lal A, White M, Kenny GNC',
    title: 'Accuracy of the Paedfusor in children undergoing cardiac surgery or catheterization',
    publication: 'Br J Anaesth', year: 2003, locator: '91:507-13',
    usedFor: 'The Paedfusor evaluation population and predictive-performance evidence, including '
      + 'the limits of generalizing its concentration predictions beyond the studied children.',
    verifiedAgainst: NCBI, verifiedOn: '2026-08-23',
  },
  {
    id: 'dailymed-propofol-current',
    authors: 'US National Library of Medicine',
    title: 'Propofol injectable emulsion prescribing information',
    publication: 'DailyMed', year: 2026, locator: 'Current online drug label', unpinned: true,
    usedFor: 'The 2.5–3.5 mg/kg labeled induction range for healthy pediatric patients aged '
      + '3–16 years used as the bounded dosing objective in the routine pediatric case.',
    verifiedAgainst: 'DailyMed current propofol injectable emulsion label',
    verifiedOn: '2026-08-23',
  },
  {
    id: 'mccoy-rocuronium-1993',
    pmid: '8460753',
    authors: 'McCoy EP, Mirakhur RK, Maddineni VR, Wierda JMKH, Proost JH',
    title: 'Neuromuscular effects of rocuronium bromide (Org 9426) during fentanyl and halothane anaesthesia',
    publication: 'Anaesthesia',
    year: 1993,
    locator: '48:103-5',
    usedFor: 'Adult dose-response onset and spontaneous-recovery landmarks used to calibrate the '
      + 'explicitly labeled rocuronium clinical-course teaching model. The compact PK/PD '
      + 'parameters are Open Sim Lab constructions, not transcribed study parameters.',
    verifiedAgainst: NCBI,
    verifiedOn: '2026-08-23',
  },
  {
    id: 'eleveld-2018',
    pmid: '29661412',
    authors: 'Eleveld DJ, Colin P, Absalom AR, Struys MMRF',
    title: 'Pharmacokinetic-pharmacodynamic model for propofol for broad application in anaesthesia and sedation',
    publication: 'Br J Anaesth',
    year: 2018,
    locator: '120:942-59',
    usedFor: 'The default adult propofol model: the implemented deterministic population-mean '
      + 'fixed effects, the covariate equations for '
      + 'V1, V2, V3, CL, Q2, Q3 and ke0, the depth-index Ce50, and the asymmetric gamma blend '
      + 'from the final PD NONMEM stream in Supplementary Digital Content S4.',
    verifiedAgainst: NCBI,
    verifiedOn: CHECKED,
  },
  {
    id: 'schnider-1998',
    pmid: '9605675',
    authors: 'Schnider TW, Minto CF, Gambus PL, Andresen C, Goodale DB, Shafer SL, Youngs EJ',
    title: 'The influence of method of administration and covariates on the pharmacokinetics of propofol in adult volunteers',
    publication: 'Anesthesiology',
    year: 1998,
    locator: '88:1170-82',
    usedFor: 'The Schnider propofol model, offered as an alternative to Eleveld so a learner can '
      + 'see two models disagree about the same patient.',
    verifiedAgainst: NCBI,
    verifiedOn: CHECKED,
  },
  {
    id: 'marsh-1991',
    pmid: '1859758',
    authors: 'Marsh B, White M, Morton N, Kenny GNC',
    title: 'Pharmacokinetic model driven infusion of propofol in children',
    publication: 'Br J Anaesth',
    year: 1991,
    locator: '67:41-8',
    usedFor: 'The Marsh propofol model, and its fixed-rate-constant structure.',
    verifiedAgainst: NCBI,
    verifiedOn: CHECKED,
  },
  {
    id: 'minto-1997-i',
    pmid: '9009935',
    authors: 'Minto CF, Schnider TW, Egan TD, Youngs E, Lemmens HJM, Gambus PL, et al.',
    title: 'Influence of age and gender on the pharmacokinetics and pharmacodynamics of remifentanil. I. Model development',
    publication: 'Anesthesiology',
    year: 1997,
    locator: '86:10-23',
    usedFor: 'The remifentanil model: fixed effects and the lean-body-mass and age covariates.',
    verifiedAgainst: NCBI,
    verifiedOn: CHECKED,
  },
  {
    id: 'minto-1997-ii',
    pmid: '9009936',
    authors: 'Minto CF, Schnider TW, Shafer SL',
    title: 'Pharmacokinetics and pharmacodynamics of remifentanil. II. Model application',
    publication: 'Anesthesiology',
    year: 1997,
    locator: '86:24-33',
    usedFor: 'Application of the remifentanil model, including context-sensitive behaviour.',
    verifiedAgainst: NCBI,
    verifiedOn: CHECKED,
  },
  {
    id: 'al-sallami-2015',
    pmid: '25940825',
    authors: 'Al-Sallami HS, Goulding A, Grant A, Taylor R, Holford N, Duffull SB',
    title: 'Prediction of Fat-Free Mass in Children',
    publication: 'Clin Pharmacokinet',
    year: 2015,
    locator: '54:1169-78',
    usedFor: 'Fat-free mass, which Eleveld uses for V3 and Q3. Applied continuously at every age, '
      + 'as Eleveld does, rather than switching to an adult equation at eighteen.',
    verifiedAgainst: NCBI,
    verifiedOn: CHECKED,
  },
  {
    id: 'greco-1995',
    pmid: '7568331',
    authors: 'Greco WR, Bravo G, Parsons JC',
    title: 'The search for synergy: a critical review from a response surface perspective',
    publication: 'Pharmacol Rev',
    year: 1995,
    locator: '47:331-85',
    usedFor: 'The interaction FORM used for hypnotic-opioid synergy. The two parameters this '
      + 'project puts into that form are its own calibration, not this paper\'s, and the '
      + 'limitations register says so.',
    verifiedAgainst: NCBI,
    verifiedOn: CHECKED,
  },
  {
    id: 'varvel-1992',
    pmid: '1588504',
    authors: 'Varvel JR, Donoho DL, Shafer SL',
    title: 'Measuring the predictive performance of computer-controlled infusion pumps',
    publication: 'J Pharmacokinet Biopharm',
    year: 1992,
    locator: '20:63-94',
    usedFor: 'The framework the validation report would use to quantify model accuracy — bias, '
      + 'inaccuracy, variability and divergence. No model here has been measured against it yet, '
      + 'and the report says so rather than leaving the columns to imply otherwise.',
    verifiedAgainst: NCBI,
    verifiedOn: CHECKED,
  },

  // --- Physiology ------------------------------------------------------------
  {
    id: 'mapleson-1996',
    pmid: '8777094',
    authors: 'Mapleson WW',
    title: 'Effect of age on MAC in humans: a meta-analysis',
    publication: 'Br J Anaesth',
    year: 1996,
    locator: '76:179-85',
    usedFor: 'The age relation MAC = MAC40 x 10^(-0.00269(age-40)), its 95% confidence limits, '
      + 'and every MAC-at-40 value used: isoflurane 1.17%, sevoflurane 1.80%, desflurane 6.6%, '
      + 'nitrous oxide 104%. All stated directly in the abstract.',
    verifiedAgainst: `${NCBI}; the abstract text was retrieved and the constants read from it`,
    verifiedOn: CHECKED,
  },
  {
    id: 'nickalls-mapleson-2003',
    pmid: '12878613',
    authors: 'Nickalls RWD, Mapleson WW',
    title: 'Age-related iso-MAC charts for isoflurane, sevoflurane and desflurane in man',
    publication: 'Br J Anaesth',
    year: 2003,
    locator: '91:170-4',
    usedFor: 'The clinical application of the age relation as iso-MAC charts. NOT the source of '
      + 'the relation or of the MAC-at-40 values, which this project previously attributed to it '
      + 'in error; those are Mapleson 1996.',
    verifiedAgainst: NCBI,
    verifiedOn: CHECKED,
  },
  {
    id: 'severinghaus-1979',
    pmid: '35496',
    authors: 'Severinghaus JW',
    title: 'Simple, accurate equations for human blood O2 dissociation computations',
    publication: 'J Appl Physiol',
    year: 1979,
    locator: '46:599-602',
    usedFor: 'The oxyhaemoglobin dissociation curve, as the inversion S = 1 / (23400 / (PO2^3 + '
      + '150 PO2) + 1), transcribed from the abstract. The paper states it fits the standard '
      + 'curve to within +/- 0.0055 fractional saturation.',
    verifiedAgainst: `${NCBI}; the equation was compared character by character with the abstract`,
    verifiedOn: CHECKED,
  },
  {
    id: 'benumof-1997',
    pmid: '9357902',
    authors: 'Benumof JL, Dagg R, Benumof R',
    title: 'Critical hemoglobin desaturation will occur before return to an unparalyzed state following 1 mg/kg intravenous succinylcholine',
    publication: 'Anesthesiology',
    year: 1997,
    locator: '87:979-82',
    usedFor: 'The apnoea benchmark the respiratory model is checked against: about 8 minutes to '
      + '90% saturation in a preoxygenated healthy adult, 5 in a moderately ill adult and 2.7 in '
      + 'an obese adult.',
    verifiedAgainst: NCBI,
    verifiedOn: CHECKED,
  },
  {
    id: 'videira-pediatric-preoxygenation-1992',
    pmid: '1549927',
    authors: 'Videira RL, Neto PP, do Amaral RV, Freeman JA',
    title: 'Preoxygenation in children: for how long?',
    publication: 'Acta Anaesthesiol Scand', year: 1992, locator: '36:109-11',
    usedFor: 'The pediatric induction scenario\'s preoxygenation lesson: in a small trial, three '
      + 'minutes rather than one prolonged mean time to 90% saturation during apnea from 91 to 144 seconds.',
    verifiedAgainst: NCBI, verifiedOn: '2026-08-23',
  },
  {
    id: 'thorsteinsson-pediatric-frc-1990',
    pmid: '2240677',
    authors: 'Thorsteinsson A, Jonmarker C, Larsson A, Vilstrup C, Werner O',
    title: 'Functional residual capacity in anesthetized children: normal values and values in children with cardiac anomalies',
    publication: 'Anesthesiology', year: 1990, locator: '73:876-81',
    usedFor: 'The nonlinear weight regression for functional residual capacity in healthy '
      + 'anesthetized children aged 0.1–11.2 years used by the bounded healthy-child respiratory profile.',
    verifiedAgainst: NCBI, verifiedOn: '2026-08-23',
  },
  {
    id: 'lindahl-pediatric-metabolism-1989',
    pmid: '2492815',
    authors: 'Lindahl SG',
    title: 'Oxygen consumption and carbon dioxide elimination in infants and children during anaesthesia and surgery',
    publication: 'Br J Anaesth', year: 1989, locator: '62:70-6',
    usedFor: 'The body-weight equations anchoring oxygen consumption and carbon-dioxide production '
      + 'in the bounded healthy-child respiratory profile.',
    verifiedAgainst: NCBI, verifiedOn: '2026-08-23',
  },
  {
    id: 'numa-newth-dead-space-1996',
    pmid: '8727530',
    authors: 'Numa AH, Newth CJL',
    title: 'Anatomic dead space in infants and children',
    publication: 'J Appl Physiol', year: 1996, locator: '80:1485-9',
    usedFor: 'The age-and-weight dead-space equation used by the bounded healthy-child respiratory profile.',
    verifiedAgainst: NCBI, verifiedOn: '2026-08-23',
  },
  {
    id: 'lindahl-hulse-hatch-pediatric-ventilation-1984',
    pmid: '6419754',
    authors: 'Lindahl SG, Hulse MG, Hatch DJ',
    title: 'Ventilation and gas exchange during anaesthesia and surgery in spontaneously breathing infants and children',
    publication: 'Br J Anaesth', year: 1984, locator: '56:121-9',
    usedFor: 'The anesthetized-child measurements supporting the conservative 6 mL/kg '
      + 'spontaneous-tidal-volume approximation in the bounded healthy-child respiratory profile.',
    verifiedAgainst: NCBI, verifiedOn: '2026-08-23',
  },
  {
    id: 'mcsharry-2003',
    pmid: '12669985',
    authors: 'McSharry PE, Clifford GD, Tarassenko L, Smith LA',
    title: 'A dynamical model for generating synthetic electrocardiogram signals',
    publication: 'IEEE Trans Biomed Eng',
    year: 2003,
    locator: '50:289-94',
    usedFor: 'The ECG waveform model, implemented from the equations in the paper. No code from '
      + 'the ECGSYN reference implementation is used, because it is GPL and this project is MIT.',
    verifiedAgainst: NCBI,
    verifiedOn: CHECKED,
  },

  // --- Hypotension thresholds ------------------------------------------------
  {
    id: 'walsh-2013',
    pmid: '23835589',
    authors: 'Walsh M, Devereaux PJ, Garg AX, Kurz A, Turan A, Rodseth RN, et al.',
    title: 'Relationship between intraoperative mean arterial pressure and clinical outcomes after noncardiac surgery: toward an empirical definition of hypotension',
    publication: 'Anesthesiology',
    year: 2013,
    locator: '119:507-15',
    usedFor: 'The high-priority mean-arterial-pressure alarm at 55 mmHg, and the finding that exposure '
      + 'below it for as little as one to five minutes is associated with acute kidney and '
      + 'myocardial injury.',
    verifiedAgainst: NCBI,
    verifiedOn: CHECKED,
  },
  {
    id: 'salmasi-2017',
    pmid: '27792044',
    authors: 'Salmasi V, Maheshwari K, Yang D, Mascha EJ, Singh A, Sessler DI, Kurz A',
    title: 'Relationship between Intraoperative Hypotension, Defined by Either Reduction from Baseline or Absolute Thresholds, and Acute Kidney and Myocardial Injury after Noncardiac Surgery',
    publication: 'Anesthesiology',
    year: 2017,
    locator: '126:47-65',
    usedFor: 'One of the two sources for the medium-priority mean-arterial-pressure alarm at 65 mmHg.',
    verifiedAgainst: NCBI,
    verifiedOn: CHECKED,
  },
  {
    id: 'sessler-2019',
    pmid: '30916004',
    authors: 'Sessler DI, Bloomstone JA, Aronson S, Berry C, Gan TJ, Kellum JA, et al.',
    title: 'Perioperative Quality Initiative consensus statement on intraoperative blood pressure, risk and outcomes for elective surgery',
    publication: 'Br J Anaesth',
    year: 2019,
    locator: '122:563-74',
    usedFor: 'The other source for the medium-priority mean-arterial-pressure alarm at 65 mmHg.',
    verifiedAgainst: NCBI,
    verifiedOn: CHECKED,
  },

  // --- Guidelines and protocols ----------------------------------------------
  {
    id: 'asa-difficult-airway-2022',
    pmid: '34762729',
    authors: 'Apfelbaum JL, Hagberg CA, Connis RT, Abdelmalak BB, Agarkar M, Dutton RP, et al.',
    title: '2022 American Society of Anesthesiologists Practice Guidelines for Management of the Difficult Airway',
    publication: 'Anesthesiology',
    year: 2022,
    locator: '136:31-81',
    usedFor: 'The airway guideline named by the United States practice-region profile and the '
      + 'difficult-airway rescue case: call for help, track elapsed time and oxygen saturation, '
      + 'limit repeated attempts, use supraglottic rescue when appropriate, and confirm ventilation.',
    verifiedAgainst: NCBI,
    verifiedOn: CHECKED,
  },
  {
    id: 'asa-neuromuscular-blockade-2023',
    pmid: '36520073',
    authors: 'Thilen SR, Weigel WA, Todd MM, Dutton RP, Lien CA, Grant SA, et al.',
    title: '2023 American Society of Anesthesiologists Practice Guidelines for Monitoring and '
      + 'Antagonism of Neuromuscular Blockade',
    publication: 'Anesthesiology',
    year: 2023,
    locator: '138:13-41',
    usedFor: 'The quantitative train-of-four teaching: monitor at the adductor pollicis and '
      + 'confirm a train-of-four ratio of at least 0.9 before extubation. The current slice does '
      + 'not implement or teach reversal dosing.',
    verifiedAgainst: NCBI,
    verifiedOn: CHECKED,
  },
  {
    id: 'das-extubation-2012',
    pmid: '22321104',
    authors: 'Difficult Airway Society Extubation Guidelines Group, Popat M, Mitchell V, Dravid R, Patel A, Swampillai C, Higgs A',
    title: 'Difficult Airway Society Guidelines for the management of tracheal extubation',
    publication: 'Anaesthesia',
    year: 2012,
    locator: '67:318-40',
    usedFor: 'The laryngospasm case\'s explicitly partial initial-response sequence: call for help, '
      + 'ensure airway patency, apply continuous positive airway pressure with 100% oxygen, deepen '
      + 'with propofol, and escalate to succinylcholine when closure persists or saturation falls.',
    verifiedAgainst: NCBI,
    verifiedOn: '2026-08-23',
  },
  {
    id: 'visvanathan-laryngospasm-2005',
    pmid: '15933300',
    authors: 'Visvanathan T, Kluger MT, Webb RK, Westhorpe RN',
    title: 'Crisis management during anaesthesia: laryngospasm',
    publication: 'Qual Saf Health Care',
    year: 2005,
    locator: '14:e3',
    usedFor: 'The laryngospasm case rationale and presentation: 189 AIMS incidents, direct airway '
      + 'stimulation as a common precipitant, desaturation in more than 60%, and the need for '
      + 'prompt structured recognition and management.',
    verifiedAgainst: NCBI,
    verifiedOn: '2026-08-23',
  },
  {
    id: 'mhaus-managing-crisis-current',
    authors: 'Malignant Hyperthermia Association of the United States',
    title: 'Managing a Crisis: Emergency Treatment for an Acute MH Event',
    publication: 'MHAUS', year: 2026,
    locator: 'Current online acute-crisis protocol', unpinned: true,
    usedFor: 'The initial-response sequence and thresholds: discontinue triggers, 100% oxygen at '
      + '10 L/min flow, 2.5 mg/kg IV dantrolene repeated to observable response, cooling above '
      + '39°C and stopping below 38°C, plus the complete steps this slice explicitly omits.',
    verifiedAgainst: 'The issuing body\'s current Managing a Crisis page, step by step',
    verifiedOn: '2026-08-23',
  },
  {
    id: 'emhg-mh-crisis-2024',
    pmid: '39482150',
    authors: 'Glahn KPE, Girard T, Hellblom A, Hopkins PM, Johannsen S, Rüffert H, Snoeck MM, Urwyler A',
    title: 'Recognition and management of a malignant hyperthermia crisis: updated 2024 guideline from the European Malignant Hyperthermia Group',
    publication: 'Br J Anaesth', year: 2025, locator: '134:221-3',
    usedFor: 'Current independent guideline support for early recognition, removal of volatile '
      + 'triggers, hyperventilation with 100% oxygen, and prompt dantrolene.',
    verifiedAgainst: NCBI, verifiedOn: '2026-08-23',
  },
  {
    id: 'hopkins-mh-2020',
    pmid: '33399225',
    authors: 'Hopkins PM, Girard T, Dalay S, Jenkins B, Thacker A, Patteril M, McGrady E',
    title: 'Malignant hyperthermia 2020: Guideline from the Association of Anaesthetists',
    publication: 'Anaesthesia', year: 2021, locator: '76:655-64',
    usedFor: 'The volatile-triggered susceptible profile, rare-event incidence range, early '
      + 'hypermetabolic presentation, and the boundary between acute response and post-crisis care.',
    verifiedAgainst: NCBI, verifiedOn: '2026-08-23',
  },
  {
    id: 'larach-mh-registry-2010',
    pmid: '20081135',
    authors: 'Larach MG, Gronert GA, Allen GC, Brandom BW, Lehman EB',
    title: 'Clinical presentation, treatment, and complications of malignant hyperthermia in North America from 1987 to 2006',
    publication: 'Anesth Analg', year: 2010, locator: '110:498-507',
    usedFor: 'The early pattern and urgency: hypercarbia and sinus tachycardia were frequent '
      + 'initial signs, while complications increased with higher temperature and delayed dantrolene.',
    verifiedAgainst: NCBI, verifiedOn: '2026-08-23',
  },
  {
    id: 'nap6-epidemiology-2018',
    pmid: '29935567',
    authors: 'Harper NJN, Cook TM, Garcez T, Farmer L, Floss K, Marinho S, et al.',
    title: 'Anaesthesia, surgery, and life-threatening allergic reactions: epidemiology and clinical features of perioperative anaphylaxis in the 6th National Audit Project (NAP6)',
    publication: 'Br J Anaesth', year: 2018, locator: '121:159-71',
    usedFor: 'The perioperative-anaphylaxis case frequency and presentation: approximately 1 in '
      + '10,000 anesthetics; hypotension as the first feature in 46%, bronchospasm in 18%; and '
      + 'antibiotics as 94 of 199 identified culprits versus 65 neuromuscular blockers.',
    verifiedAgainst: NCBI, verifiedOn: '2026-08-23',
  },
  {
    id: 'nap6-management-2018',
    pmid: '29935569',
    authors: 'Harper NJN, Cook TM, Garcez T, Lucas DN, Thomas M, Kemp H, et al.',
    title: 'Anaesthesia, surgery, and life-threatening allergic reactions: management and outcomes of perioperative anaphylaxis in the 6th National Audit Project (NAP6)',
    publication: 'Br J Anaesth', year: 2018, locator: '121:172-88',
    usedFor: 'The case emphasis on prompt epinephrine and volume support, while explicitly '
      + 'excluding the complete refractory pathway and post-event investigation.',
    verifiedAgainst: NCBI, verifiedOn: '2026-08-23',
  },
  {
    id: 'rcuk-perioperative-anaphylaxis-2024',
    pmid: '38205901',
    authors: 'Soar J, Savic L, Baretto R, Dewachter P, Harper NJN, Light K, et al.',
    title: 'Emergency treatment of peri-operative anaphylaxis: Resuscitation Council UK algorithm for anaesthetists',
    publication: 'Anaesthesia', year: 2024, locator: '79:535-41',
    usedFor: 'The modeled adult initial 50 microgram intravenous epinephrine action, 100% oxygen, '
      + 'and rapid 500-1,000 mL crystalloid bolus. The simulator does not implement the complete algorithm.',
    verifiedAgainst: NCBI, verifiedOn: '2026-08-23',
  },
  {
    id: 'das-2015',
    pmid: '26556848',
    authors: 'Frerk C, Mitchell VS, McNarry AF, Mendonca C, Bhagrath R, Patel A, et al.',
    title: 'Difficult Airway Society 2015 guidelines for management of unanticipated difficult intubation in adults',
    publication: 'Br J Anaesth',
    year: 2015,
    locator: '115:827-48',
    usedFor: 'The airway guideline named by the United Kingdom practice-region profile and the '
      + 'difficult-airway case boundary: declare failed intubation, prioritize oxygenation with a '
      + 'second-generation supraglottic airway, limit attempts, then stop and choose the next plan.',
    verifiedAgainst: NCBI,
    verifiedOn: CHECKED,
  },
  {
    id: 'asra-last-2020',
    pmid: '33148630',
    authors: 'Neal JM, Neal EJ, Weinberg GL',
    title: 'American Society of Regional Anesthesia and Pain Medicine Local Anesthetic Systemic Toxicity checklist: 2020 version',
    publication: 'Reg Anesth Pain Med',
    year: 2021,
    locator: '46:81-2',
    usedFor: 'The 2020 local-anesthetic systemic-toxicity checklist steps modeled here: airway '
      + 'management, benzodiazepine seizure suppression, epinephrine no greater than 1 microgram/kg, '
      + 'avoidance of vasopressin, beta blockers, calcium-channel blockers and local anesthetic, '
      + 'and initial 20% lipid dosing. Below 70 kg the model uses a 1.5 mL/kg bolus and 0.25 mL/kg/min '
      + 'infusion; at 70 kg or more it uses about 100 mL and 250 mL over 20 minutes. Total lipid is '
      + 'capped at 12 mL/kg. The checklist version is 2020 and publication year is 2021.',
    verifiedAgainst: NCBI,
    verifiedOn: CHECKED,
  },
  {
    id: 'aha-adult-cardiac-arrest-2025',
    authors: 'American Heart Association',
    title: 'Adult Cardiac Arrest Algorithm',
    publication: '2025 American Heart Association Guidelines for CPR and ECC',
    year: 2025,
    locator: 'Adult VF/pVT/Asystole/PEA algorithm, May 2025',
    usedFor: 'The bounded persistent-VF sequence: high-quality CPR at 100-120/min, oxygen and '
      + 'ventilation, 1 mg IV/IO epinephrine every 3-5 minutes, rhythm discrimination, and '
      + 'biphasic shock energy following manufacturer guidance (for example 120-200 J). The '
      + 'scenario declares one teaching device at 200 J and does not generalize that setting.',
    verifiedAgainst: 'American Heart Association official 2025 algorithm PDF and accessible text',
    verifiedOn: '2026-08-24',
    currency: { lastAmended: '2025-05-27', checkedAt: '2026-08-24' },
  },

  // --- Curriculum frameworks -------------------------------------------------
  //
  // Mapped to, never transcribed, and endorsed by none of these bodies. They are
  // registered because the interface names them to educators, and a named
  // framework whose version is stale is worse than one with no version at all.
  {
    id: 'coa-practice-doctorate-standards',
    authors: 'Council on Accreditation of Nurse Anesthesia Educational Programs',
    title: 'Standards for Accreditation of Nurse Anesthesia Programs — Practice Doctorate',
    publication: 'Council on Accreditation of Nurse Anesthesia Educational Programs',
    year: 2025,
    locator: 'Revised May 2025, effective January 2026',
    usedFor: 'The curriculum content areas the anesthesia module is mapped against for nurse '
      + 'anesthesia programmes. A mapping in this project\'s own words, not a transcription, and '
      + 'not a claim of compliance.',
    verifiedAgainst: 'The Council\'s own standards page. The project said "as revised 2022", '
      + 'which was two revisions out of date — there was a January 2024 revision between.',
    verifiedOn: CHECKED,
    currency: { lastAmended: '2025-05-01', checkedAt: CHECKED },
  },
  {
    id: 'acgme-anesthesiology-milestones-2',
    authors: 'Accreditation Council for Graduate Medical Education',
    title: 'Anesthesiology Milestones 2.0',
    publication: 'Accreditation Council for Graduate Medical Education',
    year: 2021,
    locator: 'Version 2.0. Described in Ambardekar et al., Anesth Analg 2021;133:353-61',
    usedFor: 'The subcompetencies a screen-based simulator could plausibly contribute evidence '
      + 'toward, for anesthesiology residency programmes.',
    verifiedAgainst: 'Inconclusive on the date. The document carries a 2020 copyright, the paper '
      + 'describing it is 2021, and the effective date for programmes was 2022. The interface '
      + 'therefore names the VERSION only and asserts no year. Needs someone who can establish '
      + 'the correct designation.',
    verifiedOn: CHECKED,
  },
  {
    id: 'nbcrna-nce-content-outline',
    authors: 'National Board of Certification and Recertification for Nurse Anesthetists',
    title: 'National Certification Examination content outline',
    publication: 'National Board of Certification and Recertification for Nurse Anesthetists',
    year: 2026,
    locator: 'The outline as published for the current examination',
    unpinned: true,
    usedFor: 'The five top-level content areas the anesthesia module is mapped against. The '
      + 'divisions are the outline\'s own; the descriptions beneath them are this project\'s '
      + 'summary and are not endorsed by the board.',
    verifiedAgainst: 'Not version-pinned on purpose: the interface names the outline as published '
      + 'for the CURRENT examination rather than a year, so it cannot go stale the way a pinned '
      + 'year silently does.',
    verifiedOn: CHECKED,
  },

  // --- Education -------------------------------------------------------------
  // --- Drug labelling --------------------------------------------------------
  //
  // The dosing a learner reads had no source at all, while every model
  // parameter had one. These are the labels the figures are now checked
  // against. They are the UNITED STATES labels; the practice-region profiles
  // already carry the fact that formularies and licensed dosing differ by
  // country, and a reviewer outside the US should check against their own.
  {
    id: 'propofol-us-label',
    authors: 'United States Food and Drug Administration approved labelling',
    title: 'Propofol injectable emulsion — prescribing information',
    publication: 'DailyMed, National Library of Medicine',
    year: 2026,
    locator: 'Dosage and Administration, adult induction and maintenance',
    unpinned: true,
    usedFor: 'The reference the propofol drug card\'s induction and maintenance figures are '
      + 'checked against. The label gives 2 to 2.5 mg/kg for induction in ASA I-II adults under '
      + '65, and 50 to 100 micrograms/kg/min for maintenance after an initial 150 to 200.',
    verifiedAgainst: 'The DailyMed label text. Not version-pinned: a label is revised on the '
      + 'manufacturer\'s schedule and DailyMed serves whichever revision is current, so naming a '
      + 'year here would go stale silently.',
    verifiedOn: CHECKED,
  },
  {
    id: 'remifentanil-us-label',
    authors: 'United States Food and Drug Administration approved labelling',
    title: 'Remifentanil hydrochloride for injection — prescribing information',
    publication: 'DailyMed, National Library of Medicine',
    year: 2026,
    locator: 'Dosage and Administration, general anaesthesia',
    unpinned: true,
    usedFor: 'The reference the remifentanil drug card\'s figures are checked against. The label '
      + 'gives 1 µg/kg over 30 to 60 seconds for induction, and 0.05 to 2 µg/kg/min for '
      + 'maintenance with typical starting rates of 0.25 µg/kg/min alongside propofol or '
      + 'isoflurane and 0.4 with nitrous oxide.',
    verifiedAgainst: 'The DailyMed label text, dosage and administration. Not version-pinned, '
      + 'for the same reason as any label: DailyMed serves whichever revision is current.',
    verifiedOn: CHECKED,
  },
  {
    id: 'rocuronium-us-label',
    authors: 'United States Food and Drug Administration approved labelling',
    title: 'Rocuronium bromide injection — prescribing information',
    publication: 'DailyMed, National Library of Medicine',
    year: 2026,
    locator: 'Dosage and Administration, tracheal intubation and rapid sequence intubation',
    unpinned: true,
    usedFor: 'The reference the rocuronium drug card\'s figures are checked against. The label '
      + 'gives 0.6 mg/kg for routine intubation and 0.6 to 1.2 mg/kg for rapid sequence '
      + 'intubation, with additional dosing guided by return of neuromuscular function.',
    verifiedAgainst: 'The current DailyMed label text, dosage and administration. Not '
      + 'version-pinned because DailyMed serves the current manufacturer revision.',
    verifiedOn: CHECKED,
  },

  // --- Standards, which are amended rather than published once ---------------
  {
    id: 'asa-basic-monitoring',
    authors: 'Committee on Standards and Practice Parameters',
    title: 'Standards for Basic Anesthetic Monitoring',
    publication: 'American Society of Anesthesiologists',
    year: 2025,
    locator: 'Originally approved 21 October 1986; last amended 15 October 2025',
    usedFor: 'The monitoring set the cockpit displays, and the four categories it is organised '
      + 'around — oxygenation, ventilation, circulation and temperature — plus the requirement '
      + 'for an oxygen analyser with a low-concentration limit alarm on the breathing system.',
    verifiedAgainst: 'The issuing body\'s own standards page. This project displayed "revision '
      + '2020" until that check was done, which was two revisions stale.',
    verifiedOn: CHECKED,
    currency: { lastAmended: '2025-10-15', checkedAt: CHECKED },
  },
  {
    id: 'iec-60601-1-8',
    authors: 'International Electrotechnical Commission',
    title: 'Medical electrical equipment — Part 1-8: General requirements for basic safety and '
      + 'essential performance — Collateral standard: General requirements, tests and guidance '
      + 'for alarm systems in medical electrical equipment and medical electrical systems',
    publication: 'International Electrotechnical Commission',
    year: 2006,
    locator: 'IEC 60601-1-8, with amendments',
    usedFor: 'The three alarm priorities and their visual language: high priority red flashing at '
      + '1.4 to 2.8 Hz, medium priority amber flashing at 0.4 to 0.8 Hz, low priority steady. The '
      + 'simulator follows the standard\'s conventions so the visual language a learner '
      + 'internalises here matches the equipment they meet clinically; it is not a certified '
      + 'medical device and does not claim conformity.',
    verifiedAgainst: 'Secondary engineering references describing the standard\'s priority '
      + 'colours and flash-rate bands. The standard itself is paywalled and was not read.',
    verifiedOn: CHECKED,
  },

  {
    id: 'eppich-cheng-2015',
    pmid: '25710312',
    authors: 'Eppich W, Cheng A',
    title: 'Promoting Excellence and Reflective Learning in Simulation (PEARLS): development and rationale for a blended approach to health care simulation debriefing',
    publication: 'Simul Healthc',
    year: 2015,
    locator: '10:106-15',
    usedFor: 'The debrief structure: reactions, description, analysis, summary and application, '
      + 'and the rule that the learner gives their own account before the system analyses.',
    verifiedAgainst: NCBI,
    verifiedOn: CHECKED,
  },
  {
    id: 'avidan-2008',
    pmid: '18337600',
    authors: 'Avidan MS, Zhang L, Burnside BA, Finkel KJ, Searleman AC, Selvidge JA, et al.',
    title: 'Anesthesia awareness and the bispectral index',
    publication: 'N Engl J Med',
    year: 2008,
    locator: '358:1097-108',
    usedFor: 'The depth explainer\'s statement that large trials have not shown a processed-EEG '
      + 'index to be uniformly superior to end-tidal agent guidance for preventing awareness. '
      + 'This is the B-Unaware trial.',
    verifiedAgainst: NCBI,
    verifiedOn: '2026-08-21',
  },
  {
    id: 'pandit-nap5-2014',
    pmid: '25204697',
    authors: 'Pandit JJ, Andrade J, Bogod DG, Hitchman JM, Jonker WR, Lucas N, et al.',
    title: '5th National Audit Project (NAP5) on accidental awareness during general anaesthesia: summary of main findings and risk factors',
    publication: 'Br J Anaesth',
    year: 2014,
    locator: '113:549-59',
    usedFor: 'The awareness-under-paralysis briefing and debrief: reported awareness incidence '
      + 'near 1 in 19,600 overall, about 1 in 8,200 with neuromuscular blockade versus about 1 '
      + 'in 135,900 without, and the concentration of reports at induction and emergence.',
    verifiedAgainst: NCBI,
    verifiedOn: '2026-08-23',
  },
  {
    id: 'avidan-2011',
    pmid: '21848460',
    authors: 'Avidan MS, Jacobsohn E, Glick D, Burnside BA, Zhang L, Villafranca A, et al.',
    title: 'Prevention of intraoperative awareness in a high-risk surgical population',
    publication: 'N Engl J Med',
    year: 2011,
    locator: '365:591-600',
    usedFor: 'The same statement in the depth explainer. This is the BAG-RECALL trial, the larger '
      + 'of the two and the one conducted in a high-risk population.',
    verifiedAgainst: NCBI,
    verifiedOn: '2026-08-21',
  },
  {
    id: 'schwid-2001',
    pmid: '11302037',
    authors: 'Schwid HA, Rooke GA, Michalowski P, Ross BK',
    title: 'Screen-based anesthesia simulation with debriefing improves performance in a mannequin-based anesthesia simulator',
    publication: 'Teach Learn Med',
    year: 2001,
    locator: '13:92-6',
    usedFor: 'The only evidence cited that screen-based simulation with debriefing transfers to '
      + 'performance elsewhere. It is one small study from 2001 and the validation report says so '
      + 'rather than presenting it as an evidence base.',
    verifiedAgainst: NCBI,
    verifiedOn: CHECKED,
  },
];

/** Look a source up by id. Throws rather than returning a silent undefined. */
export function requireSource(id: string): Source {
  const source = SOURCES.find((entry) => entry.id === id);
  if (!source) throw new Error(`No source registered with id "${id}".`);
  return source;
}

/** Every PMID the register knows about. */
export function registeredPmids(): Set<string> {
  return new Set(SOURCES.flatMap((source) => (source.pmid ? [source.pmid] : [])));
}

/** A source formatted the way the interface shows it. */
export function formatSource(source: Source): string {
  const pmid = source.pmid ? ` PMID ${source.pmid}.` : '';
  return `${source.authors}. ${source.title}. ${source.publication} ${source.year};${source.locator}.${pmid}`;
}
