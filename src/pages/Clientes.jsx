import { useEffect, useState } from 'react';
import { Plus, Search, Trash2, Edit, Save, X, Users } from 'lucide-react';
import { clientesAPI } from '../services/api';

export default function Clientes() {
  const [clientes, setClientes] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editando, setEditando] = useState(null);
  const [form, setForm] = useState({ nombre: '', cuit: '', email: '', telefono: '', direccion: '' });

  const cargar = async (q = '') => {
    setLoading(true);
    try {
      const data = await clientesAPI.listar(q);
      setClientes(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { cargar(''); }, []);
  useEffect(() => {
    const t = setTimeout(() => cargar(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  const abrirNuevo = () => {
    setEditando(null);
    setForm({ nombre: '', cuit: '', email: '', telefono: '', direccion: '' });
    setShowForm(true);
  };

  const abrirEditar = (c) => {
    setEditando(c._id);
    setForm({
      nombre: c.nombre || '',
      cuit: c.cuit || '',
      email: c.email || '',
      telefono: c.telefono || '',
      direccion: c.direccion || '',
    });
    setShowForm(true);
  };

  const guardar = async () => {
    if (!form.nombre.trim()) return alert('El nombre es obligatorio');
    try {
      if (editando) {
        await clientesAPI.actualizar(editando, form);
      } else {
        await clientesAPI.crear(form);
      }
      setShowForm(false);
      cargar(search);
    } catch (e) {
      alert(e.response?.data?.error || 'Error al guardar');
    }
  };

  const eliminar = async (id, nombre) => {
    if (!confirm(`¿Eliminar al cliente "${nombre}"?`)) return;
    try {
      await clientesAPI.eliminar(id);
      setClientes(clientes.filter((c) => c._id !== id));
    } catch (e) {
      alert('Error al eliminar');
    }
  };

  const inputCls =
    'w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent transition';
  const labelCls = 'block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1';

  return (
    <div className="p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-900">Clientes</h1>
            <p className="text-slate-500 text-sm mt-1">
              {clientes.length} cliente{clientes.length === 1 ? '' : 's'} guardado{clientes.length === 1 ? '' : 's'}
            </p>
          </div>
          <button
            onClick={abrirNuevo}
            className="flex items-center gap-2 px-4 py-2.5 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition font-medium text-sm shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Nuevo cliente
          </button>
        </div>

        <div className="mb-4 relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nombre o CUIT..."
            className="w-full pl-10 pr-3 py-2.5 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400"
          />
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          {loading ? (
            <p className="text-center py-12 text-slate-500">Cargando...</p>
          ) : clientes.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-12 h-12 mx-auto text-slate-300 mb-3" />
              <p className="text-slate-500">No hay clientes</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {clientes.map((c) => (
                <div key={c._id} className="p-4 hover:bg-slate-50 transition flex items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-slate-900">{c.nombre}</p>
                    <div className="flex flex-wrap gap-3 text-xs text-slate-500 mt-1">
                      {c.cuit && <span>CUIT/DNI: {c.cuit}</span>}
                      {c.email && <span>{c.email}</span>}
                      {c.telefono && <span>Tel: {c.telefono}</span>}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => abrirEditar(c)}
                      className="p-2 text-slate-500 hover:text-orange-500 hover:bg-orange-50 rounded-md transition"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => eliminar(c._id, c.nombre)}
                      className="p-2 text-slate-500 hover:text-red-500 hover:bg-red-50 rounded-md transition"
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
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-4 border-b border-slate-200">
              <h3 className="font-bold text-slate-900">
                {editando ? 'Editar cliente' : 'Nuevo cliente'}
              </h3>
              <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 space-y-3">
              <div>
                <label className={labelCls}>Nombre / Razón social *</label>
                <input className={inputCls} value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} />
              </div>
              <div>
                <label className={labelCls}>CUIT / DNI</label>
                <input className={inputCls} value={form.cuit} onChange={(e) => setForm({ ...form, cuit: e.target.value })} />
              </div>
              <div>
                <label className={labelCls}>Email</label>
                <input className={inputCls} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              </div>
              <div>
                <label className={labelCls}>Teléfono</label>
                <input className={inputCls} value={form.telefono} onChange={(e) => setForm({ ...form, telefono: e.target.value })} />
              </div>
              <div>
                <label className={labelCls}>Dirección</label>
                <input className={inputCls} value={form.direccion} onChange={(e) => setForm({ ...form, direccion: e.target.value })} />
              </div>
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
