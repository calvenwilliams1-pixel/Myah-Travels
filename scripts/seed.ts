import { db } from "../lib/db";
import { users } from "../drizzle/schema/users";
import { categories } from "../drizzle/schema/categories";
import { tags } from "../drizzle/schema/tags";
import { settings } from "../drizzle/schema/settings";
import { pages } from "../drizzle/schema/pages";
import { hash } from "bcryptjs";

async function seed() {
  console.log("Seeding database...");

  const adminPassword = process.env.ADMIN_PASSWORD || "changeme";
  const passwordHash = await hash(adminPassword, 12);
  
  await db.insert(users)
    .values({
      username: process.env.ADMIN_USERNAME || "myah",
      passwordHash,
      totpEnabled: false,
    })
    .onConflictDoNothing();

  const defaultCategories = [
    { name: "Travel Tips", slug: "travel-tips" },
    { name: "Destination Guides", slug: "destination-guides" },
    { name: "Reviews", slug: "reviews" },
    { name: "Disney", slug: "disney" },
    { name: "Universal", slug: "universal" },
    { name: "Japan", slug: "japan" },
    { name: "Mexico", slug: "mexico" },
    { name: "Orlando", slug: "orlando" },
  ];

  for (const cat of defaultCategories) {
    await db.insert(categories)
      .values(cat)
      .onConflictDoNothing();
  }

  const defaultTags = [
    { name: "Family", slug: "family" },
    { name: "Budget", slug: "budget" },
    { name: "Luxury", slug: "luxury" },
    { name: "Food", slug: "food" },
    { name: "Cruise", slug: "cruise" },
    { name: "Hotel", slug: "hotel" },
    { name: "Flight", slug: "flight" },
    { name: "Packing", slug: "packing" },
  ];

  for (const tag of defaultTags) {
    await db.insert(tags)
      .values(tag)
      .onConflictDoNothing();
  }

  const defaultSettings = [
    { key: "site_name", value: "Myah Travels" },
    { key: "tagline", value: "Travel can be big or small and I'm here to write it all" },
    { key: "primary_color", value: "#4a7c59" },
    { key: "secondary_color", value: "#e8b84b" },
    { key: "accent_color", value: "#6b9ac4" },
    { key: "font_family", value: "Inter" },
    { key: "admin_email", value: "myah@example.com" },
    { key: "portal_magic_link_expiry_days", value: "7" },
  ];

  for (const setting of defaultSettings) {
    await db.insert(settings)
      .values(setting)
      .onConflictDoNothing();
  }

  await db.insert(pages)
    .values({
      title: "Privacy Policy",
      slug: "privacy",
      content: "<p>Your privacy policy content goes here.</p>",
      isVisible: true,
    })
    .onConflictDoNothing();

  console.log("Seed complete.");
}

seed().catch((err) => {
  console.error("Seed failed:", err);
});
