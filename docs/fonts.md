# Self-hosting and subsetting the type

Open Sim Lab ships two variable families: **Open Sim Lab Inter**, an OFL-compliant
renamed subset of Inter, for interface text and numerics; and **JetBrains Mono** for
the event log and tabular code. Both are served from `/fonts`, preloaded by every
page, and included in the offline precache. No font service or other foreign origin
is used.

The committed Latin subsets total **86.2 KB compressed** against the 120 KB budget.
`npm run fonts` verifies their WOFF2 signatures, licenses, presence, and size. The
generated declarations are in `src/platform/tokens/fonts.generated.css` and retain
system fallback stacks for non-Latin text and load failures.

## Provenance

| Family | Upstream release and input | Source SHA-256 | Committed output SHA-256 |
| --- | --- | --- | --- |
| Open Sim Lab Inter | `rsms/inter` v4.1, `Inter-4.1.zip` → `InterVariable.ttf` | Archive `9883fdd4a49d4fb66bd8177ba6625ef9a64aa45899767dde3d36aa425756b11e`; TTF `4989b125924991b90d05b2d16e0e388c48f7d5bb8b30539bbf9c755278d0ccaf` | `7dfb5ab2e136df8836db217661ed52d35dadfad389866e8291e9e3cb9dbac556` |
| JetBrains Mono | `JetBrains/JetBrainsMono` v2.304, `JetBrainsMono-2.304.zip` → `fonts/variable/JetBrainsMono[wght].ttf` | Archive `6f6376c6ed2960ea8a963cd7387ec9d76e3f629125bc33d1fdcd7eb7012f7bbf`; TTF `662a196d58f1183bf2d77428b6d5283fe3f45161ab021bea4036bc98e5cac016` | `26f4a0765a0e74540276a94e0e817892f27f39b4ed63e4926ccdc74caddb3bc3` |

The pinned release archives came from each project's official GitHub release. The
subsets were produced with FontTools 4.60.2 and Brotli 1.2.0. Inspection with
FontTools confirmed that both outputs remain variable on `wght`: Inter covers
400–700 and JetBrains Mono covers 400–600. Inter's optical-size axis is fixed at its
14 pt default to keep the shipped subset inside the transfer budget.

Both upstream license files are committed unchanged as `public/fonts/inter-OFL.txt`
and `public/fonts/jetbrains-mono-OFL.txt`. Inter's v4.1 README identifies "Inter" as
a Reserved Font Name, so the modified subset's internal family and PostScript names
are changed to Open Sim Lab Inter. JetBrains Mono's pinned materials declare no
Reserved Font Name. The font files remain under the SIL Open Font License 1.1; the
repository's MIT license does not replace it.

## Rebuild procedure

Download the pinned release archives above, verify their SHA-256 hashes, extract the
named TTF inputs and license files, then run:

```sh
python -m fontTools.varLib.instancer InterVariable.ttf \
  wght=400:400:700 opsz=14 --no-recalc-timestamp \
  --output Inter-limited.ttf

python -m fontTools.varLib.instancer 'JetBrainsMono[wght].ttf' \
  wght=400:400:600 --no-recalc-timestamp \
  --output JetBrainsMono-limited.ttf

pyftsubset Inter-limited.ttf \
  --output-file=inter-subset.woff2 \
  --flavor=woff2 \
  --layout-features='*' \
  --unicodes='U+0000-00FF,U+0100-017F,U+0131,U+0152-0153,U+02BB-02BC,U+2000-206F,U+2070-209F,U+20A0-20BF,U+2122,U+2190-2193,U+2212'

pyftsubset JetBrainsMono-limited.ttf \
  --output-file=public/fonts/jetbrains-mono-latin.woff2 \
  --flavor=woff2 \
  --layout-features='*' \
  --unicodes='U+0000-00FF,U+2000-206F,U+2070-209F,U+2190-2193,U+2212'
```

Rename the modified Inter subset before distributing it:

```python
from fontTools.ttLib import TTFont

font = TTFont('inter-subset.woff2', recalcTimestamp=False)
names = {
    1: 'Open Sim Lab Inter',
    3: '4.001;git-9221beed3;OSL;OSLInter-Regular',
    4: 'Open Sim Lab Inter',
    6: 'OSLInter',
}
for record in font['name'].names:
    if record.nameID in names:
        record.string = names[record.nameID].encode(record.getEncoding())
font.save('public/fonts/open-sim-lab-inter-latin.woff2', reorderTables=None)
```

Copy the pinned license texts to the distinct filenames above, run `npm run tokens`,
then run `npm run fonts` and `npm run ci`. The output hashes must match the provenance
table unless an intentional font update changes this document and the acceptance test
together.

## Why these ranges

The interface needs Basic Latin, Latin-1 Supplement and Latin Extended-A, plus general
punctuation, arrows, the minus sign, subscript digits in `SpO₂` and `EtCO₂`, and the
micro sign in `µg/mL`. JetBrains Mono includes the clinical symbols that can appear in
the event log. A script outside these ranges uses the platform fallback with no invisible
text, as required by `design/design-system`.
