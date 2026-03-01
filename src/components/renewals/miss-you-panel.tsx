"use client";

import { useToast } from "@/components/ui/toast-provider";

interface MissYouItem {
  memberId: string;
  memberName: string;
  phone: string;
  daysInactive: number;
}

interface MissYouPanelProps {
  gymName: string;
  members: MissYouItem[];
}

export default function MissYouPanel({ gymName, members }: MissYouPanelProps) {
  const { showToast } = useToast();

  function whatsappHref(member: MissYouItem): string {
    const digits = member.phone.replace(/\D/g, "");
    const normalized = digits.length === 10 ? `91${digits}` : digits;
    const message = `Hi ${member.memberName}, we haven't seen you at ${gymName} for over a week! Consistency is key. See you tomorrow?`;
    return `https://wa.me/${normalized}?text=${encodeURIComponent(message)}`;
  }

  if (!members.length) {
    return (
      <div className="card tinted-card t2">
        <h2>Missing in Action (6+ days)</h2>
        <p className="muted">No members inactive for more than 6 days.</p>
      </div>
    );
  }

  return (
    <div className="card tinted-card t2">
      <div className="section-head">
        <h2>Missing in Action (6+ days)</h2>
        <span className="status-pill high">{members.length} members</span>
      </div>

      <div className="reminder-list">
        {members.map((member) => (
          <article key={member.memberId} className="reminder-item reminder-card">
            <div className="reminder-copy">
              <h3>{member.memberName}</h3>
              <p className="reminder-meta">Last seen {member.daysInactive} days ago</p>
            </div>
            <div className="reminder-actions">
              <button
                type="button"
                className="miss-you-btn"
                onClick={() => {
                  window.open(whatsappHref(member), "_blank", "noopener,noreferrer");
                  showToast(`Miss-you message opened for ${member.memberName}`, "success");
                }}
              >
                Miss You
              </button>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
