// Regenerates data/airports.json and data/airlines.json from upstream
// public datasets. Run manually when a refresh is wanted:
//
//   node scripts/fetch-static-data.js
//
// Sources:
//   Airports — OurAirports (public domain)
//     https://davidmegginson.github.io/ourairports-data/airports.csv
//   Airlines — OpenFlights (ODbL, attribution required)
//     https://raw.githubusercontent.com/jpatokal/openflights/master/data/airlines.dat

const fs = require("fs");
const path = require("path");
const https = require("https");

const OUT_DIR = path.join(__dirname, "..", "data");
const AIRPORTS_URL = "https://davidmegginson.github.io/ourairports-data/airports.csv";
const AIRLINES_URL = "https://raw.githubusercontent.com/jpatokal/openflights/master/data/airlines.dat";

function fetch(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      if (res.statusCode !== 200) {
        reject(new Error("HTTP " + res.statusCode + " for " + url));
        return;
      }
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => resolve(data));
    }).on("error", reject);
  });
}

function parseCsvLine(line) {
  const fields = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"' && line[i + 1] === '"') {
        current += '"';
        i++;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        current += ch;
      }
    } else {
      if (ch === '"') inQuotes = true;
      else if (ch === ",") {
        fields.push(current);
        current = "";
      } else current += ch;
    }
  }
  fields.push(current);
  return fields;
}

async function fetchAirports() {
  console.log("Fetching airports from OurAirports...");
  const csv = await fetch(AIRPORTS_URL);
  const lines = csv.split("\n");
  const header = parseCsvLine(lines[0]);
  const iataIdx = header.indexOf("iata_code");
  const nameIdx = header.indexOf("name");
  const cityIdx = header.indexOf("municipality");
  const countryIdx = header.indexOf("iso_country");
  const typeIdx = header.indexOf("type");
  const latIdx = header.indexOf("latitude_deg");
  const lonIdx = header.indexOf("longitude_deg");

  const items = [];
  for (let i = 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue;
    const f = parseCsvLine(lines[i]);
    const iata = f[iataIdx];
    if (!iata || iata.length !== 3) continue;
    if (f[typeIdx] !== "large_airport" && f[typeIdx] !== "medium_airport") continue;
    items.push({
      iata: iata,
      name: f[nameIdx],
      city: f[cityIdx] || "",
      country: f[countryIdx] || "",
      lat: parseFloat(f[latIdx]) || null,
      lon: parseFloat(f[lonIdx]) || null,
    });
  }

  const out = {
    _generated: true,
    _generatedAt: new Date().toISOString(),
    _source: "OurAirports",
    _license: "public-domain",
    items: items,
  };
  fs.writeFileSync(path.join(OUT_DIR, "airports.json"), JSON.stringify(out, null, 2));
  console.log("  Wrote " + items.length + " airports");
}

async function fetchAirlines() {
  console.log("Fetching airlines from OpenFlights...");
  const dat = await fetch(AIRLINES_URL);
  const lines = dat.split("\n");
  const items = [];
  for (const line of lines) {
    if (!line.trim() || line.startsWith("#")) continue;
    const f = line.split(",");
    if (f.length < 8) continue;
    const name = (f[1] || "").replace(/^"|"$/g, "");
    const iata = (f[3] || "").replace(/^"|"$/g, "");
    const icao = (f[4] || "").replace(/^"|"$/g, "");
    const country = (f[6] || "").replace(/^"|"$/g, "");
    const active = (f[7] || "").trim();
    if (active !== "Y") continue;
    if (!iata && !icao) continue;
    items.push({ iata: iata, icao: icao, name: name, country: country });
  }

  const out = {
    _generated: true,
    _generatedAt: new Date().toISOString(),
    _source: "OpenFlights",
    _license: "ODbL",
    items: items,
  };
  fs.writeFileSync(path.join(OUT_DIR, "airlines.json"), JSON.stringify(out, null, 2));
  console.log("  Wrote " + items.length + " airlines");
}

async function run() {
  try {
    await fetchAirports();
    await fetchAirlines();
    console.log("Done.");
  } catch (err) {
    console.error("Failed:", err.message);
    console.error("Static data files remain unchanged.");
    process.exit(1);
  }
}

run();
