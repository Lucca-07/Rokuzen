import express from "express";
const app = express();
// Use PORT from environment if provided, otherwise default to 8000
const port = process.env.PORT || 8000;

import dotenv from "dotenv";
dotenv.config();

import path from "path";
import { fileURLToPath } from "node:url";
import fs from "fs";
const dirname = path.dirname(path.dirname(fileURLToPath(import.meta.url)));

import connectDB from "./modules/connect.js";
connectDB();

import recuperarSenha from "./modules/recuperarSenha.js";
import Clientes from "../src/models/Clientes.js";
import Colaboradores from "../src/models/Colaboradores.js";

app.use(express.json());

// Verifique a rota '/vendor' primeiro
app.use("/vendor", express.static(path.join(dirname, "../node_modules")));
// Depois, sirva os outros arquivos estáticos
app.use(express.static(path.join(dirname, "src")));

// Rota da Página de Login
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
            if (!res.headersSent) res.status(readErr.code === 'ENOENT' ? 404 : 500).send("Error serving file");
        }
    });
}

app.get("/", (req, res) => {
    const filePath = path.join(dirname, "src", "frontend", "index.html");
    console.log("GET / ->", filePath, "exists:", fs.existsSync(filePath));
    sendHtmlFile(res, filePath);
});

// Rota da Página de Recuperação de senha
app.get("/recuperar", (req, res) => {
    const filePath = path.join(dirname, "src", "frontend", "recuperarSenha.html");
    console.log("GET /recuperar ->", filePath, "exists:", fs.existsSync(filePath));
    sendHtmlFile(res, filePath);
});

app.get("/cadastrar", (req, res) => {
    const filePath = path.join(dirname, "src", "frontend", "cadastro.html");
    console.log("GET /cadastrar ->", filePath, "exists:", fs.existsSync(filePath));
    sendHtmlFile(res, filePath);
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
    const filePath = path.join(dirname, "src", "frontend", "paginaInicio.html");
    console.log("GET /inicio ->", filePath, "exists:", fs.existsSync(filePath));
    sendHtmlFile(res, filePath);
});

app.get("/postosatendimento", (req, res) => {
    const filePath = path.join(dirname, "src", "frontend", "postoatendimento.html");
    console.log("GET /postosatendimento ->", filePath, "exists:", fs.existsSync(filePath));
    sendHtmlFile(res, filePath);
});

app.get("/escala", (req, res) => {
    const filePath = path.join(dirname, "src", "frontend", "escala.html");
    console.log("GET /escala ->", filePath, "exists:", fs.existsSync(filePath));
    sendHtmlFile(res, filePath);
});

app.get("/sessao", (req, res) => {
    const filePath = path.join(dirname, "src", "frontend", "sessao.html");
    console.log("GET /sessao ->", filePath, "exists:", fs.existsSync(filePath));
    sendHtmlFile(res, filePath);
});

app.listen(port, () => {
    console.log(`Servidor rodando na porta: ${port}`);
});
