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

## Still owed, and only a person can do it

- **Screen reader narration.** Nobody has listened to VoiceOver, NVDA or TalkBack read a
  session. The automated scan proves the markup is not broken; it does not prove the
  narration is usable, which is a different question.
- **400% browser zoom reflow.** The 360 by 780 viewport check exercises the same reflow
  path, but zoom is not the same as a narrow viewport and should be checked separately.
- **Keyboard-only completion by someone who does not know the code.** The run above was
  driven by the person who wrote it, which is the weakest possible form of this test.

Until those three are done, task 8.6 stays open and this file says so rather than the
conformance report implying a coverage it does not have.
