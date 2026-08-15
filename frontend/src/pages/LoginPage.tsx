import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { ApiError } from "../lib/api";

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await login(email, password);
      navigate("/app");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Login failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-5 py-10">
      <Link to="/" className="font-display text-2xl text-[var(--color-forest)] dark:text-[var(--color-mint)]">
        Chatbots AI
      </Link>
      <h1 className="mt-8 text-3xl font-semibold tracking-tight">Welcome back</h1>
      <p className="mt-2 text-[var(--color-muted)]">Sign in to continue your conversations.</p>

      <form onSubmit={onSubmit} className="surface mt-8 space-y-4 rounded-2xl p-6 shadow-sm">
        <label className="block space-y-1.5">
          <span className="text-sm font-medium">Email</span>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-xl border border-[var(--color-line)] bg-white/80 px-3 py-2.5 outline-none ring-[var(--color-moss)] focus:ring-2 dark:border-[#2a4f49] dark:bg-[#0c2220]"
          />
        </label>
        <label className="block space-y-1.5">
          <span className="text-sm font-medium">Password</span>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-xl border border-[var(--color-line)] bg-white/80 px-3 py-2.5 outline-none ring-[var(--color-moss)] focus:ring-2 dark:border-[#2a4f49] dark:bg-[#0c2220]"
          />
        </label>
        {error && <p className="text-sm text-[var(--color-ember)]">{error}</p>}
        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-xl bg-[var(--color-forest)] px-4 py-2.5 font-semibold text-white transition hover:bg-[var(--color-moss)] disabled:opacity-60"
        >
          {busy ? "Signing in…" : "Sign in"}
        </button>
      </form>

      <p className="mt-6 text-sm text-[var(--color-muted)]">
        No account?{" "}
        <Link className="font-semibold text-[var(--color-forest)] dark:text-[var(--color-mint)]" to="/register">
          Create one
        </Link>
      </p>
    </div>
  );
}
