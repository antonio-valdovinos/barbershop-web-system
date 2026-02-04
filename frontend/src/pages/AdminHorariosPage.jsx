// src/pages/AdminHorariosPage.jsx
import React, { useMemo, useState, useEffect } from "react";

const nombresMes = [
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

const nombresDiaCorto = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

// Genera estructura simple de calendario para un mes
function generarCalendario(fechaBase) {
  const year = fechaBase.getFullYear();
  const month = fechaBase.getMonth();

  const primerDiaMes = new Date(year, month, 1);
  const ultimoDiaMes = new Date(year, month + 1, 0);

  let diaSemana = primerDiaMes.getDay(); // 0=Dom,...,6=Sáb
  if (diaSemana === 0) diaSemana = 7; // lo movemos para que 1=Lunes

  const totalDias = ultimoDiaMes.getDate();
  const celdas = [];

  // huecos al inicio
  for (let i = 1; i < diaSemana; i += 1) celdas.push(null);
  // días reales
  for (let d = 1; d <= totalDias; d += 1) {
    celdas.push(new Date(year, month, d));
  }

  return celdas;
}

function esMismaFecha(a, b) {
  return (
    a &&
    b &&
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function claveFecha(fecha) {
  // YYYY-MM-DD
  return fecha.toISOString().slice(0, 10);
}

function formatearFechaLargo(fecha) {
  const dias = [
    "domingo",
    "lunes",
    "martes",
    "miércoles",
    "jueves",
    "viernes",
    "sábado",
  ];
  const meses = nombresMes;

  return `${dias[fecha.getDay()]} ${fecha.getDate()} de ${
    meses[fecha.getMonth()]
  } de ${fecha.getFullYear()}`;
}

// Genera slots de horario cada 30 min entre inicio y fin (inclusive)
function generarSlotsHorario30m(inicio = "09:00", fin = "20:00") {
  const [iniH, iniM] = inicio.split(":").map(Number);
  const [finH, finM] = fin.split(":").map(Number);

  const slots = [];
  let h = iniH;
  let m = iniM;

  const finTotalMin = finH * 60 + finM;

  while (h * 60 + m <= finTotalMin) {
    const hh = String(h).padStart(2, "0");
    const mm = String(m).padStart(2, "0");
    slots.push(`${hh}:${mm}`);

    m += 30;
    if (m >= 60) {
      m -= 60;
      h += 1;
    }
  }

  return slots;
}

export default function AdminHorariosPage({
  onCerrarSesion,
  onIrDashboard,
  onIrCitas,
  onIrClientes,
  onIrServicios,
  onIrHorarios,
  onIrConfiguracion,
}) {
  const safe = (fn) => (typeof fn === "function" ? fn : () => {});

  const diasSemana = [
    "Lunes",
    "Martes",
    "Miércoles",
    "Jueves",
    "Viernes",
    "Sábado",
    "Domingo",
  ];

  // Horario “base” de la semana (ahorita no lo pintas, pero ya queda listo)
  const [horariosSemana, setHorariosSemana] = useState(() =>
    diasSemana.map((dia, idx) => ({
      dia,
      activo: idx < 5, // Lun–Vie activos
      inicio: "09:00",
      fin: "18:00",
    }))
  );

  // Mes actual para el calendario
  const [mesActual, setMesActual] = useState(() => {
    const hoy = new Date();
    return new Date(hoy.getFullYear(), hoy.getMonth(), 1);
  });

  // Días cerrados (NO disponibles) -> Set de "YYYY-MM-DD"
  const [diasNoDisponibles, setDiasNoDisponibles] = useState(() => new Set());

  // Excepciones por día: { "YYYY-MM-DD": { inicio: "HH:MM", fin: "HH:MM" } }
  const [excepcionesPorDia, setExcepcionesPorDia] = useState({});

  // Día seleccionado en el calendario
  const [fechaSeleccionadaCalendario, setFechaSeleccionadaCalendario] =
    useState(null);

  const [guardando, setGuardando] = useState(false);
  const [cargandoConfig, setCargandoConfig] = useState(true);
  const [errorConfig, setErrorConfig] = useState("");

  const celdasCalendario = useMemo(
    () => generarCalendario(mesActual),
    [mesActual]
  );

  const tituloMes = `${nombresMes[mesActual.getMonth()]} ${mesActual.getFullYear()}`;

  const cambiarMes = (delta) => {
    setMesActual(
      (prev) => new Date(prev.getFullYear(), prev.getMonth() + delta, 1)
    );
  };

  // Opciones de horario: cada 30 min de 09:00 a 20:00
  const opcionesHorario = useMemo(
    () => generarSlotsHorario30m("09:00", "20:00"),
    []
  );

  // Cargar configuración desde backend
  useEffect(() => {
    const cargarConfig = async () => {
      try {
        const resp = await fetch("http://localhost:4000/api/horarios/config");

        if (!resp.ok) {
          throw new Error("No se pudo cargar la configuración de horarios.");
        }

        const data = await resp.json();

        // Si viene un arreglo de horariosSemana con longitud correcta, lo usamos.
        if (
          Array.isArray(data.horariosSemana) &&
          data.horariosSemana.length === diasSemana.length
        ) {
          setHorariosSemana(data.horariosSemana);
        }

        // Días cerrados
        if (Array.isArray(data.diasNoDisponibles)) {
          setDiasNoDisponibles(new Set(data.diasNoDisponibles));
        }

        // Excepciones por día
        if (
          data.excepcionesPorDia &&
          typeof data.excepcionesPorDia === "object"
        ) {
          setExcepcionesPorDia(data.excepcionesPorDia);
        } else {
          setExcepcionesPorDia({});
        }

        setErrorConfig("");
      } catch (error) {
        console.error(error);
        setErrorConfig(
          "No se pudo cargar la configuración de horarios (usando valores por defecto)."
        );
      } finally {
        setCargandoConfig(false);
      }
    };

    cargarConfig();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Guardar en backend
  const manejarGuardar = async () => {
    try {
      setGuardando(true);

      const payload = {
        horariosSemana,
        diasNoDisponibles: Array.from(diasNoDisponibles),
        excepcionesPorDia,
      };

      const resp = await fetch("http://localhost:4000/api/horarios/config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!resp.ok) throw new Error("Respuesta NO OK");

      alert("Horarios guardados correctamente.");
    } catch (error) {
      console.error(error);
      alert("Error al guardar horarios.");
    } finally {
      setGuardando(false);
    }
  };

  const claveSeleccionada =
    fechaSeleccionadaCalendario &&
    claveFecha(fechaSeleccionadaCalendario);

  const excepcionSeleccionada =
    (claveSeleccionada && excepcionesPorDia[claveSeleccionada]) || null;

  const cerrarDiaSeleccionado =
    claveSeleccionada && diasNoDisponibles.has(claveSeleccionada);

  const manejarCambioCerrarDia = (checked) => {
    if (!claveSeleccionada) return;

    setDiasNoDisponibles((prev) => {
      const nuevo = new Set(prev);
      if (checked) {
        nuevo.add(claveSeleccionada);
      } else {
        nuevo.delete(claveSeleccionada);
      }
      return nuevo;
    });

    // Si se cierra el día completo, borramos la excepción de horario
    if (checked) {
      setExcepcionesPorDia((prev) => {
        const { [claveSeleccionada]: _omit, ...resto } = prev;
        return resto;
      });
    }
  };

  const manejarCambioExcepcion = (campo, valor) => {
    if (!claveSeleccionada) return;

    setExcepcionesPorDia((prev) => {
      const actual = prev[claveSeleccionada] || {};
      const nuevo = { ...actual, [campo]: valor };

      // Si no hay inicio ni fin, quitamos la excepción
      if (!nuevo.inicio && !nuevo.fin) {
        const { [claveSeleccionada]: _omit, ...resto } = prev;
        return resto;
      }

      return {
        ...prev,
        [claveSeleccionada]: nuevo,
      };
    });
  };

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
            className="w-full text-left px-3 py-2 rounded-lg text-texto-secundario hover:bg-panel-medio/70"
          >
            Dashboard
          </button>
          <button
            type="button"
            onClick={safe(onIrCitas)}
            className="w-full text-left px-3 py-2 rounded-lg text-texto-secundario hover:bg-panel-medio/70"
          >
            Citas
          </button>
          <button
            type="button"
            onClick={safe(onIrClientes)}
            className="w-full text-left px-3 py-2 rounded-lg text-texto-secundario hover:bg-panel-medio/70"
          >
            Clientes
          </button>
          <button
            type="button"
            onClick={safe(onIrServicios)}
            className="w-full text-left px-3 py-2 rounded-lg text-texto-secundario hover:bg-panel-medio/70"
          >
            Servicios
          </button>
          <button
            type="button"
            onClick={safe(onIrHorarios)}
            className="w-full text-left px-3 py-2 rounded-lg bg-panel-medio text-blanco-suave"
          >
            Horarios
          </button>
          <button
            type="button"
            onClick={safe(onIrConfiguracion)}
            className="w-full text-left px-3 py-2 rounded-lg text-texto-secundario hover:bg-panel-medio/70"
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
            className="px-3 py-1 rounded-full bg-panel-medio text-texto-secundario hover:bg-panel-claro text-[11px]"
          >
            Cerrar Sesión
          </button>
        </div>
      </aside>

      {/* CONTENIDO */}
      <main className="flex-1 flex flex-col">
        {/* HEADER */}
        <header className="border-b border-panel-medio px-8 py-4 flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-xs uppercase tracking-[0.15em] text-texto-secundario">
              Panel de Administración
            </span>
            <h2 className="text-xl font-semibold mt-1">Horarios</h2>
          </div>
          <button
            type="button"
            onClick={manejarGuardar}
            disabled={guardando}
            className="px-5 py-2.5 rounded-full bg-crema text-negro-suave text-xs font-semibold hover:bg-blanco-suave transition shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {guardando ? "Guardando..." : "Guardar cambios"}
          </button>
        </header>

        <div className="max-w-7xl mx-auto px-6 py-6 space-y-6">
          {cargandoConfig && (
            <p className="text-xs text-texto-secundario">
              Cargando configuración de horarios.
            </p>
          )}
          {!cargandoConfig && errorConfig && (
            <p className="text-xs text-estado-cancelada">{errorConfig}</p>
          )}

          {/* EXPLICACIÓN */}
          <section className="bg-panel-oscuro rounded-2xl border border-panel-medio px-5 py-4">
            <h3 className="text-sm font-semibold mb-2">
              Configura tus horarios
            </h3>
            <p className="text-xs text-texto-secundario">
              Define en qué días y horarios estás disponible para atender
              clientes. Estos horarios y las excepciones se usarán para bloquear
              automáticamente la agenda.
            </p>
          </section>

          {/* CALENDARIO GRANDE */}
          <section className="flex justify-center">
            <div className="bg-panel-oscuro rounded-2xl border border-panel-medio px-10 py-6 w-full max-w-6xl mx-auto">
              <h4 className="text-sm font-semibold mb-3">
                Días no disponibles
              </h4>

              <p className="text-xs text-texto-secundario mb-4">
                Selecciona un día en el calendario y marca si estará{" "}
                <span className="font-semibold">cerrado todo el día</span> o
                define un horario especial solo para esa fecha. Los horarios
                especiales se eligen en bloques de 30 minutos entre{" "}
                <span className="font-semibold">09:00</span> y{" "}
                <span className="font-semibold">20:00</span>.
              </p>

              {/* Encabezado del calendario */}
              <div className="flex items-center justify-between mb-3">
                <button
                  type="button"
                  onClick={() => cambiarMes(-1)}
                  className="px-3 py-1 text-[11px] border border-panel-medio rounded-md hover:bg-panel-medio/70 transition"
                >
                  Anterior
                </button>

                <span className="text-base font-semibold">{tituloMes}</span>

                <button
                  type="button"
                  onClick={() => cambiarMes(1)}
                  className="px-3 py-1 text-[11px] border border-panel-medio rounded-md hover:bg-panel-medio/70 transition"
                >
                  Siguiente
                </button>
              </div>

              {/* Días de la semana */}
              <div className="grid grid-cols-7 gap-2 text-[12px] text-texto-secundario mb-2">
                {nombresDiaCorto.map((d) => (
                  <div
                    key={d}
                    className="h-6 flex items-center justify-center"
                  >
                    {d}
                  </div>
                ))}
              </div>

              {/* Celdas del calendario */}
              <div className="grid grid-cols-7 gap-2 text-xs">
                {celdasCalendario.map((fecha, idx) => {
                  if (!fecha) return <div key={idx} className="h-12" />;

                  const clave = claveFecha(fecha);
                  const cerrado = diasNoDisponibles.has(clave);
                  const seleccionado = esMismaFecha(
                    fecha,
                    fechaSeleccionadaCalendario
                  );

                  const base =
                    "h-12 rounded-md flex items-center justify-center border text-[12px] transition";

                  const color = cerrado
                    ? "bg-estado-cancelada text-white border-estado-cancelada"
                    : "bg-panel-medio/40 border-panel-medio hover:bg-panel-medio/80";

                  const extra = seleccionado ? " ring-2 ring-crema" : "";

                  return (
                    <button
                      key={clave}
                      type="button"
                      onClick={() => setFechaSeleccionadaCalendario(fecha)}
                      className={`${base} ${color} ${extra}`}
                    >
                      {fecha.getDate()}
                    </button>
                  );
                })}
              </div>

              <p className="mt-3 text-[11px] text-texto-secundario">
                Los días en rojo se consideran cerrados para citas.
              </p>

              {/* PANEL DE EXCEPCIÓN */}
              {fechaSeleccionadaCalendario && (
                <div className="mt-4 border-t border-panel-medio pt-3 text-xs">
                  <p className="font-semibold mb-1">
                    Excepción para{" "}
                    {formatearFechaLargo(fechaSeleccionadaCalendario)}
                  </p>

                  <label className="flex items-center gap-2 mb-2">
                    <input
                      type="checkbox"
                      className="accent-crema"
                      checked={!!cerrarDiaSeleccionado}
                      onChange={(e) =>
                        manejarCambioCerrarDia(e.target.checked)
                      }
                    />
                    <span>Cerrar todo el día (no se permiten citas).</span>
                  </label>

                  <p className="text-[11px] text-texto-secundario mb-2">
                    Si no se cierra el día completo, puedes definir un horario
                    especial solo para esta fecha (bloques de 30 minutos).
                  </p>

                  <div className="flex flex-wrap items-center gap-3">
                    <span>De</span>
                    <select
                      value={excepcionSeleccionada?.inicio || ""}
                      onChange={(e) =>
                        manejarCambioExcepcion("inicio", e.target.value)
                      }
                      disabled={cerrarDiaSeleccionado}
                      className="bg-panel-oscuro border border-panel-medio rounded-lg px-2 py-1 text-[11px] outline-none focus:border-crema"
                    >
                      <option value="">--:-- -----</option>
                      {opcionesHorario.map((h) => (
                        <option key={h} value={h}>
                          {h}
                        </option>
                      ))}
                    </select>

                    <span>a</span>

                    <select
                      value={excepcionSeleccionada?.fin || ""}
                      onChange={(e) =>
                        manejarCambioExcepcion("fin", e.target.value)
                      }
                      disabled={cerrarDiaSeleccionado}
                      className="bg-panel-oscuro border border-panel-medio rounded-lg px-2 py-1 text-[11px] outline-none focus:border-crema"
                    >
                      <option value="">--:-- -----</option>
                      {opcionesHorario.map((h) => (
                        <option key={h} value={h}>
                          {h}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
