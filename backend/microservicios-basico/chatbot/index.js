const express = require("express");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 4205;

app.use(cors());
app.use(express.json());

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const AI_MODEL = process.env.AI_MODEL || "gpt-4o-mini";

app.get("/health", (req, res) => {
  res.json({ service: "chatbot", status: "ok" });
});

app.post("/chatbot/message", async (req, res) => {
  try {
    const { message, curso, tema } = req.body;
    if (!message || !message.trim()) {
      return res.status(400).json({ error: "message es obligatorio" });
    }

    if (!OPENAI_API_KEY) {
      return res.json({
        source: "demo",
        reply: `Modo demo: para '${message}', estudia definiciones clave de ${tema || "tu tema"}, aplica ejemplos del curso ${curso || "actual"} y cierra con un resumen personal de 5 lineas.`
      });
    }

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: AI_MODEL,
        temperature: 0.5,
        messages: [
          {
            role: "system",
            content: "Eres un tutor academico que responde de forma clara y breve."
          },
          {
            role: "user",
            content: `Curso: ${curso || "N/A"}\nTema: ${tema || "N/A"}\nPregunta: ${message}`
          }
        ]
      })
    });

    if (!response.ok) {
      const details = await response.text();
      return res.status(502).json({
        error: "No se pudo consultar el proveedor de IA",
        details
      });
    }

    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content?.trim();
    return res.json({ source: "openai", reply: reply || "Sin respuesta" });
  } catch (error) {
    return res.status(500).json({
      error: "Error interno del chatbot",
      details: error.message
    });
  }
});

app.listen(PORT, () => {
  console.log(`Servicio chatbot ejecutandose en http://localhost:${PORT}`);
});
