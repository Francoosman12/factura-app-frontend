import { useState, useRef, useMemo, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Plus,
  Trash2,
  FileImage,
  FileText,
  Save,
  Search,
  X,
  UserPlus,
  Building2,
  Check,
} from "lucide-react";
import { facturasAPI, clientesAPI, emisoresAPI } from "../services/api";

const IMPUESTOS_DEFAULT = [
  {
    id: "iva27",
    label: "IVA 27%",
    tipo: "porcentaje",
    valor: 27,
    activo: false,
    fijo: true,
  },
  {
    id: "iva21",
    label: "IVA 21%",
    tipo: "porcentaje",
    valor: 21,
    activo: true,
    fijo: true,
  },
  {
    id: "iva105",
    label: "IVA 10.5%",
    tipo: "porcentaje",
    valor: 10.5,
    activo: false,
    fijo: true,
  },
  {
    id: "iva5",
    label: "IVA 5%",
    tipo: "porcentaje",
    valor: 5,
    activo: false,
    fijo: true,
  },
  {
    id: "iva25",
    label: "IVA 2.5%",
    tipo: "porcentaje",
    valor: 2.5,
    activo: false,
    fijo: true,
  },
  {
    id: "iva0",
    label: "IVA 0%",
    tipo: "porcentaje",
    valor: 0,
    activo: false,
    fijo: true,
  },
  {
    id: "otros",
    label: "Otros Tributos",
    tipo: "monto",
    valor: 0,
    activo: false,
    fijo: true,
  },
];

const EMISOR_VACIO = {
  emisorId: null,
  nombre: "",
  subtitulo: "",
  cuit: "",
  direccion: "",
  telefono: "",
  email: "",
  logo: "",
};

export default function NuevaFactura() {
  const { id } = useParams();
  const navigate = useNavigate();

  // ---------- ESTADO ----------
  const [emisoresDisponibles, setEmisoresDisponibles] = useState([]);
  const [emisor, setEmisor] = useState(EMISOR_VACIO);

  const [factura, setFactura] = useState({
    numero: "",
    titulo: "FACTURA",
    fecha: new Date().toISOString().slice(0, 10),
    validez: "10",
    cae: "",
    vtoCae: "",
  });

  const [cliente, setCliente] = useState({
    nombre: "",
    cuit: "",
    clienteId: null,
  });
  const [items, setItems] = useState([
    { id: 1, descripcion: "", cantidad: 1, precio: 0 },
  ]);
  const [impuestos, setImpuestos] = useState(IMPUESTOS_DEFAULT);
  const [observaciones, setObservaciones] = useState("");

  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState(null);

  // Selector de clientes
  const [showClienteSelector, setShowClienteSelector] = useState(false);
  const [clientesLista, setClientesLista] = useState([]);
  const [busquedaCliente, setBusquedaCliente] = useState("");

  const facturaRef = useRef(null);

  // ---------- CARGA INICIAL ----------
  useEffect(() => {
    // Cargar emisores disponibles
    emisoresAPI.listar().then((data) => {
      setEmisoresDisponibles(data);
      // Si es factura nueva, precargar el emisor predeterminado
      if (!id && data.length > 0) {
        const pred = data.find((e) => e.predeterminado) || data[0];
        seleccionarEmisor(pred, true);
      }
    });

    if (id) {
      facturasAPI.obtener(id).then((f) => {
        setEmisor(f.emisor || EMISOR_VACIO);
        setFactura({
          numero: f.numero || "",
          titulo: f.titulo || "FACTURA",
          fecha: f.fecha || new Date().toISOString().slice(0, 10),
          validez: f.validez || "10",
          cae: f.cae || "",
          vtoCae: f.vtoCae || "",
        });
        setCliente(f.cliente || { nombre: "", cuit: "", clienteId: null });
        setItems(
          (f.items || []).map((it, idx) => ({ id: idx + 1, ...it })) || [
            { id: 1, descripcion: "", cantidad: 1, precio: 0 },
          ],
        );
        setImpuestos(f.impuestos?.length ? f.impuestos : IMPUESTOS_DEFAULT);
        setObservaciones(f.observaciones || "");
      });
    } else {
      facturasAPI
        .siguienteNumero("COT-")
        .then((data) =>
          setFactura((prev) => ({ ...prev, numero: data.numero })),
        )
        .catch(() => setFactura((prev) => ({ ...prev, numero: "COT-0001" })));
    }
    // eslint-disable-next-line
  }, [id]);

  // Cuando un emisor se selecciona desde el tab, precarga sus datos.
  // silencioso=true evita mostrar mensaje al cargar inicial.
  const seleccionarEmisor = (em, silencioso = false) => {
    setEmisor({
      emisorId: em._id,
      nombre: em.nombre || "",
      subtitulo: em.subtitulo || "",
      cuit: em.cuit || "",
      direccion: em.direccion || "",
      telefono: em.telefono || "",
      email: em.email || "",
      logo: em.logo || "",
    });
    if (!silencioso) mostrarMensaje("ok", `Emisor cambiado a ${em.nombre}`);
  };

  // ---------- CÁLCULOS ----------
  const neto = useMemo(
    () =>
      items.reduce(
        (acc, it) =>
          acc + (Number(it.cantidad) || 0) * (Number(it.precio) || 0),
        0,
      ),
    [items],
  );

  const impuestosCalculados = useMemo(
    () =>
      impuestos
        .filter((i) => i.activo)
        .map((i) => ({
          ...i,
          monto:
            i.tipo === "porcentaje"
              ? (neto * Number(i.valor)) / 100
              : Number(i.valor) || 0,
        })),
    [impuestos, neto],
  );

  const totalImpuestos = impuestosCalculados.reduce((a, i) => a + i.monto, 0);
  const total = neto + totalImpuestos;
  const fmt = (n) =>
    new Intl.NumberFormat("es-AR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(n || 0);

  // ---------- ITEMS ----------
  const addItem = () =>
    setItems([
      ...items,
      { id: Date.now(), descripcion: "", cantidad: 1, precio: 0 },
    ]);
  const updateItem = (id, field, value) =>
    setItems(
      items.map((it) => (it.id === id ? { ...it, [field]: value } : it)),
    );
  const removeItem = (id) => setItems(items.filter((it) => it.id !== id));

  // ---------- IMPUESTOS ----------
  const toggleImpuesto = (id) =>
    setImpuestos(
      impuestos.map((i) => (i.id === id ? { ...i, activo: !i.activo } : i)),
    );
  const updateImpuestoValor = (id, valor) =>
    setImpuestos(impuestos.map((i) => (i.id === id ? { ...i, valor } : i)));
  const updateImpuestoCampo = (id, campo, valor) =>
    setImpuestos(
      impuestos.map((i) => (i.id === id ? { ...i, [campo]: valor } : i)),
    );
  const addImpuestoCustom = () =>
    setImpuestos([
      ...impuestos,
      {
        id: `custom_${Date.now()}`,
        label: "Impuesto personalizado",
        tipo: "porcentaje",
        valor: 0,
        activo: true,
        fijo: false,
      },
    ]);
  const removeImpuesto = (id) =>
    setImpuestos(impuestos.filter((i) => i.id !== id));

  // ---------- CLIENTES ----------
  const abrirSelectorCliente = async () => {
    setShowClienteSelector(true);
    try {
      const data = await clientesAPI.listar("");
      setClientesLista(data);
    } catch (e) {
      console.error(e);
    }
  };

  const buscarClientes = async (txt) => {
    setBusquedaCliente(txt);
    try {
      const data = await clientesAPI.listar(txt);
      setClientesLista(data);
    } catch (e) {
      console.error(e);
    }
  };

  const seleccionarCliente = (c) => {
    setCliente({ nombre: c.nombre, cuit: c.cuit, clienteId: c._id });
    setShowClienteSelector(false);
  };

  const guardarComoCliente = async () => {
    if (!cliente.nombre.trim()) {
      mostrarMensaje("error", "Ingresá un nombre de cliente primero");
      return;
    }
    try {
      const nuevo = await clientesAPI.crear({
        nombre: cliente.nombre,
        cuit: cliente.cuit,
      });
      setCliente({ ...cliente, clienteId: nuevo._id });
      mostrarMensaje("ok", "Cliente guardado para usos futuros");
    } catch (e) {
      mostrarMensaje(
        "error",
        e.response?.data?.error || "No se pudo guardar el cliente",
      );
    }
  };

  // ---------- GUARDAR ----------
  const mostrarMensaje = (tipo, texto) => {
    setMensaje({ tipo, texto });
    setTimeout(() => setMensaje(null), 3500);
  };

  const guardar = async () => {
    if (!factura.numero.trim())
      return mostrarMensaje("error", "El número de factura es obligatorio");
    setGuardando(true);
    try {
      const payload = {
        ...factura,
        emisor,
        cliente,
        items: items.map(({ id, ...rest }) => rest),
        impuestos,
        observaciones,
      };
      if (id) {
        await facturasAPI.actualizar(id, payload);
        mostrarMensaje("ok", "Factura actualizada");
      } else {
        const nueva = await facturasAPI.crear(payload);
        mostrarMensaje("ok", "Factura guardada");
        navigate(`/factura/${nueva._id}`, { replace: true });
      }
    } catch (e) {
      mostrarMensaje(
        "error",
        e.response?.data?.error || "Error al guardar la factura",
      );
    } finally {
      setGuardando(false);
    }
  };

  // ---------- DESCARGA PDF/PNG ----------
  const descargar = async (formato) => {
    if (!facturaRef.current) return;
    const html2canvas = (await import("html2canvas")).default;
    const canvas = await html2canvas(facturaRef.current, {
      scale: 2,
      backgroundColor: "#ffffff",
      useCORS: true,
    });

    if (formato === "png") {
      const link = document.createElement("a");
      link.download = `${factura.numero || "factura"}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
      return;
    }

    const { jsPDF } = await import("jspdf");
    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const imgWidth = pageWidth;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    let heightLeft = imgHeight;
    let position = 0;
    pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;
    while (heightLeft > 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }
    pdf.save(`${factura.numero || "factura"}.pdf`);
  };

  // ---------- HELPERS DE UI ----------
  const inputCls =
    "w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent transition";
  const labelCls =
    "block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1";
  const sectionCls =
    "bg-white rounded-xl border border-slate-200 p-5 shadow-sm";

  return (
    <div className="p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-900">
              {id ? "Editar factura" : "Nueva factura"}
            </h1>
            <p className="text-slate-500 text-sm mt-1">
              Completá los campos y guardá, descargá en PDF o PNG.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={guardar}
              disabled={guardando}
              className="flex items-center gap-2 px-4 py-2.5 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition font-medium text-sm shadow-sm disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {guardando ? "Guardando..." : "Guardar"}
            </button>
            <button
              onClick={() => descargar("png")}
              className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-100 transition font-medium text-sm shadow-sm"
            >
              <FileImage className="w-4 h-4" />
              PNG
            </button>
            <button
              onClick={() => descargar("pdf")}
              className="flex items-center gap-2 px-4 py-2.5 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition font-medium text-sm shadow-sm"
            >
              <FileText className="w-4 h-4" />
              PDF
            </button>
          </div>
        </div>

        {mensaje && (
          <div
            className={`mb-4 px-4 py-3 rounded-lg text-sm font-medium ${
              mensaje.tipo === "ok"
                ? "bg-green-50 border border-green-200 text-green-800"
                : "bg-red-50 border border-red-200 text-red-800"
            }`}
          >
            {mensaje.texto}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* ============ FORMULARIO ============ */}
          <div className="space-y-4">
            {/* SELECTOR DE EMISOR */}
            <div className={sectionCls}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-bold text-slate-900 flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-orange-500" />
                  Emisor
                </h2>
                <button
                  onClick={() => navigate("/emisores")}
                  className="text-xs text-slate-500 hover:text-orange-500 transition"
                >
                  Gestionar emisores →
                </button>
              </div>

              {emisoresDisponibles.length === 0 ? (
                <p className="text-sm text-slate-500">
                  No hay emisores cargados. Andá a "Emisores" para crear uno.
                </p>
              ) : (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4">
                    {emisoresDisponibles.map((em) => {
                      const seleccionado = emisor.emisorId === em._id;
                      return (
                        <button
                          key={em._id}
                          onClick={() => seleccionarEmisor(em)}
                          className={`text-left p-3 rounded-lg border-2 transition flex items-center gap-3 ${
                            seleccionado
                              ? "border-orange-500 bg-orange-50"
                              : "border-slate-200 bg-white hover:border-slate-300"
                          }`}
                        >
                          {em.logo ? (
                            <img
                              src={em.logo}
                              alt=""
                              className="w-10 h-10 object-contain flex-shrink-0"
                            />
                          ) : (
                            <div className="w-10 h-10 flex items-center justify-center bg-slate-100 rounded flex-shrink-0">
                              <Building2 className="w-5 h-5 text-slate-400" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm text-slate-900 truncate">
                              {em.nombre}
                            </p>
                            {em.cuit && (
                              <p className="text-xs text-slate-500 truncate">
                                CUIT: {em.cuit}
                              </p>
                            )}
                          </div>
                          {seleccionado && (
                            <Check className="w-4 h-4 text-orange-500 flex-shrink-0" />
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {/* Detalle editable del emisor seleccionado */}
                  <details className="border-t border-slate-200 pt-3">
                    <summary className="text-xs font-semibold text-slate-600 uppercase tracking-wide cursor-pointer hover:text-slate-900">
                      Ajustar datos para esta factura
                    </summary>
                    <div className="mt-3 space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className={labelCls}>Nombre</label>
                          <input
                            className={inputCls}
                            value={emisor.nombre}
                            onChange={(e) =>
                              setEmisor({ ...emisor, nombre: e.target.value })
                            }
                          />
                        </div>
                        <div>
                          <label className={labelCls}>Subtítulo</label>
                          <input
                            className={inputCls}
                            value={emisor.subtitulo}
                            onChange={(e) =>
                              setEmisor({
                                ...emisor,
                                subtitulo: e.target.value,
                              })
                            }
                          />
                        </div>
                      </div>
                      <div>
                        <label className={labelCls}>CUIT / CUIL</label>
                        <input
                          className={inputCls}
                          value={emisor.cuit}
                          onChange={(e) =>
                            setEmisor({ ...emisor, cuit: e.target.value })
                          }
                        />
                      </div>
                      <div>
                        <label className={labelCls}>Dirección</label>
                        <input
                          className={inputCls}
                          value={emisor.direccion}
                          onChange={(e) =>
                            setEmisor({ ...emisor, direccion: e.target.value })
                          }
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className={labelCls}>Teléfono</label>
                          <input
                            className={inputCls}
                            value={emisor.telefono}
                            onChange={(e) =>
                              setEmisor({ ...emisor, telefono: e.target.value })
                            }
                          />
                        </div>
                        <div>
                          <label className={labelCls}>Email</label>
                          <input
                            className={inputCls}
                            value={emisor.email}
                            onChange={(e) =>
                              setEmisor({ ...emisor, email: e.target.value })
                            }
                          />
                        </div>
                      </div>
                      <p className="text-xs text-slate-500">
                        Estos cambios solo afectan esta factura. Para cambios
                        permanentes, editá el emisor en la pestaña "Emisores".
                      </p>
                    </div>
                  </details>
                </>
              )}
            </div>

            {/* Datos comprobante */}
            <div className={sectionCls}>
              <h2 className="font-bold text-slate-900 mb-4">
                Datos del comprobante
              </h2>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Tipo / Título</label>
                  <input
                    className={inputCls}
                    value={factura.titulo}
                    onChange={(e) =>
                      setFactura({ ...factura, titulo: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className={labelCls}>Número</label>
                  <input
                    className={inputCls}
                    value={factura.numero}
                    onChange={(e) =>
                      setFactura({ ...factura, numero: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className={labelCls}>Fecha de emisión</label>
                  <input
                    type="date"
                    className={inputCls}
                    value={factura.fecha}
                    onChange={(e) =>
                      setFactura({ ...factura, fecha: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className={labelCls}>Válida por (días)</label>
                  <input
                    className={inputCls}
                    value={factura.validez}
                    onChange={(e) =>
                      setFactura({ ...factura, validez: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className={labelCls}>CAE N°</label>
                  <input
                    className={inputCls}
                    value={factura.cae}
                    onChange={(e) =>
                      setFactura({ ...factura, cae: e.target.value })
                    }
                    placeholder="Opcional"
                  />
                </div>
                <div>
                  <label className={labelCls}>Vto. de CAE</label>
                  <input
                    type="date"
                    className={inputCls}
                    value={factura.vtoCae}
                    onChange={(e) =>
                      setFactura({ ...factura, vtoCae: e.target.value })
                    }
                  />
                </div>
              </div>
            </div>

            {/* Cliente */}
            <div className={sectionCls}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-bold text-slate-900">Datos del cliente</h2>
                <div className="flex gap-2">
                  <button
                    onClick={abrirSelectorCliente}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm rounded-md transition"
                  >
                    <Search className="w-4 h-4" />
                    Buscar
                  </button>
                  <button
                    onClick={guardarComoCliente}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm rounded-md transition"
                    title="Guardar este cliente para reutilizarlo"
                  >
                    <UserPlus className="w-4 h-4" />
                    Guardar
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Nombre / Razón social</label>
                  <input
                    className={inputCls}
                    value={cliente.nombre}
                    onChange={(e) =>
                      setCliente({
                        ...cliente,
                        nombre: e.target.value,
                        clienteId: null,
                      })
                    }
                    placeholder="Ej: Trapani"
                  />
                </div>
                <div>
                  <label className={labelCls}>CUIT / DNI</label>
                  <input
                    className={inputCls}
                    value={cliente.cuit}
                    onChange={(e) =>
                      setCliente({
                        ...cliente,
                        cuit: e.target.value,
                        clienteId: null,
                      })
                    }
                    placeholder="Ej: 30505517632"
                  />
                </div>
              </div>
              {cliente.clienteId && (
                <p className="text-xs text-green-600 mt-2">
                  ✓ Cliente vinculado a la base
                </p>
              )}
            </div>

            {/* Items */}
            <div className={sectionCls}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-bold text-slate-900">Items</h2>
                <button
                  onClick={addItem}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-500 text-white text-sm rounded-md hover:bg-orange-600 transition"
                >
                  <Plus className="w-4 h-4" />
                  Agregar item
                </button>
              </div>
              <div className="space-y-3">
                {items.map((it) => (
                  <div
                    key={it.id}
                    className="grid grid-cols-12 gap-2 items-start"
                  >
                    <div className="col-span-6">
                      <input
                        className={inputCls}
                        placeholder="Descripción"
                        value={it.descripcion}
                        onChange={(e) =>
                          updateItem(it.id, "descripcion", e.target.value)
                        }
                      />
                    </div>
                    <div className="col-span-2">
                      <input
                        type="number"
                        min="0"
                        className={inputCls}
                        placeholder="Cant."
                        value={it.cantidad}
                        onChange={(e) =>
                          updateItem(it.id, "cantidad", e.target.value)
                        }
                      />
                    </div>
                    <div className="col-span-3">
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        className={inputCls}
                        placeholder="Precio unit."
                        value={it.precio}
                        onChange={(e) =>
                          updateItem(it.id, "precio", e.target.value)
                        }
                      />
                    </div>
                    <div className="col-span-1 flex justify-end">
                      <button
                        onClick={() => removeItem(it.id)}
                        disabled={items.length === 1}
                        className="p-2 text-slate-400 hover:text-red-500 disabled:opacity-30 disabled:cursor-not-allowed transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Impuestos */}
            <div className={sectionCls}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-bold text-slate-900">Impuestos</h2>
                <button
                  onClick={addImpuestoCustom}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm rounded-md transition"
                >
                  <Plus className="w-4 h-4" />
                  Personalizado
                </button>
              </div>
              <p className="text-xs text-slate-500 mb-3">
                Tildá los impuestos que querés que aparezcan en la factura.
              </p>
              <div className="space-y-2">
                {impuestos.map((imp) => (
                  <div
                    key={imp.id}
                    className={`flex items-center gap-3 p-2.5 rounded-md border transition ${
                      imp.activo
                        ? "border-orange-300 bg-orange-50"
                        : "border-slate-200 bg-white"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={imp.activo}
                      onChange={() => toggleImpuesto(imp.id)}
                      className="w-4 h-4 accent-orange-500 cursor-pointer"
                    />
                    {imp.fijo ? (
                      <span className="flex-1 text-sm font-medium text-slate-700">
                        {imp.label}
                      </span>
                    ) : (
                      <input
                        className="flex-1 px-2 py-1 text-sm bg-white border border-slate-200 rounded"
                        value={imp.label}
                        onChange={(e) =>
                          updateImpuestoCampo(imp.id, "label", e.target.value)
                        }
                        placeholder="Nombre del impuesto"
                      />
                    )}
                    {!imp.fijo && (
                      <select
                        value={imp.tipo}
                        onChange={(e) =>
                          updateImpuestoCampo(imp.id, "tipo", e.target.value)
                        }
                        className="px-2 py-1 text-xs bg-white border border-slate-200 rounded"
                      >
                        <option value="porcentaje">%</option>
                        <option value="monto">$</option>
                      </select>
                    )}
                    {imp.tipo === "porcentaje" &&
                    imp.fijo &&
                    imp.id !== "iva0" ? (
                      <span className="text-xs text-slate-500 w-24 text-right">
                        ${fmt(imp.activo ? (neto * imp.valor) / 100 : 0)}
                      </span>
                    ) : imp.id === "iva0" ? (
                      <span className="text-xs text-slate-500 w-24 text-right">
                        $0,00
                      </span>
                    ) : imp.fijo && imp.tipo === "monto" ? (
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={imp.valor}
                        onChange={(e) =>
                          updateImpuestoValor(imp.id, e.target.value)
                        }
                        className="w-24 px-2 py-1 text-sm text-right bg-white border border-slate-200 rounded"
                      />
                    ) : (
                      <>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={imp.valor}
                          onChange={(e) =>
                            updateImpuestoValor(imp.id, e.target.value)
                          }
                          className="w-20 px-2 py-1 text-sm text-right bg-white border border-slate-200 rounded"
                        />
                        <button
                          onClick={() => removeImpuesto(imp.id)}
                          className="p-1 text-slate-400 hover:text-red-500 transition"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Observaciones */}
            <div className={sectionCls}>
              <h2 className="font-bold text-slate-900 mb-3">Observaciones</h2>
              <textarea
                rows={4}
                className={inputCls}
                placeholder="Notas, condiciones, etc."
                value={observaciones}
                onChange={(e) => setObservaciones(e.target.value)}
              />
            </div>
          </div>

          {/* ============ PREVIEW ============ */}
          <div className="lg:sticky lg:top-20 lg:self-start">
            <div className="bg-slate-200 rounded-xl p-4 shadow-inner">
              <p className="text-xs text-slate-500 mb-3 text-center font-medium uppercase tracking-wide">
                Vista previa
              </p>
              <div
                ref={facturaRef}
                className="bg-white shadow-lg"
                style={{
                  fontFamily: "Arial, Helvetica, sans-serif",
                  minHeight: "900px",
                }}
              >
                <div className="p-8 flex gap-5 items-start">
                  {emisor.logo ? (
                    <img
                      src={emisor.logo}
                      alt="logo"
                      className="w-20 h-20 object-contain flex-shrink-0"
                    />
                  ) : (
                    <div className="w-20 h-20 flex-shrink-0 flex items-center justify-center border-2 border-slate-300 rounded text-slate-300 text-xs text-center">
                      LOGO
                    </div>
                  )}
                  <div className="flex-1">
                    <h1 className="text-2xl font-bold text-slate-900">
                      {emisor.nombre || "Empresa"}
                    </h1>
                    {emisor.subtitulo && (
                      <p className="text-sm text-slate-600 mt-0.5">
                        {emisor.subtitulo}
                      </p>
                    )}
                    {emisor.cuit && (
                      <p className="text-xs text-slate-500 mt-1">
                        CUIT/CUIL: {emisor.cuit}
                      </p>
                    )}
                    {emisor.direccion && (
                      <p className="text-xs text-slate-500">
                        {emisor.direccion}
                      </p>
                    )}
                    <p className="text-xs text-slate-500">
                      {emisor.telefono}
                      {emisor.telefono && emisor.email ? " · " : ""}
                      {emisor.email}
                    </p>
                  </div>
                </div>

                <div className="border-t border-slate-200 mx-8" />

                <div className="px-8 pt-6 pb-4 flex justify-between items-start">
                  <div>
                    <h2 className="text-3xl font-bold text-slate-900">
                      {factura.titulo || "FACTURA"}
                    </h2>
                    <p className="text-xs text-slate-500 mt-1">
                      Fecha de emisión:{" "}
                      {factura.fecha
                        ? new Date(factura.fecha).toLocaleDateString("es-AR")
                        : "—"}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold text-orange-500">
                      {factura.numero}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      Válida por: {factura.validez} días
                    </p>
                  </div>
                </div>

                <div className="px-8 pb-4">
                  <p className="font-bold text-sm text-slate-900">PARA:</p>
                  <p className="text-sm text-slate-700 mt-1">
                    {cliente.nombre || "—"}
                  </p>
                  {cliente.cuit && (
                    <p className="text-sm text-slate-700">
                      CUIT/DNI: {cliente.cuit}
                    </p>
                  )}
                </div>

                <div className="px-8 mt-4">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-orange-500 text-white text-left">
                        <th className="px-3 py-2 font-semibold">Descripción</th>
                        <th className="px-3 py-2 font-semibold text-center w-20">
                          Cantidad
                        </th>
                        <th className="px-3 py-2 font-semibold text-right w-28">
                          Precio unit.
                        </th>
                        <th className="px-3 py-2 font-semibold text-right w-28">
                          Subtotal
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((it) => (
                        <tr key={it.id} className="border-b border-slate-100">
                          <td className="px-3 py-2 text-slate-700">
                            {it.descripcion || "—"}
                          </td>
                          <td className="px-3 py-2 text-center text-slate-700">
                            {it.cantidad}
                          </td>
                          <td className="px-3 py-2 text-right text-slate-700">
                            ${fmt(it.precio)}
                          </td>
                          <td className="px-3 py-2 text-right text-slate-700">
                            $
                            {fmt(
                              (Number(it.cantidad) || 0) *
                                (Number(it.precio) || 0),
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="px-8 mt-6">
                  <div className="ml-auto w-full max-w-sm space-y-1.5 text-sm">
                    <div className="flex justify-between py-1 border-b border-slate-100">
                      <span className="font-semibold text-slate-700">
                        Importe Neto Gravado:
                      </span>
                      <span className="text-slate-700">${fmt(neto)}</span>
                    </div>
                    {impuestosCalculados.map((i) => (
                      <div
                        key={i.id}
                        className="flex justify-between py-1 border-b border-slate-100"
                      >
                        <span className="font-semibold text-slate-700">
                          {i.label}:
                        </span>
                        <span className="text-slate-700">${fmt(i.monto)}</span>
                      </div>
                    ))}
                    <div className="flex justify-between py-2 mt-1 bg-orange-500 text-white px-3 rounded">
                      <span className="font-bold">Importe Total:</span>
                      <span className="font-bold">${fmt(total)}</span>
                    </div>
                  </div>
                </div>

                {(factura.cae || factura.vtoCae) && (
                  <div className="px-8 mt-6 text-sm">
                    {factura.cae && (
                      <p>
                        <span className="font-bold">CAE N°:</span> {factura.cae}
                      </p>
                    )}
                    {factura.vtoCae && (
                      <p>
                        <span className="font-bold">Vto. de CAE:</span>{" "}
                        {new Date(factura.vtoCae).toLocaleDateString("es-AR")}
                      </p>
                    )}
                  </div>
                )}

                {observaciones && (
                  <div className="px-8 mt-6">
                    <p className="font-bold text-sm text-slate-900">
                      Observaciones:
                    </p>
                    <p className="text-sm text-slate-700 whitespace-pre-wrap mt-1">
                      {observaciones}
                    </p>
                  </div>
                )}

                <div className="mt-10 bg-slate-800 text-white px-8 py-5">
                  <p className="font-bold text-sm mb-1">
                    Información de Contacto
                  </p>
                  {emisor.telefono && (
                    <p className="text-xs text-slate-300">
                      Tel: {emisor.telefono}
                    </p>
                  )}
                  {emisor.email && (
                    <p className="text-xs text-slate-300">{emisor.email}</p>
                  )}
                  {emisor.direccion && (
                    <p className="text-xs text-slate-300">{emisor.direccion}</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ============ MODAL CLIENTES ============ */}
      {showClienteSelector && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-30 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-slate-200">
              <h3 className="font-bold text-slate-900">Seleccionar cliente</h3>
              <button
                onClick={() => setShowClienteSelector(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 border-b border-slate-200">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  autoFocus
                  type="text"
                  value={busquedaCliente}
                  onChange={(e) => buscarClientes(e.target.value)}
                  placeholder="Buscar por nombre o CUIT..."
                  className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-400"
                />
              </div>
            </div>
            <div className="overflow-y-auto flex-1 p-2">
              {clientesLista.length === 0 ? (
                <p className="text-center text-sm text-slate-500 py-8">
                  No hay clientes guardados
                </p>
              ) : (
                clientesLista.map((c) => (
                  <button
                    key={c._id}
                    onClick={() => seleccionarCliente(c)}
                    className="w-full text-left px-3 py-2.5 hover:bg-slate-100 rounded-md transition"
                  >
                    <p className="font-medium text-slate-900 text-sm">
                      {c.nombre}
                    </p>
                    {c.cuit && (
                      <p className="text-xs text-slate-500">
                        CUIT/DNI: {c.cuit}
                      </p>
                    )}
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
