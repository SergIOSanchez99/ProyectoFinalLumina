import { useState, useRef, useEffect } from 'react'
import { ThumbsUp, Heart, Lightbulb, Users, HelpCircle, MessageSquare, Trash2 } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'
import { contentService } from '../services/contentService'
import toast from 'react-hot-toast'
import './PublicationCard.css'

// Configuración de reacciones
const REACTIONS = {
  like: { icon: ThumbsUp, label: 'Me gusta', emoji: '👍' },
  love: { icon: Heart, label: 'Me encanta', emoji: '❤️' },
  insightful: { icon: Lightbulb, label: 'Impactado', emoji: '💡' },
  support: { icon: Users, label: 'Apoyo', emoji: '🙌' },
  thinking: { icon: HelpCircle, label: 'Interesante', emoji: '🤔' }
}

function PublicationCard({ publication, onReact, onDelete, currentUserId }) {
  const [showComments, setShowComments] = useState(false)
  const [comments, setComments] = useState([])
  const [commentInput, setCommentInput] = useState('')
  const [loadingComments, setLoadingComments] = useState(false)
  const [showReactionPicker, setShowReactionPicker] = useState(false)
  const reactionPickerRef = useRef(null)

  const [replyingTo, setReplyingTo] = useState(null)

  const buildCommentTree = (commentsList) => {
    const commentMap = {}
    const tree = []

    commentsList.forEach(comment => {
      commentMap[comment.id] = { ...comment, children: [] }
    })

    commentsList.forEach(comment => {
      if (comment.parentId || comment.parent_id) {
        const pId = comment.parentId || comment.parent_id
        if (commentMap[pId]) {
          commentMap[pId].children.push(commentMap[comment.id])
        } else {
          tree.push(commentMap[comment.id])
        }
      } else {
        tree.push(commentMap[comment.id])
      }
    })
    return tree
  }

  // Cerrar picker al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (reactionPickerRef.current && !reactionPickerRef.current.contains(event.target)) {
        setShowReactionPicker(false)
      }
    }

    if (showReactionPicker) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showReactionPicker])

  const loadComments = async () => {
    if (comments.length > 0) {
      setShowComments(!showComments)
      return
    }

    try {
      setLoadingComments(true)
      const data = await contentService.getComments(publication.id)
      setComments(data)
      setShowComments(true)
    } catch (error) {
      toast.error('Error al cargar comentarios')
    } finally {
      setLoadingComments(false)
    }
  }

  const handleComment = async () => {
    if (!commentInput.trim()) return

    try {
      const parentId = replyingTo ? replyingTo.id : null
      const newComment = await contentService.createComment(publication.id, commentInput, parentId)
      setComments([...comments, newComment])
      setCommentInput('')
      setReplyingTo(null)
      toast.success('Comentario agregado')
    } catch (error) {
      toast.error('Error al agregar comentario')
    }
  }

  const handleReaction = async (reactionType) => {
    setShowReactionPicker(false)
    await onReact(publication.id, reactionType)
  }

  const isOwner = publication.userId === currentUserId

  // Calcular reacción total y principal
  const totalReactions = publication.totalReactions || 0
  const userReaction = publication.userReaction

  // Obtener las top 3 reacciones
  const topReactions = Object.entries(publication.reactions || {})
    .filter(([_, count]) => count > 0)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)

  const commentTree = buildCommentTree(comments)

  const CommentNode = ({ comment, depth = 0 }) => (
    <div className={`comment-node depth-${depth}`}>
      <div className="comment">
        <div className="comment-avatar">
          {comment.author?.name?.charAt(0).toUpperCase()}
        </div>
        <div className="comment-content">
          <div className="comment-header-row">
            <h5>{comment.author?.name}</h5>
            <span className="comment-time">
              {formatDistanceToNow(new Date(comment.createdAt || new Date()), {
                addSuffix: true,
                locale: es
              })}
            </span>
          </div>
          <p>{comment.content}</p>
          <div className="comment-actions">
            <button
              className="reply-btn"
              onClick={() => {
                setReplyingTo(comment)
                // Opcional: enfocar el input de comentario aquí si tuviéramos una referencia
              }}
            >
              Responder
            </button>
          </div>
        </div>
      </div>
      {/* Recursivamente renderizar las respuestas (hijos) */}
      {comment.children && comment.children.length > 0 && (
        <div className="nested-comments">
          {comment.children.map(child => (
            <CommentNode key={child.id} comment={child} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  )

  return (
    <div className="publication-card card">
      <div className="publication-header">
        <div className="author-info">
          <div className="author-avatar">
            {publication.author?.name?.charAt(0).toUpperCase()}
          </div>
          <div>
            <h4>{publication.author?.name}</h4>
            <span className="publication-time">
              {formatDistanceToNow(new Date(publication.createdAt), {
                addSuffix: true,
                locale: es
              })}
            </span>
          </div>
        </div>
        {isOwner && (
          <button
            className="btn-delete"
            onClick={() => onDelete(publication.id)}
            title="Eliminar publicación"
          >
            <Trash2 size={18} />
          </button>
        )}
      </div>

      <div className="publication-content">
        <h3>{publication.title}</h3>
        <p>{publication.content}</p>
        {publication.tags && (() => {
          const tags = Array.isArray(publication.tags)
            ? publication.tags
            : String(publication.tags).split(',').map(t => t.trim()).filter(Boolean)
          return tags.length > 0 ? (
            <div className="publication-tags">
              {tags.map((tag, index) => (
                <span key={index} className="tag">#{tag}</span>
              ))}
            </div>
          ) : null
        })()}
      </div>

      {/* Mostrar resumen de reacciones */}
      {totalReactions > 0 && (
        <div className="reactions-summary">
          <div className="reactions-icons">
            {topReactions.map(([type]) => (
              <span key={type} className="reaction-emoji" title={REACTIONS[type].label}>
                {REACTIONS[type].emoji}
              </span>
            ))}
          </div>
          <span className="reactions-count">{totalReactions}</span>
        </div>
      )}

      <div className="publication-footer">
        <div className="publication-actions">
          {/* Botón de reacción con picker */}
          <div className="reaction-button-container" ref={reactionPickerRef}>
            <button
              className={`reaction-btn ${userReaction ? 'active' : ''}`}
              onClick={() => userReaction ? handleReaction(userReaction) : setShowReactionPicker(!showReactionPicker)}
              onMouseEnter={() => setShowReactionPicker(true)}
              title={userReaction ? REACTIONS[userReaction].label : 'Reaccionar'}
            >
              {userReaction ? (
                <>
                  {REACTIONS[userReaction].emoji}
                  <span>{REACTIONS[userReaction].label}</span>
                </>
              ) : (
                <>
                  <ThumbsUp size={18} />
                  <span>Reaccionar</span>
                </>
              )}
            </button>

            {/* Picker de reacciones (estilo Facebook) */}
            {showReactionPicker && (
              <div className="reaction-picker">
                {Object.entries(REACTIONS).map(([type, config]) => {
                  const IconComponent = config.icon
                  return (
                    <button
                      key={type}
                      className={`reaction-option ${userReaction === type ? 'selected' : ''}`}
                      onClick={() => handleReaction(type)}
                      title={config.label}
                    >
                      <span className="reaction-emoji-large">{config.emoji}</span>
                      <span className="reaction-label">{config.label}</span>
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          <button
            className="comment-btn"
            onClick={loadComments}
            title="Ver comentarios"
          >
            <MessageSquare size={18} />
            <span>{publication.commentsCount || 0} Comentarios</span>
          </button>
        </div>
      </div>

      {showComments && (
        <div className="comments-section">
          <div className="comments-list">
            {loadingComments ? (
              <div className="loading-spinner">Cargando...</div>
            ) : commentTree.length === 0 ? (
              <p className="no-comments">No hay comentarios aún</p>
            ) : (
              commentTree.map(comment => (
                <CommentNode key={comment.id} comment={comment} depth={0} />
              ))
            )}
          </div>

          <div className="comment-input-section">
            {replyingTo && (
              <div className="reply-indicator">
                <span>Respondiendo a <strong>{replyingTo.author?.name || 'Usuario'}</strong></span>
                <button
                  className="cancel-reply-btn"
                  onClick={() => setReplyingTo(null)}
                  title="Cancelar respuesta"
                >
                  ✕
                </button>
              </div>
            )}
            <textarea
              className="comment-input"
              placeholder={replyingTo ? 'Escribe tu respuesta...' : 'Escribe un comentario...'}
              value={commentInput}
              onChange={(e) => setCommentInput(e.target.value)}
              rows={2}
            />
            <button
              className="btn btn-primary btn-sm"
              onClick={handleComment}
            >
              Comentar
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default PublicationCard
