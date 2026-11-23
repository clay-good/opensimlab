/**
 * Neurology concept explainers
 * (knowledge-layer → the minimum knowledge set).
 *
 * Six concepts, each the reasoning behind a recurring mistake in this module's
 * labs, under 250 words with a caption, a source, a stated simplification, and
 * the lesson that demonstrates it. Each cites the publications the lesson it
 * points at already declares.
 *
 * Every one explains; none instructs a dose or a drug choice.
 */

import { UNSIGNED_REVIEW, type Explainer } from '@platform/knowledge/explainer';

export const NEUROLOGY_EXPLAINERS: readonly Explainer[] = [
  {
    id: 'the-posterior-circulation-hides',
    maturity: 'preview',
    title: 'Posterior circulation stroke hides behind ordinary symptoms',
    body:
      'Stroke recognition is built around the face, arm and speech of a hemisphere, and that '
      + 'pattern belongs to the front of the brain. The back of it — the brainstem, the cerebellum '
      + 'and what the basilar artery supplies — produces a different list: dizziness, nausea and '
      + 'vomiting, unsteadiness, double vision, slurred speech, difficulty swallowing, a '
      + 'fluctuating conscious level.\n\n'
      + 'Every item on that list has a common benign explanation, which is why these patients are '
      + 'the ones sent home or watched. Basilar occlusion in particular can stutter for hours, '
      + 'improving between episodes, before it declares itself as a devastating one.\n\n'
      + 'What raises the suspicion is the combination rather than any single symptom: more than '
      + 'one brainstem sign at once, a deficit that crosses sides, new symptoms that are '
      + 'persistent rather than positional, and a conscious level that is not what it was. A '
      + 'patient who is drowsy and dizzy is not a patient with vertigo.\n\n'
      + 'The reason it carries so much weight is the time the recognition costs. The treatments '
      + 'that reopen an artery are bounded by time from when the patient was last known well, and '
      + 'that clock is running during every hour spent on a more comfortable diagnosis.\n\n'
      + 'The basilar lab holds that stuttering course, where the patient looks better twice before '
      + 'they look much worse.',
    diagram: {
      kind: 'compensation-curve',
      caption: 'A stuttering deficit improves twice before it declares itself, and the clock runs through all of it.',
    },
    showMe: { scenarioId: 'basilar-artery-occlusion-escalation' },
    reflects: 'Prabhakaran et al., 2026 Guideline for the Early Management of Patients With Acute Ischemic Stroke, Stroke 2026.',
    simplifies:
      'Names the pattern and gives no examination technique, no imaging pathway, no time window '
      + 'and no treatment criteria. Telling a central cause of dizziness from a peripheral one at '
      + 'the bedside is a skill this does not teach.',
    review: {
      ...UNSIGNED_REVIEW,
      sources: [
        'Prabhakaran S, Gonzalez NR, Zachrison KS, et al. 2026 Guideline for the Early Management of Patients With Acute Ischemic Stroke. Stroke. 2026;57:e317-e473.',
      ],
    },
  },
  {
    id: 'intracranial-pressure-is-a-cliff',
    maturity: 'preview',
    title: 'Intracranial pressure is flat until it is a cliff',
    body:
      'The skull is a fixed box holding brain, blood and cerebrospinal fluid. Something growing '
      + 'inside it is accommodated at first by pushing fluid and venous blood out, so the pressure '
      + 'barely moves and the patient barely changes.\n\n'
      + 'When that room runs out, the relationship turns. The same small further increase in '
      + 'volume that was absorbed an hour ago now raises the pressure steeply, and the '
      + 'deterioration that follows is fast rather than gradual. A patient who has been stable for '
      + 'hours can decline in minutes without anything new happening.\n\n'
      + 'The late signs are the brain being pushed somewhere it does not fit: a pupil that '
      + 'enlarges and stops reacting, a worsening conscious level, posturing, and a rising blood '
      + 'pressure with a slowing pulse and irregular breathing. Those are not early warnings. They '
      + 'mark the part of the curve where there is no room left.\n\n'
      + 'This also explains why the usual physiology matters so much here: anything that raises '
      + 'carbon dioxide dilates cerebral vessels and adds blood volume to a box with none to '
      + 'spare, and anything that obstructs venous drainage does the same.\n\n'
      + 'The herniation lab runs the cliff: a patient who is unchanged, unchanged, unchanged, and '
      + 'then not.',
    diagram: {
      kind: 'compensation-curve',
      caption: 'Volume is absorbed with almost no change in pressure until the room runs out, then the curve turns vertical.',
    },
    showMe: { scenarioId: 'acute-transtentorial-herniation-pattern' },
    reflects: 'Neurocritical Care Society, Emergency Neurological Life Support: Intracranial Hypertension and Herniation Protocol, version 6.0, 2026, and Stevens et al., Neurocritical Care 2015.',
    simplifies:
      'Explains the shape of the curve and names no treatment, threshold, target or monitoring '
      + 'method. The things that lower pressure differ by cause and most of them are temporary '
      + 'measures while something definitive is arranged.',
    review: {
      ...UNSIGNED_REVIEW,
      sources: [
        'Neurocritical Care Society. Emergency Neurological Life Support: Intracranial Hypertension and Herniation Protocol. Version 6.0. 2026.',
        'Stevens RD, Shoykhet M, Cadena R. Emergency Neurological Life Support: Intracranial Hypertension and Herniation. Neurocrit Care. 2015;23 Suppl 2:S76-S82.',
      ],
    },
  },
  {
    id: 'a-seizure-can-be-invisible',
    maturity: 'preview',
    title: 'A seizure can be invisible',
    body:
      'Status epilepticus is defined by duration rather than by appearance: a seizure that goes on '
      + 'past the point at which it would usually stop, or seizures that recur without recovery '
      + 'between them. Nothing in that definition requires movement.\n\n'
      + 'After a prolonged convulsion, the motor part can stop while the electrical seizure '
      + 'continues. What is left is a patient who is simply not waking up, or who is confused, '
      + 'staring, or subtly twitching at the face or an eye. That is easy to attribute to the '
      + 'post-ictal period, to sedation, to the illness that brought them in.\n\n'
      + 'The reason it is worth suspecting is that the brain injury of ongoing seizure continues '
      + 'whether or not the body is moving, and the only way to see it is an EEG. So the '
      + 'persisting unexplained impairment after a convulsion is itself the indication to ask for '
      + 'one, rather than a reason to wait longer.\n\n'
      + 'The same thinking applies to a critically ill patient with an unexplained reduced '
      + 'conscious level and no convulsion at all: nonconvulsive status is found by looking for '
      + 'it.\n\n'
      + 'The recognition lab holds a patient who has stopped convulsing and has not come back, and '
      + 'asks what that is being called.',
    diagram: {
      kind: 'membrane-stabilisation',
      caption: 'The movement stops and the electrical seizure continues; only an EEG separates the two.',
    },
    showMe: { scenarioId: 'nonconvulsive-status-epilepticus-recognition' },
    reflects: 'Herman et al., Consensus Statement on Continuous EEG in Critically Ill Adults and Children, Part I: Indications, Journal of Clinical Neurophysiology 2015, and Trinka et al., A definition and classification of status epilepticus, Epilepsia 2015.',
    simplifies:
      'Says when to suspect it and gives no treatment, no monitoring duration and no EEG '
      + 'interpretation. The patterns that count as seizure on an EEG are genuinely contested, '
      + 'and the reading is a specialist one.',
    review: {
      ...UNSIGNED_REVIEW,
      sources: [
        'Herman ST, Abend NS, Bleck TP, et al. Consensus Statement on Continuous EEG in Critically Ill Adults and Children, Part I: Indications. J Clin Neurophysiol. 2015;32:87-95.',
        'Trinka E, Cock H, Hesdorffer D, et al. A definition and classification of status epilepticus. Epilepsia. 2015;56:1515-1523.',
      ],
    },
  },
  {
    id: 'in-meningitis-the-waiting-is-the-harm',
    maturity: 'preview',
    title: 'In suspected meningitis, the waiting is the harm',
    body:
      'Bacterial meningitis worsens by the hour, and most of the delay in treating it is not '
      + 'indecision — it is sequencing. The lumbar puncture needs to happen before antibiotics to '
      + 'give the best chance of identifying the organism. Imaging is sometimes needed before the '
      + 'lumbar puncture. Each step is reasonable, and together they can add hours.\n\n'
      + 'The resolution is to break the sequence rather than to hurry it. Blood cultures are taken, '
      + 'antibiotics are started, and the lumbar puncture happens when it safely can. The fluid is '
      + 'still informative after treatment has begun — cell counts, protein, glucose and molecular '
      + 'tests survive it — so what is lost is some diagnostic yield, and what is gained is time '
      + 'in a disease measured in hours.\n\n'
      + 'The second trap is the presentation. The full triad of fever, neck stiffness and altered '
      + 'consciousness is often absent, particularly in the old, the immunosuppressed and the very '
      + 'young, and a rash may never appear. Suspicion rests on the combination and the '
      + 'trajectory.\n\n'
      + 'The first-hour lab holds that ordering decision while the clock runs, with the imaging '
      + 'question open.',
    diagram: {
      kind: 'compression-fraction',
      caption: 'Each step before treatment is defensible on its own; the sum of them is the harm.',
    },
    showMe: { scenarioId: 'acute-bacterial-meningitis-first-hour' },
    reflects: 'World Health Organization guidelines on meningitis diagnosis, treatment and care, 2025, and NICE guideline NG240 on bacterial meningitis and meningococcal disease, 2024.',
    simplifies:
      'Explains why the order matters and names no antibiotic, no dose, no imaging criteria and '
      + 'no timing target. Which patients need imaging first, and the role of steroids, are both '
      + 'decisions this does not make.',
    review: {
      ...UNSIGNED_REVIEW,
      sources: [
        'World Health Organization. WHO guidelines on meningitis diagnosis, treatment and care. Geneva: WHO; 2025.',
        'National Institute for Health and Care Excellence. Meningitis (bacterial) and meningococcal disease: recognition, diagnosis and management. NICE guideline NG240. 2024.',
      ],
    },
  },
  {
    id: 'delirium-is-a-symptom-not-a-diagnosis',
    maturity: 'preview',
    title: 'Delirium is a symptom, and the quiet kind gets missed',
    body:
      'Delirium is an acute, fluctuating disturbance of attention and awareness caused by '
      + 'something else: infection, pain, a new medicine, withdrawal, retention, constipation, a '
      + 'metabolic disturbance, a stroke. Naming it is the beginning of the problem rather than '
      + 'the end — the useful question is always what caused it.\n\n'
      + 'The version that gets recognised is the agitated one, because it demands attention. The '
      + 'commoner version is hypoactive: a patient who is quiet, withdrawn, sleepy and slow to '
      + 'respond. That patient disturbs nobody, is often described as comfortable or simply tired, '
      + 'and does worse than the agitated one.\n\n'
      + 'The fluctuation is what makes it easy to miss across a shift. A patient who is lucid '
      + 'during the ward round can be disoriented at three in the morning, and the person who sees '
      + 'both is rarely the same person. Which is why it is detected by a brief structured test '
      + 'repeated over time, and by asking whoever knows the patient what they were like before.\n\n'
      + 'Sedating it treats the observer, not the patient, and some of the medicines used worsen '
      + 'the delirium they are given for.\n\n'
      + 'The reversible-causes lab runs that search, with a quiet patient who is easy to leave '
      + 'alone.',
    diagram: {
      kind: 'perfusion-versus-pressure',
      caption: 'The agitated patient is recognised; the quiet one fluctuates, disturbs nobody, and does worse.',
    },
    showMe: { scenarioId: 'acute-delirium-reversible-causes' },
    reflects: 'NICE guideline CG103 on delirium prevention, diagnosis and management, updated 2023, and NICE quality standard QS63 on delirium in adults.',
    simplifies:
      'Frames delirium as a search for a cause and names no screening instrument, no treatment '
      + 'and no medication. Telling delirium from dementia, and from the two together, needs a '
      + 'baseline from someone who knows the person, which is outside this.',
    review: {
      ...UNSIGNED_REVIEW,
      sources: [
        'National Institute for Health and Care Excellence. Delirium: prevention, diagnosis and management in hospital and long-term care. NICE guideline CG103. Updated 2023.',
        'National Institute for Health and Care Excellence. Delirium in adults. NICE quality standard QS63. Updated 2023.',
      ],
    },
  },
  {
    id: 'cord-compression-is-a-closing-window',
    maturity: 'preview',
    title: 'Spinal cord compression is a closing window',
    body:
      'In metastatic spinal cord compression, the function a patient has when treatment starts is '
      + 'close to the function they keep. A patient still walking usually walks afterwards; a '
      + 'patient who has lost that is much less likely to get it back. The injury is a compressed '
      + 'cord with a failing blood supply, and that becomes irreversible over hours to days.\n\n'
      + 'So the whole of the management is about shortening the interval between the first clue '
      + 'and the imaging that confirms it. The first clue is almost always pain — new, progressive '
      + 'back pain in someone with cancer, often worse lying flat, at night, or on straining — and '
      + 'it comes days to weeks before any weakness.\n\n'
      + 'The neurological signs arrive later and in a telling order: a band of altered sensation, '
      + 'heaviness or clumsiness in the legs, difficulty with the stairs, then bladder and bowel '
      + 'disturbance. By the time retention is present, a good deal of the window has gone.\n\n'
      + 'The practical consequence is that the pain alone is the trigger for urgent imaging of the '
      + 'whole spine, not a reason to wait for a sign to confirm it.\n\n'
      + 'The compression lab holds the interval, with a patient whose only finding is pain.',
    diagram: {
      kind: 'compensation-curve',
      caption: 'Pain comes weeks before weakness; the function kept afterwards is close to the function at treatment.',
    },
    showMe: { scenarioId: 'metastatic-spinal-cord-compression' },
    reflects: 'NICE guideline NG234 on spinal metastases and metastatic spinal cord compression, 2023, and NICE quality standard QS56, quality statement 3, on imaging for adults with suspected metastatic spinal cord compression.',
    simplifies:
      'Argues for the urgency and gives no timing target, no imaging protocol and no treatment: '
      + 'steroids, radiotherapy and surgery are all decisions made with the oncology and spinal '
      + 'teams on the particular patient.',
    review: {
      ...UNSIGNED_REVIEW,
      sources: [
        'National Institute for Health and Care Excellence. Spinal metastases and metastatic spinal cord compression. NICE guideline NG234. 2023.',
        'National Institute for Health and Care Excellence. Quality statement 3: Imaging for adults with suspected metastatic spinal cord compression. NICE quality standard QS56. Updated 2023.',
      ],
    },
  },
];
