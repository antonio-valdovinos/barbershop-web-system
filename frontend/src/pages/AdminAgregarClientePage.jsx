// src/pages/AdminAgregarClientePage.jsx
import React, { useState } from "react";

export default function AdminAgregarClientePage({ onIrClientes }) {
  const [nombre, setNombre] = useState("");
  const [correo, setCorreo] = useState("");
  const [telefono, setTelefono] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");

  // Helpers de validación
  const esCorreoValido = (valor) => {
    // algo@algo.algo
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(valor);
  };

  const esTelefonoValido = (valor) => {
    // solo dígitos, entre 7 y 15 (ajusta si quieres 10 fijo)
    const regex = /^[0-9]{7,15}$/;
    return regex.test(valor);
  };

  const manejarSubmit = async (e) => {
    e.preventDefault();

    if (!nombre || !correo || !telefono || !contrasena) {
      setError("Por favor completa todos los campos.");
      return;
    }

    if (!esCorreoValido(correo)) {
      setError("Ingresa un correo electrónico válido (ejemplo@dominio.com).");
      return;
    }

    if (!esTelefonoValido(telefono)) {
      setError(
        "El teléfono solo debe contener números y tener entre 7 y 15 dígitos."
      );
      return;
    }

    setCargando(true);
    setError("");

    try {
      const resp = await fetch("http://localhost:4000/api/clientes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre,
          correo,
          telefono,
          password: contrasena, // el backend de clientes solo usará nombre, correo y teléfono
        }),
      });

      const data = await resp.json().catch(() => ({}));

      if (resp.status === 409) {
        setError(
          data.mensaje ||
            "Ya existe un cliente con ese teléfono o correo registrado."
        );
        return;
      }

      if (!resp.ok) {
        setError(data.mensaje || "No se pudo crear el cliente.");
        return;
      }

      alert("Cliente creado correctamente.");
      onIrClientes();
    } catch (error) {
      console.error(error);
      setError("No se pudo conectar con el servidor.");
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="bg-fondo min-h-screen text-blanco-suave">
      {/* Header */}
      <header className="border-b border-panel-medio/70 bg-fondo sticky top-0 z-20">
        <div className="max-w-6xl xl:max-w-7xl mx-auto px-3 py-4 flex items-center justify-end">
          <button
            type="button"
            onClick={onIrClientes}
            className="px-4 py-2 rounded-full border border-panel-medio text-sm hover:bg-panel-medio/60 transition"
          >
            Volver
          </button>
        </div>
      </header>

      {/* Contenido principal */}
      <main className="max-w-6xl xl:max-w-7xl mx-auto px-3 py-12">
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-4xl font-bold mb-2">
            Registrar Cliente
          </h1>
          <p className="text-sm text-texto-secundario max-w-xl mx-auto">
            Ingresa los datos para crear una cuenta de cliente manualmente.
          </p>
        </div>

        <div className="flex justify-center">
          <div className="bg-panel-oscuro border border-panel-medio rounded-2xl px-10 py-8 w-[520px] shadow-md">
            <h3 className="text-sm font-semibold mb-4">Datos del cliente</h3>

            {error && (
              <p className="text-xs text-estado-cancelada mb-3">{error}</p>
            )}

            <form onSubmit={manejarSubmit} className="space-y-4 text-sm">
              <div>
                <label className="block text-xs mb-1">Nombre completo</label>
                <input
                  type="text"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  className="w-full rounded-lg bg-panel-oscuro border border-panel-medio px-3 py-2 text-sm outline-none focus:border-crema"
                  placeholder="Ej. Juan Pérez"
                />
              </div>

              <div>
                <label className="block text-xs mb-1">Correo electrónico</label>
                <input
                  type="email"
                  value={correo}
                  onChange={(e) => setCorreo(e.target.value)}
                  className="w-full rounded-lg bg-panel-oscuro border border-panel-medio px-3 py-2 text-sm outline-none focus:border-crema"
                  placeholder="correo@ejemplo.com"
                />
              </div>

              <div>
                <label className="block text-xs mb-1">Teléfono</label>
                <input
                  type="tel"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={telefono}
                  onChange={(e) => {
                    // Sólo dejamos números
                    const soloNumeros = e.target.value.replace(/\D/g, "");
                    setTelefono(soloNumeros);
                  }}
                  className="w-full rounded-lg bg-panel-oscuro border border-panel-medio px-3 py-2 text-sm outline-none focus:border-crema"
                  placeholder="7551234567"
                />
              </div>

              <div>
                <label className="block text-xs mb-1">Contraseña de acceso</label>
                <input
                  type="password"
                  value={contrasena}
                  onChange={(e) => setContrasena(e.target.value)}
                  className="w-full rounded-lg bg-panel-oscuro border border-panel-medio px-3 py-2 text-sm outline-none focus:border-crema"
                  placeholder="Ingresa una contraseña temporal"
                />
              </div>

              <button
                type="submit"
                disabled={cargando}
                className="mt-4 w-full rounded-full bg-crema text-negro-suave text-sm font-semibold py-3 hover:bg-blanco-suave transition disabled:opacity-60"
              >
                {cargando ? "Guardando..." : "Agregar cliente"}
              </button>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}
