/**
 * Conexión a MySQL - Base de datos redsocial
 * Variables de entorno: DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME
 */

const mysql = require("mysql2/promise");

function isTrue(value) {
  return ["1", "true", "yes", "on"].includes(String(value).toLowerCase());
}

const host = process.env.DB_HOST || "localhost";
const useSsl = isTrue(process.env.DB_SSL) || host.includes(".mysql.database.azure.com");
const rejectUnauthorized = process.env.DB_SSL_REJECT_UNAUTHORIZED === undefined
  ? true
  : isTrue(process.env.DB_SSL_REJECT_UNAUTHORIZED);

const config = {
  host,
  port: parseInt(process.env.DB_PORT, 10) || 3306,
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "redsocial",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  charset: "utf8mb4"
};

if (useSsl) {
  config.ssl = { rejectUnauthorized };
}

let pool = null;

function isConfigured() {
  return !!process.env.DB_NAME;
}

async function getPool() {
  if (!pool) {
    pool = mysql.createPool(config);
  }
  return pool;
}

async function query(sql, params = []) {
  const p = await getPool();
  const [rows] = await p.execute(sql, params);
  return rows;
}

async function queryOne(sql, params = []) {
  const rows = await query(sql, params);
  return rows[0] || null;
}

module.exports = { getPool, query, queryOne, isConfigured };
