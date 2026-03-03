import AppShell from "@/components/ui/app-shell";
import { buildDashboard } from "@/lib/analytics";
import { getServerSession } from "@/lib/auth/server-session";
import { readStore } from "@/lib/store";

export const dynamic = "force-dynamic";

function pct(numerator: number, denominator: number): number {
  if (!denominator) return 0;
  return Math.round((numerator / denominator) * 100);
}

export default async function OverviewPage() {
  const store = await readStore();
  const session = await getServerSession();
  const dashboard = buildDashboard(store);
  const activeRate = dashboard.metrics.totalMembers
    ? Math.round((dashboard.metrics.activeMembers / dashboard.metrics.totalMembers) * 100)
    : 0;
  const currentMonth = new Date().toISOString().slice(0, 7);
  const monthlyPayments = store.payments.filter((row) => row.date.startsWith(currentMonth));
  const billedThisMonthInr = monthlyPayments.reduce((sum, row) => sum + row.amountInr, 0);
  const paidThisMonthInr = monthlyPayments
    .filter((row) => row.status === "paid")
    .reduce((sum, row) => sum + row.amountInr, 0);
  const upiCollectedInr = monthlyPayments
    .filter((row) => row.status === "paid" && row.method === "upi")
    .reduce((sum, row) => sum + row.amountInr, 0);
  const arpmInr = dashboard.metrics.activeMembers
    ? Math.round(dashboard.metrics.monthlyCollectedInr / dashboard.metrics.activeMembers)
    : 0;
  const collectionEfficiencyPct = pct(paidThisMonthInr, billedThisMonthInr);
  const upiSharePct = pct(upiCollectedInr, paidThisMonthInr);
  const trainerCoveragePct = pct(
    store.members.filter((member) => Boolean(member.assignedTrainerId)).length,
    store.members.length,
  );
  const supplementAttachPct = pct(
    new Set(store.supplementOrders.map((order) => order.memberId)).size,
    dashboard.metrics.activeMembers,
  );
  const churnPct = pct(dashboard.metrics.expiredMembers, dashboard.metrics.totalMembers);

  const today = new Date();
  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - 6);
  const activeVisitSet = new Set(
    store.attendanceLogs
      .filter((row) => {
        const rowDate = new Date(`${row.date}T00:00:00`);
        return rowDate >= weekStart && rowDate <= today;
      })
      .map((row) => row.memberId),
  );
  const visitConsistencyPct = pct(activeVisitSet.size, dashboard.metrics.activeMembers);

  const duesAging = { d0_7: 0, d8_15: 0, d16_30: 0, d30_plus: 0 };
  for (const row of dashboard.renewalPipeline) {
    if (row.paymentStatus === "paid" || row.daysToExpiry >= 0) continue;
    const overdueDays = Math.abs(row.daysToExpiry);
    if (overdueDays <= 7) duesAging.d0_7 += 1;
    else if (overdueDays <= 15) duesAging.d8_15 += 1;
    else if (overdueDays <= 30) duesAging.d16_30 += 1;
    else duesAging.d30_plus += 1;
  }
  const totalDuesAging =
    duesAging.d0_7 + duesAging.d8_15 + duesAging.d16_30 + duesAging.d30_plus;
  const maxDuesBucket = Math.max(
    1,
    duesAging.d0_7,
    duesAging.d8_15,
    duesAging.d16_30,
    duesAging.d30_plus,
  );

  return (
    <AppShell
      gymName={store.gymName}
      gymId={session.gymId}
      role={session.role}
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
        <div className="card span-2 kpi-panel overview-kpi-panel">
          <div className="section-head">
            <h2>KPI Command Center</h2>
            <span className="status-pill low">Month: {currentMonth}</span>
          </div>
          <div className="kpi-chip-grid">
            <article className="kpi-chip c1">
              <p>ARPM</p>
              <strong>Rs {arpmInr.toLocaleString("en-IN")}</strong>
              <small>Avg revenue per active member</small>
            </article>
            <article className="kpi-chip c2">
              <p>Collection Efficiency</p>
              <strong>{collectionEfficiencyPct}%</strong>
              <small>Paid vs billed</small>
            </article>
            <article className="kpi-chip c3">
              <p>Weekly Consistency</p>
              <strong>{visitConsistencyPct}%</strong>
              <small>Active members seen in last 7 days</small>
            </article>
            <article className="kpi-chip c4">
              <p>Churn Rate</p>
              <strong>{churnPct}%</strong>
              <small>Expired from total base</small>
            </article>
            <article className="kpi-chip c5">
              <p>Trainer Coverage</p>
              <strong>{trainerCoveragePct}%</strong>
              <small>Members mapped to trainer</small>
            </article>
            <article className="kpi-chip c6">
              <p>Supplement Attach</p>
              <strong>{supplementAttachPct}%</strong>
              <small>Active members who bought supplements</small>
            </article>
          </div>
        </div>

        <div className="card kpi-chart-card tinted-card t2">
          <h2>Revenue Quality Radar</h2>
          <div className="source-bars">
            <div className="source-row">
              <p>Collection efficiency</p>
              <div className="bar-track">
                <div className="bar-fill cash" style={{ width: `${collectionEfficiencyPct}%` }} />
              </div>
              <span>{collectionEfficiencyPct}%</span>
            </div>
            <div className="source-row">
              <p>UPI mix</p>
              <div className="bar-track">
                <div className="bar-fill upi" style={{ width: `${upiSharePct}%` }} />
              </div>
              <span>{upiSharePct}%</span>
            </div>
            <div className="source-row">
              <p>Trainer coverage</p>
              <div className="bar-track">
                <div className="bar-fill walk_in" style={{ width: `${trainerCoveragePct}%` }} />
              </div>
              <span>{trainerCoveragePct}%</span>
            </div>
          </div>
        </div>

        <div className="card kpi-chart-card tinted-card t3">
          <h2>Pending Dues Aging</h2>
          <div className="source-bars">
            <div className="source-row">
              <p>0 to 7 days</p>
              <div className="bar-track">
                <div className="bar-fill walk_in" style={{ width: `${Math.round((duesAging.d0_7 / maxDuesBucket) * 100)}%` }} />
              </div>
              <span>{duesAging.d0_7}</span>
            </div>
            <div className="source-row">
              <p>8 to 15 days</p>
              <div className="bar-track">
                <div className="bar-fill referral" style={{ width: `${Math.round((duesAging.d8_15 / maxDuesBucket) * 100)}%` }} />
              </div>
              <span>{duesAging.d8_15}</span>
            </div>
            <div className="source-row">
              <p>16 to 30 days</p>
              <div className="bar-track">
                <div className="bar-fill instagram" style={{ width: `${Math.round((duesAging.d16_30 / maxDuesBucket) * 100)}%` }} />
              </div>
              <span>{duesAging.d16_30}</span>
            </div>
            <div className="source-row">
              <p>30+ days</p>
              <div className="bar-track">
                <div className="bar-fill other" style={{ width: `${Math.round((duesAging.d30_plus / maxDuesBucket) * 100)}%` }} />
              </div>
              <span>{duesAging.d30_plus}</span>
            </div>
          </div>
          <p className="muted">Total overdue members: {totalDuesAging}</p>
        </div>

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
