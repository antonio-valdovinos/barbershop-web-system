// src/pages/AgendarCitaPage.jsx
import React, { useMemo, useState, useEffect } from "react";

// Usa la misma URL que en App.jsx
const API_URL = "http://localhost:4000/api";

function generarDiasDelMes(fechaBase) {
  const year = fechaBase.getFullYear();
  const month = fechaBase.getMonth();
  const primerDiaMes = new Date(year, month, 1);
  const ultimoDiaMes = new Date(year, month + 1, 0);
  const inicioSemana = primerDiaMes.getDay();
  const totalDias = ultimoDiaMes.getDate();

  const dias = [];
  for (let i = 0; i < inicioSemana; i += 1) dias.push(null);
  for (let d = 1; d <= totalDias; d += 1) dias.push(new Date(year, month, d));

  return dias;
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

const nombresDia = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

function claveFecha(fecha) {
  return fecha.toISOString().slice(0, 10); // YYYY-MM-DD
}

// 🔹 Helpers de validación
const esTelefonoValido = (valor) => {
  // Solo dígitos, entre 7 y 15 (puedes ajustar a 10 si quieres)
  const regex = /^[0-9]{7,15}$/;
  return regex.test(valor);
};

const esCorreoValido = (valor) => {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(valor);
};

export default function AgendarCitaPage({
  fromAdmin = false,
  fromUser = false,
  usuarioLogeado = false,
  onVolverInicio,
  onVolverAdmin,
  onVolverMisCitas,
}) {
  const hoy = useMemo(() => new Date(), []);
  const [mesActual, setMesActual] = useState(
    new Date(hoy.getFullYear(), hoy.getMonth(), 1)
  );

  // Prefill datos usuario
  const correoInicial = (() => {
    const guardado = localStorage.getItem("correoUsuario") || "";
    return fromAdmin || (fromUser && usuarioLogeado) ? guardado : "";
  })();

  const nombreInicial = (() => {
    if (fromAdmin || (fromUser && usuarioLogeado))
      return localStorage.getItem("nombreUsuario") || "";
    return "";
  })();

  const telefonoInicial = (() => {
    if (fromAdmin || (fromUser && usuarioLogeado))
      return localStorage.getItem("telefonoUsuario") || "";
    return "";
  })();

  const [fechaSeleccionada, setFechaSeleccionada] = useState(hoy);
  const [horaSeleccionada, setHoraSeleccionada] = useState("");

  // Servicio seleccionado
  const [servicioSeleccionado, setServicioSeleccionado] = useState(null);
  const [menuServiciosAbierto, setMenuServiciosAbierto] = useState(false);

  // Servicios desde el backend
  const [servicios, setServicios] = useState([]);
  const [cargandoServicios, setCargandoServicios] = useState(true);

  const [nombre, setNombre] = useState(nombreInicial);
  const [telefono, setTelefono] = useState(telefonoInicial);
  const [correo, setCorreo] = useState(correoInicial);

  // días bloqueados (no disponibles) que vienen de AdminHorarios
  const [diasBloqueados, setDiasBloqueados] = useState(() => new Set());

  // Formato 24 horas
  const horasDisponibles = [
    "09:00",
    "09:30",
    "10:00",
    "10:30",
    "11:00",
    "11:30",
    "12:00",
    "12:30",
    "14:00",
  ];

  const diasMes = useMemo(() => generarDiasDelMes(mesActual), [mesActual]);

  const esMismaFecha = (a, b) =>
    a &&
    b &&
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();

  const cambiarMes = (delta) => {
    setMesActual(
      (prev) => new Date(prev.getFullYear(), prev.getMonth() + delta, 1)
    );
  };

  const handleVolver = () => {
    if (fromAdmin && onVolverAdmin) return onVolverAdmin();
    if (fromUser && onVolverMisCitas) return onVolverMisCitas();
    if (onVolverInicio) return onVolverInicio();
  };

  // Cargar configuración de horarios (marcar días en rojo)
  useEffect(() => {
    const cargarConfigHorarios = async () => {
      try {
        const resp = await fetch(`${API_URL}/horarios/config`);
        if (!resp.ok) return;

        const data = await resp.json();
        if (Array.isArray(data.diasNoDisponibles)) {
          setDiasBloqueados(new Set(data.diasNoDisponibles));
        }
      } catch (error) {
        console.error("Error cargando días bloqueados:", error);
      }
    };

    cargarConfigHorarios();
  }, []);

  // Cargar servicios desde el backend
  useEffect(() => {
    const cargarServicios = async () => {
      try {
        setCargandoServicios(true);
        const resp = await fetch(`${API_URL}/servicios`);

        if (!resp.ok) {
          console.error("Respuesta NO OK al listar servicios:", resp.status);
          setServicios([]);
          return;
        }

        const data = await resp.json();
        console.log("Servicios desde backend en AgendarCitaPage:", data);

        const arreglo = Array.isArray(data) ? data : [];
        const publicados = arreglo.filter((s) => s.publicado === true);

        setServicios(publicados);
      } catch (error) {
        console.error("Error cargando servicios:", error);
        setServicios([]);
      } finally {
        setCargandoServicios(false);
      }
    };

    cargarServicios();
  }, []);

  // Submit cita
  const manejarSubmit = async (e) => {
    e.preventDefault();

    if (
      !fechaSeleccionada ||
      !horaSeleccionada ||
      !servicioSeleccionado ||
      !nombre ||
      !telefono
    ) {
      alert("Por favor completa la fecha, hora, servicio, nombre y teléfono.");
      return;
    }

    // Validar hora en formato 24 hrs
    const regexHora24 = /^([01]\d|2[0-3]):[0-5]\d$/;
    if (!regexHora24.test(String(horaSeleccionada || "").trim())) {
      alert("La hora debe estar en formato 24 horas (HH:MM), por ejemplo 14:30.");
      return;
    }

    // ✅ Validar teléfono (solo números)
    if (!esTelefonoValido(telefono)) {
      alert(
        "El número de teléfono solo debe contener números y tener entre 7 y 15 dígitos."
      );
      return;
    }

    // ✅ Validar correo solo si se escribió algo
    if (correo && !esCorreoValido(correo)) {
      alert("Ingresa un correo electrónico válido (ejemplo@dominio.com).");
      return;
    }

    const fechaISO = fechaSeleccionada.toISOString().slice(0, 10);

    try {
      const respBloqueo = await fetch(
        `${API_URL}/horarios/dia-bloqueado/${fechaISO}`
      );
      if (respBloqueo.ok) {
        const info = await respBloqueo.json();
        if (info.bloqueado) {
          alert("Este día está marcado como NO disponible.");
          return;
        }
      }

      const payload = {
        fecha: fechaISO,
        hora: horaSeleccionada, // 24 hrs HH:MM
        servicioNombre: servicioSeleccionado.nombre,
        nombre,
        telefono,
        correo,
      };

      const resp = await fetch(`${API_URL}/citas`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await resp.json();

      if (!resp.ok) {
        alert(data.mensaje || "Error al registrar la cita.");
        return;
      }

      alert(`Cita registrada correctamente. Folio: ${data.citaId}`);

      setHoraSeleccionada("");
      setServicioSeleccionado(null);
    } catch (error) {
      console.error(error);
      alert("Error al conectar con el servidor.");
    }
  };

  const tituloMesActual = `${nombresMes[mesActual.getMonth()]} ${mesActual.getFullYear()}`;
  const correoPrefijado =
    (fromAdmin || (fromUser && usuarioLogeado)) && !!correoInicial;

  return (
    <div className="bg-fondo min-h-screen text-blanco-suave">
      {/* Header */}
      <header className="border-b border-panel-medio/70 bg-fondo sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-3 py-4 flex items-center justify-between">
          <span className="font-semibold text-sm tracking-wide">
            Barbería Clásica
          </span>

          <button
            type="button"
            onClick={handleVolver}
            className="px-4 py-2 rounded-full border border-panel-medio text-sm hover:bg-panel-medio/60 transition"
          >
            Volver
          </button>
        </div>
      </header>

      {/* Contenido */}
      <main className="max-w-6xl mx-auto px-3 py-10">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Agendar Cita</h1>
          <p className="text-sm text-texto-secundario max-w-xl">
            Completa los siguientes pasos para reservar tu cita.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-10 items-start">
          {/* Calendario */}
          <section>
            <h2 className="text-sm font-semibold mb-4">
              Paso 1: Elige Fecha y Hora
            </h2>

            <div className="bg-panel-oscuro rounded-2xl border border-panel-medio p-5 mb-5">
              {/* Navegación */}
              <div className="flex items-center justify-between mb-4">
                <button
                  type="button"
                  onClick={() => cambiarMes(-1)}
                  className="px-2 py-1 text-xs border border-panel-medio rounded-md hover:bg-panel-medio/70 transition"
                >
                  Anterior
                </button>

                <span className="text-sm font-semibold">{tituloMesActual}</span>

                <button
                  type="button"
                  onClick={() => cambiarMes(1)}
                  className="px-2 py-1 text-xs border border-panel-medio rounded-md hover:bg-panel-medio/70 transition"
                >
                  Siguiente
                </button>
              </div>

              {/* Encabezados */}
              <div className="grid grid-cols-7 gap-1 text-[11px] text-texto-secundario mb-1">
                {nombresDia.map((dia) => (
                  <div
                    key={dia}
                    className="h-6 flex items-center justify-center"
                  >
                    {dia}
                  </div>
                ))}
              </div>

              {/* Celdas */}
              <div className="grid grid-cols-7 gap-1 text-xs">
                {diasMes.map((fecha, index) => {
                  if (!fecha) return <div key={index} className="h-8" />;

                  const seleccionado = esMismaFecha(fecha, fechaSeleccionada);
                  const hoyMismo = esMismaFecha(fecha, hoy);

                  const clave = claveFecha(fecha);
                  const cerrado = diasBloqueados.has(clave);

                  let clasesBase =
                    "h-8 rounded-md flex items-center justify-center text-[11px]";
                  let clasesEstado;

                  if (cerrado) {
                    clasesEstado =
                      "bg-estado-cancelada text-blanco-suave border border-estado-cancelada cursor-not-allowed";
                  } else if (seleccionado) {
                    clasesEstado =
                      "bg-crema text-negro-suave font-semibold border border-crema";
                  } else if (hoyMismo) {
                    clasesEstado =
                      "border border-crema text-crema bg-panel-medio/40";
                  } else {
                    clasesEstado =
                      "bg-panel-medio/40 hover:bg-panel-medio/80 border border-transparent";
                  }

                  return (
                    <button
                      key={fecha.toISOString()}
                      type="button"
                      onClick={() => {
                        if (!cerrado) {
                          setFechaSeleccionada(fecha);
                        }
                      }}
                      disabled={cerrado}
                      className={`${clasesBase} ${clasesEstado}`}
                    >
                      {fecha.getDate()}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Horas */}
            <div>
              <h3 className="text-xs font-semibold mb-2">
                Horas Disponibles (24 hrs)
              </h3>

              <div className="flex flex-wrap gap-2">
                {horasDisponibles.map((hora) => {
                  const seleccionada = hora === horaSeleccionada;

                  return (
                    <button
                      key={hora}
                      type="button"
                      onClick={() => setHoraSeleccionada(hora)}
                      className={[
                        "px-4 py-2 rounded-full text-xs border",
                        seleccionada
                          ? "bg-crema text-negro-suave border-crema"
                          : "border-panel-medio bg-panel-oscuro hover:bg-panel-medio/70",
                      ].join(" ")}
                    >
                      {hora}
                    </button>
                  );
                })}
              </div>
            </div>
          </section>

          {/* Servicios + Formulario */}
          <section>
            {/* PASO 2 */}
            <div className="mb-8">
              <h2 className="text-sm font-semibold mb-3">
                Paso 2: Selecciona tu Servicio
              </h2>

              {cargandoServicios ? (
                <p className="text-xs text-texto-secundario">
                  Cargando servicios...
                </p>
              ) : servicios.length === 0 ? (
                <p className="text-xs text-estado-cancelada">
                  No hay servicios publicados. Pide al administrador que
                  registre alguno.
                </p>
              ) : (
                <div className="relative">
                  {/* Botón principal */}
                  <button
                    type="button"
                    onClick={() => setMenuServiciosAbierto((prev) => !prev)}
                    className="w-full flex justify-between items-center rounded-xl border border-panel-medio bg-panel-oscuro px-4 py-3 text-sm hover:bg-panel-medio/40 transition"
                  >
                    <span>
                      {servicioSeleccionado
                        ? `${servicioSeleccionado.nombre} — ${servicioSeleccionado.duracionMin} min — $${servicioSeleccionado.precio}`
                        : "Selecciona un servicio..."}
                    </span>
                    <span className="text-texto-secundario text-xs">▼</span>
                  </button>

                  {/* Lista desplegada */}
                  {menuServiciosAbierto && (
                    <div className="absolute z-20 mt-2 w-full bg-panel-oscuro border border-panel-medio rounded-xl shadow-lg p-2 space-y-2 max-h-80 overflow-y-auto">
                      {servicios.map((servicio) => {
                        const activo =
                          servicioSeleccionado &&
                          servicioSeleccionado._id === servicio._id;

                        return (
                          <button
                            key={servicio._id}
                            type="button"
                            onClick={() => {
                              setServicioSeleccionado(servicio);
                              setMenuServiciosAbierto(false);
                            }}
                            className={[
                              "w-full text-left rounded-xl border px-4 py-3 text-sm transition",
                              activo
                                ? "border-crema bg-panel-medio/60"
                                : "border-panel-medio bg-panel-oscuro hover:bg-panel-medio/60",
                            ].join(" ")}
                          >
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-semibold">
                                {servicio.nombre}
                              </span>
                              <span className="text-[11px] text-texto-secundario">
                                ${servicio.precio}
                              </span>
                            </div>

                            <p className="text-[11px] text-texto-secundario">
                              Duración: {servicio.duracionMin} min
                            </p>

                            {servicio.descripcion && (
                              <p className="mt-1 text-[11px] text-texto-secundario">
                                {servicio.descripcion}
                              </p>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* PASO 3: Formulario */}
            <div>
              <h2 className="text-sm font-semibold mb-3">
                Paso 3: Ingresa tus Datos
              </h2>

              <form onSubmit={manejarSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs mb-1">Nombre Completo</label>
                  <input
                    type="text"
                    className="w-full rounded-lg bg-panel-oscuro border border-panel-medio px-3 py-2 text-sm outline-none focus:border-crema"
                    value={nombre}
                    placeholder="Ej. Juan Pérez"
                    onChange={(e) => setNombre(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-xs mb-1">Número de Teléfono</label>
                  <input
                    type="tel"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    className="w-full rounded-lg bg-panel-oscuro border border-panel-medio px-3 py-2 text-sm outline-none focus:border-crema"
                    value={telefono}
                    placeholder="7551234567"
                    onChange={(e) => {
                      const soloNumeros = e.target.value.replace(/\D/g, "");
                      setTelefono(soloNumeros);
                    }}
                  />
                </div>

                <div>
                  <label className="block text-xs mb-1">
                    Correo Electrónico (Opcional)
                  </label>
                  <input
                    type="email"
                    className="w-full rounded-lg bg-panel-oscuro border border-panel-medio px-3 py-2 text-sm outline-none focus:border-crema"
                    value={correo}
                    placeholder="correo@ejemplo.com"
                    onChange={(e) => setCorreo(e.target.value)}
                  />
                  {correoPrefijado && (
                    <p className="mt-1 text-[11px] text-texto-secundario">
                      Este correo fue cargado automáticamente, pero puedes
                      cambiarlo.
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  className="mt-4 w-full rounded-full bg-crema text-negro-suave text-sm font-semibold py-3 hover:bg-blanco-suave transition disabled:opacity-60 disabled:cursor-not-allowed"
                  disabled={servicios.length === 0}
                >
                  Agendar Cita
                </button>
              </form>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
