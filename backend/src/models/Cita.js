import mongoose from "mongoose";

const citaSchema = new mongoose.Schema({
  clienteId: mongoose.Schema.Types.ObjectId,
  nombreCliente: String,
  telefono: String,
  fecha: String,
  hora: String,
  servicio: String,
  estado: String,
  recordatorioEnviado: { type: Boolean, default: false },
  fechaRegistro: { type: Date, default: Date.now }
});

export default mongoose.model("Cita", citaSchema);
