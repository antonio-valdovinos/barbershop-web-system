// src/routes/horarios.routes.js
import { Router } from "express";
import {
  obtenerConfiguracionHorarios,
  guardarConfiguracionHorarios,
  verificarDiaBloqueado,
  obtenerDiasNoDisponibles,
} from "../controllers/horariosController.js";

const router = Router();

// 🔹 Configuración global de horarios (admin)
router.get("/config", obtenerConfiguracionHorarios);
router.put("/config", guardarConfiguracionHorarios);

// 🔹 Obtener solo la lista de días no disponibles (para pintar calendarios)
router.get("/dias-no-disponibles", obtenerDiasNoDisponibles);

// 🔹 Comprobar si un día específico está bloqueado (para validar agendar cita)
router.get("/dia-bloqueado/:fecha", verificarDiaBloqueado);

export default router;
