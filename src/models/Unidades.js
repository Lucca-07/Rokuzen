import mongoose from "mongoose";

const UnidadesSchema = new mongoose.Schema({
  nome_unidade: { type: String, required: true },
});

export default mongoose.model("Unidades", UnidadesSchema);
