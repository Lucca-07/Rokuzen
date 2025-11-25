import express from "express";
import mongoose from "mongoose";
import Atendimentos from "../../models/Atendimentos.js";
import Unidade from "../Unidade.js";

const router = express.Router();

// 🔹 Rota para buscar os 5 próximos atendimentos por unidade
router.get("/proximos", async (req, res) => {
  try {
    const { unidade } = req.query;

    if (!unidade) {
      return res.status(400).json({ error: 'Parâmetro "unidade" é obrigatório.' });
    }

    // Buscar unidade pelo nome
    const unidadeEncontrada = await Unidade.findOne({ nome_unidade: unidade });
    if (!unidadeEncontrada) {
      return res.status(404).json({ error: `Unidade "${unidade}" não encontrada.` });
    }

    // Buscar os próximos 5 atendimentos (ordenados por data de criação decrescente)
    const atendimentos = await Atendimento.find({ unidade_id: unidadeEncontrada._id })
      .sort({ createdAt: -1 })
      .limit(5);

    return res.json(atendimentos);
  } catch (error) {
    console.error("Erro ao buscar próximos atendimentos:", error);
    return res.status(500).json({ error: "Erro interno do servidor." });
  }
});

// 🔹 Rota para criar novo atendimento e manter só os 5 mais recentes
router.post("/", async (req, res) => {
  try {
    const { colaborador_id, servico_id, unidade_id, posto_id, dataHora } = req.body;

    if (!colaborador_id || !servico_id || !unidade_id || !posto_id || !dataHora) {
      return res.status(400).json({ error: "Todos os campos são obrigatórios." });
    }

    // Cria o novo atendimento
    const novoAtendimento = new Atendimento({
      colaborador_id,
      servico_id,
      unidade_id,
      posto_id,
      inicio_atendimento: dataHora,
    });

    await novoAtendimento.save();

    // 🔁 Mantém apenas os 5 mais recentes dessa unidade
    const atendimentosUnidade = await Atendimento.find({ unidade_id }).sort({ createdAt: -1 });
    if (atendimentosUnidade.length > 5) {
      const atendimentosParaRemover = atendimentosUnidade.slice(5);
      const idsParaRemover = atendimentosParaRemover.map(a => a._id);
      await Atendimento.deleteMany({ _id: { $in: idsParaRemover } });
    }

    return res.status(201).json({ mensagem: "Agendamento criado com sucesso!" });
  } catch (error) {
    console.error("Erro ao criar atendimento:", error);
    return res.status(500).json({ error: "Erro interno do servidor." });
  }
});

export default router;
