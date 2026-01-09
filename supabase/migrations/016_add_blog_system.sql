-- =============================================
-- BLOG SYSTEM
-- Admin-only blog posts with SEO support
-- =============================================

-- Add is_admin field to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE;

-- Create blog_posts table
CREATE TABLE IF NOT EXISTS blog_posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(200) NOT NULL,
  slug VARCHAR(200) UNIQUE NOT NULL,
  excerpt TEXT,
  content TEXT NOT NULL,
  author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  featured_image_url TEXT,
  meta_title VARCHAR(200),
  meta_description TEXT,
  keywords TEXT[], -- Array of keywords for SEO
  status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  published_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- For future extensibility: allow user posts
  is_user_post BOOLEAN DEFAULT FALSE,
  user_post_author_id UUID REFERENCES users(id) ON DELETE SET NULL
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_blog_posts_slug ON blog_posts(slug);
CREATE INDEX IF NOT EXISTS idx_blog_posts_status ON blog_posts(status);
CREATE INDEX IF NOT EXISTS idx_blog_posts_published ON blog_posts(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_blog_posts_author ON blog_posts(author_id);
CREATE INDEX IF NOT EXISTS idx_blog_posts_keywords ON blog_posts USING GIN(keywords); -- GIN index for array search

-- RLS Policies
ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (for re-running migration)
DROP POLICY IF EXISTS "Published blog posts are viewable by everyone" ON blog_posts;
DROP POLICY IF EXISTS "Admins can view all blog posts" ON blog_posts;
DROP POLICY IF EXISTS "Only admins can create blog posts" ON blog_posts;
DROP POLICY IF EXISTS "Only admins can update blog posts" ON blog_posts;
DROP POLICY IF EXISTS "Only admins can delete blog posts" ON blog_posts;

-- Anyone can view published posts
CREATE POLICY "Published blog posts are viewable by everyone" 
  ON blog_posts FOR SELECT 
  USING (status = 'published');

-- Admins can view all posts
CREATE POLICY "Admins can view all blog posts" 
  ON blog_posts FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = (SELECT auth.uid()) 
      AND users.is_admin = TRUE
    )
  );

-- Only admins can create posts
CREATE POLICY "Only admins can create blog posts" 
  ON blog_posts FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = (SELECT auth.uid()) 
      AND users.is_admin = TRUE
    )
  );

-- Only admins can update posts
CREATE POLICY "Only admins can update blog posts" 
  ON blog_posts FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = (SELECT auth.uid()) 
      AND users.is_admin = TRUE
    )
  );

-- Only admins can delete posts
CREATE POLICY "Only admins can delete blog posts" 
  ON blog_posts FOR DELETE 
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = (SELECT auth.uid()) 
      AND users.is_admin = TRUE
    )
  );

-- Trigger for updated_at
CREATE TRIGGER update_blog_posts_updated_at 
  BEFORE UPDATE ON blog_posts
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Function to generate slug from title
CREATE OR REPLACE FUNCTION generate_blog_slug(title_text TEXT)
RETURNS TEXT AS $$
DECLARE
  slug_text TEXT;
  counter INTEGER := 0;
BEGIN
  -- Convert to lowercase, replace spaces with hyphens, remove special chars
  slug_text := lower(regexp_replace(title_text, '[^a-z0-9]+', '-', 'gi'));
  slug_text := trim(both '-' from slug_text);
  
  -- Check if slug exists, append number if needed
  WHILE EXISTS (SELECT 1 FROM blog_posts WHERE slug = slug_text) LOOP
    counter := counter + 1;
    slug_text := lower(regexp_replace(title_text, '[^a-z0-9]+', '-', 'gi')) || '-' || counter;
    slug_text := trim(both '-' from slug_text);
  END LOOP;
  
  RETURN slug_text;
END;
$$ LANGUAGE plpgsql;

