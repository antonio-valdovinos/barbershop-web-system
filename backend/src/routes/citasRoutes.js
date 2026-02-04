// src/routes/citasRoutes.js
import { Router } from "express";

import {
  crearCita,
  obtenerCitasPorCorreo,
  obtenerTodasLasCitas,
  actualizarCita,
  cancelarCita,
  eliminarCita,
  finalizarCita,   // 👈 IMPORTANTE: agregado
} from "../controllers/citasController.js";

const router = Router();

// Crear cita
router.post("/", crearCita);

// Usuario normal
router.get("/usuario/:correo", obtenerCitasPorCorreo);
router.get("/mis-citas", obtenerCitasPorCorreo);

// Admin: obtener todas
router.get("/admin", obtenerTodasLasCitas);

// Admin: acciones sobre una cita
router.put("/:citaId", actualizarCita);              // modificar / reagendar
router.put("/:citaId/cancelar", cancelarCita);       // cancelar
router.put("/:citaId/finalizar", finalizarCita);     // finalizar
router.delete("/:citaId", eliminarCita);             // eliminar


export default router;
