import { Navigate, Route, Routes } from "react-router-dom";
import Accueil from "./components/Accueil/Accueil";
import CreationCompte from "./components/CompteCreation/CreationCompte";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/connexion" replace />} />
      <Route path="/connexion" element={<Accueil />} />
      <Route path="/creationCompte" element={<CreationCompte />} />
      <Route path="*" element={<Navigate to="/connexion" replace />} />
    </Routes>
  );
}

export default App;