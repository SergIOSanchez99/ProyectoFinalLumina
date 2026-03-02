const express = require("express");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const {
  store,
  nextId,
  getUsuarioById,
  ensureCursoGeneral,
  getTemas,
  getTemaById,
  createTema,
  updateTema,
  deleteTema,
  getComentariosByTemaId,
  createComentario,
  getReacciones,
  getTemaTags,
  setTemaTags
} = require("../../data/dataLayer");

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || "lumina-secret-dev";

function authMiddleware(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith("Bearer ")) {
    return res.status(401).json({ message: "No autorizado" });
  }
  try {
    const decoded = jwt.verify(auth.slice(7), JWT_SECRET);
    req.userId = decoded.id;
    next();
  } catch {
    return res.status(401).json({ message: "Token inválido" });
  }
}

async function mapTemaToPublication(tema, userId) {
  const autor = await getUsuarioById(tema.usuarioId);
  const comentarios = await getComentariosByTemaId(tema.id);
  const reacciones = getReacciones().filter(
    (r) => r.targetTipo === "tema" && r.targetId === tema.id
  );
  const userReaccion = reacciones.find((r) => r.usuarioId === userId);
  const mapBack = { like: "like", love: "love", apoyo: "support", genial: "insightful", interesante: "thinking" };
  const resumen = {};
  reacciones.forEach((r) => {
    const key = mapBack[r.tipo] || r.tipo;
    resumen[key] = (resumen[key] || 0) + 1;
  });

  return {
    id: tema.id,
    title: tema.titulo,
    content: tema.contenido,
    tags: getTemaTags(tema),
    userId: tema.usuarioId,
    author: autor ? { id: autor.id, name: autor.nombre } : null,
    createdAt: tema.createdAt,
    totalReactions: reacciones.length,
    userReaction: userReaccion ? (mapBack[userReaccion.tipo] || userReaccion.tipo) : null,
    commentsCount: comentarios.length,
    reactions: resumen
  };
}

async function mapComentarioToComment(comentario) {
  const autor = await getUsuarioById(comentario.usuarioId || comentario.usuario_id);
  return {
    id: comentario.id,
    content: comentario.contenido,
    parentId: comentario.parentId || comentario.parent_id || null,
    author: autor ? { id: autor.id, name: autor.nombre } : null,
    createdAt: comentario.createdAt || comentario.created_at
  };
}

router.use(authMiddleware);

router.get("/publications", async (req, res) => {
  let temas = await getTemas();
  const { courseId, userId } = req.query;
  if (courseId) temas = temas.filter((t) => t.cursoId === Number(courseId));
  if (userId) temas = temas.filter((t) => t.usuarioId === Number(userId));
  const mapped = await Promise.all(temas.map((t) => mapTemaToPublication(t, req.userId)));
  return res.json(mapped);
});

router.get("/publications/:id", async (req, res) => {
  const tema = await getTemaById(req.params.id);
  if (!tema) return res.status(404).json({ message: "Publicación no encontrada" });
  return res.json(await mapTemaToPublication(tema, req.userId));
});

router.post("/publications", async (req, res) => {
  const { title, content, tags, courseId } = req.body;
  if (!title || !content) {
    return res.status(400).json({ message: "Título y contenido son obligatorios" });
  }

  const curso = await ensureCursoGeneral();
  const cid = courseId ? Number(courseId) : (curso?.id || 1);
  const nuevo = await createTema(title, content, cid, req.userId);
  const tagList = Array.isArray(tags) ? tags : [];
  setTemaTags(nuevo.id, tagList);

  return res.status(201).json(await mapTemaToPublication(nuevo, req.userId));
});

router.put("/publications/:id", async (req, res) => {
  const tema = await getTemaById(req.params.id);
  if (!tema) return res.status(404).json({ message: "Publicación no encontrada" });
  if (tema.usuarioId !== req.userId) {
    return res.status(403).json({ message: "No puedes editar esta publicación" });
  }

  const { title, content, tags } = req.body;
  const data = {};
  if (title) data.titulo = title;
  if (content) data.contenido = content;
  if (tags !== undefined) setTemaTags(Number(req.params.id), tags);
  const actualizado = await updateTema(req.params.id, data);
  return res.json(await mapTemaToPublication(actualizado, req.userId));
});

router.delete("/publications/:id", async (req, res) => {
  const tema = await getTemaById(req.params.id);
  if (!tema) return res.status(404).json({ message: "Publicación no encontrada" });
  if (tema.usuarioId !== req.userId) {
    return res.status(403).json({ message: "No puedes eliminar esta publicación" });
  }
  await deleteTema(req.params.id);
  return res.status(204).send();
});

router.get("/publications/:id/comments", async (req, res) => {
  const temaId = Number(req.params.id);
  const comentarios = await getComentariosByTemaId(temaId);
  const mapped = await Promise.all(comentarios.map(mapComentarioToComment));
  return res.json(mapped);
});

router.post("/publications/:id/comments", async (req, res) => {
  const temaId = Number(req.params.id);
  const { content, parentId, parent_id } = req.body;
  const pId = parentId || parent_id;
  if (!content) return res.status(400).json({ message: "Contenido es obligatorio" });

  const tema = await getTemaById(temaId);
  if (!tema) return res.status(404).json({ message: "Publicación no encontrada" });

  const nuevo = await createComentario(content, temaId, req.userId, pId);
  return res.status(201).json(await mapComentarioToComment(nuevo));
});

const REACTION_MAP = { like: "like", love: "love", support: "apoyo", insightful: "genial", thinking: "interesante" };

router.post("/publications/:id/react", async (req, res) => {
  const temaId = Number(req.params.id);
  const { reactionType } = req.body;
  const tipo = REACTION_MAP[reactionType] || "like";

  const tema = await getTemaById(temaId);
  if (!tema) return res.status(404).json({ message: "Publicación no encontrada" });

  const existente = store.reacciones.findIndex(
    (r) =>
      r.targetTipo === "tema" &&
      r.targetId === temaId &&
      r.usuarioId === req.userId
  );

  if (existente >= 0) {
    if (store.reacciones[existente].tipo === tipo) {
      store.reacciones.splice(existente, 1);
    } else {
      store.reacciones[existente].tipo = tipo;
    }
  } else {
    store.reacciones.push({
      id: nextId("reacciones"),
      tipo,
      targetTipo: "tema",
      targetId: temaId,
      usuarioId: req.userId,
      createdAt: new Date().toISOString()
    });
  }

  return res.json({ message: "Reacción actualizada" });
});

router.get("/notes", async (req, res) => {
  const { courseId } = req.query;
  let temas = await getTemas();
  if (courseId) temas = temas.filter((t) => t.cursoId === Number(courseId));

  const notes = await Promise.all(
    temas.map(async (t) => {
      const autor = await getUsuarioById(t.usuarioId);
      return {
        id: t.id,
        title: t.titulo,
        content: t.contenido,
        courseId: t.cursoId,
        userId: t.usuarioId,
        author: autor ? { id: autor.id, name: autor.nombre } : null,
        createdAt: t.createdAt,
        updatedAt: t.createdAt
      };
    })
  );

  return res.json(notes);
});

router.get("/notes/:id", async (req, res) => {
  const tema = await getTemaById(req.params.id);
  if (!tema) return res.status(404).json({ message: "Apunte no encontrado" });
  const autor = await getUsuarioById(tema.usuarioId);
  return res.json({
    id: tema.id,
    title: tema.titulo,
    content: tema.contenido,
    courseId: tema.cursoId,
    userId: tema.usuarioId,
    author: autor ? { id: autor.id, name: autor.nombre } : null,
    createdAt: tema.createdAt,
    updatedAt: tema.createdAt
  });
});

router.post("/notes", async (req, res) => {
  const { title, content, courseId } = req.body;
  if (!title || !content) {
    return res.status(400).json({ message: "Título y contenido son obligatorios" });
  }

  const curso = await ensureCursoGeneral();
  const cid = courseId ? Number(courseId) : curso?.id || 1;
  const nuevo = await createTema(title, content, cid, req.userId);
  const autor = await getUsuarioById(req.userId);
  return res.status(201).json({
    id: nuevo.id,
    title: nuevo.titulo,
    content: nuevo.contenido,
    courseId: nuevo.cursoId,
    userId: nuevo.usuarioId,
    author: autor ? { id: autor.id, name: autor.nombre } : null,
    createdAt: nuevo.createdAt,
    updatedAt: nuevo.createdAt
  });
});

router.put("/notes/:id", async (req, res) => {
  const tema = await getTemaById(req.params.id);
  if (!tema) return res.status(404).json({ message: "Apunte no encontrado" });
  if (tema.usuarioId !== req.userId) {
    return res.status(403).json({ message: "No puedes editar este apunte" });
  }

  const { title, content } = req.body;
  const data = {};
  if (title) data.titulo = title;
  if (content) data.contenido = content;
  const actualizado = await updateTema(req.params.id, data);
  const autor = await getUsuarioById(actualizado.usuarioId);
  return res.json({
    id: actualizado.id,
    title: actualizado.titulo,
    content: actualizado.contenido,
    courseId: actualizado.cursoId,
    userId: actualizado.usuarioId,
    author: autor ? { id: autor.id, name: autor.nombre } : null,
    createdAt: actualizado.createdAt,
    updatedAt: new Date().toISOString()
  });
});

// --- Recursos (enlaces, videos, materiales de estudio) ---
router.get("/resources", async (req, res) => {
  const { courseId } = req.query;
  let recursos = store.recursos || [];
  if (courseId) recursos = recursos.filter((r) => r.cursoId === Number(courseId));
  const conAutor = await Promise.all(
    recursos.map(async (r) => {
      const autor = await getUsuarioById(r.usuarioId);
      return {
        id: r.id,
        title: r.titulo,
        url: r.url,
        description: r.descripcion,
        type: r.tipo || "link",
        courseId: r.cursoId,
        userId: r.usuarioId,
        author: autor ? { id: autor.id, name: autor.nombre } : null,
        createdAt: r.createdAt
      };
    })
  );
  return res.json(conAutor);
});

router.post("/resources", async (req, res) => {
  const { title, url, description, type, courseId } = req.body;
  if (!title || !url) {
    return res.status(400).json({ message: "Título y URL son obligatorios" });
  }
  const curso = await ensureCursoGeneral();
  const cid = courseId ? Number(courseId) : curso?.id || 1;
  const nuevo = {
    id: nextId("recursos"),
    titulo: title,
    url: url.startsWith("http") ? url : `https://${url}`,
    descripcion: description || null,
    tipo: type || "link",
    cursoId: cid,
    usuarioId: req.userId,
    createdAt: new Date().toISOString()
  };
  store.recursos.push(nuevo);
  const autor = await getUsuarioById(req.userId);
  return res.status(201).json({
    id: nuevo.id,
    title: nuevo.titulo,
    url: nuevo.url,
    description: nuevo.descripcion,
    type: nuevo.tipo,
    courseId: nuevo.cursoId,
    userId: nuevo.usuarioId,
    author: autor ? { id: autor.id, name: autor.nombre } : null,
    createdAt: nuevo.createdAt
  });
});

router.delete("/resources/:id", async (req, res) => {
  const idx = store.recursos.findIndex((r) => r.id === Number(req.params.id));
  if (idx < 0) return res.status(404).json({ message: "Recurso no encontrado" });
  if (store.recursos[idx].usuarioId !== req.userId) {
    return res.status(403).json({ message: "No puedes eliminar este recurso" });
  }
  store.recursos.splice(idx, 1);
  return res.status(204).send();
});

module.exports = router;
