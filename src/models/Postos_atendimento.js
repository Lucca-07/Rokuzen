import mongoose from "mongoose";

const Postos_AtendimentosSchema = new mongoose.Schema({
  unidade_id: { type: Schema.Types.ObjectId, ref: "Unidades", required: true },
  nome: { type: String, required: true },
  quantidade_postos : { type: Number, required: true }
});
export default mongoose.model('postos_atendimento', Postos_AtendimentosSchema )