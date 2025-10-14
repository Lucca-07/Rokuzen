import mongoose from "mongoose";

const TimerSchema = new mongoose.Schema({
  colaborador_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Colaboradores' },
  nome_colaborador: { type: String },
  tipo_colaborador: { type: String },
  tempoRestante: { type: Number }, // em segundos
  emAndamento: { type: Boolean, default: false },
}, { timestamps: true });

const Timer = mongoose.model("Timer", TimerSchema);

export default Timer;