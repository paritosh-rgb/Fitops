import AppShell from "@/components/ui/app-shell";
import { buildDashboard } from "@/lib/analytics";
import { getServerSessionRole } from "@/lib/auth/server-session";
import { readStore } from "@/lib/store";

export default async function OverviewPage() {
  const store = await readStore();
  const role = await getServerSessionRole();
  const dashboard = buildDashboard(store);
  const activeRate = dashboard.metrics.totalMembers
    ? Math.round((dashboard.metrics.activeMembers / dashboard.metrics.totalMembers) * 100)
    : 0;

  return (
    <AppShell
      gymName={store.gymName}
      role={role}
      title="Overview"
      subtitle="Track core revenue, retention and follow-up signals at a glance."
    >
      <section className="metrics-grid">
        <article className="card metric visual-card v1">
          <h3>Total Members</h3>
          <p>{dashboard.metrics.totalMembers}</p>
          <span className="metric-tag">Base size</span>
        </article>
        <article className="card metric visual-card v2">
          <h3>Active Members</h3>
          <p>{dashboard.metrics.activeMembers}</p>
          <span className="metric-tag">{activeRate}% active</span>
        </article>
        <article className="card metric visual-card v3">
          <h3>Due in 7 Days</h3>
          <p>{dashboard.metrics.dueIn7Days}</p>
          <span className="metric-tag">Follow-up hotlist</span>
        </article>
        <article className="card metric visual-card v4">
          <h3>Expired</h3>
          <p>{dashboard.metrics.expiredMembers}</p>
          <span className="metric-tag">Recovery target</span>
        </article>
        <article className="card metric visual-card v5">
          <h3>Collected (MTD)</h3>
          <p>Rs {dashboard.metrics.monthlyCollectedInr.toLocaleString("en-IN")}</p>
          <span className="metric-tag">Cash-in</span>
        </article>
        <article className="card metric visual-card v6">
          <h3>Pending Collections</h3>
          <p>Rs {dashboard.metrics.pendingPaymentsInr.toLocaleString("en-IN")}</p>
          <span className="metric-tag">Collect now</span>
        </article>
        <article className="card metric visual-card v4">
          <h3>Monthly Expenses</h3>
          <p>Rs {dashboard.metrics.monthlyExpensesInr.toLocaleString("en-IN")}</p>
          <span className="metric-tag">Cost burn</span>
        </article>
        <article className="card metric visual-card v2">
          <h3>Net Profit</h3>
          <p>Rs {dashboard.metrics.netProfitInr.toLocaleString("en-IN")}</p>
          <span className="metric-tag">After expenses</span>
        </article>
      </section>

      <section className="module-grid">
        <div className="card table-card tinted-card t1">
          <h2>At-Risk Renewals</h2>
          <table>
            <thead>
              <tr>
                <th>Member</th>
                <th>Days</th>
                <th>Score</th>
                <th>Payment</th>
              </tr>
            </thead>
            <tbody>
              {dashboard.renewalPipeline.slice(0, 8).map((row) => (
                <tr key={row.memberId}>
                  <td>{row.memberName}</td>
                  <td>{row.daysToExpiry}</td>
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
                    <span className={`status-pill ${row.paymentStatus}`}>
                      {row.paymentStatus}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="card table-card tinted-card t2">
          <h2>Inactive Members (&gt; 7 days)</h2>
          <table>
            <thead>
              <tr>
                <th>Member</th>
                <th>Last Visit</th>
                <th>Phone</th>
              </tr>
            </thead>
            <tbody>
              {dashboard.inactiveMembers.slice(0, 8).map((row) => (
                <tr key={row.memberId}>
                  <td>{row.memberName}</td>
                  <td>{row.lastAttendanceDate ?? "No visit"}</td>
                  <td>{row.phone}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </AppShell>
  );
}
