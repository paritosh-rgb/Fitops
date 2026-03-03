import MemberSignupForm from "@/components/member/member-signup-form";

interface MemberSignupPageProps {
  searchParams: Promise<{ gym?: string }>;
}

export default async function MemberSignupPage({ searchParams }: MemberSignupPageProps) {
  const params = await searchParams;
  return (
    <div className="signup-root">
      <MemberSignupForm gymIdParam={params.gym ?? ""} />
    </div>
  );
}
