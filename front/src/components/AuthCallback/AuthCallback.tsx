import React from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Confirm from "../Confirm/confirm";
import HeaderAccueil from "../Header/HeaderAccueil";

const AuthCallback: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const error = searchParams.get("error");
  const status = searchParams.get("status");
  const code = searchParams.get("code");

  const isFailed = Boolean(error) || status === "failed";
  const isSuccess = status === "success";
  const isPending = status === "pending";

  let title = "Liaison du compte";
  let message = "Veuillez patienter pendant que nous vérifions votre compte Google.";
  let buttonText = "Recommencer";
  let buttonAction = () => navigate("/lierCompte");
  let buttonColor: "green" | "brown" = "green";
  let showFailedExit = false;
  let showPendingExit = false;

  if (isSuccess) {
    title = "Compte lié avec succès";
    message = "Ta liaison avec Google a été acceptée. Tu peux retourner à la page de connexion.";
    buttonText = "Retour à la connexion";
    buttonAction = () => navigate("/connexion");
  } else if (isFailed) {
    title = "Échec de la liaison";
    message = error
      ? `La liaison a échoué : ${error}. Essaie à nouveau plus tard.`
      : "La liaison n'a pas pu être finalisée. Retourne sur la page de liaison pour réessayer.";
    buttonText = "Réessayer";
    buttonColor = "brown";
    showFailedExit = true;
  } else if (code) {
    title = "Autorisation reçue";
    message = "Nous avons reçu le code d'autorisation Google. Le traitement est en cours.";
    buttonText = "Voir l'état";
    buttonAction = () => navigate("/auth/callback?status=success");
  } else if (isPending) {
    title = "Liaison en attente";
    message = "Nous attendons la confirmation de Google. Merci de patienter.";
    buttonText = "Actualiser l'état";
    buttonAction = () => window.location.reload();
    showPendingExit = true;
  }

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
            <Confirm
              title={buttonText}
              couleur={buttonColor}
              onClick={buttonAction}
              classNameAddon="w-full"
            />
            {(showFailedExit || showPendingExit) && (
              <div className="grid gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  className="rounded-2xl border border-slate-900 bg-slate-900 px-5 py-3 text-base font-semibold text-white shadow-sm transition hover:bg-slate-800"
                  onClick={() => navigate("/lierCompte")}
                >
                  Revenir à la liaison
                </button>
                <button
                  type="button"
                  className="rounded-2xl border border-slate-900 bg-slate-900 px-5 py-3 text-base font-semibold text-white transition hover:bg-slate-800"
                  onClick={() => navigate("/")}
                >
                  Accueil
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
