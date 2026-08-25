# Evidence brief: aspiration-risk recognition

## Decision this lesson rehearses

During a day-of-procedure review, combine medication phase, gastrointestinal symptoms, fasting,
and procedure urgency. In this elective vignette, current nausea and bloating during semaglutide
dose escalation support deferral until the escalation phase has passed and symptoms have resolved,
with shared replanning rather than a blanket medication rule.

## Source basis

1. Kindel TL, Wang AY, Wadhwa A, et al. *Multi-society clinical practice guidance for the safe use
   of glucagon-like peptide-1 receptor agonists in the perioperative period*. Surgical Endoscopy.
   2025;39(1):180-183. Published online October 29, 2024. The guidance supports patient-specific,
   shared decision-making; identifies dose escalation and gastrointestinal symptoms as risk factors;
   and describes diet modification, gastric ultrasound where available, anesthetic-plan adjustment,
   or deferral as context-dependent options. It explicitly calls itself guidance rather than an
   evidence-based guideline because evidence is limited.
2. American Society of Anesthesiologists. *New Multi-Society GLP-1 Clinical Practice Guidance
   Released*. October 29, 2024. The issuing-body summary says most patients can continue GLP-1
   therapy, while elective surgery should be deferred during escalation with gastrointestinal side
   effects until that phase and those symptoms have passed.
3. American Society of Anesthesiologists. *Practice Guidelines for Preoperative Fasting and the Use
   of Pharmacologic Agents to Reduce the Risk of Pulmonary Aspiration*. Anesthesiology.
   2017;126:376-393. The guideline applies to healthy elective patients and warns that it may need
   modification when conditions affect gastric emptying or fluid volume.

## Implemented teaching bounds

- The case declares one medication timeline, current symptom pattern, ordinary fasting interval,
  and elective procedure. It does not estimate gastric contents or aspiration probability.
- The engine accepts an ordered cue review, one elevated-or-routine classification, and one
  defer-and-replan-or-proceed-routinely disposition. Raw, unsupported, out-of-order, and duplicate
  requests cannot earn credit.
- The expert path records elevated risk and elective deferral because this fictional patient is both
  in dose escalation and symptomatic. It does not turn GLP-1 use alone into a cancellation rule.
- Assessment actions do not change physiology. Replay remains deterministic.

## Explicit exclusions

The browser does not model gastric emptying, gastric volume or contents, point-of-care ultrasound,
regurgitation, aspiration, pneumonitis, fasting efficacy, drug cessation, liquid-diet preparation,
glycemic consequences, emergency surgery, anesthesia selection, rapid-sequence technique, cricoid
pressure, airway skill, procedure cancellation logistics, shared conversation quality, or individual
outcome. Local policy and current multidisciplinary guidance govern real care.
