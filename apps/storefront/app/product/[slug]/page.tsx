import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import Link from 'next/link';
import { getProduct, getCategories } from '@/lib/catalog';
import { formatMoney } from '@/lib/api';
import { AddToCartButton } from '@/components/AddToCartButton';
import { StarIcon, TruckIcon, RefreshIcon, ShieldIcon, ImagePlaceholderIcon } from '@/components/icons';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const product = await getProduct(params.slug).catch(() => null);
  return {
    title: product ? `${product.name} | MESI` : 'Product | MESI',
    description: product?.seoDescription ?? product?.shortDescription ?? undefined,
  };
}

export default async function ProductPage({ params }: { params: { slug: string } }) {
  let product;
  try {
    product = await getProduct(params.slug);
  } catch {
    notFound();
  }

  const price = product.salePrice ?? product.price;
  const onSale = product.salePrice != null && product.salePrice < product.price;
  const discount = onSale ? Math.round((1 - (product.salePrice ?? 0) / product.price) * 100) : 0;
  const image = product.images[0]?.url ?? product.variants[0]?.imageUrl ?? null;
  const mainCategoryId = product.categoryIds[0];
  const categories = await getCategories().catch(() => []);
  const mainCategory = categories.find((c) => c.id === mainCategoryId);

  return (
    <div className="container-page py-10">
      <nav className="mb-6 flex flex-wrap items-center gap-1 text-sm text-ink-400">
        <Link href="/" className="hover:text-brand-600">Home</Link>
        <span>/</span>
        <Link href="/shop" className="hover:text-brand-600">Shop</Link>
        {mainCategory && (
          <>
            <span>/</span>
            <Link href={`/category/${mainCategory.slug}`} className="hover:text-brand-600">{mainCategory.name}</Link>
          </>
        )}
        <span>/</span>
        <span className="text-ink-700">{product.name}</span>
      </nav>

      <div className="grid gap-10 lg:grid-cols-2">
        <div className="overflow-hidden rounded-2xl border border-ink-200 bg-ink-100">
          {image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={image}
              alt={product.images[0]?.alt ?? product.name}
              className="aspect-square w-full object-cover"
            />
          ) : (
            <div className="flex aspect-square w-full items-center justify-center text-ink-300">
              <ImagePlaceholderIcon width={96} height={96} />
            </div>
          )}
        </div>

        <div>
          <div className="mb-3 flex items-center gap-2">
            {onSale && (
              <span className="chip bg-accent-500 text-white">Sale -{discount}%</span>
            )}
            {product.featured && (
              <span className="chip bg-ink-900 text-white">Featured</span>
            )}
          </div>

          <h1 className="mb-3 font-display text-3xl font-bold leading-tight text-ink-900">{product.name}</h1>
          <p className="mb-4 text-sm text-ink-500">SKU: {product.sku}</p>

          <div className="mb-5 flex items-center gap-2">
            <span className="flex items-center gap-0.5 text-amber-500">
              {Array.from({ length: 5 }).map((_, i) => (
                <StarIcon key={i} width={18} height={18} fill={i < Math.round(product.rating) ? 'currentColor' : 'none'} stroke="currentColor" />
              ))}
            </span>
            <span className="text-sm font-medium text-ink-700">{product.rating.toFixed(1)}</span>
            <span className="text-sm text-ink-400">· {product.reviewCount} review(s)</span>
          </div>

          <div className="mb-6 flex items-baseline gap-3">
            <span className="text-4xl font-extrabold tracking-tight text-ink-900">{formatMoney(price)}</span>
            {onSale && (
              <span className="text-xl text-ink-400 line-through">{formatMoney(product.price)}</span>
            )}
          </div>

          {product.shortDescription && (
            <p className="mb-6 text-ink-600">{product.shortDescription}</p>
          )}

          <div className="mb-6 grid grid-cols-3 gap-3">
            <div className="flex flex-col items-center gap-1 rounded-xl border border-ink-200 p-3 text-center">
              <TruckIcon className="text-accent-500" />
              <span className="text-xs text-ink-600">Free delivery over ₦150k</span>
            </div>
            <div className="flex flex-col items-center gap-1 rounded-xl border border-ink-200 p-3 text-center">
              <RefreshIcon className="text-accent-500" />
              <span className="text-xs text-ink-600">30-day returns</span>
            </div>
            <div className="flex flex-col items-center gap-1 rounded-xl border border-ink-200 p-3 text-center">
              <ShieldIcon className="text-accent-500" />
              <span className="text-xs text-ink-600">Secure checkout</span>
            </div>
          </div>

          <AddToCartButton productId={product.id} />

          {product.description && (
            <div className="mt-10 border-t border-ink-200 pt-6">
              <h2 className="mb-3 font-display text-lg font-semibold text-ink-900">Product description</h2>
              <p className="whitespace-pre-line leading-relaxed text-ink-600">{product.description}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
