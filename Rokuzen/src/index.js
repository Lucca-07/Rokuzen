import express from "express";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "node:url";
import fs from "fs";
import mongoose from "mongoose";

import connectDB from "./modules/connect.js";
import recuperarSenha from "./modules/recuperarSenha.js";
import Colaboradores from "./models/Colaboradores.js";
import Atendimentos from "./models/Atendimentos.js";


// conectando com banco de dados
dotenv.config();
await connectDB();

const app = express();
const port = process.env.PORT || 8000;

// Caminhos: projectRoot = repositório root, srcDir = <project>/src, frontendDir = <project>/src/frontend
const __filename = fileURLToPath(import.meta.url);
const srcDir = path.dirname(__filename); // .../src
const projectRoot = path.dirname(srcDir);
const frontendDir = path.join(srcDir, "frontend");

app.use(express.json());

// Loga todas as requisições para diagnóstico
app.use((req, res, next) => {
  console.log(new Date().toISOString(), req.method, req.originalUrl);
  next();
});

app.use("/vendor", express.static(path.join(projectRoot, "node_modules")));
// Serve arquivos estáticos do frontend no caminho /frontend (ex: /frontend/js/sessao.js)
app.use("/frontend", express.static(frontendDir));

// --- FUNÇÃO PARA SERVIR HTML ---
function sendHtmlFile(res, filePath) {
  try {
    const stat = fs.statSync(filePath);
    console.log("stat:", { size: stat.size, isFile: stat.isFile() });
  } catch (e) {
    console.error("stat error:", e);
  }
  res.sendFile(filePath, (err) => {
    if (!err) return;
    console.error("sendFile error for", filePath, "->", err);

    try {
      const data = fs.readFileSync(filePath, { encoding: "utf8" });
      res.type("html").send(data);
      console.log("Fallback: sent file contents for", filePath);
    } catch (readErr) {
      console.error("Fallback read error for", filePath, readErr);
      if (!res.headersSent)
        res.status(readErr.code === "ENOENT" ? 404 : 500).send("Error serving file");
    }
  });
}
// --- ROTAS DE FRONTEND ---

const rotasHTML = {
  "/": "index.html",
  "/recuperar": "recuperarSenha.html",
  "/cadastrar": "cadastro.html",
  "/inicio": "paginaInicio.html",
  "/postosatendimento": "postoatendimento.html",
  "/escala": "escala.html",
  "/sessao": "sessao.html",
};

for (const [rota, arquivo] of Object.entries(rotasHTML)) {
  app.get(rota, (req, res) => {
    const filePath = path.join(frontendDir, arquivo);
    console.log(`GET ${rota} ->`, filePath, "exists:", fs.existsSync(filePath));
    sendHtmlFile(res, filePath);
  });
}

// --- LOGIN E RECUPERAÇÃO ---
app.post("/login", async (req, res) => {
  const { email, pass } = req.body;
  try {
    const usuario = await Colaboradores.findOne({ "login.email": email, "login.pass": pass });
    if (usuario) res.json({ validado: true, mensagem: "Login efetuado!" });
    else res.status(401).json({ validado: false, mensagem: "Usuário ou senha inválidos" });
  } catch {
    res.status(500).json({ validado: false, mensagem: "Erro no servidor" });
  }
});

app.post("/recuperar", async (req, res) => {
  const { emailRecuperacao } = req.body;
  try {
    const usuario = await Colaboradores.findOne({ "login.email": emailRecuperacao });
    if (usuario) {
      recuperarSenha(emailRecuperacao);
      res.json({ mensagem: "Email enviado" });
    } else {
      res.status(401).json({ mensagem: "Email não existente" });
    }
  } catch {
    res.status(500).json({ mensagem: "Erro no servidor" });
  }
});

app.post("/atualizarSenha", async (req, res) => {
  const { email, newpass } = req.body;
  try {
    const usuario = await Colaboradores.findOneAndUpdate(
      { "login.email": email },
      { $set: { "login.pass": newpass } },
      { new: true }
    );
    if (usuario) res.json({ mensagem: "Senha atualizada com sucesso!" });
    else res.status(404).json({ mensagem: "Usuário não encontrado." });
  } catch {
    res.status(500).json({ mensagem: "Erro no servidor" });
  }
});

// --- ROTAS DA API ---

// Todos os terapeutas ativos
app.get("/api/terapeutas", async (req, res) => {
  try {
    // Busca todos os terapeutas ativos
    const terapeutas = await Colaboradores.find(
      { /* ... suas condições */ },
      { nome_colaborador: 1, tipo_colaborador: 1, unidade_id: 1 } // <-- Adicione 'unidade_id: 1'
    ).lean();

    // Coleta os IDs dos terapeutas
    const ids = terapeutas.map(t => t._id).filter(Boolean);


    // Buscar timers correspondentes (por nome_colaborador) e anexar tempoRestante
    const atendimentos = await Atendimentos.aggregate([
      { $match: { colaborador_id: { $in: ids } } },
      { $sort: { updatedAt: -1 } },
      {
        $group: {
          _id: "$colaborador_id",
          tempoRestante: { $first: "$tempoRestante" },
          emAndamento: { $first: "$emAndamento" },
          updatedAt: { $first: "$updatedAt" }
        }
      }
    ]);

    // Cria um mapa rápido de consulta por colaborador_id
    const mapaAtendimentos = new Map(atendimentos.map(a => [String(a._id), a]));

    // Junta terapeuta + atendimento
    const terapeutasComAtendimento = terapeutas.map(t => {
      const at = mapaAtendimentos.get(String(t._id));
      return {
        ...t,
        tempoRestante: at?.tempoRestante ?? null,
        emAndamento: at?.emAndamento ?? false,
        ultimoUpdate: at?.updatedAt ?? null
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

// Cria ou atualiza um timer para um colaborador
app.post("/api/atendimentos", async (req, res) => {
  try {
    const { colaborador_id, servico_id, inicio_atendimento, fim_atendimento, tempoRestante, emAndamento, tipo_colaborador } = req.body;
    if (!colaborador_id || !servico_id) {
      return res.status(400).json({ error: "colaborador_id e servico_id são obrigatórios" });
    }

    const update = {
      tipo_colaborador,
      servico_id,
      inicio_atendimento,
      fim_atendimento,
      tempoRestante,
      emAndamento,
    };

    const opts = { upsert: true, new: true, setDefaultsOnInsert: true };
    const atendimento = await Atendimentos.findOneAndUpdate({ colaborador_id, servico_id }, update, opts);

    res.json(atendimento);
  } catch (err) {
    console.error("Erro ao criar/atualizar atendimento:", err);
    res.status(500).json({ error: "Erro ao criar/atualizar atendimento" });
  }
});

// Atualiza um timer (tempo restante / estado)
app.put("/api/atendimentos/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { tempoRestante, emAndamento, observacao_cliente } = req.body;

    const update = {};
    if (typeof tempoRestante !== "undefined") update.tempoRestante = tempoRestante;
    if (typeof emAndamento !== "undefined") update.emAndamento = emAndamento;
    if (typeof observacao_cliente !== "undefined") update.observacao_cliente = observacao_cliente;

    const atendimento = await Atendimentos.findByIdAndUpdate(id, { $set: update }, { new: true });
    if (!atendimento) return res.status(404).json({ error: "Atendimento não encontrado" });

    res.json(atendimento);
  } catch (err) {
    console.error("Erro ao atualizar atendimento:", err);
    res.status(500).json({ error: "Erro ao atualizar atendimento" });
  }
});

// Deleta um timer
app.delete("/api/atendimentos/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const atendimento = await Atendimentos.findByIdAndDelete(id);
    if (!atendimento) return res.status(404).json({ error: "Atendimento não encontrado" });
    res.json({ ok: true });
  } catch (err) {
    console.error("Erro ao deletar atendimento:", err);
    res.status(500).json({ error: "Erro ao deletar atendimento" });
  }
});

// Agendamentos
app.get("/api/agendamentos", async (req, res) => {
  try {
    const idTerapeuta = req.query.id; // ID vindo do front

    if (!idTerapeuta) {
      return res.status(400).json({ mensagem: "ID do terapeuta não informado." });
    }

    // Garante que o ID é um ObjectId válido
    if (!mongoose.Types.ObjectId.isValid(idTerapeuta)) {
      return res.status(400).json({ mensagem: "ID do terapeuta inválido." });
    }

    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    const amanha = new Date(hoje);
    amanha.setDate(hoje.getDate() + 1);

    // Busca os agendamentos do terapeuta apenas para o dia atual
    const agendamentos = await Atendimentos.find({
      colaborador_id: new mongoose.Types.ObjectId(idTerapeuta),
      inicio_atendimento: { $gte: hoje, $lt: amanha }
    })
      .populate("colaborador_id", "nome_colaborador") // traz o nome do colaborador
      .sort({ inicio_atendimento: 1 });

    console.log("Agendamentos do MongoDB:", agendamentos);

    // Mapeia os dados para o formato esperado pelo front
    const dados = agendamentos.map(a => ({
      colaborador: a.colaborador_id?.nome_colaborador || "Desconhecido",
      colaborador_id: a.colaborador_id?._id || null,
      tipo: a.tipo_colaborador || "Serviço",
      inicio_atendimento: a.inicio_atendimento?.toISOString(),
      fim_atendimento: a.fim_atendimento?.toISOString(),
      tempo: Math.round((new Date(a.fim_atendimento) - new Date(a.inicio_atendimento)) / 60000),
      observacao: a.observacao_cliente || "-"
    }));

    res.json(dados);
  } catch (err) {
    console.error("Erro ao carregar agendamentos:", err);
    res.status(500).json({ mensagem: "Erro ao carregar agendamentos" });
  }
});

//  FEEDBACK DOS AGENDAMENTOS
app.put("/api/atendimentos/:id/feedback", async (req, res) => {
  const atendimentoId = req.params.id;
  const { observacao_cliente } = req.body;

  if (!observacao_cliente) {
    return res.status(400).json({ message: "Campo observacao_cliente é obrigatório" });
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




// --- INICIA SERVIDOR ---
app.listen(port, () => {
  console.log(`Servidor rodando na porta: ${port}`);
});
