import QrCheckinModule from "@/components/checkin/qr-checkin-module";
import AppShell from "@/components/ui/app-shell";
import { getServerSessionRole } from "@/lib/auth/server-session";
import { readStore } from "@/lib/store";

export default async function CheckInPage() {
  const store = await readStore();
  const role = await getServerSessionRole();

  return (
    <AppShell
      gymName={store.gymName}
      role={role}
      title="QR Check-In"
      subtitle="Use one shared QR. Members scan and enter their Member ID to check in."
    >
      <QrCheckinModule />
    </AppShell>
  );
}
