import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import Link from 'next/link';
import { getCategory, getProducts } from '@/lib/catalog';
import type { ProductDto } from '@mesi/types';
import { ProductGrid } from '@/components/ProductGrid';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const cat = await getCategory(params.slug).catch(() => null);
  return { title: cat ? `${cat.name} | MESI` : 'Category | MESI' };
}

export default async function CategoryPage({ params }: { params: { slug: string } }) {
  let category;
  try {
    category = await getCategory(params.slug);
  } catch {
    notFound();
  }

  const { items } = await getProducts({ limit: 24, category: params.slug }).catch(() => ({
    items: [] as ProductDto[],
  }));

  return (
    <>
      <section className="relative overflow-hidden bg-ink-950">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={category.imageUrl ?? `https://picsum.photos/seed/cat-${category.slug}/1200/320`}
          alt={category.name}
          className="absolute inset-0 h-full w-full object-cover opacity-30"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-ink-950 via-ink-950/80 to-ink-950/40" />
        <div className="container-page relative py-16 text-white">
          <nav className="mb-4 text-sm text-white/60">
            <Link href="/" className="hover:text-white">Home</Link>
            <span className="mx-2">/</span>
            <Link href="/shop" className="hover:text-white">Shop</Link>
            <span className="mx-2">/</span>
            <span className="text-white">{category.name}</span>
          </nav>
          <h1 className="mb-2 font-display text-4xl font-bold">{category.name}</h1>
          {category.description && <p className="max-w-lg text-white/80">{category.description}</p>}
          <div className="mt-4">
            <span className="inline-flex items-center rounded-full bg-white/15 px-3 py-1 text-xs font-semibold backdrop-blur">
              {items.length} product(s)
            </span>
          </div>
        </div>
      </section>

      <div className="container-page py-12">
        {items.length ? (
          <ProductGrid products={items} />
        ) : (
          <p className="rounded-2xl border border-dashed border-ink-300 py-16 text-center text-ink-500">
            No products in this category yet.
          </p>
        )}
      </div>
    </>
  );
}
