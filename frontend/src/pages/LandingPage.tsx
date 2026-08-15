import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export function LandingPage() {
  const { user } = useAuth();

  return (
    <div className="relative min-h-screen overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%230b3d3a' fill-opacity='0.06'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")",
        }}
      />

      <header className="relative mx-auto flex max-w-6xl items-center justify-between px-5 py-6">
        <p className="font-display text-2xl tracking-tight text-[var(--color-forest)] dark:text-[var(--color-mint)]">
          Chatbots AI
        </p>
        <nav className="flex items-center gap-3">
          {user ? (
            <Link
              to="/app"
              className="rounded-xl bg-[var(--color-forest)] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[var(--color-moss)]"
            >
              Open chat
            </Link>
          ) : (
            <>
              <Link to="/login" className="px-3 py-2 text-sm font-medium text-[var(--color-muted)] hover:text-[var(--color-ink)] dark:hover:text-white">
                Sign in
              </Link>
              <Link
                to="/register"
                className="rounded-xl bg-[var(--color-forest)] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[var(--color-moss)]"
              >
                Get started
              </Link>
            </>
          )}
        </nav>
      </header>

      <main className="relative mx-auto grid max-w-6xl gap-10 px-5 pb-20 pt-8 md:grid-cols-[1.05fr_0.95fr] md:items-center md:pt-16">
        <section className="animate-[rise_0.8s_ease-out]">
          <p className="font-display text-5xl leading-[1.05] tracking-tight text-[var(--color-forest)] md:text-7xl dark:text-[var(--color-mint)]">
            Chatbots AI
          </p>
          <h1 className="mt-5 max-w-xl text-2xl font-semibold tracking-tight md:text-3xl">
            Ask anything. Learn faster. Keep every conversation.
          </h1>
          <p className="mt-4 max-w-lg text-base leading-relaxed text-[var(--color-muted)] md:text-lg">
            A clean chat workspace for students, developers, and curious minds — explanations,
            code help, writing, and brainstorming in one place.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              to={user ? "/app" : "/register"}
              className="rounded-xl bg-[var(--color-ember)] px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:brightness-110"
            >
              {user ? "Continue chatting" : "Create free account"}
            </Link>
            <Link
              to="/login"
              className="rounded-xl border border-[var(--color-line)] bg-white/50 px-5 py-3 text-sm font-semibold backdrop-blur transition hover:bg-white dark:border-[#2a4f49] dark:bg-[#0c2220]/70"
            >
              Sign in
            </Link>
          </div>
        </section>

        <section
          aria-hidden
          className="surface relative min-h-[360px] overflow-hidden rounded-[2rem] p-5 shadow-lg animate-[float_5s_ease-in-out_infinite]"
        >
          <div className="absolute inset-0 bg-[linear-gradient(145deg,rgba(11,61,58,0.92),rgba(31,111,104,0.75),rgba(196,92,38,0.35))]" />
          <div className="relative flex h-full flex-col justify-between text-[var(--color-mint)]">
            <div>
              <p className="text-sm uppercase tracking-[0.2em] opacity-80">Live preview</p>
              <p className="mt-4 font-display text-3xl leading-tight">Explain recursion like I’m new to coding.</p>
            </div>
            <div className="space-y-3">
              <div className="rounded-2xl bg-white/10 p-4 text-sm leading-relaxed backdrop-blur">
                Think of a stack of plates. Each function call waits for the next one to finish —
                then unwinds back up.
              </div>
              <div className="ml-auto max-w-[80%] rounded-2xl bg-[var(--color-sand)]/95 p-3 text-sm text-[var(--color-ink)]">
                Got it — show me a Python example.
              </div>
            </div>
          </div>
        </section>
      </main>

      <style>{`
        @keyframes rise {
          from { opacity: 0; transform: translateY(18px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }
      `}</style>
    </div>
  );
}
