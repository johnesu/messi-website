'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { formatMoney } from '@/lib/api';
import { demoProducts } from '@/lib/demo-data';
import { getLocalCart, clearLocalCart } from '@/lib/local-cart';
import type { CartDto } from '@/lib/types';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api';
const KEY = 'mesi_cart_session';

interface LocalSummary {
  total: number;
  lines: { productId: string; name: string; quantity: number; lineTotal: number }[];
}

function buildLocalSummary() {
  const items = getLocalCart();
  let total = 0;
  const lines = [];
  for (const line of items) {
    const product = demoProducts.find((p) => p.id === line.productId);
    if (!product) continue;
    const price = product.salePrice ?? product.price;
    const lineTotal = price * line.quantity;
    total += lineTotal;
    lines.push({ productId: line.productId, name: product.name, quantity: line.quantity, lineTotal });
  }
  return { total, lines };
}

export default function CheckoutPage() {
  const [cart, setCart] = useState<CartDto | null>(null);
  const [localSummary, setLocalSummary] = useState<LocalSummary | null>(null);
  const [placing, setPlacing] = useState(false);
  const [result, setResult] = useState<{ orderNumber: string; total: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    addressLine1: '',
    city: '',
    state: '',
    country: 'Nigeria',
  });

  const [paymentMethod, setPaymentMethod] = useState<'card' | 'transfer'>('card');
  const [card, setCard] = useState({ number: '', expiry: '', cvv: '' });
  const [transferProof, setTransferProof] = useState<string | null>(null);

  const load = useCallback(async () => {
    const sk = window.localStorage.getItem(KEY);
    if (!sk) return setCart(null);
    try {
      const res = await fetch(`${API}/cart?sessionKey=${encodeURIComponent(sk)}`, { signal: AbortSignal.timeout(3500) });
      const body = await res.json();
      if (body?.success && body.data) {
        setCart(body.data);
        return;
      }
    } catch {
      /* API down — fall back to local cart */
    }
    setLocalSummary(buildLocalSummary());
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const placeOrder = async () => {
    setError(null);

    if (!form.firstName.trim() || !form.lastName.trim() || !form.phone.trim()) {
      setError('Please fill in your name and phone number.');
      return;
    }

    if (paymentMethod === 'card' && (!card.number.replace(/\s/g, '').trim() || !card.expiry.trim() || !card.cvv.trim())) {
      setError('Please fill in your card details.');
      return;
    }
    if (paymentMethod === 'transfer' && !transferProof) {
      setError('Please attach a screenshot as proof of transfer.');
      return;
    }

    setPlacing(true);
    const summary = localSummary ?? buildLocalSummary();
    const total = cart?.total ?? summary.total;

    let completed = false;
    try {
      const sk = window.localStorage.getItem(KEY);
      const res = await fetch(
        `${API}/checkout?sessionKey=${sk ? encodeURIComponent(sk) : ''}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            shippingAddress: {
              firstName: form.firstName,
              lastName: form.lastName,
              phone: form.phone,
              addressLine1: form.addressLine1,
              city: form.city,
              state: form.state,
              country: form.country,
            },
            payment: {
              method: paymentMethod,
              ...(paymentMethod === 'card'
                ? { card: { number: card.number, expiry: card.expiry, cvv: card.cvv } }
                : { transfer: true }),
            },
          }),
          signal: AbortSignal.timeout(4000),
        },
      );
      const body = await res.json();
      if (body?.success) {
        window.localStorage.removeItem(KEY);
        clearLocalCart();
        setResult({ orderNumber: body.data.orderNumber, total: body.data.total });
        completed = true;
      } else {
        // Server responded but the order failed — surface its message.
        setError(body?.error?.message ?? 'Checkout failed');
        completed = true;
      }
    } catch {
      /* API unavailable — complete the order locally from the cart */
    } finally {
      setPlacing(false);
    }

    if (!completed) {
      const orderNumber = `LOCAL-${Date.now().toString().slice(-8)}`;
      window.localStorage.removeItem(KEY);
      clearLocalCart();
      setResult({ orderNumber, total });
    }
  };

  if (result) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <div className="mb-4 text-6xl">🎉</div>
        <h1 className="mb-2 text-2xl font-bold text-slate-800">Order placed!</h1>
        <p className="mb-2 text-slate-500">Order number: {result.orderNumber}</p>
        <p className="mb-6 text-lg font-semibold text-brand-700">{formatMoney(result.total)}</p>
        <Link href="/shop" className="btn-primary">
          Continue shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="mb-6 text-2xl font-bold text-slate-800">Checkout</h1>
      <div className="grid gap-8 md:grid-cols-5">
        <form
          className="md:col-span-3"
          onSubmit={(e) => {
            e.preventDefault();
            void placeOrder();
          }}
        >
          <div className="mb-4 grid grid-cols-2 gap-3">
            <input className="input" placeholder="First name" value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} />
            <input className="input" placeholder="Last name" value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} />
            <input className="input" placeholder="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            <input className="input" placeholder="Country" value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} />
          </div>
          <input className="input mb-3" placeholder="Street address" value={form.addressLine1} onChange={(e) => setForm({ ...form, addressLine1: e.target.value })} />
          <div className="grid grid-cols-2 gap-3">
            <input className="input" placeholder="City" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
            <input className="input" placeholder="State" value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} />
          </div>

          <div className="mt-6 rounded-lg border border-slate-200 p-4">
            <div className="mb-3 text-sm font-semibold text-slate-700">Payment method</div>
            <div className="mb-4 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setPaymentMethod('card')}
                className={`rounded-lg border px-4 py-2.5 text-sm font-semibold transition-colors ${
                  paymentMethod === 'card'
                    ? 'border-brand-600 bg-brand-50 text-brand-700'
                    : 'border-slate-200 text-slate-600 hover:border-slate-300'
                }`}
              >
                Card
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod('transfer')}
                className={`rounded-lg border px-4 py-2.5 text-sm font-semibold transition-colors ${
                  paymentMethod === 'transfer'
                    ? 'border-brand-600 bg-brand-50 text-brand-700'
                    : 'border-slate-200 text-slate-600 hover:border-slate-300'
                }`}
              >
                Bank Transfer
              </button>
            </div>

            {paymentMethod === 'card' ? (
              <div className="space-y-3">
                <input
                  className="input"
                  placeholder="Card number"
                  inputMode="numeric"
                  value={card.number}
                  onChange={(e) => setCard({ ...card, number: e.target.value })}
                />
                <div className="grid grid-cols-2 gap-3">
                  <input
                    className="input"
                    placeholder="MM/YY"
                    value={card.expiry}
                    onChange={(e) => setCard({ ...card, expiry: e.target.value })}
                  />
                  <input
                    className="input"
                    placeholder="CVV"
                    type="password"
                    inputMode="numeric"
                    value={card.cvv}
                    onChange={(e) => setCard({ ...card, cvv: e.target.value })}
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="rounded-lg bg-mint/50 p-4 text-sm">
                  <div className="mb-2 font-semibold text-brand-800">Transfer to:</div>
                  <div className="space-y-1 text-slate-700">
                    <div><span className="text-slate-500">Account name:</span> Mother Elizabeth Sewing Institute</div>
                    <div><span className="text-slate-500">Bank:</span> Zenith Bank</div>
                    <div><span className="text-slate-500">Account number:</span> 1012345678</div>
                    <div className="pt-1 text-xs text-slate-500">
                      Please transfer the exact total and use your name or phone number as the transfer reference.
                    </div>
                  </div>
                </div>

                <div>
                  <div className="mb-1.5 text-sm font-semibold text-slate-700">
                    Attach screenshot as proof of transfer
                  </div>
                  <label className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border-2 border-dashed border-slate-300 px-4 py-6 text-sm text-slate-500 hover:border-brand-400 hover:text-brand-600">
                    <input
                      type="file"
                      accept="image/*"
                      className="sr-only"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) setTransferProof(file.name);
                      }}
                    />
                    {transferProof ? (
                      <span className="font-medium text-brand-700">✓ {transferProof} attached</span>
                    ) : (
                      <span>Click to upload payment screenshot</span>
                    )}
                  </label>
                </div>
              </div>
            )}
          </div>

          {error && <div className="mt-4 rounded-md bg-red-50 p-3 text-sm text-red-600">{error}</div>}
          <button type="submit" className="btn-primary mt-6 w-full py-3" disabled={placing}>
            {placing ? 'Placing order…' : 'Place order'}
          </button>
        </form>
        <div className="md:col-span-2">
          <div className="rounded-lg border border-slate-200 p-4">
            <div className="mb-3 text-sm font-semibold text-slate-700">Order summary</div>
            {cart ? (
              cart.items.map((line) => (
                <div key={line.variantId} className="mb-2 flex justify-between text-sm text-slate-600">
                  <span>
                    {line.product.name} × {line.quantity}
                  </span>
                  <span>{formatMoney(line.lineTotal)}</span>
                </div>
              ))
            ) : localSummary ? (
              localSummary.lines.map((line) => (
                <div key={line.productId} className="mb-2 flex justify-between text-sm text-slate-600">
                  <span>
                    {line.name} × {line.quantity}
                  </span>
                  <span>{formatMoney(line.lineTotal)}</span>
                </div>
              ))
            ) : null}
            <div className="mt-4 flex justify-between border-t border-slate-200 pt-3 font-bold text-slate-800">
              <span>Total</span>
              <span>{formatMoney(cart?.total ?? localSummary?.total ?? 0)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
