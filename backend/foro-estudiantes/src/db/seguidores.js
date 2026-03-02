/**
 * Acceso a seguidores en la base de datos redsocial
 * Tabla: seguidores (seguidor_id, seguido_id)
 */

const db = require("./connection");
const dbUsuarios = require("./usuarios");

async function getSeguidos(seguidorId) {
  if (!db.isConfigured()) return [];
  try {
    const rows = await db.query(
      "SELECT seguido_id FROM seguidores WHERE seguidor_id = ?",
      [Number(seguidorId)]
    );
    const ids = (rows || []).map((r) => r.seguido_id);
    if (ids.length === 0) return [];
    const placeholders = ids.map(() => "?").join(",");
    const users = await db.query(
      `SELECT id, nombre, email, universidad, carrera, bio, avatar_url, nickname 
       FROM usuarios WHERE id IN (${placeholders})`,
      ids
    );
    return (users || []).map((u) => ({
      id: u.id,
      name: u.nombre,
      nombre: u.nombre,
      email: u.email,
      nickname: u.nickname,
      avatar_url: u.avatar_url,
      university: u.universidad,
      career: u.carrera,
      bio: u.bio
    }));
  } catch (err) {
    console.warn("[db] Error getSeguidos:", err.message);
    return [];
  }
}

async function follow(seguidorId, seguidoId) {
  if (!db.isConfigured()) return false;
  if (seguidorId === seguidoId) return false;
  try {
    await db.query(
      "INSERT INTO seguidores (seguidor_id, seguido_id) VALUES (?, ?)",
      [Number(seguidorId), Number(seguidoId)]
    );
    return true;
  } catch (err) {
    if (err.code === "ER_DUP_ENTRY") return false;
    console.warn("[db] Error follow:", err.message);
    return false;
  }
}

async function unfollow(seguidorId, seguidoId) {
  if (!db.isConfigured()) return false;
  try {
    const result = await db.query(
      "DELETE FROM seguidores WHERE seguidor_id = ? AND seguido_id = ?",
      [Number(seguidorId), Number(seguidoId)]
    );
    return (result?.affectedRows || 0) > 0;
  } catch (err) {
    console.warn("[db] Error unfollow:", err.message);
    return false;
  }
}

async function isFollowing(seguidorId, seguidoId) {
  if (!db.isConfigured()) return false;
  try {
    const rows = await db.query(
      "SELECT 1 FROM seguidores WHERE seguidor_id = ? AND seguido_id = ?",
      [Number(seguidorId), Number(seguidoId)]
    );
    return (rows?.length || 0) > 0;
  } catch (err) {
    console.warn("[db] Error isFollowing:", err.message);
    return false;
  }
}

async function countSeguidores(usuarioId) {
  if (!db.isConfigured()) return 0;
  try {
    const rows = await db.query(
      "SELECT COUNT(*) as n FROM seguidores WHERE seguido_id = ?",
      [Number(usuarioId)]
    );
    return rows?.[0]?.n ?? 0;
  } catch (err) {
    console.warn("[db] Error countSeguidores:", err.message);
    return 0;
  }
}

module.exports = { getSeguidos, follow, unfollow, isFollowing, countSeguidores };
