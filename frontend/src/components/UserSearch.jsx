import { useState, useEffect, useRef, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Search, MessageCircle, UserPlus } from 'lucide-react'
import { messagingService } from '../services/messagingService'
import { userService } from '../services/userService'
import toast from 'react-hot-toast'
import './UserSearch.css'

function UserSearch() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [searching, setSearching] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const [followingIds, setFollowingIds] = useState(new Set())
  const containerRef = useRef(null)
  const debounceRef = useRef(null)
  const navigate = useNavigate()

  const doSearch = useCallback(async () => {
    if (query.trim().length < 3) {
      setResults([])
      return
    }
    try {
      setSearching(true)
      const data = await messagingService.searchUsers(query.trim())
      setResults(data)
    } catch (err) {
      setResults([])
      toast.error('Error al buscar usuarios')
    } finally {
      setSearching(false)
    }
  }, [query])

  useEffect(() => {
    if (query.trim().length < 3) {
      setResults([])
      return
    }
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(doSearch, 300)
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [query, doSearch])

  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [])

  const handleUserClick = (e, user) => {
    e.preventDefault()
    setIsOpen(false)
    setQuery('')
    setResults([])
    navigate(`/profile/${user.id}`)
  }

  const handleMessageClick = async (e, user) => {
    e.preventDefault()
    e.stopPropagation()
    try {
      const { conversationId } = await messagingService.createConversation(user.id)
      setIsOpen(false)
      setQuery('')
      setResults([])
      navigate(`/messages?conversation=${conversationId}`)
    } catch {
      navigate('/messages')
    }
  }

  return (
    <div className="user-search" ref={containerRef}>
      <div
        className={`user-search-input-wrap ${isOpen ? 'open' : ''}`}
        onClick={() => setIsOpen(true)}
      >
        <Search size={20} className="user-search-icon" />
        <input
          type="text"
          placeholder="Buscar ..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsOpen(true)}
          className="user-search-input"
        />
      </div>

      {isOpen && (
        <div className="user-search-dropdown">
          {query.trim().length < 3 ? (
            <p className="user-search-hint">Escribe al menos 3 caracteres</p>
          ) : searching ? (
            <p className="user-search-hint">Buscando...</p>
          ) : results.length === 0 ? (
            <p className="user-search-hint">No se encontraron usuarios</p>
          ) : (
            <ul className="user-search-results">
              {results.map((u) => (
                <li key={u.id} className="user-search-result-item">
                  <Link
                    to={`/profile/${u.id}`}
                    className="user-search-result-link"
                    onClick={(e) => handleUserClick(e, u)}
                  >
                    <div className="user-search-avatar">
                      {u.avatar_url ? (
                        <img src={u.avatar_url} alt={u.name} />
                      ) : (
                        u.name?.charAt(0).toUpperCase()
                      )}
                    </div>
                    <div className="user-search-info">
                      <span className="user-search-name">{u.name}</span>
                      {u.nickname && (
                        <span className="user-search-nickname">@{u.nickname}</span>
                      )}
                    </div>
                  </Link>
                  <button
                    type="button"
                    className={`user-search-add-btn ${followingIds.has(u.id) ? 'added' : ''}`}
                    onClick={(e) => handleFollowClick(e, u)}
                    title={followingIds.has(u.id) ? 'Agregado' : 'Agregar amigo'}
                    disabled={followingIds.has(u.id)}
                  >
                    <UserPlus size={18} />
                  </button>
                  <button
                    type="button"
                    className="user-search-msg-btn"
                    onClick={(e) => handleMessageClick(e, u)}
                    title="Enviar mensaje"
                  >
                    <MessageCircle size={18} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}

export default UserSearch
