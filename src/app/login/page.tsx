import { redirect } from "next/navigation";
import { auth, signIn } from "@/lib/auth";

interface LoginPageProps {
  searchParams: Promise<{ error?: string }>;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const session = await auth();
  if (session?.user) {
    redirect("/editor");
  }

  const { error } = await searchParams;

  return (
    <main className="page">
      <div className="card" style={{ maxWidth: 420, margin: "64px auto" }}>
        <h1 className="page-title">SFOOD IT Tech Blog</h1>
        <p className="page-subtitle">
          사내 MS 계정으로 로그인하면 문서를 작성·게시할 수 있습니다.
        </p>

        {error && (
          <p className="error-text">
            로그인에 실패했습니다. 다시 시도해 주세요.
          </p>
        )}

        <form
          action={async () => {
            "use server";
            await signIn("microsoft-entra-id", { redirectTo: "/editor" });
          }}
        >
          <button type="submit" className="button button-primary">
            MS 계정으로 로그인
          </button>
        </form>
      </div>
    </main>
  );
}
