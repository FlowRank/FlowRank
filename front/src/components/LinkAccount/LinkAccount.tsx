import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Confirm from "../Confirm/confirm";
import HeaderAccueil from "../Header/HeaderAccueil";

const LierCompte: React.FC = () => {
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "/api";
  const navigate = useNavigate();
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleLinkAccount = async () => {
    const accessToken = localStorage.getItem("access_token");
    if (!accessToken) {
      setErrorMessage("Sign in first to link your Google account.");
      navigate("/login");
      return;
    }

    setErrorMessage("");
    setIsSubmitting(true);
    try {
      const response = await fetch(`${API_BASE_URL}/account/google/auth-url`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      const data = (await response.json()) as {
        authorization_url?: string;
        detail?: string;
      };

      if (!response.ok || !data.authorization_url) {
        setErrorMessage(
          data.detail ?? "Unable to start Google account linking. Please try again shortly.",
        );
        return;
      }

      window.location.href = data.authorization_url;
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
            Link your account
          </h2>
          {errorMessage && (
            <p className="mb-4 rounded-xl bg-red-100 px-4 py-3 text-sm text-red-700">
              {errorMessage}
            </p>
          )}
          <p className="mb-8 text-center text-sm text-slate-500">
            To finish signing up, link your Google account.
            Click the button below to continue.
          </p>
          <div className="space-y-4">
            <Confirm
              title={isSubmitting ? "Redirecting..." : "Link my account"}
              couleur="green"
              onClick={handleLinkAccount}
              classNameAddon="w-full"
            />
          </div>
        </div>
      </main>
    </div>
  );
};

export default LierCompte;
