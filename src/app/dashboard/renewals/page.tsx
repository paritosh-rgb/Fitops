import DuesReminderPanel from "@/components/renewals/dues-reminder-panel";
import MembershipReminderPanel from "@/components/renewals/membership-reminder-panel";
import MissYouPanel from "@/components/renewals/miss-you-panel";
import AppShell from "@/components/ui/app-shell";
import { buildDashboard } from "@/lib/analytics";
import { getServerSession } from "@/lib/auth/server-session";
import { buildDueReminders } from "@/lib/reminders/dues";
import { readStore } from "@/lib/store";

export const dynamic = "force-dynamic";

function reminderBucket(daysToExpiry: number): string {
  if (daysToExpiry === 7) return "7-day reminder";
  if (daysToExpiry === 3) return "3-day reminder";
  if (daysToExpiry === 0) return "Expiry day";
  if (daysToExpiry === -3) return "Post-expiry follow-up";
  if (daysToExpiry < 0) return "Expired";
  return "Monitor";
}

function urgencyClass(daysToExpiry: number): string {
  if (daysToExpiry < 0) return "critical";
  if (daysToExpiry <= 3) return "high";
  if (daysToExpiry <= 7) return "medium";
  return "low";
}

export default async function RenewalsPage() {
  const store = await readStore();
  const session = await getServerSession();
  const dashboard = buildDashboard(store);
  const today = new Date();
  const dueReminders = buildDueReminders(store);
  const membershipReminders = dashboard.renewalPipeline.filter((row) => row.daysToExpiry <= 7);
  const missingInAction = dashboard.renewalPipeline
    .filter((row) => row.lastAttendanceDate)
    .map((row) => {
      const lastSeen = new Date(`${row.lastAttendanceDate}T00:00:00`);
      const daysInactive = Math.floor((today.getTime() - lastSeen.getTime()) / (1000 * 60 * 60 * 24));
      return { row, daysInactive };
    })
    .filter((row) => row.daysInactive > 6)
    .map((row) => ({
      memberId: row.row.memberId,
      memberName: row.row.memberName,
      phone: row.row.phone,
      daysInactive: row.daysInactive,
    }))
    .sort((a, b) => b.daysInactive - a.daysInactive);
  const highRisk = dashboard.renewalPipeline.filter((row) => row.renewalProbabilityScore < 45).length;

  return (
    <AppShell
      gymName={store.gymName}
      gymId={session.gymId}
      role={session.role}
      title="Renewals"
      subtitle="Prioritize expiring members and run retention follow-ups systematically."
    >
      <section className="metrics-grid">
        <article className="card metric visual-card v3">
          <h3>Expiring This Week</h3>
          <p>{dashboard.metrics.dueIn7Days}</p>
          <span className="metric-tag">Immediate outreach</span>
        </article>
        <article className="card metric visual-card v4">
          <h3>High Churn Risk</h3>
          <p>{highRisk}</p>
          <span className="metric-tag">Score below 45</span>
        </article>
        <article className="card metric visual-card v6">
          <h3>Dues Reminders</h3>
          <p>{dueReminders.length}</p>
          <span className="metric-tag">Pending/partial payments</span>
        </article>
        <article className="card metric visual-card v1">
          <h3>Membership Reminders</h3>
          <p>{membershipReminders.length}</p>
          <span className="metric-tag">Expiry follow-ups</span>
        </article>
        <article className="card metric visual-card v2">
          <h3>Missing in Action</h3>
          <p>{missingInAction.length}</p>
          <span className="metric-tag">Inactive 6+ days</span>
        </article>
      </section>

      <section className="module-grid single-col">
        <MembershipReminderPanel gymName={store.gymName} reminders={membershipReminders} />
        <MissYouPanel gymName={store.gymName} members={missingInAction} />
        <DuesReminderPanel reminders={dueReminders} />

        <div className="card table-card tinted-card t3">
          <h2>Renewal Pipeline</h2>
          <table>
            <thead>
              <tr>
                <th>Member</th>
                <th>Expiry</th>
                <th>Days</th>
                <th>Score</th>
                <th>Next Reminder</th>
                <th>Payment</th>
              </tr>
            </thead>
            <tbody>
              {dashboard.renewalPipeline.map((row) => (
                <tr key={row.memberId}>
                  <td>{row.memberName}</td>
                  <td>{row.expiryDate}</td>
                  <td>
                    <span className={`status-pill ${urgencyClass(row.daysToExpiry)}`}>
                      {row.daysToExpiry}
                    </span>
                  </td>
                  <td>
                    <div className="score-cell">
                      <span>{row.renewalProbabilityScore}</span>
                      <div className="score-track">
                        <div
                          className="score-fill"
                          style={{ width: `${row.renewalProbabilityScore}%` }}
                        />
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className={`status-pill ${urgencyClass(row.daysToExpiry)}`}>
                      {reminderBucket(row.daysToExpiry)}
                    </span>
                  </td>
                  <td>
                    <span className={`status-pill ${row.paymentStatus}`}>
                      {row.paymentStatus}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </AppShell>
  );
}
