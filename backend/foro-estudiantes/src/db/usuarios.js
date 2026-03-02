/**
 * Acceso a usuarios en la base de datos redsocial
 */

const db = require("./connection");

async function findByEmail(email) {
  if (!db.isConfigured()) return null;
  try {
    return await db.queryOne(
      "SELECT id, nombre, email, password_hash, universidad, carrera, bio, avatar_url, nickname, created_at FROM usuarios WHERE email = ?",
      [email]
    );
  } catch (err) {
    console.error("[db] Error findByEmail:", err.message);
    throw err;
  }
}

async function findById(id) {
  if (!db.isConfigured()) return null;
  try {
    return await db.queryOne(
      "SELECT id, nombre, email, universidad, carrera, bio, avatar_url, nickname, created_at FROM usuarios WHERE id = ?",
      [Number(id)]
    );
  } catch (err) {
    console.warn("[db] Error findById:", err.message);
    return null;
  }
}

async function create({ nombre, email, passwordHash, universidad, carrera }) {
  if (!db.isConfigured()) return null;
  try {
    const result = await db.query(
      "INSERT INTO usuarios (nombre, email, password_hash, universidad, carrera) VALUES (?, ?, ?, ?, ?)",
      [nombre, email, passwordHash, universidad || null, carrera || null]
    );
    const insertId = result?.insertId;
    if (!insertId) throw new Error("No insertId");
    return { id: insertId, nombre, email, universidad: universidad || null, carrera: carrera || null };
  } catch (err) {
    if (err.code === "ER_DUP_ENTRY") return null;
    console.error("[db] Error create usuario:", err.message);
    return null;
  }
}

async function update(id, data) {
  if (!db.isConfigured()) return null;
  try {
    const updates = [];
    const params = [];
    if (data.name !== undefined) { updates.push("nombre = ?"); params.push(data.name); }
    if (data.university !== undefined) { updates.push("universidad = ?"); params.push(data.university); }
    if (data.career !== undefined) { updates.push("carrera = ?"); params.push(data.career); }
    if (data.bio !== undefined) { updates.push("bio = ?"); params.push(data.bio); }
    if (data.nickname !== undefined) { updates.push("nickname = ?"); params.push(data.nickname); }
    if (data.avatar_url !== undefined) { updates.push("avatar_url = ?"); params.push(data.avatar_url); }
    if (updates.length === 0) return findById(id);
    params.push(Number(id));
    await db.query(`UPDATE usuarios SET ${updates.join(", ")} WHERE id = ?`, params);
    const row = await findById(id);
    return row ? rowToProfile(row) : null;
  } catch (err) {
    console.warn("[db] Error update usuario:", err.message);
    return null;
  }
}

function rowToUsuario(row) {
  if (!row) return null;
  return {
    id: row.id,
    nombre: row.nombre,
    email: row.email,
    passwordHash: row.password_hash,
    universidad: row.universidad,
    carrera: row.carrera,
    bio: row.bio,
    avatar_url: row.avatar_url,
    nickname: row.nickname,
    createdAt: row.created_at
  };
}

function rowToProfile(row) {
  if (!row) return null;
  return {
    id: row.id,
    name: row.nombre,
    email: row.email,
    university: row.universidad,
    career: row.carrera,
    bio: row.bio,
    nickname: row.nickname,
    avatar_url: row.avatar_url
  };
}

async function search(query, excludeId = null, limit = 10) {
  if (!db.isConfigured()) return [];
  try {
    const q = `%${String(query).trim()}%`;
    const exclude = excludeId ? "AND id != ?" : "";
    const params = excludeId ? [q, q, q, Number(excludeId)] : [q, q, q];
    const limitVal = Math.min(parseInt(limit, 10) || 10, 50);
    const rows = await db.query(
      `SELECT id, nombre, email, universidad, carrera, bio, avatar_url, nickname, created_at 
       FROM usuarios 
       WHERE (nombre LIKE ? OR email LIKE ? OR COALESCE(nickname,'') LIKE ?) ${exclude}
       ORDER BY nombre ASC
       LIMIT ${limitVal}`,
      params
    );
    return (rows || []).map((r) => ({
      id: r.id,
      name: r.nombre,
      nombre: r.nombre,
      email: r.email,
      nickname: r.nickname,
      avatar_url: r.avatar_url
    }));
  } catch (err) {
    console.warn("[db] Error search usuarios:", err.message);
    return [];
  }
}

module.exports = { findByEmail, findById, create, update, search, rowToUsuario, rowToProfile };
