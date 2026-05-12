import { Navigate, Route, Routes } from "react-router-dom";
import AuthCallback from "./components/AuthCallback/AuthCallback";
import CreateAccount from "./components/CreateAccount/CreateAccount";
import Dashboard from "./components/Dashboard/Dashboard";
import LinkAccount from "./components/LinkAccount/LinkAccount";
import Login from "./components/Login/Login";

function tokenPresent() {
  return Boolean(localStorage.getItem("access_token"));
}

function HomeOrLogin() {
  return <Navigate to={tokenPresent() ? "/dashboard" : "/login"} replace />;
}

function CatchAll() {
  return <Navigate to={tokenPresent() ? "/dashboard" : "/login"} replace />;
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<HomeOrLogin />} />
      <Route path="/login" element={<Login />} />
      <Route path="/create-account" element={<CreateAccount />} />
      <Route path="/link-account" element={<LinkAccount />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/dashboard/:linkId" element={<Dashboard />} />
      <Route path="/auth/callback" element={<AuthCallback />} />
      <Route path="*" element={<CatchAll />} />
    </Routes>
  );
}

export default App;