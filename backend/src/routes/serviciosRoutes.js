// src/routes/serviciosRoutes.js
import { Router } from "express";
import {
  listarServicios,
  crearServicio,
  actualizarServicio,
  togglePublicado,
  eliminarServicio,
} from "../controllers/serviciosController.js";

const router = Router();

// GET /api/servicios  -> lista todos
router.get("/", listarServicios);

// POST /api/servicios -> crear nuevo
router.post("/", crearServicio);

// PUT /api/servicios/:id -> editar datos
router.put("/:id", actualizarServicio);

// PATCH /api/servicios/:id/publicado -> cambiar estado publicado
router.patch("/:id/publicado", togglePublicado);

// DELETE /api/servicios/:id -> eliminar
router.delete("/:id", eliminarServicio);

export default router;
