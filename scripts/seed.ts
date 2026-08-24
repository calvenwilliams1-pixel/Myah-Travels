import { db } from "../lib/db";
import { users } from "../drizzle/schema/users";
import { categories } from "../drizzle/schema/categories";
import { tags } from "../drizzle/schema/tags";
import { settings } from "../drizzle/schema/settings";
import { pages } from "../drizzle/schema/pages";
import { templates } from "../drizzle/schema/templates";
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

  console.log("Core seed complete. Seeding built-in templates...");

  const builtInTemplates = [
    {
      name: "Standard Blog Post",
      slug: "post-standard-blog",
      contentType: "post",
      isBuiltIn: true,
      layoutData: JSON.stringify({
        schemaVersion: 1,
        canvas: { width: 800, height: 1600, background: "#ffffff" },
        theme: { primaryColor: "#4a7c59", secondaryColor: "#e8b84b", headingFont: "Inter", bodyFont: "Inter" },
        elements: [
          { id: "seed-post-1", name: "Title", type: "text", x: 50, y: 50, width: 700, height: 80, rotation: 0, zIndex: 1, locked: false, visible: true, text: "Your Post Title", fontSize: 36, color: "#333333", fontFamily: "Inter", textAlign: "left", fontWeight: "bold" },
          { id: "seed-post-2", name: "Body", type: "text", x: 50, y: 150, width: 700, height: 300, rotation: 0, zIndex: 2, locked: false, visible: true, text: "Write your content here. Double-click to edit.", fontSize: 16, color: "#333333", fontFamily: "Inter", textAlign: "left", fontWeight: "normal" },
          { id: "seed-post-3", name: "Image", type: "image", x: 50, y: 480, width: 700, height: 400, rotation: 0, zIndex: 3, locked: false, visible: true, assetId: null, objectFit: "cover", borderRadius: 8 },
        ],
      }),
    },
    {
      name: "Travel Story",
      slug: "post-travel-story",
      contentType: "post",
      isBuiltIn: true,
      layoutData: JSON.stringify({
        schemaVersion: 1,
        canvas: { width: 800, height: 1600, background: "#ffffff" },
        theme: { primaryColor: "#4a7c59", secondaryColor: "#e8b84b", headingFont: "Inter", bodyFont: "Inter" },
        elements: [
          { id: "seed-story-1", name: "Hero Image", type: "image", x: 0, y: 0, width: 800, height: 400, rotation: 0, zIndex: 1, locked: false, visible: true, assetId: null, objectFit: "cover", borderRadius: 0 },
          { id: "seed-story-2", name: "Title", type: "text", x: 50, y: 430, width: 700, height: 60, rotation: 0, zIndex: 2, locked: false, visible: true, text: "A Story Worth Telling", fontSize: 32, color: "#333333", fontFamily: "Inter", textAlign: "center", fontWeight: "bold" },
          { id: "seed-story-3", name: "Body", type: "text", x: 50, y: 510, width: 700, height: 400, rotation: 0, zIndex: 3, locked: false, visible: true, text: "Your story begins here...", fontSize: 16, color: "#333333", fontFamily: "Inter", textAlign: "left", fontWeight: "normal" },
        ],
      }),
    },
    {
      name: "Listicle Layout",
      slug: "post-listicle",
      contentType: "post",
      isBuiltIn: true,
      layoutData: JSON.stringify({
        schemaVersion: 1,
        canvas: { width: 800, height: 1600, background: "#ffffff" },
        theme: { primaryColor: "#4a7c59", secondaryColor: "#e8b84b", headingFont: "Inter", bodyFont: "Inter" },
        elements: [
          { id: "seed-list-1", name: "Title", type: "text", x: 50, y: 50, width: 700, height: 60, rotation: 0, zIndex: 1, locked: false, visible: true, text: "Top 10 Things To Do", fontSize: 36, color: "#333333", fontFamily: "Inter", textAlign: "center", fontWeight: "bold" },
          { id: "seed-list-2", name: "List", type: "list", x: 50, y: 140, width: 700, height: 500, rotation: 0, zIndex: 2, locked: false, visible: true, listType: "numbered", items: ["Item 1", "Item 2", "Item 3", "Item 4", "Item 5"], bulletStyle: "disc", fontSize: 18, color: "#333333" },
        ],
      }),
    },
    {
      name: "Destination Guide Standard",
      slug: "guide-destination-standard",
      contentType: "guide",
      isBuiltIn: true,
      layoutData: JSON.stringify({
        schemaVersion: 1,
        canvas: { width: 800, height: 1400, background: "#ffffff" },
        theme: { primaryColor: "#4a7c59", secondaryColor: "#e8b84b", headingFont: "Inter", bodyFont: "Inter" },
        elements: [
          { id: "seed-guide-1", name: "Title", type: "text", x: 50, y: 50, width: 700, height: 70, rotation: 0, zIndex: 1, locked: false, visible: true, text: "Destination Guide", fontSize: 40, color: "#333333", fontFamily: "Inter", textAlign: "center", fontWeight: "bold" },
          { id: "seed-guide-2", name: "Featured Image", type: "image", x: 50, y: 140, width: 700, height: 350, rotation: 0, zIndex: 2, locked: false, visible: true, assetId: null, objectFit: "cover", borderRadius: 12 },
          { id: "seed-guide-3", name: "Quick Info", type: "text", x: 50, y: 510, width: 700, height: 100, rotation: 0, zIndex: 3, locked: false, visible: true, text: "Best time to visit: [Season]\nBudget: [$]\nLanguage: [Language]", fontSize: 16, color: "#333333", fontFamily: "Inter", textAlign: "left", fontWeight: "normal" },
          { id: "seed-guide-4", name: "Body", type: "text", x: 50, y: 630, width: 700, height: 600, rotation: 0, zIndex: 4, locked: false, visible: true, text: "Guide content goes here...", fontSize: 16, color: "#333333", fontFamily: "Inter", textAlign: "left", fontWeight: "normal" },
        ],
      }),
    },
    {
      name: "Itinerary Layout",
      slug: "guide-itinerary",
      contentType: "guide",
      isBuiltIn: true,
      layoutData: JSON.stringify({
        schemaVersion: 1,
        canvas: { width: 800, height: 1400, background: "#ffffff" },
        theme: { primaryColor: "#4a7c59", secondaryColor: "#e8b84b", headingFont: "Inter", bodyFont: "Inter" },
        elements: [
          { id: "seed-itin-1", name: "Title", type: "text", x: 50, y: 50, width: 700, height: 60, rotation: 0, zIndex: 1, locked: false, visible: true, text: "Your Itinerary", fontSize: 36, color: "#333333", fontFamily: "Inter", textAlign: "center", fontWeight: "bold" },
          { id: "seed-itin-2", name: "Checklist", type: "checklist", x: 50, y: 130, width: 700, height: 400, rotation: 0, zIndex: 2, locked: false, visible: true, items: [{ id: "seed-it-1", text: "Day 1: Arrival", checked: false }, { id: "seed-it-2", text: "Day 2: Explore", checked: false }, { id: "seed-it-3", text: "Day 3: Adventure", checked: false }], fontSize: 16, color: "#333333" },
          { id: "seed-itin-3", name: "Notes", type: "text", x: 50, y: 550, width: 700, height: 400, rotation: 0, zIndex: 3, locked: false, visible: true, text: "Additional notes, tips, and recommendations...", fontSize: 16, color: "#333333", fontFamily: "Inter", textAlign: "left", fontWeight: "normal" },
        ],
      }),
    },
    {
      name: "Quick Reference Card",
      slug: "guide-quick-reference",
      contentType: "guide",
      isBuiltIn: true,
      layoutData: JSON.stringify({
        schemaVersion: 1,
        canvas: { width: 800, height: 600, background: "#ffffff" },
        theme: { primaryColor: "#4a7c59", secondaryColor: "#e8b84b", headingFont: "Inter", bodyFont: "Inter" },
        elements: [
          { id: "seed-qr-1", name: "Card Background", type: "shape", x: 50, y: 50, width: 700, height: 500, rotation: 0, zIndex: 1, locked: false, visible: true, shapeType: "square", fillColor: "#f9f9f9", borderRadius: 16, opacity: 1 },
          { id: "seed-qr-2", name: "Title", type: "text", x: 100, y: 100, width: 600, height: 60, rotation: 0, zIndex: 2, locked: false, visible: true, text: "Quick Reference", fontSize: 32, color: "#4a7c59", fontFamily: "Inter", textAlign: "center", fontWeight: "bold" },
          { id: "seed-qr-3", name: "Info", type: "text", x: 100, y: 180, width: 600, height: 300, rotation: 0, zIndex: 3, locked: false, visible: true, text: "Key facts, tips, and essential info...", fontSize: 18, color: "#333333", fontFamily: "Inter", textAlign: "center", fontWeight: "normal" },
        ],
      }),
    },
    {
      name: "Product Review Standard",
      slug: "review-product-standard",
      contentType: "review",
      isBuiltIn: true,
      layoutData: JSON.stringify({
        schemaVersion: 1,
        canvas: { width: 800, height: 1200, background: "#ffffff" },
        theme: { primaryColor: "#4a7c59", secondaryColor: "#e8b84b", headingFont: "Inter", bodyFont: "Inter" },
        elements: [
          { id: "seed-rev-1", name: "Title", type: "text", x: 50, y: 50, width: 700, height: 60, rotation: 0, zIndex: 1, locked: false, visible: true, text: "Product Review", fontSize: 36, color: "#333333", fontFamily: "Inter", textAlign: "center", fontWeight: "bold" },
          { id: "seed-rev-2", name: "Product Image", type: "image", x: 50, y: 130, width: 700, height: 350, rotation: 0, zIndex: 2, locked: false, visible: true, assetId: null, objectFit: "cover", borderRadius: 12 },
          { id: "seed-rev-3", name: "Pros Cons", type: "proscons", x: 50, y: 500, width: 700, height: 300, rotation: 0, zIndex: 3, locked: false, visible: true, pros: ["Pro 1", "Pro 2", "Pro 3"], cons: ["Con 1", "Con 2"], fontSize: 16, color: "#333333" },
          { id: "seed-rev-4", name: "Verdict", type: "text", x: 50, y: 820, width: 700, height: 200, rotation: 0, zIndex: 4, locked: false, visible: true, text: "Final verdict goes here...", fontSize: 16, color: "#333333", fontFamily: "Inter", textAlign: "left", fontWeight: "normal" },
        ],
      }),
    },
    {
      name: "Hotel Review Layout",
      slug: "review-hotel",
      contentType: "review",
      isBuiltIn: true,
      layoutData: JSON.stringify({
        schemaVersion: 1,
        canvas: { width: 800, height: 1200, background: "#ffffff" },
        theme: { primaryColor: "#4a7c59", secondaryColor: "#e8b84b", headingFont: "Inter", bodyFont: "Inter" },
        elements: [
          { id: "seed-hotel-1", name: "Hotel Image", type: "image", x: 0, y: 0, width: 800, height: 400, rotation: 0, zIndex: 1, locked: false, visible: true, assetId: null, objectFit: "cover", borderRadius: 0 },
          { id: "seed-hotel-2", name: "Hotel Name", type: "text", x: 50, y: 430, width: 700, height: 60, rotation: 0, zIndex: 2, locked: false, visible: true, text: "Hotel Name", fontSize: 36, color: "#333333", fontFamily: "Inter", textAlign: "center", fontWeight: "bold" },
          { id: "seed-hotel-3", name: "Pros Cons", type: "proscons", x: 50, y: 510, width: 700, height: 300, rotation: 0, zIndex: 3, locked: false, visible: true, pros: ["Great location", "Clean rooms"], cons: ["Pricey"], fontSize: 16, color: "#333333" },
        ],
      }),
    },
    {
      name: "Restaurant Review",
      slug: "review-restaurant",
      contentType: "review",
      isBuiltIn: true,
      layoutData: JSON.stringify({
        schemaVersion: 1,
        canvas: { width: 800, height: 1200, background: "#ffffff" },
        theme: { primaryColor: "#4a7c59", secondaryColor: "#e8b84b", headingFont: "Inter", bodyFont: "Inter" },
        elements: [
          { id: "seed-rest-1", name: "Restaurant Name", type: "text", x: 50, y: 50, width: 700, height: 70, rotation: 0, zIndex: 1, locked: false, visible: true, text: "Restaurant Review", fontSize: 40, color: "#333333", fontFamily: "Inter", textAlign: "center", fontWeight: "bold" },
          { id: "seed-rest-2", name: "Food Image", type: "image", x: 50, y: 140, width: 700, height: 300, rotation: 0, zIndex: 2, locked: false, visible: true, assetId: null, objectFit: "cover", borderRadius: 12 },
          { id: "seed-rest-3", name: "Review", type: "text", x: 50, y: 460, width: 700, height: 400, rotation: 0, zIndex: 3, locked: false, visible: true, text: "Your dining experience...", fontSize: 16, color: "#333333", fontFamily: "Inter", textAlign: "left", fontWeight: "normal" },
        ],
      }),
    },
    {
      name: "Hero Welcome",
      slug: "homepage-hero-welcome",
      contentType: "homepage",
      isBuiltIn: true,
      layoutData: JSON.stringify({
        schemaVersion: 1,
        canvas: { width: 800, height: 2000, background: "#ffffff" },
        theme: { primaryColor: "#4a7c59", secondaryColor: "#e8b84b", headingFont: "Inter", bodyFont: "Inter" },
        elements: [
          { id: "seed-hero-1", name: "Hero Background", type: "shape", x: 0, y: 0, width: 800, height: 500, rotation: 0, zIndex: 1, locked: false, visible: true, shapeType: "square", fillColor: "#4a7c59", borderRadius: 0, opacity: 1 },
          { id: "seed-hero-2", name: "Welcome Text", type: "text", x: 100, y: 150, width: 600, height: 100, rotation: 0, zIndex: 2, locked: false, visible: true, text: "Welcome to Myah Travels", fontSize: 48, color: "#ffffff", fontFamily: "Inter", textAlign: "center", fontWeight: "bold" },
          { id: "seed-hero-3", name: "Tagline", type: "text", x: 100, y: 270, width: 600, height: 60, rotation: 0, zIndex: 3, locked: false, visible: true, text: "Travel can be big or small and I'm here to write it all", fontSize: 20, color: "#ffffff", fontFamily: "Inter", textAlign: "center", fontWeight: "normal" },
          { id: "seed-hero-4", name: "CTA Button", type: "button", x: 300, y: 360, width: 200, height: 50, rotation: 0, zIndex: 4, locked: false, visible: true, text: "Start Exploring", link: "/blog", backgroundColor: "#e8b84b", textColor: "#333333", borderRadius: 25 },
        ],
      }),
    },
    {
      name: "Featured Content Grid",
      slug: "homepage-featured-grid",
      contentType: "homepage",
      isBuiltIn: true,
      layoutData: JSON.stringify({
        schemaVersion: 1,
        canvas: { width: 800, height: 2000, background: "#ffffff" },
        theme: { primaryColor: "#4a7c59", secondaryColor: "#e8b84b", headingFont: "Inter", bodyFont: "Inter" },
        elements: [
          { id: "seed-fg-1", name: "Section Title", type: "text", x: 50, y: 50, width: 700, height: 60, rotation: 0, zIndex: 1, locked: false, visible: true, text: "Featured Content", fontSize: 36, color: "#333333", fontFamily: "Inter", textAlign: "center", fontWeight: "bold" },
          { id: "seed-fg-2", name: "Card 1", type: "shape", x: 50, y: 140, width: 320, height: 300, rotation: 0, zIndex: 2, locked: false, visible: true, shapeType: "square", fillColor: "#f9f9f9", borderRadius: 16, opacity: 1 },
          { id: "seed-fg-3", name: "Card 2", type: "shape", x: 430, y: 140, width: 320, height: 300, rotation: 0, zIndex: 3, locked: false, visible: true, shapeType: "square", fillColor: "#f9f9f9", borderRadius: 16, opacity: 1 },
          { id: "seed-fg-4", name: "Card 1 Button", type: "button", x: 100, y: 360, width: 220, height: 50, rotation: 0, zIndex: 4, locked: false, visible: true, text: "Read More", link: "#", backgroundColor: "#4a7c59", textColor: "#ffffff", borderRadius: 8 },
          { id: "seed-fg-5", name: "Card 2 Button", type: "button", x: 480, y: 360, width: 220, height: 50, rotation: 0, zIndex: 5, locked: false, visible: true, text: "Read More", link: "#", backgroundColor: "#4a7c59", textColor: "#ffffff", borderRadius: 8 },
        ],
      }),
    },
  ];

  for (const template of builtInTemplates) {
    await db.insert(templates)
      .values(template)
      .onConflictDoNothing();
  }

  console.log("Seed complete.");
}

seed().catch((err) => {
  console.error("Seed failed:", err);
});
