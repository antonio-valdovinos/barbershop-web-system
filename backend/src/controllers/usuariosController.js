// src/controllers/usuariosController.js
import { conectarDB } from "../config/db.js";

export async function registrarUsuario(req, res) {
  try {
    const db = await conectarDB();
    const { nombre, correo, password, telefono } = req.body;

    if (!nombre || !correo || !password) {
      return res.status(400).json({ mensaje: "Faltan datos obligatorios." });
    }

    const colUsuarios = db.collection("usuarios");

    // Verificar si ya existe ese correo
    const existente = await colUsuarios.findOne({ correo });
    if (existente) {
      return res
        .status(409)
        .json({ mensaje: "Ya existe una cuenta con ese correo." });
    }

    // Insertar usuario nuevo
    const resultado = await colUsuarios.insertOne({
      nombre,
      correo,
      password, // para la materia lo dejamos plano, en producción debe ir hasheado
      telefono: telefono || null,
      rol: "cliente",
      fechaRegistro: new Date(),
      citas: [] // arreglo preparado para guardar sus citas más adelante
    });

    return res.status(201).json({
      mensaje: "Cuenta creada correctamente.",
      usuarioId: resultado.insertedId
    });
  } catch (error) {
    console.error("Error al registrar usuario:", error);
    return res.status(500).json({ mensaje: "Error en el servidor." });
  }
}

export async function loginUsuario(req, res) {
  try {
    const db = await conectarDB();
    const { correo, password } = req.body;

    if (!correo || !password) {
      return res
        .status(400)
        .json({ mensaje: "Correo y contraseña son requeridos." });
    }

    // Caso especial admin
    if (correo === "admin@admin.com" && password === "admin") {
      return res.json({
        ok: true,
        rol: "admin",
        nombre: "Administrador",
        correo
      });
    }

    const colUsuarios = db.collection("usuarios");
    const usuario = await colUsuarios.findOne({ correo });

    if (!usuario) {
      return res
        .status(404)
        .json({ mensaje: "No existe una cuenta con ese correo." });
    }

    if (usuario.password !== password) {
      return res.status(401).json({ mensaje: "Contraseña incorrecta." });
    }

    return res.json({
      ok: true,
      rol: usuario.rol || "cliente",
      nombre: usuario.nombre,
      correo: usuario.correo
    });
  } catch (error) {
    console.error("Error en login de usuario:", error);
    return res.status(500).json({ mensaje: "Error en el servidor." });
  }
}
