"use client";

import { useState } from "react";
import type { DueReminder } from "@/lib/reminders/dues";
import { useToast } from "@/components/ui/toast-provider";

interface DuesReminderPanelProps {
  reminders: DueReminder[];
}

interface SendAllResponse {
  sent?: number;
  failed?: number;
  results?: Array<{ memberName?: string; status?: string; error?: string }>;
  error?: string;
}

export default function DuesReminderPanel({ reminders }: DuesReminderPanelProps) {
  const { showToast } = useToast();
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function sendAll() {
    try {
      setBusy(true);
      setError(null);
      setStatus(null);

      const response = await fetch("/api/reminders/dues", { method: "POST" });
      const payload = (await response.json().catch(() => ({}))) as SendAllResponse;

      if (!response.ok) {
        throw new Error(payload.error ?? "Failed to send reminders");
      }

      const text = `Sent ${payload.sent ?? 0}, Failed ${payload.failed ?? 0}`;
      setStatus(text);
      showToast(text, payload.failed ? "info" : "success");
      window.location.reload();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to send reminders";
      setError(message);
      showToast(message, "error");
      setBusy(false);
    }
  }

  function whatsappHref(reminder: DueReminder): string {
    const digits = reminder.phone.replace(/\D/g, "");
    const normalized = digits.length === 10 ? `91${digits}` : digits;
    const message = `Hi ${reminder.memberName}, you have a pending balance of ₹${reminder.dueAmountInr} at ${reminder.gymName}. Kindly pay via UPI to avoid interruption.`;
    return `https://wa.me/${normalized}?text=${encodeURIComponent(message)}`;
  }

  function sendOne(reminder: DueReminder) {
    const href = whatsappHref(reminder);
    window.open(href, "_blank", "noopener,noreferrer");
    const text = `Reminder opened for ${reminder.memberName}`;
    setStatus(text);
    showToast(text, "success");
  }

  if (!reminders.length) {
    return (
      <div className="card tinted-card t2">
        <h2>Dues WhatsApp Reminders</h2>
        <p className="muted">No dues pending right now.</p>
      </div>
    );
  }

  return (
    <div className="card table-card tinted-card t2">
      <div className="section-head">
        <h2>Dues WhatsApp Reminders</h2>
        <button type="button" onClick={sendAll} disabled={busy}>
          {busy ? "Sending..." : `Send All (${reminders.length})`}
        </button>
      </div>

      <table>
        <thead>
          <tr>
            <th>Member</th>
            <th>Phone</th>
            <th>Due Amount</th>
            <th>Type</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {reminders.map((row) => (
            <tr key={row.memberId}>
              <td>{row.memberName}</td>
              <td>{row.phone}</td>
              <td>Rs {row.dueAmountInr.toLocaleString("en-IN")}</td>
              <td>
                <span className={`status-pill ${row.dueType}`}>{row.dueType}</span>
              </td>
              <td>
                <button
                  type="button"
                  onClick={() => sendOne(row)}
                  disabled={busy}
                >
                  Send Reminder
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {status ? <p className="muted">{status}</p> : null}
      {error ? <p className="error">{error}</p> : null}
    </div>
  );
}
