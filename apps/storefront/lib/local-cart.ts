export interface LocalCartItem {
  productId: string;
  quantity: number;
}

const STORAGE_KEY = 'mesi_cart_local';

let items: LocalCartItem[] = [];
let loaded = false;
const listeners = new Set<() => void>();

function read(): LocalCartItem[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const data = JSON.parse(raw);
    return Array.isArray(data?.items) ? data.items : [];
  } catch {
    return [];
  }
}

function persist() {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ items }));
  } catch {
    /* ignore storage errors */
  }
  emit();
}

function emit() {
  listeners.forEach((l) => l());
}

export function getLocalCart(): LocalCartItem[] {
  if (!loaded) {
    items = read();
    loaded = true;
  }
  return items;
}

export function getLocalCount(): number {
  return getLocalCart().reduce((n, i) => n + i.quantity, 0);
}

export function addLocalItem(productId: string, quantity = 1) {
  getLocalCart();
  const existing = items.find((i) => i.productId === productId);
  if (existing) existing.quantity += quantity;
  else items.push({ productId, quantity });
  persist();
}

export function setLocalQuantity(productId: string, quantity: number) {
  getLocalCart();
  const existing = items.find((i) => i.productId === productId);
  if (existing) existing.quantity = Math.max(0, quantity);
  if (existing && existing.quantity <= 0) {
    items = items.filter((i) => i.productId !== productId);
  }
  persist();
}

export function removeLocalItem(productId: string) {
  getLocalCart();
  items = items.filter((i) => i.productId !== productId);
  persist();
}

export function clearLocalCart() {
  getLocalCart();
  items = [];
  persist();
}

export function subscribeLocalCart(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
