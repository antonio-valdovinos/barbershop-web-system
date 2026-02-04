// src/controllers/citasController.js
import { conectarDB } from "../config/db.js";
import mongoose from "mongoose";

const { Types } = mongoose;

export async function crearCita(req, res) {
  try {
    const db = await conectarDB();

    const {
      fecha,
      hora,
      servicioNombre,
      nombre,
      telefono,
      correo,
    } = req.body;

    if (!fecha || !hora || !servicioNombre || !nombre || !telefono) {
      return res.status(400).json({ mensaje: "Faltan datos de la cita" });
    }

    const colClientes = db.collection("clientes");
    const colCitas = db.collection("citas");
    const colHorarios = db.collection("horarios");

    // 🔴 Validar días NO disponibles
    const configDias = await colHorarios.findOne({
      _id: "config-dias-no-disponibles",
    });

    const diasNoDisponibles = Array.isArray(configDias?.diasNoDisponibles)
      ? configDias.diasNoDisponibles
      : [];

    if (diasNoDisponibles.includes(fecha)) {
      return res.status(400).json({
        mensaje:
          "Lo sentimos, ese día está marcado como no disponible. Elige otra fecha.",
      });
    }

    // Crear o actualizar cliente (upsert)
    await colClientes.updateOne(
      { telefono },
      {
        $set: {
          nombre,
          correo: correo || null,
        },
        $setOnInsert: {
          clienteId: new Types.ObjectId().toHexString(),
          fechaRegistro: new Date(),
          citas: [],
        },
      },
      { upsert: true }
    );

    const cliente = await colClientes.findOne({ telefono });

    // Id de cita como string
    const citaId = new Types.ObjectId().toHexString();

    // Agregar cita al arreglo embebido en clientes
    await colClientes.updateOne(
      { _id: cliente._id },
      {
        $push: {
          citas: {
            citaId,
            fecha,
            hora,
            servicio: servicioNombre,
            estado: "activa",
            fechaRegistro: new Date(),
          },
        },
      }
    );

    // Insertar cita en colección global de citas
    await colCitas.insertOne({
      citaId,
      clienteId: cliente.clienteId,
      nombreCliente: cliente.nombre,
      telefono: cliente.telefono,
      correo: correo || null,
      fecha,
      hora,
      servicio: servicioNombre,
      estado: "activa",
      recordatorioEnviado: false,
      fechaRegistro: new Date(),
    });

    // Actualizar horarios: quitar la hora reservada de ese día
    await colHorarios.updateOne(
      { dia: fecha },
      { $pull: { horasDisponibles: hora } }
    );

    return res.status(201).json({
      mensaje: "Cita creada correctamente",
      citaId,
    });
  } catch (error) {
    console.error("Error al crear cita:", error);
    return res.status(500).json({ mensaje: "Error en el servidor" });
  }
}

// Obtener citas de un usuario por correo
export async function obtenerCitasPorCorreo(req, res) {
  try {
    const db = await conectarDB();

    // GET /api/citas/usuario/:correo
    // GET /api/citas/mis-citas?correo=...
    const correo = req.params.correo || req.query.correo;

    if (!correo) {
      return res.status(400).json({ mensaje: "Correo requerido" });
    }

    const colCitas = db.collection("citas");

    const citas = await colCitas
      .find({ correo })
      .project({
        _id: 0,
        citaId: 1,
        servicio: 1,
        fecha: 1,
        hora: 1,
        nombreCliente: 1,
        estado: 1, // 👈 importante para MisCitasPage
      })
      .sort({ fecha: 1, hora: 1 })
      .toArray();

    return res.json(citas);
  } catch (error) {
    console.error("Error al obtener citas por correo:", error);
    return res.status(500).json({ mensaje: "Error en el servidor" });
  }
}

/* 🔹 Todas las citas para el panel de administración */
export async function obtenerTodasLasCitas(req, res) {
  try {
    const db = await conectarDB();
    const colCitas = db.collection("citas");

    const citas = await colCitas
      .find({})
      .sort({ fecha: 1, hora: 1 })
      .toArray();

    return res.json(citas);
  } catch (error) {
    console.error("Error al obtener todas las citas:", error);
    return res.status(500).json({ mensaje: "Error en el servidor" });
  }
}

/* 🔹 Actualizar / reagendar / modificar */
export async function actualizarCita(req, res) {
  try {
    const db = await conectarDB();
    const { citaId } = req.params;
    const { fecha, hora, servicioNombre } = req.body;

    if (!citaId) {
      return res.status(400).json({ mensaje: "citaId requerido" });
    }

    const colCitas = db.collection("citas");
    const colClientes = db.collection("clientes");
    const colHorarios = db.collection("horarios");

    const citaOriginal = await colCitas.findOne({ citaId });

    if (!citaOriginal) {
      return res.status(404).json({ mensaje: "Cita no encontrada" });
    }

    const setCita = {};
    if (fecha) setCita.fecha = fecha;
    if (hora) setCita.hora = hora;
    if (servicioNombre) setCita.servicio = servicioNombre;

    if (Object.keys(setCita).length > 0) {
      await colCitas.updateOne({ citaId }, { $set: setCita });
    }

    const setCliente = {};
    if (fecha) setCliente["citas.$.fecha"] = fecha;
    if (hora) setCliente["citas.$.hora"] = hora;
    if (servicioNombre) setCliente["citas.$.servicio"] = servicioNombre;

    if (Object.keys(setCliente).length > 0) {
      await colClientes.updateOne(
        { "citas.citaId": citaId },
        { $set: setCliente }
      );
    }

    if (fecha || hora) {
      const fechaAnterior = citaOriginal.fecha;
      const horaAnterior = citaOriginal.hora;
      const nuevaFecha = fecha || fechaAnterior;
      const nuevaHora = hora || horaAnterior;

      await colHorarios.updateOne(
        { dia: fechaAnterior },
        { $addToSet: { horasDisponibles: horaAnterior } }
      );

      await colHorarios.updateOne(
        { dia: nuevaFecha },
        { $pull: { horasDisponibles: nuevaHora } }
      );
    }

    return res.json({ mensaje: "Cita actualizada correctamente" });
  } catch (error) {
    console.error("Error al actualizar cita:", error);
    return res.status(500).json({ mensaje: "Error en el servidor" });
  }
}

/* 🔹 Cancelar cita */
export async function cancelarCita(req, res) {
  try {
    const db = await conectarDB();
    const { citaId } = req.params;

    if (!citaId) {
      return res.status(400).json({ mensaje: "citaId requerido" });
    }

    const colCitas = db.collection("citas");
    const colClientes = db.collection("clientes");
    const colHorarios = db.collection("horarios");

    const cita = await colCitas.findOne({ citaId });
    if (!cita) {
      return res.status(404).json({ mensaje: "Cita no encontrada" });
    }

    await colCitas.updateOne(
      { citaId },
      { $set: { estado: "cancelada" } }
    );

    await colClientes.updateOne(
      { "citas.citaId": citaId },
      { $set: { "citas.$.estado": "cancelada" } }
    );

    await colHorarios.updateOne(
      { dia: cita.fecha },
      { $addToSet: { horasDisponibles: cita.hora } }
    );

    return res.json({ mensaje: "Cita cancelada correctamente" });
  } catch (error) {
    console.error("Error al cancelar cita:", error);
    return res.status(500).json({ mensaje: "Error en el servidor" });
  }
}

/* 🔹 Finalizar cita (marcar como completada / finalizada) */
export async function finalizarCita(req, res) {
  try {
    const db = await conectarDB();
    const { citaId } = req.params;

    if (!citaId) {
      return res.status(400).json({ mensaje: "citaId requerido" });
    }

    const colCitas = db.collection("citas");
    const colClientes = db.collection("clientes");

    const cita = await colCitas.findOne({ citaId });
    if (!cita) {
      return res.status(404).json({ mensaje: "Cita no encontrada" });
    }

    // Solo cambiamos estado; NO liberamos horario (ya se atendió)
    await colCitas.updateOne(
      { citaId },
      { $set: { estado: "finalizada" } }
    );

    await colClientes.updateOne(
      { "citas.citaId": citaId },
      { $set: { "citas.$.estado": "finalizada" } }
    );

    return res.json({ mensaje: "Cita marcada como finalizada" });
  } catch (error) {
    console.error("Error al finalizar cita:", error);
    return res.status(500).json({ mensaje: "Error en el servidor" });
  }
}

/* 🔹 Eliminar cita */
export async function eliminarCita(req, res) {
  try {
    const db = await conectarDB();
    const { citaId } = req.params;

    if (!citaId) {
      return res.status(400).json({ mensaje: "citaId requerido" });
    }

    const colCitas = db.collection("citas");
    const colClientes = db.collection("clientes");
    const colHorarios = db.collection("horarios");

    const cita = await colCitas.findOne({ citaId });
    if (!cita) {
      return res.status(404).json({ mensaje: "Cita no encontrada" });
    }

    await colCitas.deleteOne({ citaId });

    await colClientes.updateOne(
      { "citas.citaId": citaId },
      { $pull: { citas: { citaId } } }
    );

    await colHorarios.updateOne(
      { dia: cita.fecha },
      { $addToSet: { horasDisponibles: cita.hora } }
    );

    return res.json({ mensaje: "Cita eliminada correctamente" });
  } catch (error) {
    console.error("Error al eliminar cita:", error);
    return res.status(500).json({ mensaje: "Error en el servidor" });
  }
}
