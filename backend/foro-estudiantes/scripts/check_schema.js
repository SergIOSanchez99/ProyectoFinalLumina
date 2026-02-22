#!/usr/bin/env node
/**
 * Script para comparar la base de datos actual con el esquema esperado (redsocial).
 * Detecta tablas y columnas faltantes, genera reporte y SQL de migración.
 *
 * Uso: npm run db:check (desde la raíz)
 *      node scripts/check_schema.js (desde backend/foro-estudiantes)
 */

const path = require("path");
const fs = require("fs");

// Cargar .env desde el directorio del proyecto foro-estudiantes
require("dotenv").config({ path: path.join(__dirname, "../.env") });

const mysql = require("mysql2/promise");

// Esquema esperado: tabla -> [columnas]
const ESQUEMA_ESPERADO = {
  usuarios: [
    { name: "id", type: "int", nullable: "NO", key: "PRI", extra: "auto_increment" },
    { name: "nombre", type: "varchar(255)", nullable: "NO" },
    { name: "email", type: "varchar(255)", nullable: "NO", key: "UNI" },
    { name: "password_hash", type: "varchar(255)", nullable: "NO" },
    { name: "universidad", type: "varchar(255)", nullable: "YES" },
    { name: "carrera", type: "varchar(255)", nullable: "YES" },
    { name: "bio", type: "text", nullable: "YES" },
    { name: "avatar_url", type: "longtext", nullable: "YES" },
    { name: "nickname", type: "varchar(50)", nullable: "YES" },
    { name: "created_at", type: "timestamp", nullable: "YES" },
    { name: "updated_at", type: "timestamp", nullable: "YES" }
  ],
  cursos: [
    { name: "id", type: "int", nullable: "NO", key: "PRI", extra: "auto_increment" },
    { name: "nombre", type: "varchar(255)", nullable: "NO" },
    { name: "codigo", type: "varchar(50)", nullable: "NO", key: "UNI" },
    { name: "descripcion", type: "text", nullable: "YES" },
    { name: "docente", type: "varchar(255)", nullable: "YES" },
    { name: "universidad", type: "varchar(255)", nullable: "YES" },
    { name: "created_at", type: "timestamp", nullable: "YES" }
  ],
  inscripciones: [
    { name: "id", type: "int", nullable: "NO", key: "PRI", extra: "auto_increment" },
    { name: "usuario_id", type: "int", nullable: "NO" },
    { name: "curso_id", type: "int", nullable: "NO" },
    { name: "created_at", type: "timestamp", nullable: "YES" }
  ],
  publicaciones: [
    { name: "id", type: "int", nullable: "NO", key: "PRI", extra: "auto_increment" },
    { name: "usuario_id", type: "int", nullable: "NO" },
    { name: "curso_id", type: "int", nullable: "NO" },
    { name: "titulo", type: "varchar(500)", nullable: "NO" },
    { name: "contenido", type: "text", nullable: "NO" },
    { name: "estado", type: "enum('abierto','resuelto')", nullable: "YES" },
    { name: "vistas", type: "int", nullable: "YES" },
    { name: "created_at", type: "timestamp", nullable: "YES" },
    { name: "updated_at", type: "timestamp", nullable: "YES" }
  ],
  publicacion_tags: [
    { name: "id", type: "int", nullable: "NO", key: "PRI", extra: "auto_increment" },
    { name: "publicacion_id", type: "int", nullable: "NO" },
    { name: "tag", type: "varchar(100)", nullable: "NO" }
  ],
  comentarios: [
    { name: "id", type: "int", nullable: "NO", key: "PRI", extra: "auto_increment" },
    { name: "usuario_id", type: "int", nullable: "NO" },
    { name: "publicacion_id", type: "int", nullable: "NO" },
    { name: "parent_id", type: "int", nullable: "YES" },
    { name: "contenido", type: "text", nullable: "NO" },
    { name: "es_solucion", type: "tinyint", nullable: "YES" },
    { name: "created_at", type: "timestamp", nullable: "YES" }
  ],
  reacciones: [
    { name: "id", type: "int", nullable: "NO", key: "PRI", extra: "auto_increment" },
    { name: "usuario_id", type: "int", nullable: "NO" },
    { name: "target_tipo", type: "enum('tema','comentario')", nullable: "NO" },
    { name: "target_id", type: "int", nullable: "NO" },
    { name: "tipo", type: "enum('like','love','apoyo','genial','interesante')", nullable: "NO" },
    { name: "created_at", type: "timestamp", nullable: "YES" }
  ],
  seguidores: [
    { name: "id", type: "int", nullable: "NO", key: "PRI", extra: "auto_increment" },
    { name: "seguidor_id", type: "int", nullable: "NO" },
    { name: "seguido_id", type: "int", nullable: "NO" },
    { name: "created_at", type: "timestamp", nullable: "YES" }
  ],
  apuntes: [
    { name: "id", type: "int", nullable: "NO", key: "PRI", extra: "auto_increment" },
    { name: "usuario_id", type: "int", nullable: "NO" },
    { name: "curso_id", type: "int", nullable: "YES" },
    { name: "titulo", type: "varchar(500)", nullable: "NO" },
    { name: "contenido", type: "longtext", nullable: "YES" },
    { name: "created_at", type: "timestamp", nullable: "YES" },
    { name: "updated_at", type: "timestamp", nullable: "YES" }
  ],
  reputacion: [
    { name: "id", type: "int", nullable: "NO", key: "PRI", extra: "auto_increment" },
    { name: "usuario_id", type: "int", nullable: "NO", key: "UNI" },
    { name: "puntos", type: "int", nullable: "YES" },
    { name: "nivel", type: "int", nullable: "YES" },
    { name: "rango", type: "varchar(50)", nullable: "YES" },
    { name: "updated_at", type: "timestamp", nullable: "YES" }
  ],
  chatbot_conversaciones: [
    { name: "id", type: "int", nullable: "NO", key: "PRI", extra: "auto_increment" },
    { name: "usuario_id", type: "int", nullable: "NO" },
    { name: "created_at", type: "timestamp", nullable: "YES" }
  ],
  chatbot_mensajes: [
    { name: "id", type: "int", nullable: "NO", key: "PRI", extra: "auto_increment" },
    { name: "conversacion_id", type: "int", nullable: "NO" },
    { name: "rol", type: "enum('user','assistant','system')", nullable: "NO" },
    { name: "contenido", type: "text", nullable: "NO" },
    { name: "created_at", type: "timestamp", nullable: "YES" }
  ],
  dm_conversaciones: [
    { name: "id", type: "int", nullable: "NO", key: "PRI", extra: "auto_increment" },
    { name: "usuario1_id", type: "int", nullable: "NO" },
    { name: "usuario2_id", type: "int", nullable: "NO" },
    { name: "created_at", type: "timestamp", nullable: "YES" },
    { name: "updated_at", type: "timestamp", nullable: "YES" }
  ],
  dm_mensajes: [
    { name: "id", type: "int", nullable: "NO", key: "PRI", extra: "auto_increment" },
    { name: "conversacion_id", type: "int", nullable: "NO" },
    { name: "remitente_id", type: "int", nullable: "NO" },
    { name: "contenido", type: "text", nullable: "NO" },
    { name: "leido", type: "tinyint", nullable: "YES" },
    { name: "leido_at", type: "timestamp", nullable: "YES" },
    { name: "created_at", type: "timestamp", nullable: "YES" }
  ],
  notificaciones: [
    { name: "id", type: "int", nullable: "NO", key: "PRI", extra: "auto_increment" },
    { name: "usuario_id", type: "int", nullable: "NO" },
    { name: "tipo", type: "varchar(50)", nullable: "NO" },
    { name: "titulo", type: "varchar(255)", nullable: "NO" },
    { name: "mensaje", type: "text", nullable: "YES" },
    { name: "leido", type: "tinyint", nullable: "YES" },
    { name: "relacionado_id", type: "int", nullable: "YES" },
    { name: "created_at", type: "timestamp", nullable: "YES" }
  ],
  logros: [
    { name: "id", type: "int", nullable: "NO", key: "PRI", extra: "auto_increment" },
    { name: "nombre", type: "varchar(255)", nullable: "NO", key: "UNI" },
    { name: "descripcion", type: "text", nullable: "YES" },
    { name: "icono", type: "varchar(50)", nullable: "YES" },
    { name: "puntos_requeridos", type: "int", nullable: "YES" },
    { name: "created_at", type: "timestamp", nullable: "YES" }
  ],
  usuario_logros: [
    { name: "id", type: "int", nullable: "NO", key: "PRI", extra: "auto_increment" },
    { name: "usuario_id", type: "int", nullable: "NO" },
    { name: "logro_id", type: "int", nullable: "NO" },
    { name: "desbloqueado_at", type: "timestamp", nullable: "YES" }
  ]
};

function tipoParaAlter(col) {
  const t = (col.type || "").toLowerCase();
  if (t.startsWith("enum(")) return col.type.replace(/^enum/i, "ENUM");
  const map = {
    "int": "INT",
    "varchar(255)": "VARCHAR(255)",
    "varchar(500)": "VARCHAR(500)",
    "varchar(50)": "VARCHAR(50)",
    "varchar(100)": "VARCHAR(100)",
    "text": "TEXT",
    "longtext": "LONGTEXT",
    "timestamp": "TIMESTAMP DEFAULT CURRENT_TIMESTAMP",
    "tinyint": "TINYINT(1) DEFAULT 0"
  };
  return map[t] || col.type.toUpperCase();
}

function normalizarTipo(t) {
  if (!t) return "";
  const s = String(t).toLowerCase();
  if (s.startsWith("enum(")) return "enum";
  if (s.includes("enum")) return "enum";
  if (s.includes("tinyint")) return "tinyint";
  if (s.includes("int")) return "int";
  if (s.includes("varchar")) return s;
  if (s.includes("text")) return s;
  if (s.includes("timestamp")) return "timestamp";
  return s;
}

async function main() {
  const dbName = process.env.DB_NAME || "redsocial";
  if (!process.env.DB_NAME) {
    console.warn("⚠ DB_NAME no definido en .env, usando 'redsocial'");
  }

  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || "localhost",
    port: parseInt(process.env.DB_PORT, 10) || 3306,
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: dbName,
    multipleStatements: true
  });

  console.log("\n========================================");
  console.log("  VERIFICACIÓN DE ESQUEMA - redsocial");
  console.log("========================================\n");
  console.log(`Base de datos: ${dbName}`);
  console.log(`Host: ${process.env.DB_HOST || "localhost"}\n`);

  const cambios = [];
  const reporte = [];

  try {
    const [tablas] = await conn.execute(
      "SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = ? AND TABLE_TYPE = 'BASE TABLE'",
      [dbName]
    );
    const tablasActuales = new Set(tablas.map((r) => r.TABLE_NAME));

    for (const tabla of Object.keys(ESQUEMA_ESPERADO)) {
      if (!tablasActuales.has(tabla)) {
        reporte.push(`❌ TABLA FALTANTE: ${tabla}`);
        cambios.push({ tipo: "tabla_faltante", tabla });
      }
    }

    for (const t of tablasActuales) {
      if (!ESQUEMA_ESPERADO[t]) {
        reporte.push(`⚠ TABLA EXTRA (no en esquema): ${t}`);
      }
    }

    for (const [tabla, columnasEsperadas] of Object.entries(ESQUEMA_ESPERADO)) {
      if (!tablasActuales.has(tabla)) continue;

      const [cols] = await conn.execute(
        "SELECT COLUMN_NAME, DATA_TYPE, COLUMN_TYPE, IS_NULLABLE, COLUMN_KEY, EXTRA FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? ORDER BY ORDINAL_POSITION",
        [dbName, tabla]
      );
      const colsActuales = new Map(cols.map((c) => [c.COLUMN_NAME.toLowerCase(), c]));

      for (const col of columnasEsperadas) {
        const colName = col.name.toLowerCase();
        const actual = colsActuales.get(colName);
        if (!actual) {
          reporte.push(`  ❌ Columna faltante: ${tabla}.${col.name}`);
          const tipoAlter = tipoParaAlter(col);
          const nullable = col.nullable === "YES" ? "NULL" : "NOT NULL";
          let def = "";
          if (col.type === "timestamp" && !col.extra) {
            def = " DEFAULT CURRENT_TIMESTAMP";
          } else if (col.type === "int" && col.extra !== "auto_increment") {
            def = "";
          } else if (col.type === "tinyint") {
            def = " DEFAULT 0";
          }
          cambios.push({
            tipo: "columna_faltante",
            tabla,
            columna: col.name,
            sql: `ALTER TABLE \`${tabla}\` ADD COLUMN \`${col.name}\` ${tipoAlter} ${nullable}${def};`
          });
        } else {
          const tipoActual = normalizarTipo(actual.DATA_TYPE || actual.COLUMN_TYPE);
          const tipoEsp = normalizarTipo(col.type);
          const ignorar = tipoActual === "enum" && tipoEsp === "enum";
          const mismoTipo = tipoActual === tipoEsp || tipoActual.includes(tipoEsp) || tipoEsp.includes(tipoActual);
          if (!ignorar && tipoEsp && tipoActual && !mismoTipo) {
            reporte.push(`  ⚠ Tipo distinto: ${tabla}.${col.name} (actual: ${actual.COLUMN_TYPE}, esperado: ${col.type})`);
          }
        }
      }
    }

    const [vistas] = await conn.execute(
      "SELECT TABLE_NAME FROM INFORMATION_SCHEMA.VIEWS WHERE TABLE_SCHEMA = ?",
      [dbName]
    );
    const vistasActuales = new Set(vistas.map((r) => r.TABLE_NAME));
    const vistasEsperadas = ["v_publicaciones_stats", "v_ranking_usuarios"];
    for (const v of vistasEsperadas) {
      if (!vistasActuales.has(v)) {
        reporte.push(`❌ VISTA FALTANTE: ${v}`);
        cambios.push({ tipo: "vista_faltante", vista: v });
      }
    }

    await conn.end();

    console.log("--- REPORTE ---\n");
    if (reporte.length === 0) {
      console.log("✅ El esquema coincide con el esperado. No se requieren cambios.\n");
      return;
    }
    reporte.forEach((r) => console.log(r));

    const alterStatements = cambios.filter((c) => c.sql).map((c) => c.sql);
    const tablasFaltantes = cambios.filter((c) => c.tipo === "tabla_faltante").map((c) => c.tabla);
    const vistasFaltantes = cambios.filter((c) => c.tipo === "vista_faltante").map((c) => c.vista);

    if (alterStatements.length > 0 || tablasFaltantes.length > 0 || vistasFaltantes.length > 0) {
      const migrationPath = path.join(__dirname, `migration_${new Date().toISOString().slice(0, 10)}.sql`);
      let sql = `-- Migración generada por check_schema.js - ${new Date().toISOString()}\n`;
      sql += `-- Base de datos: ${dbName}\n\n`;
      sql += `USE ${dbName};\n\n`;

      if (tablasFaltantes.length > 0) {
        sql += `-- TABLAS FALTANTES: ${tablasFaltantes.join(", ")}\n`;
        sql += `-- Ejecuta el esquema completo: mysql -u root -p < database/schemas/redsocial_schema.sql\n\n`;
      }

      if (alterStatements.length > 0) {
        sql += `-- COLUMNAS A AGREGAR:\n\n`;
        sql += alterStatements.join("\n") + "\n\n";
      }

      if (vistasFaltantes.length > 0) {
        sql += `-- VISTAS FALTANTES: ${vistasFaltantes.join(", ")}\n`;
        sql += `-- Recrear vistas ejecutando la sección de VISTAS en redsocial_schema.sql\n\n`;
      }

      fs.writeFileSync(migrationPath, sql, "utf8");
      console.log(`\n--- ARCHIVO GENERADO ---\n`);
      console.log(`📄 ${migrationPath}\n`);
      console.log("Revisa el archivo y ejecútalo con:");
      console.log(`  mysql -u root -p ${dbName} < "${path.basename(migrationPath)}"\n`);
    }
  } catch (err) {
    console.error("Error:", err.message);
    if (err.code === "ECONNREFUSED") {
      console.error("\nVerifica que MySQL esté corriendo y las credenciales en backend/foro-estudiantes/.env");
    }
    process.exit(1);
  }
}

main();
