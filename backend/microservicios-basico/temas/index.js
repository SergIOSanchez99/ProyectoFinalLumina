const express = require("express");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 4203;

app.use(cors());
app.use(express.json());

const temas = [];
let nextId = 1;

app.get("/health", (req, res) => {
  res.json({ service: "temas", status: "ok" });
});

app.get("/temas", (req, res) => {
  res.json(temas);
});

app.get("/temas/:id", (req, res) => {
  const id = Number(req.params.id);
  const tema = temas.find((item) => item.id === id);
  if (!tema) return res.status(404).json({ error: "Tema no encontrado" });
  return res.json(tema);
});

app.post("/temas", (req, res) => {
  const { titulo, contenido, cursoId, usuarioId } = req.body;
  if (!titulo || !contenido || !cursoId || !usuarioId) {
    return res
      .status(400)
      .json({ error: "titulo, contenido, cursoId y usuarioId son obligatorios" });
  }

  const nuevo = {
    id: nextId,
    titulo,
    contenido,
    cursoId: Number(cursoId),
    usuarioId: Number(usuarioId),
    createdAt: new Date().toISOString()
  };
  nextId += 1;
  temas.push(nuevo);
  return res.status(201).json(nuevo);
});

app.put("/temas/:id", (req, res) => {
  const id = Number(req.params.id);
  const index = temas.findIndex((item) => item.id === id);
  if (index < 0) return res.status(404).json({ error: "Tema no encontrado" });

  const { titulo, contenido, cursoId, usuarioId } = req.body;
  if (!titulo || !contenido || !cursoId || !usuarioId) {
    return res
      .status(400)
      .json({ error: "titulo, contenido, cursoId y usuarioId son obligatorios" });
  }

  temas[index] = {
    id,
    titulo,
    contenido,
    cursoId: Number(cursoId),
    usuarioId: Number(usuarioId),
    createdAt: temas[index].createdAt
  };
  return res.json(temas[index]);
});

app.delete("/temas/:id", (req, res) => {
  const id = Number(req.params.id);
  const index = temas.findIndex((item) => item.id === id);
  if (index < 0) return res.status(404).json({ error: "Tema no encontrado" });
  temas.splice(index, 1);
  return res.status(204).send();
});

app.listen(PORT, () => {
  console.log(`Servicio temas ejecutandose en http://localhost:${PORT}`);
});
