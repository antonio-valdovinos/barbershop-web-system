// src/server.js
import express from "express";
import cors from "cors";
import dotenv from "dotenv";

// Rutas
import citasRoutes from "./routes/citasRoutes.js";
import clientesRoutes from "./routes/clientesRoutes.js"; // <- NUEVO
import horariosRoutes from "./routes/horariosRoutes.js";
import serviciosRoutes from "./routes/serviciosRoutes.js";

dotenv.config();

const app = express();
const puerto = process.env.PORT || 4000;

// Middlewares
app.use(cors());
app.use(express.json());

// Rutas principales
app.use("/api/citas", citasRoutes);
app.use("/api/clientes", clientesRoutes); // <- NUEVO
app.use("/api/horarios", horariosRoutes);
app.use("/api/servicios", serviciosRoutes);

// Ruta de prueba
app.get("/api/test", (req, res) => {
  res.json({ ok: true, mensaje: "Backend funcionando correctamente" });
});

// Iniciar servidor
app.listen(puerto, () => {
  console.log(`Servidor escuchando en http://localhost:${puerto}`);
});
