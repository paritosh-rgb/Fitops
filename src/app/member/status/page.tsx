import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import CheckInClient from "@/components/checkin/check-in-client";
import { MEMBER_SESSION_COOKIE_NAME, parseMemberSessionToken } from "@/lib/auth/member-session";
import { getCheckinToken } from "@/lib/checkin/qr";

export default async function MemberStatusPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get(MEMBER_SESSION_COOKIE_NAME)?.value;
  const session = parseMemberSessionToken(token);

  if (!session) {
    redirect("/member/login");
  }

  return (
    <div className="checkin-root">
      <CheckInClient
        token={getCheckinToken()}
        gymId={session.gymId}
        initialMemberId={session.memberCode}
        mode="member"
      />
    </div>
  );
}
