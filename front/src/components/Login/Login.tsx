import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import HeaderAccueil from "../Header/HeaderAccueil";

const Login: React.FC = () => {
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "/api";
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage("");
    setIsSubmitting(true);

    try {
      const response = await fetch(`${API_BASE_URL}/account/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = (await response.json()) as {
        message?: string;
        detail?: string;
        access_token?: string;
      };

      if (!response.ok) {
        setErrorMessage(data.message ?? data.detail ?? "Invalid credentials.");
        return;
      }

      if (data.access_token) {
        localStorage.setItem("access_token", data.access_token);
      }
      navigate("/link-account");
    } catch {
      setErrorMessage("The server is unavailable. Please try again shortly.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-900">
      <HeaderAccueil hideConnexionButton />
      <main className="flex min-h-[calc(100vh-96px)] items-center justify-center px-4 py-10">
        <div className="w-full max-w-md rounded-[32px] border border-white/10 bg-white/90 p-8 shadow-2xl backdrop-blur-xl">
          <h2 className="text-center text-3xl font-semibold text-slate-900 mb-8">
            Login
          </h2>
          {errorMessage && (
            <p className="mb-4 rounded-xl bg-red-100 px-4 py-3 text-sm text-red-700">
              {errorMessage}
            </p>
          )}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-700">
                Email address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-900 shadow-sm outline-none transition focus:border-amber-600 focus:ring-2 focus:ring-amber-100"
                placeholder="example@mail.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-900 shadow-sm outline-none transition focus:border-amber-600 focus:ring-2 focus:ring-amber-100"
                placeholder="••••••••"
              />
            </div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-2xl bg-emerald-600 px-5 py-3 text-base font-semibold text-white transition hover:bg-emerald-700"
            >
              {isSubmitting ? "Signing in..." : "Sign in"}
            </button>
          </form>
          <p className="mt-6 text-center text-sm text-slate-500">
            No account yet?
            <Link
              to="/create-account"
              className="ml-2 font-semibold text-amber-700 hover:text-amber-800"
            >
              Create account
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
};

export default Login;
