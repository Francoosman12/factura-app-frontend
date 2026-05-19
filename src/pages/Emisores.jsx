import { useEffect, useState } from "react";
import {
  Plus,
  Trash2,
  Edit,
  Save,
  X,
  Building2,
  Image as ImageIcon,
  Star,
} from "lucide-react";
import { emisoresAPI } from "../services/api";

export default function Emisores() {
  const [emisores, setEmisores] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editando, setEditando] = useState(null);
  const [form, setForm] = useState(emisorVacio());

  function emisorVacio() {
    return {
      nombre: "",
      subtitulo: "",
      cuit: "",
      direccion: "",
      telefono: "",
      email: "",
      logo: "",
      predeterminado: false,
    };
  }

  const cargar = async () => {
    setLoading(true);
    try {
      setEmisores(await emisoresAPI.listar());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargar();
  }, []);

  const abrirNuevo = () => {
    setEditando(null);
    setForm(emisorVacio());
    setShowForm(true);
  };

  const abrirEditar = (em) => {
    setEditando(em._id);
    setForm({
      nombre: em.nombre || "",
      subtitulo: em.subtitulo || "",
      cuit: em.cuit || "",
      direccion: em.direccion || "",
      telefono: em.telefono || "",
      email: em.email || "",
      logo: em.logo || "",
      predeterminado: !!em.predeterminado,
    });
    setShowForm(true);
  };

  const handleLogo = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setForm({ ...form, logo: ev.target.result });
    reader.readAsDataURL(file);
  };

  const guardar = async () => {
    if (!form.nombre.trim()) return alert("El nombre es obligatorio");
    try {
      if (editando) {
        await emisoresAPI.actualizar(editando, form);
      } else {
        // Para crear desde la app, generamos un slug simple basado en el nombre
        const slug = `custom-${Date.now()}`;
        await emisoresAPI.crear({ ...form, slug });
      }
      setShowForm(false);
      cargar();
    } catch (e) {
      alert(e.response?.data?.error || "Error al guardar");
    }
  };

  const marcarPredeterminado = async (em) => {
    try {
      await emisoresAPI.actualizar(em._id, { ...em, predeterminado: true });
      cargar();
    } catch (e) {
      alert("No se pudo marcar como predeterminado");
    }
  };

  const eliminar = async (id, nombre) => {
    if (!confirm(`¿Eliminar el emisor "${nombre}"?`)) return;
    try {
      await emisoresAPI.eliminar(id);
      setEmisores(emisores.filter((e) => e._id !== id));
    } catch (e) {
      alert("Error al eliminar");
    }
  };

  const inputCls =
    "w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent transition";
  const labelCls =
    "block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1";

  return (
    <div className="p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-900">
              Emisores
            </h1>
            <p className="text-slate-500 text-sm mt-1">
              Empresas/personas que emiten las facturas
            </p>
          </div>
          <button
            onClick={abrirNuevo}
            className="flex items-center gap-2 px-4 py-2.5 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition font-medium text-sm shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Nuevo emisor
          </button>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          {loading ? (
            <p className="text-center py-12 text-slate-500">Cargando...</p>
          ) : emisores.length === 0 ? (
            <div className="text-center py-12">
              <Building2 className="w-12 h-12 mx-auto text-slate-300 mb-3" />
              <p className="text-slate-500">No hay emisores</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {emisores.map((em) => (
                <div
                  key={em._id}
                  className="p-4 hover:bg-slate-50 transition flex items-center gap-4"
                >
                  <div className="flex-shrink-0">
                    {em.logo ? (
                      <img
                        src={em.logo}
                        alt="logo"
                        className="w-14 h-14 object-contain rounded border border-slate-200"
                      />
                    ) : (
                      <div className="w-14 h-14 flex items-center justify-center bg-slate-100 rounded border border-slate-200">
                        <Building2 className="w-6 h-6 text-slate-400" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-medium text-slate-900">{em.nombre}</p>
                      {em.predeterminado && (
                        <span className="text-xs px-2 py-0.5 bg-orange-100 text-orange-700 rounded flex items-center gap-1">
                          <Star className="w-3 h-3 fill-orange-500 text-orange-500" />
                          Predeterminado
                        </span>
                      )}
                    </div>
                    {em.subtitulo && (
                      <p className="text-xs text-slate-500">{em.subtitulo}</p>
                    )}
                    <div className="flex flex-wrap gap-3 text-xs text-slate-500 mt-1">
                      {em.cuit && <span>CUIT/CUIL: {em.cuit}</span>}
                      {em.email && <span>{em.email}</span>}
                      {em.telefono && <span>Tel: {em.telefono}</span>}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    {!em.predeterminado && (
                      <button
                        onClick={() => marcarPredeterminado(em)}
                        className="p-2 text-slate-500 hover:text-orange-500 hover:bg-orange-50 rounded-md transition"
                        title="Marcar como predeterminado"
                      >
                        <Star className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      onClick={() => abrirEditar(em)}
                      className="p-2 text-slate-500 hover:text-orange-500 hover:bg-orange-50 rounded-md transition"
                      title="Editar"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => eliminar(em._id, em.nombre)}
                      className="p-2 text-slate-500 hover:text-red-500 hover:bg-red-50 rounded-md transition"
                      title="Eliminar"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* MODAL */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-30 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-slate-200">
              <h3 className="font-bold text-slate-900">
                {editando ? "Editar emisor" : "Nuevo emisor"}
              </h3>
              <button
                onClick={() => setShowForm(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 space-y-3 overflow-y-auto">
              <div>
                <label className={labelCls}>Logo</label>
                <div className="flex items-center gap-3">
                  {form.logo && (
                    <img
                      src={form.logo}
                      alt="logo"
                      className="w-16 h-16 object-contain rounded border border-slate-200"
                    />
                  )}
                  <label className="flex items-center gap-2 px-3 py-2 bg-slate-100 hover:bg-slate-200 rounded-md cursor-pointer text-sm transition">
                    <ImageIcon className="w-4 h-4" />
                    <span>{form.logo ? "Cambiar" : "Subir logo"}</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleLogo}
                      className="hidden"
                    />
                  </label>
                  {form.logo && (
                    <button
                      onClick={() => setForm({ ...form, logo: "" })}
                      className="text-xs text-slate-500 hover:text-red-500"
                    >
                      Quitar
                    </button>
                  )}
                </div>
              </div>
              <div>
                <label className={labelCls}>Nombre / Razón social *</label>
                <input
                  className={inputCls}
                  value={form.nombre}
                  onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                />
              </div>
              <div>
                <label className={labelCls}>Subtítulo</label>
                <input
                  className={inputCls}
                  value={form.subtitulo}
                  onChange={(e) =>
                    setForm({ ...form, subtitulo: e.target.value })
                  }
                />
              </div>
              <div>
                <label className={labelCls}>CUIT / CUIL</label>
                <input
                  className={inputCls}
                  value={form.cuit}
                  onChange={(e) => setForm({ ...form, cuit: e.target.value })}
                />
              </div>
              <div>
                <label className={labelCls}>Dirección</label>
                <input
                  className={inputCls}
                  value={form.direccion}
                  onChange={(e) =>
                    setForm({ ...form, direccion: e.target.value })
                  }
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Teléfono</label>
                  <input
                    className={inputCls}
                    value={form.telefono}
                    onChange={(e) =>
                      setForm({ ...form, telefono: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className={labelCls}>Email</label>
                  <input
                    className={inputCls}
                    value={form.email}
                    onChange={(e) =>
                      setForm({ ...form, email: e.target.value })
                    }
                  />
                </div>
              </div>
              <label className="flex items-center gap-2 cursor-pointer pt-2">
                <input
                  type="checkbox"
                  checked={form.predeterminado}
                  onChange={(e) =>
                    setForm({ ...form, predeterminado: e.target.checked })
                  }
                  className="w-4 h-4 accent-orange-500"
                />
                <span className="text-sm text-slate-700">
                  Marcar como emisor predeterminado
                </span>
              </label>
            </div>
            <div className="p-4 border-t border-slate-200 flex justify-end gap-2">
              <button
                onClick={() => setShowForm(false)}
                className="px-4 py-2 text-sm text-slate-700 hover:bg-slate-100 rounded-md transition"
              >
                Cancelar
              </button>
              <button
                onClick={guardar}
                className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white text-sm rounded-md hover:bg-orange-600 transition"
              >
                <Save className="w-4 h-4" />
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
