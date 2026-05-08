import React from "react";
import { useNavigate } from "react-router-dom";
import Confirm from "../Confirm/confirm";
import FlowRankMark from "../FlowRankMark/FlowRankMark";

interface HeaderAccueilProps {
  hideConnexionButton?: boolean;
}

const HeaderAccueil: React.FC<HeaderAccueilProps> = ({ hideConnexionButton = false }) => {
  const navigate = useNavigate();

  function toConnexion() {
    navigate("/login");
  }

  return (
    <header className="bg-main-dark text-white p-4 pt-5 h-10p flex items-center justify-between px-16">
      <div className="flex items-center gap-3 self-start md:gap-4">
        <h1 className="bg-gradient-to-r from-yellow-400 to-green-500 bg-clip-text text-transparent text-6xl font-Laila font-bold leading-tight">
          FlowRank
        </h1>
        <FlowRankMark />
      </div>

      {!hideConnexionButton && (
        <div className="flex">
          <Confirm
            title="Sign in"
            couleur="green"
            onClick={toConnexion}
            classNameAddon="w-48"
          />
        </div>
      )}
    </header>
  );
};

export default HeaderAccueil;
