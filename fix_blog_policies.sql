-- Quick fix for existing policies
-- Run this if you got the "policy already exists" error

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Published blog posts are viewable by everyone" ON blog_posts;
DROP POLICY IF EXISTS "Admins can view all blog posts" ON blog_posts;
DROP POLICY IF EXISTS "Only admins can create blog posts" ON blog_posts;
DROP POLICY IF EXISTS "Only admins can update blog posts" ON blog_posts;
DROP POLICY IF EXISTS "Only admins can delete blog posts" ON blog_posts;

-- Recreate the policies
CREATE POLICY "Published blog posts are viewable by everyone" 
  ON blog_posts FOR SELECT 
  USING (status = 'published');

CREATE POLICY "Admins can view all blog posts" 
  ON blog_posts FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = (SELECT auth.uid()) 
      AND users.is_admin = TRUE
    )
  );

CREATE POLICY "Only admins can create blog posts" 
  ON blog_posts FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = (SELECT auth.uid()) 
      AND users.is_admin = TRUE
    )
  );

CREATE POLICY "Only admins can update blog posts" 
  ON blog_posts FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = (SELECT auth.uid()) 
      AND users.is_admin = TRUE
    )
  );

CREATE POLICY "Only admins can delete blog posts" 
  ON blog_posts FOR DELETE 
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = (SELECT auth.uid()) 
      AND users.is_admin = TRUE
    )
  );

