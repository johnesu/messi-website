export interface InitializePaymentInput {
  amount: number;
  currency: string;
  email: string;
  reference: string;
  metadata?: Record<string, unknown>;
}

export interface InitializePaymentResult {
  authorizationUrl: string;
  reference: string;
  providerReference?: string;
}

export interface VerifyResult {
  status: 'success' | 'failed' | 'pending' | 'cancelled';
  amount?: number;
  currency?: string;
  paidAt?: Date;
  providerReference?: string;
}

export interface RefundResult {
  providerRefundId: string;
  status: string;
}

export interface PaymentProvider {
  readonly name: string;
  initialize(input: InitializePaymentInput): Promise<InitializePaymentResult>;
  verify(reference: string): Promise<VerifyResult>;
  refund(params: {
    reference: string;
    amount: number;
    reason?: string;
  }): Promise<RefundResult>;
}
