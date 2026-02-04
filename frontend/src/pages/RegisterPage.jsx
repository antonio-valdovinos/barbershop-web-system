// src/pages/RegistroPage.jsx
import React, { useState } from "react";
import herramientasImg from "../assets/herramientas.jpg";

export default function RegistroPage({ onVolverLogin, onVolverInicio }) {
  const [nombre, setNombre] = useState("");
  const [correo, setCorreo] = useState("");
  const [telefono, setTelefono] = useState("");          // ← NUEVO
  const [contrasena, setContrasena] = useState("");
  const [cargando, setCargando] = useState(false);

  const manejarSubmit = async (e) => {
    e.preventDefault();

    // Ahora también valida teléfono
    if (!nombre || !correo || !telefono || !contrasena) {
      alert("Por favor completa todos los campos.");
      return;
    }

    setCargando(true);

    try {
      const respuesta = await fetch(
        "http://localhost:4000/api/clientes",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            nombre,
            correo,
            telefono,                 // ← NUEVO
            password: contrasena,
          }),
        }
      );

      const data = await respuesta.json().catch(() => ({}));

      if (respuesta.status === 409) {
        alert(data.mensaje || "Ya existe una cuenta con ese correo.");
        return;
      }

      if (!respuesta.ok) {
        alert(data.mensaje || "Ocurrió un error al crear la cuenta.");
        return;
      }

      alert("Cuenta creada correctamente. Ahora puedes iniciar sesión.");

      // Guardar datos básicos en localStorage
      localStorage.setItem("correoUsuario", correo);
      localStorage.setItem("rolUsuario", "cliente");
      localStorage.setItem("nombreUsuario", nombre);     // ← NUEVO
      localStorage.setItem("telefonoUsuario", telefono); // ← NUEVO

      if (typeof onVolverLogin === "function") {
        onVolverLogin();
      }
    } catch (error) {
      console.error("Error al registrar usuario:", error);
      alert("No se pudo conectar con el servidor. Revisa el backend.");
    } finally {
      setCargando(false);
    }
  };

  const irInicio = () => {
    if (onVolverInicio) {
      onVolverInicio();
    }
  };

  return (
    <div className="bg-fondo min-h-screen text-blanco-suave flex flex-col overflow-x-hidden">
      {/* NAVBAR IGUAL QUE LOGIN / HOME */}
      <header className="border-b border-panel-medio/70 bg-fondo/95 backdrop-blur sticky top-0 z-20">
        <div className="max-w-6xl xl:max-w-7xl mx-auto px-3 py-4 flex items-center justify-between">
          <div className="flex items-center gap-10">
            <span className="font-semibold text-sm tracking-wide">
              Barbería Clásica
            </span>

            <nav className="flex items-center gap-8 text-sm">
              <button
                type="button"
                onClick={irInicio}
                className="hover:text-crema transition"
              >
                Inicio
              </button>
              <button
                type="button"
                onClick={irInicio}
                className="hover:text-crema transition"
              >
                Servicios
              </button>
              <button
                type="button"
                onClick={irInicio}
                className="hover:text-crema transition"
              >
                Barberos
              </button>
              <button
                type="button"
                onClick={irInicio}
                className="hover:text-crema transition"
              >
                Contacto
              </button>
            </nav>
          </div>
        </div>
      </header>

      {/* FONDO DIFUMINADO CON HERRAMIENTAS */}
      <div className="relative flex-1 flex items-center justify-center px-3 py-10">
        <div className="absolute inset-0">
          <div
            className="w-full h-full bg-cover bg-center blur-sm scale-105"
            style={{ backgroundImage: `url(${herramientasImg})` }}
          />
          <div className="absolute inset-0 bg-black/55" />
        </div>

        {/* CARD FORMULARIO */}
        <main className="relative w-full max-w-md">
          <div className="bg-panel-oscuro/95 rounded-2xl border border-panel-medio shadow-xl px-8 py-8">
            <h1 className="text-3xl font-bold text-center mb-2">
              Crear Cuenta
            </h1>

            <p className="text-center text-texto-secundario text-sm mb-6">
              Puedes hacer citas sin registrarte, pero crear una cuenta te
              ayudará a llevar un mejor control de tu historial de servicios.
            </p>

            <form onSubmit={manejarSubmit} className="space-y-4">
              <div>
                <label className="block text-xs mb-1">Nombre completo</label>
                <input
                  type="text"
                  className="w-full rounded-lg bg-panel-medio/40 border border-panel-medio px-3 py-2 text-sm focus:border-crema outline-none"
                  placeholder="Ej. Juan Pérez"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs mb-1">Correo electrónico</label>
                <input
                  type="email"
                  className="w-full rounded-lg bg-panel-medio/40 border border-panel-medio px-3 py-2 text-sm focus:border-crema outline-none"
                  placeholder="tucorreo@ejemplo.com"
                  value={correo}
                  onChange={(e) => setCorreo(e.target.value)}
                />
              </div>

              {/* NUEVO: Teléfono */}
              <div>
                <label className="block text-xs mb-1">Teléfono</label>
                <input
                  type="tel"
                  className="w-full rounded-lg bg-panel-medio/40 border border-panel-medio px-3 py-2 text-sm focus:border-crema outline-none"
                  placeholder="Ej. +52 755 123 4567"
                  value={telefono}
                  onChange={(e) => setTelefono(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs mb-1">Contraseña</label>
                <input
                  type="password"
                  className="w-full rounded-lg bg-panel-medio/40 border border-panel-medio px-3 py-2 text-sm focus:border-crema outline-none"
                  placeholder="Ingresa una contraseña segura"
                  value={contrasena}
                  onChange={(e) => setContrasena(e.target.value)}
                />
              </div>

              <button
                type="submit"
                disabled={cargando}
                className="w-full rounded-full bg-crema text-negro-suave text-sm font-semibold py-3 hover:bg-blanco-suave transition disabled:opacity-60"
              >
                {cargando ? "Creando cuenta..." : "Crear Cuenta"}
              </button>
            </form>

            <p className="mt-4 text-[11px] text-texto-secundario text-center leading-relaxed">
              Al registrarte aceptas nuestros términos y condiciones. Más
              adelante podrás gestionar tus datos desde tu perfil.
            </p>

            <p className="mt-6 text-center text-xs">
              ¿Ya tienes cuenta?{" "}
              <button
                onClick={onVolverLogin}
                className="text-crema font-semibold hover:underline"
              >
                Inicia sesión
              </button>
            </p>
          </div>
        </main>
      </div>
    </div>
  );
}
