'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { formatMoney } from '@/lib/api';
import { demoProducts } from '@/lib/demo-data';
import type { ProductDto } from '@/lib/types';
import { getLocalCart, subscribeLocalCart, type LocalCartItem } from '@/lib/local-cart';
import { useCart } from '@/components/CartProvider';
import { CartIcon, ImagePlaceholderIcon, ArrowRightIcon, PlusIcon } from '@/components/icons';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api';
const KEY = 'mesi_cart_session';

interface LocalLine {
  product: ProductDto;
  quantity: number;
  lineTotal: number;
}

function buildLocalView(items: LocalCartItem[]): {
  itemCount: number;
  subtotal: number;
  discount: number;
  shipping: number;
  tax: number;
  total: number;
  lines: LocalLine[];
  local: boolean;
} {
  const lines: LocalLine[] = [];
  let subtotal = 0;
  for (const line of items) {
    const product = demoProducts.find((p) => p.id === line.productId);
    if (!product) continue;
    const price = product.salePrice ?? product.price;
    const lineTotal = price * line.quantity;
    subtotal += lineTotal;
    lines.push({ product, quantity: line.quantity, lineTotal });
  }
  const shipping = subtotal >= 15000000 ? 0 : 500000;
  const tax = Math.round(subtotal * 0.05);
  return {
    itemCount: items.reduce((n, i) => n + i.quantity, 0),
    subtotal,
    discount: 0,
    shipping,
    tax,
    total: subtotal + shipping + tax,
    lines,
    local: true,
  };
}

type CartView = ReturnType<typeof buildLocalView> & { items: LocalLine[] };

export default function CartPage() {
  const { updateQuantity, removeItem, clear, refresh } = useCart();
  const [cart, setCart] = useState<CartView | null>(null);

  const load = useCallback(async () => {
    const sk = window.localStorage.getItem(KEY);
    if (!sk) {
      setCart(null);
      return;
    }
    try {
      const res = await fetch(`${API}/cart?sessionKey=${encodeURIComponent(sk)}`, { signal: AbortSignal.timeout(3500) });
      const body = await res.json();
      if (body?.success && body.data) {
        const d = body.data;
        setCart({
          itemCount: d.itemCount ?? 0,
          subtotal: d.subtotal ?? 0,
          discount: d.discount ?? 0,
          shipping: d.shipping ?? 0,
          tax: d.tax ?? 0,
          total: d.total ?? 0,
          lines: (d.items ?? []).map((line: any) => ({
            product: line.product,
            quantity: line.quantity,
            lineTotal: line.lineTotal,
          })),
          items: (d.items ?? []).map((line: any) => ({
            product: line.product,
            quantity: line.quantity,
            lineTotal: line.lineTotal,
          })),
          local: false,
        });
        return;
      }
    } catch {
      /* API down — fall back to local cart */
    }
    const view = buildLocalView(getLocalCart());
    setCart(view ? { ...view, items: view.lines } : null);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const unsub = subscribeLocalCart(() => {
      const view = buildLocalView(getLocalCart());
      setCart(view ? { ...view, items: view.lines } : null);
    });
    return unsub;
  }, []);

  if (!cart || cart.items.length === 0) {
    return (
      <div className="container-page py-24 text-center">
        <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-brand-50 text-accent-500">
          <CartIcon width={44} height={44} />
        </div>
        <h1 className="mb-2 font-display text-3xl font-bold text-ink-900">Your cart is empty</h1>
        <p className="mb-8 text-ink-500">Add some pieces and they’ll show up here ready for checkout.</p>
        <Link href="/shop" className="btn-primary px-6 py-3">
          Start shopping <ArrowRightIcon width={18} height={18} />
        </Link>
      </div>
    );
  }

  return (
    <div className="container-page max-w-5xl py-12">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="font-display text-3xl font-bold text-ink-900">Shopping cart</h1>
        <span className="text-sm text-ink-500">
          {cart.itemCount} item(s)
          {cart.local && <span className="ml-2 rounded-full bg-brand-50 px-2 py-0.5 text-xs font-medium text-brand-700">offline</span>}
        </span>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="divide-y divide-ink-200 overflow-hidden rounded-2xl border border-ink-200 bg-white shadow-card">
            {cart.items.map((line) => (
              <div key={line.product.id} className="flex items-center gap-4 p-4">
                <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-ink-100">
                  {line.product.images[0]?.url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={line.product.images[0].url} alt={line.product.name} className="h-full w-full object-cover" />
                  ) : (
                    <ImagePlaceholderIcon className="text-ink-300" />
                  )}
                </div>
                <div className="flex-1">
                  <Link href={`/product/${line.product.slug}`} className="font-semibold text-ink-900 hover:text-brand-700">
                    {line.product.name}
                  </Link>
                  <div className="mt-2 flex items-center gap-3">
                    <span className="inline-flex items-center gap-2 rounded-lg border border-ink-200 px-2 py-1">
                      <button
                        type="button"
                        onClick={() => updateQuantity(line.product.id, line.quantity - 1)}
                        className="flex h-6 w-6 items-center justify-center rounded bg-ink-100 text-ink-700 hover:bg-ink-200"
                      >
                        −
                      </button>
                      <span className="w-6 text-center text-sm font-semibold">{line.quantity}</span>
                      <button
                        type="button"
                        onClick={() => updateQuantity(line.product.id, line.quantity + 1)}
                        className="flex h-6 w-6 items-center justify-center rounded bg-ink-100 text-ink-700 hover:bg-ink-200"
                      >
                        <PlusIcon width={14} height={14} />
                      </button>
                    </span>
                    <button
                      type="button"
                      onClick={() => removeItem(line.product.id)}
                      className="text-xs font-medium text-ink-400 underline-offset-2 hover:text-accent-600 hover:underline"
                    >
                      Remove
                    </button>
                  </div>
                  <div className="mt-1 text-xs text-ink-400">Unit {formatMoney(line.product.salePrice ?? line.product.price)}</div>
                </div>
                <div className="font-bold text-ink-900">{formatMoney(line.lineTotal)}</div>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={clear}
            className="mt-4 text-sm font-medium text-ink-400 underline-offset-2 hover:text-accent-600 hover:underline"
          >
            Clear cart
          </button>
        </div>

        <div className="h-fit rounded-2xl border border-ink-200 bg-white p-6 shadow-card">
          <h2 className="mb-4 font-display text-lg font-bold text-ink-900">Order summary</h2>
          <div className="space-y-2.5 text-sm">
            <div className="flex justify-between text-ink-600">
              <span>Subtotal</span>
              <span>{formatMoney(cart.subtotal)}</span>
            </div>
            {cart.discount > 0 && (
              <div className="flex justify-between text-green-600">
                <span>Discount</span>
                <span>-{formatMoney(cart.discount)}</span>
              </div>
            )}
            <div className="flex justify-between text-ink-600">
              <span>Shipping</span>
              <span>{formatMoney(cart.shipping)}</span>
            </div>
            <div className="flex justify-between text-ink-600">
              <span>Tax</span>
              <span>{formatMoney(cart.tax)}</span>
            </div>
          </div>
          <div className="mt-4 flex justify-between border-t border-ink-200 pt-4 text-base font-bold text-ink-900">
            <span>Total</span>
            <span>{formatMoney(cart.total)}</span>
          </div>
          <Link href="/checkout" className="btn-primary mt-6 w-full py-3 text-center">
            Proceed to checkout
          </Link>
          <button className="btn-ghost mt-2 w-full text-sm" onClick={() => { void refresh(); void load(); }}>
            Refresh
          </button>
        </div>
      </div>
    </div>
  );
}
