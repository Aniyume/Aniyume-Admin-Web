import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <main className="auth-screen">
      <section className="card auth-card">
        <div className="card-content" style={{ padding: 34 }}>
          <p className="kicker">secure operator console</p>
          <h1 className="page-title" style={{ fontSize: "clamp(42px, 9vw, 72px)" }}>Create Admin</h1>
          <p className="page-subtitle">
            Создай Clerk аккаунт. Backend пропустит только email из admin allowlist.
          </p>
          <div style={{ display: "grid", justifyContent: "center", marginTop: 28 }}>
            <SignUp routing="path" path="/sign-up" fallbackRedirectUrl="/dashboard" signInUrl="/login" />
          </div>
        </div>
      </section>
    </main>
  );
}
