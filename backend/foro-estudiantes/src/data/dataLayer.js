/**
 * Capa de datos unificada: usa microservicios cuando están disponibles,
 * y el store local como fallback o para datos que solo existen aquí (reacciones, auth).
 */

const { store, nextId, ensureDefaultCourse } = require("./store");
const microservicios = require("../clients/microservicios");
const db = require("../db/connection");
const dbUsuarios = require("../db/usuarios");
const dbComentarios = require("../db/comentarios");
const dbPublicaciones = require("../db/publicaciones");

const temaTagsOverlay = {};

function setTemaTags(temaId, tags) {
  temaTagsOverlay[temaId] = Array.isArray(tags) ? tags : [];
}

function getTemaTags(tema) {
  return tema.tags || temaTagsOverlay[tema.id] || [];
}

async function getUsuarios() {
  if (microservicios.isEnabled()) {
    const ms = await microservicios.usuarios.getAll();
    if (Array.isArray(ms)) {
      const merged = new Map(store.usuarios.map((u) => [u.id, { ...u, nombre: u.nombre }]));
      ms.forEach((u) => merged.set(u.id, { ...merged.get(u.id), ...u }));
      return Array.from(merged.values());
    }
  }
  return store.usuarios;
}

async function getUsuarioById(id) {
  const local = store.usuarios.find((u) => u.id === id);
  if (local) return local;
  if (db.isConfigured()) {
    const row = await dbUsuarios.findById(id);
    if (row) return { id: row.id, nombre: row.nombre, email: row.email };
  }
  if (microservicios.isEnabled()) {
    const ms = await microservicios.usuarios.getById(id);
    if (ms) return { id: ms.id, nombre: ms.nombre, email: ms.email };
  }
  return null;
}

async function getCursos() {
  if (microservicios.isEnabled()) {
    const ms = await microservicios.cursos.getAll();
    if (Array.isArray(ms) && ms.length > 0) return ms;
  }
  return store.cursos;
}

async function ensureCursoGeneral() {
  const cursos = await getCursos();
  if (cursos.length > 0) return cursos[0];
  if (microservicios.isEnabled()) {
    const creado = await microservicios.cursos.create("General", "GEN001");
    if (creado) return creado;
  }
  ensureDefaultCourse();
  return store.cursos[0];
}

async function getTemas() {
  if (microservicios.isEnabled()) {
    const ms = await microservicios.temas.getAll();
    if (Array.isArray(ms)) return ms;
  }
  return store.temas;
}

async function getTemaById(id) {
  const numId = Number(id);
  if (microservicios.isEnabled()) {
    const ms = await microservicios.temas.getById(numId);
    if (ms) return ms;
  }
  return store.temas.find((t) => t.id === numId);
}

async function createTema(titulo, contenido, cursoId, usuarioId) {
  if (microservicios.isEnabled()) {
    const ms = await microservicios.temas.create(titulo, contenido, cursoId, usuarioId);
    if (ms) return ms;
  }
  const nuevo = {
    id: nextId("temas"),
    titulo,
    contenido,
    cursoId,
    usuarioId,
    tags: [],
    estado: "abierto",
    vistas: 0,
    createdAt: new Date().toISOString()
  };
  if (db.isConfigured()) {
    await dbPublicaciones.ensureExists(nuevo.id, usuarioId, cursoId, titulo, contenido);
  }
  store.temas.push(nuevo);
  return nuevo;
}

async function updateTema(id, data) {
  const numId = Number(id);
  if (microservicios.isEnabled()) {
    const tema = await getTemaById(numId);
    if (tema) {
      const ms = await microservicios.temas.update(numId, {
        titulo: data.titulo ?? tema.titulo,
        contenido: data.contenido ?? tema.contenido,
        cursoId: data.cursoId ?? tema.cursoId,
        usuarioId: data.usuarioId ?? tema.usuarioId
      });
      if (ms) return ms;
    }
  }
  const idx = store.temas.findIndex((t) => t.id === numId);
  if (idx < 0) return null;
  if (data.titulo) store.temas[idx].titulo = data.titulo;
  if (data.contenido) store.temas[idx].contenido = data.contenido;
  if (data.tags) store.temas[idx].tags = data.tags;
  return store.temas[idx];
}

async function deleteTema(id) {
  const numId = Number(id);
  if (microservicios.isEnabled()) {
    await microservicios.temas.delete(numId);
  }
  const idx = store.temas.findIndex((t) => t.id === numId);
  if (idx >= 0) store.temas.splice(idx, 1);
}

async function getComentariosByTemaId(temaId) {
  const numId = Number(temaId);
  if (microservicios.isEnabled()) {
    const ms = await microservicios.comentarios.getByTemaId(numId);
    if (Array.isArray(ms)) return ms;
  }
  if (db.isConfigured()) {
    const rows = await dbComentarios.getByPublicacionId(numId);
    if (Array.isArray(rows)) return rows;
  }
  return store.comentarios.filter((c) => c.temaId === numId);
}

async function createComentario(contenido, temaId, usuarioId, parentId = null) {
  if (microservicios.isEnabled()) {
    const ms = await microservicios.comentarios.create(contenido, temaId, usuarioId, parentId);
    if (ms) return ms;
  }
  if (db.isConfigured()) {
    const tema = await getTemaById(temaId);
    if (tema) {
      await dbPublicaciones.ensureExists(temaId, tema.usuarioId, tema.cursoId, tema.titulo, tema.contenido);
    }
    const creado = await dbComentarios.create(usuarioId, temaId, contenido, parentId);
    if (creado) return creado;
  }
  const nuevo = {
    id: nextId("comentarios"),
    contenido,
    temaId,
    usuarioId,
    parentId: parentId,
    esSolucion: false,
    createdAt: new Date().toISOString()
  };
  store.comentarios.push(nuevo);
  return nuevo;
}

function getReacciones() {
  return store.reacciones;
}

module.exports = {
  getUsuarios,
  getUsuarioById,
  getCursos,
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
  setTemaTags,
  store,
  nextId
};
