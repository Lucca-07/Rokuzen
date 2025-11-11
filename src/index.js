// IMPORTS
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
dotenv.config();
import path from "path";
import { fileURLToPath } from "node:url";
import connectDB from "./modules/connect.js";
connectDB();
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ Conectado ao MongoDB com sucesso"))
  .catch(err => console.error("❌ Erro ao conectar ao MongoDB:", err));

import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";

import equipamentoRoutes from "./api/routes/equipamento.routes.js";
import recuperarSenha from "./modules/recuperarSenha.js";
import Clientes from "./models/Clientes.js";
import Colaboradores from "./models/Colaboradores.js";
import Atendimentos from "./models/Atendimentos.js";
import PostosAtendimento from "./models/PostosAtendimento.js";
import Servicos from "./models/Servicos.js";
import Unidades from "./models/Unidades.js";

// CONSTANTS IMPORTANTES
const dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const port = 8080;

// Middleware para o express entender JSON
app.use(express.json());

// Servir os arquivos estáticos do projeto (CSS, IMG ...)
app.use("/frontend", express.static(path.join(dirname, "frontend")));

app.use("/api/equipamentos", equipamentoRoutes);

// GETS
// Rota da Página de Login
app.get("/", (req, res) => {
  res.sendFile(path.join(dirname, "frontend", "index.html"));
});
// Rota da Página de Recuperação de senha
app.get("/recuperar", (req, res) => {
  res.sendFile(path.join(dirname, "frontend", "recuperarSenha.html"));
});
// Rota para a Página de Cadastro
app.get("/cadastrar/:id", async (req, res) => {
  const id = req.params.id;
  if (!id) return res.redirect("/");
  res.sendFile(path.join(dirname, "frontend", "cadastro.html"));
});
// Rota para a Página de Cadastro
app.get("/user/listar/:id", async (req, res) => {
  const id = req.params.id;
  if (!id) return res.redirect("/");
  res.sendFile(path.join(dirname, "frontend", "listarCadastros.html"));
});
// Rota da página de inicio
app.get("/inicio/:id", async (req, res) => {
  const id = req.params.id;
  if (!id) return res.redirect("/");
  res.sendFile(path.join(dirname, "frontend", "paginaInicio.html"));
});
//Rota da página de postoatendimento
app.get("/postosatendimento/:id", async (req, res) => {
  const id = req.params.id;
  if (!id) return res.redirect("/");
  res.sendFile(path.join(dirname, "frontend", "postoatendimento.html"));
});
//Rota da página de escala
app.get("/escala/:id", async (req, res) => {
  const id = req.params.id;
  if (!id) return res.redirect("/");
  res.sendFile(path.join(dirname, "frontend", "escala.html"));
});
//Rota da página de sessoes
app.get("/sessao/:id", async (req, res) => {
  const id = req.params.id;
  if (!id) return res.redirect("/");
  res.sendFile(path.join(dirname, "frontend", "sessao.html"));
});

app.get("/listarterapeutas", async (req, res) => {
  res.sendFile(path.join(dirname, "frontend", "listarTerapeutas.html"));
});

//Rota da api de listar Terapeutas
app.get("/api/listarterapeutas", async (req, res) => {
  try {
    // Busca os terapeutas
    const terapeutas = await Colaboradores.find({
      perfis_usuario: "Terapeuta",
    });

    const result = [];
    // Ajusta a data atual para UTC
    const agora = new Date();
    const agoraUTC = new Date(
      agora.getTime() - agora.getTimezoneOffset() * 60000
    );
    for (const terapeuta of terapeutas) {
      // Busca atendimento atual (entre início e fim programados)
      const atendimentoAtual = await Atendimentos.findOne({
        colaborador_id: terapeuta._id,
        inicio_atendimento: { $lte: agoraUTC },
        fim_atendimento: { $gt: agoraUTC },
        encerrado: false,
      });

      // Busca atendimento em andamento (mesmo que fora do horário programado)
      const atendimentoEmAndamento = await Atendimentos.findOne({
        colaborador_id: terapeuta._id,
        em_andamento: true,
        encerrado: false,
      });

      // Busca próximo atendimento
      const proximoAtendimento = await Atendimentos.findOne({
        colaborador_id: terapeuta._id,
        inicio_atendimento: { $gt: agoraUTC },
        encerrado: false,
      }).sort({ inicio_atendimento: 1 });
      // Prepara os dados do terapeuta
      const terapeutaInfo = {
        colaborador_id: terapeuta._id,
        nome: terapeuta.nome_colaborador,
        imagem: terapeuta.imagem || "/frontend/img/account-outline.svg",
        status: "Disponível",
        inicio_atendimento: null,
        fim_atendimento: null,
        em_andamento: false,
      };

      // Determina o status e horários
      if (atendimentoEmAndamento) {
        // Se tem atendimento marcado como em_andamento = true
        terapeutaInfo.status = "Em sessão";
        terapeutaInfo.inicio_atendimento =
          atendimentoEmAndamento.inicio_atendimento;
        terapeutaInfo.fim_atendimento = atendimentoEmAndamento.fim_atendimento;
        terapeutaInfo.em_andamento = true;
      } else if (atendimentoAtual) {
        // Se está no horário de um atendimento
        terapeutaInfo.status = "Em sessão";
        terapeutaInfo.inicio_atendimento = atendimentoAtual.inicio_atendimento;
        terapeutaInfo.fim_atendimento = atendimentoAtual.fim_atendimento;
        terapeutaInfo.em_andamento = false;
      } else if (proximoAtendimento) {
        // Se tem próximo atendimento agendado
        terapeutaInfo.status = "Disponível";
        terapeutaInfo.inicio_atendimento =
          proximoAtendimento.inicio_atendimento;
        terapeutaInfo.fim_atendimento = proximoAtendimento.fim_atendimento;
        terapeutaInfo.em_andamento = false;
      }

      result.push(terapeutaInfo);
    }

    // Retorna o resultado
    res.json({ terapeutas: result });
  } catch (error) {
    console.error("Erro:", error);
    res.status(500).json({
      error: "Erro ao listar terapeutas e atendimentos",
    });
  }
});
// Atualiza um timer (tempo restante / estado)
app.put("/api/atendimentos/:id/timer", async (req, res) => {
  try {
    const atendimentoId = req.params.id;
    const update = {
      tempoRestante: req.body.tempoRestante,
      em_andamento: req.body.em_andamento,
    };

    const atendimento = await Atendimentos.findByIdAndUpdate(
      atendimentoId,
      update,
      { new: true }
    );

    if (!atendimento) {
      return res.status(404).json({ error: "Atendimento não encontrado" });
    }

    res.json(atendimento);
  } catch (err) {
    console.error("Erro ao atualizar atendimento:", err);
    res.status(500).json({ error: "Erro interno" });
  }
});
// Rota de API
app.get("/api/colaboradores/:id", checkToken, async (req, res) => {
  const id = req.params.id;
  try {
    // Opcional: garantir que o id do token bate com o id pedido (ou tratar roles/admin)
    if (req.userId !== id) {
      return res.status(403).json({ msg: "Acesso proibido." });
    }

    const user = await Colaboradores.findById(id, "-login.pass");
    if (!user) return res.status(404).json({ msg: "Usuário não encontrado." });

    res.json({ user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Erro no servidor." });
  }
});

app.get("/api/postos", async (req, res) => {
  // Agora também podemos receber 'incluir_posto_id'
  const { unidade_id, incluir_posto_id } = req.query;
  let { status } = req.query;

  if (!unidade_id) {
    return res.status(400).json({ mensagem: "O ID da unidade é obrigatório." });
  }

  try {
    const filtro = { unidade_id: new mongoose.Types.ObjectId(unidade_id) };

    // Lógica para incluir o posto atual E os disponíveis
    if (status === "Disponivel") status = "Disponível";
    // if (status) filtro.status = status;
    // 3. Criamos as condições para o $or
    const condicoesOu = [];
    // Condição 1: Postos com o status desejado (ex: "Disponível")
    if (status) {
      condicoesOu.push({ status: status });
    }

    // Condição 2: O posto específico que está a ser editado
    if (incluir_posto_id && mongoose.Types.ObjectId.isValid(incluir_posto_id)) {
      condicoesOu.push({ _id: new mongoose.Types.ObjectId(incluir_posto_id) });
    } // 4. Se tivermos condições, aplicamos o $or ao filtro principal

    if (condicoesOu.length > 0) {
      filtro.$or = condicoesOu;
    }

    const postos = await PostosAtendimento.find(filtro);
    res.json(postos);
  } catch (error) {
    console.error("❌ Erro ao buscar postos de atendimento:", error);
    res.status(500).json({
      mensagem: "Erro no servidor.",
      erro: error.message,
      stack: error.stack,
    });
  }
});
// ROTA PARA BUSCAR TODOS OS SERVIÇOS
app.get("/api/colaboradores", async (req, res) => {
  try {
    const servicos = await Colaboradores.find({ ativo: true }).select(
      "nome_colaborador"
    );
    res.json(servicos);
  } catch (error) {
    console.error("Erro ao buscar colaboradores:", error);
    res.status(500).json({ mensagem: "Erro no servidor." });
  }
});
// ROTA PARA BUSCAR TODOS OS SERVIÇOS
app.post("/api/servicos", async (req, res) => {
  const { unidade } = req.body;
  try {
    const unidadeEncontrada = await Unidades.findOne({
      nome_unidade: unidade,
    });
    if (!unidadeEncontrada) {
      return res.status(404).json({ mensagem: "Unidade não encontrada." });
    }

    const servicos = await Servicos.find({
      unidade_id: unidadeEncontrada._id,
      ativo: true,
    }).select("nome_servico");

    res.json(servicos);
  } catch (error) {
    console.error("Erro ao buscar serviços:", error);
    res.status(500).json({ mensagem: "Erro no servidor." });
  }
});

app.get("/api/unidades", async (req, res) => {
  try {
    const unidades = await Unidades.find({}).select("nome_unidade");
    res.json(unidades);
  } catch (error) {
    console.error("Erro ao buscar unidades:", error);
    res.status(500).json({ mensagem: "Erro no servidor." });
  }
});

app.get("/api/unidade-por-nome", async (req, res) => {
  const { nome } = req.query; // Recebe o nome via query parameter

  if (!nome) {
    return res
      .status(400)
      .json({ mensagem: "O nome da unidade é obrigatório." });
  }

  try {
    // Procura no banco de dados pela unidade com o nome exato
    const unidade = await Unidades.findOne({ nome_unidade: nome });

    if (!unidade) {
      return res.status(404).json({ mensagem: "Unidade não encontrada." });
    }

    // Retorna o objeto completo da unidade (que inclui o _id)
    res.json(unidade);
  } catch (error) {
    console.error("Erro ao buscar unidade por nome:", error);
    res.status(500).json({ mensagem: "Erro no servidor." });
  }
});
app.get("/api/atendimentos", async (req, res) => {
  const { inicio, fim } = req.query;

  if (!inicio || !fim) {
    return res
      .status(400)
      .json({ mensagem: "As datas de início e fim são obrigatórias." });
  }

  try {
    const atendimentos = await Atendimentos.find({
      inicio_atendimento: {
        $gte: new Date(inicio),
        $lte: new Date(fim),
      },
    })
      .populate("colaborador_id", "nome_colaborador")
      .populate("servico_id", "nome_servico");

    res.json(atendimentos);
  } catch (error) {
    console.error("Erro ao buscar atendimentos:", error);
    res.status(500).json({ mensagem: "Erro no servidor." });
  }
});

app.put("/api/atendimentos/:id", async (req, res) => {
  const { id } = req.params;
  const { colaborador_id, servico_id, unidade_id } = req.body;

  try {
    const atendimentoAtualizado = await Atendimentos.findByIdAndUpdate(
      id,
      {
        colaborador_id,
        servico_id,
        unidade_id,
      },
      { new: true }
    )
      .populate("colaborador_id", "nome_colaborador")
      .populate("servico_id", "nome_servico");

    if (!atendimentoAtualizado) {
      return res.status(404).json({ mensagem: "Agendamento não encontrado." });
    }

    res.json({
      mensagem: "Agendamento atualizado!!",
      atendimento: atendimentoAtualizado,
    });
  } catch (error) {
    console.error("Erro ao atualizar agendamento:", error);
    res.status(500).json({ mensagem: "Erro no servidor." });
  }
});

app.delete("/api/atendimentos/:id", async (req, res) => {
  const { id } = req.params;

  try {
    // 1. Encontra o agendamento ANTES de apagar
    const atendimento = await Atendimentos.findById(id);

    if (!atendimento) {
      return res.status(404).json({ mensagem: "Agendamento não encontrado." });
    }

    // 2. Se usava um posto, liberta-o
    if (atendimento.posto_id) {
      await PostosAtendimento.findByIdAndUpdate(atendimento.posto_id, {
        status: "Disponível",
      });
    }

    // 3. Agora sim, apaga o agendamento
    await Atendimentos.findByIdAndDelete(id);

    res.json({ mensagem: "Agendamento excluído com sucesso!" });
  } catch (error) {
    console.error("Erro ao excluir agendamento:", error);
    res.status(500).json({ mensagem: "Erro no servidor." });
  }
});

app.post("/escala/atendimento", async (req, res) => {
  const {
    dataHora,
    colaborador_id,
    servico_id,
    unidade_id,
    inicio_real,
    fim_real,
    tempo_restante,
    posto_id,
  } = req.body;

  try {
    const inicioAtendimento = new Date(dataHora + "Z");
    const fimAtendimento = new Date(inicioAtendimento);
    fimAtendimento.setMinutes(fimAtendimento.getMinutes() + 60);

    const novoAtendimento = new Atendimentos({
      posto_id,
      colaborador_id,
      servico_id,
      unidade_id,
      inicio_atendimento: inicioAtendimento,
      fim_atendimento: fimAtendimento,
      valor_servico: 53,
      cliente_id: null,
      observacao_cliente: ".", // Apenas a versão correta
      foi_marcado_online: true,
      pacote_id: null,
      em_andamento: false,
      inicio_real: null,
      fim_real: null,
      tempoRestante: 120,
      encerrado: false,
    });

    await novoAtendimento.save();

    if (posto_id) {
      await PostosAtendimento.findByIdAndUpdate(posto_id, {
        status: "Ocupado",
      });
    }

    await novoAtendimento.populate([
      { path: "colaborador_id", select: "nome_colaborador" },
      { path: "servico_id", select: "nome_servico" },
    ]);

    res.status(201).json({
      mensagem: "Agendamento salvo com sucesso!",
      atendimento: novoAtendimento,
    });
  } catch (error) {
    console.error("Erro ao salvar agendamento:", error);
    res.status(500).json({
      mensagem: "Erro interno do servidor ao salvar agendamento.",
      erro: error.message,
    });
  }
});

// Todos os terapeutas ativos
app.get("/api/terapeutas", async (req, res) => {
  try {
    // Busca todos os terapeutas ativos
    const terapeutas = await Colaboradores.find(
      {
        /* ... suas condições */
      },
      {
        nome_colaborador: 1,
        tipo_colaborador: 1,
        unidades_trabalha: 1,
        imagem: 1,
      }
    ).lean();

    // Coleta os IDs dos terapeutas
    const ids = terapeutas.map((t) => t._id).filter(Boolean);

    // Buscar timers correspondentes (por nome_colaborador) e anexar tempoRestante
    const atendimentos = await Atendimentos.aggregate([
      { $match: { colaborador_id: { $in: ids } } },
      { $sort: { updatedAt: -1 } },
      {
        $group: {
          _id: "$colaborador_id",
          tempoRestante: { $first: "$tempoRestante" },
          em_andamento: { $first: "$em_andamento" },
          updatedAt: { $first: "$updatedAt" },
        },
      },
    ]);

    // Cria um mapa rápido de consulta por colaborador_id
    const mapaAtendimentos = new Map(
      atendimentos.map((a) => [String(a._id), a])
    );

    // Junta terapeuta + atendimento
    const terapeutasComAtendimento = terapeutas.map((t) => {
      const at = mapaAtendimentos.get(String(t._id));
      return {
        ...t,
        tempoRestante: at?.tempoRestante ?? null,
        em_andamento: at?.em_andamento ?? false,
        ultimoUpdate: at?.updatedAt ?? null,
      };
    });

    res.json(terapeutasComAtendimento);
  } catch (err) {
    console.error("Erro ao buscar terapeutas:", err);
    res.status(500).json({ error: "Erro ao buscar terapeutas" });
  }
});

// Todos os timers
app.get("/api/atendimentos", async (req, res) => {
  try {
    const atendimentos = await Atendimentos.find();
    res.json(atendimentos);
  } catch (err) {
    console.error("Erro ao buscar atendimentos:", err);
    res.status(500).json({ error: "Erro ao buscar atendimentos" });
  }
});

// rota para listar apenas atendimentos ativos
app.get("/api/atendimentos/ativos", async (req, res) => {
  try {
    const ativos = await Atendimentos.find({ em_andamento: true });
    res.json(ativos);
  } catch (err) {
    console.error("Erro ao buscar atendimentos ativos:", err);
    res.status(500).json({ error: "Erro ao buscar atendimentos ativos" });
  }
});

// Cria ou atualiza um timer para um colaborador
app.post("/api/atendimentos", async (req, res) => {
  try {
    const data = req.body;

    // Cria o objeto com valores padrão
    const atendimento = new Atendimentos({
      colaborador_id: data.colaborador_id || null,
      tipo_colaborador: data.tipo_colaborador || "",
      servico_id: data.servico_id || new mongoose.Types.ObjectId().toString(),
      inicio_atendimento: data.inicio_atendimento || new Date(),
      fim_atendimento:
        data.fim_atendimento || new Date(Date.now() + 60 * 60 * 1000), // +1 hora
      observacao_cliente: data.observacao_cliente || "",
      tempoRestante:
        typeof data.tempoRestante === "number" ? data.tempoRestante : 600,
      em_andamento: !!data.em_andamento,
      inicio_real: data.inicio_real || null,
      fim_real: data.fim_real || null,
    });

    const saved = await atendimento.save();
    res.status(201).json(saved);
  } catch (err) {
    console.error("❌ Erro ao criar atendimento:", err);
    res.status(400).json({
      error: "Erro ao criar atendimento",
      details: err.message,
    });
  }
});

// Atualiza um timer (tempo restante / estado)
app.put("/api/atendimentos/:id", async (req, res) => {
  try {
    const atendimentoId = req.params.id;
    const update = {
      tempoRestante: req.body.tempoRestante,
      em_andamento: req.body.em_andamento,
    };

    const atendimento = await Atendimentos.findByIdAndUpdate(
      atendimentoId,
      update,
      { new: true }
    );

    if (!atendimento)
      return res.status(404).json({ error: "Atendimento não encontrado" });

    res.json(atendimento);
  } catch (err) {
    console.error("Erro ao atualizar atendimento:", err);
    res.status(500).json({ error: "Erro interno" });
  }
});

// Deleta um timer
app.delete("/api/atendimentos/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const atendimento = await Atendimentos.findByIdAndDelete(id);
    if (!atendimento)
      return res.status(404).json({ error: "Atendimento não encontrado" });
    res.json({ ok: true });
  } catch (err) {
    console.error("Erro ao deletar atendimento:", err);
    res.status(500).json({ error: "Erro ao deletar atendimento" });
  }
});

app.get("/api/agendamentos", async (req, res) => {
  try {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const amanha = new Date(hoje);
    amanha.setDate(hoje.getDate() + 1);

    // Pegando dados simulados do localStorage (no front você envia via headers ou query)
    const idUser = req.query.idUser; // ou via header
    const perfisUsuario = req.query.perfis_usuario?.split(",") || [];

    let filtro = {
      inicio_atendimento: { $gte: hoje, $lt: amanha },
    };

    // Se NÃO tiver perfil Master/Gerente/Recepcionista, só vê os próprios
    const temAcessoTotal = perfisUsuario.some((p) =>
      ["Master", "Gerente", "Recepcionista"].includes(p)
    );
    if (!temAcessoTotal) {
      filtro.colaborador_id = idUser;
    }

    const agendamentos = await Atendimentos.find(filtro)
      .populate("colaborador_id", "nome_colaborador")
      .sort({ inicio_atendimento: 1 })
      .lean();

    const dados = agendamentos.map((a) => ({
      _id: a._id,
      colaborador: a.colaborador_id?.nome_colaborador || "Desconhecido",
      colaborador_id: a.colaborador_id?._id || null,
      tipo: a.tipo_colaborador || "Serviço",
      inicio_atendimento: a.inicio_atendimento,
      fim_atendimento: a.fim_atendimento,
      tempo: Math.round(
        (new Date(a.fim_atendimento) - new Date(a.inicio_atendimento)) / 60000
      ),
      observacao: a.observacao_cliente || "-",
      em_andamento: !!a.em_andamento,
      encerrado: !!a.encerrado,
    }));

    res.json(dados);
  } catch (err) {
    console.error("Erro ao carregar agendamentos:", err);
    res.status(500).json({ mensagem: "Erro ao carregar agendamentos" });
  }
});

// Obter um atendimento específico pelo ID
app.get("/api/atendimentos/:id", async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "ID inválido" });
    }

    const atendimento = await Atendimentos.findById(id)
      .populate("colaborador_id", "nome_colaborador")
      .lean();

    if (!atendimento) {
      return res.status(404).json({ error: "Atendimento não encontrado" });
    }

    res.json(atendimento);
  } catch (err) {
    console.error("Erro ao buscar atendimento:", err);
    res.status(500).json({ error: "Erro interno ao buscar atendimento" });
  }
});

//  FEEDBACK DOS AGENDAMENTOS
app.put("/api/atendimentos/:id/feedback", async (req, res) => {
  const atendimentoId = req.params.id;
  const { observacao_cliente } = req.body;

  if (!observacao_cliente) {
    return res
      .status(400)
      .json({ message: "Campo observacao_cliente é obrigatório" });
  }

  if (!mongoose.Types.ObjectId.isValid(atendimentoId)) {
    return res.status(400).json({ message: "ID do atendimento inválido" });
  }

  try {
    const atendimento = await Atendimentos.findByIdAndUpdate(
      atendimentoId,
      { observacao_cliente },
      { new: true }
    );

    if (!atendimento) {
      return res.status(404).json({ message: "Atendimento não encontrado" });
    }

    res.json({ message: "Feedback atualizado com sucesso", atendimento });
  } catch (err) {
    console.error("Erro ao atualizar feedback:", err);
    res.status(500).json({ message: "Erro ao atualizar feedback" });
  }
});

// Pega as imagens do banco
app.get("/api/colaboradores/:id/imagem", async (req, res) => {
  try {
    const colab = await Colaboradores.findById(req.params.id).lean();

    if (!colab || !colab.imagem) {
      return res.sendFile("account-outline.svg", {
        root: path.join(dirname, "frontend", "img"),
      });
    }

    // remover prefixo data:image/jpeg;base64, se existir
    const base64Data = colab.imagem.replace(/^data:image\/\w+;base64,/, "");
    const imgBuffer = Buffer.from(base64Data, "base64");

    res.set("Content-Type", "image/jpeg"); // ou "image/png" se for PNG
    res.send(imgBuffer);
  } catch (err) {
    console.error("Erro ao buscar imagem:", err);
    res.status(500).send("Erro ao buscar imagem");
  }
});

// GET /api/colaboradores/:id
app.get("/api/colaboradores/:id", async (req, res) => {
  try {
    const colab = await Colaboradores.findById(req.params.id).lean();
    if (!colab)
      return res.status(404).json({ error: "Colaborador não encontrado" });

    res.json(colab);
    ("");
  } catch (err) {
    console.error("Erro ao buscar colaborador:", err);
    res.status(500).json({ error: "Erro interno ao buscar colaborador" });
  }
});

// Encerrar atendimento (tempo zerado)
app.put("/api/atendimentos/:id/encerrar", async (req, res) => {
  try {
    const { id } = req.params;

    // Atualiza o atendimento: marca como encerrado, tempo zerado e registra data de término
    const atendimento = await Atendimentos.findByIdAndUpdate(
      id,
      {
        em_andamento: false,
        tempoRestante: 0,
        fim_real: new Date(),
        encerrado: true,
        status: "encerrado",
      },
      { new: true }
    );

    if (!atendimento) {
      return res.status(404).json({ error: "Atendimento não encontrado" });
    }

    res.json({ message: "Atendimento encerrado com sucesso", atendimento });
  } catch (err) {
    console.error("Erro ao encerrar atendimento:", err);
    res.status(500).json({ error: "Erro ao encerrar atendimento" });
  }
});

app.post("/postoatendimento", async (req, res) => {
  const { unidade } = req.body;
  try {
    const unidadeId = await Unidades.findOne({
      nome_unidade: unidade,
    });
    if (!unidadeId) {
      res.status(404).json({
        msg: "Unidade não encontrada",
      });
    }
    const postos = await PostosAtendimento.find({
      unidade_id: unidadeId._id,
    });
    if (!postos) {
      res.status(404).json({
        msg: "Postos não encontrados",
      });
    }
    let quick = [];
    let poltrona = [];
    let maca = [];
    postos.forEach((posto) => {
      switch (posto.nome_posto) {
        case "Cadeira Quick 1":
          quick.push(posto);
          break;
        case "Cadeira Quick 2":
          quick.push(posto);
          break;
        case "Cadeira Quick 3":
          quick.push(posto);
          break;
        case "Cadeira Quick 4":
          quick.push(posto);
          break;
        case "Poltrona de Reflexologia 1":
          poltrona.push(posto);
          break;
        case "Poltrona de Reflexologia 2":
          poltrona.push(posto);
          break;
        case "Sala de Maca 1":
          maca.push(posto);
          break;
        case "Sala de Maca 2":
          maca.push(posto);
          break;
        case "Sala de Maca 3":
          maca.push(posto);
          break;
        case "Sala de Maca 4":
          maca.push(posto);
          break;
        default:
          console.log("Erro");
      }
    });
    res.status(200).json({
      quick: quick,
      poltrona: poltrona,
      maca: maca,
    });
  } catch (error) {}
});

// Atualiza o status de um posto (cadeira, maca, poltrona) pelo ID
app.post("/atualizarStatus", async (req, res) => {
  const { id, status } = req.body;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ msg: "ID inválido" });
  }

  try {
    const resultado = await PostosAtendimento.updateOne(
      { _id: id },
      { $set: { status: status } }
    );

    if (resultado.matchedCount === 0) {
      return res.status(404).json({ msg: "Posto não encontrado" });
    }

    if (resultado.modifiedCount === 0) {
      return res.status(200).json({
        msg: "Nenhuma modificação feita (status igual ao atual).",
      });
    }

    res.status(200).json({ msg: "Status atualizado com sucesso!" });
  } catch (error) {
    console.error(" Erro ao atualizar status:", error);
    res.status(500).json({ msg: "Erro no servidor" });
  }
});

//Função que verifica se o login foi realizado para liberar a página de api
function checkToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ msg: "Acesso negado. Token não fornecido." });
  }

  try {
    const secret = process.env.SECRET;
    const decoded = jwt.verify(token, secret);
    req.userId = decoded.id; // anexa id do token
    next();
  } catch (error) {
    console.log("JWT error:", error);
    return res.status(401).json({ msg: "Token inválido." });
  }
}

// POSTS
// Registrar Usuário
app.post("/auth/user/register", async (req, res) => {
  const {
    nome_colaborador,
    ativo,
    tipo_colaborador,
    unidades_trabalha,
    perfis_usuario,
    imagem,
  } = req.body;
  const { email, pass } = req.body.login;
  if (!nome_colaborador) {
    return res
      .status(422)
      .json({ criado: false, msg: "O nome é obrigatório!" });
  }
  if (!email) {
    return res
      .status(422)
      .json({ criado: false, msg: "O email é obrigatório!" });
  }
  if (!email.includes("@")) {
    return res
      .status(422)
      .json({ criado: false, msg: "Insira um email válido!" });
  }
  if (!pass) {
    return res
      .status(422)
      .json({ criado: false, msg: "A senha é obrigatória!" });
  }
  if (pass.length < 8) {
    return res.status(422).json({
      criado: false,
      msg: "A senha deve ter pelo menos 8 caracteres!",
    });
  }
  if (perfis_usuario[0] == null) {
    return res.status(422).json({
      criado: false,
      msg: "O usuário deve ter pelo menos 1 cargo!",
    });
  }
  if (unidades_trabalha == null) {
    return res.status(422).json({
      criado: false,
      msg: "O usuário deve ter pelo menos 1 unidade!",
    });
  }
  // Checa se ja existe um user com o email
  const userExist = await Colaboradores.findOne({ "login.email": email });
  if (userExist) {
    return res
      .status(422)
      .json({ criado: false, msg: "Por favor utilize outro email" });
  }
  // Cria a senha hash
  const salt = await bcrypt.genSalt(12);
  const passHash = await bcrypt.hash(pass, salt);
  const user = new Colaboradores({
    nome_colaborador,
    ativo,
    tipo_colaborador,
    unidades_trabalha,
    perfis_usuario,
    imagem: imagem || null,
    login: { email, pass: passHash },
  });
  try {
    const novoUser = await Colaboradores.create(user);
    res.status(201).json({
      criado: true,
      msg: "Usuário criado com sucesso!",
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      criado: false,
      msg: "Aconteceu um erro na aplicação!",
    });
  }
});
// Registrar Cliente
app.post("/auth/client/register", async (req, res) => {
  const {
    nome_cliente,
    email_cliente,
    telefone_cliente,
    data_nascimento,
    respostas_saude,
    observacoes,
  } = req.body;
  if (!nome_cliente) {
    return res.status(422).json({ criado: false, msg: "O nome é obrigatório" });
  }
  if (!email_cliente) {
    return res
      .status(422)
      .json({ criado: false, msg: "O email é obrigatório" });
  }
  if (!email_cliente.includes("@")) {
    return res
      .status(422)
      .json({ criado: false, msg: "Insira um email válido!" });
  }
  if (!telefone_cliente) {
    return res
      .status(422)
      .json({ criado: false, msg: "O telefone é obrigatório" });
  }
  if (!data_nascimento) {
    return res.status(422).json({
      criado: false,
      msg: "A data de nascimento é obrigatória",
    });
  }
  if (!respostas_saude) {
    return res.status(422).json({
      criado: false,
      msg: "As respostas de saúde são obrigatórias",
    });
  }
  // Checa se ja existe um user com o email
  const userExist = await Clientes.findOne({
    email_cliente: email_cliente,
  });
  if (userExist) {
    return res.status(422).json({ criado: false, msg: "Email ja está em uso" });
  }

  const cliente = new Clientes({
    nome_cliente,
    email_cliente,
    telefone_cliente,
    data_nascimento,
    respostas_saude,
    observacoes,
  });
  try {
    const novoCliente = await Clientes.create(cliente);
    res.status(201).json({
      criado: true,
      msg: "Cliente criado com sucesso!",
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      criado: false,
      msg: "Aconteceu um erro na aplicação!",
    });
  }
});
// Verifica o Login
app.post("/auth/login", async (req, res) => {
  const { email, pass } = req.body;
  if (!email) {
    return res.status(422).json({ msg: "O email é obrigatório" });
  }
  if (!pass) {
    return res.status(422).json({ msg: "A senha é obrigatório" });
  }
  // Chegar se o colaborador existe
  const user = await Colaboradores.findOne({ "login.email": email });
  if (!user) {
    return res.status(404).json({ msg: "Email não encontrado" });
  }
  // Chega a senha do user
  const checkPass = await bcrypt.compare(pass, user.login.pass);
  if (!checkPass) {
    return res.status(422).json({ msg: "Senha inválida" });
  }

  try {
    const secret = process.env.SECRET;

    const token = jwt.sign({ id: user._id }, secret, { expiresIn: "8h" });

    res.status(200).json({
      msg: "Autenticação realizada com sucesso",
      token: token,
      validado: true,
      redirect: `/inicio/${user._id}`,
      id: user._id,
      unidades: user.unidades_trabalha,
      tipoUser: user.tipo_colaborador,
      perfis_usuario: user.perfis_usuario,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json("Aconteceu um erro na aplicação!");
  }
});
// Verifica se o email a ser recuperado está no banco de dados
app.post("/recuperar", async (req, res) => {
  const { emailRecuperacao } = req.body;
  try {
    const emailUsuario = await Colaboradores.findOne({
      "login.email": emailRecuperacao,
    });
    // console.log(emailRecuperacao);
    if (emailUsuario) {
      recuperarSenha(emailRecuperacao);
      res.json({ msg: "Email enviado" });
    } else {
      res.status(401).json({
        msg: "Email não existente",
      });
      console.log(
        "Tentativa de recuperação com email não existente:",
        emailRecuperacao
      );
    }
  } catch (error) {
    res.status(500).json({ msg: "Erro no servidor" });
  }
});
// Pega os dados e atualiza a senha
app.post("/atualizarSenha", async (req, res) => {
  const { email, newpass } = req.body;

  const salt = await bcrypt.genSalt(12);
  const passHash = await bcrypt.hash(newpass, salt);
  try {
    // Sintaxe correta: findOneAndUpdate(filtro, atualização, opções)
    const emailUsuario = await Colaboradores.findOneAndUpdate(
      { "login.email": email }, // Filtro: encontrar o usuário por email
      {
        $set: {
          "login.pass": passHash,
        },
      },
      { new: true }
    );

    if (emailUsuario) {
      res.json({ msg: "Senha atualizada com sucesso!" });
    } else {
      res.status(404).json({ msg: "Usuário não encontrado." });
    }
  } catch (error) {
    console.error("Erro ao atualizar senha:", error);
    res.status(500).json({ msg: "Erro no servidor" });
  }
});
// Pega os dados do Colaborador e envia ao front
app.post("/api/user/listar", async (req, res) => {
  try {
    const users = await Colaboradores.find();
    if (!users || users.length === 0) {
      return res.status(422).json({ msg: "Nenhum usuário encontrado!" });
    }
    res.status(200).json({ users });
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Erro no servidor" });
  }
});
// Pega os dados do Colaborador do front e deleta no banco
app.post("/api/user/deletar", async (req, res) => {
  const { id } = req.body;
  try {
    const user = await Colaboradores.findById(id);
    if (!user) {
      return res.status(422).json({
        msg: "Usuário não encontrado!",
      });
    }
    await Colaboradores.findByIdAndDelete(id);
    res.status(200).json({
      msg: "Usuário deletado com sucesso!",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Erro no servidor" });
  }
});
app.post("/api/user/edit", async (req, res) => {
  const { id } = req.body;
  try {
    const user = await Colaboradores.findById(id);
    if (!user) {
      return res.status(422).json({
        msg: "Usuário não encontrado!",
      });
    }
    const salt = await bcrypt.genSalt(12);
    res.status(200).json({
      data: user,
      id: user._id,
      nome: user.nome_colaborador,
      email: user.login.email,
      perfis: user.perfis_usuario,
      unidades: user.unidades_trabalha,
      imagem: user.imagem,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Erro no servidor!" });
  }
});
app.put("/api/user/update", async (req, res) => {
  const { id, nome, email, perfis, unidades, imagem } = req.body;

  if (!id) {
    return res.status(400).json({ msg: "ID do usuário é obrigatório" });
  }

  try {
    // Converter id para ObjectId do Mongo
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ msg: "ID inválido" });
    }

    // Atualizar o usuário
    const result = await Colaboradores.findByIdAndUpdate(
      id,
      {
        nome_colaborador: nome,
        "login.email": email,
        perfis_usuario: perfis,
        unidades_trabalha: unidades,
        imagem: imagem,
      },
      { new: true } // retorna o documento atualizado
    );

    if (!result) {
      return res.status(404).json({ msg: "Usuário não encontrado" });
    }

    res.json({ success: true, user: result });
  } catch (err) {
    console.error("Erro ao atualizar usuário:", err);
    res.status(500).json({ msg: "Erro no servidor", error: err.message });
  }
});

// SERVER
// Faz o servidor rodar
app.listen(port, () => {
  console.log(`Servidor rodando na porta: ${port}`);
});
