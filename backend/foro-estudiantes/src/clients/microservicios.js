/**
 * Cliente HTTP para comunicarse con la capa de microservicios (api-gateway).
 * Cuando MICROSERVICIOS_URL está definido, foro-estudiantes usa los microservicios
 * como capa de datos para temas, comentarios, usuarios y chatbot.
 */

const MICROSERVICIOS_URL = process.env.MICROSERVICIOS_URL || "";

async function fetchMicroservicio(path, options = {}) {
  if (!MICROSERVICIOS_URL) return null;
  try {
    const url = `${MICROSERVICIOS_URL.replace(/\/$/, "")}${path}`;
    const res = await fetch(url, {
      ...options,
      headers: { "Content-Type": "application/json", ...options.headers }
    });
    if (res.status === 204) return null;
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
    return data;
  } catch (err) {
    if (!err.message.includes("404")) {
      console.warn("[microservicios] Error:", err.message);
    }
    return null;
  }
}

async function get(path) {
  return fetchMicroservicio(path, { method: "GET" });
}

async function post(path, body) {
  return fetchMicroservicio(path, {
    method: "POST",
    body: JSON.stringify(body)
  });
}

async function put(path, body) {
  return fetchMicroservicio(path, {
    method: "PUT",
    body: JSON.stringify(body)
  });
}

async function del(path) {
  return fetchMicroservicio(path, { method: "DELETE" });
}

const microservicios = {
  isEnabled: () => !!MICROSERVICIOS_URL,

  usuarios: {
    getAll: () => get("/api/usuarios"),
    getById: (id) => get(`/api/usuarios/${id}`),
    create: (nombre, email, id) =>
      post("/api/usuarios", id != null ? { id, nombre, email } : { nombre, email })
  },

  cursos: {
    getAll: () => get("/api/cursos"),
    getById: (id) => get(`/api/cursos/${id}`),
    create: (nombre, codigo) => post("/api/cursos", { nombre, codigo })
  },

  temas: {
    getAll: () => get("/api/temas"),
    getById: (id) => get(`/api/temas/${id}`),
    create: (titulo, contenido, cursoId, usuarioId) =>
      post("/api/temas", { titulo, contenido, cursoId, usuarioId }),
    update: (id, data) => put(`/api/temas/${id}`, data),
    delete: (id) => del(`/api/temas/${id}`)
  },

  comentarios: {
    getByTemaId: (temaId) => get(`/api/comentarios?temaId=${temaId}&publicacion_id=${temaId}`),
    create: (contenido, temaId, usuarioId, parentId = null) =>
      post("/api/comentarios", {
        contenido,
        temaId, publicacion_id: temaId,
        usuarioId, usuario_id: usuarioId,
        parentId, parent_id: parentId
      })
  },

  chatbot: {
    message: (message, curso, tema) =>
      post("/api/chatbot/message", { message, curso, tema })
  }
};

module.exports = microservicios;
