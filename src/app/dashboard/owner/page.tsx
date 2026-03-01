import OwnerModule from "@/components/owner/owner-module";
import AppShell from "@/components/ui/app-shell";
import { buildDashboard } from "@/lib/analytics";
import { getServerSessionRole } from "@/lib/auth/server-session";
import { readStore } from "@/lib/store";

export default async function OwnerPage() {
  const store = await readStore();
  const role = await getServerSessionRole();
  const dashboard = buildDashboard(store);

  return (
    <AppShell
      gymName={store.gymName}
      role={role}
      title="Owner Ledger"
      subtitle="Track operating expenses and monitor true monthly net profit."
    >
      <OwnerModule
        expenses={store.expenses}
        monthlyCollectedInr={dashboard.metrics.monthlyCollectedInr}
        monthlyExpensesInr={dashboard.metrics.monthlyExpensesInr}
        netProfitInr={dashboard.metrics.netProfitInr}
      />
    </AppShell>
  );
}
