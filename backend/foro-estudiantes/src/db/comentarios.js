/**
 * Acceso a comentarios en la base de datos redsocial
 */

const db = require("./connection");

async function getByPublicacionId(publicacionId) {
  if (!db.isConfigured()) return null;
  try {
    const rows = await db.query(
      "SELECT id, usuario_id, publicacion_id, parent_id, contenido, es_solucion, created_at FROM comentarios WHERE publicacion_id = ? ORDER BY created_at ASC",
      [Number(publicacionId)]
    );
    return rows || [];
  } catch (err) {
    console.warn("[db] Error getByPublicacionId:", err.message);
    return null;
  }
}

async function create(usuarioId, publicacionId, contenido, parentId = null) {
  if (!db.isConfigured()) return null;
  try {
    const result = await db.query(
      "INSERT INTO comentarios (usuario_id, publicacion_id, parent_id, contenido, es_solucion) VALUES (?, ?, ?, ?, ?)",
      [Number(usuarioId), Number(publicacionId), parentId ? Number(parentId) : null, contenido, false]
    );
    const insertId = result?.insertId;
    if (!insertId) throw new Error("No insertId");
    const [row] = await db.query("SELECT id, usuario_id, publicacion_id, parent_id, contenido, es_solucion, created_at FROM comentarios WHERE id = ?", [insertId]);
    return row ? rowToComentario(row) : null;
  } catch (err) {
    console.error("[db] Error create comentario:", err.message);
    return null;
  }
}

function rowToComentario(row) {
  if (!row) return null;
  return {
    id: row.id,
    usuarioId: row.usuario_id,
    usuario_id: row.usuario_id,
    temaId: row.publicacion_id,
    publicacion_id: row.publicacion_id,
    parentId: row.parent_id,
    parent_id: row.parent_id,
    contenido: row.contenido,
    esSolucion: row.es_solucion,
    createdAt: row.created_at,
    created_at: row.created_at
  };
}

module.exports = { getByPublicacionId, create, rowToComentario };
