import React from "react";
import { useNavigate } from "react-router-dom";
import Confirm from "../Confirm/confirm";

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
      <div>
        <h1 className="text-6xl font-Laila font-bold text-white">
          FlowRank
        </h1>
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
