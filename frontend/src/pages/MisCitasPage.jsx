
import React, { useState, useMemo, useEffect } from "react";

export default function MisCitasPage({ onIrInicio, onAgendarClick }) {
  const [tabActiva, setTabActiva] = useState("proximas"); // proximas | historial
  const [citas, setCitas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  // Cargar citas del usuario logueado
  useEffect(() => {
    const correo = localStorage.getItem("correoUsuario");

    if (!correo) {
      setError("No se encontró un usuario logueado. Inicia sesión para ver tus citas.");
      setCargando(false);
      return;
    }

    const cargarCitas = async () => {
      try {
        const respuesta = await fetch(
          `http://localhost:4000/api/citas/mis-citas?correo=${encodeURIComponent(
            correo
          )}`
        );

        if (!respuesta.ok) {
          throw new Error("No se pudieron cargar tus citas.");
        }

        const data = await respuesta.json();
        setCitas(data || []);
      } catch (err) {
        console.error("Error cargando citas:", err);
        setError("Ocurrió un error al cargar tus citas.");
      } finally {
        setCargando(false);
      }
    };

    cargarCitas();
  }, []);

// Convierte fecha (YYYY-MM-DD) y hora ("10:30 AM") a un objeto Date
const obtenerDateCita = (fechaStr, horaStr) => {
  if (!fechaStr) return null;

  const [anioStr, mesStr, diaStr] = String(fechaStr).split("-");
  const anio = parseInt(anioStr, 10);
  const mes = parseInt(mesStr, 10) - 1;
  const dia = parseInt(diaStr, 10);

  if (Number.isNaN(anio) || Number.isNaN(mes) || Number.isNaN(dia)) {
    return null;
  }

  const fecha = new Date(anio, mes, dia);

  if (horaStr) {
    const partesHora = horaStr.trim().split(" ");
    const hhmm = partesHora[0] || "";
    const sufijo = (partesHora[1] || "").toUpperCase(); // AM / PM

    const [hhStr, mmStr] = hhmm.split(":");
    let horas = parseInt(hhStr, 10);
    const minutos = parseInt(mmStr, 10) || 0;

    if (!Number.isNaN(horas)) {
      if (sufijo === "PM" && horas < 12) horas += 12;
      if (sufijo === "AM" && horas === 12) horas = 0;
      fecha.setHours(horas, minutos, 0, 0);
    }
  }

  return fecha;
};
// Separar citas en Próximas e Historial
const { citasProximas, citasHistorial } = useMemo(() => {
  const ahora = new Date();
  const proximas = [];
  const historial = [];

  (citas || []).forEach((cita) => {
    const estado = String(cita.estado || "").toLowerCase();
    const esCancelada = estado === "cancelada";
    const esCompletada =
      estado === "completada" || estado === "finalizada";

    const fechaHora = obtenerDateCita(cita.fecha, cita.hora);

    // Si la fecha es inválida, envíala al historial
    if (!fechaHora) {
      historial.push(cita);
      return;
    }

    if (
      fechaHora.getTime() >= ahora.getTime() &&
      !esCancelada &&
      !esCompletada
    ) {
      proximas.push({ ...cita, _fechaHoraOrden: fechaHora });
    } else {
      historial.push({ ...cita, _fechaHoraOrden: fechaHora });
    }
  });

  // Ordenar próximas (más cercana primero)
  proximas.sort(
    (a, b) =>
      (a._fechaHoraOrden?.getTime() || 0) -
      (b._fechaHoraOrden?.getTime() || 0)
  );

  // Ordenar historial (más reciente primero)
  historial.sort(
    (a, b) =>
      (b._fechaHoraOrden?.getTime() || 0) -
      (a._fechaHoraOrden?.getTime() || 0)
  );

  // Limpiar campo auxiliar
  const limpiar = (lista) =>
    lista.map(({ _fechaHoraOrden, ...resto }) => resto);

  return {
    citasProximas: limpiar(proximas),
    citasHistorial: limpiar(historial),
  };
}, [citas]);

    const obtenerEtiquetaEstado = (estado) => {
    const e = String(estado || "").toLowerCase();

    if (e === "completada" || e === "finalizada") return "Finalizada";
    if (e === "cancelada") return "Cancelada";
    return "Pendiente";
  };


    const obtenerClaseEstado = (estado) => {
    const e = String(estado || "").toLowerCase();

    if (e === "completada" || e === "finalizada") {
      return "bg-estado-confirmada";
    }
    if (e === "cancelada") {
      return "bg-estado-cancelada";
    }
    return "bg-estado-pendiente";
  };


  const formatearFechaTexto = (fechaStr) => {
    if (!fechaStr) return "";

    const partes = String(fechaStr).split("-");
    if (partes.length !== 3) return fechaStr;

    const anio = parseInt(partes[0], 10);
    const mes = parseInt(partes[1], 10) - 1;
    const dia = parseInt(partes[2], 10);
    const fecha = new Date(anio, mes, dia);

    if (isNaN(fecha.getTime())) return fechaStr;

    const dias = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
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
  };

  if (cargando) {
    return (
      <div className="bg-fondo min-h-screen text-blanco-suave">
        <header className="border-b border-panel-medio/70 bg-fondo sticky top-0 z-20">
          <div className="max-w-6xl xl:max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
            <div className="flex items-center gap-8">
              <button
                type="button"
                onClick={onIrInicio}
                className="font-semibold text-sm tracking-wide hover:text-blanco-suave"
              >
                Barbería
              </button>
            </div>
          </div>
        </header>

        <main className="max-w-6xl xl:max-w-7xl mx-auto px-4 py-8">
          <p className="text-sm text-texto-secundario">Cargando tus citas...</p>
        </main>
      </div>
    );
  }

  return (
    <div className="bg-fondo min-h-screen text-blanco-suave">
      {/* HEADER */}
      <header className="border-b border-panel-medio/70 bg-fondo sticky top-0 z-20">
        <div className="max-w-6xl xl:max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <button
              type="button"
              onClick={onIrInicio}
              className="font-semibold text-sm tracking-wide hover:text-blanco-suave"
            >
              Barbería
            </button>

            <nav className="flex items-center gap-6 text-xs text-texto-secundario">
              <button
                type="button"
                onClick={onIrInicio}
                className="hover:text-blanco-suave"
              >
                Inicio
              </button>
              <button
                type="button"
                onClick={() => onAgendarClick("user")}
                className="hover:text-blanco-suave"
              >
                Agendar Cita
              </button>

              <span className="text-blanco-suave font-semibold border-b border-crema pb-1">
                Mis Citas
              </span>
              <button
                type="button"
                className="hover:text-blanco-suave"
              >
                Mi Perfil
              </button>
            </nav>
          </div>

          <div className="w-8 h-8 rounded-full bg-panel-medio border border-panel-medio" />
        </div>
      </header>

      {/* CONTENIDO PRINCIPAL */}
      <main className="max-w-6xl xl:max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-4">Mis Citas</h1>

        {error && (
          <div className="mb-6 text-sm text-estado-cancelada">
            {error}
          </div>
        )}

        {/* TABS */}
        <div className="border-b border-panel-medio/70 mb-6 flex gap-6 text-sm">
          <button
            type="button"
            onClick={() => setTabActiva("proximas")}
            className={`pb-2 ${
              tabActiva === "proximas"
                ? "text-blanco-suave border-b-2 border-crema"
                : "text-texto-secundario hover:text-blanco-suave"
            }`}
          >
            Próximas
          </button>
          <button
            type="button"
            onClick={() => setTabActiva("historial")}
            className={`pb-2 ${
              tabActiva === "historial"
                ? "text-blanco-suave border-b-2 border-crema"
                : "text-texto-secundario hover:text-blanco-suave"
            }`}
          >
            Historial
          </button>
        </div>

        {/* LISTA DE CITAS */}
        {tabActiva === "proximas" && (
          <section className="space-y-4">
            {citasProximas.length === 0 && (
              <div className="bg-panel-oscuro rounded-2xl border border-panel-medio p-10 text-center text-sm text-texto-secundario">
                No tienes citas próximas.
                <div className="mt-4">
                  <button
                    type="button"
                    onClick={() => onAgendarClick("user")}
                    className="px-4 py-2 rounded-full bg-crema text-negro-suave text-xs font-semibold hover:bg-blanco-suave"
                  >
                    Agendar una nueva cita
                  </button>
                </div>
              </div>
            )}

            {citasProximas.map((cita, index) => (
              <article
                key={cita.citaId || index}
                className="bg-panel-oscuro rounded-2xl border border-panel-medio flex overflow-hidden"
              >
                {/* Imagen / espacio ilustrativo */}
                <div className="w-36 bg-panel-medio/70" />

                <div className="flex-1 px-6 py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div>
                    <h2 className="font-semibold text-sm mb-1">
                      {cita.servicio}
                    </h2>
                    <p className="text-xs text-texto-secundario">
                      {formatearFechaTexto(cita.fecha)} - {cita.hora}
                    </p>
                    {cita.nombreCliente && (
                      <p className="text-xs text-texto-secundario mt-1">
                        A nombre de: {cita.nombreCliente}
                      </p>
                    )}
                  </div>

                  <div className="flex flex-col items-end gap-3">
                    <span
                      className={`inline-block text-[11px] px-3 py-1 rounded-full text-blanco-suave ${obtenerClaseEstado(
                        cita.estado
                      )}`}
                    >
                      {obtenerEtiquetaEstado(cita.estado)}
                    </span>

                    <div className="flex gap-2">
                      <button
                        type="button"
                        className="px-4 py-1.5 rounded-full border border-panel-medio text-xs hover:bg-panel-medio/70"
                      >
                        Modificar
                      </button>
                      <button
                        type="button"
                        className="px-4 py-1.5 rounded-full border border-estado-cancelada text-xs text-estado-cancelada hover:bg-estado-cancelada hover:text-blanco-suave"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </section>
        )}

        {tabActiva === "historial" && (
          <section className="space-y-4">
            {citasHistorial.length === 0 && (
              <div className="bg-panel-oscuro rounded-2xl border border-panel-medio p-10 text-center text-sm text-texto-secundario">
                Aún no tienes citas en tu historial.
              </div>
            )}

            {citasHistorial.map((cita, index) => (
              <article
                key={cita.citaId || index}
                className="bg-panel-oscuro rounded-2xl border border-panel-medio flex overflow-hidden"
              >
                <div className="w-36 bg-panel-medio/70" />

                <div className="flex-1 px-6 py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div>
                    <h2 className="font-semibold text-sm mb-1">
                      {cita.servicio}
                    </h2>
                    <p className="text-xs text-texto-secundario">
                      {formatearFechaTexto(cita.fecha)} - {cita.hora}
                    </p>
                    {cita.nombreCliente && (
                      <p className="text-xs text-texto-secundario mt-1">
                        A nombre de: {cita.nombreCliente}
                      </p>
                    )}
                  </div>

                  <div className="flex flex-col items-end gap-2">
                    <span
                      className={`inline-block text-[11px] px-3 py-1 rounded-full text-blanco-suave ${obtenerClaseEstado(
                        cita.estado
                      )}`}
                    >
                      {obtenerEtiquetaEstado(cita.estado)}
                    </span>
                    <p className="text-[11px] text-texto-secundario">
                      Esta cita ya forma parte de tu historial.
                    </p>
                  </div>
                </div>
              </article>
            ))}
          </section>
        )}
      </main>
    </div>
  );
}
