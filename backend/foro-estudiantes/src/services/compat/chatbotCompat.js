const express = require("express");
const jwt = require("jsonwebtoken");
const { store } = require("../../data/store");
const microservicios = require("../../clients/microservicios");

const router = express.Router();
const GROQ_API_KEY = (process.env.GROQ_API_KEY || "").trim();
const GROQ_MODEL = process.env.GROQ_MODEL || "llama-3.3-70b-versatile";

const LUMINA_SYSTEM_PROMPT = `Eres el asistente virtual de Lumina, una plataforma educativa donde estudiantes comparten conocimiento y aprenden en comunidad. Ayudas a los usuarios a usar Lumina. Responde de forma clara, breve y amigable.

SOBRE LUMINA (plataforma para estudiantes):

**¿Qué es Lumina?**
Una red social educativa donde puedes publicar en el foro, comentar, dar reacciones, seguir cursos, crear apuntes con otros, chatear con compañeros y ganar reputación.

**Qué puedes hacer en Lumina:**
- **Feed**: Publica temas, comenta y reacciona (like, love, apoyo, genial, interesante). Explora lo que comparten otros estudiantes.
- **Cursos**: Inscríbete en cursos, accede a apuntes colaborativos y recursos compartidos.
- **Apuntes**: Crea y edita apuntes junto con otros en tiempo real.
- **Mensajes**: Chatea en privado con cualquier usuario. Busca en el menú "Mensajes".
- **Amigos**: Sigue a otros usuarios y ve tu lista de amigos en "Amigos".
- **Perfil**: Tu foto, nickname, universidad, carrera, puntos, nivel (Principiante, Avanzado...), ranking y contribuciones.
- **Impacto**: Dashboard con tus estadísticas y actividad en la plataforma.

**Reputación:** Ganas puntos publicando, comentando y reaccionando. Subes de nivel y ranking según tu actividad.

**Reglas:**
1. SOLO habla de Lumina como plataforma: cómo usarla, qué secciones tiene, dónde encontrar algo.
2. NO hables de código, APIs, configuración técnica ni desarrollo.
3. Si preguntan temas de estudio (matemáticas, etc.), di amablemente que solo ayudas con el uso de Lumina y que explore el foro y cursos.
4. Usa lenguaje natural: "Ve al menú Mensajes", "En tu perfil verás...", "Entra a Cursos para...".`;

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
        message: "No pude procesar tu mensaje en este momento. Intenta de nuevo en unos segundos.",
        error: err?.message
      });
    }
  }

  // 3. Respuesta demo cuando no hay IA configurada
  const m = (message || "").toLowerCase();
  let reply;
  if (m.includes("coment") || m.includes("usuario")) {
    reply = "En el Feed verás publicaciones con comentarios. Cada publicación muestra quién comentó. Para chatear con usuarios, ve a Mensajes en el menú.";
  } else if (m.includes("resum") || m.includes("apunte")) {
    reply = "Los apuntes están en Cursos: entra a un curso y verás los apuntes colaborativos disponibles.";
  } else if (m.includes("recomend") || m.includes("recurso")) {
    reply = "Explora el Feed para ver publicaciones y Cursos para apuntes y recursos compartidos por la comunidad.";
  } else if (m.includes("lumina") || m.includes("ayuda") || m.includes("qué puedo")) {
    reply = "En Lumina puedes: publicar y comentar en el Feed, seguir cursos, crear apuntes, chatear por Mensajes, agregar Amigos, ver tu Perfil con puntos y ranking, y el Dashboard de Impacto.";
  } else {
    reply = "Soy el asistente de Lumina. Puedo ayudarte con dudas sobre la plataforma: Feed, Cursos, Mensajes, Amigos, Perfil, etc. ¿Qué te gustaría saber?";
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
