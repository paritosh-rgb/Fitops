import MembersModule from "@/components/members-module";
import AppShell from "@/components/ui/app-shell";
import { getServerSession } from "@/lib/auth/server-session";
import { readStore } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function MembersPage() {
  const store = await readStore();
  const session = await getServerSession();

  return (
    <AppShell
      gymName={store.gymName}
      gymId={session.gymId}
      role={session.role}
      title="Members"
      subtitle="Onboard members, log payments, mark attendance and renew plans."
    >
      <MembersModule
        members={store.members}
        memberships={store.memberships}
        attendanceLogs={store.attendanceLogs}
        plans={store.plans}
        trainers={store.trainers}
      />
    </AppShell>
  );
}
