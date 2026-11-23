/**
 * Infectious disease concept explainers
 * (knowledge-layer → the minimum knowledge set).
 *
 * Six concepts, each the reasoning behind a recurring mistake in this module's
 * labs, under 250 words with a caption, a source, a stated simplification, and
 * the lesson that demonstrates it.
 *
 * This module's lessons are about definitions and scores being asked to do what
 * they were not built for, and these explainers keep that voice. Every one
 * explains; none names an antimicrobial, a dose or a threshold.
 */

import { UNSIGNED_REVIEW, type Explainer } from '@platform/knowledge/explainer';

export const INFECTIOUS_DISEASE_EXPLAINERS: readonly Explainer[] = [
  {
    id: 'a-score-answers-the-question-it-was-built-for',
    maturity: 'preview',
    title: 'A score answers the question it was built for',
    body:
      'Severity scores are built against a particular outcome in a particular population, and '
      + 'what they are good for follows from that construction. A score developed to decide '
      + 'whether someone can be treated at home is a place-of-care tool. A set of criteria '
      + 'developed to define severe disease is a severity definition. The two are not '
      + 'interchangeable, and in pneumonia both exist side by side.\n\n'
      + 'Using one for the other’s question produces a confident answer to a question nobody '
      + 'asked. A low place-of-care score in a young patient with no other conditions can sit '
      + 'alongside criteria that mark the illness as severe, and the number does not know that.\n\n'
      + 'The guidance itself is clear about this: the place-of-care score supports a decision '
      + 'alongside clinical judgement rather than replacing it, and the severity criteria define a '
      + 'category rather than a destination.\n\n'
      + 'What this leaves the clinician with is one extra question before reading any score: what '
      + 'was it derived to predict, in whom, and is that my question today? A score used outside '
      + 'that frame is still arithmetic, and it still produces a number.\n\n'
      + 'The pneumonia lab holds exactly that mismatch, with a score that answered a different '
      + 'question correctly.',
    diagram: {
      kind: 'compensation-curve',
      caption: 'Each score has one derivation question; outside it the arithmetic still works and the answer does not apply.',
    },
    showMe: { scenarioId: 'severe-pneumonia-the-score-answered-another-question' },
    reflects: 'Metlay et al., Diagnosis and Treatment of Adults with Community-acquired Pneumonia, an official ATS/IDSA clinical practice guideline, 2019, and NICE guideline NG250 on pneumonia, 2025.',
    simplifies:
      'Makes a point about derivation and reproduces no score, criterion or threshold. It also '
      + 'does not tell you which tool fits which decision in your service, and the two cited '
      + 'documents differ on how much weight a score should carry.',
    review: {
      ...UNSIGNED_REVIEW,
      sources: [
        'Metlay JP, Waterer GW, Long AC, et al. Diagnosis and Treatment of Adults with Community-acquired Pneumonia. An Official Clinical Practice Guideline of the American Thoracic Society and Infectious Diseases Society of America. Am J Respir Crit Care Med. 2019;200(7):e45-e67.',
        'National Institute for Health and Care Excellence. Pneumonia: diagnosis and management. NICE guideline NG250. 2025.',
      ],
    },
  },
  {
    id: 'a-score-cannot-exclude-what-it-was-not-built-to-exclude',
    maturity: 'preview',
    title: 'A score that was not built to exclude cannot exclude',
    body:
      'Necrotising soft-tissue infection is the case where this matters most, because the only '
      + 'reliable diagnosis is surgical and the cost of delay is measured in hours and limbs.\n\n'
      + 'A laboratory score exists for it, and it does something useful: a high value raises '
      + 'concern. What it cannot do is lower concern, because a substantial proportion of '
      + 'patients with the disease have a low value, particularly early. Ruling out is a different '
      + 'statistical job from ruling in, and a tool that performs the second does not '
      + 'automatically perform the first.\n\n'
      + 'The findings that should drive the decision are clinical and they are often absent too: '
      + 'pain out of proportion to the appearance, rapid progression over hours, systemic illness '
      + 'that outruns the skin, skin changes that arrive late. The absence of dramatic skin signs '
      + 'early is characteristic of the disease rather than reassuring about it.\n\n'
      + 'So the practical rule is that a low score in a patient someone is worried about does not '
      + 'resolve the worry; it leaves the decision exactly where it was, which is with surgical '
      + 'assessment.\n\n'
      + 'The necrotising-infection lab holds that: a score that reads low, and a patient whose '
      + 'story does not.',
    diagram: {
      kind: 'perfusion-versus-pressure',
      caption: 'Ruling in and ruling out are different jobs; a low value on a rule-in tool changes nothing.',
    },
    showMe: { scenarioId: 'necrotizing-infection-score-cannot-exclude' },
    reflects: 'Fernando et al., Necrotizing Soft Tissue Infection: Diagnostic Accuracy of Physical Examination, Imaging, and LRINEC Score, Annals of Surgery 2019 (PMID 29672405), and Sartelli et al., WSES/GAIS/WSIS/SIS-E/AAST global clinical pathways for skin and soft tissue infections, 2022, which states that a low score does not rule out the diagnosis.',
    simplifies:
      'Makes one point about what a score can do and names no score, threshold, antimicrobial or '
      + 'operative decision. It also says nothing about the patients in whom the clinical signs '
      + 'are atypical, which includes the immunosuppressed.',
    review: {
      ...UNSIGNED_REVIEW,
      sources: [
        'Fernando SM, Tran A, Cheng W, et al. Necrotizing Soft Tissue Infection: Diagnostic Accuracy of Physical Examination, Imaging, and LRINEC Score: A Systematic Review and Meta-Analysis. Ann Surg. 2019;269(1):58-65. PMID 29672405.',
        'Sartelli M, Coccolini F, Kluger Y, et al. WSES/GAIS/WSIS/SIS-E/AAST global clinical pathways for patients with skin and soft tissue infections. World J Emerg Surg. 2022;17:3.',
      ],
    },
  },
  {
    id: 'a-definition-can-have-no-truth-value-yet',
    maturity: 'preview',
    title: 'A definition can have no truth value yet',
    body:
      'Septic shock is defined as persisting hypotension requiring vasopressors to hold a mean '
      + 'arterial pressure at or above a stated value, with a raised lactate, despite adequate '
      + 'fluid resuscitation.\n\n'
      + 'Read the parts. Two of them describe things that have happened: a vasopressor running, '
      + 'and a resuscitation completed. In a patient who has had neither, those parts are not '
      + 'false — they have no truth value yet. The label becomes available only after the '
      + 'treatment, which means the treatment partly creates the category.\n\n'
      + 'That is a statement about the definition rather than about severity. A patient with '
      + 'infection and clear hypoperfusion is seriously ill whatever the label says, and the '
      + 'absence of the label says nothing reassuring about them.\n\n'
      + 'The consensus task force that wrote the definition said as much: the criteria for '
      + 'adequate fluid resuscitation and for needing a vasopressor could not be explicitly '
      + 'specified because they are highly user dependent.\n\n'
      + 'Knowing that changes how the words are used. "Not septic shock" is a defensible thing to '
      + 'write in a record and a dangerous thing to reason from, because the next reader will take '
      + 'it as a judgement about how ill the patient is.\n\n'
      + 'The label lab holds that gap, with hypoperfusion present and the definition unavailable.',
    diagram: {
      kind: 'perfusion-versus-pressure',
      caption: 'Two parts of the definition describe treatment already given, so before it they have no truth value.',
    },
    showMe: { scenarioId: 'septic-shock-a-label-the-treatment-creates' },
    reflects: 'Prescott et al., Surviving Sepsis Campaign: International Guidelines for Management of Sepsis and Septic Shock 2026, Critical Care Medicine, and the consensus definition the lesson quotes on its own user-dependent criteria.',
    simplifies:
      'Analyses the definition and gives no pressure target, fluid volume, lactate threshold or '
      + 'vasopressor choice. It is about how a label behaves, not about how to treat the patient '
      + 'in front of you.',
    review: {
      ...UNSIGNED_REVIEW,
      sources: [
        'Prescott HC, Antonelli M, Alhazzani W, et al. Surviving Sepsis Campaign: International Guidelines for Management of Sepsis and Septic Shock 2026. Crit Care Med. Published 2026-03-23.',
      ],
    },
  },
  {
    id: 'the-antimicrobial-clock-is-tiered',
    maturity: 'preview',
    title: 'The antimicrobial clock is tiered by how likely the infection is',
    body:
      'A single deadline for antimicrobials treats two different patients identically: the one in '
      + 'septic shock, and the one who might have an infection and might have something else. '
      + 'Current guidance separates them.\n\n'
      + 'With shock, or with probable or definite sepsis, treatment goes immediately and ideally '
      + 'within the first hour. With possible sepsis and no shock, there is a time-limited period '
      + 'of rapid investigation first, and antimicrobials follow within a few hours if the concern '
      + 'persists. Where infection is unlikely and there is no shock, treatment is deferred while '
      + 'the patient is watched closely.\n\n'
      + 'The reason the tiers exist is that the clock cuts both ways. Delay kills in established '
      + 'sepsis; reflexive early treatment in everyone attaches an infection label to patients who '
      + 'do not have one, stops the search for what they do have, and spends antimicrobials on '
      + 'nothing. Both harms are real, and which one dominates depends on the likelihood.\n\n'
      + 'What all three tiers share is that the decision is clinical and provisional: sepsis is '
      + 'not ruled in or out by a single test or biomarker, and the tier a patient is in is '
      + 'revisited as the investigations return.\n\n'
      + 'The possible-sepsis lab holds a patient on that boundary, where the clock runs either '
      + 'way.',
    diagram: {
      kind: 'compression-fraction',
      caption: 'Three tiers by likelihood: immediate, time-limited investigation then treat, or defer and watch.',
    },
    showMe: { scenarioId: 'possible-sepsis-a-clock-that-runs-either-way' },
    reflects: 'Prescott et al., Surviving Sepsis Campaign: International Guidelines for Management of Sepsis and Septic Shock 2026, Critical Care Medicine, whose tiered antimicrobial timing recommendations carry very low certainty by the guideline’s own grading.',
    simplifies:
      'Describes the shape of the tiers and names no interval, antimicrobial or criteria for '
      + 'placing a patient in one. The recommendations it rests on are graded very low certainty, '
      + 'and local protocols and quality measures may not be tiered at all.',
    review: {
      ...UNSIGNED_REVIEW,
      sources: [
        'Prescott HC, Antonelli M, Alhazzani W, et al. Surviving Sepsis Campaign: International Guidelines for Management of Sepsis and Septic Shock 2026. Crit Care Med. Published 2026-03-23.',
      ],
    },
  },
  {
    id: 'two-guidelines-can-disagree-and-both-stand',
    maturity: 'preview',
    title: 'Two guidelines can disagree, and both still stand',
    body:
      'Whether to image the head before a lumbar puncture in suspected meningitis is a question '
      + 'two current guidelines answer differently. Both say imaging should not be routine. Both '
      + 'list features that make it appropriate. The lists are not the same, and the conscious '
      + 'level at which they trigger differs between them.\n\n'
      + 'That is not an error in either document. They were written by different bodies, for '
      + 'different systems, weighing the same low-certainty material against different assumptions '
      + 'about what imaging is available and how quickly.\n\n'
      + 'What they agree on is the part that protects the patient: treatment is not delayed for '
      + 'imaging. Antibiotics go when they are due, imaging happens if it is indicated, and the '
      + 'lumbar puncture happens when it safely can.\n\n'
      + 'So the practical skill is knowing which document the service follows, and recognising '
      + 'that a colleague applying the other one is not making a mistake. A patient who falls '
      + 'between the two thresholds is a case for a conversation rather than for a rule.\n\n'
      + 'They also agree on something the laboratory invites people to forget: no peripheral blood '
      + 'test confirms or excludes bacterial meningitis.\n\n'
      + 'The imaging lab holds a patient between the two thresholds.',
    diagram: {
      kind: 'capnogram-phases',
      caption: 'Different bodies, different systems, the same low-certainty material: two lists that do not match.',
    },
    showMe: { scenarioId: 'meningitis-imaging-a-rule-that-does-not-agree' },
    reflects: 'NICE guideline NG240 on bacterial meningitis and meningococcal disease, 2024, and the World Health Organization guidelines on meningitis diagnosis, treatment and care, 2025, whose imaging recommendation is strong on very low certainty.',
    simplifies:
      'Describes the disagreement and reproduces neither list of indications nor any threshold. '
      + 'Which document applies where you work, and what to do for a patient between them, are '
      + 'not decided here.',
    review: {
      ...UNSIGNED_REVIEW,
      sources: [
        'National Institute for Health and Care Excellence. Meningitis (bacterial) and meningococcal disease: recognition, diagnosis and management. NICE guideline NG240. 2024.',
        'World Health Organization. WHO guidelines on meningitis diagnosis, treatment and care. 2025.',
      ],
    },
  },
  {
    id: 'in-neutropenia-the-signs-are-missing',
    maturity: 'preview',
    title: 'In neutropenia, the signs of infection are missing',
    body:
      'Most of what makes an infection visible is made by neutrophils. Pus, a red swollen margin, '
      + 'an infiltrate on a chest film, the tenderness of a localised collection — those are the '
      + 'inflammatory response, not the organism.\n\n'
      + 'A patient without neutrophils cannot produce them. So the examination is quiet, the chest '
      + 'film can be clear with pneumonia present, a wound can be bland while infected, and the '
      + 'inflammatory markers can be unimpressive. Fever may be the only finding, and sometimes '
      + 'there is not even that.\n\n'
      + 'That is why the threshold for treating is a single temperature in a patient at risk, why '
      + 'it is treated as an immediate emergency, and why antimicrobials are started before '
      + 'anything is localised or cultured back. The usual sequence — find the source, then treat '
      + 'it — is reversed, because the finding step may never complete.\n\n'
      + 'The examination is still done, carefully and in full, for a different reason: to find the '
      + 'few places where a clue survives — the mouth, the perineum, a line site, the skin — while '
      + 'accepting that a normal examination establishes nothing.\n\n'
      + 'And the risk is identified from the regimen and its timing rather than from the patient '
      + 'looking unwell.\n\n'
      + 'The blind-examination lab holds that: a thorough examination that finds nothing, in '
      + 'someone who needs treating anyway.',
    diagram: {
      kind: 'perfusion-versus-pressure',
      caption: 'The visible signs are the neutrophil response; without neutrophils the infection is present and invisible.',
    },
    showMe: { scenarioId: 'febrile-neutropenia-blind-examination' },
    reflects: 'NICE clinical guideline CG151 on neutropenic sepsis in people with cancer, and Freifeld et al., IDSA Clinical Practice Guideline for the Use of Antimicrobial Agents in Neutropenic Patients with Cancer, 2010 update.',
    simplifies:
      'Explains why the signs are absent and names no antimicrobial, dose, neutrophil threshold '
      + 'or temperature criterion. Risk stratification and who can be treated as an outpatient '
      + 'are decisions the cited guidance makes and this does not.',
    review: {
      ...UNSIGNED_REVIEW,
      sources: [
        'National Institute for Health and Care Excellence. Neutropenic sepsis: prevention and management in people with cancer. NICE clinical guideline CG151. 2012.',
        'Freifeld AG, Bow EJ, Sepkowitz KA, et al. Clinical Practice Guideline for the Use of Antimicrobial Agents in Neutropenic Patients with Cancer: 2010 Update by the Infectious Diseases Society of America. Clin Infect Dis. 2011;52(4):e56-e93.',
      ],
    },
  },
];
