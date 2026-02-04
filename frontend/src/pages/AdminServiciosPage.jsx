// src/pages/AdminServiciosPage.jsx
import React, { useMemo, useState } from "react";

export default function AdminServiciosPage({
  onCerrarSesion,
  onIrDashboard,
  onIrCitas,
  onIrClientes,
  onIrServicios,
  onIrHorarios,
  onIrConfiguracion,
  onIrAgregarServicio,

  // Lista de servicios desde el padre (App.jsx)
  // Cada servicio: { _id, nombre, descripcion, duracionMin, precio, publicado }
  servicios,
  onTogglePublicado,    // (idServicio) => void
  onActualizarServicio, // (servicioActualizado) => void
  onEliminarServicio,   // (idServicio) => void
}) {
  const [busqueda, setBusqueda] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("Todos");

  const [mostrandoModalEdicion, setMostrandoModalEdicion] = useState(false);
  const [servicioEditando, setServicioEditando] = useState(null);

  const [editNombre, setEditNombre] = useState("");
  const [editDescripcion, setEditDescripcion] = useState("");
  const [editDuracion, setEditDuracion] = useState("");
  const [editPrecio, setEditPrecio] = useState("");

  const safe = (fn) => (typeof fn === "function" ? fn : () => {});

  // --- FILTRO + BÚSQUEDA ---
  const serviciosFiltrados = useMemo(() => {
    let resultado = Array.isArray(servicios) ? [...servicios] : [];

    if (filtroEstado === "Publicado") {
      resultado = resultado.filter((s) => s.publicado);
    } else if (filtroEstado === "No disponible") {
      resultado = resultado.filter((s) => !s.publicado);
    }

    if (busqueda.trim() !== "") {
      const q = busqueda.toLowerCase();
      resultado = resultado.filter((s) => {
        const nombre = (s.nombre || "").toLowerCase();
        const descripcion = (s.descripcion || "").toLowerCase();
        const categoria = (s.categoria || "").toLowerCase();
        return (
          nombre.includes(q) ||
          descripcion.includes(q) ||
          categoria.includes(q)
        );
      });
    }

    return resultado;
  }, [busqueda, filtroEstado, servicios]);

  const totalServicios = servicios?.length || 0;
  const totalPublicados = servicios?.filter((s) => s.publicado).length || 0;
  const totalOcultos = totalServicios - totalPublicados;

  // --- EDICIÓN ---
  const manejarAbrirEdicion = (servicio) => {
    setServicioEditando(servicio);
    setEditNombre(servicio.nombre || "");
    setEditDescripcion(servicio.descripcion || "");
    setEditDuracion(
      servicio.duracionMin !== undefined ? String(servicio.duracionMin) : ""
    );
    setEditPrecio(
      servicio.precio !== undefined ? String(servicio.precio) : ""
    );
    setMostrandoModalEdicion(true);
  };

  const manejarCerrarModal = () => {
    setMostrandoModalEdicion(false);
    setServicioEditando(null);
  };

  const manejarGuardarEdicion = (e) => {
    e.preventDefault();
    if (!servicioEditando) return;

    const duracionNumerica = parseInt(editDuracion, 10) || 0;
    const precioNumerico = parseFloat(editPrecio) || 0;

    const servicioActualizado = {
      ...servicioEditando,
      nombre: editNombre.trim() || servicioEditando.nombre,
      descripcion: editDescripcion.trim(),
      duracionMin: duracionNumerica,
      precio: precioNumerico,
    };

    safe(onActualizarServicio)(servicioActualizado);
    manejarCerrarModal();
  };

  return (
    <div className="min-h-screen bg-fondo text-blanco-suave flex">
      {/* SIDEBAR */}
      <aside className="w-64 bg-panel-oscuro border-r border-panel-medio flex flex-col">
        <div className="px-5 py-4 border-b border-panel-medio">
          <h1 className="text-lg font-semibold tracking-tight">Barbería Deluxe</h1>
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
            className="w-full text-left px-3 py-2 rounded-lg bg-panel-medio text-blanco-suave"
          >
            Servicios
          </button>
          <button
            type="button"
            onClick={safe(onIrHorarios)}
            className="w-full text-left px-3 py-2 rounded-lg text-texto-secundario hover:bg-panel-medio/70"
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

      {/* CONTENIDO PRINCIPAL */}
      <main className="flex-1 flex flex-col">
        {/* HEADER SUPERIOR */}
        <header className="border-b border-panel-medio px-8 py-4 flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-xs uppercase tracking-[0.15em] text-texto-secundario">
              Panel de Administración
            </span>
            <h2 className="text-xl font-semibold mt-1">Servicios</h2>
          </div>

          <button
            type="button"
            onClick={safe(onIrAgregarServicio)}
            className="px-5 py-2.5 rounded-full bg-crema text-negro-suave text-xs font-semibold hover:bg-blanco-suave transition shadow-sm"
          >
            Agregar Servicio
          </button>
        </header>

        <div className="max-w-6xl mx-auto px-6 py-6 space-y-6">
          {/* Resumen */}
          <section className="grid gap-4 md:grid-cols-3">
            <div className="bg-panel-oscuro rounded-2xl border border-panel-medio px-4 py-4">
              <p className="text-xs text-texto-secundario mb-1">
                Servicios totales
              </p>
              <p className="text-2xl font-semibold">{totalServicios}</p>
            </div>
            <div className="bg-panel-oscuro rounded-2xl border border-panel-medio px-4 py-4">
              <p className="text-xs text-texto-secundario mb-1">
                Servicios publicados
              </p>
              <p className="text-2xl font-semibold text-estado-confirmada">
                {totalPublicados}
              </p>
            </div>
            <div className="bg-panel-oscuro rounded-2xl border border-panel-medio px-4 py-4">
              <p className="text-xs text-texto-secundario mb-1">
                No disponibles
              </p>
              <p className="text-2xl font-semibold text-estado-cancelada">
                {totalOcultos}
              </p>
            </div>
          </section>

          {/* Filtros */}
          <section className="bg-panel-oscuro rounded-2xl border border-panel-medio px-5 py-4 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="space-y-2">
              <h3 className="text-sm font-semibold">Filtros de servicios</h3>
              <p className="text-xs text-texto-secundario">
                Administra y filtra los servicios por estado de publicación.
              </p>
            </div>

            <div className="flex flex-col gap-3 md:flex-row md:items-center">
              <div className="flex items-center gap-2">
                {["Todos", "Publicado", "No disponible"].map((estado) => (
                  <button
                    key={estado}
                    type="button"
                    onClick={() => setFiltroEstado(estado)}
                    className={`px-3 py-1.5 rounded-full text-xs border transition ${
                      filtroEstado === estado
                        ? "bg-panel-claro text-blanco-suave border-panel-claro"
                        : "border-panel-medio text-texto-secundario hover:border-panel-claro hover:text-blanco-suave"
                    }`}
                  >
                    {estado}
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
                placeholder="Buscar servicio..."
                className="w-full bg-panel-oscuro border border-panel-medio rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-crema/40 focus:border-crema placeholder:text-texto-secundario"
              />
            </div>
          </section>

          {/* Lista de servicios */}
          <section className="space-y-3">
            {serviciosFiltrados.map((servicio) => (
              <article
                key={servicio._id}
                className="bg-panel-oscuro border border-panel-medio rounded-2xl px-5 py-4 flex flex-col md:flex-row md:justify-between gap-3"
              >
                {/* Información */}
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-sm font-semibold">{servicio.nombre}</h3>

                    {servicio.publicado ? (
                      <span className="text-[11px] px-2 py-0.5 rounded-full bg-estado-confirmada/20 text-estado-confirmada border border-estado-confirmada/40">
                        Publicado
                      </span>
                    ) : (
                      <span className="text-[11px] px-2 py-0.5 rounded-full bg-panel-medio text-texto-secundario border border-panel-medio">
                        No disponible
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-texto-secundario">
                    {servicio.descripcion}
                  </p>

                  <div className="flex flex-wrap text-[11px] gap-4 mt-2 text-texto-secundario">
                    <span>
                      Duración: <b>{servicio.duracionMin} min</b>
                    </span>
                    <span>
                      Precio: <b>${servicio.precio}</b>
                    </span>
                  </div>
                </div>

                {/* Acciones */}
                <div className="flex flex-col md:items-end gap-2 text-xs">
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => manejarAbrirEdicion(servicio)}
                      className="px-3 py-1 rounded-full border border-panel-medio text-texto-secundario hover:bg-panel-medio/70"
                    >
                      Editar servicio
                    </button>

                    {servicio.publicado ? (
                      <button
                        type="button"
                        onClick={() =>
                          safe(onTogglePublicado)(servicio._id)
                        }
                        className="px-3 py-1 rounded-full border border-estado-cancelada text-estado-cancelada hover:bg-estado-cancelada/10"
                      >
                        Marcar como no disponible
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() =>
                          safe(onTogglePublicado)(servicio._id)
                        }
                        className="px-3 py-1 rounded-full border border-estado-confirmada text-estado-confirmada hover:bg-estado-confirmada/10"
                      >
                        Marcar como disponible
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() =>
                        safe(onEliminarServicio)(servicio._id)
                      }
                      className="px-3 py-1 rounded-full border border-panel-medio text-estado-cancelada hover:bg-panel-medio/70"
                    >
                      Eliminar
                    </button>
                  </div>

                  <p className="text-[11px] text-texto-secundario">
                    Estos servicios aparecerán en Agendar Cita.
                  </p>
                </div>
              </article>
            ))}
          </section>
        </div>
      </main>

      {/* MODAL DE EDICIÓN */}
      {mostrandoModalEdicion && servicioEditando && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/50">
          <div className="bg-panel-oscuro border border-panel-medio rounded-2xl px-6 py-6 w-full max-w-lg shadow-xl">
            <h3 className="text-sm font-semibold mb-1">Editar servicio</h3>
            <p className="text-[11px] text-texto-secundario mb-4">
              Ajusta los datos del servicio y guarda los cambios.
            </p>

            <form onSubmit={manejarGuardarEdicion} className="space-y-4 text-sm">
              <div>
                <label className="block text-xs mb-1">Nombre</label>
                <input
                  type="text"
                  value={editNombre}
                  onChange={(e) => setEditNombre(e.target.value)}
                  className="w-full rounded-xl bg-panel-medio/40 border border-panel-medio px-3 py-2 text-sm outline-none focus:border-crema"
                  placeholder="Nombre del servicio"
                />
              </div>

              <div>
                <label className="block text-xs mb-1">Descripción</label>
                <textarea
                  value={editDescripcion}
                  onChange={(e) => setEditDescripcion(e.target.value)}
                  className="w-full rounded-xl bg-panel-medio/40 border border-panel-medio px-3 py-2 text-sm outline-none focus:border-crema resize-none h-20"
                  placeholder="Descripción del servicio"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs mb-1">Duración (min)</label>
                  <input
                    type="number"
                    min="0"
                    value={editDuracion}
                    onChange={(e) => setEditDuracion(e.target.value)}
                    className="w-full rounded-xl bg-panel-medio/40 border border-panel-medio px-3 py-2 text-sm outline-none focus:border-crema"
                  />
                </div>

                <div>
                  <label className="block text-xs mb-1">Precio ($)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={editPrecio}
                    onChange={(e) => setEditPrecio(e.target.value)}
                    className="w-full rounded-xl bg-panel-medio/40 border border-panel-medio px-3 py-2 text-sm outline-none focus:border-crema"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={manejarCerrarModal}
                  className="px-4 py-2 rounded-full bg-panel-medio text-texto-secundario text-xs hover:bg-panel-claro"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-full bg-crema text-negro-suave text-xs font-semibold hover:bg-blanco-suave"
                >
                  Guardar cambios
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
