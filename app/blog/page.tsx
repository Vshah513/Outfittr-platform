import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import Link from 'next/link';
import type { Metadata } from 'next';
import { getServiceSupabase } from '@/lib/db';
import type { BlogPost } from '@/types';

export const metadata: Metadata = {
  title: 'Blog | Outfittr - Secondhand Fashion Stories',
  description: 'Read stories about fashion, sustainability, thrifting tips, and the Outfittr community in Kenya.',
  keywords: ['thrift blog', 'secondhand fashion', 'sustainable fashion', 'kenya fashion', 'vintage style', 'fashion tips'],
};

async function getBlogPosts(): Promise<BlogPost[]> {
  const supabase = getServiceSupabase();
  if (!supabase) return [];

  const { data } = await supabase
    .from('blog_posts')
    .select(`
      *,
      author:users!blog_posts_author_id_fkey(id, full_name, avatar_url)
    `)
    .eq('status', 'published')
    .not('published_at', 'is', null)
    .order('published_at', { ascending: false });

  return data || [];
}

export default async function BlogPage() {
  const posts = await getBlogPosts();

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#f7f4ee' }}>
      <Navbar />
      
      <main className="flex-1">
        <section className="max-w-4xl mx-auto px-6 md:px-8 pt-16 md:pt-24 pb-20">
          <h1 className="font-editorial text-4xl md:text-5xl font-medium text-[#2D2A26] mb-4 leading-tight">
            Blog
          </h1>
          
          <p className="text-base md:text-lg text-[#2D2A26] leading-relaxed mb-12" style={{ lineHeight: '1.75' }}>
            Stories about fashion, sustainability, and the Outfittr community.
          </p>

          {posts.length === 0 ? (
            <p className="text-[#6B6560] text-center py-12">
              No blog posts yet. Check back soon!
            </p>
          ) : (
            <div className="space-y-12">
              {posts.map((post) => (
                <article key={post.id} className="border-b border-[#E0DCD4] pb-12 last:border-b-0">
                  <Link href={`/blog/${post.slug}`} className="block group">
                    {post.featured_image_url && (
                      <div className="mb-6 aspect-video overflow-hidden rounded-lg bg-gray-100">
                        <img
                          src={post.featured_image_url}
                          alt={post.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                    )}
                    
                    <h2 className="font-editorial text-2xl md:text-3xl font-medium text-[#2D2A26] mb-3 group-hover:text-[#6B6560] transition-colors">
                      {post.title}
                    </h2>
                    
                    {post.excerpt && (
                      <p className="text-base text-[#6B6560] mb-4 leading-relaxed" style={{ lineHeight: '1.75' }}>
                        {post.excerpt}
                      </p>
                    )}
                    
                    <div className="flex items-center gap-4 text-sm text-[#8C8680]">
                      {post.published_at && (
                        <time dateTime={post.published_at}>
                          {new Date(post.published_at).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          })}
                        </time>
                      )}
                      {post.author && (
                        <span>by {post.author.full_name}</span>
                      )}
                    </div>
                  </Link>
                </article>
              ))}
            </div>
          )}
        </section>
      </main>

      <Footer />
    </div>
  );
}

