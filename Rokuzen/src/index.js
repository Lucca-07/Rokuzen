import express from "express";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "node:url";
import fs from "fs";

import connectDB from "./modules/connect.js";
import recuperarSenha from "./modules/recuperarSenha.js";
import Colaboradores from "./models/Colaboradores.js";
import Timer from "./models/Timers.js";

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
    const terapeutas = await Colaboradores.find(
      {
        $and: [
          {
            $or: [
              { tipo_colaborador: { $regex: /terapeuta/i } },
              { perfis_usuario: { $in: [/terapeuta/i] } },
            ],
          },
          { $or: [{ ativo: true }, { ativo: { $exists: false } }] },
        ],
      },
      { nome_colaborador: 1, tipo_colaborador: 1, ativo: 1, perfis_usuario: 1 }
    ).lean();


    // Buscar timers correspondentes (por nome_colaborador) e anexar tempoRestante
    try {
      // Primeiro tenta localizar timers por colaborador_id (se o Timer tiver esse campo)
      const ids = terapeutas.map(t => t._id).filter(Boolean);
      const timersById = await Timer.find({ colaborador_id: { $in: ids } }, { colaborador_id: 1, tempoRestante: 1 }).lean();
      const mapaTimersById = new Map(timersById.map(t => [String(t.colaborador_id), t.tempoRestante]));

      // Também busque por nome_colaborador
      const nomes = terapeutas.map(t => t.nome_colaborador).filter(Boolean);
      const timersByName = await Timer.find({ nome_colaborador: { $in: nomes } }, { nome_colaborador: 1, tempoRestante: 1 }).lean();
      const mapaTimersByName = new Map(timersByName.map(t => [t.nome_colaborador, t.tempoRestante]));

      const terapeutasComTimer = terapeutas.map(t => {
        const byId = mapaTimersById.get(String(t._id));
        const byName = mapaTimersByName.get(t.nome_colaborador);
        return { ...t, tempoRestante: byId ?? byName ?? null };
      });

      res.json(terapeutasComTimer);
    } catch (timerErr) {
      // Se houve erro ao buscar timers, retorna terapeutas sem tempo 
      res.json(terapeutas.map(t => ({ ...t, tempoRestante: null })));
    }
  } catch (err) {
    // Em caso de erro, retorna mensagem padrão sem detalhes sensíveis
    res.status(500).json({ error: "Erro ao buscar terapeutas" });
  }
});

// Todos os timers
app.get("/api/timers", async (req, res) => {
  try {
    const timers = await Timer.find();
    res.json(timers);
  } catch (err) {
    console.error("Erro ao buscar timers:", err);
    res.status(500).json({ error: "Erro ao buscar timers" });
  }
});

// Cria ou atualiza um timer para um colaborador
app.post('/api/timers', async (req, res) => {
  try {
    const { colaborador_id, nome_colaborador, tempoRestante, emAndamento } = req.body;
    if (!colaborador_id && !nome_colaborador) return res.status(400).json({ error: 'colaborador_id ou nome_colaborador é necessário' });

    // tenta upsert por colaborador_id primeiro, senão por nome
    const query = colaborador_id ? { colaborador_id } : { nome_colaborador };
    const update = { colaborador_id, nome_colaborador, tempoRestante, emAndamento };
    const opts = { upsert: true, new: true, setDefaultsOnInsert: true };

    const timer = await Timer.findOneAndUpdate(query, update, opts);
    res.json(timer);
  } catch (err) {
    console.error('Erro ao criar/atualizar timer:', err);
    res.status(500).json({ error: 'Erro ao criar/atualizar timer' });
  }
});

// Atualiza um timer (tempo restante / estado)
app.put('/api/timers/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { tempoRestante, emAndamento } = req.body;
    const update = {};
    if (typeof tempoRestante !== 'undefined') update.tempoRestante = tempoRestante;
    if (typeof emAndamento !== 'undefined') update.emAndamento = emAndamento;

    const timer = await Timer.findByIdAndUpdate(id, { $set: update }, { new: true });
    if (!timer) return res.status(404).json({ error: 'Timer não encontrado' });
    res.json(timer);
  } catch (err) {
    console.error('Erro ao atualizar timer:', err);
    res.status(500).json({ error: 'Erro ao atualizar timer' });
  }
});

// Deleta um timer
app.delete('/api/timers/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const timer = await Timer.findByIdAndDelete(id);
    if (!timer) return res.status(404).json({ error: 'Timer não encontrado' });
    res.json({ ok: true });
  } catch (err) {
    console.error('Erro ao deletar timer:', err);
    res.status(500).json({ error: 'Erro ao deletar timer' });
  }
});

// Handler para rotas /api não encontradas,retorna JSON claro em vez de Not Found 
app.use('/api', (req, res) => {
  console.warn('Rota API não encontrada:', req.method, req.originalUrl);
  res.status(404).json({ error: 'Rota API não encontrada', path: req.originalUrl });
});

// Erro 404 para outras rotas, retorna HTML simples
app.use((req, res) => {
  console.warn('Rota não encontrada:', req.method, req.originalUrl);
  if (req.originalUrl.startsWith('/api')) return res.status(404).json({ error: 'Rota API não encontrada' });
  res.status(404).send('Página não encontrada');
});

// --- INICIA SERVIDOR ---
app.listen(port, () => {
  console.log(`Servidor rodando na porta: ${port}`);
});
