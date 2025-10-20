import mongoose, { Schema } from "mongoose";

const PostosAtendimentoSchema = new mongoose.Schema({
  nome_posto: { type: String, required: true },
  quantidade_postos: { type: Number, required: true },
  unidade_id: { type: Schema.Types.ObjectId, ref: "Unidades", required: true },
});

export default mongoose.model("Postos_atendimento", PostosAtendimentoSchema);
