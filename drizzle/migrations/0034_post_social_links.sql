-- Per-post companion links: an Instagram post/reel and a YouTube video
-- that go with the post. Additive and nullable; existing posts are
-- unaffected.
ALTER TABLE posts ADD COLUMN instagram_url TEXT;
ALTER TABLE posts ADD COLUMN youtube_url TEXT;
