import { useState, useEffect, useRef, useCallback } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { MessageCircle, Send, Search, UserPlus } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { messagingService } from '../services/messagingService'
import toast from 'react-hot-toast'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'
import './Messages.css'

function Messages() {
  const { user } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  const [conversations, setConversations] = useState([])
  const [selectedConversation, setSelectedConversation] = useState(null)
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [showNewChat, setShowNewChat] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [searching, setSearching] = useState(false)
  const messagesEndRef = useRef(null)
  const searchDebounceRef = useRef(null)

  useEffect(() => {
    loadConversations()
  }, [])

  const convIdFromUrl = searchParams.get('conversation')
  useEffect(() => {
    if (convIdFromUrl && conversations.length > 0) {
      const id = Number(convIdFromUrl)
      const conv = conversations.find(c => c.id === id)
      if (conv) {
        setSelectedConversation(conv)
        setSearchParams({}, { replace: true })
      }
    }
  }, [convIdFromUrl, conversations])

  useEffect(() => {
    if (selectedConversation) {
      loadMessages(selectedConversation.id)
      setSelectedConversation(prev => {
        const conv = conversations.find(c => c.id === prev.id)
        return conv ? { ...prev, unreadCount: 0 } : prev
      })
    }
  }, [selectedConversation?.id])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const loadConversations = async () => {
    try {
      setLoading(true)
      const data = await messagingService.getConversations()
      setConversations(data)
    } catch (error) {
      toast.error('Error al cargar conversaciones')
    } finally {
      setLoading(false)
    }
  }

  const loadMessages = async (conversationId) => {
    try {
      const data = await messagingService.getMessages(conversationId)
      setMessages(data)
      setConversations(prev =>
        prev.map(c =>
          c.id === conversationId ? { ...c, unreadCount: 0 } : c
        )
      )
    } catch (error) {
      toast.error('Error al cargar mensajes')
    }
  }

  const handleSendMessage = async (e) => {
    e.preventDefault()
    if (!newMessage.trim() || !selectedConversation) return

    try {
      setSending(true)
      const msg = await messagingService.sendMessage(selectedConversation.id, newMessage.trim())
      setMessages(prev => [...prev, msg])
      setNewMessage('')
      loadConversations()
    } catch (error) {
      toast.error('Error al enviar mensaje')
    } finally {
      setSending(false)
    }
  }

  const handleSearchUsers = useCallback(async () => {
    if (searchQuery.length < 3) {
      setSearchResults([])
      return
    }
    try {
      setSearching(true)
      const results = await messagingService.searchUsers(searchQuery)
      setSearchResults(results)
    } catch (error) {
      toast.error('Error al buscar usuarios')
    } finally {
      setSearching(false)
    }
  }, [searchQuery])

  useEffect(() => {
    if (searchQuery.length < 3) {
      setSearchResults([])
      return
    }
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current)
    searchDebounceRef.current = setTimeout(() => handleSearchUsers(), 300)
    return () => {
      if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current)
    }
  }, [searchQuery, handleSearchUsers])

  const handleStartConversation = async (otherUser) => {
    try {
      const { conversationId } = await messagingService.createConversation(otherUser.id)
      const data = await messagingService.getConversations()
      setConversations(data)
      const newConv = data.find(c => c.id === conversationId) || {
        id: conversationId,
        otherUser,
        lastMessage: null,
        lastMessageAt: null,
        unreadCount: 0
      }
      setSelectedConversation(newConv)
      setMessages([])
      setShowNewChat(false)
      setSearchQuery('')
      setSearchResults([])
    } catch (error) {
      toast.error('Error al iniciar conversación')
    }
  }

  const truncate = (str, len) => {
    if (!str) return ''
    return str.length > len ? str.substring(0, len) + '...' : str
  }

  return (
    <div className="messages-page">
      <div className="messages-layout">
        <aside className="messages-sidebar">
          <div className="messages-sidebar-header">
            <h2>Mensajes</h2>
            <button
              className="btn-new-chat"
              onClick={() => setShowNewChat(!showNewChat)}
              title="Nueva conversación"
            >
              <UserPlus size={20} />
            </button>
          </div>

          {showNewChat && (
            <div className="new-chat-panel">
              <p className="new-chat-hint">Busca usuarios registrados para iniciar una conversación</p>
              <div className="search-box">
                <Search size={18} />
                <input
                  type="text"
                  placeholder="Buscar por nombre, email o nickname (mín. 3 caracteres)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="search-results">
                {searching ? (
                  <p className="muted">Buscando...</p>
                ) : searchResults.length === 0 ? (
                  <p className="muted">
                    {searchQuery.length < 3 ? 'Escribe al menos 3 caracteres para buscar usuarios' : 'No se encontraron usuarios'}
                  </p>
                ) : (
                  searchResults.map(u => (
                    <button
                      key={u.id}
                      className="search-result-item"
                      onClick={() => handleStartConversation(u)}
                    >
                      <div className="user-avatar-sm">
                        {u.avatar_url ? (
                          <img src={u.avatar_url} alt={u.name} />
                        ) : (
                          u.name?.charAt(0).toUpperCase()
                        )}
                      </div>
                      <div className="user-info-sm">
                        <span className="user-name-sm">{u.name}</span>
                        {u.nickname && <span className="user-nickname-sm">@{u.nickname}</span>}
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          )}

          <div className="conversations-list">
            {loading ? (
              <div className="loading-spinner">Cargando...</div>
            ) : conversations.length === 0 ? (
              <div className="empty-conversations">
                <MessageCircle size={48} />
                <p>No tienes conversaciones aún</p>
                <span>Busca usuarios para iniciar un chat</span>
              </div>
            ) : (
              conversations.map(conv => (
                <button
                  key={conv.id}
                  className={`conversation-item ${selectedConversation?.id === conv.id ? 'active' : ''}`}
                  onClick={() => setSelectedConversation(conv)}
                >
                  <div className="conv-avatar">
                    {conv.otherUser?.avatar_url ? (
                      <img src={conv.otherUser.avatar_url} alt={conv.otherUser.name} />
                    ) : (
                      conv.otherUser?.name?.charAt(0).toUpperCase()
                    )}
                    {conv.unreadCount > 0 && (
                      <span className="unread-badge">{conv.unreadCount}</span>
                    )}
                  </div>
                  <div className="conv-info">
                    <span className="conv-name">
                      {conv.otherUser?.nickname ? `@${conv.otherUser.nickname}` : conv.otherUser?.name}
                    </span>
                    <span className="conv-preview">
                      {truncate(conv.lastMessage, 35)}
                    </span>
                  </div>
                  {conv.lastMessageAt && (
                    <span className="conv-time">
                      {formatDistanceToNow(new Date(conv.lastMessageAt), { addSuffix: false, locale: es })}
                    </span>
                  )}
                </button>
              ))
            )}
          </div>
        </aside>

        <main className="messages-main">
          {selectedConversation ? (
            <>
              <div className="chat-header">
                <Link to={`/profile/${selectedConversation.otherUser?.id}`} className="chat-user-link">
                  <div className="chat-avatar">
                    {selectedConversation.otherUser?.avatar_url ? (
                      <img src={selectedConversation.otherUser.avatar_url} alt="" />
                    ) : (
                      selectedConversation.otherUser?.name?.charAt(0).toUpperCase()
                    )}
                  </div>
                  <div>
                    <h3>{selectedConversation.otherUser?.name}</h3>
                    {selectedConversation.otherUser?.nickname && (
                      <span className="chat-nickname">@{selectedConversation.otherUser.nickname}</span>
                    )}
                  </div>
                </Link>
              </div>

              <div className="messages-container">
                {messages.map(msg => (
                  <div
                    key={msg.id}
                    className={`message-bubble ${msg.senderId === user.id ? 'sent' : 'received'}`}
                  >
                    {msg.senderId !== user.id && (
                      <div className="message-avatar">
                        {msg.senderAvatar ? (
                          <img src={msg.senderAvatar} alt="" />
                        ) : (
                          msg.senderName?.charAt(0).toUpperCase()
                        )}
                      </div>
                    )}
                    <div className="message-content">
                      <p>{msg.content}</p>
                      <span className="message-time">
                        {formatDistanceToNow(new Date(msg.createdAt), { addSuffix: true, locale: es })}
                      </span>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              <form className="message-input-form" onSubmit={handleSendMessage}>
                <input
                  type="text"
                  placeholder="Escribe un mensaje..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  disabled={sending}
                />
                <button type="submit" className="btn-send" disabled={!newMessage.trim() || sending}>
                  <Send size={20} />
                </button>
              </form>
            </>
          ) : (
            <div className="no-chat-selected">
              <MessageCircle size={80} />
              <h3>Selecciona una conversación</h3>
              <p>Elige un chat de la lista o inicia uno nuevo</p>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}

export default Messages
