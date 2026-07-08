import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { API_BASE } from "../../constants/api";
import Confirm from "../Confirm/confirm";
import HeaderAccueil from "../Header/HeaderAccueil";

const LierCompte: React.FC = () => {
  const navigate = useNavigate();
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const shouldSignInAgain = errorMessage === "Invalid token";

  useEffect(() => {
    const accessToken = localStorage.getItem("access_token");
    if (!accessToken) {
      navigate("/login", { replace: true });
      return;
    }
    setCheckingSession(false);
  }, [navigate]);

  const handleSignInAgain = () => {
    localStorage.removeItem("access_token");
    navigate("/login");
  };

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
      const response = await fetch(`${API_BASE}/account/google/auth-url`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      const data = (await response.json()) as {
        authorization_url?: string;
        detail?: string;
      };

      if (!response.ok || !data.authorization_url) {
        if (data.detail === "Invalid token") {
          setErrorMessage("Invalid token");
          return;
        }
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

  if (checkingSession) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-900">
        <HeaderAccueil hideConnexionButton />
        <main className="flex min-h-[calc(100vh-96px)] items-center justify-center px-4 py-10">
          <div className="flex flex-col items-center gap-4 text-slate-300">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" />
            <p className="text-sm">Checking your session...</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-900">
      <HeaderAccueil hideConnexionButton />
      <main className="flex min-h-[calc(100vh-96px)] items-center justify-center px-4 py-10">
        <div className="w-full max-w-md rounded-[32px] border border-white/10 bg-white/90 p-8 shadow-2xl backdrop-blur-xl">
          <h2 className="text-center text-3xl font-semibold text-slate-900 mb-8">
            Add a mailbox
          </h2>
          {errorMessage && (
            <p className="mb-4 rounded-xl bg-red-100 px-4 py-3 text-sm text-red-700">
              {errorMessage}
            </p>
          )}
          <p className="mb-8 text-center text-sm text-slate-500">
            Connect another Gmail mailbox to FlowRank. Google will ask which
            account you want to authorize.
          </p>
          <div className={shouldSignInAgain ? "grid gap-3 sm:grid-cols-2" : "space-y-4"}>
            <Confirm
              title={isSubmitting ? "Redirecting..." : "Connect Gmail"}
              couleur="green"
              onClick={handleLinkAccount}
              classNameAddon="w-full"
            />
            {shouldSignInAgain && (
              <Confirm
                title="Sign in again"
                couleur="green"
                onClick={handleSignInAgain}
                classNameAddon="w-full"
              />
            )}
          </div>
          <p className="mt-6 text-center text-sm text-slate-500">
            Already linked?{" "}
            <Link to="/dashboard" className="font-semibold text-emerald-700 hover:text-emerald-800">
              Open dashboard
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
};

export default LierCompte;
