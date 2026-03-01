#!/usr/bin/env node
/**
 * Script para verificar que el backend está funcionando.
 * Ejecutar: node scripts/verificar-backend.js
 * Requiere: backend corriendo (npm run dev:backend)
 */

const http = require("http");

const checks = [
  { name: "Foro Estudiantes (4300)", url: "http://localhost:4300/health" },
  { name: "API Gateway (4200)", url: "http://localhost:4200/health" },
  { name: "Cursos (4202)", url: "http://localhost:4202/health" },
  { name: "Temas (4203)", url: "http://localhost:4203/health" },
  { name: "Comentarios (4204)", url: "http://localhost:4204/health" }
];

function fetch(url) {
  return new Promise((resolve, reject) => {
    const req = http.get(url, { timeout: 3000 }, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => resolve({ ok: res.statusCode === 200, data }));
    });
    req.on("error", reject);
    req.on("timeout", () => {
      req.destroy();
      reject(new Error("Timeout"));
    });
  });
}

async function main() {
  console.log("Verificando servicios del backend...\n");
  let allOk = true;
  for (const { name, url } of checks) {
    try {
      const { ok, data } = await fetch(url);
      const status = ok ? "OK" : "ERROR";
      console.log(`  ${ok ? "✓" : "✗"} ${name}: ${status}`);
      if (ok && data && url.includes("4300")) {
        const json = JSON.parse(data);
        if (json.database) console.log("    -> Base de datos configurada (DB_NAME)");
        if (json.microservicios) console.log("    -> Microservicios conectados");
      }
      if (!ok) allOk = false;
    } catch (err) {
      console.log(`  ✗ ${name}: NO RESPONDE (${err.message})`);
      allOk = false;
    }
  }
  console.log("");
  if (allOk) {
    console.log("Backend funcionando correctamente.");
  } else {
    console.log("Algunos servicios no responden. Asegúrate de ejecutar: npm run dev:backend");
    process.exit(1);
  }
}

main();
