const express = require("express");
const cors = require("cors");
const { createProxyMiddleware } = require("http-proxy-middleware");

const app = express();
const PORT = process.env.PORT || 4200;

app.use(cors());

app.get("/health", (req, res) => {
  res.json({ service: "api-gateway", status: "ok" });
});

app.use(
  "/api/usuarios",
  createProxyMiddleware({
    target: "http://localhost:4201",
    changeOrigin: true,
    pathRewrite: { "^/api/usuarios": "/usuarios" }
  })
);

app.use(
  "/api/cursos",
  createProxyMiddleware({
    target: "http://localhost:4202",
    changeOrigin: true,
    pathRewrite: { "^/api/cursos": "/cursos" }
  })
);

app.use(
  "/api/temas",
  createProxyMiddleware({
    target: "http://localhost:4203",
    changeOrigin: true,
    pathRewrite: { "^/api/temas": "/temas" }
  })
);

app.use(
  "/api/comentarios",
  createProxyMiddleware({
    target: "http://localhost:4204",
    changeOrigin: true,
    pathRewrite: { "^/api/comentarios": "/comentarios" }
  })
);

app.use(
  "/api/chatbot",
  createProxyMiddleware({
    target: "http://localhost:4205",
    changeOrigin: true,
    pathRewrite: { "^/api/chatbot": "/chatbot" }
  })
);

const server = app.listen(PORT, () => {
  console.log(`API Gateway ejecutandose en http://localhost:${PORT}`);
});

server.on("error", (err) => {
  if (err.code === "EADDRINUSE") {
    console.error(`\n[gateway] Puerto ${PORT} ya está en uso. Ejecuta: .\\scripts\\liberar-puertos.ps1\n`);
    process.exit(1);
  }
  throw err;
});
