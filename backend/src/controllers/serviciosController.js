// src/controllers/serviciosController.js
import { conectarDB } from "../config/db.js";

// LISTAR TODOS LOS SERVICIOS
export async function listarServicios(req, res) {
  try {
    const db = await conectarDB();
    const col = db.collection("servicios");

    const servicios = await col
      .find({})
      .sort({ creadoEn: -1 })
      .toArray();

    return res.json(servicios);
  } catch (error) {
    console.error("Error al listar servicios:", error);
    return res
      .status(500)
      .json({ mensaje: "Error al obtener servicios" });
  }
}

// CREAR UN SERVICIO NUEVO
export async function crearServicio(req, res) {
  try {
    const db = await conectarDB();
    const col = db.collection("servicios");

    const { nombre, descripcion, duracionMin, precio, publicado } = req.body;

    if (!nombre) {
      return res
        .status(400)
        .json({ mensaje: "El nombre del servicio es obligatorio." });
    }

    const doc = {
      nombre: String(nombre).trim(),
      descripcion: descripcion ? String(descripcion).trim() : "",
      duracionMin: Number(duracionMin) || 0,
      precio: Number(precio) || 0,
      publicado: publicado === false ? false : true, // por defecto true
      creadoEn: new Date(),
      actualizadoEn: new Date(),
    };

    const resultado = await col.insertOne(doc);

    return res.status(201).json({
      mensaje: "Servicio creado correctamente.",
      servicioId: resultado.insertedId,
      servicio: { _id: resultado.insertedId, ...doc },
    });
  } catch (error) {
    console.error("Error al crear servicio:", error);
    return res
      .status(500)
      .json({ mensaje: "Error al crear servicio en el servidor." });
  }
}

// ACTUALIZAR SERVICIO
export async function actualizarServicio(req, res) {
  try {
    const db = await conectarDB();
    const col = db.collection("servicios");
    const { id } = req.params;

    const { nombre, descripcion, duracionMin, precio } = req.body;

    const update = {
      actualizadoEn: new Date(),
    };

    if (nombre !== undefined) update.nombre = String(nombre).trim();
    if (descripcion !== undefined)
      update.descripcion = String(descripcion).trim();
    if (duracionMin !== undefined)
      update.duracionMin = Number(duracionMin) || 0;
    if (precio !== undefined) update.precio = Number(precio) || 0;

    const { ObjectId } = await import("mongodb");
    const resultado = await col.findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: update },
      { returnDocument: "after" }
    );

    if (!resultado.value) {
      return res.status(404).json({ mensaje: "Servicio no encontrado." });
    }

    return res.json({
      mensaje: "Servicio actualizado.",
      servicio: resultado.value,
    });
  } catch (error) {
    console.error("Error al actualizar servicio:", error);
    return res
      .status(500)
      .json({ mensaje: "Error al actualizar servicio." });
  }
}

// CAMBIAR ESTADO PUBLICADO / NO DISPONIBLE
export async function togglePublicado(req, res) {
  try {
    const db = await conectarDB();
    const col = db.collection("servicios");
    const { id } = req.params;

    const { ObjectId } = await import("mongodb");
    const servicio = await col.findOne({ _id: new ObjectId(id) });

    if (!servicio) {
      return res.status(404).json({ mensaje: "Servicio no encontrado." });
    }

    const nuevoEstado = !servicio.publicado;

    await col.updateOne(
      { _id: new ObjectId(id) },
      {
        $set: {
          publicado: nuevoEstado,
          actualizadoEn: new Date(),
        },
      }
    );

    return res.json({
      mensaje: "Estado de publicación actualizado.",
      publicado: nuevoEstado,
    });
  } catch (error) {
    console.error("Error al cambiar estado publicado:", error);
    return res
      .status(500)
      .json({ mensaje: "Error al actualizar estado de publicación." });
  }
}

// ELIMINAR SERVICIO
export async function eliminarServicio(req, res) {
  try {
    const db = await conectarDB();
    const col = db.collection("servicios");
    const { id } = req.params;

    const { ObjectId } = await import("mongodb");
    const resultado = await col.deleteOne({ _id: new ObjectId(id) });

    if (resultado.deletedCount === 0) {
      return res.status(404).json({ mensaje: "Servicio no encontrado." });
    }

    return res.json({ mensaje: "Servicio eliminado." });
  } catch (error) {
    console.error("Error al eliminar servicio:", error);
    return res
      .status(500)
      .json({ mensaje: "Error al eliminar servicio." });
  }
}
