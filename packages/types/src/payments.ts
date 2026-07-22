export type PaymentProvider = "hyperswitch" | "btcpay";

export type PaymentMethod = "card" | "bank_transfer" | "crypto";

export interface HyperswitchPaymentResult {
  provider: "hyperswitch";
  clientSecret: string;
  paymentId: string;
  orderId: string;
}

export interface BTCPayInvoiceResult {
  provider: "btcpay";
  checkoutUrl: string;
  invoiceId: string;
  orderId: string;
}

export type PaymentResult = HyperswitchPaymentResult | BTCPayInvoiceResult;
