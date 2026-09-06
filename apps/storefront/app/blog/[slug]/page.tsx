import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import Link from 'next/link';
import { getBlogPost } from '@/lib/catalog';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const post = await getBlogPost(params.slug).catch(() => null);
  return { title: post ? `${post.title} | MESI` : 'Post | MESI' };
}

export default async function BlogPostPage({ params }: { params: { slug: string } }) {
  let post;
  try {
    post = await getBlogPost(params.slug);
  } catch {
    notFound();
  }

  return (
    <article className="mx-auto max-w-3xl px-4 py-10">
      <Link href="/blog" className="mb-6 text-sm font-medium text-brand-600 hover:underline">
        ← Back to blog
      </Link>
      <h1 className="mb-3 text-3xl font-bold text-slate-800">{post.title}</h1>
      {post.category && (
        <div className="mb-2 text-sm font-semibold uppercase text-brand-600">{post.category.name}</div>
      )}
      {post.publishedAt && (
        <div className="mb-8 text-sm text-slate-400">
          {new Date(post.publishedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
        </div>
      )}
      <div className="prose prose-slate max-w-none whitespace-pre-line text-slate-700">{post.content}</div>
    </article>
  );
}
