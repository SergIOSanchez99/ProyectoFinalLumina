import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Home, BookOpen, BarChart2, Users } from 'lucide-react'
import { contentService } from '../services/contentService'
import { useAuth } from '../hooks/useAuth'
import toast from 'react-hot-toast'
import PublicationCard from '../components/PublicationCard'
import CreatePublication from '../components/CreatePublication'
import './Feed.css'

function Feed() {
  const [publications, setPublications] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const { user } = useAuth()

  useEffect(() => {
    loadPublications()
  }, [filter])

  const loadPublications = async () => {
    try {
      setLoading(true)
      const data = await contentService.getPublications({ filter })
      setPublications(data)
    } catch (error) {
      toast.error('Error al cargar publicaciones')
    } finally {
      setLoading(false)
    }
  }

  const handlePublicationCreated = (newPublication) => {
    setPublications([newPublication, ...publications])
    toast.success('Publicación creada exitosamente')
  }

  const handleReact = async (publicationId, reactionType) => {
    try {
      await contentService.reactToPublication(publicationId, reactionType)
      
      // Recargar publicaciones para actualizar contadores
      const updatedPublications = await contentService.getPublications()
      setPublications(updatedPublications)
    } catch (error) {
      toast.error('Error al reaccionar')
    }
  }

  const handleDelete = async (publicationId) => {
    try {
      await contentService.deletePublication(publicationId)
      setPublications(publications.filter(pub => pub.id !== publicationId))
      toast.success('Publicación eliminada')
    } catch (error) {
      toast.error('Error al eliminar publicación')
    }
  }

  return (
    <div className="feed-layout">
      {/* Sidebar izquierdo - Navegación */}
      <aside className="feed-sidebar-left">
        <div className="feed-sidebar-card">
          <h3>Menú</h3>
          <Link to="/" className="feed-nav-item active">
            <span className="feed-nav-icon">
              <Home size={20} />
            </span>
            Inicio
          </Link>
          <Link to="/courses/1" className="feed-nav-item">
            <span className="feed-nav-icon">
              <BookOpen size={20} />
            </span>
            Cursos
          </Link>
          <Link to="/friends" className="feed-nav-item">
            <span className="feed-nav-icon">
              <Users size={20} />
            </span>
            Amigos
          </Link>
          <Link to="/impact" className="feed-nav-item">
            <span className="feed-nav-icon">
              <BarChart2 size={20} />
            </span>
            Mi impacto
          </Link>
        </div>
      </aside>

      {/* Columna central - Feed */}
      <main className="feed-center">
        <div className="feed-header">
          <h1>Inicio</h1>
          <div className="feed-filters">
            <button 
              className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
              onClick={() => setFilter('all')}
            >
              Todos
            </button>
            <button 
              className={`filter-btn ${filter === 'my-courses' ? 'active' : ''}`}
              onClick={() => setFilter('my-courses')}
            >
              Mis cursos
            </button>
            <Link to="/messages" className="filter-btn filter-btn-link" title="Mensajes">
              Mensajes
            </Link>
            <button 
              className={`filter-btn ${filter === 'trending' ? 'active' : ''}`}
              onClick={() => setFilter('trending')}
            >
              Tendencias
            </button>
          </div>
        </div>

        <CreatePublication onPublicationCreated={handlePublicationCreated} />

        <div className="publications-list">
          {loading ? (
            <div className="loading-spinner">Cargando publicaciones...</div>
          ) : publications.length === 0 ? (
            <div className="empty-state">
              <p>No hay publicaciones aún. ¡Sé el primero en compartir!</p>
            </div>
          ) : (
            publications.map(publication => (
              <PublicationCard
                key={publication.id}
                publication={publication}
                onReact={handleReact}
                onDelete={handleDelete}
                currentUserId={user.id}
              />
            ))
          )}
        </div>
      </main>

      {/* Sidebar derecho - Widgets */}
      <aside className="feed-sidebar-right">
        <div className="feed-widget">
          <h3>Tu perfil</h3>
          <Link to="/profile" className="feed-widget-item">
            <div className="widget-avatar">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <div>
              <div style={{ fontWeight: 600 }}>{user?.name}</div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                Ver perfil
              </div>
            </div>
          </Link>
        </div>
        <div className="feed-widget">
          <h3>Enlaces rápidos</h3>
          <Link to="/courses/1" className="feed-widget-item">
            <span className="feed-nav-icon">
              <BookOpen size={20} />
            </span>
            Explorar cursos
          </Link>
          <Link to="/friends" className="feed-widget-item">
            <span className="feed-nav-icon">
              <Users size={20} />
            </span>
            Amigos
          </Link>
        </div>
      </aside>
    </div>
  )
}

export default Feed
