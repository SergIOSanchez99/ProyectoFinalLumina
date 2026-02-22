const express = require("express");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 4204;

app.use(cors());
app.use(express.json());

const comentarios = [];
let nextId = 1;

app.get("/health", (req, res) => {
  res.json({ service: "comentarios", status: "ok" });
});

app.get("/comentarios", (req, res) => {
  const { temaId } = req.query;
  let result = comentarios;
  if (temaId) {
    result = comentarios.filter((c) => c.temaId === Number(temaId));
  }
  res.json(result);
});

app.get("/comentarios/:id", (req, res) => {
  const id = Number(req.params.id);
  const comentario = comentarios.find((item) => item.id === id);
  if (!comentario) {
    return res.status(404).json({ error: "Comentario no encontrado" });
  }
  return res.json(comentario);
});

app.post("/comentarios", (req, res) => {
  const { contenido, temaId, usuarioId } = req.body;
  if (!contenido || !temaId || !usuarioId) {
    return res
      .status(400)
      .json({ error: "contenido, temaId y usuarioId son obligatorios" });
  }

  const nuevo = {
    id: nextId,
    contenido,
    temaId: Number(temaId),
    usuarioId: Number(usuarioId),
    createdAt: new Date().toISOString()
  };
  nextId += 1;
  comentarios.push(nuevo);

  return res.status(201).json(nuevo);
});

app.put("/comentarios/:id", (req, res) => {
  const id = Number(req.params.id);
  const index = comentarios.findIndex((item) => item.id === id);
  if (index < 0) {
    return res.status(404).json({ error: "Comentario no encontrado" });
  }

  const { contenido, temaId, usuarioId } = req.body;
  if (!contenido || !temaId || !usuarioId) {
    return res
      .status(400)
      .json({ error: "contenido, temaId y usuarioId son obligatorios" });
  }

  comentarios[index] = {
    id,
    contenido,
    temaId: Number(temaId),
    usuarioId: Number(usuarioId),
    createdAt: comentarios[index].createdAt
  };

  return res.json(comentarios[index]);
});

app.delete("/comentarios/:id", (req, res) => {
  const id = Number(req.params.id);
  const index = comentarios.findIndex((item) => item.id === id);
  if (index < 0) {
    return res.status(404).json({ error: "Comentario no encontrado" });
  }

  comentarios.splice(index, 1);
  return res.status(204).send();
});

app.listen(PORT, () => {
  console.log(`Servicio comentarios ejecutandose en http://localhost:${PORT}`);
});
