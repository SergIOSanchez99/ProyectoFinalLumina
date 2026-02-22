import { useState } from 'react'
import { contentService } from '../services/contentService'
import { useAuth } from '../hooks/useAuth'
import './CreatePublication.css'

function CreatePublication({ onPublicationCreated, courseId }) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    tags: ''
  })
  const { user } = useAuth()

  const handleSubmit = async (e) => {
    e.preventDefault()

    try {
      const tagsArray = formData.tags
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0)

      const publication = await contentService.createPublication({
        ...formData,
        tags: tagsArray,
        ...(courseId && { courseId })
      })

      onPublicationCreated(publication)
      
      setFormData({ title: '', content: '', tags: '' })
      setIsExpanded(false)
    } catch (error) {
      console.error('Error al crear publicación:', error)
    }
  }

  return (
    <div className="create-publication card">
      {!isExpanded ? (
        <button 
          className="create-trigger"
          onClick={() => setIsExpanded(true)}
        >
          <div className="create-trigger-icon">
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <span>¿Qué quieres compartir hoy, {user?.name?.split(' ')[0]}?</span>
        </button>
      ) : (
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            className="form-input"
            placeholder="Título de tu publicación"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            required
            autoFocus
          />
          
          <textarea
            className="form-textarea"
            placeholder="Comparte tu conocimiento, pregunta o recurso..."
            value={formData.content}
            onChange={(e) => setFormData({ ...formData, content: e.target.value })}
            required
            rows={4}
          />

          <input
            type="text"
            className="form-input"
            placeholder="Etiquetas (separadas por comas)"
            value={formData.tags}
            onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
          />

          <div className="create-actions">
            <button 
              type="button" 
              className="btn btn-outline"
              onClick={() => {
                setIsExpanded(false)
                setFormData({ title: '', content: '', tags: '' })
              }}
            >
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary">
              Publicar
            </button>
          </div>
        </form>
      )}
    </div>
  )
}

export default CreatePublication
