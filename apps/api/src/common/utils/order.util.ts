import { createHash } from 'crypto';

export function generateOrderNumber(): string {
  const timestamp = new Date()
    .toISOString()
    .replace(/[-T:]/g, '')
    .slice(0, 12);
  const rand = Math.floor(Math.random() * 9000 + 1000);
  return `MESI-${timestamp}-${rand}`;
}

export function generateInvoiceNumber(orderNumber: string): string {
  const hash = createHash('sha1').update(orderNumber).digest('hex').slice(0, 6).toUpperCase();
  return `INV-${hash}`;
}

export function required(value: unknown, message: string): asserts value {
  if (value === undefined || value === null) {
    throw new Error(message);
  }
}
