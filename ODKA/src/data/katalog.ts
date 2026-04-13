/**
 * Centrální katalog všech vlastních funkcí Add-inu ODKA.
 * 
 * Každá funkce je definována právě zde – pouze metadata.
 * Samotný kód každé funkce je ve vlastním souboru ve složce functions/.
 * Task Pane i Excel si funkce načítají automaticky z tohoto katalogu.
 * 
 * Jak přidat novou funkci:
 *   1. Přidej nový objekt do pole KATALOG níže
 *   2. Vytvoř nový soubor ve složce functions/ s kódem funkce
 */

// Skupiny funkcí podle zdroje dat – určují barvu kartičky v Task Pane
// zelena   = obecné funkce bez externích závislostí
// modra    = napojené na veřejné zdroje (web, ČNB...)
// oranzova = napojené na interní zdroje (firemní DB, servery...)
export type SkupinaFunkce = "zelena" | "modra" | "oranzova";

// Popis jednoho vstupního parametru funkce
export interface Parametr {
  nazev: string;
  typ: "text" | "datum" | "číslo";
  popis: string;
  priklad: string;
  povoleneHodnoty?: string; // nepovinné
}

// Metadata funkce – vše co se zobrazuje v Task Pane
export interface FunkceInfo {
  nazev: string;
  skupina: SkupinaFunkce;
  popis: string;                 // krátký popis pro seznam
  napoveda: string;              // dlouhý popis pro detail
  parametry: Parametr[];
  navratnaHodnota: string;
  priklad: string;
  omezeni?: string;              // nepovinné
  souvisejiciFunkce?: string[];  // nepovinné
}

export const KATALOG: FunkceInfo[] = [

  {
    nazev: "KURZ_CNB",
    skupina: "modra",
    popis: "Kurz ČNB pro danou měnu a datum",
    napoveda: "Vrátí denní kurz České národní banky pro zadanou měnu a datum. Pokrývá historii od roku 1993.",
    navratnaHodnota: "Číslo – kurz měny vůči české koruně",
    omezeni: "Dostupné pouze pro pracovní dny. Víkendy a svátky kurz ČNB nevyhlašuje.",
    parametry: [
      {
        nazev: "měna",
        typ: "text",
        popis: "Kód měny ve formátu ČNB",
        priklad: "EUR",
        povoleneHodnoty: "EUR, USD, GBP, CHF, JPY a další měny vyhlašované ČNB"
      },
      {
        nazev: "datum",
        typ: "datum",
        popis: "Datum ve formátu DD.MM.RRRR nebo odkaz na buňku s datem",
        priklad: "01.01.2024"
      }
    ],
    priklad: '=ODKA.KURZ_CNB("EUR"; A1)'
  }

];