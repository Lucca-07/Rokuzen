import mongoose from "mongoose";

const PostoAtendimentoSchema = new mongoose.Schema({
  nome_posto: String,
  status: String,
  unidade_id: mongoose.Schema.Types.ObjectId,
}, { collection: "postos_atendimentos" }); // 👈 importante manter este nome

export default mongoose.model("PostoAtendimento", PostoAtendimentoSchema);
