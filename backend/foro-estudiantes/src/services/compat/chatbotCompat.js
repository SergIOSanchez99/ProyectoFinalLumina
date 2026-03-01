const express = require("express");
const jwt = require("jsonwebtoken");
const { store } = require("../../data/store");
const microservicios = require("../../clients/microservicios");

const router = express.Router();
const GROQ_API_KEY = (process.env.GROQ_API_KEY || "").trim();
const GROQ_MODEL = process.env.GROQ_MODEL || "llama-3.3-70b-versatile";

const LUMINA_SYSTEM_PROMPT = `Eres el asistente virtual de Lumina, una plataforma educativa de aprendizaje colaborativo. Tu ÚNICA función es responder dudas sobre el sistema Lumina. Responde de forma clara, breve y amigable.

INFORMACIÓN SOBRE LUMINA:

**¿Qué es Lumina?**
Red social educativa donde estudiantes co-crean conocimiento, la comunidad valida contenido y un sistema inteligente organiza y recomienda información.

**Funcionalidades principales:**
- **Feed/Foro**: Publicaciones con 5 tipos de reacciones (like, love, apoyo, genial, interesante). Los usuarios publican temas, comentan y reaccionan.
- **Cursos**: Cursos académicos con apuntes colaborativos y recursos compartidos. Ruta: /courses/:courseId
- **Apuntes colaborativos**: Editor compartido para tomar notas. Ruta: /editor/:noteId
- **Mensajería directa**: Chat privado entre usuarios. Ruta: /messages
- **Amigos**: Seguir usuarios, ver lista de amigos. Ruta: /friends
- **Perfil**: Avatar, nickname, universidad, carrera, puntos, nivel, ranking, contribuciones. Ruta: /profile o /profile/:userId
- **Dashboard de impacto**: Estadísticas de reputación y actividad. Ruta: /impact
- **Chatbot**: Este asistente para dudas sobre Lumina.

**Sistema de reputación:**
- Puntos por actividad (publicar, comentar, reaccionar)
- Niveles y rankings (Principiante, Avanzado, etc.)
- Logros y contribuciones

**Reglas:**
1. SOLO responde preguntas sobre Lumina: cómo usar la plataforma, qué hace cada sección, dónde encontrar algo, cómo funciona el sistema de reputación, etc.
2. Si preguntan sobre temas académicos generales (matemáticas, historia, etc.), responde amablemente: "Soy el asistente de Lumina y solo respondo dudas sobre la plataforma. Para temas de estudio, explora el foro y los cursos."
3. No inventes funciones que no existan.
4. Indica rutas o secciones cuando sea útil (ej: "Ve a Mensajes en el menú" o "En tu perfil verás tus puntos").`;

async function callGroqDirect(message, curso, tema) {
  if (!GROQ_API_KEY || GROQ_API_KEY.length < 20 || GROQ_API_KEY.includes("xxx")) return null;
  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${GROQ_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      temperature: 0.5,
      messages: [
        { role: "system", content: LUMINA_SYSTEM_PROMPT },
        { role: "user", content: `Pregunta del usuario sobre Lumina: ${message}` }
      ]
    })
  });
  if (!res.ok) throw new Error(await res.text());
  const data = await res.json();
  return data.choices?.[0]?.message?.content?.trim() || null;
}
const JWT_SECRET = process.env.JWT_SECRET || "lumina-secret-dev";

function authMiddleware(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith("Bearer ")) {
    return res.status(401).json({ message: "No autorizado" });
  }
  try {
    jwt.verify(auth.slice(7), JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ message: "Token inválido" });
  }
}

router.use(authMiddleware);

const conversaciones = new Map();
let convId = 1;

router.post("/conversations", (req, res) => {
  const id = convId++;
  conversaciones.set(id, []);
  return res.status(201).json({ id });
});

router.get("/conversations/:id", (req, res) => {
  const id = Number(req.params.id);
  const messages = conversaciones.get(id) || [];
  return res.json({ id, messages });
});

router.post("/message", async (req, res) => {
  const { message, context } = req.body;
  if (!message) return res.status(400).json({ message: "Mensaje requerido" });

  const curso = context?.curso || "actual";
  const tema = context?.tema || "tu tema";

  // 1. Intentar microservicios (si están corriendo)
  if (microservicios.isEnabled()) {
    try {
      const result = await microservicios.chatbot.message(message, curso, tema);
      if (result && result.reply) return res.json({ message: result.reply });
    } catch (err) {
      console.warn("[chatbot] Microservicio falló, usando Groq directo:", err?.message);
    }
  }

  // 2. Groq directo (funciona sin microservicios)
  if (GROQ_API_KEY) {
    try {
      const reply = await callGroqDirect(message, curso, tema);
      if (reply) return res.json({ message: reply });
    } catch (err) {
      console.error("[chatbot] Groq error:", err?.message);
      return res.status(502).json({
        message: "Error al conectar con la IA. Verifica que GROQ_API_KEY sea válida en .env",
        error: err?.message
      });
    }
  }

  // 3. Respuesta demo cuando no hay IA configurada
  const m = (message || "").toLowerCase();
  let reply;
  if (m.includes("coment") || m.includes("usuario")) {
    reply = "En el Feed verás publicaciones con comentarios. Cada publicación muestra quién comentó. Para chatear con usuarios, ve a Mensajes en el menú. Configura GROQ_API_KEY para respuestas más detalladas.";
  } else if (m.includes("resum") || m.includes("apunte")) {
    reply = "Los apuntes están en Cursos > selecciona un curso. Configura GROQ_API_KEY en backend/foro-estudiantes/.env para respuestas con IA.";
  } else if (m.includes("recomend") || m.includes("recurso")) {
    reply = "Explora el Feed para publicaciones, Cursos para apuntes y recursos. Configura GROQ_API_KEY para recomendaciones personalizadas.";
  } else if (m.includes("lumina") || m.includes("ayuda") || m.includes("qué puedo")) {
    reply = "En Lumina: Feed (publicaciones y comentarios), Cursos y apuntes, Mensajes (chat), Amigos, Perfil (puntos y ranking), Impacto (estadísticas). Configura GROQ_API_KEY para más ayuda.";
  } else {
    reply = "Soy el asistente de Lumina. Para respuestas con IA sobre la plataforma, agrega GROQ_API_KEY en backend/foro-estudiantes/.env (gratis en console.groq.com/keys).";
  }
  return res.json({ message: reply });
});

router.post("/summarize", (req, res) => {
  const { noteId } = req.body;
  return res.json({
    noteId: noteId || 0,
    title: "Resumen",
    summary: "Resumen generado por IA (modo demo). En producción se conectaría con OpenAI."
  });
});

router.post("/recommendations", async (req, res) => {
  const { type } = req.body || {};
  const { getTemas } = require("../../data/dataLayer");
  const temas = await getTemas();
  const titulos = temas.slice(0, 3).map((t) => t.titulo);
  return res.json({
    type: type || "general",
    recommendations: `Recomendaciones (modo demo): 1) Revisa los temas: ${titulos.join(", ") || "ninguno aún"}. 2) Participa en debates activos. 3) Marca soluciones que te ayuden.`
  });
});

module.exports = router;
