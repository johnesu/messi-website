'use client';

import Link from 'next/link';
import { useFavorites } from '@/components/FavoritesProvider';
import { AddToCartButton } from '@/components/AddToCartButton';
import { FavoriteButton } from '@/components/FavoriteButton';
import { HeartIcon, ArrowRightIcon, ImagePlaceholderIcon } from '@/components/icons';
import { formatMoney } from '@/lib/api';
import { demoProducts } from '@/lib/demo-data';

export default function FavoritesPage() {
  const { favorites } = useFavorites();
  const items = demoProducts.filter((p) => favorites.includes(p.id));

  if (items.length === 0) {
    return (
      <div className="container-page py-24 text-center">
        <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-brand-50 text-accent-500">
          <HeartIcon width={44} height={44} />
        </div>
        <h1 className="mb-2 font-display text-3xl font-bold text-ink-900">No favorites yet</h1>
        <p className="mb-8 text-ink-500">Tap the heart on any piece you love and it’ll live here for later.</p>
        <Link href="/shop" className="btn-primary px-6 py-3">
          Browse the shop <ArrowRightIcon width={18} height={18} />
        </Link>
      </div>
    );
  }

  return (
    <div className="container-page py-12">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold text-ink-900">Your favorites</h1>
          <p className="mt-1 text-sm text-ink-500">{items.length} saved piece(s)</p>
        </div>
        <Link href="/shop" className="btn-outline px-5 py-2 text-sm">
          Continue shopping
        </Link>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((product) => {
          const image = product.images[0]?.url ?? product.variants[0]?.imageUrl ?? null;
          const price = product.salePrice ?? product.price;
          return (
            <div
              key={product.id}
              className="group relative flex flex-col overflow-hidden rounded-2xl border border-ink-200 bg-white shadow-card transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lift"
            >
              <div className="relative aspect-square w-full overflow-hidden bg-ink-100">
                {image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={image} alt={product.images[0]?.alt ?? product.name} loading="lazy" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-ink-300">
                    <ImagePlaceholderIcon width={56} height={56} />
                  </div>
                )}
                <div className="absolute right-3 top-3">
                  <FavoriteButton productId={product.id} />
                </div>
              </div>
              <div className="flex flex-1 flex-col p-5">
                <Link href={`/product/${product.slug}`} className="mb-1 line-clamp-1 font-semibold text-ink-900 hover:text-brand-700">
                  {product.name}
                </Link>
                {product.shortDescription && (
                  <p className="mb-3 line-clamp-1 text-xs text-ink-500">{product.shortDescription}</p>
                )}
                <div className="mt-auto flex items-center justify-between">
                  <span className="text-lg font-bold text-ink-900">{formatMoney(price)}</span>
                  <Link href={`/product/${product.slug}`} className="text-xs font-semibold text-brand-700 underline-offset-2 hover:underline">
                    View
                  </Link>
                </div>
                <div className="mt-4">
                  <AddToCartButton productId={product.id} />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}