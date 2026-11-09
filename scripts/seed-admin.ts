import { db } from "../lib/db";
import { users } from "../drizzle/schema/users";
import { eq } from "drizzle-orm";
import { hash } from "bcryptjs";

type Mode = "create-admin" | "create-temp" | "reset-password" | "promote";

function parseArgs(): { mode: Mode; username: string } {
  const args = process.argv.slice(2);
  const username = process.env.ADMIN_USERNAME;
  if (!username) {
    console.error("ADMIN_USERNAME must be set in .env");
    process.exit(1);
  }

  if (args.includes("--temp-password")) return { mode: "create-temp", username };
  if (args.includes("--reset-password")) return { mode: "reset-password", username };
  if (args.includes("--promote")) return { mode: "promote", username };
  return { mode: "create-admin", username };
}

async function hashPassword(password: string): Promise<string> {
  return hash(password, 12);
}

async function getUser(username: string) {
  const rows = await db.select().from(users).where(eq(users.username, username)).limit(1);
  return rows[0] ?? null;
}

async function main() {
  if (process.env.NODE_ENV === "production") {
    console.error("seed-admin.ts is not for production use.");
    process.exit(1);
  }

  const { mode, username } = parseArgs();
  const password = process.env.ADMIN_PASSWORD;
  const existing = await getUser(username);

  if (mode === "promote") {
    if (!existing) {
      console.error(`User ${username} not found. Cannot promote.`);
      process.exit(1);
    }
    await db.update(users).set({ isAdmin: true }).where(eq(users.id, existing.id));
    console.log(`Promoted ${username} to admin.`);
    return;
  }

  if (mode === "reset-password") {
    if (!existing) {
      console.error(`User ${username} not found. Cannot reset.`);
      process.exit(1);
    }
    if (!password) {
      console.error("ADMIN_PASSWORD must be set in .env");
      process.exit(1);
    }
    const passwordHash = await hashPassword(password);
    await db.update(users)
      .set({ passwordHash, mustChangePassword: true })
      .where(eq(users.id, existing.id));
    console.log(`Reset password for ${username}. must_change_password=1.`);
    return;
  }

  if (existing) {
    console.error(`User ${username} already exists. Use --reset-password or --promote.`);
    process.exit(1);
  }

  if (!password) {
    console.error("ADMIN_PASSWORD must be set in .env");
    process.exit(1);
  }

  const passwordHash = await hashPassword(password);

  if (mode === "create-admin") {
    await db.insert(users).values({
      username, passwordHash,
      isAdmin: true, isActive: true,
      hasCompletedSetup: true, mustChangePassword: false,
      totpEnabled: false,
    });
    console.log(`Created admin: ${username}`);
  } else if (mode === "create-temp") {
    await db.insert(users).values({
      username, passwordHash,
      isAdmin: false, isActive: true,
      hasCompletedSetup: false, mustChangePassword: true,
      totpEnabled: false,
    });
    console.log(`Created temp user: ${username} (must_change_password=1)`);
  }
}

main().then(() => process.exit(0)).catch((err) => {
  console.error(err);
  process.exit(1);
});
