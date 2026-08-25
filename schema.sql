CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  totp_secret TEXT,
  totp_enabled INTEGER DEFAULT 0,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  last_login TEXT,
  deleted_at TEXT
);

CREATE TABLE sessions (
  id TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL,
  expires_at TEXT NOT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT UNIQUE NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  is_visible INTEGER DEFAULT 1,
  sort_order INTEGER DEFAULT 0,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  deleted_at TEXT
);

CREATE TABLE tags (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT UNIQUE NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE posts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  content TEXT NOT NULL,
  excerpt TEXT,
  featured_image TEXT,
  status TEXT DEFAULT 'draft',
  scheduled_at TEXT,
  published_at TEXT,
  updated_at TEXT,
  created_at TEXT,
  deleted_at TEXT,
  seo_title TEXT,
  seo_description TEXT,
  is_visible INTEGER DEFAULT 1,
  is_pinned INTEGER DEFAULT 0,
  is_highlighted INTEGER DEFAULT 0,
  pinned_at TEXT,
  mode TEXT DEFAULT 'story'
);

CREATE TABLE guides (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  content TEXT NOT NULL,
  excerpt TEXT,
  featured_image TEXT,
  header_image TEXT,
  quick_reference TEXT,
  status TEXT DEFAULT 'draft',
  scheduled_at TEXT,
  published_at TEXT,
  updated_at TEXT,
  created_at TEXT,
  deleted_at TEXT,
  seo_title TEXT,
  seo_description TEXT,
  is_visible INTEGER DEFAULT 1,
  is_pinned INTEGER DEFAULT 0,
  is_highlighted INTEGER DEFAULT 0,
  pinned_at TEXT,
  mode TEXT DEFAULT 'story'
);

CREATE TABLE reviews (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  content TEXT NOT NULL,
  excerpt TEXT,
  featured_image TEXT,
  review_type TEXT NOT NULL DEFAULT 'product',
  rating_overall INTEGER,
  rating_value INTEGER,
  rating_quality INTEGER,
  rating_comfort INTEGER,
  rating_family INTEGER,
  pros TEXT,
  cons TEXT,
  would_recommend TEXT,
  final_verdict TEXT,
  status TEXT DEFAULT 'draft',
  scheduled_at TEXT,
  published_at TEXT,
  updated_at TEXT,
  created_at TEXT,
  deleted_at TEXT,
  seo_title TEXT,
  seo_description TEXT,
  is_visible INTEGER DEFAULT 1,
  is_pinned INTEGER DEFAULT 0,
  is_highlighted INTEGER DEFAULT 0,
  pinned_at TEXT,
  mode TEXT DEFAULT 'story'
);

CREATE TABLE videos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  youtube_url TEXT NOT NULL,
  youtube_id TEXT UNIQUE NOT NULL,
  title TEXT,
  description TEXT,
  thumbnail_url TEXT,
  category_id INTEGER,
  is_featured INTEGER DEFAULT 0,
  status TEXT DEFAULT 'published',
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  deleted_at TEXT
);

CREATE TABLE templates (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  slug TEXT NOT NULL DEFAULT '',
  content_type TEXT NOT NULL,
  layout_data TEXT NOT NULL,
  version INTEGER DEFAULT 1,
  created_from_template_id INTEGER,
  thumbnail_asset_id INTEGER,
  user_id INTEGER,
  is_built_in INTEGER DEFAULT 0,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT,
  deleted_at TEXT
);

CREATE UNIQUE INDEX idx_templates_slug ON templates(slug);

CREATE TABLE settings (
  key TEXT PRIMARY KEY,
  value TEXT,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE pages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  content TEXT NOT NULL,
  is_visible INTEGER DEFAULT 1,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT,
  deleted_at TEXT
);

CREATE TABLE media (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  file_path TEXT NOT NULL,
  file_name TEXT,
  file_type TEXT,
  file_size INTEGER,
  folder TEXT,
  alt_text TEXT,
  caption TEXT,
  uploaded_at TEXT DEFAULT CURRENT_TIMESTAMP,
  deleted_at TEXT
);

CREATE TABLE clients (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  full_name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  how_found TEXT,
  destination TEXT,
  trip_duration_days INTEGER,
  departure_month_year TEXT,
  return_month_year TEXT,
  best_time_to_contact TEXT,
  consent_to_contact INTEGER DEFAULT 0,
  consent_given_at TEXT,
  consent_ip TEXT,
  consent_version TEXT,
  custom_statement TEXT,
  notes TEXT,
  status TEXT DEFAULT 'new',
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT,
  deleted_at TEXT,
  is_anonymized INTEGER DEFAULT 0,
  anonymized_at TEXT
);

CREATE TABLE portals (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  departure_date TEXT,
  return_date TEXT,
  is_active INTEGER DEFAULT 1,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  archived_at TEXT,
  deleted_at TEXT
);

CREATE TABLE portal_members (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  portal_id INTEGER NOT NULL,
  email TEXT NOT NULL,
  name TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  deleted_at TEXT,
  FOREIGN KEY (portal_id) REFERENCES portals(id)
);

CREATE TABLE portal_magic_links (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  portal_id INTEGER NOT NULL,
  member_id INTEGER NOT NULL,
  token TEXT UNIQUE NOT NULL,
  expires_at TEXT NOT NULL,
  used_at TEXT,
  revoked_at TEXT,
  ip_address TEXT,
  user_agent TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (portal_id) REFERENCES portals(id),
  FOREIGN KEY (member_id) REFERENCES portal_members(id)
);

CREATE TABLE portal_sessions (
  id TEXT PRIMARY KEY,
  portal_id INTEGER NOT NULL,
  member_id INTEGER NOT NULL,
  expires_at TEXT NOT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (portal_id) REFERENCES portals(id),
  FOREIGN KEY (member_id) REFERENCES portal_members(id)
);

CREATE TABLE portal_notices (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  portal_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  is_pinned INTEGER DEFAULT 0,
  is_global_announcement INTEGER DEFAULT 0,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT,
  deleted_at TEXT,
  FOREIGN KEY (portal_id) REFERENCES portals(id)
);

CREATE TABLE portal_documents (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  portal_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_name TEXT,
  file_type TEXT,
  uploaded_at TEXT DEFAULT CURRENT_TIMESTAMP,
  deleted_at TEXT,
  FOREIGN KEY (portal_id) REFERENCES portals(id)
);

CREATE TABLE portal_faqs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  portal_id INTEGER NOT NULL,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  deleted_at TEXT,
  FOREIGN KEY (portal_id) REFERENCES portals(id)
);

CREATE TABLE portal_checklist_states (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  portal_id INTEGER NOT NULL,
  member_id INTEGER NOT NULL,
  item_id TEXT NOT NULL,
  checked INTEGER DEFAULT 0,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (portal_id) REFERENCES portals(id),
  FOREIGN KEY (member_id) REFERENCES portal_members(id)
);

CREATE TABLE activity_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  action_type TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id INTEGER,
  details TEXT,
  ip_address TEXT,
  user_agent TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE email_queue (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  to_email TEXT NOT NULL,
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  attempts INTEGER DEFAULT 0,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  sent_at TEXT
);

CREATE TABLE email_suppressions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  suppressed_type TEXT NOT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE certifications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  organization TEXT,
  year_earned TEXT,
  image_path TEXT,
  display_order INTEGER DEFAULT 0,
  is_visible INTEGER DEFAULT 1,
  deleted_at TEXT
);

CREATE TABLE client_attachments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  client_id INTEGER NOT NULL,
  file_path TEXT NOT NULL,
  file_name TEXT,
  file_type TEXT,
  uploaded_at TEXT DEFAULT CURRENT_TIMESTAMP,
  deleted_at TEXT,
  FOREIGN KEY (client_id) REFERENCES clients(id)
);

CREATE TABLE client_merges (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  primary_client_id INTEGER NOT NULL,
  merged_client_id INTEGER NOT NULL,
  merged_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (primary_client_id) REFERENCES clients(id),
  FOREIGN KEY (merged_client_id) REFERENCES clients(id)
);

CREATE TABLE revisions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  content_type TEXT NOT NULL,
  content_id INTEGER NOT NULL,
  revision_data TEXT NOT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE redirects (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  old_slug TEXT UNIQUE NOT NULL,
  new_slug TEXT NOT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE related_content (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  source_type TEXT NOT NULL,
  source_id INTEGER NOT NULL,
  target_type TEXT NOT NULL,
  target_id INTEGER NOT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE post_tags (
  post_id INTEGER NOT NULL,
  tag_id INTEGER NOT NULL,
  PRIMARY KEY (post_id, tag_id)
);

CREATE TABLE guide_tags (
  guide_id INTEGER NOT NULL,
  tag_id INTEGER NOT NULL,
  PRIMARY KEY (guide_id, tag_id)
);

CREATE TABLE review_tags (
  review_id INTEGER NOT NULL,
  tag_id INTEGER NOT NULL,
  PRIMARY KEY (review_id, tag_id)
);

CREATE TABLE assets (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  file_path TEXT NOT NULL,
  asset_type TEXT NOT NULL DEFAULT 'image',
  mime_type TEXT,
  file_size INTEGER,
  width INTEGER,
  height INTEGER,
  uploaded_at TEXT DEFAULT CURRENT_TIMESTAMP,
  deleted_at TEXT
);
