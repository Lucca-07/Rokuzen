const path = require("path")
const express = require("express");
const app = express();
const port = 8080;

// Verifique a rota '/vendor' primeiro
app.use('/vendor', express.static(path.join(__dirname, '../node_modules')));
// Depois, sirva os outros arquivos estáticos
app.use(express.static(path.join(__dirname)));

app.get("/", (req,res)=>{
    res.sendFile(__dirname + "/frontend/index.html")
})


app.listen(8080, ()=>{
    console.log(`Servidor rodando na porta: ${port}`);
})