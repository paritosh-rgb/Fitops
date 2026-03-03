import AppShell from "@/components/ui/app-shell";
import TrainersModule from "@/components/trainers-module";
import { buildDashboard } from "@/lib/analytics";
import { getServerSession } from "@/lib/auth/server-session";
import { readStore } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function TrainersPage() {
  const store = await readStore();
  const session = await getServerSession();
  const dashboard = buildDashboard(store);
  const totalSupplement = dashboard.trainerSnapshot.reduce(
    (sum, row) => sum + row.supplementRevenueInr,
    0,
  );

  return (
    <AppShell
      gymName={store.gymName}
      gymId={session.gymId}
      role={session.role}
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

      <TrainersModule
        role={session.role}
        trainers={store.trainers}
        trainerSnapshot={dashboard.trainerSnapshot}
        totalMembers={store.members.length}
        members={store.members}
        programs={store.memberPrograms}
      />
    </AppShell>
  );
}
