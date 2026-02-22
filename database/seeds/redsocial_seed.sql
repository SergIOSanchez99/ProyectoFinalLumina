-- =============================================================================
-- Datos de ejemplo para la base de datos redsocial
-- Ejecutar después de redsocial_schema.sql
-- =============================================================================

USE redsocial;

-- Cursos de ejemplo (evitar duplicados)
INSERT IGNORE INTO cursos (nombre, codigo, descripcion, universidad) VALUES
('Programación I', 'CS101', 'Introducción a la programación con Python', 'Universidad Nacional'),
('Base de Datos', 'CS201', 'Diseño y gestión de bases de datos relacionales', 'Universidad Nacional'),
('Estructuras de Datos', 'CS102', 'Algoritmos y estructuras de datos fundamentales', 'Universidad Nacional'),
('Desarrollo Web', 'CS301', 'Desarrollo de aplicaciones web modernas', 'Universidad Nacional'),
('Inteligencia Artificial', 'CS401', 'Fundamentos de IA y Machine Learning', 'Universidad Nacional');

-- Nota: Los usuarios se crean mediante el registro en la aplicación.
-- Las publicaciones, comentarios y reacciones se generan con el uso.

SELECT 'Seed de redsocial aplicado correctamente' AS mensaje;
