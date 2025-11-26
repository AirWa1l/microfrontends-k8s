const express = require("express");
const path = require("path");

const app = express();
app.use(express.json());

// Servir frontend
app.use(express.static(path.join(__dirname, "../frontend")));

// Ruta principal
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/index.html"));
});

app.post("/login", (req, res) => {
  const { user, pass } = req.body;

  if (!user || !pass) {
    return res.status(400).json({ error: "Datos incompletos" });
  }

  const token = `token-${Math.random().toString(36).slice(2)}`;

  return res.json({
    message: "Login exitoso",
    user,
    token
  });
});

app.use((req, res) => {
  res.status(404).sendFile(path.join(__dirname, "../frontend/404.html"));
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).sendFile(path.join(__dirname, "../frontend/500.html"));
});

app.get('/health', (req, res) => {
  res.status(200).send('OK');
});

const PORT = 80;
app.listen(PORT, () => console.log("Auth service corriendo en puerto", PORT));
