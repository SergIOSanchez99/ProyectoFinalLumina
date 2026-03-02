/**
 * Acceso a publicaciones (temas del foro) en la base de datos redsocial
 * Necesario para que comentarios tenga FK válida (publicacion_id -> publicaciones.id)
 */

const db = require("./connection");

function rowToTema(row) {
  if (!row) return null;
  return {
    id: row.id,
    titulo: row.titulo,
    contenido: row.contenido,
    cursoId: row.curso_id,
    usuarioId: row.usuario_id,
    estado: row.estado || "abierto",
    vistas: row.vistas || 0,
    createdAt: row.created_at
  };
}

async function getAll(usuarioId = null) {
  if (!db.isConfigured()) return [];
  try {
    let sql = "SELECT id, usuario_id, curso_id, titulo, contenido, estado, vistas, created_at FROM publicaciones ORDER BY created_at DESC";
    const params = [];
    if (usuarioId) {
      sql = "SELECT id, usuario_id, curso_id, titulo, contenido, estado, vistas, created_at FROM publicaciones WHERE usuario_id = ? ORDER BY created_at DESC";
      params.push(Number(usuarioId));
    }
    const rows = await db.query(sql, params);
    return (rows || []).map(rowToTema);
  } catch (err) {
    console.warn("[db] Error getAll publicaciones:", err.message);
    return [];
  }
}

async function getById(id) {
  if (!db.isConfigured()) return null;
  try {
    const row = await db.queryOne(
      "SELECT id, usuario_id, curso_id, titulo, contenido, estado, vistas, created_at FROM publicaciones WHERE id = ?",
      [Number(id)]
    );
    return row ? rowToTema(row) : null;
  } catch (err) {
    console.warn("[db] Error getById publicacion:", err.message);
    return null;
  }
}

async function ensureExists(id, usuarioId, cursoId, titulo, contenido) {
  if (!db.isConfigured()) return false;
  try {
    const existing = await db.queryOne("SELECT id FROM publicaciones WHERE id = ?", [Number(id)]);
    if (existing) return true;
    await db.query(
      "INSERT INTO publicaciones (id, usuario_id, curso_id, titulo, contenido, estado, vistas) VALUES (?, ?, ?, ?, ?, 'abierto', 0)",
      [Number(id), Number(usuarioId), Number(cursoId), titulo, contenido]
    );
    return true;
  } catch (err) {
    console.warn("[db] Error ensureExists publicacion:", err.message);
    return false;
  }
}

async function deleteById(id) {
  if (!db.isConfigured()) return false;
  try {
    await db.query("DELETE FROM publicaciones WHERE id = ?", [Number(id)]);
    return true;
  } catch (err) {
    console.warn("[db] Error deleteById publicacion:", err.message);
    return false;
  }
}

module.exports = { getAll, getById, ensureExists, deleteById };
