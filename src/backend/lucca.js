import express from "express";
const app = express();
const port = 8080;

import mongoose from "mongoose";
import LoginUsuario from "./LoginUsuario.js";

import dotenv from "dotenv";
dotenv.config();

import path from "path";
import { fileURLToPath } from "node:url";
const dirname = path.dirname(path.dirname(fileURLToPath(import.meta.url)));

import recuperarSenha from "./recuperarSenha.js";

app.use(express.json());

// Conecta ao banco de dados
const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Conectado ao mongodb");
    } catch (error) {
        console.log("Erro ao conectar ao mongodb: ", error);
    }
};
connectDB();

// Verifique a rota '/vendor' primeiro
app.use("/vendor", express.static(path.join(dirname, "../node_modules")));
// Depois, sirva os outros arquivos estáticos
app.use(express.static(path.join(dirname)));

// Rota da Página de Login
app.get("/", (req, res) => {
    res.sendFile(dirname + "/frontend/index.html");
});

app.get("/recuperar", (req, res) => {
    res.sendFile(dirname + "/frontend/recuperarSenha.html");
});

// Verifica o Login
app.post("/login", async (req, res) => {
    const { email, pass } = req.body;
    try {
        const loginUsuario = await LoginUsuario.findOne({
            email: email,
            pass: pass,
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

app.post("/recuperar", async (req, res) => {
    const { emailRecuperacao } = req.body;
    try {
        const emailUsuario = await LoginUsuario.findOne({
            email: emailRecuperacao,
        });
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

app.post("/atualizarSenha", async (req, res) => {
    const { email, newpass } = req.body;
    try {
        // Sintaxe correta: findOneAndUpdate(filtro, atualização, opções)
        const emailUsuario = await LoginUsuario.findOneAndUpdate(
            { email: email }, // Filtro: encontrar o usuário por email
            { $set: { pass: newpass } }, // Atualização: usar $set para modificar o campo 'pass'
            { new: true } // Opções: retornar o documento atualizado
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

app.listen(8080, () => {
    console.log(`Servidor rodando na porta: ${port}`);
});
