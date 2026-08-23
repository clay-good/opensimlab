# Expand the anesthesia scenario library

## Why

The engine specification requires at least 12 bundled scenarios across routine and emergency
anesthesia. The alpha proved the platform with 4 scenarios, but it left major code-addressable
coverage gaps once the external face-validity gate was treated as provisionally passed.

The next increment is unexpected intraoperative hemorrhage. It is the smallest case that turns
existing blood-loss physiology into a learner decision: circulating volume, cardiac output,
pressure, end-tidal carbon dioxide, arterial respiratory variation, and attribution already
respond to loss, but learners previously had no way to give fluid.

## What changes

- Add a fifth scenario covering recognition of compensated hemorrhage and initial crystalloid
  temporization during emergency laparotomy.
- Add learner-delivered balanced crystalloid with a fixed 25% intravascular-retention teaching
  model, input validation, event logging, deterministic replay, and a working cockpit tray.
- Track circulating hemoglobin mass so whole-blood loss preserves concentration and retained
  crystalloid causes dilution.
- Evaluate the new scenario's objectives from the recorded actions and map them to the supported
  curriculum frameworks.
- State the boundary plainly: no blood products, coagulopathy, calcium, laboratory guidance,
  source-control action, team behavior, or massive-transfusion protocol is simulated.

## Impact

This closes 1 of the required scenario-family gaps and makes an existing hypovolemia objective
actionable. It does not complete the bundled-library or crisis-injector requirements.
