import React from "react";

export default function AdminConfigPage({
  onCerrarSesion,
  onIrDashboard,
  onIrCitas,
  onIrClientes,
  onIrServicios,
  onIrHorarios,
  onIrConfiguracion,
}) {
  const safe = (fn) => (typeof fn === "function" ? fn : () => {});

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
            className="w-full text-left px-3 py-2 rounded-lg bg-panel-medio text-blanco-suave"
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
        {/* HEADER */}
        <header className="border-b border-panel-medio px-8 py-4 flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-xs uppercase tracking-[0.15em] text-texto-secundario">
              Panel de Administración
            </span>
            <h2 className="text-xl font-semibold mt-1">Configuración</h2>
          </div>
          <button
            type="button"
            className="px-5 py-2.5 rounded-full bg-crema text-negro-suave text-xs font-semibold hover:bg-blanco-suave transition shadow-sm"
          >
            Guardar Cambios
          </button>
        </header>

        {/* CONTENIDO */}
        <div className="max-w-6xl mx-auto px-6 py-6 space-y-6">
          {/* CARD 1 */}
          <section className="bg-panel-oscuro rounded-2xl border border-panel-medio px-6 py-6">
            <h3 className="text-sm font-semibold mb-3">Información del Negocio</h3>
            <p className="text-xs text-texto-secundario mb-4">
              Configura el nombre, teléfono y dirección de tu barbería.
            </p>

            <div className="space-y-4 text-sm">
              <div>
                <label className="text-xs text-texto-secundario">Nombre del negocio</label>
                <input
                  type="text"
                  className="w-full bg-panel-oscuro border border-panel-medio rounded-lg px-3 py-2 outline-none focus:border-crema"
                  placeholder="Barbería Deluxe"
                />
              </div>

              <div>
                <label className="text-xs text-texto-secundario">Teléfono</label>
                <input
                  type="text"
                  className="w-full bg-panel-oscuro border border-panel-medio rounded-lg px-3 py-2 outline-none focus:border-crema"
                  placeholder="55 1234 5678"
                />
              </div>

              <div>
                <label className="text-xs text-texto-secundario">Dirección</label>
                <input
                  type="text"
                  className="w-full bg-panel-oscuro border border-panel-medio rounded-lg px-3 py-2 outline-none focus:border-crema"
                  placeholder="Calle Principal #123"
                />
              </div>
            </div>
          </section>

          {/* CARD 2 */}
          <section className="bg-panel-oscuro rounded-2xl border border-panel-medio px-6 py-6">
            <h3 className="text-sm font-semibold mb-3">Ajustes Visuales</h3>
            <p className="text-xs text-texto-secundario mb-4">
              En futuras actualizaciones podrás cambiar el logo, colores y temas.
            </p>

            <button
              type="button"
              className="px-5 py-2.5 rounded-full bg-panel-medio text-texto-secundario cursor-not-allowed"
            >
              Próximamente...
            </button>
          </section>
        </div>
      </main>
    </div>
  );
}
