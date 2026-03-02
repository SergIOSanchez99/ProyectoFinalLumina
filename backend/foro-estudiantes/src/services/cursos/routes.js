const express = require("express");
const { store, nextId } = require("../../data/store");
const db = require("../../db/connection");
const dbCursos = require("../../db/cursos");

const router = express.Router();

router.get("/", async (req, res) => {
  if (db.isConfigured()) {
    const rows = await dbCursos.getAll();
    if (Array.isArray(rows) && rows.length > 0) return res.json(rows);
  }
  return res.json(store.cursos);
});

router.get("/:id", async (req, res) => {
  const id = Number(req.params.id);
  let curso = null;
  if (db.isConfigured()) {
    curso = await dbCursos.getById(id);
  }
  if (!curso) curso = store.cursos.find((c) => c.id === id);
  if (!curso) return res.status(404).json({ error: "Curso no encontrado" });

  const inscritos = store.inscripciones.filter((i) => i.cursoId === id).length;
  const temas = store.temas.filter((t) => t.cursoId === id).length;

  return res.json({ ...curso, stats: { inscritos, temas } });
});

router.post("/", async (req, res) => {
  const { nombre, codigo, descripcion, docente } = req.body;
  if (!nombre || !codigo) {
    return res.status(400).json({ error: "nombre y codigo son obligatorios" });
  }

  const duplicado = store.cursos.some((c) => c.codigo === codigo) ||
    (db.isConfigured() && !!(await dbCursos.getByCodigo(codigo)));
  if (duplicado) return res.status(409).json({ error: "codigo ya existe" });

  if (db.isConfigured()) {
    const creado = await dbCursos.create(nombre, codigo, descripcion || null, docente || null);
    if (creado) {
      store.cursos.push(creado);
      return res.status(201).json(creado);
    }
  }

  const nuevo = {
    id: nextId("cursos"),
    nombre,
    codigo,
    descripcion: descripcion || null,
    docente: docente || null,
    createdAt: new Date().toISOString()
  };
  store.cursos.push(nuevo);
  return res.status(201).json(nuevo);
});

router.put("/:id", async (req, res) => {
  const id = Number(req.params.id);
  const { nombre, codigo, descripcion, docente } = req.body;
  if (!nombre || !codigo) {
    return res.status(400).json({ error: "nombre y codigo son obligatorios" });
  }

  if (db.isConfigured()) {
    const actualizado = await dbCursos.update(id, { nombre, codigo, descripcion, docente });
    if (actualizado) {
      const idx = store.cursos.findIndex((c) => c.id === id);
      if (idx >= 0) store.cursos[idx] = actualizado;
      return res.json(actualizado);
    }
  }

  const idx = store.cursos.findIndex((c) => c.id === id);
  if (idx < 0) return res.status(404).json({ error: "Curso no encontrado" });
  store.cursos[idx] = {
    ...store.cursos[idx],
    nombre,
    codigo,
    descripcion: descripcion || store.cursos[idx].descripcion,
    docente: docente || store.cursos[idx].docente
  };
  return res.json(store.cursos[idx]);
});

router.delete("/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (db.isConfigured()) {
    const ok = await dbCursos.remove(id);
    if (ok) {
      const idx = store.cursos.findIndex((c) => c.id === id);
      if (idx >= 0) store.cursos.splice(idx, 1);
      return res.status(204).send();
    }
  }
  const idx = store.cursos.findIndex((c) => c.id === id);
  if (idx < 0) return res.status(404).json({ error: "Curso no encontrado" });
  store.cursos.splice(idx, 1);
  return res.status(204).send();
});

// --- INSCRIPCIONES ---

router.post("/:id/inscribir", (req, res) => {
  const cursoId = Number(req.params.id);
  const { usuarioId } = req.body;
  if (!usuarioId) return res.status(400).json({ error: "usuarioId es obligatorio" });

  const curso = store.cursos.find((c) => c.id === cursoId);
  const usuario = store.usuarios.find((u) => u.id === Number(usuarioId));
  if (!curso) return res.status(404).json({ error: "Curso no existe" });
  if (!usuario) return res.status(404).json({ error: "Usuario no existe" });

  const yaInscrito = store.inscripciones.some(
    (i) => i.cursoId === cursoId && i.usuarioId === Number(usuarioId)
  );
  if (yaInscrito) return res.status(409).json({ error: "Ya inscrito en este curso" });

  store.inscripciones.push({
    cursoId,
    usuarioId: Number(usuarioId),
    createdAt: new Date().toISOString()
  });

  return res.status(201).json({ message: `Inscrito en ${curso.nombre}` });
});

router.delete("/:id/inscribir", (req, res) => {
  const cursoId = Number(req.params.id);
  const { usuarioId } = req.body;
  if (!usuarioId) return res.status(400).json({ error: "usuarioId es obligatorio" });

  const idx = store.inscripciones.findIndex(
    (i) => i.cursoId === cursoId && i.usuarioId === Number(usuarioId)
  );
  if (idx < 0) return res.status(404).json({ error: "No inscrito en este curso" });

  store.inscripciones.splice(idx, 1);
  return res.json({ message: "Desinscrito del curso" });
});

router.get("/:id/inscritos", (req, res) => {
  const cursoId = Number(req.params.id);
  const ids = store.inscripciones
    .filter((i) => i.cursoId === cursoId)
    .map((i) => i.usuarioId);
  const usuarios = store.usuarios.filter((u) => ids.includes(u.id));
  return res.json(usuarios);
});

module.exports = router;
