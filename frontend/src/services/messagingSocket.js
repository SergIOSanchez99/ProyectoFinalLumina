/**
 * WebSocket para mensajería en vivo
 */
import { io } from 'socket.io-client'

const WS_URL = import.meta.env.VITE_WS_URL || import.meta.env.VITE_API_URL || 'http://localhost:4300'

let socket = null

export const messagingSocket = {
  connect() {
    if (socket?.connected) return socket
    const token = localStorage.getItem('token')
    socket = io(WS_URL.replace(/^ws:/, 'http:'), {
      auth: { token },
      path: '/socket.io'
    })
    return socket
  },

  disconnect() {
    if (socket) {
      socket.disconnect()
      socket = null
    }
  },

  joinConversation(conversationId) {
    if (socket) socket.emit('join-conversation', conversationId)
  },

  leaveConversation(conversationId) {
    if (socket) socket.emit('leave-conversation', conversationId)
  },

  onNewMessage(callback) {
    if (socket) socket.on('new-message', callback)
  },

  onMessagesSeen(callback) {
    if (socket) socket.on('messages-seen', callback)
  },

  onConvUpdate(callback) {
    if (socket) socket.on('conv-update', callback)
  },

  offNewMessage(callback) {
    if (socket) {
      if (callback) socket.off('new-message', callback)
      else socket.off('new-message')
    }
  },

  offMessagesSeen(callback) {
    if (socket) {
      if (callback) socket.off('messages-seen', callback)
      else socket.off('messages-seen')
    }
  },

  offConvUpdate(callback) {
    if (socket) {
      if (callback) socket.off('conv-update', callback)
      else socket.off('conv-update')
    }
  }
}
