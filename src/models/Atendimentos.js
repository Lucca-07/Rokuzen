import mongoose, { Schema } from "mongoose";


const AtendimentosSchema = new mongoose.Schema({
  unidade_id: { type: Schema.Types.ObjectId, ref: "Unidades", required: true },
  cliente_id: { type: Schema.Types.ObjectId, ref: "Clientes", required: true },
  servico_id: { type: Schema.Types.ObjectId, ref: "Servicos", required: true },
  colaborador_id: { type: Schema.Types.ObjectId, ref: "Colaboradores", required: true },
  inicio_atendimento: { type: Date, required: true },
  fim_atendimento: { type: Date, required: true },
  valor_servico: { type: Number, required: true },
  tipo_pagamento: { type: String, required: true },
  observacao_cliente: { type: String },
  foi_marcado_online: { type: Boolean, required: true },
  pacote_id: { type: Schema.Types.ObjectId, ref: "Pacotes", default: null },
  pontos_gerados: { type: Number, required: true },
});

export default mongoose.model("Atendimentos", AtendimentosSchema);
