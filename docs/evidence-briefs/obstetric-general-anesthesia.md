# Evidence brief: obstetric general anesthesia

## Decision window

This scenario rehearses one bounded interval for a term patient requiring emergency cesarean
delivery under general anesthesia: prepare maternal oxygen reserve, give a hypnotic before a
neuromuscular blocker, wait for the displayed peripheral block signal, perform one modeled airway
attempt, and confirm delivered ventilation and capnography. It ends before surgery or delivery.

## Evidence used

- Mushambi et al., OAA/DAS obstetric difficult-airway guidelines (2015; PMID 26449292) support an
  end-tidal oxygen fraction of at least 0.90, fresh-gas flow of at least 10 L/min, and explicit
  preparation before obstetric general anesthesia. The browser does not assess the guideline's
  physical mask seal, positioning, cricoid pressure, laryngoscopy technique, or rescue algorithms.
- McClelland, Bogod and Hardman (2008; PMID 18289232) modeled shorter apnea tolerance in pregnancy
  than outside pregnancy after near-complete denitrogenation. Open Sim Lab uses that direction and
  approximate course to calibrate one fixed `term-pregnancy` respiratory profile; it does not copy
  the paper's simulator or predict an individual desaturation time.
- Craig et al. (2026; PMID 41987713) provide current pharmacological context for propofol and
  rocuronium during cesarean general anesthesia, while warning that much of the evidence excluded
  high-risk pregnancies and emergencies. The displayed 2 mg/kg propofol and 1.2 mg/kg rocuronium
  expert actions are declared fixture choices, not recommendations.

## Deterministic calibration

The seed-1 expert fixture accepts 100% oxygen and 10 L/min fresh-gas flow at 10 seconds, gives the
declared propofol action at 90 seconds and rocuronium at 91 seconds, reaches displayed train-of-four
count zero before video laryngoscopy at 99.2 seconds, records modeled tube placement at 121.2
seconds, and resumes volume-controlled ventilation at 470 mL and 12 breaths/min. Over the full
4-minute regression trace, the lowest saturation is 96.73%; the final teaching outputs are
saturation 99.99%, end-tidal carbon dioxide 39.73 mmHg, MAP 65.56 mmHg, and predicted depth 46.04.
These numbers make regression drift visible. They are not clinical timing, dose, or outcome targets.
After 2 minutes of modeled preoxygenation followed by uninterrupted apnea, this profile crosses
90% saturation at 352.8 seconds versus 525.1 seconds for the otherwise identical healthy profile.
The pregnancy result sits inside the published model's 3:43–6:17 range, but it is an Open Sim Lab
calibration rather than a reproduction of the Nottingham Physiology Simulator.

## Unsafe inferences excluded

The scenario does not model fetal physiology or monitoring, urgency classification, choice between
neuraxial and general anesthesia, pregnancy-related airway anatomy, positioning or aortocaval
compression, mask seal, cricoid pressure, regurgitation or aspiration, failed-intubation rescue,
maternal awareness, opioid use, neonatal drug transfer or resuscitation, incision, delivery, cord
clamping, volatile maintenance, uterine tone, hemorrhage, emergence, extubation, team performance,
or individualized maternal physiology. Completion demonstrates only the four recorded screen
objectives in this content version.
