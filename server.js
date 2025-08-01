const express = require('express');
const jwt = require('jsonwebtoken');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 3000;

const JWT_SECRET = 'chave_secreta_supersegura';
const PASSWORD = 'medicina12';

app.use(express.json());
app.use(express.static(__dirname));

app.get('/favicon.ico', (req, res) => {
  res.sendFile(path.join(__dirname, 'favicon.ico'));
});

app.get('/login.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'login.html'));
});
app.get('/index.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});
app.get('/login.css', (req, res) => {
  res.sendFile(path.join(__dirname, 'login.css'));
});
app.get('/estiloControle.css', (req, res) => {
  res.sendFile(path.join(__dirname, 'estiloControle.css'));
});
app.get('/script.js', (req, res) => {
  res.sendFile(path.join(__dirname, 'script.js'));
});
app.get('/inquilinos.json', (req, res) => {
  res.sendFile(path.join(__dirname, 'inquilinos.json'));
});
app.get('/pagamentos.json', (req, res) => {
  res.sendFile(path.join(__dirname, 'pagamentos.json'));
});

app.get('/', (req, res) => {
  res.redirect('/login.html');
});

app.post('/api/login', (req, res) => {
  const { senha } = req.body;
  if (senha === PASSWORD) {
    const token = jwt.sign({ acesso: true }, JWT_SECRET, { expiresIn: '1h' });
    return res.json({ token });
  }
  return res.status(401).json({ erro: 'Senha incorreta' });
});

app.post('/api/validar-token', (req, res) => {
  const token = req.body.token;
  if (!token) return res.status(401).json({ valido: false });

  jwt.verify(token, JWT_SECRET, (err) => {
    if (err) return res.status(403).json({ valido: false });
    return res.json({ valido: true });
  });
});

app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});