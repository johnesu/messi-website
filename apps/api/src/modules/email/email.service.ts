export interface EmailMessage {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export interface EmailProvider {
  send(message: EmailMessage): Promise<void>;
}

export class ConsoleEmailProvider implements EmailProvider {
  async send(message: EmailMessage): Promise<void> {
    // eslint-disable-next-line no-console
    console.log('\n[EMAIL] -------------------------------');
    // eslint-disable-next-line no-console
    console.log(`[EMAIL] To:      ${message.to}`);
    // eslint-disable-next-line no-console
    console.log(`[EMAIL] Subject: ${message.subject}`);
    // eslint-disable-next-line no-console
    console.log(`[EMAIL] Body:    \n${message.text ?? message.html}`);
    // eslint-disable-next-line no-console
    console.log('[EMAIL] -------------------------------\n');
  }
}

export class SmtpEmailProvider implements EmailProvider {
  constructor(
    private readonly config: {
      host: string;
      port: number;
      user: string;
      pass: string;
      from: string;
    },
  ) {}

  async send(message: EmailMessage): Promise<void> {
    if (!this.config.host) {
      throw new Error('SMTP host not configured');
    }
    // Real SMTP transport would be wired via nodemailer here.
    // Kept as a stub for the provider abstraction; console provider is default.
    throw new Error('SMTP provider not configured in this build');
  }
}

export class EmailService {
  constructor(private readonly provider: EmailProvider = new ConsoleEmailProvider()) {}

  async send(message: EmailMessage): Promise<void> {
    await this.provider.send(message);
  }

  sendWelcome(user: { email: string; firstName: string }) {
    return this.send({
      to: user.email,
      subject: `Welcome to ${process.env.STORE_NAME ?? 'MESI Marketplace'}!`,
      html: this.layout(
        `<h1>Welcome, ${user.firstName}!</h1><p>Thanks for creating an account. We're excited to have you.</p>`,
      ),
    });
  }

  sendVerifyEmail(user: { email: string; firstName: string }, token: string) {
    const url = `${process.env.FRONTEND_URL ?? 'http://localhost:3000'}/verify-email?token=${token}`;
    return this.send({
      to: user.email,
      subject: 'Verify your email address',
      html: this.layout(
        `<h1>Hi ${user.firstName},</h1><p>Please verify your email by clicking the link below:</p>
         <p><a href="${url}">Verify Email</a></p>
         <p>Or copy: ${url}</p>`,
      ),
    });
  }

  sendPasswordReset(user: { email: string; firstName: string }, token: string) {
    const url = `${process.env.FRONTEND_URL ?? 'http://localhost:3000'}/reset-password?token=${token}`;
    return this.send({
      to: user.email,
      subject: 'Reset your password',
      html: this.layout(
        `<h1>Hi ${user.firstName},</h1><p>Use the link below to reset your password:</p>
         <p><a href="${url}">Reset Password</a></p>
         <p>Or copy: ${url}</p>
         <p>This link expires in 1 hour.</p>`,
      ),
    });
  }

  sendOrderConfirmation(order: {
    customerEmail: string;
    customerFirstName: string;
    orderNumber: string;
    total: number;
    currency: string;
    items: { name: string; qty: number; lineTotal: number }[];
  }) {
    const itemsHtml = order.items
      .map(
        (i) =>
          `<tr><td>${i.name}</td><td>${i.qty}</td><td align="right">${order.currency} ${(i.lineTotal / 100).toFixed(2)}</td></tr>`,
      )
      .join('');
    return this.send({
      to: order.customerEmail,
      subject: `Order Confirmation ${order.orderNumber}`,
      html: this.layout(
        `<h1>Thank you ${order.customerFirstName}!</h1>
         <p>Your order <strong>${order.orderNumber}</strong> has been received.</p>
         <table border="1" cellpadding="8" cellspacing="0" style="border-collapse:collapse;width:100%">
           <thead><tr><th>Item</th><th>Qty</th><th>Total</th></tr></thead>
           <tbody>${itemsHtml}</tbody>
         </table>
         <p>Total: <strong>${order.currency} ${(order.total / 100).toFixed(2)}</strong></p>`,
      ),
    });
  }

  sendShipmentNotification(to: string, orderNumber: string, trackingNumber?: string) {
    return this.send({
      to,
      subject: `Your order ${orderNumber} has shipped`,
      html: this.layout(
        `<h1>Good news!</h1>
         <p>Your order ${orderNumber} is on the way.</p>
         ${trackingNumber ? `<p>Tracking: <strong>${trackingNumber}</strong></p>` : ''}`,
      ),
    });
  }

  sendAbandonedCart(to: string, firstName: string, itemsCount: number) {
    return this.send({
      to,
      subject: 'Your cart is waiting for you',
      html: this.layout(
        `<h1>Hi ${firstName},</h1>
         <p>You have <strong>${itemsCount}</strong> item(s) in your cart. Complete your purchase before they run out!</p>`,
      ),
    });
  }

  private layout(content: string): string {
    return `<div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;padding:24px;background:#f9fafb;border-radius:8px">
      <div style="background:#fff;padding:24px;border-radius:8px">${content}</div>
      <p style="color:#6b7280;font-size:12px;text-align:center;margin-top:16px">
        ${process.env.STORE_NAME ?? 'MESI Marketplace'} &copy; ${new Date().getFullYear()}
      </p>
    </div>`;
  }
}
