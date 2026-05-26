import { BrowserRouter, Routes, Route, useNavigate, useLocation } from "react-router-dom";
import Login from "./pages/Login";
import ChangerMotDePasse from "./pages/ChangerMotDePasse";
import Accueil from "./pages/Accueil";
import Creche from "./pages/Creche";
import Enfant from "./pages/Enfant";
import AjoutEnregistrement from "./pages/AjoutEnregistrement";
import Admin from "./pages/Admin";
import { AuthProvider, useAuth } from "./context/AuthContext";

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </AuthProvider>
  );
}

function AppContent() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  const isLoginPage = location.pathname === "/" || location.pathname === "/changer-mdp";

  return (
    <>
      {user && !isLoginPage && (
        <>
          <nav className="navbar">
            <div className="nav-left" onClick={() => navigate(user.role === "admin" ? "/admin" : "/accueil")}>
              <img src="/logo.png" alt="Paidou" className="nav-logo" />
              <span className="nav-title">Paidou</span>
            </div>
            <div className="nav-right">
              <span className="nav-user">{user.prenom} ({user.role})</span>
              <button className="btn btn-sm btn-logout" onClick={handleLogout}>Déconnexion</button>
            </div>
          </nav>
          <div className="nav-back">
            <button className="btn btn-sm btn-secondary" onClick={() => {
                if (window.history.length > 1) {
                    navigate(-1);
                } else {
                    navigate(user.role === "admin" ? "/admin" : "/accueil");
                }
              }}>← Retour</button>
          </div>
        </>
      )}

      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/changer-mdp" element={<ChangerMotDePasse />} />
        <Route path="/accueil" element={<Accueil />} />
        <Route path="/creche/:nom" element={<Creche />} />
        <Route path="/enfant/:id" element={<Enfant />} />
        <Route path="/ajout-enregistrement" element={<AjoutEnregistrement />} />
        <Route path="/admin" element={<Admin />} />
      </Routes>
    </>
  );
}

export default App;