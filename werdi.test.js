import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { belegt, erstelleWerdi, schneide } from "./index.js";

const A = (id, titel, paragraf, text, aenderung = false) => ({ id, titel, thema: "T", url: "https://x/y.pdf", aenderung, paragraf, ueberschrift: "", text });
const korpus = { stand: "2026-11-09", abschnitte: [
  A("h1", "Hundesteuersatzung", "§ 4", "Die Steuer beträgt für den ersten Hund 30,00 Euro im Kalenderjahr."),
  A("h2", "1. Änderung Hundesteuersatzung", "§ 4", "Für den ersten Hund beträgt die Steuer 45,00 Euro.", true),
  A("f1", "Friedhofssatzung", "§ 2", "Der Friedhof ist von Sonnenaufgang bis Sonnenuntergang geöffnet."),
]};
const modell = (content, status = 200, finish = "stop") => async () => new Response(JSON.stringify({ choices: [{ finish_reason: finish, message: { content } }] }), { status });
const frage = "Wie hoch ist die Hundesteuer?";
const mit = (f, models) => erstelleWerdi(korpus, { apiKey: "k", fetch: f, models });

test("schneide: Paragrafen, Verweise im Text bleiben im Abschnitt", () => {
  const t = schneide("Vorspann\n        § 1\n   Geltungsbereich\n(1) Text\n§ 5 Abs. 2 gilt auch.\n§ 2 Steuersatz\n(1) 30 Euro\n");
  assert.deepEqual(t.map((x) => [x.paragraf, x.ueberschrift]), [["§ 1", "Geltungsbereich"], ["§ 2", "Steuersatz"]]);
  assert.match(t[0].text, /§ 5 Abs\. 2 gilt/);
});
test("schneide: ohne Paragrafen je Seite", () => {
  assert.deepEqual(schneide("Seite eins\fSeite zwei").map((x) => x.paragraf), ["Seite 1", "Seite 2"]);
});
test("belegt: Zahlenformate und erfundene Betraege", () => {
  assert.ok(belegt("Das kostet 30 Euro", ["30,00 Euro"]));
  assert.ok(belegt("ab 19.06.2020 gilt § 4", ["§ 4 ab 19.06.2020"]));
  assert.ok(!belegt("Das kostet 35 Euro", ["30,00 Euro"]));
});
test("suche: Kompositum und neuere Aenderung zuerst", () => {
  assert.equal(erstelleWerdi(korpus).suche(frage)[0].id, "h2");
});
test("nicht enthalten: kein Modellaufruf", async () => {
  let n = 0;
  const r = await mit(async () => { n++; return new Response("{}"); }).frage("Wie wird morgen das Wetter?");
  assert.equal(r.status, "nicht_enthalten"); assert.equal(n, 0);
});
test("gueltige Antwort wird gezeigt", async () => {
  const r = await mit(modell('<think>x</think>{"antwort":"Der erste Hund kostet 45 Euro (§ 4).","belege":["h2"]}')).frage(frage);
  assert.equal(r.status, "antwort"); assert.deepEqual(r.belege.map((b) => b.id), ["h2"]);
});
test("erfundener Betrag wird verworfen", async () => {
  const r = await mit(modell('{"antwort":"Das kostet 99 Euro.","belege":["h2"]}')).frage(frage);
  assert.deepEqual([r.status, r.grund], ["fundstellen", "pruefung"]);
});
test("fremde id wird verworfen", async () => {
  const r = await mit(modell('{"antwort":"Das kostet 45 Euro.","belege":["f9"]}')).frage(frage);
  assert.deepEqual([r.status, r.grund], ["fundstellen", "pruefung"]);
});
test("bezahltes Modell: kein Aufruf", async () => {
  let n = 0;
  const r = await mit(async () => { n++; return new Response("{}"); }, ["openai/gpt-5"]).frage(frage);
  assert.deepEqual([r.status, r.grund, n], ["fundstellen", "aus", 0]);
});
test("429, Timeout, ungueltiges JSON, abgeschnitten, null", async () => {
  assert.equal((await mit(modell("", 429)).frage(frage)).grund, "limit");
  assert.equal((await mit(async () => { throw new DOMException("t", "TimeoutError"); }).frage(frage)).grund, "fehler");
  assert.equal((await mit(modell("kein json")).frage(frage)).grund, "modell");
  assert.equal((await mit(modell('{"antwort":"x","belege":["h2"]}', 200, "length")).frage(frage)).grund, "modell");
  assert.equal((await mit(modell('{"antwort":null,"belege":[]}')).frage(frage)).status, "nicht_enthalten");
});
test("Korpus: nichts Ausgeschlossenes enthalten", () => {
  const { abschnitte } = JSON.parse(readFileSync("korpus/werder-havel/korpus.json", "utf8"));
  const titel = new Set(abschnitte.map((a) => a.titel));
  for (const t of ["Haushalt 2026", "Doppelhaushalt 2024/2025", "Friedhofsgebührensatzung bis 18.06.2020"]) assert.ok(!titel.has(t), t);
  assert.ok(titel.has("Friedhofsgebührensatzung ab 19.06.2020"));
});
