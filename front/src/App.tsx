import { Navigate, Route, Routes } from "react-router-dom";
import Accueil from "./components/Accueil/Accueil";
import AuthCallback from "./components/AuthCallback/AuthCallback";
import CreationCompte from "./components/CompteCreation/CreationCompte";
import LierCompte from "./components/LierCompte/LierCompte";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/connexion" replace />} />
      <Route path="/connexion" element={<Accueil />} />
      <Route path="/creationCompte" element={<CreationCompte />} />
      <Route path="/lierCompte" element={<LierCompte />} />
      <Route path="/auth/callback" element={<AuthCallback />} />
      <Route path="*" element={<Navigate to="/connexion" replace />} />
    </Routes>
  );
}

export default App;