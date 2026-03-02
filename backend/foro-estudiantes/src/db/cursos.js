/**
 * Acceso a cursos en la base de datos redsocial
 */

const db = require("./connection");

async function getAll() {
  if (!db.isConfigured()) return null;
  try {
    const rows = await db.query(
      "SELECT id, nombre, codigo, descripcion, docente, universidad, created_at FROM cursos ORDER BY nombre ASC"
    );
    return Array.isArray(rows) ? rows.map(rowToCurso) : [];
  } catch (err) {
    console.warn("[db] Error getAll cursos:", err.message);
    return null;
  }
}

async function getById(id) {
  if (!db.isConfigured()) return null;
  try {
    const row = await db.queryOne(
      "SELECT id, nombre, codigo, descripcion, docente, universidad, created_at FROM cursos WHERE id = ?",
      [Number(id)]
    );
    return row ? rowToCurso(row) : null;
  } catch (err) {
    console.warn("[db] Error getById curso:", err.message);
    return null;
  }
}

async function getByCodigo(codigo) {
  if (!db.isConfigured()) return null;
  try {
    const row = await db.queryOne(
      "SELECT id, nombre, codigo, descripcion, docente, universidad, created_at FROM cursos WHERE codigo = ?",
      [codigo]
    );
    return row ? rowToCurso(row) : null;
  } catch (err) {
    console.warn("[db] Error getByCodigo:", err.message);
    return null;
  }
}

async function create(nombre, codigo, descripcion = null, docente = null, universidad = null) {
  if (!db.isConfigured()) return null;
  try {
    const result = await db.query(
      "INSERT INTO cursos (nombre, codigo, descripcion, docente, universidad) VALUES (?, ?, ?, ?, ?)",
      [nombre, codigo, descripcion, docente, universidad]
    );
    const insertId = result?.insertId;
    if (!insertId) throw new Error("No insertId");
    return getById(insertId);
  } catch (err) {
    if (err.code === "ER_DUP_ENTRY") return null;
    console.error("[db] Error create curso:", err.message);
    return null;
  }
}

async function update(id, data) {
  if (!db.isConfigured()) return null;
  try {
    const updates = [];
    const params = [];
    if (data.nombre !== undefined) { updates.push("nombre = ?"); params.push(data.nombre); }
    if (data.codigo !== undefined) { updates.push("codigo = ?"); params.push(data.codigo); }
    if (data.descripcion !== undefined) { updates.push("descripcion = ?"); params.push(data.descripcion); }
    if (data.docente !== undefined) { updates.push("docente = ?"); params.push(data.docente); }
    if (data.universidad !== undefined) { updates.push("universidad = ?"); params.push(data.universidad); }
    if (updates.length === 0) return getById(id);
    params.push(Number(id));
    await db.query(`UPDATE cursos SET ${updates.join(", ")} WHERE id = ?`, params);
    return getById(id);
  } catch (err) {
    if (err.code === "ER_DUP_ENTRY") return null;
    console.warn("[db] Error update curso:", err.message);
    return null;
  }
}

async function remove(id) {
  if (!db.isConfigured()) return false;
  try {
    const result = await db.query("DELETE FROM cursos WHERE id = ?", [Number(id)]);
    return result?.affectedRows > 0;
  } catch (err) {
    console.warn("[db] Error delete curso:", err.message);
    return false;
  }
}

function rowToCurso(row) {
  if (!row) return null;
  return {
    id: row.id,
    nombre: row.nombre,
    codigo: row.codigo,
    descripcion: row.descripcion,
    docente: row.docente,
    universidad: row.universidad,
    createdAt: row.created_at || row.createdAt
  };
}

async function ensureExists(id, nombre, codigo, descripcion = null, docente = null) {
  if (!db.isConfigured()) return false;
  try {
    const existing = await getById(id);
    if (existing) return true;
    const result = await db.query(
      "INSERT INTO cursos (id, nombre, codigo, descripcion, docente, universidad) VALUES (?, ?, ?, ?, ?, NULL)",
      [Number(id), nombre, codigo, descripcion, docente]
    );
    return !!result?.insertId;
  } catch (err) {
    console.warn("[db] Error ensureExists curso:", err.message);
    return false;
  }
}

module.exports = { getAll, getById, getByCodigo, create, update, remove, ensureExists, rowToCurso };
