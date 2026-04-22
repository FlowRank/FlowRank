import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import HeaderAccueil from "../Header/HeaderAccueil";

const CreateAccount: React.FC = () => {
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "/api";
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    if (password !== confirmPassword) {
      setErrorMessage("Passwords do not match.");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(`${API_BASE_URL}/account/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = (await response.json()) as { message?: string; detail?: string };

      if (!response.ok) {
        setErrorMessage(data.message ?? data.detail ?? "Unable to create the account.");
        return;
      }

      const loginResponse = await fetch(`${API_BASE_URL}/account/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const loginData = (await loginResponse.json()) as {
        access_token?: string;
        message?: string;
        detail?: string;
      };

      if (!loginResponse.ok || !loginData.access_token) {
        setErrorMessage(
          loginData.message ??
            loginData.detail ??
            "Account created, but automatic sign-in failed.",
        );
        return;
      }

      localStorage.setItem("access_token", loginData.access_token);
      setSuccessMessage(data.message ?? "Account created successfully.");
      navigate("/link-account");
    } catch {
      setErrorMessage("The server is unavailable. Please try again shortly.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
      <div className="min-h-screen bg-slate-950 text-slate-900">
        <HeaderAccueil />
        <main className="flex min-h-[calc(100vh-96px)] items-center justify-center px-4 py-10">
          <div className="w-full max-w-md rounded-[32px] border border-white/10 bg-white/90 p-8 shadow-2xl backdrop-blur-xl">
            <h2 className="text-center text-3xl font-semibold text-slate-900 mb-8">
              Sign up
            </h2>
            {errorMessage && (
              <p className="mb-4 rounded-xl bg-red-100 px-4 py-3 text-sm text-red-700">
                {errorMessage}
              </p>
            )}
            {successMessage && (
              <p className="mb-4 rounded-xl bg-emerald-100 px-4 py-3 text-sm text-emerald-700">
                {successMessage}
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
              <div>
                <label className="block text-sm font-medium text-slate-700">
                  Confirm password
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-900 shadow-sm outline-none transition focus:border-amber-600 focus:ring-2 focus:ring-amber-100"
                  placeholder="••••••••"
                />
              </div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full rounded-2xl bg-amber-700 px-5 py-3 text-base font-semibold text-white transition hover:bg-amber-800"
              >
                {isSubmitting ? "Creating..." : "Create account"}
              </button>
            </form>
          </div>
        </main>
      </div>
    );
};

export default CreateAccount;