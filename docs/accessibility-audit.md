# Accessibility audit

What has been checked, by what, and what is still owed. The split matters: automation
catches the mechanical failures and misses the ones that only show up when a person
actually uses the thing.

## Checked by automated test, on every build

| Check | Where |
| --- | --- |
| No serious or critical violations on any route | `tests/ui/accessibility-scan.test.tsx` |
| Every specified token pair meets its contrast ratio | `tests/unit/tokens-contrast.test.ts` |
| Every audio event has a paired visual event | `tests/unit/sonification.test.ts` |
| Live-region announcements fire on threshold crossings, not every tick | `tests/unit/accessibility.test.ts` |
| A text description exists for every waveform morphology | `tests/unit/accessibility.test.ts` |
| Hit targets and target gaps hold their token values | `tests/ui/cockpit-layout.test.tsx` |
| No cockpit grid column can grow past its container | `tests/ui/cockpit-layout.test.tsx` |
| What the status bar drops matches the declared sacrifice order | `tests/ui/cockpit-layout.test.tsx` |

## Checked by hand in a browser, 2026-08-20

Chromium, built output, not the development server.

| Check | Result |
| --- | --- |
| Keyboard focus is visible | Pass. Real keyboard focus paints the 2 px `--focus` ring; scripted focus correctly does not, because the rule is `:focus-visible`. |
| Every focusable control has an accessible name | Pass. 20 focusable controls in the running cockpit, none unnamed. |
| No positive `tabindex` anywhere | Pass. |
| Documented keyboard shortcuts work | Pass for play/pause, single step, state summary, waveform description, silence, ventilate, laryngoscopy, shortcut reference. |
| Reflow to 360 by 780 CSS pixels | Pass. The page does not scroll horizontally. The status bar drops the patient summary and the speed selector, both of which reappear in the overflow menu. |
| A full induction completes at 360 by 780 | Pass. Preoxygenation to an inspired fraction of 1.0, induction with propofol and remifentanil, videolaryngoscopy to a grade 1 view and intubation, then the debrief. |
| Target sizes in the running cockpit | Pass after a fix: the vital value doubles as the "explain why" control, and a `--` reading was two characters wide. It now carries a 44 by 40 floor. |

## Shared tutor and reporting checks, 2026-08-27

Engineering browser checks used the development server and real 320 px iframe viewports,
not a simulated JSDOM layout. Adrenal content 0.1.2 and hypoglycemia content 0.1.3 were checked;
clinical content, capability 0.1.0-alpha.48, and maturity records did not change.

- At 320 × 720, the old adrenal takeover button extended to y=756.8 and overlapped narration.
  Both repaired controls are 140 × 48.5 px, end at y=708, and pass center-point hit checks.
  Long narration scrolls independently; changing the explanation resets it without losing
  Continue focus or moving either button.
- At 320 × 568, both examples have the same 140 × 48.5 px controls ending at y=556.
  The adrenal Actions sheet stops at y=344, above the tutor strip. The local report dialog
  is centered at (160, 284), scrollable, and capped at 160 characters; no report was submitted.
- At a 320 × 180 frame, page flow replaces the fixed tutor strip. After scrolling, both
  buttons pass hit checks above the report/panel launchers. Removing unused resize handles
  eliminates horizontal page overflow: client and scroll widths both measure 305 px with
  the vertical scrollbar. This is a short-viewport check, not actual 400% browser zoom.
- At 1,280 × 720, the hypoglycemia narration fits its 68 px region and both 44 px controls
  remain fully visible. Narrow pages have no horizontal page overflow at 320 × 568 or 720.

DOM regressions prove shortcut isolation, preservation of neutral-surface shortcuts, successful
report dismissal, focus on Done, focus restoration, and a fresh security check on reopening.
Native Tab/Space/Enter activation and a complete screen-reader session were not established by
this browser run. Localhost reporting also does not verify a live interactive Turnstile widget.
The temporary layout fixture was removed before the build; it is not a shipped route.

Full CI passed 3,349 tests across 445 files, including 29 added regressions. All 30 specs,
lint, TypeScript, static-host checks, asset budgets, and font checks passed. The updated
specs and final short-screen assertion were also verified separately.
The indexable build verified 217 routes. Its 211 preview-channel blockers remain disclosed;
these engineering checks do not grant clinical review, deployment approval, or full conformance.

## Nested reporting and compact security check, 2026-08-27

A temporary development fixture used the real shared source drawer and report modal with
Cloudflare's public interactive test key. It did not supply a submission token to the report
form, solve a challenge, or send a report. The fixture was removed before CI and is not shipped.

- At 320 × 568, the modal is centered at (160, 284). Its client and scroll widths both measure
  271 px; the document client and scroll widths both measure 320 px. The real compact test
  widget, expanded payload preview, and footer are reachable by vertical scrolling.
- Resizing the same iframe to 568 × 320 without reloading keeps the modal centered at
  (284, 160), with client and scroll widths of 519 px. The widget and footer remain visible
  after scrolling. Returning to portrait preserves the open report and avoids horizontal overflow.
- Escape closes only the report and restores focus to the source's report control. A second
  Escape closes the source drawer and restores its original trigger.

Focused DOM tests cover top-dialog Tab/Escape ownership, pending-send dismissal protection,
empty dialogs, removed invokers, simultaneous mounts, StrictMode reopening, and nonmodal
background interaction. Widget tests verify compact options and no rerender/reset on resize.
These checks do not establish native Tab traversal through the third-party challenge, a full
screen-reader session, production-domain Turnstile validation, or a successful D1 submission.
No scenario content version, clinical review, or exact-version reporting gate is promoted.

Full CI passed 3,371 tests across 447 files, including 22 added regressions. All 30 specs,
lint, TypeScript, static-host checks, asset budgets, and font checks passed. The indexable
build verified 217 routes; its 211 preview-channel blockers remain open.

## Thyroid worked-example controls, 2026-08-27

The exact content 0.1.0 worked example uses stopped-clock reading, a stable Continue control,
and one narration at a time. Desktop browser checks passed hit tests for Continue, takeover,
and Report. Reporting was centered at (640, 360) in a 1,280 × 720 viewport, kept context opt-in
off, and returned focus without restarting the accelerated example. A 320 × 568 same-origin
iframe showed independently scrolling narration and unobscured Continue/takeover controls;
Report, cancellation, one decision, and takeover were exercised through the actual route.

Shared-controller regressions reject callbacks from earlier steps, previous runs, and unmounted
cockpits. Route regressions preserve report pause intent across a late final frame and restore
1× speed when an example is reset into manual practice. Final CI passed 3,450 tests across
453 files. Browser observation did not establish full timed handoff, native keyboard completion,
screen-reader usability, or 400% zoom conformance; those claims are not promoted. Detailed
scope is in the [thyroid evidence brief](evidence-briefs/thyroid-storm-hemodynamic-risk.md).

## Compact shared navigation, 2026-08-27

The shared header now has a closed native Browse disclosure containing the same 15 links.
It stays in document flow, so expanded navigation cannot pin a tall panel over the lesson.
SSR regressions preserve the first skip link, current-page marker, extra links, and external-link
protections. DOM tests cover Escape ownership and report-modal focus restoration.

Browser checks measured a 69 px desktop header. A 320 × 568 iframe exposed a home/Browse
collision when header text was doubled; separate rows below 420 px remove that collision.
The repaired enlarged-text header measures 118.3 px at a 305 px content width, with equal
client/scroll widths. This tests header text enlargement, not whole-app text-scale conformance.
All 15 expanded links remain in normal scroll flow with at least 44 px target height.

The generated briefing was loaded in an iframe without script permission. Browse opened and
closed with native Enter/Space, and Tab reached its first link. In the hydrated briefing, Escape
closed Browse and restored its control; dismissing Report left Browse open and restored Report
focus. No report was sent. Full screen-reader, whole-session keyboard, and actual 400% zoom
validation remain open. Temporary test pages are excluded from the final build.

## Still owed, and only a person can do it

The thyroid-storm content 0.1.0 engineering check is recorded in
[its evidence brief](evidence-briefs/thyroid-storm-hemodynamic-risk.md). It verifies 320 px action
label wrapping, 8 px gaps, scroll reachability, and centered reporting. A shared briefing repair
keeps Start above the fixed Report launcher; both passed browser hit tests. These checks do not
replace the manual obligations below.

- **Screen reader narration.** Nobody has listened to VoiceOver, NVDA or TalkBack read a
  session. The automated scan proves the markup is not broken; it does not prove the
  narration is usable, which is a different question.
- **400% browser zoom reflow.** The 360 by 780 viewport check exercises the same reflow
  path, but zoom is not the same as a narrow viewport and should be checked separately.
- **Keyboard-only completion by someone who does not know the code.** The run above was
  driven by the person who wrote it, which is the weakest possible form of this test.

Until those three are done, task 8.6 stays open and this file says so rather than the
conformance report implying a coverage it does not have.
