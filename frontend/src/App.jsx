// src/App.jsx
import React, { useState, useEffect } from "react";

import HomePage from "./pages/HomePage";
import AgendarCitaPage from "./pages/AgendarCitaPage";
import LoginPage from "./pages/LoginPage";
import MisCitasPage from "./pages/MisCitasPage";
import AdminDashboardPage from "./pages/AdminDashboardPage";
import AdminCitasPage from "./pages/AdminCitasPage";
import AdminClientesPage from "./pages/AdminClientesPage";
import AdminServiciosPage from "./pages/AdminServiciosPage";
import AdminHorariosPage from "./pages/AdminHorariosPage";
import AdminConfigPage from "./pages/AdminConfigPage";
import RegistroPage from "./pages/RegisterPage";

import AdminAgregarClientePage from "./pages/AdminAgregarClientePage";
import AdminAgregarServicioPage from "./pages/AdminAgregarServicioPage";

// URL base del backend
const API_URL = "http://localhost:4000/api";

export default function App() {
  const [pagina, setPagina] = useState("inicio");

  // Para saber si el usuario común abrió Agendar Cita desde Mis Citas
  const [fromUserAgendar, setFromUserAgendar] = useState(false);

  // ------------------------
  // ESTADO COMPARTIDO DE SERVICIOS (ADMIN, desde backend)
  // ------------------------
  const [serviciosAdmin, setServiciosAdmin] = useState([]);
  const [cargandoServiciosAdmin, setCargandoServiciosAdmin] = useState(true);

  const cargarServiciosAdmin = async () => {
    try {
      setCargandoServiciosAdmin(true);
      const resp = await fetch(`${API_URL}/servicios`);
      if (!resp.ok) {
        throw new Error("No se pudieron cargar los servicios del backend");
      }
      const data = await resp.json();
      setServiciosAdmin(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error cargando servicios admin:", error);
      setServiciosAdmin([]);
    } finally {
      setCargandoServiciosAdmin(false);
    }
  };

  // Cargar servicios al iniciar la app
  useEffect(() => {
    cargarServiciosAdmin();
  }, []);

  // Actualizar servicio en backend (sin mostrar error si igual se actualiza)
const actualizarServicioAdmin = async (servicioActualizado) => {
  try {
    if (!servicioActualizado._id) return;

    const resp = await fetch(
      `${API_URL}/servicios/${servicioActualizado._id}`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre: servicioActualizado.nombre,
          descripcion: servicioActualizado.descripcion,
          duracionMin: servicioActualizado.duracionMin,
          precio: servicioActualizado.precio,
        }),
      }
    );

    // Intentamos leer la respuesta, pero si falla no rompemos
    const data = await resp.json().catch(() => ({}));

    // Si el backend regresa el servicio actualizado, lo usamos;
    // si no, usamos el que ya teníamos en el front.
    const servicioFinal = data.servicio || servicioActualizado;

    // Actualizamos el estado local sin mostrar alert
    setServiciosAdmin((prev) =>
      prev.map((s) => (s._id === servicioFinal._id ? servicioFinal : s))
    );

    // Si quieres depurar, puedes ver si la respuesta no fue OK:
    if (!resp.ok) {
      console.warn(
        "Respuesta no-OK al actualizar servicio:",
        resp.status,
        data
      );
    }
  } catch (error) {
    console.error("Error al actualizar servicio:", error);
    alert("No se pudo actualizar el servicio. Intenta de nuevo.");
  }
};


  // Cambiar publicado/no publicado en backend
  const togglePublicadoServicioAdmin = async (id) => {
    try {
      const resp = await fetch(`${API_URL}/servicios/${id}/publicado`, {
        method: "PATCH",
      });

      if (!resp.ok) {
        const data = await resp.json().catch(() => ({}));
        throw new Error(data.mensaje || "Error al cambiar estado de servicio");
      }

      await cargarServiciosAdmin();
    } catch (error) {
      console.error("Error al cambiar publicado:", error);
      alert("Error al cambiar el estado publicado del servicio.");
    }
  };

  // Eliminar servicio en backend
  const eliminarServicioAdmin = async (id) => {
    try {
      const resp = await fetch(`${API_URL}/servicios/${id}`, {
        method: "DELETE",
      });

      if (!resp.ok) {
        const data = await resp.json().catch(() => ({}));
        throw new Error(data.mensaje || "Error al eliminar servicio");
      }

      await cargarServiciosAdmin();
    } catch (error) {
      console.error("Error al eliminar servicio:", error);
      alert("Error al eliminar el servicio en el servidor.");
    }
  };

  // ------------------------
  // FUNCIONES DE NAVEGACIÓN
  // ------------------------

  const irInicio = () => {
    setFromUserAgendar(false);
    setPagina("inicio");
  };

  const irAgendar = () => {
    setPagina("agendar");
  };

  const irLogin = () => setPagina("login");
  const irMisCitas = () => {
    setFromUserAgendar(false);
    setPagina("mis-citas");
  };
  const irRegistro = () => setPagina("registro");

  // Admin
  const irAdmin = () => setPagina("admin");
  const irAdminDashboard = () => setPagina("admin");
  const irAdminCitas = () => setPagina("admin-citas");
  const irAdminClientes = () => setPagina("admin-clientes");

  // 👉 Cada vez que entras a Servicios, recarga desde el backend
  const irAdminServicios = () => {
    cargarServiciosAdmin();
    setPagina("admin-servicios");
  };

  const irAdminHorarios = () => setPagina("admin-horarios");
  const irAdminConfig = () => setPagina("admin-config");
  const irAdminAgendar = () => setPagina("admin-agendar");

  const irAdminAgregarCliente = () => setPagina("admin-agregar-cliente");
  const irAdminAgregarServicio = () => setPagina("admin-agregar-servicio");

  // ------------------------
  // RUTAS PRINCIPALES
  // ------------------------

  if (pagina === "agendar") {
    const usuarioLogeado = !!localStorage.getItem("correoUsuario");

    return (
      <AgendarCitaPage
        fromAdmin={false}
        fromUser={fromUserAgendar}
        usuarioLogeado={usuarioLogeado}
        onVolverInicio={() => {
          setFromUserAgendar(false);
          irInicio();
        }}
        onVolverMisCitas={() => {
          setFromUserAgendar(false);
          irMisCitas();
        }}
      />
    );
  }

  if (pagina === "login") {
    return (
      <LoginPage
        onVolverInicio={irInicio}
        onLoginAdmin={irAdmin}
        onLoginCliente={irMisCitas}
        onIrARegistro={irRegistro}
      />
    );
  }

  if (pagina === "registro") {
    return (
      <RegistroPage onVolverLogin={irLogin} onVolverInicio={irInicio} />
    );
  }

  if (pagina === "mis-citas") {
    return (
      <MisCitasPage
        onIrInicio={irInicio}
        onAgendarClick={() => {
          setFromUserAgendar(true);
          irAgendar();
        }}
      />
    );
  }

  // ------------------------
  // PANEL DE ADMINISTRACIÓN
  // ------------------------

  if (pagina === "admin") {
    return (
      <AdminDashboardPage
        onCerrarSesion={irInicio}
        onIrCitas={irAdminCitas}
        onIrClientes={irAdminClientes}
        onIrHorarios={irAdminHorarios}
        onIrServicios={irAdminServicios}
        onIrConfiguracion={irAdminConfig}
      />
    );
  }

  if (pagina === "admin-citas") {
    return (
      <AdminCitasPage
        onCerrarSesion={irInicio}
        onIrDashboard={irAdminDashboard}
        onIrCitas={irAdminCitas}
        onIrClientes={irAdminClientes}
        onIrServicios={irAdminServicios}
        onIrHorarios={irAdminHorarios}
        onIrConfiguracion={irAdminConfig}
        onIrAgendarCita={irAdminAgendar}
      />
    );
  }

  if (pagina === "admin-agendar") {
    return (
      <AgendarCitaPage
        fromAdmin
        fromUser={false}
        onVolverAdmin={irAdminCitas} // vuelve al panel de Citas
      />
    );
  }

  // CLIENTES admin
  if (pagina === "admin-clientes") {
    return (
      <AdminClientesPage
        onCerrarSesion={irInicio}
        onIrDashboard={irAdminDashboard}
        onIrCitas={irAdminCitas}
        onIrClientes={irAdminClientes}
        onIrServicios={irAdminServicios}
        onIrHorarios={irAdminHorarios}
        onIrConfiguracion={irAdminConfig}
        onIrAgregarCliente={irAdminAgregarCliente}
      />
    );
  }

  if (pagina === "admin-agregar-cliente") {
    return (
      <AdminAgregarClientePage
        onCerrarSesion={irInicio}
        onIrDashboard={irAdminDashboard}
        onIrCitas={irAdminCitas}
        onIrClientes={irAdminClientes}
        onIrServicios={irAdminServicios}
        onIrHorarios={irAdminHorarios}
        onIrConfiguracion={irAdminConfig}
      />
    );
  }

  // SERVICIOS admin
  if (pagina === "admin-servicios") {
    return (
      <AdminServiciosPage
        onCerrarSesion={irInicio}
        onIrDashboard={irAdminDashboard}
        onIrCitas={irAdminCitas}
        onIrClientes={irAdminClientes}
        onIrServicios={irAdminServicios}
        onIrHorarios={irAdminHorarios}
        onIrConfiguracion={irAdminConfig}
        onIrAgregarServicio={irAdminAgregarServicio}
        servicios={serviciosAdmin}
        onTogglePublicado={togglePublicadoServicioAdmin}
        onActualizarServicio={actualizarServicioAdmin}
        onEliminarServicio={eliminarServicioAdmin}
      />
    );
  }

  if (pagina === "admin-agregar-servicio") {
    return (
      <AdminAgregarServicioPage
        onIrServicios={irAdminServicios}
      />
    );
  }

  if (pagina === "admin-horarios") {
    return (
      <AdminHorariosPage
        onCerrarSesion={irInicio}
        onIrDashboard={irAdminDashboard}
        onIrCitas={irAdminCitas}
        onIrClientes={irAdminClientes}
        onIrServicios={irAdminServicios}
        onIrHorarios={irAdminHorarios}
        onIrConfiguracion={irAdminConfig}
      />
    );
  }

  if (pagina === "admin-config") {
    return (
      <AdminConfigPage
        onCerrarSesion={irInicio}
        onIrDashboard={irAdminDashboard}
        onIrCitas={irAdminCitas}
        onIrClientes={irAdminClientes}
        onIrServicios={irAdminServicios}
        onIrHorarios={irAdminHorarios}
        onIrConfiguracion={irAdminConfig}
      />
    );
  }

  // HOME
  return (
    <HomePage
      onAgendarClick={() => {
        setFromUserAgendar(false);
        irAgendar();
      }}
      onLoginClick={irLogin}
    />
  );
}
