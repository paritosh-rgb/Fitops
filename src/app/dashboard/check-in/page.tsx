import QrCheckinModule from "@/components/checkin/qr-checkin-module";
import AppShell from "@/components/ui/app-shell";
import { getServerSession } from "@/lib/auth/server-session";
import { readStore } from "@/lib/store";
import { headers } from "next/headers";

export const dynamic = "force-dynamic";

export default async function CheckInPage() {
  const store = await readStore();
  const session = await getServerSession();
  const headerList = await headers();
  const host = headerList.get("x-forwarded-host") ?? headerList.get("host");
  const protocol = headerList.get("x-forwarded-proto") ?? "https";
  const baseUrl = host ? `${protocol}://${host}` : undefined;

  return (
    <AppShell
      gymName={store.gymName}
      gymId={session.gymId}
      role={session.role}
      title="QR Check-In"
      subtitle="Use one shared QR. Members scan and enter their Member ID to check in."
    >
      <QrCheckinModule gymId={session.gymId} baseUrl={baseUrl} />
    </AppShell>
  );
}
