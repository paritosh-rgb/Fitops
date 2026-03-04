"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Expense, Payment } from "@/lib/types";
import { useToast } from "@/components/ui/toast-provider";

interface OwnerModuleProps {
  expenses: Expense[];
  payments: Payment[];
  activeMembers: number;
  monthlyCollectedInr: number;
  monthlyExpensesInr: number;
  netProfitInr: number;
}

function pct(numerator: number, denominator: number): number {
  if (!denominator) return 0;
  return Math.round((numerator / denominator) * 100);
}

async function postJson(url: string, body: Record<string, unknown>) {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const payload = (await response.json().catch(() => ({}))) as { error?: string };
  if (!response.ok) throw new Error(payload.error ?? "Request failed");
  return payload;
}

export default function OwnerModule(props: OwnerModuleProps) {
  const { showToast } = useToast();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [expenseForm, setExpenseForm] = useState({
    category: "rent",
    amountInr: 0,
    note: "",
  });
  const monthKey = new Date().toISOString().slice(0, 7);

  const financeKpi = useMemo(() => {
    const monthPayments = props.payments.filter((payment) => payment.date.startsWith(monthKey));
    const billedInr = monthPayments.reduce((sum, row) => sum + row.amountInr, 0);
    const paidInr = monthPayments
      .filter((row) => row.status === "paid")
      .reduce((sum, row) => sum + row.amountInr, 0);
    const upiInr = monthPayments
      .filter((row) => row.status === "paid" && row.method === "upi")
      .reduce((sum, row) => sum + row.amountInr, 0);
    const cashInr = monthPayments
      .filter((row) => row.status === "paid" && row.method === "cash")
      .reduce((sum, row) => sum + row.amountInr, 0);

    return {
      billedInr,
      paidInr,
      collectionEfficiencyPct: pct(paidInr, billedInr),
      netMarginPct: pct(props.netProfitInr, props.monthlyCollectedInr),
      expenseRatioPct: pct(props.monthlyExpensesInr, props.monthlyCollectedInr),
      upiSharePct: pct(upiInr, paidInr),
      cashSharePct: pct(cashInr, paidInr),
      costPerActiveMember: props.activeMembers
        ? Math.round(props.monthlyExpensesInr / props.activeMembers)
        : 0,
    };
  }, [
    monthKey,
    props.activeMembers,
    props.monthlyCollectedInr,
    props.monthlyExpensesInr,
    props.netProfitInr,
    props.payments,
  ]);

  async function addExpense(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      setBusy(true);
      setError(null);
      await postJson("/api/expenses", expenseForm);
      showToast("Expense saved", "success");
      router.refresh();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Something went wrong";
      setError(message);
      showToast(message, "error");
      setBusy(false);
    }
  }

  return (
    <section className="module-grid">
      <div className="card span-2 kpi-panel owner-kpi-panel">
        <div className="section-head">
          <h2>Owner KPI Lens</h2>
          <span className="status-pill low">Finance control</span>
        </div>
        <div className="kpi-chip-grid">
          <article className="kpi-chip c5">
            <p>Collection Efficiency</p>
            <strong>{financeKpi.collectionEfficiencyPct}%</strong>
            <small>Collected vs billed</small>
          </article>
          <article className="kpi-chip c2">
            <p>Net Margin</p>
            <strong>{financeKpi.netMarginPct}%</strong>
            <small>Profit share</small>
          </article>
          <article className="kpi-chip c4">
            <p>Expense Ratio</p>
            <strong>{financeKpi.expenseRatioPct}%</strong>
            <small>Cost to topline</small>
          </article>
          <article className="kpi-chip c1">
            <p>UPI Mix</p>
            <strong>{financeKpi.upiSharePct}%</strong>
            <small>Digital collections</small>
          </article>
          <article className="kpi-chip c3">
            <p>Cost / Active Member</p>
            <strong>Rs {financeKpi.costPerActiveMember.toLocaleString("en-IN")}</strong>
            <small>Monthly servicing cost</small>
          </article>
        </div>
        <div className="dual-progress">
          <div>
            <p>UPI</p>
            <div className="bar-track">
              <div className="bar-fill upi" style={{ width: `${financeKpi.upiSharePct}%` }} />
            </div>
          </div>
          <div>
            <p>Cash</p>
            <div className="bar-track">
              <div className="bar-fill cash" style={{ width: `${financeKpi.cashSharePct}%` }} />
            </div>
          </div>
        </div>
      </div>

      <article className="card metric visual-card v5">
        <h3>Collection (MTD)</h3>
        <p>Rs {props.monthlyCollectedInr.toLocaleString("en-IN")}</p>
        <span className="metric-tag">Topline</span>
      </article>
      <article className="card metric visual-card v4">
        <h3>Expenses (MTD)</h3>
        <p>Rs {props.monthlyExpensesInr.toLocaleString("en-IN")}</p>
        <span className="metric-tag">Operating cost</span>
      </article>
      <article className="card metric visual-card v2">
        <h3>Net Profit (MTD)</h3>
        <p>Rs {props.netProfitInr.toLocaleString("en-IN")}</p>
        <span className="metric-tag">Owner reality check</span>
      </article>

      <form className="card tinted-card t1" onSubmit={addExpense}>
        <h2>Add Expense</h2>
        <label>
          Category
          <select
            value={expenseForm.category}
            onChange={(e) => setExpenseForm((x) => ({ ...x, category: e.target.value }))}
          >
            <option value="rent">Rent</option>
            <option value="electricity">Electricity</option>
            <option value="salary">Trainer Salary</option>
            <option value="maintenance">Maintenance</option>
            <option value="other">Other</option>
          </select>
        </label>
        <label>
          Amount (Rs)
          <input
            required
            type="number"
            value={expenseForm.amountInr}
            onChange={(e) => setExpenseForm((x) => ({ ...x, amountInr: Number(e.target.value) }))}
          />
        </label>
        <label>
          Note
          <input
            value={expenseForm.note}
            onChange={(e) => setExpenseForm((x) => ({ ...x, note: e.target.value }))}
          />
        </label>
        <button type="submit" disabled={busy}>{busy ? "Saving..." : "Save Expense"}</button>
        {error ? <p className="error">{error}</p> : null}
      </form>

      <div className="card table-card span-2 tinted-card t4">
        <h2>Expense Ledger</h2>
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Category</th>
              <th>Amount</th>
              <th>Note</th>
            </tr>
          </thead>
          <tbody>
            {props.expenses
              .slice()
              .sort((a, b) => b.date.localeCompare(a.date))
              .map((row) => (
                <tr key={row.id}>
                  <td>{row.date}</td>
                  <td>{row.category}</td>
                  <td>Rs {row.amountInr.toLocaleString("en-IN")}</td>
                  <td>{row.note ?? "-"}</td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
