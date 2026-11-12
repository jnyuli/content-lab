#!/usr/bin/env python3
"""Build the Content Lab site (member pages + archive index).

  python3 build.py            # every edition in data/ + index
  python3 build.py 2026-11-02 # one edition + index

data/<slug>.json is the v3 edition file. Member pages render only ideas with status "approved"
(or, when the edition has "preview": true, the ideas carrying a preview_rank). Only editions with
"published": true in data/editions.json appear on the archive index.
"""
import json, sys, html, pathlib
ROOT = pathlib.Path(__file__).resolve().parent; DATA, TPL, OUT = ROOT / "data", ROOT / "template", ROOT / "editions"
def load(p): return json.loads(p.read_text())
def build_edition(slug):
    e = load(DATA / f"{slug}.json"); tpl = (TPL / "edition.html").read_text()
    page = (tpl.replace("{{TITLE}}", html.escape(e.get("title", slug))).replace("{{DESCRIPTION}}", html.escape(e.get("lede", "")))
               .replace("{{DATA}}", json.dumps(e, ensure_ascii=False).replace("</", "<\\/")))
    d = OUT / slug; d.mkdir(parents=True, exist_ok=True); (d / "index.html").write_text(page)
    shown = [i for i in e.get("ideas", []) if (e.get("preview") and i.get("preview_rank")) or i.get("status") == "approved"]
    return e, shown
def build_index():
    idx = load(DATA / "editions.json") if (DATA / "editions.json").exists() else []
    pub = sorted([x for x in idx if x.get("published")], key=lambda x: x["slug"], reverse=True)
    cards = "".join(f'<a href="editions/{x["slug"]}/"><div class="d">{html.escape(x.get("week_label", x["slug"]))}</div><h3>{html.escape(x.get("title", ""))}</h3><p>{html.escape(x.get("blurb", ""))}</p></a>' for x in pub) or '<p class="lede">The first edition is coming soon.</p>'
    (ROOT / "index.html").write_text((TPL / "index.html").read_text().replace("{{EDITIONS}}", cards)); return len(pub)
if __name__ == "__main__":
    slugs = sys.argv[1:] or sorted(p.stem for p in DATA.glob("*.json") if p.stem != "editions")
    for s in slugs:
        e, shown = build_edition(s); print("built", s, "-", len(shown), "ideas shown of", len(e.get("ideas", [])))
    print("index:", build_index(), "published edition(s)")
