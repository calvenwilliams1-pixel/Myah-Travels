// Regenerates data/airports.json and data/airlines.json from upstream
// public datasets. Run manually when a refresh is wanted:
//
//   node scripts/fetch-static-data.js
//
// Sources:
//   Airports — OurAirports (public domain), the base list: every large and
//     medium airport with an IATA code.
//     https://davidmegginson.github.io/ourairports-data/airports.csv
//   Timezones — OpenFlights airports.dat carries a proper IANA "Tz database
//     time zone" per airport; matched by IATA code. Where OpenFlights has
//     no entry, the timezone is derived from the airport's coordinates
//     with tz-lookup (a devDependency, used only at generation time).
//     Timezones already present in the committed airports.json (the
//     hand-checked starter set) always win over both.
//   Airlines — OpenFlights (ODbL, attribution required), filtered to
//     active carriers with an IATA code, merged with the airlines already
//     in the committed airlines.json so hand-curated entries survive a
//     regeneration.
//     https://raw.githubusercontent.com/jpatokal/openflights/master/data/airlines.dat
//     https://raw.githubusercontent.com/jpatokal/openflights/master/data/airports.dat

const fs = require("fs");
const path = require("path");
const https = require("https");

const OUT_DIR = path.join(__dirname, "..", "data");
const AIRPORTS_URL = "https://davidmegginson.github.io/ourairports-data/airports.csv";
const AIRLINES_URL = "https://raw.githubusercontent.com/jpatokal/openflights/master/data/airlines.dat";
const OPENFLIGHTS_AIRPORTS_URL = "https://raw.githubusercontent.com/jpatokal/openflights/master/data/airports.dat";

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

// Offline/reproducible runs: set STATIC_SRC_DIR to a folder holding
// airports.csv, airlines.dat and airports.dat downloaded beforehand,
// and those copies are used instead of the network.
const SRC_DIR = process.env.STATIC_SRC_DIR || null;
function fetchSource(url, filename) {
  if (SRC_DIR) {
    return Promise.resolve(fs.readFileSync(path.join(SRC_DIR, filename), "utf8"));
  }
  return fetch(url);
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

function readExistingItems(filename) {
  try {
    const raw = fs.readFileSync(path.join(OUT_DIR, filename), "utf8");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed.items) ? parsed.items : [];
  } catch {
    return [];
  }
}

function cleanField(value) {
  return (value || "").replace(/^"|"$/g, "").trim();
}

function isNullToken(value) {
  return !value || value === "\\N" || value === "-";
}

async function fetchAirports() {
  console.log("Fetching airports from OurAirports...");
  const csv = await fetchSource(AIRPORTS_URL, "airports.csv");
  const lines = csv.split("\n");
  const header = parseCsvLine(lines[0]);
  const iataIdx = header.indexOf("iata_code");
  const nameIdx = header.indexOf("name");
  const cityIdx = header.indexOf("municipality");
  const countryIdx = header.indexOf("iso_country");
  const typeIdx = header.indexOf("type");
  const latIdx = header.indexOf("latitude_deg");
  const lonIdx = header.indexOf("longitude_deg");

  // Timezone by IATA from OpenFlights (proper IANA names).
  console.log("Fetching airport timezones from OpenFlights...");
  const ofTzByIata = new Map();
  const ofDat = await fetchSource(OPENFLIGHTS_AIRPORTS_URL, "airports.dat");
  for (const line of ofDat.split("\n")) {
    if (!line.trim()) continue;
    const f = parseCsvLine(line);
    const iata = cleanField(f[4]);
    const tz = cleanField(f[11]);
    if (iata && iata.length === 3 && !isNullToken(tz) && !ofTzByIata.has(iata)) {
      ofTzByIata.set(iata, tz);
    }
  }
  console.log("  OpenFlights timezones for " + ofTzByIata.size + " IATA codes");

  // Timezones already in the committed file win over both sources.
  const existingTzByIata = new Map();
  for (const a of readExistingItems("airports.json")) {
    if (a.iata && a.timezone) existingTzByIata.set(a.iata, a.timezone);
  }

  let tzLookup = null;
  try {
    tzLookup = require("tz-lookup");
  } catch {
    console.warn("  tz-lookup not installed; coordinate fallback skipped (npm i -D tz-lookup)");
  }

  const byIata = new Map();
  for (let i = 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue;
    const f = parseCsvLine(lines[i]);
    const iata = f[iataIdx];
    if (!iata || iata.length !== 3) continue;
    const type = f[typeIdx];
    if (type !== "large_airport" && type !== "medium_airport") continue;
    const lat = parseFloat(f[latIdx]);
    const lon = parseFloat(f[lonIdx]);
    const item = {
      iata: iata,
      name: f[nameIdx],
      city: f[cityIdx] || "",
      country: f[countryIdx] || "",
      lat: Number.isFinite(lat) ? lat : null,
      lon: Number.isFinite(lon) ? lon : null,
    };
    let tz = existingTzByIata.get(iata) || ofTzByIata.get(iata) || null;
    if (!tz && tzLookup && item.lat !== null && item.lon !== null) {
      try {
        tz = tzLookup(item.lat, item.lon);
      } catch {
        tz = null;
      }
    }
    if (tz) item.timezone = tz;
    const prev = byIata.get(iata);
    if (!prev || (prev._type !== "large_airport" && type === "large_airport")) {
      byIata.set(iata, { ...item, _type: type });
    }
  }

  const items = [...byIata.values()]
    .map(({ _type, ...rest }) => rest)
    .sort((a, b) => a.iata.localeCompare(b.iata));
  const withTz = items.filter((a) => a.timezone).length;

  const out = {
    _generated: true,
    _generatedAt: new Date().toISOString(),
    _source: "OurAirports (airports) + OpenFlights / tz-lookup (timezones)",
    _license: "public-domain",
    items: items,
  };
  fs.writeFileSync(path.join(OUT_DIR, "airports.json"), JSON.stringify(out, null, 2));
  console.log("  Wrote " + items.length + " airports (" + withTz + " with timezone)");
}

async function fetchAirlines() {
  console.log("Fetching airlines from OpenFlights...");
  const dat = await fetchSource(AIRLINES_URL, "airlines.dat");
  const byIata = new Map();
  for (const line of dat.split("\n")) {
    if (!line.trim() || line.startsWith("#")) continue;
    const f = parseCsvLine(line);
    if (f.length < 8) continue;
    const name = cleanField(f[1]);
    const iata = cleanField(f[3]);
    const icao = cleanField(f[4]);
    const country = cleanField(f[6]);
    const active = cleanField(f[7]);
    if (active !== "Y") continue;
    if (isNullToken(iata) || iata.length !== 2) continue;
    if (!byIata.has(iata)) {
      byIata.set(iata, { iata: iata, icao: isNullToken(icao) ? "" : icao, name: name, country: country });
    }
  }

  // Hand-curated entries already in the committed file win / fill gaps.
  let curated = 0;
  for (const a of readExistingItems("airlines.json")) {
    if (a.iata && !byIata.has(a.iata)) curated++;
    if (a.iata) byIata.set(a.iata, { iata: a.iata, icao: a.icao || "", name: a.name, country: a.country || "" });
  }

  const items = [...byIata.values()].sort((a, b) => a.name.localeCompare(b.name));
  const out = {
    _generated: true,
    _generatedAt: new Date().toISOString(),
    _source: "OpenFlights",
    _license: "ODbL",
    items: items,
  };
  fs.writeFileSync(path.join(OUT_DIR, "airlines.json"), JSON.stringify(out, null, 2));
  console.log("  Wrote " + items.length + " airlines (" + curated + " curated entries added)");
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
