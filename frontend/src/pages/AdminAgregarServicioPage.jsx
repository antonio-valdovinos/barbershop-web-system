// src/pages/AdminAgregarServicioPage.jsx
import React, { useState } from "react";

export default function AdminAgregarServicioPage({ onIrServicios }) {
  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [duracion, setDuracion] = useState("");
  const [precio, setPrecio] = useState("");
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");

  const manejarSubmit = async (e) => {
    e.preventDefault();

    // Validaciones básicas en frontend
    if (!nombre || !descripcion || !duracion || !precio) {
      setError("Por favor completa todos los campos.");
      return;
    }

    const duracionMin = parseInt(duracion, 10);
    const precioNum = parseFloat(precio);

    if (Number.isNaN(duracionMin) || duracionMin <= 0) {
      setError("La duración debe ser un número mayor a 0.");
      return;
    }

    if (Number.isNaN(precioNum) || precioNum < 0) {
      setError("El precio debe ser un número válido.");
      return;
    }

    setError("");
    setCargando(true);

    try {
      // Payload que espera el backend (serviciosController)
      const payload = {
        nombre,
        descripcion,
        duracionMin,
        precio: precioNum,
        publicado: true, // por defecto lo dejamos publicado
      };

      const resp = await fetch("http://localhost:4000/api/servicios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await resp.json().catch(() => ({}));

      if (!resp.ok) {
        // mensaje que mandamos desde el backend, si existe
        const msg =
          data?.mensaje || "Error al crear servicio en el servidor.";
        setError(msg);
        alert(msg);
        return;
      }

      // Todo bien
      alert("Servicio registrado correctamente.");
      onIrServicios(); // volvemos a la pantalla de Servicios
    } catch (err) {
      console.error("Error al registrar servicio:", err);
      const msg =
        "Ocurrió un error al registrar el servicio (no se pudo conectar con el servidor).";
      setError(msg);
      alert(msg);
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="bg-fondo min-h-screen text-blanco-suave">
      {/* HEADER con botón Volver */}
      <header className="border-b border-panel-medio/70 bg-fondo sticky top-0 z-20">
        <div className="max-w-6xl xl:max-w-7xl mx-auto px-3 py-4 flex items-center justify-end">
          <button
            type="button"
            onClick={onIrServicios}
            className="px-4 py-2 rounded-full border border-panel-medio text-sm hover:bg-panel-medio/60 transition"
          >
            Volver
          </button>
        </div>
      </header>

      {/* CONTENIDO PRINCIPAL */}
      <main className="max-w-6xl xl:max-w-7xl mx-auto px-3 py-12">
        {/* TÍTULO CENTRADO */}
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-4xl font-bold mb-2">
            Registrar Servicio
          </h1>
          <p className="text-sm text-texto-secundario max-w-xl mx-auto">
            Ingresa los datos para crear un servicio manualmente.
          </p>
        </div>

        {/* FORMULARIO CENTRADO */}
        <div className="flex justify-center">
          <div className="bg-panel-oscuro border border-panel-medio rounded-2xl px-10 py-8 w-[520px] shadow-md">
            <h3 className="text-sm font-semibold mb-4">Datos del servicio</h3>

            {error && (
              <p className="text-xs text-estado-cancelada mb-3">{error}</p>
            )}

            <form onSubmit={manejarSubmit} className="space-y-4 text-sm">
              <div>
                <label className="block text-xs mb-1">
                  Nombre del servicio
                </label>
                <input
                  type="text"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  className="w-full rounded-lg bg-panel-oscuro border border-panel-medio px-3 py-2 text-sm outline-none focus:border-crema"
                  placeholder="Ej. Corte Clásico"
                />
              </div>

              <div>
                <label className="block text-xs mb-1">Descripción</label>
                <textarea
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                  className="w-full rounded-lg bg-panel-oscuro border border-panel-medio px-3 py-2 text-sm outline-none focus:border-crema resize-none h-24"
                  placeholder="Describe brevemente el servicio..."
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs mb-1">
                    Duración (minutos)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={duracion}
                    onChange={(e) => setDuracion(e.target.value)}
                    className="w-full rounded-lg bg-panel-oscuro border border-panel-medio px-3 py-2 text-sm outline-none focus:border-crema"
                    placeholder="Ej. 30"
                  />
                </div>

                <div>
                  <label className="block text-xs mb-1">Precio ($)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={precio}
                    onChange={(e) => setPrecio(e.target.value)}
                    className="w-full rounded-lg bg-panel-oscuro border border-panel-medio px-3 py-2 text-sm outline-none focus:border-crema"
                    placeholder="Ej. 150"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={cargando}
                className="mt-4 w-full rounded-full bg-crema text-negro-suave text-sm font-semibold py-3 hover:bg-blanco-suave transition disabled:opacity-60"
              >
                {cargando ? "Guardando..." : "Agregar servicio"}
              </button>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}
