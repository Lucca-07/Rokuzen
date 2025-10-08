import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);


const app = express();
const port = 8080;

// Verifique a rota '/vendor' primeiro
app.use("/vendor", express.static(path.join(__dirname, "../node_modules")));
// Depois, sirva os outros arquivos estáticos
app.use(express.static(path.join(__dirname, "../frontend")));

app.get("/postosatendimento" , (req,res)=>{
    res.sendFile(path.join(__dirname, "../frontend/postoatendimento.html"));
})

app.listen(port, ()=>{
    console.log("Servidor rodando na porta: " + port)
})