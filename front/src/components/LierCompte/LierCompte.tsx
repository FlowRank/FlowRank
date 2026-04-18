import React from "react";
import { useNavigate } from "react-router-dom";
import Confirm from "../Confirm/confirm";
import HeaderAccueil from "../Header/HeaderAccueil";

const LierCompte: React.FC = () => {
  const navigate = useNavigate();

  const handleLinkAccount = () => {
    navigate("/auth/callback?status=pending");
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-900">
      <HeaderAccueil hideConnexionButton />
      <main className="flex min-h-[calc(100vh-96px)] items-center justify-center px-4 py-10">
        <div className="w-full max-w-md rounded-[32px] border border-white/10 bg-white/90 p-8 shadow-2xl backdrop-blur-xl">
          <h2 className="text-center text-3xl font-semibold text-slate-900 mb-8">
            Lier son compte
          </h2>
          <p className="mb-8 text-center text-sm text-slate-500">
            Pour finaliser l'inscription, tu dois lier ton compte à Google
            Authenticator. Clique sur le bouton ci-dessous pour continuer.
          </p>
          <div className="space-y-4">
            <Confirm
              title="Lier mon compte"
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
