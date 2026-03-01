import LoginForm from "@/components/login-form";

interface LoginPageProps {
  searchParams: Promise<{ next?: string }>;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const nextPath = params.next ?? "/dashboard";

  return (
    <div className="login-root">
      <LoginForm nextPath={nextPath} />
    </div>
  );
}
