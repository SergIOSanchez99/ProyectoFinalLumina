const express = require("express");
const cors = require("cors");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });
const db = require("./config/db");

const app = express();
const PORT = process.env.PORT || 4204;

app.use(cors());
app.use(express.json());

app.get("/health", (req, res) => {
  res.json({ service: "comentarios", status: "ok" });
});

app.get("/comentarios", async (req, res) => {
  try {
    const { publicacion_id } = req.query;
    let query = "SELECT * FROM comentarios";
    const params = [];

    if (publicacion_id) {
      query += " WHERE publicacion_id = ?";
      params.push(Number(publicacion_id));
    }

    const [rows] = await db.execute(query, params);
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al obtener comentarios" });
  }
});

app.get("/comentarios/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const [rows] = await db.execute("SELECT * FROM comentarios WHERE id = ?", [id]);
    if (rows.length === 0) {
      return res.status(404).json({ error: "Comentario no encontrado" });
    }
    res.json(rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al obtener comentario" });
  }
});

app.post("/comentarios", async (req, res) => {
  try {
    const { usuario_id, publicacion_id, parent_id, contenido, es_solucion } = req.body;

    if (!usuario_id || !publicacion_id || !contenido) {
      return res.status(400).json({ error: "usuario_id, publicacion_id y contenido son obligatorios" });
    }

    const query = `
      INSERT INTO comentarios (usuario_id, publicacion_id, parent_id, contenido, es_solucion) 
      VALUES (?, ?, ?, ?, ?)
    `;
    const params = [
      Number(usuario_id),
      Number(publicacion_id),
      parent_id ? Number(parent_id) : null,
      contenido,
      es_solucion || false
    ];

    const [result] = await db.execute(query, params);

    res.status(201).json({
      id: result.insertId,
      usuario_id: Number(usuario_id),
      publicacion_id: Number(publicacion_id),
      parent_id: parent_id ? Number(parent_id) : null,
      contenido,
      es_solucion: es_solucion || false
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al crear comentario" });
  }
});

app.put("/comentarios/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { contenido, es_solucion } = req.body;

    if (!contenido) {
      return res.status(400).json({ error: "contenido es obligatorio para actualizar" });
    }

    const [result] = await db.execute(
      "UPDATE comentarios SET contenido = ?, es_solucion = ? WHERE id = ?",
      [contenido, es_solucion || false, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Comentario no encontrado" });
    }

    const [rows] = await db.execute("SELECT * FROM comentarios WHERE id = ?", [id]);
    res.json(rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al actualizar comentario" });
  }
});

app.delete("/comentarios/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const [result] = await db.execute("DELETE FROM comentarios WHERE id = ?", [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Comentario no encontrado" });
    }

    res.status(204).send();
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al eliminar comentario" });
  }
});

const server = app.listen(PORT, () => {
  console.log(`Servicio comentarios ejecutandose en http://localhost:${PORT}`);
});

server.on("error", (err) => {
  if (err.code === "EADDRINUSE") {
    console.error(`\n[comentarios] Puerto ${PORT} ya está en uso. Ejecuta: .\\scripts\\liberar-puertos.ps1\n`);
    process.exit(1);
  }
  throw err;
});
