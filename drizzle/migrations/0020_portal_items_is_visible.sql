-- Per-item visibility flag. Admin attaches items as usual; clients only
-- see items where is_visible = 1. Admin preview shows all items.
ALTER TABLE portal_items ADD COLUMN is_visible INTEGER NOT NULL DEFAULT 1;
