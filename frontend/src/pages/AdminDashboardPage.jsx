// src/pages/AdminDashboardPage.jsx
import React, { useEffect, useMemo, useState } from "react";

const API_URL = "http://localhost:4000/api";

function safeFn(fn) {
  return typeof fn === "function" ? fn : () => {};
}

function parseFechaYYYYMMDD(fechaStr) {
  if (!fechaStr) return null;
  const partes = String(fechaStr).split("-");
  if (partes.length !== 3) return null;

  const anio = parseInt(partes[0], 10);
  const mes = parseInt(partes[1], 10) - 1;
  const dia = parseInt(partes[2], 10);

  const fecha = new Date(anio, mes, dia);
  if (Number.isNaN(fecha.getTime())) return null;

  fecha.setHours(0, 0, 0, 0);
  return fecha;
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
  if (!fecha) return "";
  return fecha.toISOString().slice(0, 10);
}

// Calendario (Lun a Dom)
function generarCalendario(fechaBase) {
  const year = fechaBase.getFullYear();
  const month = fechaBase.getMonth();

  const primerDiaMes = new Date(year, month, 1);
  const ultimoDiaMes = new Date(year, month + 1, 0);

  let diaSemana = primerDiaMes.getDay(); // 0=Dom,...,6=Sáb
  if (diaSemana === 0) diaSemana = 7; // Lunes=1

  const totalDias = ultimoDiaMes.getDate();
  const celdas = [];

  for (let i = 1; i < diaSemana; i += 1) celdas.push(null);
  for (let d = 1; d <= totalDias; d += 1) celdas.push(new Date(year, month, d));

  return celdas;
}

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

const nombresDiaCorto = ["LU", "MA", "MI", "JU", "VI", "SA", "DO"];
const nombresDiaMini = ["DO", "LU", "MA", "MI", "JU", "VI", "SA"];

function normalizarEstado(estado) {
  const e = String(estado || "").trim().toLowerCase();
  if (e === "activa") return "Pendiente";
  if (e === "pendiente") return "Pendiente";
  if (e === "confirmada") return "Confirmada";
  if (e === "cancelada") return "Cancelada";
  if (e === "finalizada" || e === "completada") return "Finalizada";
  return estado ? String(estado) : "Pendiente";
}

function claseEstado(estadoUI) {
  if (estadoUI === "Confirmada") return "bg-estado-confirmada";
  if (estadoUI === "Cancelada") return "bg-estado-cancelada";
  if (estadoUI === "Finalizada") return "bg-estado-confirmada";
  return "bg-estado-pendiente";
}

function esHora24(hora) {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(String(hora || "").trim());
}

function inicioDelDia(fecha) {
  const d = new Date(fecha);
  d.setHours(0, 0, 0, 0);
  return d;
}

function finDelDia(fecha) {
  const d = new Date(fecha);
  d.setHours(23, 59, 59, 999);
  return d;
}

function obtenerTimestampCita(c) {
  if (!c?.fechaDate) return null;

  const base = new Date(c.fechaDate);
  if (esHora24(c.hora)) {
    const [hh, mm] = String(c.hora).split(":").map((x) => parseInt(x, 10));
    if (!Number.isNaN(hh) && !Number.isNaN(mm)) {
      base.setHours(hh, mm, 0, 0);
    }
  }
  return base.getTime();
}

export default function AdminDashboardPage({
  onCerrarSesion,
  onIrCitas,
  onIrClientes,
  onIrHorarios,
  onIrServicios,
  onIrConfiguracion,
}) {
  const safe = (fn) => safeFn(fn);

  const [citas, setCitas] = useState([]);
  const [diasNoDisponibles, setDiasNoDisponibles] = useState(() => new Set());

  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  const [mesCalendario, setMesCalendario] = useState(() => {
    const hoy = new Date();
    return new Date(hoy.getFullYear(), hoy.getMonth(), 1);
  });

  useEffect(() => {
    const cargarDashboard = async () => {
      setCargando(true);
      setError("");

      try {
        const [respCitas, respConfig] = await Promise.all([
          fetch(`${API_URL}/citas/admin`),
          fetch(`${API_URL}/horarios/config`),
        ]);

        if (!respCitas.ok) throw new Error("No se pudieron cargar las citas.");
        if (!respConfig.ok) throw new Error("No se pudo cargar la config de horarios.");

        const dataCitas = await respCitas.json().catch(() => []);
        const dataConfig = await respConfig.json().catch(() => ({}));

        setCitas(Array.isArray(dataCitas) ? dataCitas : []);

        const listaCerrados = Array.isArray(dataConfig?.diasNoDisponibles)
          ? dataConfig.diasNoDisponibles
          : [];

        setDiasNoDisponibles(new Set(listaCerrados));
      } catch (e) {
        console.error("Error dashboard:", e);
        setError(
          "No se pudo cargar el dashboard. Verifica que el backend esté encendido y que existan las rutas /citas/admin y /horarios/config."
        );
        setCitas([]);
        setDiasNoDisponibles(new Set());
      } finally {
        setCargando(false);
      }
    };

    cargarDashboard();
  }, []);

  const citasNormalizadas = useMemo(() => {
    const lista = Array.isArray(citas) ? citas : [];
    return lista.map((c, idx) => {
      const fechaStr = c?.fecha || c?.fechaCorta || "";
      const fechaDate = parseFechaYYYYMMDD(fechaStr);

      const cliente =
        c?.nombreCliente ||
        c?.cliente ||
        c?.nombre ||
        c?.nombreCompleto ||
        "Cliente";

      const servicio = c?.servicio || c?.servicioNombre || "Servicio";
      const hora = String(c?.hora || "").trim();
      const estadoUI = normalizarEstado(c?.estado);

      return {
        id: c?.citaId || c?._id || idx,
        fechaStr,
        fechaDate,
        cliente,
        servicio,
        hora,
        estado: estadoUI,
      };
    });
  }, [citas]);

  const proximasCitas = useMemo(() => {
    const ahora = new Date().getTime();
    const lista = [];

    citasNormalizadas.forEach((c) => {
      if (!c.fechaDate) return;
      if (c.estado === "Cancelada" || c.estado === "Finalizada") return;

      const ts = obtenerTimestampCita(c);
      if (ts === null) return;

      if (ts >= ahora) lista.push({ ...c, _orden: ts });
    });

    lista.sort((a, b) => (a._orden || 0) - (b._orden || 0));
    return lista.slice(0, 8).map(({ _orden, ...resto }) => resto);
  }, [citasNormalizadas]);

  const mapCitasPorDia = useMemo(() => {
    const mapa = new Map();
    citasNormalizadas.forEach((c) => {
      if (!c.fechaDate) return;
      const k = claveFecha(c.fechaDate);
      mapa.set(k, (mapa.get(k) || 0) + 1);
    });
    return mapa;
  }, [citasNormalizadas]);

  const resumenHoy = useMemo(() => {
    const hoy = new Date();
    const ini = inicioDelDia(hoy).getTime();
    const fin = finDelDia(hoy).getTime();

    let confirmadas = 0;
    let pendientes = 0;
    let canceladas = 0;
    let finalizadas = 0;
    let total = 0;
    let siguiente = null;

    const ahora = Date.now();

    citasNormalizadas.forEach((c) => {
      if (!c.fechaDate) return;
      const ts = obtenerTimestampCita(c);
      if (ts === null) return;

      if (ts >= ini && ts <= fin) {
        total += 1;
        if (c.estado === "Confirmada") confirmadas += 1;
        else if (c.estado === "Pendiente") pendientes += 1;
        else if (c.estado === "Cancelada") canceladas += 1;
        else if (c.estado === "Finalizada") finalizadas += 1;
      }

      if (ts >= ahora && c.estado !== "Cancelada" && c.estado !== "Finalizada") {
        if (!siguiente || ts < siguiente._ts) {
          siguiente = { ...c, _ts: ts };
        }
      }
    });

    const siguienteLimpia = siguiente ? { ...siguiente, _ts: undefined } : null;

    return {
      confirmadas,
      pendientes,
      canceladas,
      finalizadas,
      total,
      siguiente: siguienteLimpia,
    };
  }, [citasNormalizadas]);

  // 🔥 NUEVO: barras últimos 7 días (para “llenar” y que sea útil)
  const barrasUltimos7 = useMemo(() => {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    const dias = [];
    for (let i = 6; i >= 0; i -= 1) {
      const d = new Date(hoy);
      d.setDate(d.getDate() - i);
      dias.push(d);
    }

    const conteos = dias.map((d) => mapCitasPorDia.get(claveFecha(d)) || 0);
    const max = Math.max(1, ...conteos);

    return dias.map((d, idx) => {
      const c = conteos[idx];
      const alto = Math.round((c / max) * 100);
      return {
        fecha: d,
        clave: claveFecha(d),
        dia: d.getDate(),
        diaSem: nombresDiaMini[d.getDay()],
        conteo: c,
        alto,
      };
    });
  }, [mapCitasPorDia]);

  // 🔥 NUEVO: top servicios del mes + estados del mes
  const resumenMes = useMemo(() => {
    const base = new Date();
    const y = base.getFullYear();
    const m = base.getMonth();

    const conteoServicios = new Map();
    const estados = { Confirmada: 0, Pendiente: 0, Cancelada: 0, Finalizada: 0 };
    let totalMes = 0;

    citasNormalizadas.forEach((c) => {
      if (!c.fechaDate) return;
      if (c.fechaDate.getFullYear() !== y || c.fechaDate.getMonth() !== m) return;

      totalMes += 1;

      const srv = String(c.servicio || "Servicio").trim();
      conteoServicios.set(srv, (conteoServicios.get(srv) || 0) + 1);

      if (c.estado === "Confirmada") estados.Confirmada += 1;
      else if (c.estado === "Pendiente") estados.Pendiente += 1;
      else if (c.estado === "Cancelada") estados.Cancelada += 1;
      else if (c.estado === "Finalizada") estados.Finalizada += 1;
    });

    const topServicios = Array.from(conteoServicios.entries())
      .map(([servicio, conteo]) => ({ servicio, conteo }))
      .sort((a, b) => b.conteo - a.conteo)
      .slice(0, 5);

    const pct = (n) => {
      const val = totalMes > 0 ? Math.round((n / totalMes) * 100) : 0;
      return Math.max(0, Math.min(100, val));
    };

    return {
      totalMes,
      topServicios,
      estados,
      porcentajes: {
        Confirmada: pct(estados.Confirmada),
        Pendiente: pct(estados.Pendiente),
        Cancelada: pct(estados.Cancelada),
        Finalizada: pct(estados.Finalizada),
      },
    };
  }, [citasNormalizadas]);

  const celdasCalendario = useMemo(() => generarCalendario(mesCalendario), [mesCalendario]);

  const cambiarMes = (delta) => {
    setMesCalendario((prev) => new Date(prev.getFullYear(), prev.getMonth() + delta, 1));
  };

  const tituloMes = `${nombresMes[mesCalendario.getMonth()]} ${mesCalendario.getFullYear()}`;

  // 💡 Contenedor full width (para “rellenar” lados)
  const contenedor = "w-full px-4 md:px-8 xl:px-12 2xl:px-16";

  return (
    <div className="bg-fondo min-h-screen text-blanco-suave flex">
      {/* SIDEBAR */}
      <aside className="w-64 bg-panel-oscuro border-r border-panel-medio flex flex-col">
        <div className="px-5 py-4 border-b border-panel-medio">
          <h1 className="text-lg font-semibold tracking-tight">Barbería Deluxe</h1>
          <p className="text-xs text-texto-secundario mt-1">Panel de administración</p>
        </div>

        <nav className="flex-1 px-3 py-4 text-sm space-y-1">
          <button
            type="button"
            className="w-full text-left px-3 py-2 rounded-lg bg-panel-medio text-blanco-suave font-semibold"
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

      {/* CONTENIDO */}
      <main className="flex-1 flex flex-col">
        <header className="border-b border-panel-medio bg-fondo">
          <div className={`${contenedor} py-4 flex items-center justify-between`}>
            <div className="flex flex-col">
              <span className="text-xs uppercase tracking-[0.15em] text-texto-secundario">
                Panel de administración
              </span>
              <h2 className="text-xl font-semibold mt-1">Dashboard</h2>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={safe(onIrHorarios)}
                className="px-4 py-2 rounded-full border border-panel-medio text-xs text-texto-secundario hover:bg-panel-medio/60 hover:text-blanco-suave transition"
              >
                Horarios
              </button>
              <button
                type="button"
                onClick={safe(onIrCitas)}
                className="px-4 py-2 rounded-full bg-crema text-negro-suave text-xs font-semibold hover:bg-blanco-suave transition"
              >
                Ver citas
              </button>
            </div>
          </div>
        </header>

        <div className={`${contenedor} py-6 space-y-4`}>
          {error ? (
            <div className="bg-panel-oscuro rounded-2xl border border-panel-medio p-4">
              <p className="text-sm text-estado-cancelada">{error}</p>
            </div>
          ) : null}

          {/* RESUMEN HOY */}
          <section className="bg-panel-oscuro rounded-2xl border border-panel-medio p-4">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
              <div>
                <h3 className="text-sm font-semibold">Hoy</h3>
                <p className="text-[11px] text-texto-secundario">
                  Lo que necesitas ver rápido al abrir el panel.
                </p>
              </div>

              {cargando ? (
                <p className="text-xs text-texto-secundario">Cargando resumen...</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  <div className="px-3 py-2 rounded-xl border border-panel-medio bg-panel-medio/20">
                    <p className="text-[10px] text-texto-secundario">Confirmadas</p>
                    <p className="text-lg font-semibold text-estado-confirmada">
                      {resumenHoy.confirmadas}
                    </p>
                  </div>

                  <div className="px-3 py-2 rounded-xl border border-panel-medio bg-panel-medio/20">
                    <p className="text-[10px] text-texto-secundario">Pendientes</p>
                    <p className="text-lg font-semibold">{resumenHoy.pendientes}</p>
                  </div>

                  <div className="px-3 py-2 rounded-xl border border-panel-medio bg-panel-medio/20">
                    <p className="text-[10px] text-texto-secundario">Canceladas</p>
                    <p className="text-lg font-semibold text-estado-cancelada">
                      {resumenHoy.canceladas}
                    </p>
                  </div>

                  <div className="px-3 py-2 rounded-xl border border-panel-medio bg-panel-medio/20">
                    <p className="text-[10px] text-texto-secundario">Total hoy</p>
                    <p className="text-lg font-semibold">{resumenHoy.total}</p>
                  </div>

                  <div className="px-3 py-2 rounded-xl border border-panel-medio bg-panel-medio/10 min-w-[180px]">
                    <p className="text-[10px] text-texto-secundario">Siguiente cita</p>
                    <p className="text-[12px] font-semibold">
                      {resumenHoy.siguiente
                        ? `${resumenHoy.siguiente.hora || "—"} · ${resumenHoy.siguiente.cliente}`
                        : "—"}
                    </p>
                    {resumenHoy.siguiente ? (
                      <p className="text-[10px] text-texto-secundario">
                        {resumenHoy.siguiente.servicio}
                      </p>
                    ) : null}
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* GRID PRINCIPAL */}
          <section className="grid gap-4 lg:grid-cols-12">
            {/* PRÓXIMAS CITAS */}
            <div className="lg:col-span-8 2xl:col-span-9 bg-panel-oscuro rounded-2xl border border-panel-medio p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold">Próximas citas</h3>
                <button
                  type="button"
                  onClick={safe(onIrCitas)}
                  className="text-[11px] text-texto-secundario hover:text-blanco-suave"
                >
                  Ver todas
                </button>
              </div>

              {cargando ? (
                <p className="text-xs text-texto-secundario">Cargando próximas citas...</p>
              ) : proximasCitas.length === 0 ? (
                <p className="text-xs text-texto-secundario">
                  No hay citas próximas registradas.
                </p>
              ) : (
                <div className="space-y-3 text-sm">
                  {proximasCitas.map((cita) => (
                    <div
                      key={cita.id}
                      className="flex items-center justify-between py-2 border-b border-panel-medio/60 last:border-b-0"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-panel-medio border border-panel-medio flex items-center justify-center text-[12px]">
                          {String(cita.cliente || "C").trim().charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold truncate max-w-[640px]">
                            {cita.cliente}
                          </p>
                          <p className="text-[11px] text-texto-secundario truncate max-w-[720px]">
                            {cita.servicio}
                          </p>
                        </div>
                      </div>

                      <div className="text-right flex flex-col items-end">
                        <p className="text-[11px]">
                          {cita.hora || "—"}{" "}
                          <span className="text-texto-secundario">{cita.fechaStr || ""}</span>
                        </p>
                        <span
                          className={`inline-block mt-1 text-[10px] px-2 py-0.5 rounded-full ${claseEstado(
                            cita.estado
                          )} text-blanco-suave`}
                        >
                          {cita.estado}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* CALENDARIO */}
            <div className="lg:col-span-4 2xl:col-span-3 bg-panel-oscuro rounded-2xl border border-panel-medio p-4 text-xs">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold">{tituloMes}</h3>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => cambiarMes(-1)}
                    className="px-2 py-1 text-[11px] border border-panel-medio rounded-md hover:bg-panel-medio/70 transition"
                  >
                    {"<"}
                  </button>
                  <button
                    type="button"
                    onClick={() => cambiarMes(1)}
                    className="px-2 py-1 text-[11px] border border-panel-medio rounded-md hover:bg-panel-medio/70 transition"
                  >
                    {">"}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-7 gap-1 mb-1 text-texto-secundario">
                {nombresDiaCorto.map((d) => (
                  <div key={d} className="text-center">
                    {d}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-1">
                {celdasCalendario.map((fecha, idx) => {
                  if (!fecha) return <div key={idx} className="h-9" />;

                  const k = claveFecha(fecha);
                  const conteo = mapCitasPorDia.get(k) || 0;

                  const hoy = new Date();
                  const esHoyUI = esMismaFecha(fecha, hoy);
                  const cerrado = diasNoDisponibles.has(k);

                  const base =
                    "h-9 rounded-lg flex items-center justify-center text-[12px] border";

                  let clase = "bg-panel-medio/30 border-panel-medio text-blanco-suave";
                  if (cerrado) {
                    clase =
                      "bg-estado-cancelada/30 border-estado-cancelada text-blanco-suave";
                  }

                  if (!cerrado && conteo >= 1) {
                    clase = "bg-panel-claro/70 border-panel-claro text-blanco-suave";
                  }

                  if (esHoyUI) {
                    clase = "bg-panel-claro border-crema text-blanco-suave";
                  }

                  return (
                    <div
                      key={k}
                      title={`${k}: ${conteo} cita(s)${cerrado ? " (Cerrado)" : ""}`}
                      className={`${base} ${clase}`}
                    >
                      {fecha.getDate()}
                    </div>
                  );
                })}
              </div>

              <div className="mt-3 text-[11px] text-texto-secundario space-y-1">
                <p>Rojo = día cerrado (según Horarios).</p>
                <p>Tono más claro = hay citas ese día.</p>
              </div>

              <button
                type="button"
                onClick={safe(onIrHorarios)}
                className="mt-3 w-full px-4 py-2 rounded-xl border border-panel-medio text-xs text-texto-secundario hover:bg-panel-medio/60 hover:text-blanco-suave transition"
              >
                Ir a horarios
              </button>
            </div>
          </section>

          {/* 🔥 SECCIÓN EXTRA PARA “RELLENAR” Y QUE SEA ÚTIL */}
          <section className="grid gap-4 lg:grid-cols-12">
            {/* GRÁFICA 7 DÍAS */}
            <div className="lg:col-span-8 2xl:col-span-9 bg-panel-oscuro rounded-2xl border border-panel-medio p-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="text-sm font-semibold">Actividad últimos 7 días</h3>
                  <p className="text-[11px] text-texto-secundario">
                    Cantidad de citas registradas por día.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={safe(onIrCitas)}
                  className="text-[11px] text-texto-secundario hover:text-blanco-suave"
                >
                  Ver historial
                </button>
              </div>

              <div className="h-44 flex items-end gap-3">
                {barrasUltimos7.map((b) => (
                  <div key={b.clave} className="flex-1 flex flex-col items-center">
                    <div
                      className="w-full max-w-[52px] rounded-t-xl bg-crema"
                      style={{ height: `${b.alto}%` }}
                      title={`${b.clave}: ${b.conteo} cita(s)`}
                    />
                    <div className="mt-2 text-[10px] text-texto-secundario flex flex-col items-center">
                      <span>{b.diaSem}</span>
                      <span>{String(b.dia).padStart(2, "0")}</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-3 text-[11px] text-texto-secundario">
                Tip: si ves un día muy alto, normalmente conviene revisar horarios y confirmar pendientes.
              </div>
            </div>

            {/* LATERAL: TOP SERVICIOS + ESTADOS MES */}
            <div className="lg:col-span-4 2xl:col-span-3 space-y-4">
              <div className="bg-panel-oscuro rounded-2xl border border-panel-medio p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="text-sm font-semibold">Top servicios (mes)</h3>
                    <p className="text-[11px] text-texto-secundario">
                      Lo más pedido para decidir qué impulsar.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={safe(onIrServicios)}
                    className="text-[11px] text-texto-secundario hover:text-blanco-suave"
                  >
                    Ver servicios
                  </button>
                </div>

                {cargando ? (
                  <p className="text-xs text-texto-secundario">Cargando...</p>
                ) : resumenMes.topServicios.length === 0 ? (
                  <p className="text-xs text-texto-secundario">Aún no hay datos este mes.</p>
                ) : (
                  <div className="space-y-2 text-xs">
                    {resumenMes.topServicios.map((s) => (
                      <div
                        key={s.servicio}
                        className="flex items-center justify-between px-3 py-2 rounded-xl border border-panel-medio bg-panel-medio/15"
                      >
                        <p className="truncate max-w-[210px]">{s.servicio}</p>
                        <span className="text-blanco-suave font-semibold">{s.conteo}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="bg-panel-oscuro rounded-2xl border border-panel-medio p-4">
                <div className="mb-3">
                  <h3 className="text-sm font-semibold">Estados (mes)</h3>
                  <p className="text-[11px] text-texto-secundario">
                    Distribución del estado de citas del mes actual.
                  </p>
                </div>

                {cargando ? (
                  <p className="text-xs text-texto-secundario">Cargando...</p>
                ) : resumenMes.totalMes === 0 ? (
                  <p className="text-xs text-texto-secundario">Aún no hay citas este mes.</p>
                ) : (
                  <div className="space-y-3 text-xs">
                    {[
                      { k: "Confirmada", cls: "bg-estado-confirmada" },
                      { k: "Pendiente", cls: "bg-estado-pendiente" },
                      { k: "Cancelada", cls: "bg-estado-cancelada" },
                      { k: "Finalizada", cls: "bg-estado-confirmada" },
                    ].map((it) => (
                      <div key={it.k}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-texto-secundario">{it.k}</span>
                          <span className="font-semibold">
                            {resumenMes.estados[it.k]} · {resumenMes.porcentajes[it.k]}%
                          </span>
                        </div>
                        <div className="h-2 rounded-full bg-panel-medio/30 border border-panel-medio overflow-hidden">
                          <div
                            className={`h-full ${it.cls}`}
                            style={{ width: `${resumenMes.porcentajes[it.k]}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <button
                  type="button"
                  onClick={safe(onIrCitas)}
                  className="mt-3 w-full px-4 py-2 rounded-xl border border-panel-medio text-xs text-texto-secundario hover:bg-panel-medio/60 hover:text-blanco-suave transition"
                >
                  Administrar citas
                </button>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
