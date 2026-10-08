#!/usr/bin/env python3
"""Build the Club Stylist Content Lab site.

  python3 build.py            # rebuild every edition in data/ + the library index
  python3 build.py 2026-10-13 # rebuild one edition + the index

Each data/<slug>.json becomes editions/<slug>/index.html (template/edition.html with
the JSON injected). data/editions.json lists published editions for the library page.
Only editions listed in data/editions.json with "published": true appear on the index;
drafts can be built and previewed locally without being linked.
"""
import json, sys, html, pathlib, datetime as dt

ROOT = pathlib.Path(__file__).resolve().parent
DATA, TPL, OUT = ROOT / "data", ROOT / "template", ROOT / "editions"

def load(p): return json.loads(p.read_text())

def build_edition(slug):
    e = load(DATA / f"{slug}.json")
    tpl = (TPL / "edition.html").read_text()
    data = json.dumps(e, ensure_ascii=False).replace("</", "<\\/")
    page = (tpl.replace("{{TITLE}}", html.escape(e.get("title", slug)))
               .replace("{{DESCRIPTION}}", html.escape(e.get("lede", "")))
               .replace("{{RESEARCHED}}", html.escape(e.get("researched", e.get("date", ""))))
               .replace("{{DATA}}", data))
    d = OUT / slug; d.mkdir(parents=True, exist_ok=True)
    (d / "index.html").write_text(page)
    return e

def build_index():
    idx = load(DATA / "editions.json") if (DATA / "editions.json").exists() else []
    pub = [x for x in idx if x.get("published")]
    pub.sort(key=lambda x: x["slug"], reverse=True)
    cards = []
    for i, x in enumerate(pub):
        cards.append(f'<a href="editions/{x["slug"]}/" class="{"latest" if i == 0 else ""}"><div class="d">{html.escape(x.get("week_label", x["slug"]))}{" · Latest" if i == 0 else ""}</div><h3>{html.escape(x.get("title", ""))}</h3><p>{html.escape(x.get("blurb", ""))}</p></a>')
    body = "".join(cards) or '<p class="note">The first edition lands Monday.</p>'
    page = (TPL / "index.html").read_text().replace("{{EDITIONS}}", body).replace("{{COUNT}}", str(len(pub)))
    (ROOT / "index.html").write_text(page)
    return len(pub)

if __name__ == "__main__":
    slugs = sys.argv[1:] or sorted(p.stem for p in DATA.glob("*.json") if p.stem != "editions")
    for s in slugs:
        e = build_edition(s); print("built", s, "-", len(e.get("ideas", [])), "ideas")
    print("index:", build_index(), "published edition(s)")
