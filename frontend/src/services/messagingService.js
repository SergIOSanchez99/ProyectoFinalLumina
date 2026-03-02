import api from './api'

export const messagingService = {
  getConversations: async () => {
    const response = await api.get('/api/messaging/conversations')
    return response.data
  },

  getMessages: async (conversationId) => {
    const response = await api.get(`/api/messaging/conversations/${conversationId}/messages`)
    return response.data
  },

  createConversation: async (otherUserId) => {
    const response = await api.post('/api/messaging/conversations', { otherUserId })
    return response.data
  },

  sendMessage: async (conversationId, content) => {
    const response = await api.post(`/api/messaging/conversations/${conversationId}/messages`, { content })
    return response.data
  },

  markAsRead: async (conversationId, messageIds = null) => {
    const response = await api.put(`/api/messaging/conversations/${conversationId}/read`, { messageIds })
    return response.data
  },

  searchUsers: async (query) => {
    const response = await api.get('/api/messaging/users/search', { params: { q: query } })
    return response.data
  }
}
