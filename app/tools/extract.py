"""Extract per-page text from the harvested ELE3001 resources.

Output: content-src/extracted/<folder>/<file>.jsonl, one {"page", "text"} object per line,
so every authored block can cite doc + page. Run from the app/ directory:

    python tools/extract.py [substring-filter]
"""
import json
import pathlib
import sys

import pymupdf

RES = pathlib.Path(__file__).resolve().parents[2] / "Resources" / "Electromagnetics"
OUT = pathlib.Path(__file__).resolve().parents[1] / "content-src" / "extracted"
SKIP = {"10_Math_Refresher_Videos (L6 Pure Math)"}

def main() -> None:
    needle = sys.argv[1].lower() if len(sys.argv) > 1 else ""
    for pdf in sorted(RES.rglob("*.pdf")):
        if pdf.parent.name in SKIP or needle not in str(pdf).lower():
            continue
        dest = OUT / pdf.parent.name / (pdf.stem + ".jsonl")
        if dest.exists():
            continue
        dest.parent.mkdir(parents=True, exist_ok=True)
        with pymupdf.open(pdf) as doc, dest.open("w", encoding="utf-8") as f:
            pages = doc.page_count
            for i in range(pages):
                f.write(json.dumps({"page": i + 1, "text": doc[i].get_text()}, ensure_ascii=False) + "\n")
        print(f"{dest.relative_to(OUT)}  ({pages} pages)")

if __name__ == "__main__":
    main()
