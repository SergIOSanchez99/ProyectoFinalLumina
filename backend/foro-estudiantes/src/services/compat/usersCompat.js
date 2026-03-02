const express = require("express");
const jwt = require("jsonwebtoken");
const { store } = require("../../data/store");
const { getTemas, getCursos } = require("../../data/dataLayer");
const db = require("../../db/connection");
const dbUsuarios = require("../../db/usuarios");
const dbSeguidores = require("../../db/seguidores");

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

router.use(authMiddleware);

async function getUsuario(id) {
  if (db.isConfigured()) {
    const row = await dbUsuarios.findById(id);
    return row ? dbUsuarios.rowToProfile(row) : null;
  }
  const u = store.usuarios.find((x) => x.id === id);
  return u ? { id: u.id, name: u.nombre, email: u.email, university: u.universidad, career: u.carrera, bio: u.bio, nickname: u.nickname, avatar_url: u.avatar_url } : null;
}

router.get("/:userId/following", async (req, res) => {
  const targetId = Number(req.params.userId);
  if (targetId === req.userId) {
    return res.json({ following: false });
  }
  if (db.isConfigured()) {
    const following = await dbSeguidores.isFollowing(req.userId, targetId);
    return res.json({ following });
  }
  const exists = store.seguidores.some(
    (s) => s.seguidorId === req.userId && s.seguidoId === targetId
  );
  return res.json({ following: exists });
});

router.get("/:userId", async (req, res) => {
  const id = Number(req.params.userId);
  const usuario = await getUsuario(id);
  if (!usuario) return res.status(404).json({ message: "Usuario no encontrado" });

  const temas = await getTemas();
  const temasCreados = temas.filter((t) => t.usuarioId === id).length;
  const comentariosHechos = store.comentarios.filter((c) => c.usuarioId === id).length;
  const seguidores = store.seguidores.filter((s) => s.seguidoId === id).length;

  return res.json({
    id: usuario.id,
    name: usuario.name || usuario.nombre,
    email: usuario.email,
    university: usuario.university || usuario.universidad,
    career: usuario.career || usuario.carrera,
    bio: usuario.bio,
    nickname: usuario.nickname,
    avatar_url: usuario.avatar_url,
    contributionsCount: temasCreados + comentariosHechos,
    followersCount: seguidores
  });
});

router.put("/:userId", async (req, res) => {
  if (Number(req.params.userId) !== req.userId) {
    return res.status(403).json({ message: "No puedes editar otro usuario" });
  }

  if (db.isConfigured()) {
    const updated = await dbUsuarios.update(req.userId, req.body);
    if (!updated) return res.status(404).json({ message: "Usuario no encontrado" });
    return res.json(updated);
  }

  const idx = store.usuarios.findIndex((u) => u.id === req.userId);
  if (idx < 0) return res.status(404).json({ message: "Usuario no encontrado" });

  const { name, university, career, bio, nickname, avatar_url } = req.body;
  if (name) store.usuarios[idx].nombre = name;
  if (university !== undefined) store.usuarios[idx].universidad = university;
  if (career !== undefined) store.usuarios[idx].carrera = career;
  if (bio !== undefined) store.usuarios[idx].bio = bio;
  if (nickname !== undefined) store.usuarios[idx].nickname = nickname;
  if (avatar_url !== undefined) store.usuarios[idx].avatar_url = avatar_url;

  const u = store.usuarios[idx];
  return res.json({
    id: u.id,
    name: u.nombre,
    email: u.email,
    university: u.universidad,
    career: u.carrera,
    bio: u.bio,
    nickname: u.nickname,
    avatar_url: u.avatar_url
  });
});

router.get("/:userId/courses", async (req, res) => {
  const userId = Number(req.params.userId);
  const inscripciones = store.inscripciones.filter((i) => i.usuarioId === userId);
  const cursos = await getCursos();
  const userCursos = inscripciones.map((i) => {
    const c = cursos.find((cur) => cur.id === i.cursoId);
    return c ? { id: c.id, name: c.nombre, code: c.codigo, description: c.descripcion } : null;
  }).filter(Boolean);

  if (userCursos.length === 0) {
    return res.json(cursos.slice(0, 5).map((c) => ({
      id: c.id,
      name: c.nombre,
      code: c.codigo,
      description: c.descripcion
    })));
  }

  return res.json(userCursos);
});

router.post("/courses/:courseId/enroll", async (req, res) => {
  const courseId = Number(req.params.courseId);
  const cursos = await getCursos();
  const curso = cursos.find((c) => c.id === courseId);
  if (!curso) return res.status(404).json({ message: "Curso no encontrado" });

  const yaInscrito = store.inscripciones.some(
    (i) => i.cursoId === courseId && i.usuarioId === req.userId
  );
  if (yaInscrito) return res.status(409).json({ message: "Ya inscrito en este curso" });

  store.inscripciones.push({
    cursoId,
    usuarioId: req.userId,
    createdAt: new Date().toISOString()
  });

  return res.status(201).json({ message: "Inscrito correctamente" });
});

router.get("/:userId/reputation", async (req, res) => {
  const userId = Number(req.params.userId);
  const temas = await getTemas();
  const temasCount = temas.filter((t) => t.usuarioId === userId).length;
  const comentarios = store.comentarios.filter((c) => c.usuarioId === userId).length;
  const soluciones = store.comentarios.filter(
    (c) => c.usuarioId === userId && c.esSolucion
  ).length;

  const points = temasCount * 10 + comentarios * 5 + soluciones * 50;
  const level = Math.floor(points / 100) + 1;

  return res.json({
    points,
    level,
    rank: level <= 2 ? "Principiante" : level <= 5 ? "Activo" : "Experto"
  });
});

router.get("/:userId/activity", (req, res) => {
  return res.json([]);
});

router.get("/:userId/friends", async (req, res) => {
  const userId = req.params.userId === "me" ? req.userId : Number(req.params.userId);
  if (userId !== req.userId) {
    return res.status(403).json({ error: "Solo puedes ver tu propia lista de amigos" });
  }

  if (db.isConfigured()) {
    const friends = await dbSeguidores.getSeguidos(userId);
    return res.json(friends.map((u) => ({
      id: u.id,
      name: u.name || u.nombre,
      nickname: u.nickname,
      avatar_url: u.avatar_url
    })));
  }

  const ids = store.seguidores.filter((s) => s.seguidorId === userId).map((s) => s.seguidoId);
  const usuarios = store.usuarios.filter((u) => ids.includes(u.id));
  return res.json(usuarios.map((u) => ({
    id: u.id,
    name: u.nombre,
    nickname: u.nickname,
    avatar_url: u.avatar_url
  })));
});

router.post("/:targetId/follow", async (req, res) => {
  const targetId = Number(req.params.targetId);
  if (targetId === req.userId) {
    return res.status(400).json({ error: "No puedes seguirte a ti mismo" });
  }

  if (db.isConfigured()) {
    const ok = await dbSeguidores.follow(req.userId, targetId);
    if (!ok) return res.status(409).json({ error: "Ya sigues a este usuario" });
    return res.status(201).json({ message: "Ahora sigues a este usuario" });
  }

  const target = store.usuarios.find((u) => u.id === targetId);
  if (!target) return res.status(404).json({ error: "Usuario no encontrado" });
  const yaExiste = store.seguidores.some(
    (s) => s.seguidorId === req.userId && s.seguidoId === targetId
  );
  if (yaExiste) return res.status(409).json({ error: "Ya sigues a este usuario" });
  store.seguidores.push({
    seguidorId: req.userId,
    seguidoId: targetId,
    createdAt: new Date().toISOString()
  });
  return res.status(201).json({ message: "Ahora sigues a este usuario" });
});

router.delete("/:targetId/follow", async (req, res) => {
  const targetId = Number(req.params.targetId);

  if (db.isConfigured()) {
    const ok = await dbSeguidores.unfollow(req.userId, targetId);
    if (!ok) return res.status(404).json({ error: "No sigues a este usuario" });
    return res.json({ message: "Dejaste de seguir" });
  }

  const idx = store.seguidores.findIndex(
    (s) => s.seguidorId === req.userId && s.seguidoId === targetId
  );
  if (idx < 0) return res.status(404).json({ error: "No sigues a este usuario" });
  store.seguidores.splice(idx, 1);
  return res.json({ message: "Dejaste de seguir" });
});

module.exports = router;
