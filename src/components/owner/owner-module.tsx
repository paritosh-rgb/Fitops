"use client";

import { FormEvent, useState } from "react";
import { Expense } from "@/lib/types";
import { useToast } from "@/components/ui/toast-provider";

interface OwnerModuleProps {
  expenses: Expense[];
  monthlyCollectedInr: number;
  monthlyExpensesInr: number;
  netProfitInr: number;
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
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [expenseForm, setExpenseForm] = useState({
    category: "rent",
    amountInr: 0,
    note: "",
  });

  async function addExpense(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      setBusy(true);
      setError(null);
      await postJson("/api/expenses", expenseForm);
      showToast("Expense saved", "success");
      window.location.reload();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Something went wrong";
      setError(message);
      showToast(message, "error");
      setBusy(false);
    }
  }

  return (
    <section className="module-grid">
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
