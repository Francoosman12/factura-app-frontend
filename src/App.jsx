import { Routes, Route, NavLink } from "react-router-dom";
import { FileText, List, Users, Building2 } from "lucide-react";
import NuevaFactura from "./pages/NuevaFactura.jsx";
import Historial from "./pages/Historial.jsx";
import Clientes from "./pages/Clientes.jsx";
import Emisores from "./pages/Emisores.jsx";

export default function App() {
  const linkBase =
    "flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition";
  const linkInactive = "text-slate-600 hover:bg-slate-100";
  const linkActive = "bg-orange-500 text-white";

  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-orange-500 rounded-md flex items-center justify-center">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <h1 className="font-bold text-slate-900">FacturaApp</h1>
          </div>
          <div className="flex gap-1">
            <NavLink
              to="/"
              end
              className={({ isActive }) =>
                `${linkBase} ${isActive ? linkActive : linkInactive}`
              }
            >
              <FileText className="w-4 h-4" />
              <span className="hidden sm:inline">Nueva</span>
            </NavLink>
            <NavLink
              to="/historial"
              className={({ isActive }) =>
                `${linkBase} ${isActive ? linkActive : linkInactive}`
              }
            >
              <List className="w-4 h-4" />
              <span className="hidden sm:inline">Historial</span>
            </NavLink>
            <NavLink
              to="/clientes"
              className={({ isActive }) =>
                `${linkBase} ${isActive ? linkActive : linkInactive}`
              }
            >
              <Users className="w-4 h-4" />
              <span className="hidden sm:inline">Clientes</span>
            </NavLink>
            <NavLink
              to="/emisores"
              className={({ isActive }) =>
                `${linkBase} ${isActive ? linkActive : linkInactive}`
              }
            >
              <Building2 className="w-4 h-4" />
              <span className="hidden sm:inline">Emisores</span>
            </NavLink>
          </div>
        </div>
      </nav>

      <Routes>
        <Route path="/" element={<NuevaFactura />} />
        <Route path="/factura/:id" element={<NuevaFactura />} />
        <Route path="/historial" element={<Historial />} />
        <Route path="/clientes" element={<Clientes />} />
        <Route path="/emisores" element={<Emisores />} />
      </Routes>
    </div>
  );
}
