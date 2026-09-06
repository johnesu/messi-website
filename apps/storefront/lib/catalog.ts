import { api } from './api';
import type { ProductDto } from '@mesi/types';
import { demoCategories, demoProducts, demoBlogPosts, demoHome } from './demo-data';

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  imageUrl: string | null;
  parentId: string | null;
  _count?: { productCategories: number };
}

export interface HomeSection {
  id: string;
  type: string;
  title: string | null;
  position: number;
  enabled: boolean;
  settings: Record<string, unknown>;
}

export interface HomePage {
  title: string;
  slug: string;
  isHomepage: boolean;
  sections: HomeSection[];
}

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  coverImage: string | null;
  status: string;
  publishedAt: string | null;
  tags: string[];
  category?: { name: string; slug: string } | null;
}

export interface PageMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// The storefront tries the live API first and gracefully falls back to a
// built-in demo catalogue so the site is fully browsable without a database.
const API_AVAILABLE = process.env.NEXT_PUBLIC_USE_DEMO !== '1';

async function tryApi<T>(path: string): Promise<T | null> {
  if (!API_AVAILABLE) return null;
  try {
    return await api.get<T>(path);
  } catch {
    return null;
  }
}

function matches(product: ProductDto, q?: string, category?: string) {
  if (q) {
    const s = q.toLowerCase();
    if (!(product.name.toLowerCase().includes(s) || (product.shortDescription ?? '').toLowerCase().includes(s))) {
      return false;
    }
  }
  if (category) {
    // Resolve the page slug/id/name to the category ids products actually use (e.g. "native-wear" -> "c-native").
    const cat = demoCategories.find(
      (c) => c.slug === category || c.id === category || c.name.toLowerCase() === category.toLowerCase(),
    );
    const target = cat?.id ?? category;
    if (!product.categoryIds.includes(target) && !product.tags.includes(target) && !product.tags.includes(category)) {
      return false;
    }
  }
  return true;
}

export async function getHomePage(): Promise<HomePage> {
  const live = await tryApi<HomePage>('/pages/home');
  if (live?.sections?.length) {
    return {
      ...live,
      sections: live.sections.map((s, i) => ({ ...s, id: s.id ?? `sec-${i}` })),
    };
  }
  return demoHome;
}

export async function getProducts(params: {
  page?: number;
  limit?: number;
  category?: string;
  featured?: boolean;
  q?: string;
}) {
  const page = params.page ?? 1;
  const limit = params.limit ?? 12;
  let live: { items: ProductDto[]; meta: PageMeta } | null = null;
  if (API_AVAILABLE) {
    const sp = new URLSearchParams();
    if (page) sp.set('page', String(page));
    if (limit) sp.set('limit', String(limit));
    if (params.category) sp.set('category', params.category);
    if (params.q) sp.set('q', params.q);
    const qs = sp.toString();
    live = await tryApi<{ items: ProductDto[]; meta: PageMeta }>(`/products${qs ? `?${qs}` : ''}`);
  }
  if (live) return live;

  let items = demoProducts.filter((p) =>
    matches(p, params.q, params.category?.replace('-', ' ')),
  );
  if (params.featured) items = items.filter((p) => p.featured);
  const start = (page - 1) * limit;
  const paged = items.slice(start, start + limit);
  return {
    items: paged,
    meta: { total: items.length, page, limit, totalPages: Math.max(1, Math.ceil(items.length / limit)) },
  };
}

export async function getProduct(slug: string) {
  const live = await tryApi<ProductDto>(`/products/public/${encodeURIComponent(slug)}`);
  if (live) return live;
  const found = demoProducts.find((p) => p.slug === slug);
  if (found) return found;
  const err = new Error('Not found') as Error & { status?: number };
  err.status = 404;
  throw err;
}

export async function getCategories(): Promise<Category[]> {
  const live = await tryApi<Category[]>('/categories');
  if (live && live.length) return live;
  return demoCategories;
}

export async function getCategory(slug: string) {
  const live = await tryApi<Category>(`/categories/${encodeURIComponent(slug)}`);
  if (live) return live;
  const found = [...demoCategories].find((c) => c.slug === slug);
  if (found) return found;
  const err = new Error('Not found') as Error & { status?: number };
  err.status = 404;
  throw err;
}

export async function getBlogPosts() {
  const live = await tryApi<{ items: BlogPost[]; meta: unknown }>('/blog');
  if (live && live.items?.length) return live;
  return {
    items: demoBlogPosts.filter((p) => p.status === 'PUBLISHED'),
    meta: { total: demoBlogPosts.length, page: 1, limit: 20, totalPages: 1 },
  };
}

export async function getBlogPost(slug: string) {
  const live = await tryApi<BlogPost>(`/blog/public/${encodeURIComponent(slug)}`);
  if (live) return live;
  const found = demoBlogPosts.find((p) => p.slug === slug);
  if (found) return found;
  const err = new Error('Not found') as Error & { status?: number };
  err.status = 404;
  throw err;
}
