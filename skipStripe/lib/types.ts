export type StripePayment = {
  id: string;
  customerName: string;
  customerEmail: string;
  amount: number;
  currency: string;
  date: string;
  paymentReference: string;
};

export type PortalPayment = StripePayment & {
  connectionId: string;
  token: string;
};

export type InvoicePayload = {
  invoiceNumber: string;
  invoiceDate: string;
  companyName: string;
  companyAddress: string;
  taxId?: string;
  customerName: string;
  customerEmail: string;
  amount: number;
  currency: string;
  paymentId: string;
  paymentReference: string;
  itemDescription: string;
};
