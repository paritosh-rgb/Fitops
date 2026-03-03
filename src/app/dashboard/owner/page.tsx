import OwnerModule from "@/components/owner/owner-module";
import AppShell from "@/components/ui/app-shell";
import { buildDashboard } from "@/lib/analytics";
import { getServerSession } from "@/lib/auth/server-session";
import { readStore } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function OwnerPage() {
  const store = await readStore();
  const session = await getServerSession();
  const dashboard = buildDashboard(store);

  return (
    <AppShell
      gymName={store.gymName}
      gymId={session.gymId}
      role={session.role}
      title="Owner Ledger"
      subtitle="Track operating expenses and monitor true monthly net profit."
    >
      <OwnerModule
        expenses={store.expenses}
        payments={store.payments}
        activeMembers={dashboard.metrics.activeMembers}
        monthlyCollectedInr={dashboard.metrics.monthlyCollectedInr}
        monthlyExpensesInr={dashboard.metrics.monthlyExpensesInr}
        netProfitInr={dashboard.metrics.netProfitInr}
      />
    </AppShell>
  );
}
