/**
 * Critical care concept explainers
 * (knowledge-layer → the minimum knowledge set).
 *
 * Six concepts, each one the reasoning behind a recurring mistake in this
 * module's labs, under 250 words with a caption, a source, a stated
 * simplification, and the lesson that demonstrates it. Each cites the same
 * publications the lesson it points at declares.
 *
 * Every one explains; none instructs a setting or a dose. The numbers this
 * module teaches live in its lessons, inside the envelope those lessons declare.
 */

import { UNSIGNED_REVIEW, type Explainer } from '@platform/knowledge/explainer';

export const CRITICAL_CARE_EXPLAINERS: readonly Explainer[] = [
  {
    id: 'lung-protection-trades-numbers-for-lung',
    maturity: 'preview',
    title: 'Lung protection trades the numbers for the lung',
    body:
      'An injured lung is not uniformly injured. Some of it is consolidated and takes no gas at '
      + 'all, so every delivered breath goes into whatever is still open. That remaining lung is '
      + 'small, and a tidal volume chosen for a whole lung overdistends it.\n\n'
      + 'Two things follow. Tidal volume is scaled to predicted body weight rather than measured '
      + 'weight, because what sets lung size is height and sex, not how heavy the patient has '
      + 'become. And the pressure that matters is the one across the lung between breaths and at '
      + 'the end of inspiration — the driving pressure — rather than the peak the ventilator '
      + 'reports, which includes the resistance of the tube and the airways.\n\n'
      + 'The cost of protecting the lung is that the gas numbers get worse. Smaller breaths clear '
      + 'less carbon dioxide, so the arterial carbon dioxide rises and the pH falls. Tolerating '
      + 'that, within limits, is the deliberate trade: the acidemia is reversible and the '
      + 'overdistension is not.\n\n'
      + 'Which is why a rising carbon dioxide on protective settings is not automatically a '
      + 'failure to be corrected by bigger breaths. The ARDS lab holds exactly that moment, with '
      + 'a number that looks wrong and a lung that is being kept safe.',
    diagram: {
      kind: 'oxygen-delivery',
      caption: 'The open lung is smaller than the patient: the same breath that is normal for a whole lung overdistends what is left.',
    },
    showMe: { scenarioId: 'ards-lung-protective-ventilation' },
    reflects: 'Qadir et al., An Update on Management of Adult Patients with Acute Respiratory Distress Syndrome: An Official ATS Clinical Practice Guideline, American Journal of Respiratory and Critical Care Medicine 2024, and Fan et al., Mechanical Ventilation in Adult Patients with ARDS, ATS/ESICM/SCCM 2017.',
    simplifies:
      'Explains why the settings are chosen and names no volume, pressure, rate or oxygen target, '
      + 'and no limit on how much acidemia is acceptable. It also says nothing about positioning, '
      + 'neuromuscular blockade or rescue therapies, which is where much of the management is.',
    review: {
      ...UNSIGNED_REVIEW,
      sources: [
        'Qadir N, Sahetya S, Munshi L, et al. An Update on Management of Adult Patients with Acute Respiratory Distress Syndrome: An Official ATS Clinical Practice Guideline. Am J Respir Crit Care Med. 2024;209:24-36.',
        'Fan E, Del Sorbo L, Goligher EC, et al. Mechanical Ventilation in Adult Patients with ARDS: An Official ATS/ESICM/SCCM Clinical Practice Guideline. Am J Respir Crit Care Med. 2017;195:1253-1263.',
      ],
    },
  },
  {
    id: 'auto-peep-is-a-timing-problem',
    maturity: 'preview',
    title: 'Auto-PEEP is a timing problem that looks like everything else',
    body:
      'When a breath is delivered before the previous one has finished leaving, a little volume '
      + 'stays behind. Repeat that for a few minutes and the lung is holding a pressure at the end '
      + 'of every expiration that nobody set. That is auto-PEEP, and obstructed airways, a fast '
      + 'rate and a short expiratory time all produce it.\n\n'
      + 'It then imitates several other problems at once. The trapped pressure opposes venous '
      + 'return, so the blood pressure falls as though the patient were dry or septic. It also has '
      + 'to be overcome before any patient effort reaches the trigger, so breaths are attempted '
      + 'and nothing is delivered, which looks like weakness or agitation. The peak pressure '
      + 'climbs, which looks like worsening lung disease.\n\n'
      + 'The flow waveform tells the truth: expiratory flow has not returned to zero when the next '
      + 'breath begins. Lengthening the time available for exhalation is what resolves it, and '
      + 'briefly separating the patient from the circuit both confirms the diagnosis and relieves '
      + 'the pressure.\n\n'
      + 'The auto-PEEP lab runs the hypotension-and-failed-trigger pattern so the flow trace, '
      + 'rather than the pressure, becomes the thing worth looking at.',
    diagram: {
      kind: 'compression-fraction',
      caption: 'Expiratory flow has not reached zero when the next breath starts, so a little volume is kept each cycle.',
    },
    showMe: { scenarioId: 'auto-peep' },
    reflects: 'Goodfellow et al., AARC Clinical Practice Guideline: Patient-Ventilator Assessment, Respiratory Care 2024, and Blanch et al., Measurement of air trapping, intrinsic positive end-expiratory pressure, and dynamic hyperinflation in mechanically ventilated patients, Respiratory Care 2005.',
    simplifies:
      'Names the mechanism and the waveform that shows it. It gives no settings, no measurement '
      + 'technique, and no threshold at which trapped pressure matters, and it leaves out the '
      + 'treatment of the obstruction itself, which is usually the reason the trapping is there.',
    review: {
      ...UNSIGNED_REVIEW,
      sources: [
        'Goodfellow LT, Miller AG, Varekojis SM, et al. AARC Clinical Practice Guideline: Patient-Ventilator Assessment. Respir Care. 2024;69:1042-1054.',
        'Blanch L, Bernabé F, Lucangelo U. Measurement of air trapping, intrinsic positive end-expiratory pressure, and dynamic hyperinflation in mechanically ventilated patients. Respir Care. 2005;50:110-124.',
      ],
    },
  },
  {
    id: 'the-right-ventricle-fails-differently',
    maturity: 'preview',
    title: 'The right ventricle fails differently from the left',
    body:
      'The right ventricle is a thin-walled pump built for a low-pressure circuit. It tolerates '
      + 'volume well and afterload badly, which is the reverse of the chamber most bedside '
      + 'reasoning is built around.\n\n'
      + 'So when pulmonary pressures rise — from embolism, from hypoxic vasoconstriction, from '
      + 'acidemia, from the pressure a ventilator applies — the right ventricle dilates rather '
      + 'than compensating. A dilated right ventricle pushes the septum toward the left, which '
      + 'then fills less, so left-sided output falls even though the left ventricle is healthy. '
      + 'And because the coronary supply to the right ventricle depends on the pressure gradient '
      + 'across it, a falling systemic pressure starves the very chamber that is failing. That '
      + 'loop closes quickly.\n\n'
      + 'The practical consequence is that the reflex of loading a hypotensive patient with fluid '
      + 'can make this worse: more volume in a chamber already over-distended worsens the septal '
      + 'shift. Keeping the systemic pressure up, lowering what the right ventricle is pumping '
      + 'against, and avoiding the hypoxia and acidemia that raise it are the ways out.\n\n'
      + 'The right-ventricular-failure lab holds that fluid decision open while the pressures move.',
    diagram: {
      kind: 'obstructive-filling',
      caption: 'A dilated right ventricle shifts the septum, so the healthy left ventricle fills less and output falls.',
    },
    showMe: { scenarioId: 'right-ventricular-failure' },
    reflects: 'Konstam et al., Evaluation and Management of Right-Sided Heart Failure: A Scientific Statement From the American Heart Association, Circulation 2018, and Humbert et al., 2022 ESC/ERS Guidelines for the diagnosis and treatment of pulmonary hypertension.',
    simplifies:
      'Describes the loop and names no agent, target or quantity, and no way of deciding how much '
      + 'volume a particular right ventricle will tolerate. Mechanical support and the treatment '
      + 'of the cause are both outside it.',
    review: {
      ...UNSIGNED_REVIEW,
      sources: [
        'Konstam MA, Kiernan MS, Bernstein D, et al. Evaluation and Management of Right-Sided Heart Failure: A Scientific Statement From the American Heart Association. Circulation. 2018;137:e578-e622.',
        'Humbert M, Kovacs G, Hoeper MM, et al. 2022 ESC/ERS Guidelines for the diagnosis and treatment of pulmonary hypertension. Eur Heart J. 2022;43:3618-3731.',
      ],
    },
  },
  {
    id: 'dyssynchrony-is-two-clocks-disagreeing',
    maturity: 'preview',
    title: 'Dyssynchrony is two clocks disagreeing',
    body:
      'A ventilated patient who is making an effort has their own respiratory rhythm, and the '
      + 'ventilator has a set one. Dyssynchrony is what happens when the two do not line up, and '
      + 'the forms it takes are worth telling apart because they point at different fixes.\n\n'
      + 'An effort that never reaches the trigger produces a breath the patient attempted and did '
      + 'not get. A delivered breath that ends while the patient is still inhaling produces a '
      + 'second, stacked one on top of the first, and a larger volume than the setting implies. A '
      + 'patient who is still exhaling when the machine cycles in fights it directly.\n\n'
      + 'The reason it is not only a comfort problem is that volume. Stacked breaths deliver more '
      + 'than the protective setting says, so the lung is getting breaths nobody prescribed.\n\n'
      + 'And the first reflex, deepening sedation, treats the appearance rather than the mismatch '
      + 'and brings its own costs. Trigger sensitivity, inspiratory time and flow are where the '
      + 'mismatch actually lives, as is trapped pressure, which makes every effort harder to '
      + 'register.\n\n'
      + 'The dyssynchrony lab shows the waveform pattern before it shows the patient settling.',
    diagram: {
      kind: 'compression-fraction',
      caption: 'The patient’s effort and the machine’s cycle run on separate clocks; each way they miss looks different on the waveform.',
    },
    showMe: { scenarioId: 'ventilator-dyssynchrony' },
    reflects: 'Goodfellow et al., AARC Clinical Practice Guideline: Patient-Ventilator Assessment, Respiratory Care 2024, and Sottile et al., The Association Between Ventilator Dyssynchrony, Delivered Tidal Volume, and Sedation, Critical Care Medicine 2018.',
    simplifies:
      'Sorts the patterns and gives no settings, no sedation guidance, and no way of judging how '
      + 'much dyssynchrony matters for a given patient. Reading these patterns at the bedside '
      + 'takes a waveform and practice this does not substitute for.',
    review: {
      ...UNSIGNED_REVIEW,
      sources: [
        'Goodfellow LT, Miller AG, Varekojis SM, et al. AARC Clinical Practice Guideline: Patient-Ventilator Assessment. Respir Care. 2024;69:1042-1054.',
        'Sottile PD, Albers D, Higgins C, Mckeehan J, Moss MM. The Association Between Ventilator Dyssynchrony, Delivered Tidal Volume, and Sedation. Crit Care Med. 2018;46:e151-e157.',
      ],
    },
  },
  {
    id: 'oxygenation-and-ventilation-are-two-problems',
    maturity: 'preview',
    title: 'Oxygenation and ventilation are two different problems',
    body:
      'Oxygen gets into the blood across the alveolar membrane, and carbon dioxide gets out of it '
      + 'by being carried away in exhaled gas. The first depends mostly on how much lung is open '
      + 'and how much oxygen is in it. The second depends mostly on how much gas moves in and out '
      + 'each minute.\n\n'
      + 'Keeping them separate explains why the fixes differ. Hypoxemia from collapsed or flooded '
      + 'lung responds to recruiting and holding lung open, because blood flowing past unventilated '
      + 'alveoli never meets oxygen however much is supplied — raising the inspired fraction moves '
      + 'that patient very little. A rising carbon dioxide responds to moving more gas: a larger '
      + 'breath or a faster rate.\n\n'
      + 'So a saturation that does not improve when oxygen is turned up is information rather than '
      + 'equipment failure: it says the problem is shunt, not supply. And a patient with a normal '
      + 'saturation can still be in trouble from a carbon dioxide nobody has measured.\n\n'
      + 'The escalating-hypoxemia lab makes that distinction the decision: what is checked first '
      + 'when the number falls, and what the response to each step rules out.',
    diagram: {
      kind: 'perfusion-versus-pressure',
      caption: 'Blood passing unventilated lung never meets oxygen, so more inspired oxygen moves a shunt very little.',
    },
    showMe: { scenarioId: 'escalating-hypoxemia' },
    reflects: 'Bohringer and Liu, Hypoxemia after Emergency Intubation, AHRQ Patient Safety Network 2024, and the Defence Medical Services invasive mechanical ventilation clinical guideline, updated 2026.',
    simplifies:
      'Splits the two problems and simplifies both: it ignores dead space, diffusion and the '
      + 'oxygen-carrying capacity of the blood, and it gives no targets for either. Equipment, '
      + 'circuit and tube problems can produce the same numbers and are checked in the lesson, '
      + 'not here.',
    review: {
      ...UNSIGNED_REVIEW,
      sources: [
        'Bohringer C, Liu H. Hypoxemia after Emergency Intubation. AHRQ Patient Safety Network. 2024.',
        'Defence Medical Services. Invasive Mechanical Ventilation. Clinical Guidelines for Operations. Updated 2026-07-01.',
      ],
    },
  },
  {
    id: 'intubation-removes-the-compensation',
    maturity: 'preview',
    title: 'Intubation removes the compensation that was holding the pressure up',
    body:
      'A critically ill patient arrives at intubation already compensating: sympathetic tone is '
      + 'high, the heart is fast, the vessels are constricted, and the effort of breathing is '
      + 'generating negative pressure in the chest that helps draw blood back to the heart.\n\n'
      + 'Induction and positive-pressure ventilation remove all three at once. The induction agent '
      + 'drops the sympathetic tone that was doing the work. The chest now has positive pressure '
      + 'in it for the whole respiratory cycle instead of negative pressure for half of it, so '
      + 'venous return falls. And a patient who was acidemic from their illness loses the high '
      + 'minute ventilation that was partly compensating for it the moment a machine takes over at '
      + 'a set rate.\n\n'
      + 'That is why hypotension after intubation is common, fast, and predictable rather than a '
      + 'complication that appears from nowhere: the state before the drug was being held together '
      + 'by exactly what the drug takes away.\n\n'
      + 'Predictable means preparable. Optimising the circulation before induction, expecting the '
      + 'fall, and having the response ready are the difference between a dip and an arrest. The '
      + 'post-intubation-hypotension lab runs that sequence from before the drug.',
    diagram: {
      kind: 'compensation-curve',
      caption: 'Sympathetic tone, negative-pressure breathing and a high minute ventilation all stop at once.',
    },
    showMe: { scenarioId: 'post-intubation-hypotension' },
    reflects: 'Acquisto et al., Society of Critical Care Medicine Clinical Practice Guidelines for Rapid Sequence Intubation in the Critically Ill Adult Patient, Critical Care Medicine 2023.',
    simplifies:
      'Explains why the pressure falls and names no agent, no quantity and no sequence. Airway '
      + 'management itself, and the choice of who is intubated and when, are both outside it.',
    review: {
      ...UNSIGNED_REVIEW,
      sources: [
        'Acquisto NM, Mosier JM, Bittner EA, et al. Society of Critical Care Medicine Clinical Practice Guidelines for Rapid Sequence Intubation in the Critically Ill Adult Patient. Crit Care Med. 2023;51:1411-1430.',
      ],
    },
  },
];
