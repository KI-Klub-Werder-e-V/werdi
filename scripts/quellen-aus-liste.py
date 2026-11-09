#!/usr/bin/env python3
"""Einmalig: erzeugt quellen.json aus der gespeicherten Satzungsseite. Danach wird die Datei von Hand gepflegt."""
import html, json, re, sys
AUS = {  # Titel: Grund
  "Haushalt 2026": "kein Ortsrecht fuer Buerger", "Doppelhaushalt 2024/2025": "kein Ortsrecht fuer Buerger",
  "Gestaltfibel zur Gestaltungssatzung": "Erlaeuterung, keine Satzung",
  "Friedhofsgebührensatzung bis 18.06.2020": "ueberholte Fassung",
  "Festsetzung der Grundsteuer und Hundesteuer 2024": "ueberholt durch Festsetzung 2025",
  "Änderung der Kurbeitragssatzung": "in Lesefassung ab 2025 enthalten",
}
THEMEN = {"Allgemeine Verwaltung","Recht, Sicherheit und Ordnung","Schule, Kita und Soziales","Fremdenverkehr, Kultur und Sport","Bau- und Wohnungswesen","Straßen und Wasser","Finanzen und Steuern"}
s = open(sys.argv[1], encoding="utf8", errors="replace").read()
thema, out, seen = None, [], set()
for m in re.finditer(r'<h[1-4][^>]*>((?:(?!<a |</h).)*)</h[1-4]>|<a [^>]*href="([^"]+\.pdf)"[^>]*>(.*?)</a>', s, re.S | re.I):
    txt = lambda v: re.sub(r"\s+", " ", html.unescape(re.sub(r"<[^>]+>", " ", v))).strip()
    if m[1] is not None:
        thema = txt(m[1]) if txt(m[1]) in THEMEN else thema; continue
    url = "https://www.werder-havel.de" + html.unescape(m[2]) if m[2].startswith("/") else html.unescape(m[2]); titel = txt(m[3])
    if url in seen or not titel: continue
    seen.add(url)
    q = {"titel": titel, "thema": thema, "url": url}
    if titel in AUS: q["ausgeschlossen"] = AUS[titel]
    if titel.startswith("1. Änderung"): q["aenderung"] = True
    out.append(q)
json.dump(out, open(sys.argv[2], "w", encoding="utf8"), ensure_ascii=False, indent=1)
print(len(out))
