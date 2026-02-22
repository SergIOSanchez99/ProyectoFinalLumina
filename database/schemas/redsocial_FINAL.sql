-- =============================================================================
-- BASE DE DATOS: redsocial - ESQUEMA FINAL
-- Red Social Universitaria Lumina
-- Ejecutar completo en MySQL Workbench (desde cero)
-- =============================================================================

-- Eliminar base de datos existente (¡CUIDADO! Borra todos los datos)
DROP DATABASE IF EXISTS redsocial;

-- Crear base de datos
CREATE DATABASE redsocial 
  CHARACTER SET utf8mb4 
  COLLATE utf8mb4_unicode_ci;

USE redsocial;

-- =============================================================================
-- 1. USUARIOS
-- =============================================================================
CREATE TABLE usuarios (
  id INT PRIMARY KEY AUTO_INCREMENT,
  nombre VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  universidad VARCHAR(255),
  carrera VARCHAR(255),
  bio TEXT,
  avatar_url LONGTEXT,
  nickname VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_email (email),
  INDEX idx_nickname (nickname)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- 2. CURSOS
-- =============================================================================
CREATE TABLE cursos (
  id INT PRIMARY KEY AUTO_INCREMENT,
  nombre VARCHAR(255) NOT NULL,
  codigo VARCHAR(50) UNIQUE NOT NULL,
  descripcion TEXT,
  docente VARCHAR(255),
  universidad VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_codigo (codigo),
  INDEX idx_universidad (universidad)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- 3. INSCRIPCIONES (usuarios en cursos)
-- =============================================================================
CREATE TABLE inscripciones (
  id INT PRIMARY KEY AUTO_INCREMENT,
  usuario_id INT NOT NULL,
  curso_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
  FOREIGN KEY (curso_id) REFERENCES cursos(id) ON DELETE CASCADE,
  UNIQUE KEY uk_inscripcion (usuario_id, curso_id),
  INDEX idx_usuario (usuario_id),
  INDEX idx_curso (curso_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- 4. PUBLICACIONES / TEMAS (foro por curso)
-- =============================================================================
CREATE TABLE publicaciones (
  id INT PRIMARY KEY AUTO_INCREMENT,
  usuario_id INT NOT NULL,
  curso_id INT NOT NULL,
  titulo VARCHAR(500) NOT NULL,
  contenido TEXT NOT NULL,
  estado ENUM('abierto', 'resuelto') DEFAULT 'abierto',
  vistas INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
  FOREIGN KEY (curso_id) REFERENCES cursos(id) ON DELETE CASCADE,
  INDEX idx_usuario (usuario_id),
  INDEX idx_curso (curso_id),
  INDEX idx_estado (estado),
  INDEX idx_created (created_at),
  FULLTEXT idx_busqueda (titulo, contenido)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- 5. TAGS DE PUBLICACIONES
-- =============================================================================
CREATE TABLE publicacion_tags (
  id INT PRIMARY KEY AUTO_INCREMENT,
  publicacion_id INT NOT NULL,
  tag VARCHAR(100) NOT NULL,
  FOREIGN KEY (publicacion_id) REFERENCES publicaciones(id) ON DELETE CASCADE,
  UNIQUE KEY uk_publicacion_tag (publicacion_id, tag),
  INDEX idx_tag (tag)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- 6. COMENTARIOS (anidados, con solución marcada)
-- =============================================================================
CREATE TABLE comentarios (
  id INT PRIMARY KEY AUTO_INCREMENT,
  usuario_id INT NOT NULL,
  publicacion_id INT NOT NULL,
  parent_id INT NULL,
  contenido TEXT NOT NULL,
  es_solucion BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
  FOREIGN KEY (publicacion_id) REFERENCES publicaciones(id) ON DELETE CASCADE,
  FOREIGN KEY (parent_id) REFERENCES comentarios(id) ON DELETE CASCADE,
  INDEX idx_publicacion (publicacion_id),
  INDEX idx_usuario (usuario_id),
  INDEX idx_parent (parent_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- 7. REACCIONES (like, love, apoyo, genial, interesante)
-- =============================================================================
CREATE TABLE reacciones (
  id INT PRIMARY KEY AUTO_INCREMENT,
  usuario_id INT NOT NULL,
  target_tipo ENUM('tema', 'comentario') NOT NULL,
  target_id INT NOT NULL,
  tipo ENUM('like', 'love', 'apoyo', 'genial', 'interesante') NOT NULL DEFAULT 'like',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
  UNIQUE KEY uk_reaccion (usuario_id, target_tipo, target_id),
  INDEX idx_target (target_tipo, target_id),
  INDEX idx_usuario (usuario_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- 8. SEGUIDORES
-- =============================================================================
CREATE TABLE seguidores (
  id INT PRIMARY KEY AUTO_INCREMENT,
  seguidor_id INT NOT NULL,
  seguido_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (seguidor_id) REFERENCES usuarios(id) ON DELETE CASCADE,
  FOREIGN KEY (seguido_id) REFERENCES usuarios(id) ON DELETE CASCADE,
  UNIQUE KEY uk_seguimiento (seguidor_id, seguido_id),
  CHECK (seguidor_id != seguido_id),
  INDEX idx_seguidor (seguidor_id),
  INDEX idx_seguido (seguido_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- 9. APUNTES (apuntes colaborativos por curso)
-- =============================================================================
CREATE TABLE apuntes (
  id INT PRIMARY KEY AUTO_INCREMENT,
  usuario_id INT NOT NULL,
  curso_id INT,
  titulo VARCHAR(500) NOT NULL,
  contenido LONGTEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
  FOREIGN KEY (curso_id) REFERENCES cursos(id) ON DELETE SET NULL,
  INDEX idx_usuario (usuario_id),
  INDEX idx_curso (curso_id),
  INDEX idx_updated (updated_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- 10. RECURSOS (enlaces, videos, materiales de estudio por curso)
-- =============================================================================
CREATE TABLE recursos (
  id INT PRIMARY KEY AUTO_INCREMENT,
  usuario_id INT NOT NULL,
  curso_id INT NOT NULL,
  titulo VARCHAR(500) NOT NULL,
  url VARCHAR(2000) NOT NULL,
  descripcion TEXT,
  tipo ENUM('link', 'video', 'documento', 'otro') DEFAULT 'link',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
  FOREIGN KEY (curso_id) REFERENCES cursos(id) ON DELETE CASCADE,
  INDEX idx_usuario (usuario_id),
  INDEX idx_curso (curso_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- 11. REPUTACIÓN
-- =============================================================================
CREATE TABLE reputacion (
  id INT PRIMARY KEY AUTO_INCREMENT,
  usuario_id INT UNIQUE NOT NULL,
  puntos INT DEFAULT 0,
  nivel INT DEFAULT 1,
  rango VARCHAR(50) DEFAULT 'Principiante',
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
  INDEX idx_puntos (puntos)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- 12. CHATBOT
-- =============================================================================
CREATE TABLE chatbot_conversaciones (
  id INT PRIMARY KEY AUTO_INCREMENT,
  usuario_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
  INDEX idx_usuario (usuario_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE chatbot_mensajes (
  id INT PRIMARY KEY AUTO_INCREMENT,
  conversacion_id INT NOT NULL,
  rol ENUM('user', 'assistant', 'system') NOT NULL,
  contenido TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (conversacion_id) REFERENCES chatbot_conversaciones(id) ON DELETE CASCADE,
  INDEX idx_conversacion (conversacion_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- 13. MENSAJERÍA DIRECTA
-- =============================================================================
CREATE TABLE dm_conversaciones (
  id INT PRIMARY KEY AUTO_INCREMENT,
  usuario1_id INT NOT NULL,
  usuario2_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (usuario1_id) REFERENCES usuarios(id) ON DELETE CASCADE,
  FOREIGN KEY (usuario2_id) REFERENCES usuarios(id) ON DELETE CASCADE,
  UNIQUE KEY uk_conversacion (usuario1_id, usuario2_id),
  INDEX idx_usuario1 (usuario1_id),
  INDEX idx_usuario2 (usuario2_id),
  INDEX idx_updated (updated_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE dm_mensajes (
  id INT PRIMARY KEY AUTO_INCREMENT,
  conversacion_id INT NOT NULL,
  remitente_id INT NOT NULL,
  contenido TEXT NOT NULL,
  leido BOOLEAN DEFAULT FALSE,
  leido_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (conversacion_id) REFERENCES dm_conversaciones(id) ON DELETE CASCADE,
  FOREIGN KEY (remitente_id) REFERENCES usuarios(id) ON DELETE CASCADE,
  INDEX idx_conversacion (conversacion_id),
  INDEX idx_remitente (remitente_id),
  INDEX idx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- 14. NOTIFICACIONES
-- =============================================================================
CREATE TABLE notificaciones (
  id INT PRIMARY KEY AUTO_INCREMENT,
  usuario_id INT NOT NULL,
  tipo VARCHAR(50) NOT NULL,
  titulo VARCHAR(255) NOT NULL,
  mensaje TEXT,
  leido BOOLEAN DEFAULT FALSE,
  relacionado_id INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
  INDEX idx_usuario (usuario_id),
  INDEX idx_leido (leido)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- 15. LOGROS (gamificación)
-- =============================================================================
CREATE TABLE logros (
  id INT PRIMARY KEY AUTO_INCREMENT,
  nombre VARCHAR(255) NOT NULL UNIQUE,
  descripcion TEXT,
  icono VARCHAR(50),
  puntos_requeridos INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE usuario_logros (
  id INT PRIMARY KEY AUTO_INCREMENT,
  usuario_id INT NOT NULL,
  logro_id INT NOT NULL,
  desbloqueado_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
  FOREIGN KEY (logro_id) REFERENCES logros(id) ON DELETE CASCADE,
  UNIQUE KEY uk_usuario_logro (usuario_id, logro_id),
  INDEX idx_usuario (usuario_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- VISTAS
-- =============================================================================

CREATE OR REPLACE VIEW v_publicaciones_stats AS
SELECT 
  p.id,
  p.usuario_id,
  p.curso_id,
  p.titulo,
  p.contenido,
  p.estado,
  p.vistas,
  p.created_at,
  u.nombre AS autor_nombre,
  u.email AS autor_email,
  (SELECT COUNT(*) FROM comentarios c WHERE c.publicacion_id = p.id AND c.parent_id IS NULL) AS comentarios_count,
  (SELECT COUNT(*) FROM reacciones r WHERE r.target_tipo = 'tema' AND r.target_id = p.id) AS reacciones_count
FROM publicaciones p
JOIN usuarios u ON p.usuario_id = u.id;

CREATE OR REPLACE VIEW v_ranking_usuarios AS
SELECT 
  u.id,
  u.nombre,
  u.email,
  u.universidad,
  u.carrera,
  COALESCE(r.puntos, 0) AS puntos,
  COALESCE(r.nivel, 1) AS nivel,
  COALESCE(r.rango, 'Principiante') AS rango,
  (SELECT COUNT(*) FROM seguidores s WHERE s.seguido_id = u.id) AS seguidores_count
FROM usuarios u
LEFT JOIN reputacion r ON u.id = r.usuario_id
ORDER BY puntos DESC;

-- =============================================================================
-- DATOS INICIALES
-- =============================================================================

-- Curso General (por defecto)
INSERT INTO cursos (id, nombre, codigo, descripcion, docente) VALUES
(1, 'General', 'GEN001', 'Curso general para publicaciones y debates', NULL);

-- Cursos de ejemplo
INSERT INTO cursos (nombre, codigo, descripcion, universidad) VALUES
('Programación I', 'CS101', 'Introducción a la programación con Python', 'Universidad Nacional'),
('Base de Datos', 'CS201', 'Diseño y gestión de bases de datos relacionales', 'Universidad Nacional'),
('Estructuras de Datos', 'CS102', 'Algoritmos y estructuras de datos fundamentales', 'Universidad Nacional'),
('Desarrollo Web', 'CS301', 'Desarrollo de aplicaciones web modernas', 'Universidad Nacional'),
('Inteligencia Artificial', 'CS401', 'Fundamentos de IA y Machine Learning', 'Universidad Nacional');

-- Logros de ejemplo
INSERT INTO logros (nombre, descripcion, icono, puntos_requeridos) VALUES
('Primera Publicación', 'Crea tu primera publicación', '📝', 10),
('Colaborador Activo', 'Realiza 10 comentarios', '💬', 50),
('Experto en Apuntes', 'Crea 5 apuntes colaborativos', '📚', 75),
('Mentor', 'Recibe 50 reacciones positivas', '⭐', 100),
('Gurú del Conocimiento', 'Alcanza 1000 puntos de reputación', '🏆', 1000);

-- =============================================================================
-- FIN
-- =============================================================================
SELECT 'Base de datos redsocial creada correctamente' AS mensaje;
