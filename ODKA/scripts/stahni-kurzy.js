/**
 * stahni-kurzy.js
 * 
 * Pomocný skript pro GitHub Actions.
 * Stáhne historické kurzy ČNB přes oficiální API od roku 1993 do dnes.
 * Pokud kurzy.json již existuje, přidá pouze chybějící data.
 * 
 * Spouštění: node scripts/stahni-kurzy.js
 * ČNB API dokumentace: https://api.cnb.cz/
 */

const https = require("https");
const fs = require("fs");
const path = require("path");

// Cesta k výstupnímu souboru
const VYSTUP = path.join(__dirname, "..", "assets", "kurzy.json");

// Stáhne JSON z dané URL a vrátí ho jako JavaScriptový objekt
function fetchJson(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = "";
      res.on("data", chunk => data += chunk);
      res.on("end", () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(new Error(`Nepodařilo se zpracovat odpověď z API: ${e.message}`));
        }
      });
    }).on("error", reject);
  });
}

// Stáhne kurzy pro konkrétní datum přes ČNB API
// Vrátí objekt { "EUR": 24.38, "USD": 22.15, ... } nebo null pokud API nic nevrátilo
async function stahniDen(datum) {
  const url = `https://api.cnb.cz/cnbapi/exrates/daily?date=${datum}`;
  const data = await fetchJson(url);

  if (!data.rates || data.rates.length === 0) return null;

  const kurzy = {};
  for (const rate of data.rates) {
    // Přepočet na kurz za 1 jednotku měny, zaokrouhlení na 10 desetinných míst
    kurzy[rate.currencyCode] = Math.round((rate.rate / rate.amount) * 10000000000) / 10000000000;
  }

  return kurzy;
}

// Vygeneruje seznam všech pracovních dní v daném roce
// Svátky nevíme dopředu – přeskočí je API samo (vrátí null)
function generujPracovniDny(rok) {
  const datumy = [];
  const start = new Date(`${rok}-01-01`);
  const konec = rok === new Date().getFullYear()
    ? new Date()
    : new Date(`${rok}-12-31`);

  const d = new Date(start);
  while (d <= konec) {
    const denVTydnu = d.getDay();
    // Přeskočit víkendy (0 = neděle, 6 = sobota)
    if (denVTydnu !== 0 && denVTydnu !== 6) {
      datumy.push(d.toISOString().split("T")[0]); // formát YYYY-MM-DD
    }
    d.setDate(d.getDate() + 1);
  }

  return datumy;
}

async function main() {
  // Načti existující data pokud soubor již existuje
  let existujiciData = {};
  if (fs.existsSync(VYSTUP)) {
    existujiciData = JSON.parse(fs.readFileSync(VYSTUP, "utf8"));
    console.log(`Načteno ${Object.keys(existujiciData).length} existujících záznamů.`);
  }

  const aktualniRok = new Date().getFullYear();
  let novychZaznamu = 0;
  let chyb = 0;

  for (let rok = 1993; rok <= aktualniRok; rok++) {
    const pracovniDny = generujPracovniDny(rok);
    const chybejici = pracovniDny.filter(d => !existujiciData[d]);

    if (chybejici.length === 0) {
      console.log(`Rok ${rok}: vše již staženo, přeskakuji.`);
      continue;
    }

    console.log(`Rok ${rok}: stahuji ${chybejici.length} chybějících dní...`);

    for (const datum of chybejici) {
      try {
        const kurzy = await stahniDen(datum);

        if (kurzy) {
          // Kurzy nalezeny – uložíme je
          existujiciData[datum] = kurzy;
          novychZaznamu++;
        } else {
          // API nic nevrátilo – pravděpodobně svátek, přeskočíme
          console.log(`  ${datum}: žádné kurzy (svátek nebo nepracovní den)`);
        }

        // Krátká pauza aby jsme nezahltili ČNB API
        await new Promise(r => setTimeout(r, 100));

      } catch (err) {
        console.error(`  Chyba pro ${datum}: ${err.message}`);
        chyb++;
      }
    }
  }

  // Ulož výsledek do kurzy.json
  fs.writeFileSync(VYSTUP, JSON.stringify(existujiciData));
  console.log(`Hotovo! Přidáno ${novychZaznamu} nových záznamů. Chyb: ${chyb}. Celkem: ${Object.keys(existujiciData).length} dní.`);
}

main();