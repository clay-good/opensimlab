/**
 * Oncology concept explainers
 * (knowledge-layer → the minimum knowledge set).
 *
 * Six concepts, each the reasoning behind a recurring mistake in this module's
 * labs, under 250 words with a caption, a source, a stated simplification, and
 * the lesson that demonstrates it.
 *
 * This module's lessons are about labels, base rates and rules written for
 * databases, and these keep that voice. Every one explains; none names a drug,
 * a dose or a threshold to act on.
 */

import { UNSIGNED_REVIEW, type Explainer } from '@platform/knowledge/explainer';

export const ONCOLOGY_EXPLAINERS: readonly Explainer[] = [
  {
    id: 'a-laboratory-syndrome-is-not-the-syndrome',
    maturity: 'preview',
    title: 'A laboratory syndrome is not the syndrome',
    body:
      'Tumour lysis is defined twice over. One definition counts biochemical derangements: '
      + 'potassium, phosphate, urate and calcium moving in the directions cell breakdown pushes '
      + 'them. The other requires that those derangements have produced organ consequences — '
      + 'kidney injury, an arrhythmia, a seizure.\n\n'
      + 'The first is a laboratory event. The second is the illness. A patient can satisfy the '
      + 'laboratory definition and be entirely well, and most patients who satisfy it do not go on '
      + 'to the clinical form.\n\n'
      + 'Which makes the distinction a communication problem as much as a clinical one. Writing '
      + 'that a patient has tumour lysis syndrome, when what they have is the biochemical '
      + 'pattern, hands the next reader a diagnosis of an organ-threatening illness. Writing the '
      + 'biochemical finding, and what is being watched for, hands them the actual situation.\n\n'
      + 'It also sets the response. The biochemical pattern is a reason for surveillance, '
      + 'attention to the circulation and urate handling, and a plan for what would change — not '
      + 'in itself a reason for the escalation the clinical syndrome would justify.\n\n'
      + 'And the direction of travel matters more than the single result: a potassium or phosphate '
      + 'that is climbing on serial measurement is a different situation from one value outside '
      + 'the range.\n\n'
      + 'The laboratory-tumour-lysis lab holds that gap, with a patient who satisfies a definition '
      + 'and has no illness yet.',
    diagram: {
      kind: 'compensation-curve',
      caption: 'One definition counts chemistry; the other requires organ consequences. Most patients stop at the first.',
    },
    showMe: { scenarioId: 'laboratory-tls-a-syndrome-he-does-not-have-yet' },
    reflects: 'Hande and Garrow, Acute tumor lysis syndrome in patients with high-grade non-Hodgkin’s lymphoma, American Journal of Medicine 1993 (PMID 8430709), the source of the laboratory and clinical distinction.',
    simplifies:
      'Draws the distinction and gives no criterion, threshold, prophylaxis or treatment. Which '
      + 'patients are at high risk, and what prevention they should have, are decisions made on '
      + 'the disease and the regimen rather than on this.',
    review: {
      ...UNSIGNED_REVIEW,
      sources: [
        'Hande KR, Garrow GC. Acute tumor lysis syndrome in patients with high-grade non-Hodgkin’s lymphoma. Am J Med. 1993;94(2):133-139. PMID 8430709.',
      ],
    },
  },
  {
    id: 'a-base-rate-is-not-a-threshold',
    maturity: 'preview',
    title: 'A base rate is not a threshold for action',
    body:
      'Some treatment complications are rare and lethal. Checkpoint-inhibitor myocarditis is the '
      + 'example: it affects a small fraction of patients, and among those it affects the '
      + 'mortality is among the highest of any immune-related event.\n\n'
      + 'Rarity and severity pull in opposite directions when a patient presents, and the mistake '
      + 'is to let the rarity do the deciding. "This is rare" is a statement about a population. '
      + 'The patient in front of you is either having it or not, and the prior shifts with their '
      + 'own features — how recently treatment started, which agents, what else is going on.\n\n'
      + 'The other reason the base rate is a poor guide is asymmetry. The investigations that '
      + 'begin to answer the question are quick and low-risk, while the cost of missing it is '
      + 'death or permanent injury. When the downside of looking is small and the downside of not '
      + 'looking is catastrophic, a low prior does not justify not looking.\n\n'
      + 'The presentation also fails to help: fatigue, breathlessness, chest discomfort and '
      + 'palpitations are what every other cause produces too, which is exactly why a rarity '
      + 'argument feels so reasonable at the bedside.\n\n'
      + 'So the usable rule is to let the consequences set the threshold for investigating, and '
      + 'keep the base rate for interpreting what comes back.\n\n'
      + 'The early-myocarditis lab holds that decision with the prior stated out loud.',
    diagram: {
      kind: 'perfusion-versus-pressure',
      caption: 'A population frequency does not set an individual threshold; the asymmetry of the two errors does.',
    },
    showMe: { scenarioId: 'rare-early-myocarditis-a-base-rate-is-not-a-threshold' },
    reflects: 'Wang et al., Fatal Toxic Effects Associated With Immune Checkpoint Inhibitors: A Systematic Review and Meta-analysis, JAMA Oncology 2018 (PMID 30242316), in which myocarditis carried the highest fatality rate of the immune-related events.',
    simplifies:
      'Argues about how a base rate should and should not be used. It names no investigation, '
      + 'threshold or treatment, and the frequency and fatality figures it leans on come from '
      + 'pooled reports that under-count mild cases.',
    review: {
      ...UNSIGNED_REVIEW,
      sources: [
        'Wang DY, Salem JE, Cohen JV, et al. Fatal Toxic Effects Associated With Immune Checkpoint Inhibitors: A Systematic Review and Meta-analysis. JAMA Oncol. 2018;4(12):1721-1728. PMID 30242316.',
      ],
    },
  },
  {
    id: 'a-rule-written-for-a-database',
    maturity: 'preview',
    title: 'A rule written for a database is not a rule for a patient',
    body:
      'Response criteria exist so that results from different centres can be compared. They '
      + 'define what counts as progression in a way that is reproducible across readers and '
      + 'studies, and the immunotherapy versions add a confirmation step, because a lesion that '
      + 'looks bigger on immunotherapy sometimes shrinks afterwards.\n\n'
      + 'That confirmation requirement is a measurement rule, not a clinical instruction. It '
      + 'exists so a database does not record progression that later turns out not to have been '
      + 'progression. It was never a statement that a deteriorating patient should wait for a '
      + 'second scan.\n\n'
      + 'Read as a clinical rule, it produces exactly that: a patient who is getting worse, with '
      + 'imaging that has moved, waiting weeks for confirmation because a criterion says '
      + 'confirmation is needed. The criteria themselves say the clinical condition governs.\n\n'
      + 'The general shape is worth carrying. Criteria used in trials are built for consistency, '
      + 'tuned to the question the trial asked, and deliberately insensitive to things that make '
      + 'individual judgement work. Borrowing them for care borrows their blind spots.\n\n'
      + 'So the question to ask of any such rule is what it was built to protect. If the answer is '
      + 'a dataset, it does not override a patient who is in front of you deteriorating.\n\n'
      + 'The trial-rule lab holds that: a criterion satisfied, and a patient who cannot wait.',
    diagram: {
      kind: 'compensation-curve',
      caption: 'A confirmation requirement protects a dataset from a false record, not a patient from deterioration.',
    },
    showMe: { scenarioId: 'trial-rule-a-rule-written-for-a-database' },
    reflects: 'Seymour et al., iRECIST: guidelines for response criteria for use in trials testing immunotherapeutics, Lancet Oncology 2017 (PMID 28271869), whose confirmation requirement is a measurement convention for trial datasets.',
    simplifies:
      'Makes a point about what criteria are for and reproduces none of them: no measurement '
      + 'rule, no interval, no definition of progression. Deciding whether a particular patient '
      + 'is progressing is clinical work this does not do.',
    review: {
      ...UNSIGNED_REVIEW,
      sources: [
        'Seymour L, Bogaerts J, Perrone A, et al; RECIST working group. iRECIST: guidelines for response criteria for use in trials testing immunotherapeutics. Lancet Oncol. 2017;18(3):e143-e152. PMID 28271869.',
      ],
    },
  },
  {
    id: 'a-label-that-fits-too-easily',
    maturity: 'preview',
    title: 'A label that fits too easily stops the search',
    body:
      'Diarrhoea in a patient on a checkpoint inhibitor has an obvious explanation, and immune '
      + 'colitis is common enough that the explanation is often right. It is also, by the guidance '
      + 'that covers it, a diagnosis of exclusion.\n\n'
      + 'The things it excludes are not exotic. Infection, including a toxin-producing organism '
      + 'and a reactivated virus, can present identically, and the treatment for immune colitis — '
      + 'suppressing the immune system — makes an untreated infection worse. The cost of the wrong '
      + 'label here is not a delay; it is a treatment pointed in the wrong direction.\n\n'
      + 'This is the general hazard of a plausible label in a patient with a complicated history. '
      + 'Everything fits, nobody looks further, and the investigations that would have '
      + 'distinguished the possibilities are not sent because the question felt answered.\n\n'
      + 'The protection is procedural rather than clever: send the exclusion tests at the point '
      + 'the label is first proposed, before treatment that would be harmful if the label is '
      + 'wrong. The results arrive either way, and an immune diagnosis is stronger for having '
      + 'survived them.\n\n'
      + 'Severity and timing are also part of the picture, and both argue for the same sequence '
      + 'rather than against it.\n\n'
      + 'The easy-label lab holds that: a label that fits, and the tests nobody sent.',
    diagram: {
      kind: 'capnogram-phases',
      caption: 'A plausible label ends the search, and the treatment it implies is harmful if the label is wrong.',
    },
    showMe: { scenarioId: 'easy-label-a-label-that-fits-too-easily' },
    reflects: 'Li et al., Differential diagnosis and management of immune checkpoint inhibitor-induced colitis: a comprehensive review, World Journal of Experimental Medicine 2021 (PMID 36246150), which states that the diagnosis is one of exclusion, and the AGA clinical practice update on checkpoint inhibitor colitis and hepatitis, 2021.',
    simplifies:
      'Makes a point about labelling and names no investigation, agent or severity grade. Which '
      + 'exclusions matter depends on the patient, the regimen and local epidemiology, and those '
      + 'choices are not here.',
    review: {
      ...UNSIGNED_REVIEW,
      sources: [
        'Li H, Fu ZY, Arslan ME, Cho D, Lee H. Differential diagnosis and management of immune checkpoint inhibitor-induced colitis: a comprehensive review. World J Exp Med. 2021;11(6):79-92. PMID 36246150.',
        'Dougan M, Wang Y, Rubio-Tapia A, Lim JK. AGA clinical practice update on diagnosis and management of immune checkpoint inhibitor colitis and hepatitis: expert review. Gastroenterology. 2021;160(4):1384-1393.',
      ],
    },
  },
  {
    id: 'a-negative-genotype-covers-what-it-tested',
    maturity: 'preview',
    title: 'A negative genetic test covers only what it tested for',
    body:
      'Some chemotherapy toxicity is predictable from the patient’s ability to clear the drug, '
      + 'and genotyping before treatment reduces it. The result that comes back, though, is not '
      + '"this patient metabolises normally" — it is "the variants in this panel were not '
      + 'found".\n\n'
      + 'Those are different statements. The panels cover a handful of variants that are common '
      + 'enough and well enough characterised to act on, and they leave out rarer ones, ones more '
      + 'frequent in populations the panel was not developed in, and causes of impaired clearance '
      + 'that are not genetic at all.\n\n'
      + 'So a patient with a negative result can still suffer severe toxicity, and the record will '
      + 'contain a test that appears to have excluded it. That appearance is what makes the early '
      + 'toxicity harder to recognise: the mouth ulceration, diarrhoea, and falling counts arrive '
      + 'in someone who was marked as low risk.\n\n'
      + 'The usable form of this is a habit with any test: ask what it looked for rather than what '
      + 'it ruled out. A negative panel lowers the prior and does not remove the possibility, and '
      + 'the clinical course still outranks it.\n\n'
      + 'The normal-test lab holds that: a reassuring result, and a dose already prepared.',
    diagram: {
      kind: 'membrane-stabilisation',
      caption: 'The report says the panel’s variants were not found, which is narrower than normal metabolism.',
    },
    showMe: { scenarioId: 'normal-test-toxicity-the-dose-in-his-bag' },
    reflects: 'Henricks et al., DPYD genotype-guided dose individualisation of fluoropyrimidine therapy in patients with cancer: a prospective safety analysis, Lancet Oncology 2018 (PMID 30348537), and Meulendijks et al. on the clinical relevance of the variants such panels test for.',
    simplifies:
      'Makes a point about what a panel result means and names no variant, panel, drug or dose '
      + 'adjustment. How much of the toxicity any panel explains differs by population, and the '
      + 'figures are not reproduced here.',
    review: {
      ...UNSIGNED_REVIEW,
      sources: [
        'Henricks LM, Lunenburg CATC, de Man FM, et al. DPYD genotype-guided dose individualisation of fluoropyrimidine therapy in patients with cancer: a prospective safety analysis. Lancet Oncol. 2018;19(11):1459-1467. PMID 30348537.',
        'Meulendijks D, Henricks LM, Sonke GS, et al. Clinical relevance of DPYD variants as predictors of severe fluoropyrimidine-associated toxicity: a systematic review and meta-analysis.',
      ],
    },
  },
  {
    id: 'a-prognosis-is-asked-for-and-usually-optimistic',
    maturity: 'preview',
    title: 'A prognosis that is asked for is usually answered optimistically',
    body:
      'Patients ask how long. The honest difficulty is that clinicians’ survival estimates are '
      + 'inaccurate, and inaccurate in a direction: they tend to be too long, and the error grows '
      + 'the better the clinician knows the patient.\n\n'
      + 'That bias matters because of what rests on the answer. People with advanced cancer '
      + 'commonly believe treatment aimed at prolonging life might cure them, and decisions about '
      + 'treatment, work, family and where to be are made on the number they were given.\n\n'
      + 'Refusing to answer is not the alternative. It leaves the patient with nothing, and they '
      + 'will make the same decisions with a worse estimate of their own. What is available '
      + 'instead is answering in a form the uncertainty fits: a range rather than a figure, best '
      + 'case and worst case alongside the typical one, and a statement of what would change it.\n\n'
      + 'It also matters what question is being asked. "How long" is sometimes a question about '
      + 'time and sometimes a question about whether anyone will be honest, whether there is '
      + 'something to be afraid of, or whether a particular event can be planned for. Asking what '
      + 'prompted the question answers more of it than a number does.\n\n'
      + 'The prognosis lab holds that moment: a direct question, from a patient who wants a '
      + 'direct answer.',
    diagram: {
      kind: 'compensation-curve',
      caption: 'Estimates run long, and the error grows with familiarity; a range with a best and worst case fits the uncertainty.',
    },
    showMe: { scenarioId: 'prognosis-question-a-number-he-asked-for' },
    reflects: 'Christakis and Lamont, Extent and determinants of error in doctors’ prognoses in terminally ill patients: prospective cohort study, BMJ 2000 (PMID 10678857), and Weeks et al., Patients’ expectations about effects of chemotherapy for advanced cancer, New England Journal of Medicine 2012.',
    simplifies:
      'Describes the bias and the shape of an honest answer, and gives no prognostic tool, no '
      + 'figures and no script. The cited work is a cohort of doctors from one era and setting, '
      + 'which supports the direction of the error rather than its size today.',
    review: {
      ...UNSIGNED_REVIEW,
      sources: [
        'Christakis NA, Lamont EB. Extent and determinants of error in doctors’ prognoses in terminally ill patients: prospective cohort study. BMJ. 2000;320(7233):469-472. PMID 10678857.',
        'Weeks JC, Catalano PJ, Cronin A, et al. Patients’ expectations about effects of chemotherapy for advanced cancer. N Engl J Med. 2012;367(17):1616-1625.',
      ],
    },
  },
];
