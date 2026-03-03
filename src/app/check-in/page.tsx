import CheckInClient from "@/components/checkin/check-in-client";
import { getCheckinToken, isValidCheckinToken } from "@/lib/checkin/qr";
import Link from "next/link";

interface CheckInPageProps {
  searchParams: Promise<{ memberId?: string; token?: string; gym?: string }>;
}

export default async function PublicCheckInPage({ searchParams }: CheckInPageProps) {
  const params = await searchParams;
  const memberId = params.memberId;
  const token = params.token?.trim() ?? "";
  const gymId = params.gym;
  const resolvedToken = isValidCheckinToken(token) ? token : getCheckinToken();

  if (!gymId) {
    return (
      <div className="checkin-root">
        <div className="checkin-card">
          <h1>Invalid QR</h1>
          <p className="muted">Please scan a valid gym check-in QR code.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="checkin-root">
      <p className="muted">
        Want personal dashboard access?{" "}
        <Link href={`/member/login?gym=${encodeURIComponent(gymId)}`}>Member Login</Link>
      </p>
      <CheckInClient token={resolvedToken} gymId={gymId} initialMemberId={memberId} />
    </div>
  );
}
