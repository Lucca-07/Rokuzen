import mongoose from "mongoose";

const PostosAtendimentoSchema = new mongoose.Schema(
  {
    // A definição dos campos está correta
    unidade_id: { type: mongoose.Schema.Types.ObjectId, ref: "Unidades", required: true },
    nome_posto: { type: String, required: true },
    status: { type: String, required: true, default: "Disponível" } 
  },
  {
    
    collection: 'postos_atendimentos' 
  }
);

export default mongoose.model('PostosAtendimento', PostosAtendimentoSchema);