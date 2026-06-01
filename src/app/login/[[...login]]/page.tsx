import { SignIn } from "@clerk/nextjs";

export default function LoginPage() {
  return (
    <main className="auth-screen">
      <section className="card auth-card">
        <div className="card-content" style={{ padding: 34 }}>
          <p className="kicker">secure operator console</p>
          <h1 className="page-title" style={{ fontSize: "clamp(42px, 9vw, 72px)" }}>Aniyume Admin</h1>
          <p className="page-subtitle">
            Вход через Clerk. Доступ к backend admin API дополнительно проверяется по Clerk JWT и allowlist/role на сервере.
          </p>
          <div style={{ display: "grid", justifyContent: "center", marginTop: 28 }}>
            <SignIn routing="path" path="/login" fallbackRedirectUrl="/dashboard" signUpUrl="/sign-up" />
          </div>
        </div>
      </section>
    </main>
  );
}
