import { Link } from 'react-router-dom'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'
import './NoteCard.css'

function NoteCard({ note }) {
  return (
    <Link to={`/editor/${note.id}`} className="note-card-link">
      <div className="note-card card">
        <div className="note-header">
          <h3>{note.title}</h3>
          <span className="note-badge">
            {note.collaboratorsCount || 1} colaborador(es)
          </span>
        </div>

        <div className="note-preview">
          {note.preview || (note.content ? `${note.content.slice(0, 150)}${note.content.length > 150 ? '...' : ''}` : 'Sin contenido previo...')}
        </div>

        <div className="note-footer">
          <div className="note-meta">
            <span className="note-author">
              Por {note.author?.name}
            </span>
            <span className="note-time">
              {formatDistanceToNow(new Date(note.updatedAt), {
                addSuffix: true,
                locale: es
              })}
            </span>
          </div>

          <div className="note-stats">
            <span>👁️ {note.views || 0}</span>
            <span>👍 {note.likes || 0}</span>
          </div>
        </div>
      </div>
    </Link>
  )
}

export default NoteCard
