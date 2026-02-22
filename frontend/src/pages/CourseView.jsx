import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { Link } from 'react-router-dom'
import { BookOpen, FileText, Link2 } from 'lucide-react'
import { contentService } from '../services/contentService'
import { useAuth } from '../hooks/useAuth'
import toast from 'react-hot-toast'
import NoteCard from '../components/NoteCard'
import PublicationCard from '../components/PublicationCard'
import CreatePublication from '../components/CreatePublication'
import ResourceCard from '../components/ResourceCard'
import AddResource from '../components/AddResource'
import './CourseView.css'

const TABS = {
  apuntes: { key: 'apuntes', label: 'Apuntes Colaborativos', icon: FileText },
  publicaciones: { key: 'publicaciones', label: 'Publicaciones', icon: BookOpen },
  recursos: { key: 'recursos', label: 'Recursos', icon: Link2 }
}

function CourseView() {
  const { courseId } = useParams()
  const [activeTab, setActiveTab] = useState('apuntes')
  const [course, setCourse] = useState(null)
  const [notes, setNotes] = useState([])
  const [publications, setPublications] = useState([])
  const [resources, setResources] = useState([])
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()

  useEffect(() => {
    loadCourseData()
  }, [courseId])

  useEffect(() => {
    if (activeTab === 'apuntes') loadNotes()
    else if (activeTab === 'publicaciones') loadPublications()
    else if (activeTab === 'recursos') loadResources()
  }, [activeTab, courseId])

  const loadCourseData = async () => {
    try {
      setLoading(true)
      const [notesData, courseData] = await Promise.all([
        contentService.getNotes(courseId),
        contentService.getCourse(courseId).catch(() => null)
      ])
      setNotes(notesData)
      const c = courseData || {}
      setCourse({
        id: courseId,
        nombre: c.nombre || c.name || `Curso ${courseId}`,
        descripcion: c.descripcion || c.description || 'Explora apuntes, publicaciones y recursos compartidos por la comunidad.'
      })
    } catch (error) {
      toast.error('Error al cargar curso')
      setCourse({ id: courseId, nombre: `Curso ${courseId}`, descripcion: '', name: `Curso ${courseId}`, description: '' })
    } finally {
      setLoading(false)
    }
  }

  const loadNotes = async () => {
    try {
      const data = await contentService.getNotes(courseId)
      setNotes(data)
    } catch {
      setNotes([])
    }
  }

  const loadPublications = async () => {
    try {
      const data = await contentService.getPublications({ courseId })
      setPublications(data)
    } catch {
      setPublications([])
    }
  }

  const loadResources = async () => {
    try {
      const data = await contentService.getResources(courseId)
      setResources(data)
    } catch {
      setResources([])
    }
  }

  const handlePublicationCreated = (newPublication) => {
    setPublications([newPublication, ...publications])
    toast.success('Publicación creada')
  }

  const handleReact = async (publicationId, reactionType) => {
    try {
      await contentService.reactToPublication(publicationId, reactionType)
      const updated = await contentService.getPublications({ courseId })
      setPublications(updated)
    } catch {
      toast.error('Error al reaccionar')
    }
  }

  const handleDeletePublication = async (publicationId) => {
    try {
      await contentService.deletePublication(publicationId)
      setPublications(publications.filter(p => p.id !== publicationId))
      toast.success('Publicación eliminada')
    } catch {
      toast.error('Error al eliminar')
    }
  }

  const handleResourceCreated = (newResource) => {
    setResources([newResource, ...resources])
    toast.success('Recurso agregado')
  }

  const handleDeleteResource = async (resourceId) => {
    try {
      await contentService.deleteResource(resourceId)
      setResources(resources.filter(r => r.id !== resourceId))
      toast.success('Recurso eliminado')
    } catch {
      toast.error('Error al eliminar')
    }
  }

  const handleCreateNote = () => {
    window.location.href = `/editor/new?course=${courseId}`
  }

  if (loading) {
    return <div className="loading-spinner">Cargando curso...</div>
  }

  const courseName = course?.nombre || course?.name || `Curso ${courseId}`
  const courseDesc = course?.descripcion || course?.description || ''

  return (
    <div className="course-view-container">
      <div className="course-header">
        <div className="course-info">
          <h1>{courseName}</h1>
          <p>{courseDesc}</p>
        </div>
        {activeTab === 'apuntes' && (
          <button className="btn btn-primary" onClick={handleCreateNote}>
            Crear Nuevo Apunte
          </button>
        )}
      </div>

      <div className="course-tabs">
        {Object.values(TABS).map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            className={`tab-btn ${activeTab === key ? 'active' : ''}`}
            onClick={() => setActiveTab(key)}
          >
            <Icon size={18} />
            {label}
          </button>
        ))}
      </div>

      {activeTab === 'apuntes' && (
        <div className="notes-grid">
          {notes.length === 0 ? (
            <div className="empty-state">
              <FileText size={48} className="empty-icon" />
              <p>No hay apuntes aún. ¡Crea el primero!</p>
              <button className="btn btn-primary" onClick={handleCreateNote}>
                Crear apunte
              </button>
            </div>
          ) : (
            notes.map(note => (
              <NoteCard key={note.id} note={note} />
            ))
          )}
        </div>
      )}

      {activeTab === 'publicaciones' && (
        <div className="course-publications">
          <CreatePublication
            onPublicationCreated={handlePublicationCreated}
            courseId={courseId}
          />
          {publications.length === 0 ? (
            <div className="empty-state">
              <BookOpen size={48} className="empty-icon" />
              <p>No hay publicaciones en este curso. ¡Comparte una duda o conocimiento!</p>
            </div>
          ) : (
            <div className="publications-list">
              {publications.map(pub => (
                <PublicationCard
                  key={pub.id}
                  publication={pub}
                  onReact={handleReact}
                  onDelete={handleDeletePublication}
                  currentUserId={user?.id}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'recursos' && (
        <div className="course-resources">
          <AddResource
            courseId={courseId}
            onResourceCreated={handleResourceCreated}
          />
          {resources.length === 0 ? (
            <div className="empty-state">
              <Link2 size={48} className="empty-icon" />
              <p>No hay recursos compartidos. ¡Agrega enlaces a videos, artículos o materiales de estudio!</p>
            </div>
          ) : (
            <div className="resources-grid">
              {resources.map(resource => (
                <ResourceCard
                  key={resource.id}
                  resource={resource}
                  onDelete={handleDeleteResource}
                  currentUserId={user?.id}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default CourseView
