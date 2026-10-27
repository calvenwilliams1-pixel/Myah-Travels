const Database = require("better-sqlite3");
const path = require("path");

const db = new Database(path.join(__dirname, "..", "data", "site.db"));

// Wipe existing itinerary data from portal 1 (but keep the portal itself)
db.prepare("DELETE FROM itinerary_travel_legs WHERE segment_id IN (SELECT id FROM itinerary_segments WHERE day_id IN (SELECT id FROM itinerary_days WHERE section_id IN (SELECT id FROM itinerary_sections WHERE itinerary_id IN (SELECT id FROM itineraries WHERE portal_id = 1))))").run();
db.prepare("DELETE FROM itinerary_segments WHERE day_id IN (SELECT id FROM itinerary_days WHERE section_id IN (SELECT id FROM itinerary_sections WHERE itinerary_id IN (SELECT id FROM itineraries WHERE portal_id = 1)))").run();
db.prepare("DELETE FROM itinerary_days WHERE section_id IN (SELECT id FROM itinerary_sections WHERE itinerary_id IN (SELECT id FROM itineraries WHERE portal_id = 1))").run();
db.prepare("DELETE FROM itinerary_stays WHERE section_id IN (SELECT id FROM itinerary_sections WHERE itinerary_id IN (SELECT id FROM itineraries WHERE portal_id = 1))").run();
db.prepare("DELETE FROM itinerary_sections WHERE itinerary_id IN (SELECT id FROM itineraries WHERE portal_id = 1)").run();
db.prepare("DELETE FROM portal_items WHERE portal_id = 1").run();
db.prepare("DELETE FROM itineraries WHERE portal_id = 1").run();

// Create the itinerary
const itinerary = db.prepare(`
  INSERT INTO itineraries (portal_id, title, timezone, theme_preset, is_archived)
  VALUES (1, 'Japan Autumn 2026', 'Asia/Tokyo', 'editorial', 0)
`).run();
const itineraryId = itinerary.lastInsertRowid;
console.log("Created itinerary:", itineraryId);

// Update the portal with hero info
db.prepare(`
  UPDATE portals SET
    name = 'Japan Autumn 2026',
    slug = 'japan-2026',
    departure_date = '2026-10-27',
    return_date = '2026-11-05',
    hero_title = 'Japan Autumn 2026',
    hero_subtitle = 'Tokyo · Kyoto · Osaka',
    hero_preset = 'editorial'
  WHERE id = 1
`).run();

// Helper
function createSection(itineraryId, title, baseCity, startDate, endDate, position) {
  const r = db.prepare(`
    INSERT INTO itinerary_sections (itinerary_id, title, base_city, start_date, end_date, position)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(itineraryId, title, baseCity, startDate, endDate, position);
  return r.lastInsertRowid;
}

function createDay(sectionId, date, dayNumber, title) {
  const r = db.prepare(`
    INSERT INTO itinerary_days (section_id, date, day_number, title, order_mode)
    VALUES (?, ?, ?, ?, 'time')
  `).run(sectionId, date, dayNumber, title);
  return r.lastInsertRowid;
}

function createStay(sectionId, hotelName, address, checkInDate, checkOutDate, checkInTime, checkOutTime) {
  return db.prepare(`
    INSERT INTO itinerary_stays (section_id, hotel_name, address, check_in_date, check_out_date, check_in_time, check_out_time)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(sectionId, hotelName, address, checkInDate, checkOutDate, checkInTime, checkOutTime);
}

function createSegment(dayId, type, title, startTime, endTime, location, instructions) {
  const r = db.prepare(`
    INSERT INTO itinerary_segments (day_id, type, title, start_time, end_time, location, instructions)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(dayId, type, title, startTime || null, endTime || null, location || null, instructions || null);
  return r.lastInsertRowid;
}

function createTravelLeg(segmentId, legOrder, travelMode, origin, destination, departureAt, arrivalAt, operator, identifier) {
  return db.prepare(`
    INSERT INTO itinerary_travel_legs (segment_id, leg_order, travel_mode, origin, destination, departure_at, arrival_at, operator, identifier)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(segmentId, legOrder, travelMode, origin, destination, departureAt, arrivalAt, operator, identifier);
}

// ── Section 1: Tokyo (Days 1-4) ──
const tokyoId = createSection(itineraryId, "Tokyo", "Tokyo", "2026-10-27", "2026-10-30", 0);
createStay(tokyoId, "Park Hyatt Tokyo", "3-7-1-2 Nishishinjuku, Shinjuku City, Tokyo", "2026-10-27", "2026-10-31", "15:00", "11:00");

// Day 1 — Oct 27: Arrival + Flight
const day1 = createDay(tokyoId, "2026-10-27", 1, "Arrival in Tokyo");
const flight1 = createSegment(day1, "travel", "Flight to Tokyo", "13:00", "16:30", "YYZ → HND", "Check in 3 hours before. Gate posted 90min prior.");
createTravelLeg(flight1, 1, "flight", "YYZ", "HND", "2026-10-27T13:00", "2026-10-28T16:30", "Air Canada", "AC001");
createSegment(day1, "activity", "Hotel check-in and settle in", "18:00", null, "Park Hyatt Tokyo", "Front desk will have your reservation under Williams");
createSegment(day1, "meal", "Dinner at hotel — New York Grill", "20:00", null, "Park Hyatt, 52nd floor", "Reservation confirmed for 2");

// Day 2 — Oct 28: Tokyo exploration
const day2 = createDay(tokyoId, "2026-10-28", 2, "Shibuya and Harajuku");
createSegment(day2, "activity", "Meiji Jingu Shrine", "09:00", "11:00", "1-1 Yoyogikamizonocho, Shibuya", "Meet guide at main torii gate");
createSegment(day2, "activity", "Shibuya Crossing and Hachiko", "11:30", "13:00", "Shibuya Station", "Best photos from Shibuya Sky observation deck");
createSegment(day2, "meal", "Lunch at Ichiran Ramen", "13:30", null, "Shibuya", "Solo booth dining — no reservation needed");
createSegment(day2, "activity", "Takeshita Street shopping", "15:00", "17:00", "Harajuku", "Great for quirky souvenirs");

// Day 3 — Oct 29: Culture
const day3 = createDay(tokyoId, "2026-10-29", 3, "Asakusa and Ueno");
createSegment(day3, "activity", "Senso-ji Temple", "09:00", "11:00", "2-3-1 Asakusa, Taito City", "Arrive early to avoid crowds");
createSegment(day3, "activity", "Tokyo National Museum", "14:00", "17:00", "Ueno Park", "Samurai armor and ukiyo-e prints");
createSegment(day3, "meal", "Dinner at izakaya in Asakusa", "19:00", null, "Hoppy Street", "Reservation at Torikizoku — 5pm confirmation");

// Day 4 — Oct 30: Free day + prep for Kyoto
const day4 = createDay(tokyoId, "2026-10-30", 4, "Free day");
createSegment(day4, "free_day", "Free day — rest and pack", null, null, null, "Pick up JR Pass at Tokyo Station");

// ── Section 2: Kyoto (Days 5-8) ──
const kyotoId = createSection(itineraryId, "Kyoto", "Kyoto", "2026-10-31", "2026-11-03", 1);
createStay(kyotoId, "Four Seasons Kyoto", "445-3 Myohoin Maekawacho, Higashiyama Ward, Kyoto", "2026-10-31", "2026-11-04", "15:00", "11:00");

// Day 5 — Oct 31: Travel to Kyoto
const day5 = createDay(kyotoId, "2026-10-31", 5, "Tokyo to Kyoto");
const train1 = createSegment(day5, "travel", "Shinkansen to Kyoto", "09:00", "11:15", "Tokyo Station → Kyoto Station", "Green car reserved. Pick up bento before boarding.");
createTravelLeg(train1, 1, "train", "Tokyo", "Kyoto", "2026-10-31T09:00", "2026-10-31T11:15", "JR Central", "Nozomi 21");
createSegment(day5, "activity", "Check in at Four Seasons Kyoto", "15:00", null, "Four Seasons Kyoto", "Concierge will reserve dinner");
createSegment(day5, "meal", "Dinner — kaiseki at hotel", "19:00", null, "Four Seasons Kyoto", "Multi-course traditional Japanese");

// Day 6 — Nov 1: Temples
const day6 = createDay(kyotoId, "2026-11-01", 6, "Eastern Kyoto temples");
createSegment(day6, "activity", "Fushimi Inari Taisha", "08:00", "11:00", "68 Fukakusa Yabunouchicho, Fushimi Ward", "Hike to the summit if time allows");
createSegment(day6, "activity", "Kiyomizu-dera", "13:00", "15:00", "1-294 Kiyomizu, Higashiyama Ward", "Autumn leaves are spectacular");
createSegment(day6, "activity", "Gion evening walk", "17:00", "19:00", "Gion District", "Geisha spotting near Hanamikoji Street");

// Day 7 — Nov 2: Arashiyama
const day7 = createDay(kyotoId, "2026-11-02", 7, "Arashiyama day trip");
createSegment(day7, "activity", "Bamboo Grove walk", "09:00", "10:30", "Arashiyama", "Arrive before 9am for empty paths");
createSegment(day7, "activity", "Tenryu-ji Temple garden", "11:00", "12:30", "Arashiyama", "UNESCO World Heritage site");
createSegment(day7, "activity", "Monkey Park Iwatayama", "14:00", "16:00", "Arashiyama", "Great views of the city");

// Day 8 — Nov 3: Free day
const day8 = createDay(kyotoId, "2026-11-03", 8, "Free day");
createSegment(day8, "free_day", "Free day — Kyoto exploration", null, null, null, "Suggest Nishiki Market for lunch");

// ── Section 3: Osaka (Days 9-10) ──
const osakaId = createSection(itineraryId, "Osaka", "Osaka", "2026-11-04", "2026-11-05", 2);
createStay(osakaId, "Conrad Osaka", "3-2-4 Nakanoshima, Kita Ward, Osaka", "2026-11-04", "2026-11-06", "15:00", "11:00");

// Day 9 — Nov 4: Travel to Osaka
const day9 = createDay(osakaId, "2026-11-04", 9, "Kyoto to Osaka");
const train2 = createSegment(day9, "travel", "Train to Osaka", "10:00", "10:30", "Kyoto Station → Osaka Station", "Short ride — no reserved seats needed");
createTravelLeg(train2, 1, "train", "Kyoto", "Osaka", "2026-11-04T10:00", "2026-11-04T10:30", "JR West", "Special Rapid");
createSegment(day9, "activity", "Dotonbori evening", "18:00", "21:00", "Dotonbori", "Street food tour — takoyaki, okonomiyaki");
createSegment(day9, "meal", "Dinner at Kani Doraku", "20:00", null, "Dotonbori", "Crab specialty — reservation required");

// Day 10 — Nov 5: Departure
const day10 = createDay(osakaId, "2026-11-05", 10, "Departure");
const flight2 = createSegment(day10, "travel", "Flight home", "17:00", "17:30", "KIX → YYZ", "Arrive 3 hours early — international");
createTravelLeg(flight2, 1, "flight", "KIX", "YYZ", "2026-11-05T17:00", "2026-11-06T17:30", "Air Canada", "AC002");
createSegment(day10, "activity", "Last-minute souvenirs at KIX", "14:00", null, "Kansai International Airport", "Terminal 1, 3rd floor");

// ── Attach items to portal wall ──
db.prepare(`
  INSERT INTO portal_items (portal_id, source_type, itinerary_id, position, is_visible)
  VALUES (1, 'itinerary_glance', ?, 0, 1)
`).run(itineraryId);
db.prepare(`
  INSERT INTO portal_items (portal_id, source_type, itinerary_id, position, is_visible)
  VALUES (1, 'itinerary_today', ?, 1, 1)
`).run(itineraryId);
db.prepare(`
  INSERT INTO portal_items (portal_id, source_type, itinerary_id, position, is_visible)
  VALUES (1, 'itinerary', ?, 2, 1)
`).run(itineraryId);

console.log("✅ Seeded Japan Autumn 2026:");
console.log("   Itinerary ID:", itineraryId);
console.log("   3 sections (Tokyo, Kyoto, Osaka), 10 days, 3 stays");
console.log("   Attached to portal 1: glance + today + full");
console.log("   Portal slug:", "japan-2026");
db.close();
