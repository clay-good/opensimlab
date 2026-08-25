# Perioperative hyperglycemia evidence brief

## What this slice teaches

One stable adult intraoperative vignette presents an elevated glucose cue, asks the learner to
confirm it with a point-of-care measurement, record an institutional insulin-protocol response,
wait the declared interval, and interpret a repeat result against a 100–180 mg/dL target.

## Evidence boundary

- The ADA Standards of Care 2026 recommend monitoring glucose before, during, and after surgery
  and maintaining it between 100 and 180 mg/dL, with goals individualized for the procedure,
  hypoglycemia risk, and therapy.
- The same guidance says continuous glucose monitoring should not be used alone during surgery,
  insulin is the recommended perioperative glucose-lowering medication, and stricter targets are
  not advised because they increase hypoglycemia risk.
- The Endocrine Society guideline supports protocolized, patient-specific inpatient
  hyperglycemia management. It does not justify a universal insulin dose in this browser lesson.

## Modeled behavior

- A scripted event exposes a fixed 238 mg/dL glucose result while modeled vital signs remain stable.
- Confirmation unlocks a dose-free institutional insulin-protocol intent.
- Thirty simulated minutes after that intent, a fixed 174 mg/dL repeat result becomes available.
- The debrief scores accepted engine events, their order, the elapsed interval, and the repeat value.

## Deliberate exclusions

This is not a glucose-insulin, endocrine, nutritional, or metabolic model. It does not simulate
sampling, device performance, insulin selection, dose, route, preparation, delivery,
pharmacokinetics, hypoglycemia, rescue, electrolytes, ketones, acid-base state, osmolarity, renal
function, nutrition, medication reconciliation, infection, complications, or outcome. The two
results are teaching fixtures, not individual predictions or clinical orders.

## Sources

1. American Diabetes Association Professional Practice Committee. Diabetes Care in the Hospital:
   Standards of Care in Diabetes—2026. *Diabetes Care* 2026;49(Suppl 1):S339–S355.
2. Korytkowski MT, et al. Management of Hyperglycemia in Hospitalized Adult Patients in
   Non-Critical Care Settings: An Endocrine Society Clinical Practice Guideline. *J Clin Endocrinol
   Metab* 2022;107:2101–2128. PMID 35709363.
