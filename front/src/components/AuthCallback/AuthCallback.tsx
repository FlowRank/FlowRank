import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Confirm from "../Confirm/confirm";
import HeaderAccueil from "../Header/HeaderAccueil";

const AuthCallback: React.FC = () => {
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "/api";
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const error = searchParams.get("error");
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const accessToken = useMemo(() => localStorage.getItem("access_token"), []);
  const callbackFailure = useMemo(() => {
    if (error) {
      return `Account linking failed: ${error}.`;
    }
    if (!code || !state) {
      return "Google callback is incomplete (missing code or state).";
    }
    if (!accessToken) {
      return "Session expired. Sign in again, then restart account linking.";
    }
    return "";
  }, [accessToken, code, error, state]);
  const [exchangeState, setExchangeState] = useState<{
    detail: string;
    status: "pending" | "success" | "failed";
  }>({ detail: "", status: "pending" });

  useEffect(() => {
    if (callbackFailure || !accessToken || !code || !state) return;

    const controller = new AbortController();
    const exchangeCode = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/account/google/exchange`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({ code, state }),
          signal: controller.signal,
        });

        const data = (await response.json()) as { message?: string; detail?: string };
        if (!response.ok) {
          setExchangeState({
            detail: data.detail ?? "Unable to complete Google account linking.",
            status: "failed",
          });
          return;
        }

        setExchangeState({
          detail: data.message ?? "Google account linked successfully.",
          status: "success",
        });
      } catch {
        if (!controller.signal.aborted) {
          setExchangeState({
            detail: "The server is unavailable. Please try again shortly.",
            status: "failed",
          });
        }
      }
    };

    void exchangeCode();
    return () => controller.abort();
  }, [API_BASE_URL, accessToken, callbackFailure, code, state]);

  const status = callbackFailure ? "failed" : exchangeState.status;
  const detail = callbackFailure || exchangeState.detail;

  useEffect(() => {
    if (status !== "success") return;
    const t = window.setTimeout(() => {
      navigate("/dashboard", { replace: true });
    }, 600);
    return () => window.clearTimeout(t);
  }, [navigate, status]);

  const isPending = status === "pending";
  const isFailed = status === "failed";
  const isSuccess = status === "success";
  const title = useMemo(() => {
    if (isSuccess) {
      return "Account linked successfully";
    }
    if (isFailed) {
      return "Account linking failed";
    }
    return "Linking account";
  }, [isFailed, isSuccess]);

  const message = useMemo(() => {
    if (isPending) {
      return "Finalizing account linking with Google...";
    }
    if (detail) {
      return detail;
    }
    return "Please wait while we verify your request.";
  }, [detail, isPending]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-900">
      <HeaderAccueil hideConnexionButton />
      <main className="flex min-h-[calc(100vh-96px)] items-center justify-center px-4 py-10">
        <div className="w-full max-w-md rounded-[32px] border border-white/10 bg-white/90 p-8 shadow-2xl backdrop-blur-xl">
          <h2 className="text-center text-3xl font-semibold text-slate-900 mb-8">
            {title}
          </h2>
          <p className="mb-8 text-center text-sm text-slate-500 whitespace-pre-line">
            {message}
          </p>
          {isPending && (
            <div className="flex items-center justify-center mb-6">
              <div className="h-10 w-10 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" />
            </div>
          )}
          <div className="space-y-4">
            {isSuccess && (
              <Confirm
                title="Continue to dashboard"
                couleur="green"
                onClick={() => navigate("/dashboard", { replace: true })}
                classNameAddon="w-full"
              />
            )}
            {(isFailed || isPending) && (
              <div className="grid gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  className="rounded-2xl border border-transparent bg-emerald-700 px-5 py-3 text-base font-semibold text-white shadow-sm transition hover:bg-emerald-600"
                  onClick={() => navigate("/link-account")}
                >
                  Back to linking
                </button>
                <button
                  type="button"
                  className="rounded-2xl border border-transparent bg-emerald-700 px-5 py-3 text-base font-semibold text-white transition hover:bg-emerald-600"
                  onClick={() => navigate("/login")}
                >
                  Sign in
                </button>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default AuthCallback;
