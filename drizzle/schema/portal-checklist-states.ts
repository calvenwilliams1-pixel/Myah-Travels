import { sqliteTable, text, integer, unique } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

export const portalChecklistStates = sqliteTable(
  "portal_checklist_states",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    portalId: integer("portal_id").notNull(),
    elementId: text("element_id").notNull(),
    itemId: text("item_id").notNull(),
    memberId: integer("member_id").notNull(),
    checked: integer("checked", { mode: "boolean" }).default(false),
    createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
    updatedAt: text("updated_at").default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => ({
    unqChecklistState: unique("unq_portal_checklist_state").on(
      table.portalId,
      table.elementId,
      table.itemId,
      table.memberId
    ),
  })
);
