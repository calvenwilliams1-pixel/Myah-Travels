-- FTS5 Virtual Table
CREATE VIRTUAL TABLE IF NOT EXISTS search_index USING fts5(
    title,
    content,
    content_type,
    content_id,
    tokenize = 'porter'
);

-- Posts Triggers
CREATE TRIGGER IF NOT EXISTS posts_ai AFTER INSERT ON posts BEGIN
  INSERT INTO search_index (title, content, content_type, content_id)
  VALUES (new.title, new.content, 'post', new.id);
END;

CREATE TRIGGER IF NOT EXISTS posts_au AFTER UPDATE ON posts
WHEN new.deleted_at IS NULL BEGIN
  DELETE FROM search_index WHERE content_type = 'post' AND content_id = old.id;
  INSERT INTO search_index (title, content, content_type, content_id)
  VALUES (new.title, new.content, 'post', new.id);
END;

CREATE TRIGGER IF NOT EXISTS posts_ad AFTER DELETE ON posts BEGIN
  DELETE FROM search_index WHERE content_type = 'post' AND content_id = old.id;
END;

-- Soft delete trigger
CREATE TRIGGER IF NOT EXISTS posts_soft_delete AFTER UPDATE ON posts
WHEN new.deleted_at IS NOT NULL AND old.deleted_at IS NULL BEGIN
  DELETE FROM search_index WHERE content_type = 'post' AND content_id = new.id;
END;

-- Guides Triggers
CREATE TRIGGER IF NOT EXISTS guides_ai AFTER INSERT ON guides BEGIN
  INSERT INTO search_index (title, content, content_type, content_id)
  VALUES (new.title, new.content, 'guide', new.id);
END;

CREATE TRIGGER IF NOT EXISTS guides_au AFTER UPDATE ON guides
WHEN new.deleted_at IS NULL BEGIN
  DELETE FROM search_index WHERE content_type = 'guide' AND content_id = old.id;
  INSERT INTO search_index (title, content, content_type, content_id)
  VALUES (new.title, new.content, 'guide', new.id);
END;

CREATE TRIGGER IF NOT EXISTS guides_ad AFTER DELETE ON guides BEGIN
  DELETE FROM search_index WHERE content_type = 'guide' AND content_id = old.id;
END;

-- Soft delete trigger
CREATE TRIGGER IF NOT EXISTS guides_soft_delete AFTER UPDATE ON guides
WHEN new.deleted_at IS NOT NULL AND old.deleted_at IS NULL BEGIN
  DELETE FROM search_index WHERE content_type = 'guide' AND content_id = new.id;
END;

-- Reviews Triggers
CREATE TRIGGER IF NOT EXISTS reviews_ai AFTER INSERT ON reviews BEGIN
  INSERT INTO search_index (title, content, content_type, content_id)
  VALUES (new.title, new.content, 'review', new.id);
END;

CREATE TRIGGER IF NOT EXISTS reviews_au AFTER UPDATE ON reviews
WHEN new.deleted_at IS NULL BEGIN
  DELETE FROM search_index WHERE content_type = 'review' AND content_id = old.id;
  INSERT INTO search_index (title, content, content_type, content_id)
  VALUES (new.title, new.content, 'review', new.id);
END;

CREATE TRIGGER IF NOT EXISTS reviews_ad AFTER DELETE ON reviews BEGIN
  DELETE FROM search_index WHERE content_type = 'review' AND content_id = old.id;
END;

-- Soft delete trigger
CREATE TRIGGER IF NOT EXISTS reviews_soft_delete AFTER UPDATE ON reviews
WHEN new.deleted_at IS NOT NULL AND old.deleted_at IS NULL BEGIN
  DELETE FROM search_index WHERE content_type = 'review' AND content_id = new.id;
END;
