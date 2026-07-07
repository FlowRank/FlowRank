import React from "react";
import { useNavigate } from "react-router-dom";
import FlowRankMark from "../FlowRankMark/FlowRankMark";

interface HeaderAccueilProps {
  hideConnexionButton?: boolean;
  showSignupButton?: boolean;
}

const HeaderAccueil: React.FC<HeaderAccueilProps> = ({
  hideConnexionButton = false,
  showSignupButton = false,
}) => {
  const navigate = useNavigate();

  function toConnexion() {
    navigate("/login");
  }

  function toSignup() {
    navigate("/create-account");
  }

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-slate-950/95 text-white backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
        <button
          type="button"
          onClick={() => navigate("/")}
          className="flex min-w-0 items-center gap-2 text-left transition hover:opacity-80 sm:gap-3"
          aria-label="FlowRank home"
        >
          <FlowRankMark className="h-8 w-auto shrink-0 sm:h-10" />
          <h1 className="hidden bg-gradient-to-r from-red-500 via-yellow-500 to-green-600 bg-clip-text text-2xl font-bold leading-none text-transparent sm:block sm:text-3xl">
            FlowRank
          </h1>
        </button>

        {!hideConnexionButton && (
          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            {showSignupButton && (
              <button
                type="button"
                onClick={toSignup}
                className="rounded-md bg-emerald-400 px-3 py-2 text-sm font-semibold text-slate-950 shadow-sm transition hover:bg-emerald-300 sm:px-4"
              >
                Create account
              </button>
            )}
            <button
              type="button"
              onClick={toConnexion}
              className="rounded-md border border-white/15 bg-white/10 px-3 py-2 text-sm font-semibold text-white shadow-sm transition hover:border-white/30 hover:bg-white/15 sm:px-4"
            >
              Sign in
            </button>
          </div>
        )}
      </div>
    </header>
  );
};

export default HeaderAccueil;
