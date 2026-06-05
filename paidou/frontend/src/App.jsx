import { BrowserRouter, Routes, Route, useNavigate, useLocation } from "react-router-dom";
import Login from "./pages/Login";
import ChangerMotDePasse from "./pages/ChangerMotDePasse";
import Accueil from "./pages/directrice/Accueil";
import Creche from "./pages/directrice/Creche";
import Enfant from "./pages/directrice/Enfant";
import AjoutEnregistrement from "./pages/directrice/AjoutEnregistrement";
import PdgUsers from "./pages/pdg/Users";
import PdgCreches from "./pages/pdg/Creches";
import PdgEnfants from "./pages/pdg/Enfants";
import PdgVaccins from "./pages/pdg/Vaccins";
import PdgParametres from "./pages/pdg/Parametres";
import VueCoordinateur from "./pages/coordinateur/VueCoordinateur";
import SuperAdminUsers from "./pages/superadmin/Users";
import SuperAdminCreches from "./pages/superadmin/Creches";
import SuperAdminEnfants from "./pages/superadmin/Enfants";
import SuperAdminVaccins from "./pages/superadmin/Vaccins";
import SuperAdminEnregistrements from "./pages/superadmin/Enregistrements";
import SuperAdminParametres from "./pages/superadmin/Parametres";
import Logs from "./pages/Logs";
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
  const { user, effectiveUser, simulatedUser, simulatableUsers, logout, startSimulation, stopSimulation, fetchSimulatableUsers } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  const isLoginPage = location.pathname === "/" || location.pathname === "/changer-mdp";
  const isSuperAdminPage = location.pathname.startsWith("/superadmin");
  const isPdgPage = location.pathname.startsWith("/pdg");

  const getHomePath = () => {
    if (effectiveUser.role === "superadmin") return "/superadmin/users";
    if (effectiveUser.role === "pdg") return "/pdg/users";
    if (effectiveUser.role === "coordinateur") return "/coordinateur";
    return "/accueil";
  };

  const handleStartSimulation = async (targetId) => {
    try {
      await startSimulation(targetId);
      navigate(getHomePath());
    } catch (err) {
      alert("Erreur lors de la simulation.");
    }
  };

  const handleStopSimulation = async () => {
    await stopSimulation();
    navigate(getHomePath());
  };

  const loadSimulatableUsers = () => {
    if (user && (user.role === "superadmin" || user.role === "pdg" || user.role === "coordinateur")) {
      fetchSimulatableUsers();
    }
  };

  return (
    <>
      {user && !isLoginPage && (
        <>
          <nav className="navbar">
            <div className="nav-left" onClick={() => navigate(getHomePath())}>
              <img src="/logo.png" alt="Paidou" className="nav-logo" />
              <span className="nav-title">Paidou</span>
            </div>
            <div className="nav-right">
              {simulatedUser ? (
                <>
                  <span className="nav-user" style={{ color: "var(--warning)" }}>
                    {user.prenom} ({user.role}) → {simulatedUser.prenom} ({simulatedUser.role})
                  </span>
                  <button className="btn btn-sm btn-warning" onClick={handleStopSimulation}>
                    ⏎ Revenir à moi
                  </button>
                </>
              ) : (
                <>
                  <span className="nav-user">{effectiveUser.prenom} ({effectiveUser.role})</span>
                  {(user.role === "superadmin" || user.role === "pdg" || user.role === "coordinateur") && (
                    <select
                      className="form-select"
                      style={{ width: "auto", fontSize: "0.85rem" }}
                      defaultValue=""
                      onChange={(e) => {
                        if (e.target.value) {
                          handleStartSimulation(parseInt(e.target.value));
                        }
                      }}
                      onFocus={loadSimulatableUsers}
                    >
                      <option value="">Simuler...</option>
                      {simulatableUsers.map(u => (
                        <option key={u.id} value={u.id}>{u.prenom} ({u.role})</option>
                      ))}
                    </select>
                  )}
                </>
              )}

              {(effectiveUser.role === "superadmin" || effectiveUser.role === "directrice" || effectiveUser.role === "coordinateur" || effectiveUser.role === "pdg") && (
                  <button className="btn btn-sm btn-secondary" onClick={() => navigate("/logs")}>
                      📋 Journal
                  </button>
              )}
              <button className="btn btn-sm btn-logout" onClick={handleLogout}>Déconnexion</button>
            </div>
          </nav>

          {/* Barre de navigation SuperAdmin */}
          {effectiveUser.role === "superadmin" && isSuperAdminPage && (
            <div className="nav-back" style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", padding: "0.5rem 1rem", backgroundColor: "var(--gray-100)", borderBottom: "1px solid var(--gray-300)" }}>
              <button className={`btn btn-sm ${location.pathname === "/superadmin/users" ? "btn-primary" : "btn-secondary"}`} onClick={() => navigate("/superadmin/users")}>👥 Users</button>
              <button className={`btn btn-sm ${location.pathname === "/superadmin/creches" ? "btn-primary" : "btn-secondary"}`} onClick={() => navigate("/superadmin/creches")}>🏫 Crèches</button>
              <button className={`btn btn-sm ${location.pathname === "/superadmin/enfants" ? "btn-primary" : "btn-secondary"}`} onClick={() => navigate("/superadmin/enfants")}>👶 Enfants</button>
              <button className={`btn btn-sm ${location.pathname === "/superadmin/vaccins" ? "btn-primary" : "btn-secondary"}`} onClick={() => navigate("/superadmin/vaccins")}>💉 Vaccins</button>
              <button className={`btn btn-sm ${location.pathname === "/superadmin/enregistrements" ? "btn-primary" : "btn-secondary"}`} onClick={() => navigate("/superadmin/enregistrements")}>📋 Enregistrements</button>
              <button className={`btn btn-sm ${location.pathname === "/superadmin/parametres" ? "btn-primary" : "btn-secondary"}`} onClick={() => navigate("/superadmin/parametres")}>⚙️ Paramètres</button>
            </div>
          )}

          {/* Barre de navigation PDG */}
          {effectiveUser.role === "pdg" && isPdgPage && (
            <div className="nav-back" style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", padding: "0.5rem 1rem", backgroundColor: "var(--gray-100)", borderBottom: "1px solid var(--gray-300)" }}>
              <button className={`btn btn-sm ${location.pathname === "/pdg/users" ? "btn-primary" : "btn-secondary"}`} onClick={() => navigate("/pdg/users")}>👥 Users</button>
              <button className={`btn btn-sm ${location.pathname === "/pdg/creches" ? "btn-primary" : "btn-secondary"}`} onClick={() => navigate("/pdg/creches")}>🏫 Crèches</button>
              <button className={`btn btn-sm ${location.pathname === "/pdg/enfants" ? "btn-primary" : "btn-secondary"}`} onClick={() => navigate("/pdg/enfants")}>👶 Enfants</button>
              <button className={`btn btn-sm ${location.pathname === "/pdg/vaccins" ? "btn-primary" : "btn-secondary"}`} onClick={() => navigate("/pdg/vaccins")}>💉 Vaccins</button>
              <button className={`btn btn-sm ${location.pathname === "/pdg/parametres" ? "btn-primary" : "btn-secondary"}`} onClick={() => navigate("/pdg/parametres")}>⚙️ Paramètres</button>
            </div>
          )}

          {!isSuperAdminPage && !isPdgPage && (
            <div className="nav-back">
              <button className="btn btn-sm btn-secondary" onClick={() => {
                  if (window.history.length > 1) {
                      navigate(-1);
                  } else {
                      navigate(getHomePath());
                  }
                }}>← Retour</button>
            </div>
          )}
        </>
      )}

      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/changer-mdp" element={<ChangerMotDePasse />} />
        <Route path="/accueil" element={<Accueil />} />
        <Route path="/creche/:nom" element={<Creche />} />
        <Route path="/enfant/:id" element={<Enfant />} />
        <Route path="/ajout-enregistrement" element={<AjoutEnregistrement />} />
        <Route path="/pdg/users" element={<PdgUsers />} />
        <Route path="/pdg/creches" element={<PdgCreches />} />
        <Route path="/pdg/enfants" element={<PdgEnfants />} />
        <Route path="/pdg/vaccins" element={<PdgVaccins />} />
        <Route path="/pdg/parametres" element={<PdgParametres />} />
        <Route path="/coordinateur" element={<VueCoordinateur />} />
        <Route path="/logs" element={<Logs />} />
        <Route path="/superadmin/users" element={<SuperAdminUsers />} />
        <Route path="/superadmin/creches" element={<SuperAdminCreches />} />
        <Route path="/superadmin/enfants" element={<SuperAdminEnfants />} />
        <Route path="/superadmin/vaccins" element={<SuperAdminVaccins />} />
        <Route path="/superadmin/enregistrements" element={<SuperAdminEnregistrements />} />
        <Route path="/superadmin/parametres" element={<SuperAdminParametres />} />
      </Routes>
    </>
  );
}

export default App;