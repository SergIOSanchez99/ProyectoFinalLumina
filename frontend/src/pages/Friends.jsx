import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Users, MessageCircle } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { userService } from '../services/userService'
import { messagingService } from '../services/messagingService'
import toast from 'react-hot-toast'
import './Friends.css'

function Friends() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [friends, setFriends] = useState([])
  const [loading, setLoading] = useState(true)

  const handleMessage = async (e, friend) => {
    e.preventDefault()
    try {
      const { conversationId } = await messagingService.createConversation(friend.id)
      navigate(`/messages?conversation=${conversationId}`)
    } catch {
      navigate('/messages')
    }
  }

  useEffect(() => {
    loadFriends()
  }, [])

  const loadFriends = async () => {
    try {
      setLoading(true)
      const data = await userService.getFriends(user.id)
      setFriends(data)
    } catch (error) {
      toast.error('Error al cargar amigos')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="friends-page">
      <div className="friends-header">
        <h1>
          <Users size={28} />
          Mis amigos
        </h1>
        <p className="friends-subtitle">
          Personas que sigues en la red
        </p>
      </div>

      <div className="friends-content">
        {loading ? (
          <div className="loading-spinner">Cargando amigos...</div>
        ) : friends.length === 0 ? (
          <div className="friends-empty">
            <Users size={64} />
            <h3>No tienes amigos aún</h3>
            <p>Busca usuarios en la barra de búsqueda y síguelos para verlos aquí</p>
            <Link to="/" className="btn-friends-empty">Ir al inicio</Link>
          </div>
        ) : (
          <div className="friends-grid">
            {friends.map((friend) => (
              <div key={friend.id} className="friend-card">
                <Link to={`/profile/${friend.id}`} className="friend-card-link">
                  <div className="friend-avatar">
                    {friend.avatar_url ? (
                      <img src={friend.avatar_url} alt={friend.name} />
                    ) : (
                      friend.name?.charAt(0).toUpperCase()
                    )}
                  </div>
                  <div className="friend-info">
                    <span className="friend-name">{friend.name}</span>
                    {friend.nickname && (
                      <span className="friend-nickname">@{friend.nickname}</span>
                    )}
                  </div>
                </Link>
                <button
                  type="button"
                  className="friend-msg-btn"
                  onClick={(e) => handleMessage(e, friend)}
                  title="Enviar mensaje"
                >
                  <MessageCircle size={18} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default Friends
