import React, { useState } from "react";

export default function LoginPage({
  onVolverInicio,
  onLoginAdmin,
  onLoginCliente,
  onIrARegistro
}) {
  const [correo, setCorreo] = useState(
    () => localStorage.getItem("correoUsuario") || ""
  );
  const [contrasena, setContrasena] = useState("");
  const [cargando, setCargando] = useState(false);

  const manejarSubmit = async (e) => {
    e.preventDefault();

    if (!correo || !contrasena) {
      alert("Por favor ingresa tu correo y contraseña.");
      return;
    }

    setCargando(true);

    try {
      const respuesta = await fetch("http://localhost:4000/api/clientes/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ correo, password: contrasena })
      });

      const data = await respuesta.json().catch(() => ({}));

      // Usuario no encontrado -> invitar a registrarse
      if (respuesta.status === 404) {
        const irRegistro = window.confirm(
          "No existe una cuenta con ese correo. ¿Deseas crear una ahora?"
        );
        if (irRegistro && typeof onIrARegistro === "function") {
          onIrARegistro();
        }
        return;
      }

      // Contraseña incorrecta
      if (respuesta.status === 401) {
        alert(data.mensaje || "Contraseña incorrecta.");
        return;
      }

      // Otro error
      if (!respuesta.ok) {
        alert(data.mensaje || "Ocurrió un error al iniciar sesión.");
        return;
      }

      // Login correcto
      const rol = data.rol || "cliente";
      const correoServidor = data.correo || correo;

      localStorage.setItem("correoUsuario", correoServidor);
      localStorage.setItem("rolUsuario", rol);
      localStorage.setItem("nombreUsuario", data.nombre || "");
      localStorage.setItem("telefonoUsuario", data.telefono || "");


      if (rol === "admin") {
        if (typeof onLoginAdmin === "function") {
          onLoginAdmin();
        }
      } else {
        if (typeof onLoginCliente === "function") {
          onLoginCliente();
        }
      }
    } catch (error) {
      console.error("Error al iniciar sesión:", error);
      alert("No se pudo conectar con el servidor. Revisa el backend.");
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="bg-fondo min-h-screen text-blanco-suave flex flex-col">
      {/* NAVBAR */}
      <header className="border-b border-panel-medio/70 bg-fondo/95 backdrop-blur sticky top-0 z-20">
        <div className="max-w-6xl xl:max-w-7xl mx-auto px-3 py-4 flex items-center justify-between">
          <span
            onClick={onVolverInicio}
            className="font-semibold text-sm tracking-wide cursor-pointer hover:text-crema transition"
          >
            Barbería Clásica
          </span>

          <nav className="hidden md:flex gap-6 text-texto-secundario text-sm">
            <button
              onClick={onVolverInicio}
              className="hover:text-blanco-suave transition"
            >
              Inicio
            </button>
            <button
              onClick={onVolverInicio}
              className="hover:text-blanco-suave transition"
            >
              Servicios
            </button>
            <button
              onClick={onVolverInicio}
              className="hover:text-blanco-suave transition"
            >
              Barberos
            </button>
            <button
              onClick={onVolverInicio}
              className="hover:text-blanco-suave transition"
            >
              Contacto
            </button>
          </nav>

          <button
            type="button"
            onClick={onVolverInicio}
            className="px-5 py-2 rounded-full bg-crema text-negro-suave text-sm font-semibold hover:bg-blanco-suave transition"
          >
            Agendar Cita
          </button>
        </div>
      </header>

      {/* FONDO DIFUMINADO */}
      <div className="relative flex-1 flex items-center justify-center px-3 py-10">
        <div className="absolute inset-0">
          <div
            className="w-full h-full bg-cover bg-center blur-sm scale-105"
            style={{ backgroundImage: "url('/hero-barberia.jpg')" }}
          />
          <div className="absolute inset-0 bg-black/55" />
        </div>

        {/* CARD FORMULARIO */}
        <main className="relative w-full max-w-md">
          <div className="bg-panel-oscuro/95 rounded-2xl border border-panel-medio shadow-xl px-8 py-8">
            <h1 className="text-3xl font-bold text-center mb-2">
              Inicio de Sesión Cliente
            </h1>
            <p className="text-center text-texto-secundario text-sm mb-6">
              Accede para gestionar tus citas de manera sencilla.
            </p>

            <form onSubmit={manejarSubmit} className="space-y-4">
              <div>
                <label className="block text-xs mb-1">Correo Electrónico</label>
                <input
                  type="email"
                  className="w-full rounded-lg bg-panel-medio/40 border border-panel-medio px-3 py-2 text-sm focus:border-crema outline-none"
                  placeholder="usuario@correo.com"
                  value={correo}
                  onChange={(e) => setCorreo(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs mb-1">Contraseña</label>
                <input
                  type="password"
                  className="w-full rounded-lg bg-panel-medio/40 border border-panel-medio px-3 py-2 text-sm focus:border-crema outline-none"
                  placeholder="********"
                  value={contrasena}
                  onChange={(e) => setContrasena(e.target.value)}
                />
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  className="text-[11px] hover:text-blanco-suave text-texto-secundario"
                >
                  ¿Olvidaste tu contraseña?
                </button>
              </div>

              <button
                type="submit"
                disabled={cargando}
                className="w-full rounded-full bg-crema text-negro-suave text-sm font-semibold py-3 hover:bg-blanco-suave transition disabled:opacity-60"
              >
                {cargando ? "Iniciando sesión..." : "Iniciar Sesión"}
              </button>
            </form>

            {/* TEXTO NUEVO */}
            <p className="mt-5 text-xs text-texto-secundario text-center leading-relaxed">
              Puedes agendar citas sin registrarte, pero crear una cuenta te
              ayudará a llevar un mejor control de tu historial y próximas
              visitas.
            </p>

            {/* REGISTRO */}
            <p className="mt-6 text-center text-xs">
              ¿No tienes una cuenta?{" "}
              <button
                onClick={onIrARegistro}
                className="text-crema font-semibold hover:underline"
              >
                Regístrate aquí
              </button>
            </p>
          </div>
        </main>
      </div>
    </div>
  );
}
