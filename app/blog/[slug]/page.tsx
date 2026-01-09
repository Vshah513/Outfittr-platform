import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getServiceSupabase } from '@/lib/db';
import type { BlogPost } from '@/types';

async function getBlogPost(slug: string): Promise<BlogPost | null> {
  const supabase = getServiceSupabase();
  if (!supabase) return null;

  const { data } = await supabase
    .from('blog_posts')
    .select(`
      *,
      author:users!blog_posts_author_id_fkey(id, full_name, avatar_url)
    `)
    .eq('slug', slug)
    .eq('status', 'published')
    .not('published_at', 'is', null)
    .single();

  return data || null;
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const post = await getBlogPost(params.slug);

  if (!post) {
    return {
      title: 'Post Not Found | Outfittr Blog',
    };
  }

  return {
    title: post.meta_title || post.title,
    description: post.meta_description || post.excerpt || `Read ${post.title} on Outfittr blog.`,
    keywords: post.keywords || ['outfittr', 'secondhand fashion', 'kenya'],
    openGraph: {
      title: post.meta_title || post.title,
      description: post.meta_description || post.excerpt || '',
      images: post.featured_image_url ? [post.featured_image_url] : [],
      type: 'article',
      publishedTime: post.published_at || undefined,
    },
  };
}

// Content parser to handle headings, lists, and paragraphs
function parseContent(content: string) {
  const lines = content.split('\n');
  const elements: Array<{ type: 'h2' | 'p' | 'ul' | 'ol' | 'empty'; content: string | string[] }> = [];
  let currentList: string[] | null = null;
  let listType: 'ul' | 'ol' | null = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Detect H2 (starts with ## or is all caps and short)
    if (line.startsWith('## ')) {
      if (currentList) {
        elements.push({ type: listType!, content: currentList });
        currentList = null;
        listType = null;
      }
      elements.push({ type: 'h2', content: line.replace(/^##\s+/, '') });
    }
    // Detect unordered list (starts with - or *)
    else if (line.match(/^[-*]\s+/)) {
      if (listType !== 'ul') {
        if (currentList && listType) {
          elements.push({ type: listType, content: currentList });
        }
        currentList = [];
        listType = 'ul';
      }
      currentList!.push(line.replace(/^[-*]\s+/, ''));
    }
    // Detect ordered list (starts with number.)
    else if (line.match(/^\d+\.\s+/)) {
      if (listType !== 'ol') {
        if (currentList && listType) {
          elements.push({ type: listType, content: currentList });
        }
        currentList = [];
        listType = 'ol';
      }
      currentList!.push(line.replace(/^\d+\.\s+/, ''));
    }
    // Empty line
    else if (line === '') {
      if (currentList) {
        elements.push({ type: listType!, content: currentList });
        currentList = null;
        listType = null;
      }
      elements.push({ type: 'empty', content: '' });
    }
    // Regular paragraph
    else {
      if (currentList) {
        elements.push({ type: listType!, content: currentList });
        currentList = null;
        listType = null;
      }
      elements.push({ type: 'p', content: line });
    }
  }

  // Close any open list
  if (currentList) {
    elements.push({ type: listType!, content: currentList });
  }

  return elements;
}

export default async function BlogPostPage({ params }: { params: { slug: string } }) {
  const post = await getBlogPost(params.slug);

  if (!post) {
    notFound();
  }

  const contentElements = parseContent(post.content);

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#f7f4ee' }}>
      <Navbar />
      
      <main className="flex-1">
        <article 
          className="mx-auto pt-16 md:pt-24 pb-20 px-6 md:px-12 lg:px-16"
          style={{ 
            maxWidth: '70ch',
          }}
        >
          {/* Header */}
          <header className="mb-12 md:mb-16">
            {/* H1 - Serif, 48-60px, 1.05 line-height */}
            <h1 
              className="font-editorial font-medium text-[#2D2A26] mb-6"
              style={{
                fontSize: 'clamp(48px, 5vw, 60px)',
                lineHeight: '1.05',
              }}
            >
              {post.title}
            </h1>
            
            {/* Meta line - 14px muted */}
            <div 
              className="flex items-center gap-4 text-[#8C8680] mb-8"
              style={{ fontSize: '14px' }}
            >
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

            {/* Featured image - 3:2 or 16:9, fits column, low-contrast */}
            {post.featured_image_url && (
              <div 
                className="mb-8 overflow-hidden bg-gray-100"
                style={{ 
                  aspectRatio: '16 / 9',
                  filter: 'contrast(0.95)',
                }}
              >
                <img
                  src={post.featured_image_url}
                  alt=""
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            {/* Lead paragraph - 18-20px / 1.7, not italic */}
            {post.excerpt && (
              <p 
                className="text-[#2D2A26] mb-8"
                style={{ 
                  fontSize: 'clamp(18px, 2vw, 20px)',
                  lineHeight: '1.7',
                }}
              >
                {post.excerpt}
              </p>
            )}
          </header>

          {/* Thin hairline divider after lead */}
          <div 
            className="w-full mb-12 md:mb-16"
            style={{ 
              height: '1px',
              backgroundColor: '#E0DCD4',
            }}
          />

          {/* Content */}
          <div className="text-[#2D2A26]">
            {contentElements.map((element, index) => {
              // Skip empty lines that are followed by other empty lines or are at the start
              if (element.type === 'empty') {
                const nextElement = contentElements[index + 1];
                if (nextElement?.type === 'empty' || index === 0) {
                  return null;
                }
                return null; // Don't render empty lines
              }

              // H2 - 24-28px with 48-64px top spacing
              if (element.type === 'h2') {
                return (
                  <h2
                    key={index}
                    className="font-sans font-semibold mb-4"
                    style={{
                      fontSize: 'clamp(24px, 2.5vw, 28px)',
                      marginTop: 'clamp(48px, 5vw, 64px)',
                    }}
                  >
                    {element.content as string}
                  </h2>
                );
              }

              // Paragraphs - 16-18px / 1.8, spacing 16-20px
              if (element.type === 'p') {
                return (
                  <p
                    key={index}
                    className="font-sans mb-4 md:mb-5"
                    style={{
                      fontSize: 'clamp(16px, 1.8vw, 18px)',
                      lineHeight: '1.8',
                    }}
                  >
                    {element.content as string}
                  </p>
                );
              }

              // Lists - 8-10px spacing between items
              if (element.type === 'ul' || element.type === 'ol') {
                const ListTag = element.type;
                return (
                  <ListTag
                    key={index}
                    className="font-sans mb-4 md:mb-5 pl-6"
                    style={{
                      fontSize: 'clamp(16px, 1.8vw, 18px)',
                      lineHeight: '1.8',
                    }}
                  >
                    {(element.content as string[]).map((item, itemIndex) => (
                      <li
                        key={itemIndex}
                        style={{
                          marginBottom: '8px',
                        }}
                      >
                        {item}
                      </li>
                    ))}
                  </ListTag>
                );
              }

              return null;
            })}
          </div>

          {/* Footer - Section spacing 48-64px */}
          {post.keywords && post.keywords.length > 0 && (
            <div 
              className="pt-8 border-t border-[#E0DCD4]"
              style={{ 
                marginTop: 'clamp(48px, 5vw, 64px)',
              }}
            >
              <p 
                className="text-xs tracking-[0.2em] uppercase text-[#6B6560] mb-3 font-medium"
                style={{ fontSize: '14px' }}
              >
                Keywords
              </p>
              <div className="flex flex-wrap gap-2">
                {post.keywords.map((keyword, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 text-xs bg-[#E8E4DC] text-[#6B6560] rounded-full"
                  >
                    {keyword}
                  </span>
                ))}
              </div>
            </div>
          )}
        </article>
      </main>

      <Footer />
    </div>
  );
}

