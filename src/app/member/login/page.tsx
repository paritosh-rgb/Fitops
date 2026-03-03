import MemberLoginForm from "@/components/member/member-login-form";

interface MemberLoginPageProps {
  searchParams: Promise<{ gym?: string }>;
}

export default async function MemberLoginPage({ searchParams }: MemberLoginPageProps) {
  const params = await searchParams;
  return (
    <div className="login-root">
      <MemberLoginForm gymIdParam={params.gym ?? ""} />
    </div>
  );
}
