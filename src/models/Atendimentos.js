import mongoose from "mongoose";

const atendimentoSchema = new mongoose.Schema(
  {
    unidade_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Unidades",
      required: true,
    },
    cliente_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Clientes",
      default: null,
    },
    servico_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Servicos",
      required: true,
    },
    colaborador_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Colaboradores",
      required: true,
    },
    inicio_atendimento: { type: Date, required: true },
    fim_atendimento: { type: Date, required: true },
    valor_servico: { type: Number, required: true },
    observacao_cliente: { type: String, default: null }, 
    foi_marcado_online: { type: Boolean, default: true },
    pacote_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Pacotes",
      default: null,
    },
  
    em_andamento: { type: Boolean, default: false },
    inicio_real: { type: Date, default: null },
    fim_real: { type: Date, default: null },
    tempoRestante: { type: Number },
  },
  { 
    collection: "atendimentos",
    timestamps: true 
  }
);

export default mongoose.model("Atendimentos", atendimentoSchema);