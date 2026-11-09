# Werdi

Ein Assistent für Ortsrecht: PDFs einer Kommune rein, Antworten mit Paragraf und Quelle raus. Werdi läuft auf [ki-klub-werder.de/werdi](https://ki-klub-werder.de/werdi) für Werder (Havel).

Werdi ist eine Beta. Die Antworten erzeugt eine KI, sie dienen der Orientierung und sind keine Rechtsberatung.

## So arbeitet Werdi

1. Eine Volltextsuche (BM25) findet die passenden Paragrafen. Findet sie nichts, sagt Werdi das, ohne ein Modell aufzurufen.
2. Ein kostenloses Modell über OpenRouter formuliert daraus eine Antwort und nennt die genutzten Abschnitte.
3. Der Server prüft: Stammen die Abschnitte aus der Suche, und stehen alle Zahlen und Daten der Antwort im zitierten Text? Wenn nicht, zeigt Werdi nur die Fundstellen.

Fällt das Modell aus oder ist das Tageslimit erreicht, zeigt Werdi ebenfalls die Fundstellen.

**Datenschutz:** Werdi speichert keine Fragen. Die Frage geht mit den Satzungsauszügen an OpenRouter und den jeweiligen Modellanbieter; bei kostenlosen Modellen können Anbieter Eingaben speichern oder auswerten. Keine persönlichen Daten eingeben.

## Einbinden

```js
import { readFileSync } from "node:fs";
import { erstelleWerdi } from "werdi";

const korpus = JSON.parse(readFileSync("korpus/werder-havel/korpus.json", "utf8"));
const werdi = erstelleWerdi(korpus, { apiKey: process.env.OPENROUTER_API_KEY });
console.log(await werdi.frage("Wie hoch ist die Hundesteuer?"));
```

Nur Modelle mit `:free` werden aufgerufen. Lege am besten einen eigenen OpenRouter-Key mit Credit-Limit 0 $ an.

## Für deine Kommune

1. `korpus/<kommune>/quellen.json` anlegen: `titel`, `thema`, `url`; optional `aenderung: true` oder `ausgeschlossen: "Grund"`.
2. `node scripts/korpus.mjs korpus/<kommune>` ausführen (braucht `pdftotext`).
3. Die Ausgabe lesen: Scans ohne Textebene werden nicht aufgenommen, weil OCR-Fehler bei Beträgen falsche Auskünfte erzeugen.

Überholte Fassungen musst du selbst ausschließen. Prüfe den Korpus mit echten Fragen und geprüften Antworten, bevor du ihn veröffentlichst.

## Entwicklung

`npm test` (Node 20 oder neuer, keine Abhängigkeiten).

## Lizenz

AGPL-3.0. Amtliche Satzungen sind nach § 5 UrhG gemeinfrei.
