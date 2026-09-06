import { Injectable } from '@nestjs/common';
import {
  PaymentProvider,
  InitializePaymentInput,
  InitializePaymentResult,
  VerifyResult,
  RefundResult,
} from './payment-provider.interface';

interface SandboxTx {
  reference: string;
  status: 'success' | 'failed';
  amount: number;
  currency: string;
  paidAt: Date;
}

/**
 * Paystack payment provider.
 *
 * Uses the live Paystack REST API when a secret key is configured.
 * When PAYSTACK_TEST_MODE is true and no real secret key is set (local dev),
 * a sandbox implementation simulates transactions deterministically so the
 * full checkout -> payment -> webhook -> order confirmation flow can be
 * exercised without live credentials.
 */
@Injectable()
export class PaystackProvider implements PaymentProvider {
  readonly name = 'PAYSTACK';

  private readonly baseUrl = 'https://api.paystack.co';
  private readonly secretKey: string;
  private readonly sandbox: boolean;
  private readonly sandboxStore = new Map<string, SandboxTx>();

  constructor() {
    this.secretKey = process.env.PAYSTACK_SECRET_KEY ?? '';
    this.sandbox =
      (process.env.PAYSTACK_TEST_MODE ?? 'true') === 'true' && !this.secretKey;
  }

  async initialize(input: InitializePaymentInput): Promise<InitializePaymentResult> {
    if (this.sandbox) {
      const authUrl = `https://checkout.paystack.com/${input.reference}`;
      this.sandboxStore.set(input.reference, {
        reference: input.reference,
        status: 'success',
        amount: input.amount,
        currency: input.currency,
        paidAt: new Date(),
      });
      return { authorizationUrl: authUrl, reference: input.reference };
    }

    const res = await fetch(`${this.baseUrl}/transaction/initialize`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.secretKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: input.amount,
        currency: input.currency,
        email: input.email,
        reference: input.reference,
        metadata: input.metadata,
      }),
    });
    const json = (await res.json()) as {
      status: boolean;
      data: { authorization_url: string; reference: string; access_code?: string };
    };
    if (!res.ok || !json.status) {
      throw new Error('PAYMENT_INIT_FAILED');
    }
    return {
      authorizationUrl: json.data.authorization_url,
      reference: json.data.reference,
      providerReference: json.data.access_code,
    };
  }

  async verify(reference: string): Promise<VerifyResult> {
    if (this.sandbox) {
      const tx = this.sandboxStore.get(reference);
      if (!tx) return { status: 'failed' };
      return {
        status: tx.status,
        amount: tx.amount,
        currency: tx.currency,
        paidAt: tx.paidAt,
      };
    }

    const res = await fetch(`${this.baseUrl}/transaction/verify/${reference}`, {
      headers: { Authorization: `Bearer ${this.secretKey}` },
    });
    const json = (await res.json()) as {
      status: boolean;
      data: {
        status: string;
        amount?: number;
        currency?: string;
        paid_at?: string;
        reference?: string;
      };
    };
    if (!res.ok || !json.status || !json.data) {
      return { status: 'failed' };
    }
    const mapStatus: Record<string, VerifyResult['status']> = {
      success: 'success',
      failed: 'failed',
      abandoned: 'cancelled',
    };
    return {
      status: mapStatus[json.data.status] ?? 'pending',
      amount: json.data.amount,
      currency: json.data.currency,
      paidAt: json.data.paid_at ? new Date(json.data.paid_at) : undefined,
      providerReference: json.data.reference,
    };
  }

  async refund(params: {
    reference: string;
    amount: number;
    reason?: string;
  }): Promise<RefundResult> {
    if (this.sandbox) {
      return { providerRefundId: `sbrf-${Date.now()}`, status: 'SUCCESS' };
    }
    const res = await fetch(`${this.baseUrl}/refund`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.secretKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        transaction: params.reference,
        amount: params.amount,
        reason: params.reason,
      }),
    });
    const json = (await res.json()) as { status: boolean; data: { id: string; status: string } };
    if (!res.ok || !json.status) {
      throw new Error('REFUND_FAILED');
    }
    return { providerRefundId: String(json.data.id), status: json.data.status };
  }
}
