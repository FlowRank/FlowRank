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
  const [status, setStatus] = useState<"pending" | "success" | "failed">("pending");
  const [detail, setDetail] = useState("");

  useEffect(() => {
    if (error) {
      setStatus("failed");
      setDetail(`Account linking failed: ${error}.`);
      return;
    }

    if (!code || !state) {
      setStatus("failed");
      setDetail("Google callback is incomplete (missing code or state).");
      return;
    }

    const accessToken = localStorage.getItem("access_token");
    if (!accessToken) {
      setStatus("failed");
      setDetail("Session expired. Sign in again, then restart account linking.");
      return;
    }

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
          setStatus("failed");
          setDetail(data.detail ?? "Unable to complete Google account linking.");
          return;
        }

        setStatus("success");
        setDetail(data.message ?? "Google account linked successfully.");
      } catch {
        if (!controller.signal.aborted) {
          setStatus("failed");
          setDetail("The server is unavailable. Please try again shortly.");
        }
      }
    };

    void exchangeCode();
    return () => controller.abort();
  }, [API_BASE_URL, code, error, state]);

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
                title="Continue"
                couleur="green"
                onClick={() => navigate("/")}
                classNameAddon="w-full"
              />
            )}
            {(isFailed || isPending) && (
              <div className="grid gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  className="rounded-2xl border border-slate-900 bg-slate-900 px-5 py-3 text-base font-semibold text-white shadow-sm transition hover:bg-slate-800"
                  onClick={() => navigate("/link-account")}
                >
                  Back to linking
                </button>
                <button
                  type="button"
                  className="rounded-2xl border border-slate-900 bg-slate-900 px-5 py-3 text-base font-semibold text-white transition hover:bg-slate-800"
                  onClick={() => navigate("/")}
                >
                  Home
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
