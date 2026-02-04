import mongoose from "mongoose";

const citaSchema = new mongoose.Schema({
  fecha: String,
  hora: String,
  servicio: String,
  estado: String
});

const clienteSchema = new mongoose.Schema({
  nombre: String,
  telefono: String,
  correo: String,
  fechaRegistro: { type: Date, default: Date.now },
  citas: [citaSchema]
});

export default mongoose.model("Cliente", clienteSchema);
