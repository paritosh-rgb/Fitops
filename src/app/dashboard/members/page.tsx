import MembersModule from "@/components/members-module";
import AppShell from "@/components/ui/app-shell";
import { getServerSessionRole } from "@/lib/auth/server-session";
import { readStore } from "@/lib/store";

export default async function MembersPage() {
  const store = await readStore();
  const role = await getServerSessionRole();

  return (
    <AppShell
      gymName={store.gymName}
      role={role}
      title="Members"
      subtitle="Onboard members, log payments, mark attendance and renew plans."
    >
      <MembersModule
        members={store.members}
        memberships={store.memberships}
        plans={store.plans}
        trainers={store.trainers}
      />
    </AppShell>
  );
}
