import equipamentoModel from "../models/equipamento.model.js";
import PostoAtendimento from "../models/equipamento.model.js";

// GET - Buscar todos os postos
export const getPostosAtendimento = async (req, res) => {
  try {
    const postos = await PostoAtendimento.find();
    return res.status(200).json(postos);
  } catch (error) {
    console.error("Erro ao buscar postos:", error);
    return res.status(500).json({ message: "Erro ao buscar postos de atendimento" });
  }
};

// GET - Buscar somente os disponíveis
export const getPostosDisponiveis = async (req, res) => {
  try {
    // Usa regex para aceitar "Disponível", "disponivel", etc.
    const postosDisponiveis = await PostoAtendimento.find({
      status: { $regex: /^dispon[ií]vel$/i }
    });

    return res.status(200).json(postosDisponiveis);
  } catch (error) {
    console.error("Erro ao buscar postos disponíveis:", error);
    return res.status(500).json({ message: "Erro ao buscar postos disponíveis" });
  }
};

// POST - Criar novo posto
export const createPostoAtendimento = async (req, res) => {
  try {
    const novoPosto = new PostoAtendimento(req.body);
    await novoPosto.save();
    return res.status(201).json(novoPosto);
  } catch (error) {
    console.error("Erro ao criar posto:", error);
    return res.status(500).json({ message: "Erro ao criar posto de atendimento" });
  }
};

// GET - Buscar postos disponíveis por unidade
export const getPostosPorUnidade = async (req, res) => {
  try {
    const { unidadeId } = req.params;
    if (!unidadeId) {
      return res.status(400).json({ message: "ID da unidade é obrigatório." });
    }

    const postos = await PostoAtendimento.find({
      unidade_id: unidadeId,
      status: "Disponível"
    });

    if (!postos || postos.length === 0) {
      return res.status(404).json({ message: "Nenhum posto disponível para esta unidade." });
    }

    return res.status(200).json(postos);
  } catch (error) {
    console.error("Erro ao buscar postos por unidade:", error);
    return res.status(500).json({ message: "Erro ao buscar postos da unidade." });
  }
};

export default equipamentoModel;
