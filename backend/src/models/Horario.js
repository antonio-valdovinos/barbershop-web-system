import mongoose from "mongoose";

const horarioSchema = new mongoose.Schema({
  dia: String,
  horasDisponibles: [String]
});

export default mongoose.model("Horario", horarioSchema);
