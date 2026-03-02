require("dotenv").config();
const http = require("http");
const express = require("express");
const cors = require("cors");
const { Server } = require("socket.io");
const { ensureDefaultCourse } = require("./data/store");
const microservicios = require("./clients/microservicios");
const messagingSocket = require("./services/compat/messagingSocket");

const usuariosRoutes = require("./services/usuarios/routes");
const cursosRoutes = require("./services/cursos/routes");
const temasRoutes = require("./services/temas/routes");
const comentariosRoutes = require("./services/comentarios/routes");
const reaccionesRoutes = require("./services/reacciones/routes");
const sugerenciasRoutes = require("./services/sugerencias/routes");
const authRoutes = require("./services/auth/routes");
const compatRoutes = require("./services/compat/routes");
const usersCompat = require("./services/compat/usersCompat");
const chatbotCompat = require("./services/compat/chatbotCompat");
const messagingCompat = require("./services/compat/messagingCompat");

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" }, path: "/socket.io" });
messagingSocket.setupMessagingSocket(io);

const PORT = process.env.PORT || 4300;

app.use(cors());
app.use(express.json());

app.get("/health", (req, res) => {
  const db = require("./db/connection");
  res.json({
    service: "foro-estudiantes",
    status: "ok",
    database: db.isConfigured(),
    microservicios: microservicios.isEnabled()
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/content", compatRoutes);
app.use("/api/users", usersCompat);
app.use("/api/chatbot", chatbotCompat);
app.use("/api/messaging", messagingCompat);

app.use("/api/usuarios", usuariosRoutes);
app.use("/api/cursos", cursosRoutes);
app.use("/api/temas", temasRoutes);
app.use("/api/comentarios", comentariosRoutes);
app.use("/api/reacciones", reaccionesRoutes);
app.use("/api/sugerencias", sugerenciasRoutes);

app.use((req, res) => {
  res.status(404).json({ error: "Ruta no encontrada" });
});

ensureDefaultCourse();

server.listen(PORT, () => {
  console.log(`Foro Estudiantes ejecutandose en http://localhost:${PORT}`);
  if (require("./db/connection").isConfigured()) {
    console.log("  -> Conectado a base de datos (DB_NAME)");
  }
  if (microservicios.isEnabled()) {
    console.log("  -> Conectado a microservicios (MICROSERVICIOS_URL)");
  }
  const groqKey = (process.env.GROQ_API_KEY || "").trim();
  if (groqKey && groqKey.length > 20 && !groqKey.includes("xxx")) {
    console.log("  -> Chatbot con IA (Groq)");
  }
});
