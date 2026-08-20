# Device measurements

Frame-budget results from real hardware. **This directory is empty.**

The budget is a 95th-percentile frame time under 16.7 ms with five simultaneous traces and
the solver running, measured over 60 seconds. `openspec/changes/mvp-anesthesia-alpha`
requires it on **a mid-range 2020 Android handset, physical hardware, not an emulator**,
because a continuous integration runner and a desktop browser both flatter the result badly
enough to make the measurement worthless.

## How to take one

1. Serve the built output: `npm run build && npx vite preview`.
2. Open `/frame-budget` on the device.
3. Run the 60-second measurement twice: once with the solver running, once without.
4. If the budget fails, work down the degradation ladder the page lists and record which
   rung the device settles on.
5. Commit the JSON the page prints as `docs/measurements/<device>-<date>.json`.

Falling off the bottom of the ladder means the architecture is revised. It does not mean
the budget is quietly relaxed.
