import mongoose from "mongoose";

const atendimentoSchema = new mongoose.Schema({
  colaborador_id: { type: mongoose.Schema.Types.ObjectId, ref: "Colaboradores" },
  tipo_colaborador: { type: String },
  servico_id: { type: String, required: true },
  inicio_atendimento: { type: Date, required: true },
  fim_atendimento: { type: Date, required: true },
  observacao_cliente: { type: String, default: "" },
  tempoRestante: { type: Number },
  em_andamento: { type: Boolean, default: false },
  inicio_real: { type: Date },  
  fim_real: { type: Date }  
  },
  { timestamps: true } 
);

export default mongoose.model("Atendimentos", atendimentoSchema);

