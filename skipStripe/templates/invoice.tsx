import type { InvoicePayload } from "@/lib/types";
import { formatDate, formatMoney } from "@/lib/utils";

const invoiceStyles = `
  * { box-sizing: border-box; }
  body { margin: 0; font-family: Inter, Arial, sans-serif; background: #f8fafc; color: #0f172a; }
  .page { width: 100%; padding: 40px; }
  .invoice { background: white; border-radius: 28px; padding: 40px; box-shadow: 0 20px 60px rgba(15, 23, 42, 0.08); }
  .header { display: flex; justify-content: space-between; gap: 24px; align-items: flex-start; margin-bottom: 32px; }
  .logo { width: 56px; height: 56px; border-radius: 18px; background: linear-gradient(135deg, #0ea5e9, #2563eb); color: white; display: flex; align-items: center; justify-content: center; font-size: 24px; font-weight: 700; }
  .eyebrow { color: #475569; text-transform: uppercase; letter-spacing: 0.2em; font-size: 12px; margin-bottom: 8px; }
  .title { font-size: 36px; font-weight: 700; margin: 0; }
  .meta-card { padding: 20px; border-radius: 20px; background: #eff6ff; min-width: 220px; }
  .muted { color: #64748b; font-size: 13px; }
  .grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 18px; margin-bottom: 32px; }
  .panel { border: 1px solid #e2e8f0; border-radius: 20px; padding: 20px; background: #fff; }
  .panel h3 { margin: 0 0 12px; font-size: 14px; color: #475569; text-transform: uppercase; letter-spacing: 0.08em; }
  .panel p { margin: 4px 0; }
  .table { width: 100%; border-collapse: collapse; margin-top: 12px; }
  .table th { text-align: left; padding: 14px 12px; font-size: 12px; color: #475569; text-transform: uppercase; letter-spacing: 0.08em; border-bottom: 1px solid #e2e8f0; }
  .table td { padding: 18px 12px; border-bottom: 1px solid #e2e8f0; font-size: 14px; }
  .total { margin-top: 24px; display: flex; justify-content: flex-end; }
  .total-box { width: 280px; border-radius: 20px; background: #0f172a; color: white; padding: 20px; }
  .footer { margin-top: 28px; padding-top: 24px; border-top: 1px solid #e2e8f0; display: flex; justify-content: space-between; gap: 20px; }
`;

export function renderInvoiceHtml(invoice: InvoicePayload) {
  return `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <style>${invoiceStyles}</style>
      </head>
      <body>
        <div class="page">
          <div class="invoice">
            <div class="header">
              <div style="display:flex; gap:18px; align-items:center;">
                <div class="logo">S</div>
                <div>
                  <div class="eyebrow">Stripe Invoice Portal</div>
                  <h1 class="title">Invoice</h1>
                </div>
              </div>
              <div class="meta-card">
                <div class="muted">Invoice Number</div>
                <div style="font-size:20px; font-weight:700; margin-top:4px;">${invoice.invoiceNumber}</div>
                <div style="height:16px;"></div>
                <div class="muted">Invoice Date</div>
                <div style="font-size:16px; font-weight:600; margin-top:4px;">${formatDate(invoice.invoiceDate)}</div>
              </div>
            </div>

            <div class="grid">
              <div class="panel">
                <h3>Company Details</h3>
                <p style="font-size:18px; font-weight:700;">${invoice.companyName}</p>
                <p>${invoice.companyAddress.replace(/\n/g, "<br/>")}</p>
                ${invoice.taxId ? `<p><strong>Tax ID:</strong> ${invoice.taxId}</p>` : ""}
              </div>
              <div class="panel">
                <h3>Client Details</h3>
                <p style="font-size:18px; font-weight:700;">${invoice.customerName}</p>
                <p>${invoice.customerEmail}</p>
                <p><strong>Payment ID:</strong> ${invoice.paymentId}</p>
              </div>
            </div>

            <table class="table">
              <thead>
                <tr>
                  <th>Item Description</th>
                  <th>Reference</th>
                  <th style="text-align:right;">Amount</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>${invoice.itemDescription}</td>
                  <td>${invoice.paymentReference}</td>
                  <td style="text-align:right; font-weight:700;">${formatMoney(invoice.amount, invoice.currency)}</td>
                </tr>
              </tbody>
            </table>

            <div class="total">
              <div class="total-box">
                <div class="muted" style="color:#cbd5e1;">Total Paid</div>
                <div style="margin-top:8px; font-size:30px; font-weight:700;">${formatMoney(invoice.amount, invoice.currency)}</div>
                <div style="margin-top:8px; color:#cbd5e1;">Currency: ${invoice.currency.toUpperCase()}</div>
              </div>
            </div>

            <div class="footer">
              <div>
                <div class="muted">Payment reference</div>
                <div style="font-weight:600;">${invoice.paymentReference}</div>
              </div>
              <div style="text-align:right;">
                <div class="muted">Generated by</div>
                <div style="font-weight:600;">Stripe Invoice Portal</div>
              </div>
            </div>
          </div>
        </div>
      </body>
    </html>
  `;
}
