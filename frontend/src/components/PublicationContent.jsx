/**
 * Renderiza el contenido de una publicación soportando:
 * - URLs de imágenes (y data URLs base64)
 * - Enlaces clickeables
 * - Emojis (unicode)
 */

const IMAGE_EXTENSIONS = /\.(jpg|jpeg|png|gif|webp)(\?|$)/i
const URL_REGEX = /(https?:\/\/[^\s<>"']+|data:image\/[a-z]+;base64,[A-Za-z0-9+/=]+)/g

function PublicationContent({ content }) {
  if (!content || typeof content !== 'string') return null

  const isImageUrl = (url) => {
    if (url.startsWith('data:image/')) return true
    return IMAGE_EXTENSIONS.test(url)
  }

  const parts = []
  let lastIndex = 0
  let match

  const regex = new RegExp(URL_REGEX.source, 'g')
  while ((match = regex.exec(content)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ type: 'text', value: content.slice(lastIndex, match.index) })
    }
    parts.push({
      type: isImageUrl(match[1]) ? 'image' : 'link',
      value: match[1]
    })
    lastIndex = match.index + match[1].length
  }
  if (lastIndex < content.length) {
    parts.push({ type: 'text', value: content.slice(lastIndex) })
  }

  if (parts.length === 0) {
    return (
      <p className="publication-content-rendered">
        {content.split('\n').map((line, i) => (
          <span key={i}>
            {line}
            {i < content.split('\n').length - 1 && <br />}
          </span>
        ))}
      </p>
    )
  }

  return (
    <div className="publication-content-rendered">
      {parts.map((part, i) => {
        if (part.type === 'text') {
          return (
            <span key={i}>
              {part.value.split('\n').map((line, j) => (
                <span key={j}>
                  {line}
                  {j < part.value.split('\n').length - 1 && <br />}
                </span>
              ))}
            </span>
          )
        }
        if (part.type === 'image') {
          return (
            <figure key={i} className="publication-content-image">
              <img src={part.value} alt="Imagen de la publicación" loading="lazy" />
            </figure>
          )
        }
        if (part.type === 'link') {
          return (
            <a key={i} href={part.value} target="_blank" rel="noopener noreferrer" className="publication-content-link">
              {part.value}
            </a>
          )
        }
        return null
      })}
    </div>
  )
}

export default PublicationContent
