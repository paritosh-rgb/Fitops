"use client";

import { useToast } from "@/components/ui/toast-provider";

interface MembershipReminderItem {
  memberId: string;
  memberName: string;
  phone: string;
  expiryDate: string;
  daysToExpiry: number;
}

interface MembershipReminderPanelProps {
  gymName: string;
  reminders: MembershipReminderItem[];
}

export default function MembershipReminderPanel({ gymName, reminders }: MembershipReminderPanelProps) {
  const { showToast } = useToast();

  function whatsappHref(reminder: MembershipReminderItem): string {
    const digits = reminder.phone.replace(/\D/g, "");
    const normalized = digits.length === 10 ? `91${digits}` : digits;
    const message = `Hi ${reminder.memberName}, your gym membership at ${gymName} expires on ${reminder.expiryDate}. Renew today to get a 5% loyalty discount!`;
    return `https://wa.me/${normalized}?text=${encodeURIComponent(message)}`;
  }

  if (!reminders.length) {
    return (
      <div className="card tinted-card t1">
        <h2>Membership Reminders</h2>
        <p className="muted">No upcoming expiries right now.</p>
      </div>
    );
  }

  function expiryTone(daysToExpiry: number): string {
    if (daysToExpiry < 0) return "critical";
    if (daysToExpiry <= 3) return "high";
    return "medium";
  }

  return (
    <div className="card tinted-card t1 membership-reminder-panel">
      <div className="section-head">
        <h2>Membership Reminders</h2>
        <span className="status-pill medium">{reminders.length} to follow up</span>
      </div>
      <div className="reminder-list">
        {reminders.map((row) => (
          <article key={row.memberId} className="reminder-item reminder-card">
            <div className="reminder-copy">
              <h3>{row.memberName}</h3>
              <p className="reminder-meta">
                Expires: <strong>{row.expiryDate}</strong>
                {" · "}
                {row.daysToExpiry >= 0
                  ? `${row.daysToExpiry} days left`
                  : `${Math.abs(row.daysToExpiry)} days overdue`}
              </p>
            </div>
            <div className="reminder-actions">
              <span className={`status-pill ${expiryTone(row.daysToExpiry)}`}>
                {row.daysToExpiry < 0 ? "Expired" : "Expiring soon"}
              </span>
              <button
                type="button"
                className="reminder-send-btn"
                onClick={() => {
                  window.open(whatsappHref(row), "_blank", "noopener,noreferrer");
                  showToast(`Reminder opened for ${row.memberName}`, "success");
                }}
              >
                Send Reminder
              </button>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
