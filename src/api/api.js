import express from "express";
import dotenv from "dotenv";
import get_all_users from "./User.js"; // Função que busca todos os usuários
import connectDB from "../modules/connect.js";
import cors from "cors";
app.use(cors());


// Importa as rotas
import userRoutes from "./routes/user.routes.js";
import clientRoutes from "./routes/client.routes.js";
import equipamentoRoutes from "./routes/equipamento.routes.js";

dotenv.config();

const app = express();

// --- Configurações iniciais ---
app.use(express.json());

// --- Conexão com o MongoDB ---
connectDB();

// --- Dados iniciais ---
let users = {
  data: [],
  getNames: () => [],
  getLogin: () => [],
  getType: () => [],
  getState: () => [],
  getPermissions: () => [],
  getUnidades: () => [],
};
(async function loadInitialUserData() {
  users = await get_all_users();
})();

// --- Rotas da API ---
app.use(
  "/users",
  (req, res, next) => {
    req.app.locals.users = users;
    next();
  },
  userRoutes
);

app.use("/clients", clientRoutes);
app.use("/api/equipamentos", equipamentoRoutes);

// --- Inicialização do Servidor ---
const PORT = process.env.PORT || 1234;
app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
});
