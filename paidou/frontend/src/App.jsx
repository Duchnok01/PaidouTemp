import { BrowserRouter, Routes, Route } from "react-router-dom"

import Login from "./pages/Login"
import ChangerMotDePasse from "./pages/ChangerMotDePasse"
import Accueil from "./pages/Accueil"
import Creche from "./pages/Creche"
import Enfant from "./pages/Enfant"
import AjoutEnregistrement from "./pages/AjoutEnregistrement"
import Admin from "./pages/Admin"

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/changer-mdp" element={<ChangerMotDePasse />} />
        <Route path="/accueil" element={<Accueil />} />
        <Route path="/creche/:nom" element={<Creche />} />
        <Route path="/enfant/:id" element={<Enfant />} />
        <Route path="/ajout-enregistrement" element={<AjoutEnregistrement />} />
        <Route path="/admin" element={<Admin />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App