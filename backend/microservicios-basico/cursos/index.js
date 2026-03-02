const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 4202;

let db = null;
if (process.env.DB_NAME) {
  try {
    db = require("./config/db");
  } catch (e) {
    console.warn("[cursos] DB no configurada, usando store en memoria");
  }
}

app.use(cors());
app.use(express.json());

const cursos = [];
let nextId = 1;

async function persistCurso(nuevo) {
  if (!db) return;
  try {
    const [result] = await db.execute(
      "INSERT INTO cursos (nombre, codigo, descripcion, docente, universidad) VALUES (?, ?, ?, ?, NULL)",
      [nuevo.nombre, nuevo.codigo, nuevo.descripcion || null, nuevo.docente || null]
    );
    const insertId = result?.insertId;
    if (insertId && insertId !== nuevo.id) {
      nuevo.id = insertId;
    }
  } catch (err) {
    console.warn("[cursos] Error al persistir curso:", err.message);
  }
}

app.get("/health", (req, res) => {
  res.json({ service: "cursos", status: "ok" });
});

app.get("/cursos", async (req, res) => {
  if (db) {
    try {
      const [rows] = await db.execute("SELECT id, nombre, codigo, descripcion, docente, universidad, created_at FROM cursos ORDER BY nombre ASC");
      if (rows && rows.length > 0) {
        return res.json(rows.map((r) => ({ id: r.id, nombre: r.nombre, codigo: r.codigo, descripcion: r.descripcion, docente: r.docente, createdAt: r.created_at })));
      }
    } catch (err) {
      console.warn("[cursos] Error al leer cursos:", err.message);
    }
  }
  res.json(cursos);
});

app.get("/cursos/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (db) {
    try {
      const [rows] = await db.execute("SELECT id, nombre, codigo, descripcion, docente, universidad, created_at FROM cursos WHERE id = ?", [id]);
      if (rows && rows.length > 0) {
        const r = rows[0];
        return res.json({ id: r.id, nombre: r.nombre, codigo: r.codigo, descripcion: r.descripcion, docente: r.docente, createdAt: r.created_at });
      }
    } catch (err) {
      console.warn("[cursos] Error al leer curso:", err.message);
    }
  }
  const curso = cursos.find((item) => item.id === id);
  if (!curso) return res.status(404).json({ error: "Curso no encontrado" });
  return res.json(curso);
});

app.post("/cursos", async (req, res) => {
  const { nombre, codigo, descripcion, docente } = req.body;
  if (!nombre || !codigo) {
    return res.status(400).json({ error: "nombre y codigo son obligatorios" });
  }
  const nuevo = { id: nextId, nombre, codigo, descripcion: descripcion || null, docente: docente || null };
  nextId += 1;
  cursos.push(nuevo);

  await persistCurso(nuevo);

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

const server = app.listen(PORT, () => {
  console.log(`Servicio cursos ejecutandose en http://localhost:${PORT}`);
});

server.on("error", (err) => {
  if (err.code === "EADDRINUSE") {
    console.error(`\n[cursos] Puerto ${PORT} ya está en uso. Ejecuta: .\\scripts\\liberar-puertos.ps1\n`);
    process.exit(1);
  }
  throw err;
});
