import React, { useMemo, useState, useEffect } from "react";

export default function AdminClientesPage({
  onCerrarSesion,
  onIrDashboard,
  onIrCitas,
  onIrClientes,
  onIrServicios,
  onIrHorarios,
  onIrConfiguracion,
  onIrAgregarCliente, // nueva prop para ir a "Agregar Cliente"
}) {
  const [clientes, setClientes] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [filtroTipo, setFiltroTipo] = useState("Todos"); // Todos, Activos, Inactivos
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  // Modal historial
  const [clienteHistorial, setClienteHistorial] = useState(null);
  const [historialCitas, setHistorialCitas] = useState([]);
  const [cargandoHistorial, setCargandoHistorial] = useState(false);
  const [errorHistorial, setErrorHistorial] = useState("");

  // Modal edición (datos cliente)
  const [clienteEditando, setClienteEditando] = useState(null);
  const [guardandoEdicion, setGuardandoEdicion] = useState(false);
  const [errorEdicion, setErrorEdicion] = useState("");

  const safe = (fn) => (typeof fn === "function" ? fn : () => {});

  // Helpers
  const formatearFecha = (fechaStr) => {
    if (!fechaStr) return "Sin visitas registradas";

    const fecha = new Date(fechaStr);
    if (isNaN(fecha.getTime())) return "Sin visitas registradas";

    const dias = [
      "Domingo",
      "Lunes",
      "Martes",
      "Miércoles",
      "Jueves",
      "Viernes",
      "Sábado",
    ];
    const meses = [
      "Enero",
      "Febrero",
      "Marzo",
      "Abril",
      "Mayo",
      "Junio",
      "Julio",
      "Agosto",
      "Septiembre",
      "Octubre",
      "Noviembre",
      "Diciembre",
    ];

    const diaSemana = dias[fecha.getDay()];
    const dia = fecha.getDate();
    const mes = meses[fecha.getMonth()];
    const anio = fecha.getFullYear();

    return `${diaSemana}, ${dia} de ${mes} de ${anio}`;
  };

  const formatearFechaCita = (fechaStr) => {
    if (!fechaStr) return "";
    const partes = String(fechaStr).split("-");
    if (partes.length !== 3) return fechaStr;

    const anio = parseInt(partes[0], 10);
    const mes = parseInt(partes[1], 10) - 1;
    const dia = parseInt(partes[2], 10);
    const fecha = new Date(anio, mes, dia);
    if (isNaN(fecha.getTime())) return fechaStr;

    return formatearFecha(fecha);
  };

  // Cargar clientes desde backend
  useEffect(() => {
    const cargarClientes = async () => {
      try {
        const resp = await fetch("http://localhost:4000/api/clientes");
        if (!resp.ok) {
          throw new Error("No se pudieron cargar los clientes.");
        }
        const data = await resp.json();
        setClientes(data || []);
        setError("");
      } catch (err) {
        console.error("Error cargando clientes:", err);
        setError("No se pudieron cargar los clientes desde el servidor.");
        setClientes([]);
      } finally {
        setCargando(false);
      }
    };

    cargarClientes();
  }, []);

  // Normaliza + filtra para la UI
  const clientesFiltrados = useMemo(() => {
    let normalizados = clientes.map((c, idx) => {
      const nombre = c.nombre || "Cliente sin nombre";
      const correo = c.correo || "Sin correo";
      const telefono = c.telefono || "Sin teléfono";
      const totalCitas =
        typeof c.totalCitas === "number" ? c.totalCitas : 0;
      const estadoCuenta =
  c.estado || (c.activo === false ? "Inactivo" : "Activo");


      let tipo = c.tipo || "Nuevo";
      if (!c.tipo) {
        if (estadoCuenta === "Inactivo") tipo = "Inactivo";
        else if (totalCitas >= 5) tipo = "Frecuente";
      }

      const ultimaVisita =
        c.ultimaVisita || formatearFecha(c.ultimaVisita || c.createdAt);

      return {
        id: c._id || idx,
        nombre,
        correo,
        telefono,
        totalCitas,
        ultimaVisita,
        estado: estadoCuenta,
        tipo,
      };
    });

    // Filtrado por estado
    if (filtroTipo === "Activos") {
      normalizados = normalizados.filter((c) => c.estado === "Activo");
    } else if (filtroTipo === "Inactivos") {
      normalizados = normalizados.filter((c) => c.estado === "Inactivo");
    }

    if (busqueda.trim() !== "") {
      const q = busqueda.toLowerCase();
      normalizados = normalizados.filter(
        (c) =>
          c.nombre.toLowerCase().includes(q) ||
          c.correo.toLowerCase().includes(q) ||
          c.telefono.toLowerCase().includes(q)
      );
    }

    return normalizados;
  }, [clientes, busqueda, filtroTipo]);

  // --------- Acciones de botones ---------

  // Ver historial (abre modal)
  const handleVerHistorial = async (cliente) => {
    if (!cliente.correo) return;

    setClienteHistorial(cliente);
    setHistorialCitas([]);
    setErrorHistorial("");
    setCargandoHistorial(true);

    try {
      const resp = await fetch(
        `http://localhost:4000/api/citas/mis-citas?correo=${encodeURIComponent(
          cliente.correo
        )}`
      );
      if (!resp.ok) throw new Error("Error obteniendo citas.");
      const data = await resp.json();
      setHistorialCitas(data || []);
    } catch (err) {
      console.error("Error historial:", err);
      setErrorHistorial("No se pudo cargar el historial de citas.");
    } finally {
      setCargandoHistorial(false);
    }
  };

  // Abrir modal edición (datos del cliente)
  const handleAbrirEditar = (cliente) => {
    setErrorEdicion("");
    setClienteEditando({
      id: cliente.id,
      nombre: cliente.nombre || "",
      telefono: cliente.telefono || "",
      correo: cliente.correo || "",
      password: "",
    });
  };

  // Guardar cambios de edición
const handleGuardarEdicion = async () => {
  if (!clienteEditando) return;

  const { id, nombre, telefono, correo, password } = clienteEditando;

  if (!nombre.trim() || !telefono.trim() || !correo.trim()) {
    setErrorEdicion("Nombre, teléfono y correo son obligatorios.");
    return;
  }

  // Teléfono: solo números
  const telefonoSoloNumeros = telefono.replace(/\D/g, "");
  if (telefonoSoloNumeros.length === 0) {
    setErrorEdicion("El teléfono solo puede contener números.");
    return;
  }

  // Correo: formato básico válido
  const correoLimpio = correo.trim();
  const patronCorreo = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!patronCorreo.test(correoLimpio)) {
    setErrorEdicion(
      "Ingresa un correo electrónico válido (debe incluir @ y un dominio)."
    );
    return;
  }

  setGuardandoEdicion(true);
  setErrorEdicion("");

  try {
    const body = {
      nombre: nombre.trim(),
      telefono: telefonoSoloNumeros,
      correo: correoLimpio,
    };

    if (password && password.trim() !== "") {
      body.password = password.trim(); // opcional
    }

    const resp = await fetch(`http://localhost:4000/api/clientes/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!resp.ok) throw new Error("Error al guardar cambios.");

    setClientes((prev) =>
      prev.map((c) =>
        (c._id || c.id) === id
          ? {
              ...c,
              nombre: body.nombre,
              telefono: body.telefono,
              correo: body.correo,
            }
          : c
      )
    );

    setClienteEditando(null);
  } catch (err) {
    console.error("Error guardando edición:", err);
    setErrorEdicion("No se pudieron guardar los cambios.");
  } finally {
    setGuardandoEdicion(false);
  }
};


  // Cambiar estado (activo/inactivo) también en el backend
  const handleToggleEstado = async (cliente) => {
    const estadoAnterior = cliente.estado || "Activo";
    const nuevoEstado = estadoAnterior === "Activo" ? "Inactivo" : "Activo";
    const idCliente = cliente.id;

    // Actualización optimista en el frontend
    setClientes((prev) =>
      prev.map((c) =>
        (c._id || c.id) === idCliente
          ? {
              ...c,
              estado: nuevoEstado,
              activo: nuevoEstado === "Activo",
            }
          : c
      )
    );

    try {
      const resp = await fetch(
        `http://localhost:4000/api/clientes/${idCliente}/estado`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ activo: nuevoEstado === "Activo" }),
        }
      );

      if (!resp.ok) {
        throw new Error("Respuesta no OK");
      }
    } catch (err) {
      console.error("Error actualizando estado del cliente:", err);

      // Revertir si falla
      setClientes((prev) =>
        prev.map((c) =>
          (c._id || c.id) === idCliente
            ? {
                ...c,
                estado: estadoAnterior,
                activo: estadoAnterior === "Activo",
              }
            : c
        )
      );
      alert("No se pudo actualizar el estado en el servidor.");
    }
  };

  // Eliminar cliente (frontend + backend)
  const handleEliminarCliente = async (cliente) => {
    const confirmar = window.confirm(
      `¿Seguro que deseas eliminar al cliente "${cliente.nombre}"? Esta acción no se puede deshacer.`
    );
    if (!confirmar) return;

    const idCliente = cliente.id;
    const clientesPrevios = clientes;

    // Quitar de la UI de forma optimista
    setClientes((prev) =>
      prev.filter((c) => (c._id || c.id) !== idCliente)
    );

    try {
      const resp = await fetch(
        `http://localhost:4000/api/clientes/${idCliente}`,
        {
          method: "DELETE",
        }
      );

      if (!resp.ok) {
        throw new Error("Respuesta no OK");
      }
    } catch (err) {
      console.error("Error eliminando cliente:", err);
      alert("No se pudo eliminar el cliente en el servidor.");
      // Revertir cambios en la UI si falla
      setClientes(clientesPrevios);
    }
  };



  // ---------- RENDER ----------

  return (
    <div className="min-h-screen bg-fondo text-blanco-suave flex">
      {/* SIDEBAR */}
      <aside className="w-64 bg-panel-oscuro border-r border-panel-medio flex flex-col">
        <div className="px-5 py-4 border-b border-panel-medio">
          <h1 className="text-lg font-semibold tracking-tight">
            Barbería Deluxe
          </h1>
          <p className="text-xs text-texto-secundario mt-1">
            Panel de administración
          </p>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1 text-sm">
          <button
            type="button"
            onClick={safe(onIrDashboard)}
            className="w-full text-left px-3 py-2 rounded-lg text-texto-secundario hover:bg-panel-medio/70 hover:text-blanco-suave"
          >
            Dashboard
          </button>
          <button
            type="button"
            onClick={safe(onIrCitas)}
            className="w-full text-left px-3 py-2 rounded-lg text-texto-secundario hover:bg-panel-medio/70 hover:text-blanco-suave"
          >
            Citas
          </button>
          <button
            type="button"
            onClick={safe(onIrClientes)}
            className="w-full text-left px-3 py-2 rounded-lg bg-panel-medio text-blanco-suave"
          >
            Clientes
          </button>
          <button
            type="button"
            onClick={safe(onIrServicios)}
            className="w-full text-left px-3 py-2 rounded-lg text-texto-secundario hover:bg-panel-medio/70 hover:text-blanco-suave"
          >
            Servicios
          </button>
          <button
            type="button"
            onClick={safe(onIrHorarios)}
            className="w-full text-left px-3 py-2 rounded-lg text-texto-secundario hover:bg-panel-medio/70 hover:text-blanco-suave"
          >
            Horarios
          </button>
          <button
            type="button"
            onClick={safe(onIrConfiguracion)}
            className="w-full text-left px-3 py-2 rounded-lg text-texto-secundario hover:bg-panel-medio/70 hover:text-blanco-suave"
          >
            Configuración
          </button>
        </nav>

        <div className="px-4 py-4 border-t border-panel-medio flex items-center justify-between text-xs">
          <div>
            <p className="font-semibold">Ana López</p>
            <p className="text-texto-secundario">Administrador</p>
          </div>
          <button
            type="button"
            onClick={safe(onCerrarSesion)}
            className="px-3 py-1 rounded-full bg-panel-medio text-texto-secundario hover:bg-panel-claro hover:text-blanco-suave transition text-[11px]"
          >
            Cerrar Sesión
          </button>
        </div>
      </aside>

      {/* CONTENIDO PRINCIPAL */}
      <main className="flex-1 flex flex-col">
        {/* HEADER SUPERIOR */}
        <header className="border-b border-panel-medio px-8 py-4 flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-xs uppercase tracking-[0.15em] text-texto-secundario">
              Panel de Administración
            </span>
            <h2 className="text-xl font-semibold mt-1">Clientes</h2>
          </div>
          <button
            type="button"
            onClick={onIrAgregarCliente}
            className="px-5 py-2.5 rounded-full bg-crema text-negro-suave text-xs font-semibold hover:bg-blanco-suave transition shadow-sm"
          >
            Agregar Cliente
          </button>
        </header>

        {/* CONTENIDO */}
        <div className="max-w-6xl mx-auto px-6 py-6 space-y-6">
          {cargando && (
            <p className="text-xs text-texto-secundario">
              Cargando clientes desde el servidor...
            </p>
          )}
          {!cargando && error && (
            <p className="text-xs text-estado-cancelada">{error}</p>
          )}

          {/* Resumen / filtros */}
          <section className="bg-panel-oscuro rounded-2xl border border-panel-medio px-5 py-4 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="space-y-2">
              <h3 className="text-sm font-semibold">Resumen de clientes</h3>
              <p className="text-xs text-texto-secundario">
                Administra los datos de tus clientes, crea cuentas nuevas o
                revisa su historial de visitas.
              </p>
            </div>

            <div className="flex flex-col gap-3 md:flex-row md:items-center">
              <div className="flex items-center gap-2">
                {["Todos", "Activos", "Inactivos"].map((tipo) => (
                  <button
                    key={tipo}
                    type="button"
                    onClick={() => setFiltroTipo(tipo)}
                    className={`px-3 py-1.5 rounded-full text-xs border transition ${
                      filtroTipo === tipo
                        ? "bg-panel-claro text-blanco-suave border-panel-claro"
                        : "border-panel-medio text-texto-secundario hover:border-panel-claro hover:text-blanco-suave"
                    }`}
                  >
                    {tipo}
                  </button>
                ))}
              </div>
            </div>
          </section>

          {/* Buscador */}
          <section className="flex items-center gap-3">
            <div className="flex-1 relative">
              <input
                type="text"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Buscar por nombre, correo o teléfono..."
                className="w-full bg-panel-oscuro border border-panel-medio rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-crema/40 focus:border-crema placeholder:text-texto-secundario"
              />
            </div>
          </section>

          {/* Lista de clientes */}
          <section className="space-y-3">
            <div className="flex items-center justify-between text-xs text-texto-secundario px-2">
              <span>{clientesFiltrados.length} clientes encontrados</span>
              <span>
                (Las acciones se están conectando poco a poco al backend)
              </span>
            </div>

            <div className="space-y-3">
              {clientesFiltrados.map((cliente) => (
                <article
                  key={cliente.id}
                  className="bg-panel-oscuro rounded-2xl border border-panel-medio px-5 py-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between"
                >
                  {/* Info principal */}
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-panel-medio flex items-center justify-center text-sm font-semibold">
                      {cliente.nombre
                        .split(" ")
                        .map((p) => p[0])
                        .join("")
                        .slice(0, 2)}
                    </div>
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-semibold">
                          {cliente.nombre}
                        </p>
                      </div>
                      <p className="text-xs text-texto-secundario">
                        {cliente.correo}
                      </p>
                      <p className="text-xs text-texto-secundario">
                        {cliente.telefono}
                      </p>
                      <p className="text-[11px] text-texto-secundario">
                        Total de citas:{" "}
                        <span className="font-medium">
                          {cliente.totalCitas}
                        </span>{" "}
                        · Última visita:{" "}
                        <span className="font-medium">
                          {cliente.ultimaVisita}
                        </span>
                      </p>
                    </div>
                  </div>

                  {/* Acciones */}
                    <div className="flex flex-col items-start md:items-end gap-2 text-xs">
                      <div className="flex flex-wrap gap-2">
  <button
    type="button"
    onClick={() => handleVerHistorial(cliente)}
    className="px-3 py-1 rounded-full border border-panel-claro text-texto-secundario hover:bg-panel-claro hover:text-blanco-suave transition"
  >
    Ver historial
  </button>

  <button
    type="button"
    onClick={() => handleAbrirEditar(cliente)}
    className="px-3 py-1 rounded-full border border-panel-medio text-texto-secundario hover:bg-panel-medio/80 transition"
  >
    Editar datos
  </button>

  <button
    type="button"
    onClick={() => handleToggleEstado(cliente)}
    className={`px-3 py-1 rounded-full border text-xs transition ${
      cliente.estado === "Activo"
        ? "border-estado-cancelada/60 text-estado-cancelada hover:bg-estado-cancelada/10"
        : "border-estado-confirmada/60 text-estado-confirmada hover:bg-estado-confirmada/10"
    }`}
  >
    {cliente.estado === "Activo"
      ? "Marcar como inactivo"
      : "Marcar como activo"}
  </button>

  <button
    type="button"
    onClick={() => handleEliminarCliente(cliente)}
    className="px-3 py-1 rounded-full border border-estado-cancelada/80 text-estado-cancelada hover:bg-estado-cancelada/15 transition"
  >
    Eliminar
  </button>
                      </div>
                    <p className="text-[11px] text-texto-secundario">
                      Puedes crear cuentas manualmente para clientes que no
                      saben registrarse desde la web.
                    </p>
                  </div>
                </article>
              ))}

              {clientesFiltrados.length === 0 && !cargando && (
                <div className="bg-panel-oscuro rounded-2xl border border-panel-medio px-5 py-8 text-center text-sm text-texto-secundario">
                  No hay clientes que coincidan con los filtros o la búsqueda.
                </div>
              )}
            </div>
          </section>
        </div>
      </main>

      {/* MODAL HISTORIAL */}
      {clienteHistorial && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-40">
          <div className="bg-panel-oscuro border border-panel-medio rounded-2xl max-w-xl w-full mx-4 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold">
                Historial de citas · {clienteHistorial.nombre}
              </h3>
              <button
                type="button"
                className="text-xs text-texto-secundario hover:text-blanco-suave"
                onClick={() => setClienteHistorial(null)}
              >
                Cerrar
              </button>
            </div>

            {cargandoHistorial && (
              <p className="text-xs text-texto-secundario">
                Cargando historial...
              </p>
            )}
            {!cargandoHistorial && errorHistorial && (
              <p className="text-xs text-estado-cancelada">{errorHistorial}</p>
            )}

            {!cargandoHistorial && !errorHistorial && (
              <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                {historialCitas.length === 0 && (
                  <p className="text-xs text-texto-secundario">
                    Este cliente aún no tiene citas registradas.
                  </p>
                )}

                {historialCitas.map((cita) => (
                  <div
                    key={cita.citaId || cita._id}
                    className="border border-panel-medio rounded-xl px-3 py-2 text-xs flex flex-col gap-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold">
                        {cita.servicio || "Servicio"}
                      </span>
                      <span className="text-[11px] text-texto-secundario">
                        {cita.hora}
                      </span>
                    </div>
                    <span className="text-[11px] text-texto-secundario">
                      {formatearFechaCita(cita.fecha)}
                    </span>
                    <span className="text-[11px] text-texto-secundario">
                      Estado:{" "}
                      <strong>{cita.estado || "Pendiente"}</strong>
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL EDICIÓN (DATOS DEL CLIENTE) */}
      {clienteEditando && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-40">
          <div className="bg-panel-oscuro border border-panel-medio rounded-2xl max-w-sm w-full mx-4 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold">
                Editar datos del cliente
              </h3>
              <button
                type="button"
                className="text-xs text-texto-secundario hover:text-blanco-suave"
                onClick={() => setClienteEditando(null)}
              >
                Cerrar
              </button>
            </div>

            {errorEdicion && (
              <p className="text-xs text-estado-cancelada">{errorEdicion}</p>
            )}

            <div className="space-y-3 text-xs">
              <div className="flex flex-col gap-1">
                <label className="text-[11px] text-texto-secundario">
                  Nombre completo
                </label>
                <input
                  type="text"
                  value={clienteEditando.nombre}
                  onChange={(e) =>
                    setClienteEditando((prev) => ({
                      ...prev,
                      nombre: e.target.value,
                    }))
                  }
                  className="bg-panel-oscuro border border-panel-medio rounded-xl px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-crema/40 focus:border-crema text-blanco-suave"
                  placeholder="Ej. Juan Camaney"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[11px] text-texto-secundario">
                  Teléfono
                </label>
                <input
  type="tel"
  inputMode="numeric"
  pattern="[0-9]*"
  value={clienteEditando.telefono}
  onChange={(e) =>
    setClienteEditando((prev) => ({
      ...prev,
      telefono: e.target.value.replace(/\D/g, ""), // quita todo lo que no sea número
    }))
  }
  className="bg-panel-oscuro border border-panel-medio rounded-xl px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-crema/40 focus:border-crema text-blanco-suave"
  placeholder="+52 755 123 4567"
/>

              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[11px] text-texto-secundario">
                  Correo electrónico
                </label>
                <input
                  type="email"
                  value={clienteEditando.correo}
                  onChange={(e) =>
                    setClienteEditando((prev) => ({
                      ...prev,
                      correo: e.target.value,
                    }))
                  }
                  className="bg-panel-oscuro border border-panel-medio rounded-xl px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-crema/40 focus:border-crema text-blanco-suave"
                  placeholder="correo@ejemplo.com"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[11px] text-texto-secundario">
                  Contraseña (opcional)
                </label>
                <input
                  type="password"
                  value={clienteEditando.password}
                  onChange={(e) =>
                    setClienteEditando((prev) => ({
                      ...prev,
                      password: e.target.value,
                    }))
                  }
                  className="bg-panel-oscuro border border-panel-medio rounded-xl px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-crema/40 focus:border-crema text-blanco-suave"
                  placeholder="Dejar en blanco para no cambiar"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 text-xs">
              <button
                type="button"
                className="px-3 py-1 rounded-full border border-panel-medio text-texto-secundario hover:bg-panel-medio/60"
                onClick={() => setClienteEditando(null)}
                disabled={guardandoEdicion}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="px-3 py-1 rounded-full bg-crema text-negro-suave font-semibold hover:bg-blanco-suave disabled:opacity-60"
                onClick={handleGuardarEdicion}
                disabled={guardandoEdicion}
              >
                {guardandoEdicion ? "Guardando..." : "Guardar cambios"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
