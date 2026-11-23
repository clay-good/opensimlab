/**
 * Toxicology concept explainers
 * (knowledge-layer → the minimum knowledge set).
 *
 * Six concepts, each the reasoning behind a recurring mistake in this module's
 * labs, under 250 words with a caption, a source, a stated simplification, and
 * the lesson that demonstrates it. Each cites the publications the lesson it
 * points at already declares.
 *
 * Every one explains; none instructs a dose or an antidote regimen. Those are
 * the part of poisoning care most dangerous to read out of context, and they
 * stay in the lessons, inside the envelope those lessons declare.
 */

import { UNSIGNED_REVIEW, type Explainer } from '@platform/knowledge/explainer';

export const TOXICOLOGY_EXPLAINERS: readonly Explainer[] = [
  {
    id: 'in-acetaminophen-the-clock-is-the-patient',
    maturity: 'preview',
    title: 'In acetaminophen poisoning, the clock is the patient',
    body:
      'For the first day after a large acetaminophen ingestion, most people feel more or less '
      + 'well. Some nausea, perhaps. The liver injury is being set up during exactly that period, '
      + 'and it becomes visible — in the blood tests first, then in the patient — once it is '
      + 'already established.\n\n'
      + 'So the assessment runs on time rather than on symptoms. Two things decide everything: '
      + 'when the ingestion happened, and how much. A concentration measured too early means '
      + 'nothing, because absorption is incomplete; a concentration without a time attached cannot '
      + 'be interpreted at all, because the same number is reassuring at one hour and alarming at '
      + 'twelve.\n\n'
      + 'Antidote treatment works far better the earlier it starts, and the benefit falls away '
      + 'across the first day. Which is why the uncertain history — a patient who cannot say when, '
      + 'or who took tablets repeatedly over a day or two rather than all at once — is treated as '
      + 'the higher-risk situation rather than the ambiguous one, and the staggered pattern is '
      + 'outside what a single concentration can assess at all.\n\n'
      + 'The practical skill is therefore history taking and arithmetic under uncertainty, not '
      + 'recognition: by the time there is something to recognise, the window has closed.\n\n'
      + 'The nomogram lab holds that: a well patient, a time that is not certain, and a decision.',
    diagram: {
      kind: 'compensation-curve',
      caption: 'The patient feels well while the injury is set up; the antidote’s benefit falls as the day passes.',
    },
    showMe: { scenarioId: 'acetaminophen-clock-and-nomogram' },
    reflects: 'Dart et al., Management of Acetaminophen Poisoning in the US and Canada: A Consensus Statement, JAMA Network Open 2023, and the American College of Medical Toxicology position on duration of intravenous acetylcysteine therapy, 2026 update.',
    simplifies:
      'Explains why time governs and gives no threshold, no nomogram line, no dose and no '
      + 'treatment duration. Local poisons services set those, and they differ between countries '
      + 'in ways that matter.',
    review: {
      ...UNSIGNED_REVIEW,
      sources: [
        'Dart RC, et al. Management of Acetaminophen Poisoning in the US and Canada: A Consensus Statement. JAMA Netw Open. 2023;6(8):e2327739.',
        'American College of Medical Toxicology. Duration of Intravenous Acetylcysteine Therapy following Acetaminophen Overdose: 2026 update.',
      ],
    },
  },
  {
    id: 'the-oximeter-cannot-see-carbon-monoxide',
    maturity: 'preview',
    title: 'A pulse oximeter cannot see carbon monoxide',
    body:
      'A standard pulse oximeter shines two wavelengths of light through tissue and reports how '
      + 'much of the haemoglobin it sees is carrying oxygen. Carbon monoxide bound to haemoglobin '
      + 'absorbs light much like oxygen does, so the device counts it as oxygenated. A severely '
      + 'poisoned patient can read as fully saturated.\n\n'
      + 'The arterial oxygen tension is no help either, because it measures oxygen dissolved in '
      + 'plasma, which is normal: the problem is that the carrier is occupied. Both of the usual '
      + 'reassurances are therefore measuring the wrong thing at once.\n\n'
      + 'What finds it is suspicion plus a test that distinguishes the species — a co-oximeter on '
      + 'a blood sample, or a device built to read it. Suspicion comes from the setting and the '
      + 'pattern: a heating appliance, a generator, a fire, a group of people or a household '
      + 'affected together, symptoms that improve away from the building and return on going '
      + 'back.\n\n'
      + 'The symptoms themselves are famously unhelpful — headache, nausea, dizziness, confusion — '
      + 'and are routinely attributed to a viral illness, which is how exposures persist.\n\n'
      + 'The reassuring-monitor lab holds exactly that: a plausible story, a normal saturation, '
      + 'and the question of what that number is actually describing.',
    diagram: {
      kind: 'oxygen-delivery',
      caption: 'The oximeter counts the occupied carrier as oxygenated, and the dissolved oxygen tension is normal.',
    },
    showMe: { scenarioId: 'carbon-monoxide-reassuring-monitor' },
    reflects: 'CDC clinical guidance for carbon monoxide poisoning following disasters and severe weather, updated 2024, and the American College of Emergency Physicians clinical policy on acute carbon monoxide poisoning, Annals of Emergency Medicine 2025.',
    simplifies:
      'Explains the false reassurance and gives no threshold, no treatment and no criteria for '
      + 'hyperbaric referral, which remains contested. It also leaves out the other species that '
      + 'fool an oximeter, and the delayed neurological effects.',
    review: {
      ...UNSIGNED_REVIEW,
      sources: [
        'CDC. Clinical Guidance for Carbon Monoxide Poisoning Following Disasters and Severe Weather. Updated 2024-07-08.',
        'American College of Emergency Physicians. A Critical Issue in the Management of Adult Patients Presenting to the Emergency Department With Acute Carbon Monoxide Poisoning. Ann Emerg Med. 2025;85:e45-e59.',
      ],
    },
  },
  {
    id: 'a-falling-salicylate-is-not-improvement',
    maturity: 'preview',
    title: 'A falling salicylate concentration is not always improvement',
    body:
      'Salicylate moves between the blood and the tissues depending on pH. In its charged form it '
      + 'stays where it is; in its uncharged form it crosses membranes, including into the brain. '
      + 'Acidosis shifts the balance toward the form that crosses.\n\n'
      + 'So a patient who is becoming acidotic can show a falling concentration in the blood while '
      + 'getting worse, because the drug is leaving the compartment being measured for the one '
      + 'that matters. The number improves and the patient deteriorates, and treating the number '
      + 'means missing it.\n\n'
      + 'The same chemistry explains the treatment. Alkalinising the blood and the urine keeps the '
      + 'salicylate charged, which keeps it out of the brain and speeds its loss in the urine. It '
      + 'also explains the danger of anything that lets the pH fall — including taking over the '
      + 'breathing of a patient whose own fast respiratory rate was holding their pH up, which can '
      + 'be followed by abrupt deterioration if that ventilation is not matched.\n\n'
      + 'What tracks the patient instead is the whole picture: the acid-base state, the '
      + 'neurological state, and the trend of both, read beside serial concentrations rather than '
      + 'instead of them.\n\n'
      + 'The falling-number lab holds that divergence, with a concentration going the right way.',
    diagram: {
      kind: 'membrane-stabilisation',
      caption: 'As the pH falls the uncharged form crosses into tissue, so the measured blood level falls as the patient worsens.',
    },
    showMe: { scenarioId: 'salicylate-falling-number' },
    reflects: 'American College of Medical Toxicology, Guidance Document: Management Priorities in Salicylate Toxicity, Journal of Medical Toxicology 2015, and Juurlink et al., Extracorporeal Treatment for Salicylate Poisoning, EXTRIP Workgroup recommendations, Annals of Emergency Medicine 2015.',
    simplifies:
      'Explains the chemistry and gives no concentration threshold, no treatment regimen and no '
      + 'criteria for dialysis. Chronic salicylate poisoning presents differently and is more '
      + 'dangerous at lower concentrations, which this does not cover.',
    review: {
      ...UNSIGNED_REVIEW,
      sources: [
        'American College of Medical Toxicology. Guidance Document: Management Priorities in Salicylate Toxicity. J Med Toxicol. 2015;11:149-152.',
        'Juurlink DN, et al. Extracorporeal Treatment for Salicylate Poisoning: Systematic Review and Recommendations From the EXTRIP Workgroup. Ann Emerg Med. 2015;66:165-181.',
      ],
    },
  },
  {
    id: 'sodium-channel-blockade-is-read-on-the-ecg',
    maturity: 'preview',
    title: 'Sodium-channel blockade is read on the ECG, not on the level',
    body:
      'Several poisons work by blocking the fast sodium channels that start each cardiac cell’s '
      + 'depolarisation — tricyclic antidepressants are the classic group. Blocking them slows '
      + 'conduction through the ventricle, and that slowing is visible: the QRS widens.\n\n'
      + 'The width is therefore doing the job a drug concentration cannot. A measured level takes '
      + 'hours, reflects an earlier moment, and has an uncertain relationship to what the heart is '
      + 'doing. The QRS is available immediately, changes with the patient, and tracks the thing '
      + 'that kills: conduction failure, arrhythmia, and the seizures that come with the same '
      + 'toxicity.\n\n'
      + 'The treatment follows the same mechanism. Raising the sodium concentration around the '
      + 'channel, and alkalinising the blood, both shift the balance away from the blocked state, '
      + 'and the ECG is what says whether that is working.\n\n'
      + 'Two traps follow. A patient can look well with a widening QRS and deteriorate abruptly, '
      + 'so trajectory on serial tracings matters more than any single one. And agents that '
      + 'further impair conduction, used for the arrhythmia this produces, make it worse.\n\n'
      + 'The sodium-channel lab runs that reassessment, with the ECG as the measurement rather '
      + 'than the history.',
    diagram: {
      kind: 'membrane-stabilisation',
      caption: 'Blocked fast channels slow ventricular conduction, so the QRS width reports the poisoning in real time.',
    },
    showMe: { scenarioId: 'tricyclic-sodium-channel-cardiotoxicity' },
    reflects: 'Lavonas et al., 2023 American Heart Association Focused Update on the Management of Patients With Cardiac Arrest or Life-Threatening Toxicity Due to Poisoning, Circulation 2023.',
    simplifies:
      'Names the mechanism and the measurement, and gives no QRS threshold, no agent, no dose and '
      + 'no endpoint. The ingestion is usually mixed, and the other agents in it change the '
      + 'picture in ways a single mechanism does not describe.',
    review: {
      ...UNSIGNED_REVIEW,
      sources: [
        'Lavonas EJ, et al. 2023 American Heart Association Focused Update on the Management of Patients With Cardiac Arrest or Life-Threatening Toxicity Due to Poisoning. Circulation. 2023;148:e149-e184.',
      ],
    },
  },
  {
    id: 'toxidromes-sort-by-the-autonomic-pattern',
    maturity: 'preview',
    title: 'Toxidromes sort by the autonomic pattern, not the agitation',
    body:
      'Several poisonings present as a hot, agitated, confused patient, and they need different '
      + 'responses. What separates them is not how disturbed the patient is but a handful of '
      + 'findings about the autonomic system and the neuromuscular system.\n\n'
      + 'The anticholinergic patient is dry: dry skin, dry mouth, no sweating, flushed, retaining '
      + 'urine, with large pupils and a quiet gut. The sympathomimetic patient is wet: drenched in '
      + 'sweat, with large pupils and an active gut. The cholinergic patient is wet in a different '
      + 'way — salivation, tears, vomiting, diarrhoea, small pupils — and it is their breathing '
      + 'and secretions that threaten them. Serotonin toxicity adds a neuromuscular signature on '
      + 'top of the autonomic one: clonus and rigidity, worse in the legs, with a history of a '
      + 'recent serotonergic change.\n\n'
      + 'Sweating and the pupils carry most of the discrimination, and the gut sounds settle the '
      + 'dry pair. None of it requires a laboratory, which is the point: the sorting happens while '
      + 'the patient is being resuscitated.\n\n'
      + 'Temperature is the finding that outranks the sorting. A hyperthermic, rigid or agitated '
      + 'patient is an emergency whichever toxidrome they belong to.\n\n'
      + 'The anticholinergic lab holds that examination with the hyperthermia running.',
    diagram: {
      kind: 'perfusion-versus-pressure',
      caption: 'Sweating, pupils and gut sounds sort the hot agitated patient; temperature outranks the sorting.',
    },
    showMe: { scenarioId: 'anticholinergic-hyperthermia-delirium' },
    reflects: 'American Heart Association, 2025 Guidelines for CPR and ECC, Part 10, section on adults with life-threatening hyperthermia, and the National Library of Medicine StatPearls review of anticholinergic toxicity.',
    simplifies:
      'Sorts four patterns and gives no treatment, no antidote and no cooling method. Real '
      + 'poisonings are frequently mixed, partial toxidromes are common, and a patient can move '
      + 'between pictures as agents absorb at different rates.',
    review: {
      ...UNSIGNED_REVIEW,
      sources: [
        'American Heart Association. 2025 Guidelines for CPR and ECC. Part 10, Section 16.2, Adults with Life-Threatening Hyperthermia.',
        'National Library of Medicine. StatPearls: Anticholinergic Toxicity.',
      ],
    },
  },
  {
    id: 'in-digoxin-poisoning-potassium-is-the-signal',
    maturity: 'preview',
    title: 'In acute digoxin poisoning, the potassium is the signal',
    body:
      'Digoxin works by inhibiting the pump that exchanges sodium for potassium across the cell '
      + 'membrane. In a large acute overdose, that inhibition is widespread, so potassium that '
      + 'would normally be pumped into cells stays outside them and the measured concentration '
      + 'rises.\n\n'
      + 'That makes the potassium a marker of how much pump is inhibited — which is to say, of how '
      + 'severe the poisoning is — rather than an incidental electrolyte result. A rising '
      + 'potassium in acute digoxin poisoning is one of the strongest indicators of danger '
      + 'available, and it is available quickly.\n\n'
      + 'The consequence is a trap. The reflex response to hyperkalemia moves potassium into '
      + 'cells, which treats the number while leaving the inhibition untouched; what actually '
      + 'reverses both is binding the digoxin. And calcium, which is the reflex for cardiac '
      + 'protection in hyperkalemia, has long been avoided here on the reasoning that it adds to '
      + 'an already calcium-loaded cell, although that concern is now disputed.\n\n'
      + 'Chronic toxicity behaves differently: it often runs with a normal or low potassium, in an '
      + 'older patient whose kidney function has changed, and its rhythm disturbances arrive '
      + 'without the same marker.\n\n'
      + 'The rhythm-and-potassium lab holds the acute version, with a number that invites the '
      + 'wrong treatment.',
    diagram: {
      kind: 'membrane-stabilisation',
      caption: 'The inhibited pump leaves potassium outside the cell, so the rising number measures the poisoning.',
    },
    showMe: { scenarioId: 'digoxin-rhythm-potassium' },
    reflects: 'American Heart Association, Part 10: Adult and Pediatric Special Circumstances of Resuscitation, section on life-threatening digoxin and cardiac-glycoside poisoning, and the DailyMed digoxin prescribing information, overdosage section.',
    simplifies:
      'Explains what the potassium means and gives no threshold, no antidote dose and no '
      + 'indication list. Whether calcium is genuinely harmful here is unsettled, and this does '
      + 'not resolve it; the poisons service does.',
    review: {
      ...UNSIGNED_REVIEW,
      sources: [
        'American Heart Association. Part 10: Adult and Pediatric Special Circumstances of Resuscitation. Section 21.8, life-threatening digoxin and cardiac-glycoside poisoning.',
        'DailyMed. Digoxin tablets prescribing information. Set ID 42d079a7-def1-4220-b71f-db2651966ffe. Overdosage section. Revised 2025.',
      ],
    },
  },
];
