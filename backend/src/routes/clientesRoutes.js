// src/routes/clientesRoutes.js
import { Router } from "express";
import {
  registrarCliente,
  loginCliente,
  listarClientes,
  actualizarCliente,
  cambiarEstadoCliente,
  eliminarCliente,
} from "../controllers/clientesController.js";

const router = Router();

// Registrar cliente (admin o registro público)
router.post("/", registrarCliente);

// Login de cliente
router.post("/login", loginCliente);

// Listar clientes (para el panel admin)
router.get("/", listarClientes);

// Actualizar datos de cliente
router.put("/:id", actualizarCliente);

// Cambiar estado activo/inactivo
router.patch("/:id/estado", cambiarEstadoCliente);

// Eliminar cliente
router.delete("/:id", eliminarCliente);

export default router;
