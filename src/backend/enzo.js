import express from "express";
const app = express();
const port = 8080;

import dotenv from "dotenv";
dotenv.config();

import path from "path";
import { fileURLToPath } from "node:url";
const dirname = path.dirname(path.dirname(fileURLToPath(import.meta.url)));

import connectDB from "../modules/connect.js";
connectDB();

import recuperarSenha from "../modules/recuperarSenha.js";
import Colaboradores from "../models/Colaboradores.js";
import Servicos from "../models/Servicos.js";
import Atendimentos from "../models/Atendimentos.js";
import Unidades from "../models/Unidades.js";


app.use(express.json());

// Depois, sirva os outros arquivos estáticos
app.use(express.static(dirname));

// Rota da Página de Login
app.get("/", (req, res) => {
  res.sendFile(path.join(dirname, "src", "frontend", "index.html"));
});

// Rota da Página de Recuperação de senha
app.get("/recuperar", (req, res) => {
  res.sendFile(path.join(dirname, "src", "frontend", "recuperarSenha.html"));
});

app.get("/cadastrar", (req, res) => {
  res.sendFile(path.join(dirname, "src", "frontend", "cadastro.html"));
});

// Verifica o Login
app.post("/login", async (req, res) => {
  const { email, pass } = req.body;
  try {
    const loginUsuario = await Colaboradores.findOne({
      login: { email: email, pass: pass },
    });
    if (loginUsuario) {
      res.json({ validado: true, mensagem: "Login efetuado!" });
      // console.log(loginUsuario.role);
    } else {
      res.status(401).json({
        validado: false,
        mensagem: "Usuário ou senha inválidos",
      });
    }
  } catch (error) {
    res.status(500).json({ validado: false, mensagem: "Erro no servidor" });
  }
});
// Verifica se o email a ser recuperado está no banco de dados
app.post("/recuperar", async (req, res) => {
  const { emailRecuperacao } = req.body;
  try {
    const emailUsuario = await Colaboradores.findOne({
      "login.email": emailRecuperacao,
    });
    console.table(emailUsuario);
    // console.log(emailRecuperacao);
    if (emailUsuario) {
      recuperarSenha(emailRecuperacao);
      res.json({ mensagem: "Email enviado" });
      console.log(emailRecuperacao);
    } else {
      res.status(401).json({
        mensagem: "Email não existente",
      });
      console.log(
        "Tentativa de recuperação com email não existente:",
        emailRecuperacao
      );
    }
  } catch (error) {
    res.status(500).json({ mensagem: "Erro no servidor" });
  }
});
// Pega os dados e atualiza a senha
app.post("/atualizarSenha", async (req, res) => {
  const { email, newpass } = req.body;
  try {
    // Sintaxe correta: findOneAndUpdate(filtro, atualização, opções)
    const emailUsuario = await Colaboradores.findOneAndUpdate(
      { "login.email": email }, // Filtro: encontrar o usuário por email
      { $set: { "login.pass": newpass } },
      { new: true }
    );

    if (emailUsuario) {
      // Envia a resposta de sucesso APENAS UMA VEZ
      res.json({ mensagem: "Senha atualizada com sucesso!" });
    } else {
      // Envia a resposta de erro APENAS UMA VEZ
      res.status(404).json({ mensagem: "Usuário não encontrado." });
    }
  } catch (error) {
    console.error("Erro ao atualizar senha:", error);
    res.status(500).json({ mensagem: "Erro no servidor" });
  }
});

// Rota da página de inicio
app.get("/inicio", (req, res) => {
  res.sendFile(path.join(dirname, "src", "frontend", "paginaInicio.html"));
});

app.get("/postosatendimento", (req, res) => {
  res.sendFile(path.join(dirname, "src", "frontend", "postoatendimento.html"));
});

app.get("/escala", (req, res) => {
  res.sendFile(path.join(dirname, "frontend", "escala.html"));
});

// ROTA PARA BUSCAR TODOS OS COLABORADORES
app.get("/api/colaboradores", async (req, res) => {
  try {
    // Usa .select("nome_colaborador") para buscar o campo correto
    const colaboradores = await Colaboradores.find({ ativo: true }).select("nome_colaborador");
    res.json(colaboradores);
  } catch (error) {
    console.error("Erro ao buscar colaboradores:", error);
    res.status(500).json({ mensagem: "Erro no servidor." });
  }
});

// ROTA PARA BUSCAR TODOS OS SERVIÇOS
app.get("/api/servicos", async (req, res) => {
  try {
    const servicos = await Servicos.find({ ativo: true }).select("nome_servico");
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

app.get("/api/atendimentos", async (req, res) => {
  const { inicio, fim } = req.query; 

  if (!inicio || !fim) {
    return res.status(400).json({ mensagem: "As datas de início e fim são obrigatórias." });
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
      mensagem: "Agendamento atualizado com sucesso!",
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
    const atendimentoExcluido = await Atendimentos.findByIdAndDelete(id);

    if (!atendimentoExcluido) {
      return res.status(404).json({ mensagem: "Agendamento não encontrado." });
    }

    res.json({ mensagem: "Agendamento excluído com sucesso!" });
  } catch (error) {
    console.error("Erro ao excluir agendamento:", error);
    res.status(500).json({ mensagem: "Erro no servidor." });
  }
});


app.post("/escala/atendimento", async (req, res) => {
  const { dataHora, colaborador_id, servico_id, unidade_id } = req.body;

  try {
    const inicioAtendimento = new Date(dataHora);
    const fimAtendimento = new Date(inicioAtendimento);
    fimAtendimento.setMinutes(fimAtendimento.getMinutes() + 60);

    const novoAtendimento = new Atendimentos({
      colaborador_id,
      servico_id,
      unidade_id,
      inicio_atendimento: inicioAtendimento,
      fim_atendimento: fimAtendimento,
      valor_servico: 53,
      cliente_id: null,
      observacao_cliente: null,
      foi_marcado_online: true,
      pacote_id: null
    });

    await novoAtendimento.save();

    
    await novoAtendimento.populate([
        { path: 'colaborador_id', select: 'nome_colaborador' },
        { path: 'servico_id', select: 'nome_servico' }
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

app.get("/sessao", (req, res) => {
  res.sendFile(path.join(dirname, "src", "frontend", "sessao.html"));
});

app.listen(8080, () => {
  console.log(`Servidor rodando na porta: ${port}`);
});
