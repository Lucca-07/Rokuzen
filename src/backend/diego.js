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
  res.sendFile(path.basename(filePath), { root: frontendDir }, (err) => {
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
    sendHtmlFile(res, path.resolve(frontendDir, arquivo));
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
      { nome_colaborador: 1, tipo_colaborador: 1, unidades_trabalha: 1, imagem: 1 }
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
          em_andamento: { $first: "$em_andamento" },
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
        em_andamento: at?.em_andamento ?? false,
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
      fim_atendimento: data.fim_atendimento || new Date(Date.now() + 60 * 60 * 1000),
      observacao_cliente: data.observacao_cliente || "",
      tempoRestante: typeof data.tempoRestante === "number" ? data.tempoRestante : 3600,
      em_andamento: !!data.em_andamento,
      inicio_real: data.inicio_real || null,
      fim_real: data.fim_real || null
    });

    const saved = await atendimento.save();
    res.status(201).json(saved);

  } catch (err) {
    console.error("❌ Erro ao criar atendimento:", err);
    res.status(400).json({
      error: "Erro ao criar atendimento",
      details: err.message
    });
  }
});

// Atualiza um timer (tempo restante / estado)
app.put("/api/atendimentos/:id", async (req, res) => {
  try {
    const atendimentoId = req.params.id;
    const update = {
      tempoRestante: req.body.tempoRestante,
      em_andamento: req.body.em_andamento
    };

    const atendimento = await Atendimentos.findByIdAndUpdate(atendimentoId, update, { new: true });

    if (!atendimento) return res.status(404).json({ error: "Atendimento não encontrado" });

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
    if (!atendimento) return res.status(404).json({ error: "Atendimento não encontrado" });
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

    // Pegando dados simulados do localStorage (no front  envia via headers ou query)
    const idUser = req.query.idUser || req.query.userId;
    const perfisUsuario = req.query.perfis_usuario?.split(",") || [];

    let filtro = {
      inicio_atendimento: { $gte: hoje, $lt: amanha },
    };

    // Se NÃO tiver perfil Master/Gerente/Recepção, só vê os próprios
    const temAcessoTotal = perfisUsuario.some(p => ["Master", "Gerente", "Recepcao", "Recepção", "recepcao"].includes(p));

    if (!temAcessoTotal) {
      filtro.colaborador_id = new mongoose.Types.ObjectId(idUser);
    }

    const agendamentos = await Atendimentos.find(filtro)
      .populate("colaborador_id", "nome_colaborador")
      .sort({ inicio_atendimento: 1 })
      .lean();

    const dados = agendamentos.map(a => ({
      _id: a._id,
      colaborador: a.colaborador_id?.nome_colaborador || "Desconhecido",
      colaborador_id: a.colaborador_id?._id || null,
      tipo: a.tipo_colaborador || "Serviço",
      inicio_atendimento: a.inicio_atendimento,
      fim_atendimento: a.fim_atendimento,
      tempo: Math.round((new Date(a.fim_atendimento) - new Date(a.inicio_atendimento)) / 60000),
      observacao: a.observacao_cliente || "-",
      em_andamento: !!a.em_andamento,
      encerrado: !!a.encerrado
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

// Pega as imagens do banco
app.get("/api/colaboradores/:id/imagem", async (req, res) => {
  try {
    const colab = await Colaboradores.findById(req.params.id).lean();

    if (!colab || !colab.imagem) {
      return res.sendFile("account-outline.svg", { root: path.join(frontendDir, "img") });
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
    if (!colab) return res.status(404).json({ error: "Colaborador não encontrado" });

    res.json(colab); ''
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
        status: "encerrado"
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

// --- INICIA SERVIDOR ---
app.listen(port, () => {
  console.log(`Servidor rodando na porta: ${port}`);
});