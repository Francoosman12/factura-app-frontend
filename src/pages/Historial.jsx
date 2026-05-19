import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Trash2, Edit, FileText, Calendar } from 'lucide-react';
import { facturasAPI } from '../services/api';

export default function Historial() {
  const [facturas, setFacturas] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const navigate = useNavigate();

  const cargar = async (q = '') => {
    setLoading(true);
    try {
      const data = await facturasAPI.listar({ search: q, limit: 50 });
      setFacturas(data.facturas || []);
      setTotal(data.total || 0);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargar('');
  }, []);

  // Debounce de búsqueda
  useEffect(() => {
    const t = setTimeout(() => cargar(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  const eliminar = async (id, numero) => {
    if (!confirm(`¿Eliminar la factura ${numero}?`)) return;
    try {
      await facturasAPI.eliminar(id);
      setFacturas(facturas.filter((f) => f._id !== id));
    } catch (e) {
      alert('Error al eliminar');
    }
  };

  const fmt = (n) =>
    new Intl.NumberFormat('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n || 0);

  return (
    <div className="p-4 md:p-8">
      <div className="max-w-5xl mx-auto">
        <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-900">Historial de facturas</h1>
            <p className="text-slate-500 text-sm mt-1">
              {total} factura{total === 1 ? '' : 's'} en total
            </p>
          </div>
        </div>

        <div className="mb-4 relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por número, cliente o CUIT..."
            className="w-full pl-10 pr-3 py-2.5 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400"
          />
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          {loading ? (
            <p className="text-center py-12 text-slate-500">Cargando...</p>
          ) : facturas.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 mx-auto text-slate-300 mb-3" />
              <p className="text-slate-500">No hay facturas</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {facturas.map((f) => (
                <div key={f._id} className="p-4 hover:bg-slate-50 transition flex items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 flex-wrap">
                      <p className="font-bold text-orange-500">{f.numero}</p>
                      <span className="text-xs px-2 py-0.5 bg-slate-100 rounded text-slate-600">
                        {f.titulo}
                      </span>
                    </div>
                    <p className="text-sm text-slate-900 mt-1">
                      {f.cliente?.nombre || 'Sin cliente'}
                      {f.cliente?.cuit && (
                        <span className="text-slate-500"> · {f.cliente.cuit}</span>
                      )}
                    </p>
                    <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {f.fecha ? new Date(f.fecha).toLocaleDateString('es-AR') : '—'}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-slate-900">${fmt(f.total)}</p>
                    <p className="text-xs text-slate-500">Total</p>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => navigate(`/factura/${f._id}`)}
                      className="p-2 text-slate-500 hover:text-orange-500 hover:bg-orange-50 rounded-md transition"
                      title="Editar"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => eliminar(f._id, f.numero)}
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
    </div>
  );
}
