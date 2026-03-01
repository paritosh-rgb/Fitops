import GrowthModule from "@/components/growth/growth-module";
import AppShell from "@/components/ui/app-shell";
import { buildDashboard } from "@/lib/analytics";
import { getServerSessionRole } from "@/lib/auth/server-session";
import { readStore } from "@/lib/store";

export default async function GrowthPage() {
  const store = await readStore();
  const role = await getServerSessionRole();
  const dashboard = buildDashboard(store);
  const expiredMembers = dashboard.renewalPipeline
    .filter((row) => row.daysToExpiry < 0)
    .map((row) => ({ memberId: row.memberId, memberName: row.memberName }));

  return (
    <AppShell
      gymName={store.gymName}
      role={role}
      title="Growth"
      subtitle="Run lead conversions, referrals, and festival comeback campaigns."
    >
      <GrowthModule
        leads={store.leads}
        referrals={store.referrals}
        members={store.members}
        expiredMembers={expiredMembers}
      />
    </AppShell>
  );
}
