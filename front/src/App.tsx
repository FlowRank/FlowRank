import { Navigate, Route, Routes } from "react-router-dom";
import AuthCallback from "./components/AuthCallback/AuthCallback";
import CreateAccount from "./components/CreateAccount/CreateAccount";
import LinkAccount from "./components/LinkAccount/LinkAccount";
import Login from "./components/Login/Login";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<Login />} />
      <Route path="/create-account" element={<CreateAccount />} />
      <Route path="/link-account" element={<LinkAccount />} />
      <Route path="/auth/callback" element={<AuthCallback />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

export default App;