import express from "express";
const app = express();
const port = 8080;

import path from "path";
import { fileURLToPath } from "node:url";
const dirname = path.dirname(path.dirname(fileURLToPath(import.meta.url)));


// Verifique a rota '/vendor' primeiro
app.use("/vendor", express.static(path.join(dirname, "../node_modules")));
// Depois, sirva os outros arquivos estáticos
app.use(express.static(path.join(dirname)));

// Rota da página de inicio
app.get("/inicio", (req, res) => {
    res.sendFile(dirname + "/frontend/paginaInicio.html");
});

app.listen(port, () => {
    console.log(`Servidor rodando na porta: ${port}`);
});
