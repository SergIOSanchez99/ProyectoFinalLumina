// Cargar .env desde múltiples ubicaciones (prioridad: chatbot > microservicios > raíz)
const path = require("path");
const envPaths = [
  path.join(__dirname, ".env"),
  path.join(__dirname, "../.env"),
  path.join(__dirname, "../../../.env")
];
for (const p of envPaths) {
  require("dotenv").config({ path: p });
}
const express = require("express");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 4205;

app.use(cors());
app.use(express.json());

// Proveedores de IA (orden de prioridad: Groq gratis → Gemini gratis → OpenAI)
const raw = (v) => (v && typeof v === "string" ? v.trim() : "") || "";
const isPlaceholder = (key) => !key || key.includes("xxx") || key.length < 20;
const GROQ_API_KEY = isPlaceholder(raw(process.env.GROQ_API_KEY)) ? "" : raw(process.env.GROQ_API_KEY);
const GEMINI_API_KEY = isPlaceholder(raw(process.env.GEMINI_API_KEY)) ? "" : raw(process.env.GEMINI_API_KEY);
const OPENAI_API_KEY = isPlaceholder(raw(process.env.OPENAI_API_KEY)) ? "" : raw(process.env.OPENAI_API_KEY);
const GROQ_MODEL = process.env.GROQ_MODEL || process.env.AI_MODEL || "llama-3.3-70b-versatile";

const LUMINA_SYSTEM_PROMPT = `Eres el asistente virtual de Lumina, una plataforma educativa de aprendizaje colaborativo. Tu ÚNICA función es responder dudas sobre el sistema Lumina. Responde de forma clara, breve y amigable.

INFORMACIÓN SOBRE LUMINA:
- **Feed/Foro**: Publicaciones con reacciones (like, love, apoyo, genial, interesante). Comentarios y debates.
- **Cursos**: Cursos académicos con apuntes colaborativos. Ruta: /courses/:courseId
- **Apuntes**: Editor compartido. Ruta: /editor/:noteId
- **Mensajes**: Chat privado entre usuarios. Ruta: /messages
- **Amigos**: Seguir usuarios. Ruta: /friends
- **Perfil**: Avatar, nickname, puntos, nivel, ranking. Ruta: /profile
- **Impacto**: Estadísticas de reputación. Ruta: /impact

**Reglas:** SOLO responde dudas sobre Lumina. Si preguntan temas académicos generales, indica que solo ayudas con la plataforma.`;

app.get("/health", (req, res) => {
  const provider = GROQ_API_KEY ? "groq" : GEMINI_API_KEY ? "gemini" : OPENAI_API_KEY ? "openai" : "demo";
  res.json({ service: "chatbot", status: "ok", provider });
});

async function callGroq(message, curso, tema) {
  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
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
  if (!response.ok) throw new Error(await response.text());
  const data = await response.json();
  return data.choices?.[0]?.message?.content?.trim() || "Sin respuesta";
}

async function callGemini(message, curso, tema) {
  const model = process.env.GEMINI_MODEL || "gemini-2.0-flash";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`;
  const prompt = `${LUMINA_SYSTEM_PROMPT}\n\nPregunta del usuario sobre Lumina: ${message}`;
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.5, maxOutputTokens: 1024 }
    })
  });
  if (!response.ok) throw new Error(await response.text());
  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
  return text || "Sin respuesta";
}

async function callOpenAI(message, curso, tema) {
  const model = process.env.OPENAI_MODEL || "gpt-4o-mini";
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${OPENAI_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model,
      temperature: 0.5,
      messages: [
        { role: "system", content: LUMINA_SYSTEM_PROMPT },
        { role: "user", content: `Pregunta del usuario sobre Lumina: ${message}` }
      ]
    })
  });
  if (!response.ok) throw new Error(await response.text());
  const data = await response.json();
  return data.choices?.[0]?.message?.content?.trim() || "Sin respuesta";
}

app.post("/chatbot/message", async (req, res) => {
  try {
    const { message, curso, tema } = req.body;
    if (!message || !message.trim()) {
      return res.status(400).json({ error: "message es obligatorio" });
    }

    let reply;
    let source = "demo";

    if (GROQ_API_KEY) {
      reply = await callGroq(message, curso, tema);
      source = "groq";
    } else if (GEMINI_API_KEY) {
      reply = await callGemini(message, curso, tema);
      source = "gemini";
    } else if (OPENAI_API_KEY) {
      reply = await callOpenAI(message, curso, tema);
      source = "openai";
    } else {
      reply = `Soy el asistente de Lumina. Para respuestas con IA sobre la plataforma, configura GROQ_API_KEY en .env (gratis en console.groq.com). Mientras tanto: explora el Feed para publicaciones, /messages para chatear, /profile para tu perfil y /friends para agregar amigos.`;
    }

    return res.json({ source, reply });
  } catch (error) {
    const msg = error.message || "";
    const isAuth = /401|unauthorized|invalid.*key|api.*key/i.test(msg);
    console.error("[chatbot]", msg);
    return res.status(502).json({
      error: isAuth ? "API key inválida o expirada. Verifica GROQ_API_KEY en .env" : "No se pudo consultar el proveedor de IA",
      details: isAuth ? "Obtén una clave gratis en https://console.groq.com/keys" : msg
    });
  }
});

const server = app.listen(PORT, () => {
  const provider = GROQ_API_KEY ? "Groq (gratis)" : GEMINI_API_KEY ? "Gemini (gratis)" : OPENAI_API_KEY ? "OpenAI" : "demo";
  console.log(`Chatbot en http://localhost:${PORT} [${provider}]`);
});

server.on("error", (err) => {
  if (err.code === "EADDRINUSE") {
    console.error(`\n[chatbot] Puerto ${PORT} ya está en uso. Ejecuta: .\\scripts\\liberar-puertos.ps1\n`);
    process.exit(1);
  }
  throw err;
});
