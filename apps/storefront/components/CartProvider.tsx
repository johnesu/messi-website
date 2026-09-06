'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  addLocalItem,
  clearLocalCart,
  getLocalCount,
  removeLocalItem,
  setLocalQuantity,
  subscribeLocalCart,
} from '@/lib/local-cart';

interface CartContextValue {
  itemCount: number;
  sessionKey: string | null;
  addToCart: (productId: string, quantity?: number) => Promise<void>;
  updateQuantity: (productId: string, quantity: number) => void;
  removeItem: (productId: string) => void;
  clear: () => void;
  refresh: () => Promise<void>;
}

const CartContext = createContext<CartContextValue | null>(null);

const SESSION_KEY_STORAGE = 'mesi_cart_session';
const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api';

function getOrCreateSessionKey() {
  let key = window.localStorage.getItem(SESSION_KEY_STORAGE);
  if (!key) {
    key = `guest-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    window.localStorage.setItem(SESSION_KEY_STORAGE, key);
  }
  return key;
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [itemCount, setItemCount] = useState(0);
  const [sessionKey, setSessionKey] = useState<string | null>(null);

  useEffect(() => {
    setSessionKey(window.localStorage.getItem(SESSION_KEY_STORAGE));
    setItemCount(getLocalCount());
    const unsub = subscribeLocalCart(() => setItemCount(getLocalCount()));
    return unsub;
  }, []);

  const syncWithApi = useCallback(async () => {
    const key = window.localStorage.getItem(SESSION_KEY_STORAGE);
    if (!key) return;
    try {
      await fetch(
        `${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api'}/cart?sessionKey=${encodeURIComponent(key)}`,
        { signal: AbortSignal.timeout(3500) },
      );
    } catch {
      /* API down — local cart backs the badge; no-op */
    }
  }, []);

  const refresh = useCallback(async () => {
    setItemCount(getLocalCount());
    await syncWithApi().catch(() => {});
  }, [syncWithApi]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const addToCart = useCallback(
    async (productId: string, quantity = 1) => {
      const key = getOrCreateSessionKey();
      setSessionKey(key);
      addLocalItem(productId, quantity);

      const base = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api';
      try {
        await fetch(`${base}/cart/items?sessionKey=${encodeURIComponent(key)}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ productId, quantity }),
          signal: AbortSignal.timeout(3500),
        });
      } catch {
        /* API down — local cart already updated; never surface this error */
      }
    },
    [],
  );

  const updateQuantity = useCallback((productId: string, quantity: number) => {
    setLocalQuantity(productId, quantity);
    const key = window.localStorage.getItem(SESSION_KEY_STORAGE);
    if (!key) return;
    void fetch(`${API_BASE}/cart/items?sessionKey=${encodeURIComponent(key)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productId, quantity }),
      signal: AbortSignal.timeout(3500),
    }).catch(() => {});
  }, []);

  const removeItem = useCallback((productId: string) => {
    removeLocalItem(productId);
    const key = window.localStorage.getItem(SESSION_KEY_STORAGE);
    if (!key) return;
    void fetch(
      `${API_BASE}/cart/items/${encodeURIComponent(productId)}?sessionKey=${encodeURIComponent(key)}`,
      { method: 'DELETE', signal: AbortSignal.timeout(3500) },
    ).catch(() => {});
  }, []);

  const clear = useCallback(() => {
    clearLocalCart();
    const key = window.localStorage.getItem(SESSION_KEY_STORAGE);
    if (!key) return;
    void fetch(`${API_BASE}/cart?sessionKey=${encodeURIComponent(key)}`, {
      method: 'DELETE',
      signal: AbortSignal.timeout(3500),
    }).catch(() => {});
  }, []);

  const value = useMemo(
    () => ({ itemCount, sessionKey, addToCart, updateQuantity, removeItem, clear, refresh }),
    [itemCount, sessionKey, addToCart, updateQuantity, removeItem, clear, refresh],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
