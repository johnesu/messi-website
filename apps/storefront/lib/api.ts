const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api';

export interface ApiErrorBody {
  success: false;
  error: { code: string; message: string; details?: Record<string, unknown> };
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface Paginated<T> {
  items: T[];
  meta: PaginationMeta;
}

export class ApiClientError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public details?: Record<string, unknown>,
  ) {
    super(message);
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
    cache: 'no-store',
  });
  const body = (await res.json().catch(() => null)) as
    | ({ success: true; data: T } | ApiErrorBody)
    | null;
  if (!body || body.success === false) {
    const err = body as ApiErrorBody | null;
    throw new ApiClientError(
      res.status,
      err?.error.code ?? 'NETWORK_ERROR',
      err?.error.message ?? `Request failed with status ${res.status}`,
      err?.error.details,
    );
  }
  return body.data;
}

export const api = {
  get<T>(path: string, init?: RequestInit) {
    return request<T>(path, init);
  },
  post<T>(path: string, data?: unknown, opts?: { headers?: Record<string, string> }) {
    return request<T>(path, {
      method: 'POST',
      headers: opts?.headers,
      body: data === undefined ? undefined : JSON.stringify(data),
    });
  },
};

export function formatMoney(cents: number, currency = 'NGN'): string {
  // API stores money as integer minor units (kobo)
  const majorCents = cents;
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: currency === 'NGN' ? 'NGN' : currency,
    currencyDisplay: 'narrowSymbol',
    minimumFractionDigits: 2,
  }).format(majorCents / 100);
}
