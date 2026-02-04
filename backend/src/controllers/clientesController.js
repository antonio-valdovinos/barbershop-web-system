// src/controllers/clientesController.js
import { conectarDB } from "../config/db.js";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const { Types } = mongoose;
const SALT_ROUNDS = 10;

/* ============================================================
   REGISTRAR CLIENTE
   Usado por el administrador y por registro público.
============================================================ */
export async function registrarCliente(req, res) {
  try {
    const db = await conectarDB();
    const colClientes = db.collection("clientes");

    const { nombre, correo, telefono, password } = req.body;

    if (!nombre || !correo || !telefono || !password) {
      return res.status(400).json({
        mensaje: "Nombre, correo, teléfono y contraseña son obligatorios",
      });
    }

    const correoNormalizado = correo.trim().toLowerCase();

    const existente = await colClientes.findOne({
      $or: [{ correo: correoNormalizado }, { telefono }],
    });

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    if (!existente) {
      // Crear cliente nuevo
      const clienteId = new Types.ObjectId().toHexString();

      const doc = {
        clienteId,
        nombre,
        correo: correoNormalizado,
        telefono,
        passwordHash,
        fechaRegistro: new Date(),
        citas: [],
        activo: true,
        rol: "cliente",
      };

      const resultado = await colClientes.insertOne(doc);

      return res.status(201).json({
        mensaje: "Cliente creado correctamente",
        _id: resultado.insertedId,
        clienteId,
      });
    }

    // Ya existe pero tiene contraseña → cuenta completa
    if (existente.passwordHash) {
      return res.status(409).json({
        mensaje: "Ya existe un cliente con ese correo o teléfono registrado.",
      });
    }

    // Existe sin contraseña → completar cuenta
    await colClientes.updateOne(
      { _id: existente._id },
      {
        $set: {
          nombre,
          correo: correoNormalizado,
          telefono,
          passwordHash,
        },
      }
    );

    return res.status(200).json({
      mensaje: "Cliente actualizado correctamente (se activó la cuenta).",
      _id: existente._id,
      clienteId: existente.clienteId,
    });
  } catch (error) {
    console.error("Error al registrar cliente:", error);
    return res.status(500).json({ mensaje: "Error en el servidor" });
  }
}

/* ============================================================
   LOGIN CLIENTE / ADMIN
   POST /api/clientes/login
============================================================ */
export async function loginCliente(req, res) {
  try {
    const db = await conectarDB();
    const colClientes = db.collection("clientes");

    const { correo, password } = req.body;

    if (!correo || !password) {
      return res
        .status(400)
        .json({ mensaje: "Correo y contraseña son obligatorios" });
    }

    // ==============================
    //  BYPASS MANUAL PARA EL ADMIN
    // ==============================
    if (correo === "admin@admin.com" && password === "admin") {
      // Intentamos leerlo por si existe en la colección
      const adminDB = await colClientes.findOne({ correo: "admin@admin.com" });

      const base = adminDB || {
        clienteId: "admin001",
        nombre: "Administrador",
        correo: "admin@admin.com",
        telefono: "0000000000"
      };

      return res.json({
        mensaje: "Login correcto (admin)",
        clienteId: base.clienteId,
        nombre: base.nombre,
        correo: base.correo,
        telefono: base.telefono,
        rol: "admin"
      });
    }
    // ====== FIN BYPASS ADMIN ======

    // Login normal de clientes
    const cliente = await colClientes.findOne({ correo });

    if (!cliente) {
      return res.status(404).json({ mensaje: "Cliente no encontrado" });
    }

    if (cliente.activo === false) {
      return res.status(403).json({
        mensaje: "Tu cuenta está inactiva. Contacta a la barbería."
      });
    }

    if (!cliente.passwordHash) {
      return res.status(401).json({
        mensaje:
          "Este cliente aún no tiene contraseña registrada. Pide al administrador que active tu cuenta."
      });
    }

    const ok = await bcrypt.compare(password, cliente.passwordHash);
    if (!ok) {
      return res.status(401).json({ mensaje: "Contraseña incorrecta." });
    }

    const rol = cliente.rol || "cliente";

    return res.json({
      mensaje: "Login correcto",
      clienteId: cliente.clienteId,
      nombre: cliente.nombre,
      correo: cliente.correo,
      telefono: cliente.telefono,
      rol
    });
  } catch (error) {
    console.error("Error en login de cliente:", error);
    return res.status(500).json({ mensaje: "Error en el servidor" });
  }
}


/* ============================================================
   LISTAR CLIENTES
============================================================ */
export async function listarClientes(req, res) {
  try {
    const db = await conectarDB();
    const colClientes = db.collection("clientes");

    const clientes = await colClientes
      .find({})
      .sort({ fechaRegistro: -1 })
      .toArray();

    return res.json(clientes);
  } catch (error) {
    console.error("Error al listar clientes:", error);
    return res.status(500).json({ mensaje: "Error en el servidor" });
  }
}

/* ============================================================
   ACTUALIZAR CLIENTE
============================================================ */
export async function actualizarCliente(req, res) {
  try {
    const db = await conectarDB();
    const colClientes = db.collection("clientes");

    const { id } = req.params;
    const { nombre, correo, telefono, password } = req.body;

    if (!Types.ObjectId.isValid(id)) {
      return res.status(400).json({ mensaje: "ID de cliente inválido" });
    }

    if (!nombre || !correo || !telefono) {
      return res
        .status(400)
        .json({ mensaje: "Nombre, correo y teléfono son obligatorios" });
    }

    const correoNormalizado = correo.trim().toLowerCase();
    const _id = new Types.ObjectId(id);

    const setCampos = {
      nombre,
      correo: correoNormalizado,
      telefono,
    };

    if (password && password.trim() !== "") {
      setCampos.passwordHash = await bcrypt.hash(password.trim(), SALT_ROUNDS);
    }

    await colClientes.updateOne({ _id }, { $set: setCampos });

    return res.json({ mensaje: "Cliente actualizado correctamente" });
  } catch (error) {
    console.error("Error al actualizar cliente:", error);
    return res.status(500).json({ mensaje: "Error en el servidor" });
  }
}

/* ============================================================
   CAMBIAR ESTADO (ACTIVO/INACTIVO)
============================================================ */
export async function cambiarEstadoCliente(req, res) {
  try {
    const db = await conectarDB();
    const colClientes = db.collection("clientes");

    const { id } = req.params;
    const { activo } = req.body;

    if (!Types.ObjectId.isValid(id)) {
      return res.status(400).json({ mensaje: "ID de cliente inválido" });
    }

    if (typeof activo !== "boolean") {
      return res
        .status(400)
        .json({ mensaje: "El campo 'activo' debe ser booleano" });
    }

    const _id = new Types.ObjectId(id);

    const resultado = await colClientes.updateOne(
      { _id },
      { $set: { activo, estado: activo ? "Activo" : "Inactivo" } }
    );

    if (resultado.matchedCount === 0) {
      return res.status(404).json({ mensaje: "Cliente no encontrado" });
    }

    return res.json({ mensaje: "Estado del cliente actualizado correctamente" });
  } catch (error) {
    console.error("Error al cambiar estado del cliente:", error);
    return res.status(500).json({ mensaje: "Error en el servidor" });
  }
}

/* ============================================================
   ELIMINAR CLIENTE
============================================================ */
export async function eliminarCliente(req, res) {
  try {
    const db = await conectarDB();
    const colClientes = db.collection("clientes");
    const colCitas = db.collection("citas");

    const { id } = req.params;

    if (!Types.ObjectId.isValid(id)) {
      return res.status(400).json({ mensaje: "ID de cliente inválido" });
    }

    const _id = new Types.ObjectId(id);
    const cliente = await colClientes.findOne({ _id });

    if (!cliente) {
      return res.status(404).json({ mensaje: "Cliente no encontrado" });
    }

    await colClientes.deleteOne({ _id });

    if (cliente.clienteId) {
      await colCitas.deleteMany({ clienteId: cliente.clienteId });
    }

    return res.json({ mensaje: "Cliente eliminado correctamente" });
  } catch (error) {
    console.error("Error al eliminar cliente:", error);
    return res.status(500).json({ mensaje: "Error en el servidor" });
  }
}
