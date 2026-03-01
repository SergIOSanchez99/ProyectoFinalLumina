/**
 * Acceso a publicaciones (temas del foro) en la base de datos redsocial
 * Necesario para que comentarios tenga FK válida (publicacion_id -> publicaciones.id)
 */

const db = require("./connection");

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

module.exports = { ensureExists };
