import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import HeaderAccueil from "../Header/HeaderAccueil";

const CreationCompte: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (password !== confirmPassword) {
      alert("Les mots de passe ne correspondent pas.");
      return;
    }

    console.log("Signup submit", { email, password, confirmPassword });
    // Ajoute ici la logique d'inscription
    navigate("/lierCompte");
  };

  return (
      <div className="min-h-screen bg-slate-950 text-slate-900">
        <HeaderAccueil />
        <main className="flex min-h-[calc(100vh-96px)] items-center justify-center px-4 py-10">
          <div className="w-full max-w-md rounded-[32px] border border-white/10 bg-white/90 p-8 shadow-2xl backdrop-blur-xl">
            <h2 className="text-center text-3xl font-semibold text-slate-900 mb-8">
              S'inscrire
            </h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-700">
                  Adresse email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-900 shadow-sm outline-none transition focus:border-amber-600 focus:ring-2 focus:ring-amber-100"
                  placeholder="exemple@mail.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">
                  Mot de passe
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
                  Confirme le mot de passe
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
                className="w-full rounded-2xl bg-amber-700 px-5 py-3 text-base font-semibold text-white transition hover:bg-amber-800"
              >
                Envoyer
              </button>
            </form>
          </div>
        </main>
      </div>
    );
};

export default CreationCompte;