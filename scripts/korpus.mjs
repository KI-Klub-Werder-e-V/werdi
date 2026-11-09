#!/usr/bin/env node
// Baut korpus.json und verzeichnis.json aus quellen.json. Braucht pdftotext (poppler-utils).
// Aufruf: node scripts/korpus.mjs korpus/werder-havel
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { schneide } from "../index.js";

const ordner = process.argv[2];
if (!ordner) throw new Error("Aufruf: node scripts/korpus.mjs <korpus-ordner>");
const quellen = JSON.parse(readFileSync(path.join(ordner, "quellen.json"), "utf8"));
const cache = path.join(ordner, ".cache");
mkdirSync(cache, { recursive: true });
const stand = new Date().toISOString().slice(0, 10);
const abschnitte = [], verzeichnis = [], ohneText = [], hashes = new Map();

for (const q of quellen) {
  if (q.ausgeschlossen) continue;
  const datei = path.join(cache, createHash("sha1").update(q.url).digest("hex") + ".pdf");
  if (!existsSync(datei)) {
    const res = await fetch(encodeURI(q.url), { headers: { "User-Agent": "werdi-korpus" } });
    if (!res.ok) throw new Error(`${res.status} ${q.url}`);
    writeFileSync(datei, Buffer.from(await res.arrayBuffer()));
  }
  const bytes = createHash("sha1").update(readFileSync(datei)).digest("hex");
  if (hashes.has(bytes)) { console.log(`Dublette: ${q.titel} = ${hashes.get(bytes)}`); continue; }
  hashes.set(bytes, q.titel);
  const text = execFileSync("pdftotext", ["-layout", datei, "-"], { encoding: "utf8", maxBuffer: 1 << 28 });
  // Scans ohne Textebene bleiben draussen: OCR-Fehler bei Betraegen waeren falsche Rechtsauskunft.
  if (text.split(/\s+/).filter(Boolean).length < 50) { ohneText.push(q.titel); continue; }
  const teile = schneide(text);
  const slug = q.titel.toLowerCase().replace(/[^a-z0-9äöüß]+/g, "-").replace(/^-|-$/g, "");
  teile.forEach((t, i) => abschnitte.push({
    id: `${slug}-${i + 1}`, titel: q.titel, thema: q.thema, url: q.url, aenderung: !!q.aenderung, ...t,
  }));
  verzeichnis.push({ titel: q.titel, thema: q.thema, url: q.url });
}
writeFileSync(path.join(ordner, "korpus.json"), JSON.stringify({ stand, abschnitte }));
writeFileSync(path.join(ordner, "verzeichnis.json"), JSON.stringify({ stand, quellen: verzeichnis, ohneText }, null, 1));
console.log(`${verzeichnis.length} Quellen, ${abschnitte.length} Abschnitte, ohne Textebene: ${ohneText.join("; ") || "keine"}`);
