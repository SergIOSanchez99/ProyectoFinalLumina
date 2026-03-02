/**
 * Persistencia de mensajería directa en MySQL
 * Tablas: dm_conversaciones, dm_mensajes
 */

const db = require("./connection");
const dbUsuarios = require("./usuarios");

function normalizarUsuarios(id1, id2) {
  const a = Number(id1);
  const b = Number(id2);
  return a < b ? [a, b] : [b, a];
}

async function getOrCreateConversation(userId1, userId2) {
  if (!db.isConfigured()) return null;
  try {
    const [u1, u2] = normalizarUsuarios(userId1, userId2);
    let row = await db.queryOne(
      "SELECT id FROM dm_conversaciones WHERE usuario1_id = ? AND usuario2_id = ?",
      [u1, u2]
    );
    if (row) return row.id;

    const result = await db.query(
      "INSERT INTO dm_conversaciones (usuario1_id, usuario2_id) VALUES (?, ?)",
      [u1, u2]
    );
    return result?.insertId || null;
  } catch (err) {
    if (err.code === "ER_DUP_ENTRY") {
      const [u1, u2] = normalizarUsuarios(userId1, userId2);
      const row = await db.queryOne(
        "SELECT id FROM dm_conversaciones WHERE usuario1_id = ? AND usuario2_id = ?",
        [u1, u2]
      );
      return row?.id || null;
    }
    console.warn("[db] Error getOrCreateConversation:", err.message);
    return null;
  }
}

async function getConversations(userId) {
  if (!db.isConfigured()) return [];
  try {
    const rows = await db.query(
      `SELECT id, usuario1_id, usuario2_id FROM dm_conversaciones 
       WHERE usuario1_id = ? OR usuario2_id = ?`,
      [Number(userId), Number(userId)]
    );
    const convs = [];
    for (const r of rows || []) {
      const otherId = r.usuario1_id === Number(userId) ? r.usuario2_id : r.usuario1_id;
      const usuario = await dbUsuarios.findById(otherId);
      const lastMsg = await db.queryOne(
        "SELECT contenido, created_at FROM dm_mensajes WHERE conversacion_id = ? ORDER BY created_at DESC LIMIT 1",
        [r.id]
      );
      convs.push({
        id: r.id,
        otherUser: usuario ? {
          id: usuario.id,
          name: usuario.nombre,
          nickname: usuario.nickname,
          avatar_url: usuario.avatar_url
        } : null,
        lastMessage: lastMsg?.contenido || null,
        lastMessageAt: lastMsg?.created_at || null,
        unreadCount: 0
      });
    }
    return convs.sort((a, b) => {
      const da = a.lastMessageAt ? new Date(a.lastMessageAt) : new Date(0);
      const db_ = b.lastMessageAt ? new Date(b.lastMessageAt) : new Date(0);
      return db_ - da;
    });
  } catch (err) {
    console.warn("[db] Error getConversations:", err.message);
    return [];
  }
}

async function isParticipant(conversationId, userId) {
  if (!db.isConfigured()) return false;
  try {
    const row = await db.queryOne(
      "SELECT 1 FROM dm_conversaciones WHERE id = ? AND (usuario1_id = ? OR usuario2_id = ?)",
      [Number(conversationId), Number(userId), Number(userId)]
    );
    return !!row;
  } catch (err) {
    console.warn("[db] Error isParticipant:", err.message);
    return false;
  }
}

async function getMessages(conversationId, userId) {
  if (!db.isConfigured()) return [];
  const ok = await isParticipant(conversationId, userId);
  if (!ok) return [];
  try {
    const rows = await db.query(
      "SELECT id, conversacion_id, remitente_id, contenido, created_at, leido, leido_at FROM dm_mensajes WHERE conversacion_id = ? ORDER BY created_at ASC",
      [Number(conversationId)]
    );
    const result = [];
    for (const r of rows || []) {
      const sender = await dbUsuarios.findById(r.remitente_id);
      result.push({
        id: r.id,
        content: r.contenido,
        senderId: r.remitente_id,
        createdAt: r.created_at,
        senderName: sender?.nombre,
        senderAvatar: sender?.avatar_url,
        seen: !!r.leido,
        seenAt: r.leido_at || null
      });
    }
    return result;
  } catch (err) {
    console.warn("[db] Error getMessages:", err.message);
    return [];
  }
}

async function createMessage(conversationId, senderId, content) {
  if (!db.isConfigured()) return null;
  const ok = await isParticipant(conversationId, senderId);
  if (!ok) return null;
  try {
    const result = await db.query(
      "INSERT INTO dm_mensajes (conversacion_id, remitente_id, contenido) VALUES (?, ?, ?)",
      [Number(conversationId), Number(senderId), String(content)]
    );
    const insertId = result?.insertId;
    if (!insertId) return null;

    const row = await db.queryOne(
      "SELECT id, conversacion_id, remitente_id, contenido, created_at FROM dm_mensajes WHERE id = ?",
      [insertId]
    );
    const sender = await dbUsuarios.findById(senderId);
    return row ? {
      id: row.id,
      content: row.contenido,
      senderId: row.remitente_id,
      createdAt: row.created_at,
      senderName: sender?.nombre,
      senderAvatar: sender?.avatar_url,
      seen: false,
      seenAt: null
    } : null;
  } catch (err) {
    console.warn("[db] Error createMessage:", err.message);
    return null;
  }
}

async function getOtherParticipant(conversationId, userId) {
  if (!db.isConfigured()) return null;
  try {
    const row = await db.queryOne(
      "SELECT usuario1_id, usuario2_id FROM dm_conversaciones WHERE id = ?",
      [Number(conversationId)]
    );
    if (!row) return null;
    const other = row.usuario1_id === Number(userId) ? row.usuario2_id : row.usuario1_id;
    return other;
  } catch (err) {
    console.warn("[db] Error getOtherParticipant:", err.message);
    return null;
  }
}

async function markMessagesAsRead(conversationId, userId, messageIds = null) {
  if (!db.isConfigured()) return { markedIds: [], messages: [] };
  const ok = await isParticipant(conversationId, userId);
  if (!ok) return { markedIds: [], messages: [] };
  try {
    let idsToMark = messageIds;
    if (!idsToMark || idsToMark.length === 0) {
      const rows = await db.query(
        "SELECT id FROM dm_mensajes WHERE conversacion_id = ? AND remitente_id != ? AND (leido IS NULL OR leido = 0)",
        [Number(conversationId), Number(userId)]
      );
      idsToMark = (rows || []).map((r) => r.id);
    }
    if (idsToMark.length === 0) {
      const messages = await getMessages(conversationId, userId);
      return { markedIds: [], messages };
    }
    const placeholders = idsToMark.map(() => "?").join(",");
    await db.query(
      `UPDATE dm_mensajes SET leido = 1, leido_at = NOW() WHERE id IN (${placeholders})`,
      idsToMark.map(Number)
    );
    const messages = await getMessages(conversationId, userId);
    return { markedIds: idsToMark, messages };
  } catch (err) {
    console.warn("[db] Error markMessagesAsRead:", err.message);
    return { markedIds: [], messages: [] };
  }
}

module.exports = {
  getOrCreateConversation,
  getConversations,
  getMessages,
  createMessage,
  isParticipant,
  getOtherParticipant,
  markMessagesAsRead
};
