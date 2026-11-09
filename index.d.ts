export interface Abschnitt { id: string; titel: string; thema: string; url: string; aenderung: boolean; paragraf: string; ueberschrift: string; text: string }
export interface Korpus { stand: string; abschnitte: Abschnitt[] }
export interface Beleg { id: string; titel: string; paragraf: string; ueberschrift: string; auszug: string; url: string }
export type Ergebnis =
  | { status: "antwort"; antwort: string; belege: Beleg[] }
  | { status: "fundstellen"; grund: "aus" | "limit" | "fehler" | "pruefung" | "modell"; belege: Beleg[] }
  | { status: "nicht_enthalten"; belege: [] };
export interface Optionen { apiKey?: string; models?: string[]; fetch?: typeof fetch; referer?: string; titel?: string }
export const STANDARD_MODELLE: string[];
export function schneide(text: string): Pick<Abschnitt, "paragraf" | "ueberschrift" | "text">[];
export function belegt(antwort: string, texte: string[]): boolean;
export function erstelleWerdi(korpus: Korpus, optionen?: Optionen): { suche(frage: string, k?: number): Abschnitt[]; frage(frage: string): Promise<Ergebnis> };
