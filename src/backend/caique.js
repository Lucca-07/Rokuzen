import express from "express";
const app = express();
const port = 8080;

const dirname = path.dirname(fileURLToPath(import.meta.url));
app.use(express.static(dirname));

import dotenv from "dotenv";
dotenv.config();

import path from "path";
import { fileURLToPath } from "node:url";

import connectDB from "./modules/connect.js";
connectDB();

import recuperarSenha from "./modules/recuperarSenha.js";
import Clientes from "../src/models/Clientes.js";
import Colaboradores from "../src/models/Colaboradores.js";
import PostosAtendimento from "./models/PostosAtendimento.js";
import Unidades from "./models/Unidades.js";
import mongoose from "mongoose";

app.use(express.json());

// Verifique a rota '/vendor' primeiro
app.use("/vendor", express.static(path.join(dirname, "../node_modules")));
// Depois, sirva os outros arquivos estáticos
app.use(express.static(path.join(dirname, "src")));

// Rota da Página de Login
app.get("/", (req, res) => {
    res.sendFile(path.join(dirname, "frontend", "index.html"));
});

// Rota da Página de Recuperação de senha
app.get("/recuperar", (req, res) => {
    res.sendFile(path.join(dirname, "frontend", "recuperarSenha.html"));
});

app.get("/cadastrar", (req, res) => {
    res.sendFile(path.join(dirname, "frontend", "cadastro.html"));
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
    res.sendFile(path.join(dirname, "frontend", "paginaInicio.html"));
});

app.get("/postosatendimento", (req, res) => {
    res.sendFile(path.join(dirname, "frontend", "postoatendimento.html"));
});

app.get("/escala", (req, res) => {
    res.sendFile(path.join(dirname, "src", "frontend", "escala.html"));
});

app.get("/sessao", (req, res) => {
    res.sendFile(path.join(dirname, "src", "frontend", "sessao.html"));
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
                case "Cadeira Quick":
                    quick.push(posto);
                    break;
                case "Poltrona de Reflexologia":
                    poltrona.push(posto);
                    break;
                case "Sala de Maca":
                    maca.push(posto);
                    break;
                default:
                    console.log("Erro");
            }
        });
        console.log(quick, poltrona, maca);
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

    console.log("📩 Dados recebidos para atualizar:", { id, status });

    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ msg: "ID inválido" });
    }

    try {
        const resultado = await PostosAtendimento.updateOne(
            { _id: id },
            { $set: { status: status } }
        );

        console.log("🧾 Resultado do update:", resultado);

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

app.listen(8080, () => {
    console.log(`Servidor rodando na porta: ${port}`);
});
