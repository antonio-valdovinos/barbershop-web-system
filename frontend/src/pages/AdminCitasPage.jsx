// src/pages/AdminCitasPage.jsx
import React, { useMemo, useState, useEffect } from "react";

// --- Config rápida de servicios para el combo ---
const OPCIONES_SERVICIOS = [
  "Corte de Pelo",
  "Afeitado Clásico",
  "Barba y Afeitado",
  "Corte Fade",
];

// Helper para formatear fecha tipo "Lunes, 11 de Diciembre de 2025"
function formatearFechaLarga(fechaStr) {
  if (!fechaStr) return "";

  const partes = String(fechaStr).split("-");
  if (partes.length !== 3) return fechaStr;

  const anio = parseInt(partes[0], 10);
  const mes = parseInt(partes[1], 10) - 1;
  const dia = parseInt(partes[2], 10);
  const fecha = new Date(anio, mes, dia);

  if (isNaN(fecha.getTime())) return fechaStr;

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
  const nombreMes = meses[fecha.getMonth()];

  return `${diaSemana}, ${dia} de ${nombreMes} de ${anio}`;
}

// Helpers para filtros de rango de tiempo
function esMismaFecha(a, b) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function estaEnSemanaDesdeHoy(fecha) {
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);

  const limite = new Date(hoy);
  limite.setDate(limite.getDate() + 7);

  return fecha >= hoy && fecha <= limite;
}

function estaEnMismoMes(fecha) {
  const hoy = new Date();
  return (
    fecha.getFullYear() === hoy.getFullYear() &&
    fecha.getMonth() === hoy.getMonth()
  );
}

export default function AdminCitasPage({
  onIrDashboard,
  onIrCitas,
  onIrClientes,
  onIrServicios,
  onIrHorarios,
  onIrConfiguracion,
  onCerrarSesion,
  onIrAgendarCita,
}) {
  // --- Estado global de citas (lo que llega desde MongoDB) ---
  const [citas, setCitas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  // --- Filtros de UI ---
  const [rango, setRango] = useState("todas");
  const [estado, setEstado] = useState("todas"); // todas | Confirmada | Pendiente | Cancelada | Finalizada
  const [busqueda, setBusqueda] = useState("");

  // --- Modal de acciones ---
  const [modalAccion, setModalAccion] = useState(null); // 'modificar' | 'finalizar' | 'cancelar' | 'eliminar'
  const [citaSeleccionada, setCitaSeleccionada] = useState(null);
  const [formServicio, setFormServicio] = useState("");
  const [formFecha, setFormFecha] = useState("");
  const [formHora, setFormHora] = useState("");

  const safe = (fn) => (typeof fn === "function" ? fn : () => {});

  // Cargar citas desde el backend cuando entra el admin
  useEffect(() => {
    const cargarCitasAdmin = async () => {
      try {
        const respuesta = await fetch("http://localhost:4000/api/citas/admin");

        if (!respuesta.ok) {
          throw new Error("No se pudieron cargar las citas desde el servidor.");
        }

        const data = await respuesta.json();
        setCitas(data || []);
        setError("");
      } catch (err) {
        console.error("Error cargando citas admin:", err);
        setError("No se pudieron cargar las citas desde el servidor.");
        setCitas([]);
      } finally {
        setCargando(false);
      }
    };

    cargarCitasAdmin();
  }, []);

  // Helpers para actualizar estado local de citas crudas
  const actualizarCitaRaw = (citaId, cambios) => {
    setCitas((prev) =>
      prev.map((c) => (c.citaId === citaId ? { ...c, ...cambios } : c))
    );
  };

  const eliminarCitaRaw = (citaId) => {
    setCitas((prev) => prev.filter((c) => c.citaId !== citaId));
  };

  // Normalización + filtros
  const citasFiltradas = useMemo(() => {
    let resultado = citas.map((cita, idx) => {
      const cliente = cita.nombreCliente || cita.cliente || "Cliente sin nombre";
      const servicio = cita.servicio || "Servicio";
      const hora = cita.hora || "Hora no definida";
      const barbero = cita.barbero || "Sin asignar";

      const estadoOriginal = cita.estado || "Pendiente";
      let estadoUI = estadoOriginal;
      if (estadoOriginal === "activa") estadoUI = "Pendiente";
      if (estadoOriginal === "cancelada") estadoUI = "Cancelada";
      if (estadoOriginal === "finalizada") estadoUI = "Finalizada";

      const fechaStr = cita.fecha || cita.fechaCorta || "";
      const fechaLarga =
        cita.fechaLarga || (fechaStr ? formatearFechaLarga(fechaStr) : "");

      let fechaDate = null;
      if (fechaStr) {
        const partes = String(fechaStr).split("-");
        if (partes.length === 3) {
          const anio = parseInt(partes[0], 10);
          const mes = parseInt(partes[1], 10) - 1;
          const dia = parseInt(partes[2], 10);
          const tmp = new Date(anio, mes, dia);
          if (!isNaN(tmp.getTime())) {
            fechaDate = tmp;
          }
        }
      }

      return {
        id: cita.citaId || cita._id || idx,
        citaIdReal: cita.citaId || null,
        cliente,
        servicio,
        fechaLarga,
        fechaStr,
        fechaDate,
        hora,
        barbero,
        estado: estadoUI,
      };
    });

    if (estado !== "todas") {
      resultado = resultado.filter((cita) => cita.estado === estado);
    }

    if (rango !== "todas") {
      resultado = resultado.filter((cita) => {
        if (!cita.fechaDate) return false;

        if (rango === "hoy") {
          const hoy = new Date();
          hoy.setHours(0, 0, 0, 0);
          return esMismaFecha(cita.fechaDate, hoy);
        }

        if (rango === "semana") {
          return estaEnSemanaDesdeHoy(cita.fechaDate);
        }

        if (rango === "mes") {
          return estaEnMismoMes(cita.fechaDate);
        }

        return true;
      });
    }

    if (busqueda.trim() !== "") {
      const query = busqueda.toLowerCase();
      resultado = resultado.filter(
        (cita) =>
          cita.cliente.toLowerCase().includes(query) ||
          cita.servicio.toLowerCase().includes(query)
      );
    }

    return resultado;
  }, [citas, estado, rango, busqueda]);

  // --- Abrir / cerrar modal ---

  const abrirModalModificar = (cita) => {
    setCitaSeleccionada(cita);
    setFormServicio(cita.servicio || "");
    setFormFecha(cita.fechaStr || "");
    setFormHora(cita.hora || "");
    setModalAccion("modificar");
  };

  const abrirModalFinalizar = (cita) => {
    setCitaSeleccionada(cita);
    setModalAccion("finalizar");
  };

  const abrirModalCancelar = (cita) => {
    setCitaSeleccionada(cita);
    setModalAccion("cancelar");
  };

  const abrirModalEliminar = (cita) => {
    setCitaSeleccionada(cita);
    setModalAccion("eliminar");
  };

  const cerrarModal = () => {
    setModalAccion(null);
    setCitaSeleccionada(null);
    setFormServicio("");
    setFormFecha("");
    setFormHora("");
  };

  // --- Confirmar acción desde el modal ---
  const confirmarAccionModal = async () => {
    if (!citaSeleccionada || !citaSeleccionada.citaIdReal) {
      alert("No se encontró el identificador de la cita.");
      return;
    }

    const citaId = citaSeleccionada.citaIdReal;

    try {
      if (modalAccion === "modificar") {
        const cuerpo = {};

        if (formServicio.trim() !== "") {
          cuerpo.servicioNombre = formServicio.trim();
        }

        if (formFecha.trim() !== "") cuerpo.fecha = formFecha.trim();

        if (formHora.trim() !== "") {
          const horaLimpia = formHora.trim();
          const regexHora24 = /^([01]\d|2[0-3]):[0-5]\d$/;
          if (!regexHora24.test(horaLimpia)) {
            alert(
              "Por favor ingresa la hora en formato 24 horas HH:MM, por ejemplo 14:30."
            );
            return;
          }
          cuerpo.hora = horaLimpia;
        }

        if (Object.keys(cuerpo).length === 0) {
          alert("No hay cambios para guardar.");
          return;
        }

        const resp = await fetch(
          `http://localhost:4000/api/citas/${encodeURIComponent(citaId)}`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(cuerpo),
          }
        );

        if (!resp.ok) {
          throw new Error("Error al actualizar la cita");
        }

        const cambiosRaw = {};
        if (cuerpo.servicioNombre) cambiosRaw.servicio = cuerpo.servicioNombre;
        if (cuerpo.fecha) cambiosRaw.fecha = cuerpo.fecha;
        if (cuerpo.hora) cambiosRaw.hora = cuerpo.hora;

        actualizarCitaRaw(citaId, cambiosRaw);
        alert("Cita actualizada correctamente.");
      }

      if (modalAccion === "finalizar") {
        const resp = await fetch(
          `http://localhost:4000/api/citas/${encodeURIComponent(
            citaId
          )}/finalizar`,
          {
            method: "PUT",
          }
        );

        if (!resp.ok) {
          throw new Error("Error al finalizar la cita");
        }

        // Actualizamos el estado local para que el admin lo vea al momento
        actualizarCitaRaw(citaId, { estado: "finalizada" });
        alert("Cita marcada como finalizada.");
      }


      if (modalAccion === "cancelar") {
        const resp = await fetch(
          `http://localhost:4000/api/citas/${encodeURIComponent(
            citaId
          )}/cancelar`,
          { method: "PUT" }
        );

        if (!resp.ok) {
          throw new Error("Error al cancelar la cita");
        }

        actualizarCitaRaw(citaId, { estado: "cancelada" });
        alert("Cita cancelada correctamente.");
      }

      if (modalAccion === "eliminar") {
        const resp = await fetch(
          `http://localhost:4000/api/citas/${encodeURIComponent(citaId)}`,
          { method: "DELETE" }
        );

        if (!resp.ok) {
          throw new Error("Error al eliminar la cita");
        }

        eliminarCitaRaw(citaId);
        alert("Cita eliminada correctamente.");
      }

      cerrarModal();
    } catch (error) {
      console.error(error);
      alert("Ocurrió un error al procesar la acción.");
    }
  };

  // --- Render ---
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
            className="w-full text-left px-3 py-2 rounded-lg bg-panel-medio text-blanco-suave"
          >
            Citas
          </button>
          <button
            type="button"
            onClick={safe(onIrClientes)}
            className="w-full text-left px-3 py-2 rounded-lg text-texto-secundario hover:bg-panel-medio/70 hover:text-blanco-suave"
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
            <h2 className="text-xl font-semibold mt-1">Citas</h2>
          </div>
          <button
            type="button"
            onClick={safe(onIrAgendarCita)}
            className="px-5 py-2.5 rounded-full bg-crema text-negro-suave text-xs font-semibold hover:bg-blanco-suave transition shadow-sm"
          >
            Agregar Cita Manual
          </button>
        </header>

        {/* CONTENIDO */}
        <div className="max-w-6xl mx-auto px-6 py-6 space-y-6">
          {cargando && (
            <p className="text-xs text-texto-secundario">
              Cargando citas desde el servidor...
            </p>
          )}
          {!cargando && error && (
            <p className="text-xs text-estado-cancelada">{error}</p>
          )}

          {/* Filtros superiores */}
          <section className="bg-panel-oscuro rounded-2xl border border-panel-medio px-5 py-4 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div className="space-y-2">
              <h3 className="text-sm font-semibold">Filtros de citas</h3>
              <p className="text-xs text-texto-secundario">
                Encuentra rápidamente las citas por rango de tiempo, estado o
                nombre del cliente.
              </p>
            </div>

            <div className="flex flex-col gap-3 md:flex-row md:items-end">
              {/* Combo rango de tiempo */}
              <div className="flex flex-col gap-1">
                <label className="text-[11px] text-texto-secundario">
                  Rango de tiempo
                </label>
                <select
                  value={rango}
                  onChange={(e) => setRango(e.target.value)}
                  className="bg-panel-oscuro border border-panel-medio rounded-xl px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-crema/40 focus:border-crema text-blanco-suave"
                >
                  <option value="hoy">Hoy</option>
                  <option value="semana">Esta semana</option>
                  <option value="mes">Este mes</option>
                  <option value="todas">Todas</option>
                </select>
              </div>

              {/* Combo estado */}
              <div className="flex flex-col gap-1">
                <label className="text-[11px] text-texto-secundario">
                  Estado de la cita
                </label>
                <select
                  value={estado}
                  onChange={(e) => setEstado(e.target.value)}
                  className="bg-panel-oscuro border border-panel-medio rounded-xl px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-crema/40 focus:border-crema text-blanco-suave"
                >
                  <option value="todas">Todas</option>
                  <option value="Finalizada">Finalizada</option>
                  <option value="Pendiente">Pendiente</option>
                  <option value="Cancelada">Cancelada</option>
                </select>
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
                placeholder="Buscar por cliente o servicio..."
                className="w-full bg-panel-oscuro border border-panel-medio rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-crema/40 focus:border-crema placeholder:text-texto-secundario"
              />
            </div>
          </section>

          {/* Lista de citas */}
          <section className="space-y-3">
            <div className="flex items-center justify-between text-xs text-texto-secundario px-2">
              <span>{citasFiltradas.length} citas encontradas</span>
              <span>
                (Los botones ya actualizan la base de datos y la lista en
                pantalla)
              </span>
            </div>

            <div className="space-y-3">
              {citasFiltradas.map((cita) => (
                <article
                  key={cita.id}
                  className="bg-panel-oscuro rounded-2xl border border-panel-medio px-5 py-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between"
                >
                  {/* Info principal */}
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-panel-medio flex items-center justify-center text-sm font-semibold">
                      {cita.cliente
                        .split(" ")
                        .map((p) => p[0])
                        .join("")
                        .slice(0, 2)}
                    </div>
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-semibold">{cita.cliente}</p>
                        <span className="text-[11px] px-2 py-0.5 rounded-full bg-panel-medio text-texto-secundario">
                          {cita.servicio}
                        </span>
                      </div>
                      <p className="text-xs text-texto-secundario">
                        {cita.fechaLarga} · {cita.hora}
                      </p>
                      <p className="text-[11px] text-texto-secundario">
                        Atendido por:{" "}
                        <span className="font-medium">{cita.barbero}</span>
                      </p>
                    </div>
                  </div>

                  {/* Estado + acciones */}
                  <div className="flex flex-col items-start md:items-end gap-2">
                    <span
                      className={`inline-flex items-center px-3 py-1 rounded-full text-[11px] font-semibold ${
                        cita.estado === "Confirmada" ||
                        cita.estado === "Finalizada"
                          ? "bg-estado-confirmada text-blanco-suave"
                          : cita.estado === "Pendiente"
                          ? "bg-estado-pendiente text-blanco-suave"
                          : "bg-estado-cancelada text-blanco-suave"
                      }`}
                    >
                      {cita.estado}
                    </span>

                    <div className="flex flex-wrap gap-2 text-[11px]">
                      <button
                        type="button"
                        onClick={() => abrirModalModificar(cita)}
                        className="px-3 py-1 rounded-full border border-panel-medio text-texto-secundario hover:bg-panel-medio/80 transition"
                      >
                        Modificar
                      </button>
                      <button
                        type="button"
                        onClick={() => abrirModalFinalizar(cita)}
                        className="px-3 py-1 rounded-full border border-panel-claro text-texto-secundario hover:bg-panel-claro/40 transition"
                      >
                        Finalizar
                      </button>
                      <button
                        type="button"
                        onClick={() => abrirModalCancelar(cita)}
                        className="px-3 py-1 rounded-full border border-estado-cancelada/60 text-estado-cancelada hover:bg-estado-cancelada/10 transition"
                      >
                        Cancelar
                      </button>
                      <button
                        type="button"
                        onClick={() => abrirModalEliminar(cita)}
                        className="px-3 py-1 rounded-full border border-panel-medio text-texto-secundario hover:bg-panel-medio/80 transition"
                      >
                        Eliminar
                      </button>
                    </div>
                  </div>
                </article>
              ))}

              {citasFiltradas.length === 0 && !cargando && (
                <div className="bg-panel-oscuro rounded-2xl border border-panel-medio px-5 py-8 text-center text-sm text-texto-secundario">
                  No hay citas que coincidan con los filtros seleccionados.
                </div>
              )}
            </div>
          </section>
        </div>
      </main>

      {/* MODAL DE ACCIONES */}
      {modalAccion && citaSeleccionada && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-40">
          <div className="bg-panel-oscuro border border-panel-medio rounded-2xl p-6 w-full max-w-md shadow-xl">
            <h3 className="text-lg font-semibold mb-2">
              {modalAccion === "modificar" && "Modificar cita"}
              {modalAccion === "finalizar" && "Finalizar cita"}
              {modalAccion === "cancelar" && "Cancelar cita"}
              {modalAccion === "eliminar" && "Eliminar cita"}
            </h3>
            <p className="text-xs text-texto-secundario mb-4">
              {citaSeleccionada.cliente} · {citaSeleccionada.servicio} ·{" "}
              {citaSeleccionada.fechaLarga} · {citaSeleccionada.hora}
            </p>

            {modalAccion === "modificar" && (
              <div className="space-y-4 mb-4">
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] text-texto-secundario">
                    Servicio
                  </label>
                  <select
                    value={formServicio}
                    onChange={(e) => setFormServicio(e.target.value)}
                    className="bg-panel-oscuro border border-panel-medio rounded-xl px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-crema/40 focus:border-crema text-blanco-suave"
                  >
                    <option value="">(Sin cambios)</option>
                    {OPCIONES_SERVICIOS.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[11px] text-texto-secundario">
                    Fecha (YYYY-MM-DD)
                  </label>
                  <input
                    type="date"
                    value={formFecha}
                    onChange={(e) => setFormFecha(e.target.value)}
                    className="bg-panel-oscuro border border-panel-medio rounded-xl px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-crema/40 focus:border-crema text-blanco-suave"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[11px] text-texto-secundario">
                    Hora (formato 24h HH:MM)
                  </label>
                  <input
                    type="text"
                    value={formHora}
                    onChange={(e) => setFormHora(e.target.value)}
                    placeholder="Ej: 14:30"
                    className="bg-panel-oscuro border border-panel-medio rounded-xl px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-crema/40 focus:border-crema text-blanco-suave"
                  />
                </div>
              </div>
            )}

            {(modalAccion === "cancelar" ||
              modalAccion === "eliminar" ||
              modalAccion === "finalizar") && (
              <p className="text-sm text-texto-secundario mb-4">
                {modalAccion === "cancelar"
                  ? "Esta acción marcará la cita como cancelada y liberará el horario."
                  : modalAccion === "eliminar"
                  ? "Esta acción eliminará la cita de forma permanente y liberará el horario."
                  : "Esta acción marcará la cita como finalizada."}
              </p>
            )}

            <div className="flex justify-end gap-2 text-[11px]">
              <button
                type="button"
                onClick={cerrarModal}
                className="px-3 py-1.5 rounded-full border border-panel-medio text-texto-secundario hover:bg-panel-medio/60"
              >
                Cerrar
              </button>
              <button
                type="button"
                onClick={confirmarAccionModal}
                className={`px-4 py-1.5 rounded-full font-semibold ${
                  modalAccion === "eliminar" ||
                  modalAccion === "cancelar" ||
                  modalAccion === "finalizar"
                    ? "bg-estado-cancelada text-blanco-suave hover:bg-estado-cancelada/80"
                    : "bg-crema text-negro-suave hover:bg-blanco-suave"
                }`}
              >
                {modalAccion === "modificar" && "Guardar cambios"}
                {modalAccion === "finalizar" && "Marcar como finalizada"}
                {modalAccion === "cancelar" && "Cancelar cita"}
                {modalAccion === "eliminar" && "Eliminar cita"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
