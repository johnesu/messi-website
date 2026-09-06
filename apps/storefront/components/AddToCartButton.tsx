'use client';

import { useState } from 'react';
import { useCart } from '@/components/CartProvider';

export function AddToCartButton({ productId }: { productId: string }) {
  const { addToCart } = useCart();
  const [added, setAdded] = useState(false);
  const [loading, setLoading] = useState(false);

  return (
    <button
      className="btn-primary w-full py-3"
      disabled={loading}
      onClick={async () => {
        setLoading(true);
        try {
          await addToCart(productId);
          setAdded(true);
          setTimeout(() => setAdded(false), 2000);
        } finally {
          setLoading(false);
        }
      }}
    >
      {added ? 'Added to cart ✓' : loading ? 'Adding…' : 'Add to cart'}
    </button>
  );
}
