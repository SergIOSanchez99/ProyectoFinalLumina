const express = require("express");
const jwt = require("jsonwebtoken");
const { store } = require("../../data/store");
const dbUsuarios = require("../../db/usuarios");
const dbMessaging = require("../../db/messaging");
const db = require("../../db/connection");

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || "lumina-secret-dev";

const conversaciones = new Map();
const mensajes = new Map();
let convId = 1;
let msgId = 1;

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

async function getUserById(id) {
  if (db.isConfigured()) {
    const row = await dbUsuarios.findById(id);
    return row ? { id: row.id, nombre: row.nombre, nickname: row.nickname, avatar_url: row.avatar_url } : null;
  }
  return store.usuarios.find((u) => u.id === id) || null;
}

router.get("/conversations", async (req, res) => {
  if (db.isConfigured()) {
    const convs = await dbMessaging.getConversations(req.userId);
    return res.json(convs);
  }
  const convs = [];
  for (const [id, participants] of conversaciones) {
    const otherId = participants.find((p) => p !== req.userId);
    if (!otherId) continue;
    const usuario = await getUserById(otherId);
    const msgs = mensajes.get(id) || [];
    const last = msgs[msgs.length - 1];
    convs.push({
      id,
      otherUser: usuario ? { id: usuario.id, name: usuario.nombre, nickname: usuario.nickname, avatar_url: usuario.avatar_url } : null,
      lastMessage: last?.content || null,
      lastMessageAt: last?.createdAt || null,
      unreadCount: 0
    });
  }
  return res.json(convs);
});

router.post("/conversations", async (req, res) => {
  const { otherUserId } = req.body;
  if (!otherUserId) return res.status(400).json({ message: "otherUserId requerido" });

  if (db.isConfigured()) {
    const id = await dbMessaging.getOrCreateConversation(req.userId, Number(otherUserId));
    if (id) return res.status(201).json({ conversationId: id });
    return res.status(500).json({ message: "Error al crear conversación" });
  }

  const existente = [...conversaciones.entries()].find(
    ([_, p]) => p.includes(req.userId) && p.includes(Number(otherUserId))
  );
  if (existente) {
    return res.json({ conversationId: existente[0] });
  }

  const id = convId++;
  conversaciones.set(id, [req.userId, Number(otherUserId)]);
  mensajes.set(id, []);
  return res.status(201).json({ conversationId: id });
});

router.get("/conversations/:id/messages", async (req, res) => {
  const id = Number(req.params.id);

  if (db.isConfigured()) {
    const msgs = await dbMessaging.getMessages(id, req.userId);
    if (msgs.length === 0) {
      const ok = await dbMessaging.isParticipant(id, req.userId);
      if (!ok) return res.status(404).json({ message: "Conversación no encontrada" });
    }
    return res.json(msgs);
  }

  const participants = conversaciones.get(id);
  if (!participants || !participants.includes(req.userId)) {
    return res.status(404).json({ message: "Conversación no encontrada" });
  }
  const msgs = mensajes.get(id) || [];
  const result = [];
  for (const m of msgs) {
    const sender = await getUserById(m.senderId);
    result.push({
      ...m,
      senderName: sender?.nombre,
      senderAvatar: sender?.avatar_url
    });
  }
  return res.json(result);
});

router.post("/conversations/:id/messages", async (req, res) => {
  const id = Number(req.params.id);
  const { content } = req.body;
  if (!content) return res.status(400).json({ message: "content requerido" });

  if (db.isConfigured()) {
    const nuevo = await dbMessaging.createMessage(id, req.userId, content);
    if (nuevo) return res.status(201).json(nuevo);
    return res.status(404).json({ message: "Conversación no encontrada" });
  }

  const participants = conversaciones.get(id);
  if (!participants || !participants.includes(req.userId)) {
    return res.status(404).json({ message: "Conversación no encontrada" });
  }

  const nuevo = {
    id: msgId++,
    content,
    senderId: req.userId,
    createdAt: new Date().toISOString()
  };

  const msgs = mensajes.get(id) || [];
  msgs.push(nuevo);
  mensajes.set(id, msgs);

  const sender = await getUserById(req.userId);
  return res.status(201).json({
    ...nuevo,
    senderName: sender?.nombre,
    senderAvatar: sender?.avatar_url
  });
});

router.get("/users/search", async (req, res) => {
  const q = (req.query.q || "").trim();
  if (q.length < 3) return res.json([]);

  if (db.isConfigured()) {
    const resultados = await dbUsuarios.search(q, req.userId, 10);
    return res.json(resultados.map((u) => ({ id: u.id, name: u.name || u.nombre, nickname: u.nickname, avatar_url: u.avatar_url })));
  }

  const qLower = q.toLowerCase();
  const resultados = store.usuarios
    .filter(
      (u) =>
        u.id !== req.userId &&
        (u.nombre?.toLowerCase().includes(qLower) ||
          u.email?.toLowerCase().includes(qLower) ||
          (u.nickname && u.nickname.toLowerCase().includes(qLower)))
    )
    .slice(0, 10)
    .map((u) => ({
      id: u.id,
      name: u.nombre,
      nickname: u.nickname,
      avatar_url: u.avatar_url
    }));

  return res.json(resultados);
});

module.exports = router;
