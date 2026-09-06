import type { ProductDto } from '@mesi/types';
import { ProductCard } from './ProductCard';
import { FadeIn } from './motion';

export function ProductGrid({ products }: { products: ProductDto[] }) {
  if (!products.length) {
    return <p className="py-10 text-center text-slate-400">No products found.</p>;
  }
  return (
    <FadeIn>
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
      {products.map((p) => (
        <ProductCard key={p.id} product={p} />
      ))}
    </div>
    </FadeIn>
  );
}
