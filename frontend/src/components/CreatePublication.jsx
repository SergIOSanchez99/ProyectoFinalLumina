import { useState, useRef, useEffect } from 'react'
import { X, Image, Tag, Link2, Smile, ChevronDown } from 'lucide-react'
import { contentService } from '../services/contentService'
import { useAuth } from '../hooks/useAuth'
import toast from 'react-hot-toast'
import './CreatePublication.css'

const EMOJIS = [
  '👍', '❤️', '😂', '😊', '🎉', '🔥', '💡', '📚', '✏️', '📝',
  '🎯', '✅', '❌', '⚠️', '💬', '🙌', '👏', '🤔', '😅', '🌟',
  '📖', '🔗', '📷', '💻', '🧠', '⭐', '🏆', '📌', '🔔', '💪'
]

const MAX_IMAGE_SIZE = 500 * 1024 // 500KB para base64

function CreatePublication({ onPublicationCreated, courseId, courseName }) {
  const [showModal, setShowModal] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    tags: ''
  })
  const [showTagsInput, setShowTagsInput] = useState(false)
  const [showLinkInput, setShowLinkInput] = useState(false)
  const [linkUrl, setLinkUrl] = useState('')
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [showImageMenu, setShowImageMenu] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const modalRef = useRef(null)
  const textareaRef = useRef(null)
  const fileInputRef = useRef(null)
  const emojiPickerRef = useRef(null)
  const imageMenuRef = useRef(null)
  const { user } = useAuth()

  const insertAtCursor = (text) => {
    const ta = textareaRef.current
    if (!ta) {
      setFormData(prev => ({ ...prev, content: prev.content + text }))
      return
    }
    const start = ta.selectionStart
    const end = ta.selectionEnd
    const before = formData.content.slice(0, start)
    const after = formData.content.slice(end)
    const newContent = before + text + after
    setFormData(prev => ({ ...prev, content: newContent }))
    setTimeout(() => {
      ta.focus()
      ta.setSelectionRange(start + text.length, start + text.length)
    }, 0)
  }

  const handleImageFile = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      toast.error('Solo se permiten imágenes (JPG, PNG, GIF, WebP)')
      return
    }
    if (file.size > MAX_IMAGE_SIZE) {
      toast.error('La imagen no debe superar 500KB. Usa una URL para imágenes más grandes.')
      return
    }
    const reader = new FileReader()
    reader.onload = () => {
      insertAtCursor('\n\n' + reader.result + '\n\n')
      toast.success('Imagen añadida')
    }
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  const handleImageUrl = () => {
    const url = prompt('Pega la URL de la imagen:')
    if (url?.trim()) {
      const u = url.trim().startsWith('http') ? url.trim() : 'https://' + url.trim()
      insertAtCursor('\n\n' + u + '\n\n')
      toast.success('Imagen añadida')
    }
  }

  const handleAddLink = () => {
    if (linkUrl.trim()) {
      const text = linkUrl.startsWith('http') ? linkUrl : 'https://' + linkUrl
      insertAtCursor('\n\n🔗 ' + text + '\n\n')
      setLinkUrl('')
      setShowLinkInput(false)
      toast.success('Enlace añadido')
    }
  }

  const handleEmojiClick = (emoji) => {
    insertAtCursor(emoji)
  }

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        setShowModal(false)
        setShowLinkInput(false)
        setShowEmojiPicker(false)
      }
    }
    const handleClickOutside = (e) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(e.target)) {
        setShowEmojiPicker(false)
      }
      if (imageMenuRef.current && !imageMenuRef.current.contains(e.target)) {
        setShowImageMenu(false)
      }
    }
    if (showModal) {
      document.addEventListener('keydown', handleEscape)
      document.addEventListener('mousedown', handleClickOutside)
      document.body.style.overflow = 'hidden'
    }
    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.removeEventListener('mousedown', handleClickOutside)
      document.body.style.overflow = ''
    }
  }, [showModal, showEmojiPicker, showImageMenu])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.title.trim() || !formData.content.trim()) {
      toast.error('Título y contenido son obligatorios')
      return
    }

    setIsSubmitting(true)
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
      toast.success('Publicación creada')
      setFormData({ title: '', content: '', tags: '' })
      setShowModal(false)
      setShowTagsInput(false)
      setShowLinkInput(false)
      setShowEmojiPicker(false)
      setShowImageMenu(false)
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error al crear publicación')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    setShowModal(false)
    setFormData({ title: '', content: '', tags: '' })
    setShowTagsInput(false)
    setShowLinkInput(false)
    setShowEmojiPicker(false)
    setShowImageMenu(false)
    setLinkUrl('')
  }

  const canPublish = formData.title.trim() && formData.content.trim()
  const audienceLabel = courseId ? (courseName || 'Curso') : 'Comunidad'
  const placeholder = courseId
    ? '¿Qué duda, apunte o recurso quieres compartir con el curso?'
    : '¿Qué quieres compartir con la comunidad académica?'

  return (
    <>
      <button
        className="create-publication-trigger"
        onClick={() => setShowModal(true)}
      >
        <div className="create-trigger-avatar">
          {user?.avatar_url ? (
            <img src={user.avatar_url} alt="" />
          ) : (
            <span>{user?.name?.charAt(0)?.toUpperCase() || '?'}</span>
          )}
        </div>
        <span className="create-trigger-text">{placeholder}</span>
      </button>

      {showModal && (
        <div
          className="create-publication-overlay"
          onClick={(e) => e.target === e.currentTarget && handleClose()}
        >
          <div className="create-publication-modal" ref={modalRef}>
            <header className="create-modal-header">
              <h2>Crear publicación</h2>
              <button
                type="button"
                className="create-modal-close"
                onClick={handleClose}
                aria-label="Cerrar"
              >
                <X size={24} />
              </button>
            </header>

            <form onSubmit={handleSubmit} className="create-modal-form">
              <div className="create-modal-user">
                <div className="create-modal-avatar">
                  {user?.avatar_url ? (
                    <img src={user.avatar_url} alt="" />
                  ) : (
                    <span>{user?.name?.charAt(0)?.toUpperCase() || '?'}</span>
                  )}
                </div>
                <div className="create-modal-user-info">
                  <span className="create-modal-name">{user?.name || 'Usuario'}</span>
                  <button type="button" className="create-modal-audience">
                    <span>{audienceLabel}</span>
                    <ChevronDown size={16} />
                  </button>
                </div>
              </div>

              <div className="create-modal-content">
                <input
                  type="text"
                  className="create-modal-title"
                  placeholder="Título (ej: Duda sobre recursión)"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
                <textarea
                  ref={textareaRef}
                  className="create-modal-textarea"
                  placeholder={placeholder}
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  required
                  rows={5}
                />
                {showTagsInput && (
                  <input
                    type="text"
                    className="create-modal-tags"
                    placeholder="Etiquetas separadas por comas (ej: programación, algoritmos)"
                    value={formData.tags}
                    onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                  />
                )}
                {showLinkInput && (
                  <div className="create-modal-link-row">
                    <input
                      type="url"
                      className="create-modal-link-input"
                      placeholder="https://ejemplo.com/recurso"
                      value={linkUrl}
                      onChange={(e) => setLinkUrl(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddLink())}
                    />
                    <button type="button" className="create-modal-link-btn" onClick={handleAddLink}>
                      Añadir
                    </button>
                  </div>
                )}
              </div>

              <div className="create-modal-add-section">
                <span className="create-modal-add-label">Añadir a tu publicación</span>
                <div className="create-modal-add-icons">
                  <div className="create-add-icon-wrapper" ref={imageMenuRef}>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/gif,image/webp"
                      onChange={handleImageFile}
                      className="create-add-file-input"
                    />
                    <button
                      type="button"
                      className="create-add-icon create-add-icon--image"
                      title="Imagen"
                      onClick={() => setShowImageMenu(!showImageMenu)}
                    >
                      <Image size={22} />
                    </button>
                    {showImageMenu && (
                      <div className="create-image-menu">
                        <button type="button" onClick={() => { fileInputRef.current?.click(); setShowImageMenu(false); }}>
                          Subir archivo
                        </button>
                        <button type="button" onClick={() => { handleImageUrl(); setShowImageMenu(false); }}>
                          Pegar URL
                        </button>
                      </div>
                    )}
                  </div>
                  <button
                    type="button"
                    className="create-add-icon create-add-icon--tag"
                    title="Etiquetas"
                    onClick={() => setShowTagsInput(!showTagsInput)}
                  >
                    <Tag size={22} />
                  </button>
                  <button
                    type="button"
                    className="create-add-icon create-add-icon--link"
                    title="Añadir enlace"
                    onClick={() => setShowLinkInput(!showLinkInput)}
                  >
                    <Link2 size={22} />
                  </button>
                  <div className="create-add-icon-wrapper" ref={emojiPickerRef}>
                    <button
                      type="button"
                      className="create-add-icon create-add-icon--emoji"
                      title="Emojis"
                      onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                    >
                      <Smile size={22} />
                    </button>
                    {showEmojiPicker && (
                      <div className="create-emoji-picker">
                        {EMOJIS.map((emoji, i) => (
                          <button
                            key={i}
                            type="button"
                            className="create-emoji-btn"
                            onClick={() => handleEmojiClick(emoji)}
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="create-modal-actions">
                <button
                  type="submit"
                  className="create-modal-publish"
                  disabled={!canPublish || isSubmitting}
                >
                  {isSubmitting ? 'Publicando...' : 'Publicar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}

export default CreatePublication
