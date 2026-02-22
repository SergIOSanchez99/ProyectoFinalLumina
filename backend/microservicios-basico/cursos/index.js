const express = require("express");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 4202;

app.use(cors());
app.use(express.json());

const cursos = [];
let nextId = 1;

app.get("/health", (req, res) => {
  res.json({ service: "cursos", status: "ok" });
});

app.get("/cursos", (req, res) => {
  res.json(cursos);
});

app.get("/cursos/:id", (req, res) => {
  const id = Number(req.params.id);
  const curso = cursos.find((item) => item.id === id);
  if (!curso) return res.status(404).json({ error: "Curso no encontrado" });
  return res.json(curso);
});

app.post("/cursos", (req, res) => {
  const { nombre, codigo } = req.body;
  if (!nombre || !codigo) {
    return res.status(400).json({ error: "nombre y codigo son obligatorios" });
  }
  const nuevo = { id: nextId, nombre, codigo };
  nextId += 1;
  cursos.push(nuevo);
  return res.status(201).json(nuevo);
});

app.put("/cursos/:id", (req, res) => {
  const id = Number(req.params.id);
  const index = cursos.findIndex((item) => item.id === id);
  if (index < 0) return res.status(404).json({ error: "Curso no encontrado" });

  const { nombre, codigo } = req.body;
  if (!nombre || !codigo) {
    return res.status(400).json({ error: "nombre y codigo son obligatorios" });
  }

  cursos[index] = { id, nombre, codigo };
  return res.json(cursos[index]);
});

app.delete("/cursos/:id", (req, res) => {
  const id = Number(req.params.id);
  const index = cursos.findIndex((item) => item.id === id);
  if (index < 0) return res.status(404).json({ error: "Curso no encontrado" });
  cursos.splice(index, 1);
  return res.status(204).send();
});

app.listen(PORT, () => {
  console.log(`Servicio cursos ejecutandose en http://localhost:${PORT}`);
});
