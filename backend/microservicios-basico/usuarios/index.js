const express = require("express");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 4201;

app.use(cors());
app.use(express.json());

const usuarios = [];
let nextId = 1;

app.get("/health", (req, res) => {
  res.json({ service: "usuarios", status: "ok" });
});

app.get("/usuarios", (req, res) => {
  res.json(usuarios);
});

app.get("/usuarios/:id", (req, res) => {
  const id = Number(req.params.id);
  const usuario = usuarios.find((item) => item.id === id);
  if (!usuario) return res.status(404).json({ error: "Usuario no encontrado" });
  return res.json(usuario);
});

app.post("/usuarios", (req, res) => {
  const { id: idPropuesto, nombre, email } = req.body;
  if (!nombre || !email) {
    return res.status(400).json({ error: "nombre y email son obligatorios" });
  }
  const id = idPropuesto != null ? Number(idPropuesto) : nextId++;
  if (idPropuesto != null) nextId = Math.max(nextId, id + 1);
  const nuevo = { id, nombre, email };
  usuarios.push(nuevo);
  return res.status(201).json(nuevo);
});

app.put("/usuarios/:id", (req, res) => {
  const id = Number(req.params.id);
  const index = usuarios.findIndex((item) => item.id === id);
  if (index < 0) return res.status(404).json({ error: "Usuario no encontrado" });

  const { nombre, email } = req.body;
  if (!nombre || !email) {
    return res.status(400).json({ error: "nombre y email son obligatorios" });
  }

  usuarios[index] = { id, nombre, email };
  return res.json(usuarios[index]);
});

app.delete("/usuarios/:id", (req, res) => {
  const id = Number(req.params.id);
  const index = usuarios.findIndex((item) => item.id === id);
  if (index < 0) return res.status(404).json({ error: "Usuario no encontrado" });
  usuarios.splice(index, 1);
  return res.status(204).send();
});

app.listen(PORT, () => {
  console.log(`Servicio usuarios ejecutandose en http://localhost:${PORT}`);
});
