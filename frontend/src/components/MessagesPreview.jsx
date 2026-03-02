import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { MessagesSquare } from 'lucide-react'
import { messagingService } from '../services/messagingService'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'
import './MessagesPreview.css'

function MessagesPreview() {
  const [conversations, setConversations] = useState([])
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [hasViewedMessages, setHasViewedMessages] = useState(false)
  const containerRef = useRef(null)
  const navigate = useNavigate()

  useEffect(() => {
    loadConversations()
  }, [])

  useEffect(() => {
    if (isOpen) {
      loadConversations()
    }
  }, [isOpen])

  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [])

  const loadConversations = async () => {
    try {
      setLoading(true)
      const data = await messagingService.getConversations()
      setConversations(data)
    } catch {
      setConversations([])
    } finally {
      setLoading(false)
    }
  }

  const handleConversationClick = (conv) => {
    setHasViewedMessages(true)
    setIsOpen(false)
    navigate(`/messages?conversation=${conv.id}`)
  }

  const handleVerTodos = () => {
    setHasViewedMessages(true)
    setIsOpen(false)
  }

  const truncate = (str, len) => {
    if (!str) return ''
    return str.length > len ? str.substring(0, len) + '...' : str
  }

  return (
    <div className="messages-preview" ref={containerRef}>
      <button
        type="button"
        className={`messages-preview-btn ${isOpen ? 'active' : ''}`}
        onClick={() => {
          setIsOpen(!isOpen)
          if (!isOpen) setHasViewedMessages(true)
        }}
        title="Mensajes"
      >
        <MessagesSquare size={24} />
        {conversations.length > 0 && !hasViewedMessages && (
          <span className="messages-preview-badge">
            {conversations.length > 9 ? '9+' : conversations.length}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="messages-preview-dropdown">
          <div className="messages-preview-header">
            <h4>Mensajes recientes</h4>
            <Link to="/messages" className="messages-preview-ver-todos" onClick={handleVerTodos}>
              Ver todos
            </Link>
          </div>

          <div className="messages-preview-list">
            {loading ? (
              <p className="messages-preview-empty">Cargando...</p>
            ) : conversations.length === 0 ? (
              <p className="messages-preview-empty">No tienes conversaciones</p>
            ) : (
              conversations.slice(0, 5).map((conv) => (
                <button
                  key={conv.id}
                  type="button"
                  className="messages-preview-item"
                  onClick={() => handleConversationClick(conv)}
                >
                  <div className="messages-preview-avatar">
                    {conv.otherUser?.avatar_url ? (
                      <img src={conv.otherUser.avatar_url} alt={conv.otherUser.name} />
                    ) : (
                      conv.otherUser?.name?.charAt(0).toUpperCase()
                    )}
                  </div>
                  <div className="messages-preview-content">
                    <span className="messages-preview-name">
                      {conv.otherUser?.nickname ? `@${conv.otherUser.nickname}` : conv.otherUser?.name}
                    </span>
                    <span className="messages-preview-msg">
                      {truncate(conv.lastMessage || 'Sin mensajes', 35)}
                    </span>
                    {conv.lastMessageAt && (
                      <span className="messages-preview-time">
                        {formatDistanceToNow(new Date(conv.lastMessageAt), { addSuffix: true, locale: es })}
                      </span>
                    )}
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default MessagesPreview
