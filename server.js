const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Serve arquivos estáticos (CSS/JS/imagens/html) da pasta "public"
app.use(express.static(path.join(__dirname, 'public')));

// Rota da página inicial - entrega paginaInicio.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'paginaInicio.html'));
});

// Se quiser uma rota explícita /inicio também:
app.get('/inicio', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'paginaInicio.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});
