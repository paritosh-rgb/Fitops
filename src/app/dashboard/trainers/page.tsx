import AppShell from "@/components/ui/app-shell";
import { buildDashboard } from "@/lib/analytics";
import { getServerSessionRole } from "@/lib/auth/server-session";
import { readStore } from "@/lib/store";

export default async function TrainersPage() {
  const store = await readStore();
  const role = await getServerSessionRole();
  const dashboard = buildDashboard(store);
  const totalSupplement = dashboard.trainerSnapshot.reduce(
    (sum, row) => sum + row.supplementRevenueInr,
    0,
  );

  return (
    <AppShell
      gymName={store.gymName}
      role={role}
      title="Trainers"
      subtitle="Compare trainer-level accountability with member activity and revenue signals."
    >
      <section className="metrics-grid">
        <article className="card metric visual-card v2">
          <h3>Total Trainers</h3>
          <p>{dashboard.trainerSnapshot.length}</p>
          <span className="metric-tag">Team size</span>
        </article>
        <article className="card metric visual-card v5">
          <h3>Supplement Revenue</h3>
          <p>Rs {totalSupplement.toLocaleString("en-IN")}</p>
          <span className="metric-tag">All trainers combined</span>
        </article>
      </section>

      <section className="module-grid single-col">
        <div className="card table-card tinted-card t4">
          <h2>Trainer Performance Snapshot</h2>
          <table>
            <thead>
              <tr>
                <th>Trainer</th>
                <th>Assigned Members</th>
                <th>Active Members</th>
                <th>Supplement Revenue</th>
              </tr>
            </thead>
            <tbody>
              {dashboard.trainerSnapshot.map((row) => (
                <tr key={row.trainerId}>
                  <td>{row.trainerName}</td>
                  <td>{row.assignedMembers}</td>
                  <td>
                    <div className="score-cell">
                      <span>{row.activeAssignedMembers}</span>
                      <div className="score-track">
                        <div
                          className="score-fill"
                          style={{
                            width: `${
                              row.assignedMembers
                                ? Math.round((row.activeAssignedMembers / row.assignedMembers) * 100)
                                : 0
                            }%`,
                          }}
                        />
                      </div>
                    </div>
                  </td>
                  <td>Rs {row.supplementRevenueInr.toLocaleString("en-IN")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </AppShell>
  );
}
