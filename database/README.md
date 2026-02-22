# Base de Datos: redsocial

Esquema unificado para la red social universitaria Lumina, alineado con **foro-estudiantes**, **microservicios-basico** y el **frontend**.

## Tablas

| Tabla | Descripción | Mapeo en proyecto |
|-------|-------------|------------------|
| `usuarios` | Usuarios con perfil, auth | store.usuarios |
| `cursos` | Cursos académicos | store.cursos |
| `inscripciones` | Usuario inscrito en curso | store.inscripciones |
| `publicaciones` | Temas/publicaciones del foro | store.temas |
| `publicacion_tags` | Tags por publicación | tema.tags |
| `comentarios` | Comentarios (anidados, solución) | store.comentarios |
| `reacciones` | Like, love, apoyo, etc. | store.reacciones |
| `seguidores` | Relación seguidor/seguido | store.seguidores |
| `apuntes` | Apuntes colaborativos | notas |
| `reputacion` | Puntos, nivel, rango | - |
| `chatbot_conversaciones` | Conversaciones con IA | - |
| `chatbot_mensajes` | Mensajes del chatbot | - |
| `dm_conversaciones` | Conversaciones directas | - |
| `dm_mensajes` | Mensajes directos | - |
| `notificaciones` | Notificaciones | - |
| `logros` | Logros disponibles | - |
| `usuario_logros` | Logros desbloqueados | - |

## Instalación

### Opción 1: npm (desde la raíz del proyecto)

```bash
# Solo esquema
npm run db:init:redsocial

# Esquema + datos de ejemplo
npm run db:init:redsocial
npm run db:seed:redsocial
```

### Opción 2: Scripts directos

**Windows:**
```cmd
cd database\scripts
init_redsocial.bat root localhost
```

**Linux/macOS:**
```bash
cd database/scripts
chmod +x init_redsocial.sh
./init_redsocial.sh root localhost
```

### Opción 3: MySQL manual

```bash
mysql -u root -p < database/schemas/redsocial_schema.sql
mysql -u root -p < database/seeds/redsocial_seed.sql
```

## Configuración en .env

```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=tu_password
DB_NAME=redsocial
```

## Verificar esquema

Para comparar tu base de datos actual con el esquema esperado y detectar tablas/columnas faltantes:

```bash
npm run db:check
```

Genera un reporte y, si hay diferencias, un archivo `migration_YYYY-MM-DD.sql` en `backend/foro-estudiantes/scripts/` con los `ALTER TABLE` necesarios.

## Vistas

- **v_publicaciones_stats**: Publicaciones con conteo de comentarios y reacciones
- **v_ranking_usuarios**: Usuarios ordenados por reputación y seguidores
