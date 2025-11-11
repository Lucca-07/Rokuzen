import express from "express";
import Equipamento from "../../models/equipamento.model.js";
import Unidade from "../../models/Unidades.js";

const router = express.Router();

router.get("/disponiveis", async (req, res) => {
  try {
    const { unidade } = req.query;

    if (!unidade) {
      return res.status(400).json({ error: 'Parâmetro "unidade" é obrigatório.' });
    }

    const unidadeEncontrada = await Unidade.findOne({ nome_unidade: unidade });
    if (!unidadeEncontrada) {
      return res.status(404).json({ error: `Unidade "${unidade}" não encontrada.` });
    }

    const equipamentosDisponiveis = await Equipamento.find({
      status: { $regex: /^dispon[ií]vel$/i },
      unidade_id: unidadeEncontrada._id,
    });

    return res.json(equipamentosDisponiveis);
  } catch (error) {
    console.error("Erro ao buscar equipamentos disponíveis:", error);
    return res.status(500).json({ error: "Erro interno do servidor." });
  }
});

export default router;
