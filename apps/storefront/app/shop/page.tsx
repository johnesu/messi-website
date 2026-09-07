import Link from 'next/link';
import { getProducts } from '@/lib/catalog';
import type { ProductDto } from '@/lib/types';
import { ProductGrid } from '@/components/ProductGrid';
import { SearchIcon, ArrowRightIcon } from '@/components/icons';

const SHOP_VIDEO =
  'https://v.pinimg.com/videos/iht/expMp4/f5/b9/8e/f5b98ebab363fcfea183433e8cd65089_720w.mp4';

export const dynamic = 'force-dynamic';

export default async function ShopPage({
  searchParams,
}: {
  searchParams: { q?: string; page?: string };
}) {
  const page = Number(searchParams.page) || 1;
  let items: ProductDto[] = [];
  let meta = { total: 0, page, limit: 12, totalPages: 0 };
  try {
    const res = await getProducts({ page, limit: 12, q: searchParams.q });
    items = res.items;
    meta = res.meta;
  } catch {
    items = [];
  }

  return (
    <>
      <section className="relative overflow-hidden bg-ink-950 text-white">
        <div className="absolute inset-0" aria-hidden="true">
          <video
            src={SHOP_VIDEO}
            className="absolute inset-0 h-full w-full object-cover"
            autoPlay
            loop
            muted
            playsInline
            preload="metadata"
          />
        </div>
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-ink-950/90 via-ink-950/60 to-ink-950/30" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-ink-950/80 to-transparent" />

        <div className="container-page relative pt-14 pb-16 md:pt-20 md:pb-24">
          <nav className="mb-4 text-sm text-white/70">
            <Link href="/" className="hover:text-white">Home</Link>
            <span className="mx-2">/</span>
            <span className="text-white">Shop</span>
          </nav>
          <h1 className="font-display text-4xl font-extrabold text-white drop-shadow md:text-5xl">
            {searchParams.q ? `Results for “${searchParams.q}”` : 'Shop the Collection'}
          </h1>
          <p className="mt-2 max-w-2xl text-lg text-white/85">
            {searchParams.q
              ? `${meta.total} product(s) found.`
              : 'Handcrafted couture, ready-to-wear and bespoke pieces from the MESI atelier.'}
          </p>
        </div>
      </section>

      <div className="container-page py-10">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <p className="text-sm text-ink-500">{meta.total} product(s)</p>
          <form action="/shop" method="get" role="search" className="flex max-w-sm gap-2 sm:w-80">
            <div className="relative flex-1">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-400">
                <SearchIcon width={18} height={18} />
              </span>
              <input name="q" defaultValue={searchParams.q} placeholder="Search…" className="input pl-10" />
            </div>
            <button className="btn-primary">Go</button>
          </form>
        </div>

        {items.length ? (
        <ProductGrid products={items} />
      ) : (
        <div className="rounded-2xl border border-dashed border-ink-300 py-16 text-center">
          <p className="mb-2 font-semibold text-ink-700">No products found</p>
          <p className="mb-6 text-sm text-ink-500">Try a different search or browse the full catalogue.</p>
          <Link href="/shop" className="btn-outline">
            Clear search <ArrowRightIcon width={16} height={16} />
          </Link>
        </div>
      )}

      {meta.totalPages > 1 && (
        <div className="mt-10 flex justify-center gap-2">
          {Array.from({ length: meta.totalPages }, (_, i) => i + 1).map((p) => (
            <a
              key={p}
              href={`/shop?page=${p}${searchParams.q ? `&q=${encodeURIComponent(searchParams.q)}` : ''}`}
              className={`flex h-10 w-10 items-center justify-center rounded-lg text-sm font-medium transition-colors ${
                p === page
                  ? 'bg-accent-500 text-white shadow-sm'
                  : 'border border-ink-200 bg-white text-ink-600 hover:border-accent-500 hover:text-accent-600'
              }`}
            >
              {p}
            </a>
          ))}
        </div>
      )}
    </div>
    </>
  );
}
