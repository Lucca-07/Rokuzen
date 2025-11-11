import mongoose from "mongoose";

const UnidadeSchema = new mongoose.Schema({
  nome_unidade: {
    type: String,
    required: true,
  },
}, {
  collection: "unidade" // altere se sua collection for "unidades"
});

// ✅ Evita o erro "OverwriteModelError"
const Unidade = mongoose.models.Unidade || mongoose.model("Unidade", UnidadeSchema);

export default Unidade;
