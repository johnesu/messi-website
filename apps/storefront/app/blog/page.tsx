import Link from 'next/link';
import { getBlogPosts } from '@/lib/catalog';
import { ImagePlaceholderIcon, ArrowRightIcon } from '@/components/icons';

export const dynamic = 'force-dynamic';

export default async function BlogPage() {
  const { items } = await getBlogPosts();

  return (
    <div className="container-page py-12">
      <div className="mb-10 text-center">
        <div className="section-kicker">Stories & guides</div>
        <h1 className="font-display text-4xl font-bold text-ink-900">The MESI Blog</h1>
        <p className="mx-auto mt-2 max-w-lg text-ink-500">
          Buying guides, style tips and product stories from our team.
        </p>
      </div>

      {items.length === 0 ? (
        <p className="text-center text-ink-400">No posts yet.</p>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((post) => (
            <Link
              key={post.id}
              href={`/blog/${post.slug}`}
              className="card group flex flex-col overflow-hidden transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lift"
            >
              <div className="relative aspect-video w-full bg-ink-100">
                {post.coverImage ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={post.coverImage}
                    alt={post.title}
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-ink-300">
                    <ImagePlaceholderIcon width={56} height={56} />
                  </div>
                )}
              </div>
              <div className="flex flex-1 flex-col p-5">
                <div className="mb-2 flex items-center gap-2 text-xs">
                  {post.category && (
                    <span className="chip bg-brand-50 text-brand-700">{post.category.name}</span>
                  )}
                  {post.publishedAt && (
                    <span className="text-ink-400">
                      {new Date(post.publishedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                  )}
                </div>
                <h2 className="mb-2 font-display text-lg font-bold leading-snug text-ink-900 group-hover:text-brand-700">
                  {post.title}
                </h2>
                {post.excerpt && <p className="line-clamp-2 text-sm text-ink-500">{post.excerpt}</p>}
                <span className="mt-auto inline-flex items-center gap-1 pt-4 text-sm font-semibold text-brand-600">
                  Read more <ArrowRightIcon width={15} height={15} />
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
