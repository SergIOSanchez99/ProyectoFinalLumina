import { useState, useEffect, useRef } from 'react'
import { MessageCircle, X, Send } from 'lucide-react'
import { chatbotService } from '../services/chatbotService'
import toast from 'react-hot-toast'
import './Chatbot.css'

function Chatbot() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [conversationId, setConversationId] = useState(null)
  const messagesEndRef = useRef(null)

  useEffect(() => {
    if (isOpen && !conversationId) {
      initConversation()
    }
  }, [isOpen])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const WELCOME_MESSAGE = {
    role: 'assistant',
    content: '¡Hola! Soy el asistente de Lumina. Respondo dudas sobre la plataforma: cómo usar el foro, mensajes, cursos, perfil, reputación, amigos, etc. ¿Qué te gustaría saber?'
  }

  const initConversation = async () => {
    setMessages([WELCOME_MESSAGE])
    try {
      const conv = await chatbotService.createConversation()
      setConversationId(conv?.id ?? conv?.conversationId ?? null)
    } catch (error) {
      console.warn('Chatbot: conversación en modo local', error?.message)
      // El usuario puede seguir chateando sin conversationId
    }
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const handleSend = async () => {
    if (!input.trim() || loading) return

    const userMessage = input.trim()
    setInput('')
    
    setMessages(prev => [...prev, {
      role: 'user',
      content: userMessage
    }])

    setLoading(true)

    try {
      const response = await chatbotService.sendMessage(userMessage, {
        conversationId
      })
      const reply = response?.message ?? response?.reply ?? 'No pude procesar tu mensaje. Intenta de nuevo.'
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: reply
      }])
    } catch (error) {
      const errMsg = error?.response?.data?.details || error?.response?.data?.error || error?.message
      const isConfig = /api key|GROQ|credencial|configura/i.test(String(errMsg))
      toast.error(isConfig ? 'Configura la API key del chatbot' : 'Error al enviar mensaje')
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: isConfig
          ? 'Para usar IA real, configura GROQ_API_KEY en backend/microservicios-basico/.env. Obtén una clave gratis en console.groq.com/keys. Ejecuta: .\\scripts\\configurar-chatbot.ps1'
          : `Lo siento, ocurrió un error: ${errMsg || 'Intenta de nuevo.'}`
      }])
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <>
      <button 
        className="chatbot-toggle"
        onClick={() => setIsOpen(!isOpen)}
        title="Chatea conmigo"
      >
        {isOpen ? <X size={24} /> : <MessageCircle size={24} />}
      </button>

      {isOpen && (
        <div className="chatbot-window">
          <div className="chatbot-header">
            <h3>Asistente Académico</h3>
            <button 
              className="chatbot-close"
              onClick={() => setIsOpen(false)}
            >
              <X size={20} />
            </button>
          </div>

          <div className="chatbot-messages">
            {messages.map((message, index) => (
              <div 
                key={index}
                className={`message ${message.role}`}
              >
                <div className="message-content">
                  {message.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="message assistant">
                <div className="message-content typing">
                  <span></span><span></span><span></span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="chatbot-input">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Pregunta sobre Lumina..."
              rows={1}
              disabled={loading}
            />
            <button 
              onClick={handleSend}
              disabled={loading || !input.trim()}
              className="btn-send"
              title="Enviar mensaje"
            >
              <Send size={18} />
            </button>
          </div>

          <div className="chatbot-suggestions">
            <button 
              className="suggestion-btn"
              onClick={() => setInput('¿Qué puedo hacer en Lumina?')}
            >
              💡 ¿Qué puedo hacer?
            </button>
            <button 
              className="suggestion-btn"
              onClick={() => setInput('¿Cómo envío mensajes a otros usuarios?')}
            >
              💬 Mensajes
            </button>
            <button 
              className="suggestion-btn"
              onClick={() => setInput('¿Cómo funciona el sistema de reputación y puntos?')}
            >
              ⭐ Reputación
            </button>
            <button 
              className="suggestion-btn"
              onClick={() => setInput('¿Dónde veo los cursos y apuntes?')}
            >
              📚 Cursos
            </button>
          </div>
        </div>
      )}
    </>
  )
}

export default Chatbot
