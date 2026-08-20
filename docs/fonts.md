# Self-hosting and subsetting the type

Open Sim Lab ships two variable families, **Inter** for all interface text and numerics
and **JetBrains Mono** for the event log and tabular code. Both are self-hosted. Nothing
is fetched from a font service, because the privacy architecture forbids any request to a
foreign origin and a font CDN is exactly that.

## Current status

**The font files are not vendored in this build.** Both families fall through to the
system stack, which is why every `@font-face` rule in `src/platform/tokens/fonts.css`
declares `local()` first and why `base.css` gives both a complete fallback. The interface
is fully usable this way; it just is not in the intended type.

This is recorded here and in the validation report rather than passing silently. Running
`npm run fonts` says so out loud.

## Procedure

Both families are openly licensed — Inter under the SIL Open Font License, JetBrains Mono
likewise — so they may be redistributed with this repository provided the license file
travels with them.

1. Obtain the variable `.ttf` for each family from its own project release.
2. Subset to the Latin ranges the interface uses, which are the `unicode-range` values
   declared in `fonts.css`:

   ```
   pyftsubset Inter.ttf \
     --output-file=public/fonts/inter-latin.woff2 \
     --flavor=woff2 \
     --layout-features='*' \
     --unicodes="U+0000-00FF,U+0100-017F,U+0131,U+0152-0153,U+02BB-02BC,U+2000-206F,U+2070-209F,U+20A0-20BF,U+2122,U+2190-2193,U+2212,U+2215"
   ```

   ```
   pyftsubset JetBrainsMono.ttf \
     --output-file=public/fonts/jetbrains-mono-latin.woff2 \
     --flavor=woff2 \
     --layout-features='*' \
     --unicodes="U+0000-00FF,U+2000-206F,U+2212"
   ```

3. Copy each family's `OFL.txt` to `public/fonts/`.
4. Run `npm run fonts`. The combined compressed size must stay under **120 KB**, which is
   the budget the design system states and which continuous integration enforces.

## Why these ranges

The interface needs Basic Latin, Latin-1 Supplement and Latin Extended-A, plus general
punctuation, the arrows the alarm limits use (`↓` `↑`), the minus sign, the subscript
digits in `SpO₂` and `EtCO₂`, and the micro sign in `µg/mL`.

A script outside these ranges renders in the platform system font with no layout break and
no invisible text, which is the behaviour `design/design-system` requires.
