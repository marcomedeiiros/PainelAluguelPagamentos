const express = require('express');
const jwt = require('jsonwebtoken');
const path = require('path');

const app = express();
const PORT = 3000;

const JWT_SECRET = 'chave_secreta_supersegura';
const PASSWORD = 'medicina12';

app.use(express.json());

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

app.get('/login.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'login.html'));
});

app.get('/index.html', (req, res) => {

  res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/', (req, res) => {
  res.redirect('/login.html');
});

app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});