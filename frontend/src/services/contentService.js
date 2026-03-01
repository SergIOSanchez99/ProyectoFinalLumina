import api from './api'

export const contentService = {
  // Curso
  getCourse: async (courseId) => {
    const response = await api.get(`/api/cursos/${courseId}`)
    return response.data
  },
  // Publicaciones
  getPublications: async (filters = {}) => {
    const response = await api.get('/api/content/publications', { params: filters })
    return response.data
  },

  getPublicationById: async (id) => {
    const response = await api.get(`/api/content/publications/${id}`)
    return response.data
  },

  createPublication: async (data) => {
    const response = await api.post('/api/content/publications', data)
    return response.data
  },

  updatePublication: async (id, data) => {
    const response = await api.put(`/api/content/publications/${id}`, data)
    return response.data
  },

  deletePublication: async (id) => {
    const response = await api.delete(`/api/content/publications/${id}`)
    return response.data
  },

  // Comentarios
  getComments: async (publicationId) => {
    const response = await api.get(`/api/content/publications/${publicationId}/comments`)
    return response.data
  },

  createComment: async (publicationId, content, parentId = null) => {
    const payload = { content }
    if (parentId) {
      payload.parent_id = parentId
    }
    const response = await api.post(`/api/content/publications/${publicationId}/comments`, payload)
    return response.data
  },

  deleteComment: async (commentId) => {
    const response = await api.delete(`/api/content/comments/${commentId}`)
    return response.data
  },

  // Reacciones
  reactToPublication: async (publicationId, reactionType) => {
    const response = await api.post(`/api/content/publications/${publicationId}/react`, { reactionType })
    return response.data
  },

  getReactions: async (publicationId) => {
    const response = await api.get(`/api/content/publications/${publicationId}/reactions`)
    return response.data
  },

  // Apuntes
  getNotes: async (courseId) => {
    const response = await api.get(`/api/content/notes`, { params: { courseId } })
    return response.data
  },

  getNoteById: async (id) => {
    const response = await api.get(`/api/content/notes/${id}`)
    return response.data
  },

  createNote: async (data) => {
    const response = await api.post('/api/content/notes', data)
    return response.data
  },

  updateNote: async (id, data) => {
    const response = await api.put(`/api/content/notes/${id}`, data)
    return response.data
  },

  // Recursos (enlaces, videos, materiales)
  getResources: async (courseId) => {
    const response = await api.get('/api/content/resources', { params: { courseId } })
    return response.data
  },

  createResource: async (data) => {
    const response = await api.post('/api/content/resources', data)
    return response.data
  },

  deleteResource: async (id) => {
    await api.delete(`/api/content/resources/${id}`)
  }
}
