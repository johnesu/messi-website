import Link from 'next/link';
import type { ProductDto } from '@/lib/types';
import { formatMoney } from '@/lib/api';
import { StarIcon, ImagePlaceholderIcon } from './icons';
import { TiltCard } from './motion';
import { FavoriteButton } from './FavoriteButton';

export function ProductCard({ product }: { product: ProductDto }) {
  const image = product.images[0]?.url ?? product.variants[0]?.imageUrl ?? null;
  const price = product.salePrice ?? product.price;
  const onSale = product.salePrice != null && product.salePrice < product.price;
  const discount = onSale ? Math.round((1 - (product.salePrice ?? 0) / product.price) * 100) : 0;

  return (
    <TiltCard maxTilt={8} className="h-full">
    <Link
      href={`/product/${product.slug}`}
      className="group card relative flex flex-col transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lift"
    >
      <div className="relative aspect-square w-full overflow-hidden bg-ink-100">
        {image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={image}
            alt={product.images[0]?.alt ?? product.name}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-ink-300">
            <ImagePlaceholderIcon width={56} height={56} />
          </div>
        )}

        <div className="absolute left-3 top-3 flex flex-col gap-1.5">
          {onSale && (
            <span className="chip bg-accent-500 px-2 py-0.5 text-[11px] font-bold text-white">-{discount}%</span>
          )}
          {product.featured && (
            <span className="chip bg-brand-900/90 px-2 py-0.5 text-[11px] font-semibold text-white">Featured</span>
          )}
        </div>

        <span className="absolute right-3 top-3 opacity-0 transition-all duration-200 group-hover:opacity-100">
          <FavoriteButton productId={product.id} />
        </span>
      </div>

      <div className="flex flex-1 flex-col p-4">
        <div className="mb-1 line-clamp-1 text-sm font-semibold text-ink-900">{product.name}</div>
        {product.shortDescription && (
          <p className="mb-2 line-clamp-1 text-xs text-ink-500">{product.shortDescription}</p>
        )}

        <div className="mb-3 flex items-center gap-1 text-amber-500">
          <StarIcon width={14} height={14} />
          <span className="text-xs font-medium text-ink-700">{product.rating.toFixed(1)}</span>
          {product.reviewCount > 0 && (
            <span className="text-xs text-ink-400">({product.reviewCount})</span>
          )}
        </div>

        <div className="mt-auto flex items-baseline justify-between">
          <div className="flex items-baseline gap-2">
            <span className="text-lg font-bold text-ink-900">{formatMoney(price)}</span>
            {onSale && (
              <span className="text-sm text-ink-400 line-through">{formatMoney(product.price)}</span>
            )}
          </div>
        </div>
      </div>
    </Link>
    </TiltCard>
  );
}
