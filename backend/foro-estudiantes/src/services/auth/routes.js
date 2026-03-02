const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { store, nextId } = require("../../data/store");
const microservicios = require("../../clients/microservicios");
const dbUsuarios = require("../../db/usuarios");
const db = require("../../db/connection");

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || "lumina-secret-dev";

async function getUsuarioByEmail(email) {
  if (db.isConfigured()) {
    const row = await dbUsuarios.findByEmail(email);
    return row ? dbUsuarios.rowToUsuario(row) : null;
  }
  return store.usuarios.find((u) => u.email === email) || null;
}

async function getUsuarioById(id) {
  if (db.isConfigured()) {
    const row = await dbUsuarios.findById(id);
    return row ? dbUsuarios.rowToUsuario(row) : null;
  }
  return store.usuarios.find((u) => u.id === Number(id)) || null;
}

async function crearUsuarioEnBD(nombre, email, passwordHash, universidad, carrera) {
  if (db.isConfigured()) {
    const creado = await dbUsuarios.create({ nombre, email, passwordHash, universidad, carrera });
    return creado;
  }
  return null;
}

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: "Email y contraseña son obligatorios" });
    }

    let usuario = null;
    try {
      usuario = await getUsuarioByEmail(email);
    } catch (dbErr) {
      console.error("[auth] Error DB en login:", dbErr.message);
      return res.status(503).json({ message: "Error de conexión con la base de datos. Verifica que MySQL esté corriendo y las credenciales en backend/foro-estudiantes/.env" });
    }

    if (!usuario && !db.isConfigured()) {
      usuario = store.usuarios.find((u) => (u.email || "").toLowerCase() === email.toLowerCase());
    }
    if (!usuario) {
      return res.status(401).json({ message: "Credenciales inválidas" });
    }

    const passwordHash = usuario.passwordHash || "";
    const valid = await bcrypt.compare(password, passwordHash);
    if (!valid) {
      return res.status(401).json({ message: "Credenciales inválidas" });
    }

    const token = jwt.sign(
      { id: usuario.id, email: usuario.email, name: usuario.nombre },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    const user = {
      id: usuario.id,
      name: usuario.nombre,
      email: usuario.email,
      university: usuario.universidad,
      career: usuario.carrera,
      bio: usuario.bio,
      nickname: usuario.nickname
    };

    return res.json({ token, user });
  } catch (error) {
    return res.status(500).json({ message: "Error al iniciar sesión" });
  }
});

router.post("/register", async (req, res) => {
  try {
    const { name, email, password, university, career } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ message: "Nombre, email y contraseña son obligatorios" });
    }

    const duplicado = db.isConfigured()
      ? await getUsuarioByEmail(email)
      : store.usuarios.some((u) => u.email === email);
    if (duplicado) {
      return res.status(409).json({ message: "El email ya está registrado" });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    let nuevo = null;

    if (db.isConfigured()) {
      nuevo = await crearUsuarioEnBD(name, email, passwordHash, university, career);
      if (!nuevo) {
        return res.status(500).json({ message: "Error al crear usuario en la base de datos" });
      }
      if (microservicios.isEnabled()) {
        await microservicios.usuarios.create(name, email, nuevo.id);
      }
    } else {
      const userId = nextId("usuarios");
      if (microservicios.isEnabled()) {
        const msCreated = await microservicios.usuarios.create(name, email, userId);
        if (msCreated && msCreated.id) nuevo = { id: msCreated.id, nombre: name, email, universidad: university, carrera: career };
      }
      if (!nuevo) nuevo = { id: userId, nombre: name, email, universidad: university, carrera: career };
      store.usuarios.push({
        ...nuevo,
        passwordHash,
        bio: null,
        nickname: null,
        createdAt: new Date().toISOString()
      });
    }

    const token = jwt.sign(
      { id: nuevo.id, email: nuevo.email },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    const user = {
      id: nuevo.id,
      name: nuevo.nombre,
      email: nuevo.email,
      university: nuevo.universidad,
      career: nuevo.carrera,
      bio: nuevo.bio,
      nickname: nuevo.nickname
    };

    return res.status(201).json({ token, user });
  } catch (error) {
    console.error("[auth] Error en register:", error.message);
    return res.status(500).json({ message: "Error al registrarse" });
  }
});

router.get("/verify", async (req, res) => {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Token no proporcionado" });
  }
  const token = auth.slice(7);
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const usuario = await getUsuarioById(decoded.id);
    if (!usuario) return res.status(401).json({ message: "Usuario no encontrado" });
    return res.json({
      id: usuario.id,
      name: usuario.nombre,
      email: usuario.email,
      university: usuario.universidad,
      career: usuario.carrera,
      bio: usuario.bio,
      nickname: usuario.nickname
    });
  } catch {
    return res.status(401).json({ message: "Token inválido" });
  }
});

module.exports = router;
