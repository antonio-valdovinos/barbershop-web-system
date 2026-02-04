// src/controllers/horariosController.js
import { conectarDB } from "../config/db.js";

const ID_CONFIG = "config-global";

/**
 * Normaliza una fecha a string "YYYY-MM-DD"
 */
function normalizarFechaISO(valorFecha) {
  try {
    const fecha = new Date(valorFecha);
    if (Number.isNaN(fecha.getTime())) return null;
    return fecha.toISOString().slice(0, 10);
  } catch {
    return null;
  }
}

/**
 * Obtener configuración global de horarios:
 * - horariosSemana: arreglo con los 7 días
 * - diasNoDisponibles: arreglo de strings "YYYY-MM-DD"
 */
export async function obtenerConfiguracionHorarios(req, res) {
  try {
    const db = await conectarDB();
    const colConfig = db.collection("config_horarios");

    // Buscamos el doc global
    let config = await colConfig.findOne({ _id: ID_CONFIG });

    // Si no existe, lo creamos por defecto
    if (!config) {
      config = {
        _id: ID_CONFIG,
        horariosSemana: [],
        diasNoDisponibles: [],
        actualizadoEn: new Date(),
      };
      await colConfig.insertOne(config);
    }

    return res.json({
      horariosSemana: config.horariosSemana || [],
      diasNoDisponibles: config.diasNoDisponibles || [],
    });
  } catch (error) {
    console.error("Error al obtener configuración de horarios:", error);
    return res
      .status(500)
      .json({ mensaje: "Error al obtener configuración de horarios" });
  }
}

/**
 * Guardar / actualizar configuración global de horarios
 * Espera en el body:
 * {
 *   horariosSemana: [...],
 *   diasNoDisponibles: ["YYYY-MM-DD", ...]
 * }
 */
export async function guardarConfiguracionHorarios(req, res) {
  try {
    const db = await conectarDB();
    const colConfig = db.collection("config_horarios");

    let { horariosSemana, diasNoDisponibles } = req.body;

    if (!Array.isArray(horariosSemana)) {
      horariosSemana = [];
    }
    if (!Array.isArray(diasNoDisponibles)) {
      diasNoDisponibles = [];
    }

    // Normalizar días a YYYY-MM-DD y quitar duplicados
    const diasNormalizados = Array.from(
      new Set(
        diasNoDisponibles
          .filter((d) => !!d)
          .map((d) => normalizarFechaISO(d))
          .filter((d) => !!d)
      )
    );

    await colConfig.updateOne(
      { _id: ID_CONFIG },
      {
        $set: {
          horariosSemana,
          diasNoDisponibles: diasNormalizados,
          actualizadoEn: new Date(),
        },
      },
      { upsert: true }
    );

    return res.json({
      mensaje: "Configuración de horarios guardada.",
      diasNoDisponibles: diasNormalizados,
      horariosSemana,
    });
  } catch (error) {
    console.error("Error al guardar configuración de horarios:", error);
    return res
      .status(500)
      .json({ mensaje: "Error al guardar configuración de horarios" });
  }
}

/**
 * GET /api/horarios/dia-bloqueado/:fecha  (fecha = YYYY-MM-DD)
 * Responde si ese día está en diasNoDisponibles.
 */
export async function verificarDiaBloqueado(req, res) {
  try {
    const db = await conectarDB();
    const colConfig = db.collection("config_horarios");

    const { fecha } = req.params; // "YYYY-MM-DD"

    if (!fecha) {
      return res.status(400).json({ mensaje: "Fecha requerida" });
    }

    const config = await colConfig.findOne({ _id: ID_CONFIG });
    const lista = config?.diasNoDisponibles || [];

    const bloqueado = lista.includes(fecha);

    return res.json({
      fecha,
      bloqueado,
    });
  } catch (error) {
    console.error("Error al verificar día bloqueado:", error);
    return res
      .status(500)
      .json({ mensaje: "Error al verificar día bloqueado" });
  }
}

/**
 * (Opcional) Obtener solo la lista de días no disponibles
 * GET /api/horarios/dias-no-disponibles
 */
export async function obtenerDiasNoDisponibles(req, res) {
  try {
    const db = await conectarDB();
    const colConfig = db.collection("config_horarios");

    const config = await colConfig.findOne({ _id: ID_CONFIG });

    return res.json({
      diasNoDisponibles: config?.diasNoDisponibles || [],
    });
  } catch (error) {
    console.error("Error al obtener días no disponibles:", error);
    return res
      .status(500)
      .json({ mensaje: "Error al obtener días no disponibles" });
  }
}
