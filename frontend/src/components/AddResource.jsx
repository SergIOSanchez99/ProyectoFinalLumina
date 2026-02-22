import { useState } from 'react'
import { Plus, Link2, Video, FileText } from 'lucide-react'
import toast from 'react-hot-toast'
import './AddResource.css'

const RESOURCE_TYPES = [
  { value: 'link', label: 'Enlace', icon: Link2 },
  { value: 'video', label: 'Video', icon: Video },
  { value: 'articulo', label: 'Artículo', icon: FileText },
  { value: 'documento', label: 'Documento', icon: FileText }
]

function AddResource({ courseId, onResourceCreated }) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    url: '',
    description: '',
    type: 'link'
  })

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const { contentService } = await import('../services/contentService')
      const resource = await contentService.createResource({
        ...formData,
        courseId
      })
      onResourceCreated(resource)
      setFormData({ title: '', url: '', description: '', type: 'link' })
      setIsExpanded(false)
    } catch (error) {
      toast.error('Error al agregar recurso')
    }
  }

  return (
    <div className="add-resource card">
      {!isExpanded ? (
        <button
          className="add-resource-trigger"
          onClick={() => setIsExpanded(true)}
        >
          <Plus size={24} />
          <span>Compartir recurso (enlace, video, artículo)</span>
        </button>
      ) : (
        <form onSubmit={handleSubmit} className="add-resource-form">
          <h4>Nuevo recurso</h4>
          <input
            type="text"
            placeholder="Título del recurso *"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            required
          />
          <input
            type="url"
            placeholder="URL (https://...) *"
            value={formData.url}
            onChange={(e) => setFormData({ ...formData, url: e.target.value })}
            required
          />
          <textarea
            placeholder="Descripción breve (opcional)"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            rows={2}
          />
          <div className="resource-type-select">
            <span>Tipo:</span>
            {RESOURCE_TYPES.map(({ value, label, icon: Icon }) => (
              <button
                key={value}
                type="button"
                className={`type-btn ${formData.type === value ? 'active' : ''}`}
                onClick={() => setFormData({ ...formData, type: value })}
              >
                <Icon size={16} />
                {label}
              </button>
            ))}
          </div>
          <div className="add-resource-actions">
            <button type="button" onClick={() => setIsExpanded(false)}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary">
              Agregar recurso
            </button>
          </div>
        </form>
      )}
    </div>
  )
}

export default AddResource
