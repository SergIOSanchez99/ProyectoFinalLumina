import { ExternalLink, Video, FileText, Link2, Trash2 } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'
import './ResourceCard.css'

const TYPE_ICONS = {
  video: Video,
  articulo: FileText,
  documento: FileText,
  link: Link2
}

const TYPE_LABELS = {
  video: 'Video',
  articulo: 'Artículo',
  documento: 'Documento',
  link: 'Enlace'
}

function ResourceCard({ resource, onDelete, currentUserId }) {
  const IconComponent = TYPE_ICONS[resource.type] || Link2
  const typeLabel = TYPE_LABELS[resource.type] || 'Recurso'
  const isOwner = resource.userId === currentUserId

  return (
    <div className="resource-card card">
      <a 
        href={resource.url} 
        target="_blank" 
        rel="noopener noreferrer" 
        className="resource-link"
      >
        <div className="resource-header">
          <span className="resource-type-badge">
            <IconComponent size={16} />
            {typeLabel}
          </span>
          {isOwner && (
            <button
              className="btn-delete-resource"
              onClick={(e) => {
                e.preventDefault()
                onDelete(resource.id)
              }}
              title="Eliminar recurso"
            >
              <Trash2 size={16} />
            </button>
          )}
        </div>
        <h3 className="resource-title">{resource.title}</h3>
        {resource.description && (
          <p className="resource-description">{resource.description}</p>
        )}
        <span className="resource-url">
          <ExternalLink size={14} />
          {resource.url.replace(/^https?:\/\//, '').slice(0, 50)}
          {resource.url.length > 50 ? '...' : ''}
        </span>
      </a>
      <div className="resource-footer">
        <span className="resource-author">
          Por {resource.author?.name}
        </span>
        <span className="resource-time">
          {formatDistanceToNow(new Date(resource.createdAt), {
            addSuffix: true,
            locale: es
          })}
        </span>
      </div>
    </div>
  )
}

export default ResourceCard
