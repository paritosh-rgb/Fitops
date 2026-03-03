import CheckInClient from "@/components/checkin/check-in-client";
import { isValidCheckinToken } from "@/lib/checkin/qr";

interface CheckInPageProps {
  searchParams: Promise<{ memberId?: string; token?: string; gym?: string }>;
}

export default async function PublicCheckInPage({ searchParams }: CheckInPageProps) {
  const params = await searchParams;
  const memberId = params.memberId;
  const token = params.token;
  const gymId = params.gym;

  if (!token || !gymId || !isValidCheckinToken(token)) {
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
      <CheckInClient token={token} gymId={gymId} initialMemberId={memberId} />
    </div>
  );
}
