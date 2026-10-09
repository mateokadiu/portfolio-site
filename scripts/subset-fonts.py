#!/usr/bin/env python3
"""Subset the self-hosted woff2 fonts to the glyphs the site can render.

Geist / Geist Mono / JetBrains Mono ship Greek, Cyrillic, Vietnamese and other
glyphs the site never uses. Dropping them shrinks every font ~40-55%, which
matters because the fonts are the largest requests on first load.

Kept: Latin + Latin-1 + Latin Extended-A (European names), general
punctuation, currency, arrows, math operators, technical symbols, box drawing
(ASCII architecture diagrams in the case studies), block elements, geometric
shapes and dingbats (✓ ✘), plus all OpenType layout features (kerning,
ligatures).

Usage (needs `pip install fonttools brotli`):
    python3 scripts/subset-fonts.py <source-dir> public/fonts

<source-dir> must contain the full upstream fonts — subsetting is lossy, so
never use an already-subset copy as the source. The originals are in git at
commit 4a8f443 (`git show 4a8f443:public/fonts/<file> > <source-dir>/<file>`)
or in the upstream Geist / JetBrains Mono releases (both SIL OFL 1.1).
"""

import sys
from pathlib import Path

from fontTools import subset

UNICODE_RANGES = [
    (0x0020, 0x007E),  # Basic Latin
    (0x00A0, 0x00FF),  # Latin-1 Supplement
    (0x0100, 0x017F),  # Latin Extended-A
    (0x0131, 0x0131),
    (0x0152, 0x0153),
    (0x02BB, 0x02BC),
    (0x02C6, 0x02C6),
    (0x02DA, 0x02DA),
    (0x02DC, 0x02DC),
    (0x0304, 0x0304),
    (0x0308, 0x0308),
    (0x0329, 0x0329),
    (0x03A3, 0x03A3),  # Σ (tax-ledger demo)
    (0x2000, 0x206F),  # General Punctuation
    (0x2070, 0x209F),  # Superscripts / subscripts
    (0x20A0, 0x20CF),  # Currency
    (0x2100, 0x214F),  # Letterlike (™ etc.)
    (0x2190, 0x21FF),  # Arrows
    (0x2200, 0x22FF),  # Math operators
    (0x2300, 0x23FF),  # Misc technical (⏸)
    (0x2500, 0x257F),  # Box drawing
    (0x2580, 0x259F),  # Block elements
    (0x25A0, 0x25FF),  # Geometric shapes
    (0x2700, 0x27BF),  # Dingbats (✓ ✘)
    (0x27F0, 0x27FF),  # Supplemental arrows (⟳)
    (0xFEFF, 0xFEFF),
    (0xFFFD, 0xFFFD),
]


def main() -> None:
    if len(sys.argv) != 3:
        sys.exit(__doc__)
    src, out = Path(sys.argv[1]), Path(sys.argv[2])
    unicodes = [cp for lo, hi in UNICODE_RANGES for cp in range(lo, hi + 1)]

    options = subset.Options()
    options.flavor = 'woff2'
    options.layout_features = ['*']
    options.name_IDs = ['*']
    options.notdef_outline = True

    for font_path in sorted(src.glob('*.woff2')):
        font = subset.load_font(str(font_path), options)
        subsetter = subset.Subsetter(options)
        subsetter.populate(unicodes=unicodes)
        subsetter.subset(font)
        target = out / font_path.name
        subset.save_font(font, str(target), options)
        before, after = font_path.stat().st_size, target.stat().st_size
        print(f'{font_path.name}: {before // 1024} KB -> {after // 1024} KB')


if __name__ == '__main__':
    main()
