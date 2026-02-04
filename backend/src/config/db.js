// src/config/db.js
import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const uri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017";
const nombreBD = process.env.MONGODB_DB || "barberia";

export async function conectarDB() {
  // 0 = desconectado, 1 = conectado
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(uri, { dbName: nombreBD });
    console.log("MongoDB conectado a", nombreBD);
  }

  // Usamos directamente el db nativo para poder aplicar operadores de Mongo
  return mongoose.connection.db;
}
