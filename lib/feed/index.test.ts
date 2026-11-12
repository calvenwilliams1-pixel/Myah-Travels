import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { db } from "@/lib/db";
import { tags } from "@/drizzle/schema/tags";
import { tagAliases } from "@/drizzle/schema/tag-aliases";
import { posts } from "@/drizzle/schema/posts";
import { postTags } from "@/drizzle/schema/post-tags";
import { eq, inArray, sql } from "drizzle-orm";
import { getFeedItems } from "./index";

const runId = Date.now().toString(36);

function testSlug(base: string): string {
  return `f${runId}-${base}`;
}

async function makeTag(name: string): Promise<number> {
  const slug = testSlug(name.toLowerCase().replace(/[^a-z0-9]/g, ""));
  const [row] = await db.insert(tags).values({ name: `${name}-${runId}`, slug }).returning();
  return row.id;
}

async function makePost(title: string): Promise<number> {
  const slug = testSlug(title.toLowerCase().replace(/[^a-z0-9]/g, ""));
  const [row] = await db.insert(posts).values({
    title: `${title}-${runId}`,
    slug,
    content: JSON.stringify({ blocks: [], templateId: "story" }),
    status: "published",
    publishedAt: new Date().toISOString(),
  }).returning();
  return row.id;
}

async function linkPostTag(postId: number, tagId: number) {
  await db.insert(postTags).values({ postId, tagId }).onConflictDoNothing();
}

async function createAlias(aliasId: number, canonicalId: number) {
  await db.insert(tagAliases).values({ aliasTagId: aliasId, canonicalTagId: canonicalId });
}

async function makeTagPair(canonicalName: string, aliasName: string): Promise<{ canonical: number; alias: number }> {
  const canonical = await makeTag(canonicalName);
  const alias = await makeTag(aliasName);
  await createAlias(alias, canonical);
  return { canonical, alias };
}

afterEach(async () => {
  const leftoverPosts = await db.select({ id: posts.id }).from(posts).where(sql`${posts.slug} LIKE ${"f" + runId + "-%"}`);
  if (leftoverPosts.length > 0) {
    const postIds = leftoverPosts.map((r) => r.id);
    await db.delete(postTags).where(inArray(postTags.postId, postIds));
    await db.delete(posts).where(inArray(posts.id, postIds));
  }
  const leftoverTags = await db.select({ id: tags.id }).from(tags).where(sql`${tags.slug} LIKE ${"f" + runId + "-%"}`);
  if (leftoverTags.length > 0) {
    const tagIds = leftoverTags.map((r) => r.id);
    await db.delete(tagAliases).where(inArray(tagAliases.aliasTagId, tagIds));
    await db.delete(tagAliases).where(inArray(tagAliases.canonicalTagId, tagIds));
    await db.delete(postTags).where(inArray(postTags.tagId, tagIds));
    await db.delete(tags).where(inArray(tags.id, tagIds));
  }
});

describe("getFeedItems — tag filtering", () => {
  it("non-alias regression: filter by exact slug finds tagged post", async () => {
    const tagId = await makeTag("plain");
    const tagRow = await db.select().from(tags).where(eq(tags.id, tagId)).limit(1);
    const postId = await makePost("Plain Post");
    await linkPostTag(postId, tagId);

    const items = await getFeedItems("all", "newest", 20, 0, [tagRow[0].slug]);
    expect(items.map((i) => i.id)).toContain(postId);
  });

  it("filter by canonical slug finds post tagged with alias", async () => {
    const { canonical, alias } = await makeTagPair("Disney", "Disneyland");
    const canonicalRow = await db.select().from(tags).where(eq(tags.id, canonical)).limit(1);
    const postId = await makePost("Alias Tagged Post");
    await linkPostTag(postId, alias);

    const items = await getFeedItems("all", "newest", 20, 0, [canonicalRow[0].slug]);
    expect(items.map((i) => i.id)).toContain(postId);
  });

  it("filter by alias slug finds post tagged with canonical", async () => {
    const { canonical, alias } = await makeTagPair("ThemeParks", "ThemeParkAlias");
    const aliasRow = await db.select().from(tags).where(eq(tags.id, alias)).limit(1);
    const postId = await makePost("Canonical Tagged Post");
    await linkPostTag(postId, canonical);

    const items = await getFeedItems("all", "newest", 20, 0, [aliasRow[0].slug]);
    expect(items.map((i) => i.id)).toContain(postId);
  });

  it("two families: AND across, OR within", async () => {
    const { canonical: disneyCanon } = await makeTagPair("Disney2", "Disneyland2");
    const reviewTag = await makeTag("review2");
    const disneyCanonRow = await db.select().from(tags).where(eq(tags.id, disneyCanon)).limit(1);
    const reviewRow = await db.select().from(tags).where(eq(tags.id, reviewTag)).limit(1);

    // Post A: has disney family tag + review tag → should match
    const postA = await makePost("PostA");
    const disneyAliasId = (await db.select().from(tags).where(sql`${tags.name} = ${"Disneyland2-" + runId}`).limit(1))[0].id;
    await linkPostTag(postA, disneyAliasId);
    await linkPostTag(postA, reviewTag);

    // Post B: has disney family tag only → should NOT match
    const postB = await makePost("PostB");
    await linkPostTag(postB, disneyAliasId);

    const items = await getFeedItems("all", "newest", 20, 0, [disneyCanonRow[0].slug, reviewRow[0].slug]);
    const ids = items.map((i) => i.id);
    expect(ids).toContain(postA);
    expect(ids).not.toContain(postB);
  });

  it("unknown slug returns empty result without throwing", async () => {
    const items = await getFeedItems("all", "newest", 20, 0, [`nonexistent-${runId}`]);
    expect(Array.isArray(items)).toBe(true);
    expect(items.length).toBe(0);
  });
});
