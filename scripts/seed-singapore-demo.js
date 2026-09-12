// One-off seed script: creates a demo portal + populates a Singapore itinerary.
// Uses lib/itineraries repository functions so it exercises the whole stack.
// Run: node scripts/seed-singapore-demo.js
// Safe to rerun: checks for existing portal by slug first.

const Database = require("better-sqlite3");
const path = require("path");

const dbPath = path.join(__dirname, "..", "data", "site.db");
const db = new Database(dbPath);

function generateId() {
  return require("crypto").randomUUID();
}

function run() {
  console.log("Seeding Singapore demo itinerary...");

  // ─── 1. Create or fetch the demo portal ───
  let portal = db
    .prepare("SELECT * FROM portals WHERE slug = ?")
    .get("singapore-demo");

  if (!portal) {
    const result = db
      .prepare(
        `INSERT INTO portals (name, slug, departure_date, return_date, hero_title, hero_subtitle, hero_preset, is_active, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, 1, CURRENT_TIMESTAMP)`
      )
      .run(
        "Singapore Demo",
        "singapore-demo",
        "2026-10-16",
        "2026-10-18",
        "Singapore · 3-Day Journey",
        "October 16 – 18, 2026",
        "tropical"
      );
    portal = db
      .prepare("SELECT * FROM portals WHERE id = ?")
      .get(result.lastInsertRowid);
    console.log("  ✓ Created portal:", portal.name, "(id " + portal.id + ")");
  } else {
    console.log("  • Portal already exists:", portal.name, "(id " + portal.id + ")");
  }

  // ─── 2. Delete any existing demo itinerary for this portal ───
  const existingItineraries = db
    .prepare("SELECT id FROM itineraries WHERE portal_id = ?")
    .all(portal.id);

  for (const it of existingItineraries) {
    db.prepare("DELETE FROM itinerary_segments WHERE day_id IN (SELECT id FROM itinerary_days WHERE section_id IN (SELECT id FROM itinerary_sections WHERE itinerary_id = ?))").run(it.id);
    db.prepare("DELETE FROM itinerary_days WHERE section_id IN (SELECT id FROM itinerary_sections WHERE itinerary_id = ?)").run(it.id);
    db.prepare("DELETE FROM itinerary_stays WHERE section_id IN (SELECT id FROM itinerary_sections WHERE itinerary_id = ?)").run(it.id);
    db.prepare("DELETE FROM itinerary_sections WHERE itinerary_id = ?").run(it.id);
    db.prepare("DELETE FROM portal_items WHERE itinerary_id = ?").run(it.id);
    db.prepare("DELETE FROM itineraries WHERE id = ?").run(it.id);
  }
  if (existingItineraries.length > 0) {
    console.log("  ✓ Cleared " + existingItineraries.length + " existing itinerary(ies)");
  }

  // ─── 3. Create the itinerary ───
  const itResult = db
    .prepare("INSERT INTO itineraries (portal_id, title, created_at) VALUES (?, ?, CURRENT_TIMESTAMP)")
    .run(portal.id, "Singapore · 3-Day Journey");

  const itineraryId = itResult.lastInsertRowid;
  console.log("  ✓ Created itinerary (id " + itineraryId + ")");

  // ─── 4. Create the section ───
  const sectionResult = db
    .prepare(
      `INSERT INTO itinerary_sections (itinerary_id, title, base_city, start_date, end_date, position)
       VALUES (?, ?, ?, ?, ?, ?)`
    )
    .run(itineraryId, "Singapore", "Singapore", "2026-10-16", "2026-10-18", 0);

  const sectionId = sectionResult.lastInsertRowid;

  // ─── 5. Create the stay ───
  db.prepare(
    `INSERT INTO itinerary_stays (section_id, hotel_name, address, check_in_date, check_out_date, check_in_time, check_out_time, notes)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    sectionId,
    "Oakwood Hotel & Apartments Bencoolen",
    "30 Bencoolen St, Singapore 189621",
    "2026-10-16",
    "2026-10-18",
    "15:00",
    "10:00",
    null
  );
  console.log("  ✓ Added stay: Oakwood Bencoolen");

  // ─── 6. Create days + segments ───

  const days = [
    {
      date: "2026-10-16",
      dayNumber: 1,
      title: "Disembarkation & City Check-In",
      segments: [
        {
          type: "activity",
          startTime: "08:00",
          endTime: "10:00",
          title: "Port Disembarkation",
          location: "Singapore Cruise Port",
          instructions: "Disembark the Royal Princess following morning announcements.",
          confirmation: null,
        },
        {
          type: "travel",
          startTime: "12:00",
          endTime: "13:00",
          title: "Group Transfer to Hotel",
          location: "Singapore Cruise Port → Oakwood Bencoolen",
          instructions: "Private chartered group motorcoach transfer with Missey of Tour East Singapore.",
          confirmation: null,
        },
        {
          type: "activity",
          startTime: "15:00",
          endTime: "16:00",
          title: "Hotel Check-in",
          location: "Oakwood Hotel & Apartments Bencoolen",
          instructions: "Check in (Night 1 of 2). Situated in Singapore's arts and cultural district.",
          confirmation: null,
        },
        {
          type: "activity",
          startTime: "18:00",
          endTime: "19:00",
          title: "Marina Bay Sands & Helix Bridge",
          location: "Bayfront Station (Downtown Line ~10 min from hotel)",
          instructions: "Panoramic sunset skyline views.",
          confirmation: null,
        },
        {
          type: "activity",
          startTime: "19:30",
          endTime: "20:30",
          title: "Gardens by the Bay",
          location: "Gardens by the Bay",
          instructions: "Witness the Garden Rhapsody light and sound performance among the illuminated Supertrees.",
          confirmation: null,
        },
        {
          type: "meal",
          startTime: "21:00",
          endTime: "22:30",
          title: "Hawker Dining at Telok Ayer",
          location: "Telok Ayer Station",
          instructions: "Dine outdoors on skewers, chili crab, and ice-cold drinks under the colonial pavilion.",
          confirmation: null,
        },
      ],
    },
    {
      date: "2026-10-17",
      dayNumber: 2,
      title: "Lion City at Leisure",
      segments: [
        {
          type: "activity",
          startTime: "09:00",
          endTime: "11:30",
          title: "Chinatown Exploration (Option 1)",
          location: "Chinatown Station (Downtown Line 2 stops, 8 min)",
          instructions: "Explore the Buddha Tooth Relic Temple, browse street markets, and try Michelin-rated chicken rice at Maxwell Food Centre.",
          confirmation: null,
        },
        {
          type: "activity",
          startTime: "09:00",
          endTime: "11:30",
          title: "Little India Exploration (Option 2)",
          location: "Tekka Centre (12–15 min walk north)",
          instructions: "Crispy roti prata and teh tarik, followed by the colorful Sri Veeramakaliamman Temple.",
          confirmation: null,
        },
        {
          type: "activity",
          startTime: "14:00",
          endTime: "15:30",
          title: "Kampong Glam — Haji Lane & Arab Street",
          location: "Bugis Station (Downtown Line 1 stop, Exit B)",
          instructions: "Pleasant 15-minute walk eastward along Middle Road, or MRT to Bugis Station then 5-minute stroll.",
          confirmation: null,
        },
        {
          type: "activity",
          startTime: "15:30",
          endTime: "17:00",
          title: "Orchard Road & National Gallery",
          location: "Orchard Station / City Hall",
          instructions: "Orchard Road's premier shopping strip: 5-min walk to Dhoby Ghaut, North-South Line 4-min ride. National Gallery: 12–15 min scenic walk south, or Bus 124/190.",
          confirmation: null,
        },
        {
          type: "activity",
          startTime: "17:30",
          endTime: "19:00",
          title: "Clarke Quay & Singapore River",
          location: "Fort Canning Station (Exit A)",
          instructions: "15–18 min walk south along Armenian & Hill Street, or Downtown Line 1 stop from Bencoolen to Fort Canning. Alternative: Bus 190 from hotel.",
          confirmation: null,
        },
        {
          type: "meal",
          startTime: "19:30",
          endTime: "21:30",
          title: "Waterside Dinner & Bumboat Cruise",
          location: "Clarke Quay",
          instructions: "Wind down with waterside dinner or an evening Singapore River bumboat cruise.",
          confirmation: null,
        },
      ],
    },
    {
      date: "2026-10-18",
      dayNumber: 3,
      title: "Homeward Flights to Canada",
      segments: [
        {
          type: "travel",
          startTime: "04:00",
          endTime: "04:45",
          title: "Hotel Departure Transfer",
          location: "Oakwood Bencoolen → Singapore Changi Airport Terminal 2",
          instructions: "Transfer Partner: World Express Singapore. 04:00 AM sharp departure from the hotel lobby. Arrive SIN Terminal 2 by ~04:45 AM for international check-in and bag drop. Baggage: 1 standard checked bag (up to 23 kg / 50 lbs) included per passenger through to Toronto.",
          confirmation: null,
        },
        {
          type: "travel",
          startTime: "07:00",
          endTime: "06:25",
          title: "Air Canada AC0020 · SIN → YVR",
          location: "Singapore Changi (SIN) Terminal 2 → Vancouver Intl (YVR) Main Terminal",
          instructions: "Boeing 787-9. Duration: 14h 25m. Meal: Breakfast included onboard.",
          confirmation: "COPNYP",
          departureAirport: "SIN",
          arrivalAirport: "YVR",
          departureDatetime: "2026-10-18T07:00",
          arrivalDatetime: "2026-10-18T06:25",
          airline: "Air Canada",
          flightNumber: "AC0020",
        },
        {
          type: "travel",
          startTime: "09:00",
          endTime: "16:29",
          title: "Air Canada AC0034 · YVR → YYZ",
          location: "Vancouver Intl (YVR) Main Terminal → Toronto Pearson (YYZ) Terminal 1",
          instructions: "Boeing 777-200LR. Duration: 4h 29m.",
          confirmation: "COPNYP",
          departureAirport: "YVR",
          arrivalAirport: "YYZ",
          departureDatetime: "2026-10-18T09:00",
          arrivalDatetime: "2026-10-18T16:29",
          airline: "Air Canada",
          flightNumber: "AC0034",
        },
      ],
    },
  ];

  for (const day of days) {
    const dayResult = db
      .prepare(
        `INSERT INTO itinerary_days (section_id, date, day_number, title)
         VALUES (?, ?, ?, ?)`
      )
      .run(sectionId, day.date, day.dayNumber, day.title);

    const dayId = dayResult.lastInsertRowid;
    let position = 0;

    for (const seg of day.segments) {
      db.prepare(
        `INSERT INTO itinerary_segments
         (day_id, type, start_time, end_time, title, location, instructions, confirmation,
          departure_airport, arrival_airport, departure_datetime, arrival_datetime, airline, flight_number, position)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      ).run(
        dayId,
        seg.type,
        seg.startTime || null,
        seg.endTime || null,
        seg.title,
        seg.location || null,
        seg.instructions || null,
        seg.confirmation || null,
        seg.departureAirport || null,
        seg.arrivalAirport || null,
        seg.departureDatetime || null,
        seg.arrivalDatetime || null,
        seg.airline || null,
        seg.flightNumber || null,
        position++
      );
    }

    console.log("  ✓ Day " + day.dayNumber + ": " + day.title + " (" + day.segments.length + " segments)");
  }

  // ─── 7. Attach itinerary to portal wall via portal_items ───
  const items = db
    .prepare("SELECT position FROM portal_items WHERE portal_id = ? ORDER BY position DESC LIMIT 1")
    .get(portal.id);
  const nextPosition = items ? (items.position || 0) + 1 : 0;

  db.prepare(
    `INSERT INTO portal_items (portal_id, source_type, itinerary_id, position, created_at)
     VALUES (?, 'itinerary', ?, ?, CURRENT_TIMESTAMP)`
  ).run(portal.id, itineraryId, nextPosition);

  console.log("  ✓ Attached itinerary to portal wall");

  console.log("");
  console.log("═══════════════════════════════════════════════════");
  console.log("DEMO READY");
  console.log("═══════════════════════════════════════════════════");
  console.log("Portal slug:      singapore-demo");
  console.log("Itinerary ID:     " + itineraryId);
  console.log("");
  console.log("View client wall:");
  console.log("  http://localhost:3000/portal/singapore-demo");
  console.log("");
  console.log("Admin preview of itinerary:");
  console.log("  http://localhost:3000/admin/portals/" + portal.id + "/itinerary/" + itineraryId + "/preview");
  console.log("═══════════════════════════════════════════════════");

  db.close();
}

try {
  run();
} catch (err) {
  console.error("Seed failed:", err);
  db.close();
  process.exit(1);
}
