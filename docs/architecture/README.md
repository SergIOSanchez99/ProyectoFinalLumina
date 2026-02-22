# Arquitectura del Sistema

## Visión General

La Red Social de Aprendizaje Colaborativo Inteligente utiliza una arquitectura de microservicios, donde cada servicio es independiente y maneja un dominio específico de la aplicación.

## Diagrama de Arquitectura

```
┌─────────────────────────────────────────────────────────┐
│                  FRONTEND (React + Vite)                  │
│  Puerto 3000 - Componentes, páginas, servicios API       │
└──────────────────┬──────────────────────────────────────┘
                   │
                   ↓ HTTP
┌─────────────────────────────────────────────────────────┐
│              FORO-ESTUDIANTES (4300)                     │
│  Auth, Content, Users, Chatbot, Messaging                │
│  Conexión directa a MySQL (redsocial)                    │
└──────────────────┬──────────────────────────────────────┘
                   │
                   ├─────────────────────────────┐
                   ↓                             ↓
         ┌─────────────────┐          ┌─────────────────────┐
         │   MySQL (3306)   │          │ MICROSERVICIOS (4200)│
         │  Base de Datos   │          │ Gateway → usuarios,  │
         │  redsocial       │          │ cursos, temas,       │
         └─────────────────┘          │ comentarios, chatbot │
                                      └─────────────────────┘
```

## Capas de la Arquitectura

### 1. Capa de Presentación (Frontend)

**Tecnología**: React + Vite

**Responsabilidades**:
- Renderizar UI
- Gestionar estado de la aplicación
- Comunicación con backend
- Validación de formularios
- Experiencia de usuario

**Componentes Principales**:
- Páginas (Login, Feed, Editor, Profile, etc.)
- Componentes reutilizables (Navbar, Chatbot, Cards, etc.)
- Servicios (API clients)
- Contextos (Auth, WebSocket)

### 2. Capa de API Gateway

**Tecnología**: Express.js + http-proxy-middleware

**Responsabilidades**:
- Punto de entrada único para el frontend
- Enrutamiento a microservicios
- Rate limiting
- CORS
- Logging centralizado

**Puerto**: 4000

### 3. Capa de Microservicios

#### 3.1. Auth Service (4001)

**Responsabilidades**:
- Registro de usuarios
- Inicio de sesión
- Generación y validación de JWT
- Refresh tokens

**Endpoints principales**:
- POST /register
- POST /login
- GET /verify
- POST /refresh

#### 3.2. User Service (4002)

**Responsabilidades**:
- Gestión de perfiles
- Cursos inscritos
- Información académica
- Actividad del usuario

**Endpoints principales**:
- GET /users/:id
- PUT /users/:id
- GET /users/:id/courses
- POST /users/courses/:id/enroll
- GET /users/:id/reputation
- GET /users/:id/activity

#### 3.3. Content Service (4003)

**Responsabilidades**:
- Publicaciones
- Comentarios
- Votos
- Apuntes colaborativos

**Endpoints principales**:
- GET/POST /publications
- GET/POST /publications/:id/comments
- POST /publications/:id/vote
- GET/POST /notes

#### 3.4. Collaboration Service (4004)

**Tecnología**: Socket.IO

**Responsabilidades**:
- Edición colaborativa en tiempo real
- Gestión de usuarios activos
- Sincronización de cambios
- Notificaciones en tiempo real

**Eventos WebSocket**:
- join-document
- leave-document
- document-update
- cursor-position
- user-joined
- user-left

#### 3.5. Reputation Service (4005)

**Responsabilidades**:
- Cálculo de puntos
- Niveles y badges
- Rankings globales y por universidad
- Recálculo de reputación

**Endpoints principales**:
- POST /reputation/add-points
- GET /reputation/ranking
- GET /reputation/rank/:userId
- POST /reputation/recalculate/:userId

#### 3.6. Recommendation Service (4006)

**Responsabilidades**:
- Recomendación de contenidos
- Recomendación de usuarios
- Recomendación de apuntes
- Recomendación de cursos

**Endpoints principales**:
- GET /recommendations/content
- GET /recommendations/users
- GET /recommendations/notes
- GET /recommendations/courses

#### 3.7. Chatbot Service (4007)

**Tecnología**: OpenAI API

**Responsabilidades**:
- Asistencia académica
- Resúmenes de apuntes
- Recomendaciones personalizadas
- Historial de conversaciones

**Endpoints principales**:
- POST /conversations
- GET /conversations/:id
- POST /message
- POST /summarize
- POST /recommendations

### 4. Capa de Datos

**Tecnología**: MySQL 8.0

**Características**:
- Esquema normalizado
- Índices optimizados
- Vistas para queries complejos
- Integridad referencial

**Tablas principales**:
- users
- courses
- publications, comments, votes
- notes, note_edits
- reputation
- conversations, conversation_messages

## Flujos de Datos

### Flujo de Autenticación

```
1. Usuario → Frontend: Envía credenciales
2. Frontend → API Gateway → Auth Service: POST /login
3. Auth Service → Database: Verifica credenciales
4. Auth Service → Frontend: Devuelve JWT
5. Frontend: Almacena JWT en localStorage
6. Frontend: Incluye JWT en headers de peticiones subsecuentes
```

### Flujo de Publicación

```
1. Usuario → Frontend: Crea publicación
2. Frontend → API Gateway → Content Service: POST /publications
3. Content Service → Database: Inserta publicación
4. Content Service → Reputation Service: Agregar puntos
5. Reputation Service → Database: Actualiza reputación
6. Content Service → Frontend: Devuelve publicación creada
7. Frontend: Actualiza UI
```

### Flujo de Edición Colaborativa

```
1. Usuario A → Frontend: Abre editor
2. Frontend → Collaboration Service: join-document (WebSocket)
3. Collaboration Service → Usuario A: Lista de usuarios activos
4. Usuario A → Frontend: Edita contenido
5. Frontend → Collaboration Service: document-update
6. Collaboration Service → Usuarios B, C: Broadcast update
7. Frontend (B, C): Actualiza editor en tiempo real
```

### Flujo de Chatbot

```
1. Usuario → Frontend: Envía mensaje
2. Frontend → API Gateway → Chatbot Service: POST /message
3. Chatbot Service → Database: Obtiene contexto del usuario
4. Chatbot Service → OpenAI API: Envía prompt
5. OpenAI API → Chatbot Service: Devuelve respuesta
6. Chatbot Service → Database: Guarda conversación
7. Chatbot Service → Frontend: Devuelve respuesta
8. Frontend: Muestra respuesta en UI
```

## Patrones de Diseño

### 1. Microservicios

Cada servicio es independiente, con su propia lógica y puede ser desplegado separadamente.

### 2. API Gateway

Punto de entrada único que abstrae la complejidad de múltiples servicios.

### 3. JWT para Autenticación

Tokens stateless que permiten autenticación sin mantener sesiones en el servidor.

### 4. Repository Pattern

Capa de acceso a datos abstraída en el código compartido.

### 5. Pub/Sub (WebSocket)

Para comunicación en tiempo real entre clientes.

## Seguridad

### Autenticación
- JWT con expiración
- Hashing de contraseñas con bcrypt
- Refresh tokens

### Autorización
- Middleware de autenticación en cada servicio
- Validación de propiedad de recursos

### Protección de Datos
- Validación de entrada
- Sanitización de datos
- Prepared statements (prevención SQL injection)
- Rate limiting en API Gateway

### Comunicación
- HTTPS en producción
- CORS configurado
- Headers de seguridad

## Escalabilidad

### Horizontal

Cada microservicio puede escalar independientemente:

```bash
# Ejemplo con Docker
docker-compose up --scale content-service=3
```

### Vertical

- Optimización de queries
- Índices en base de datos
- Caching (Redis en futuras versiones)

### Load Balancing

API Gateway puede distribuir carga entre múltiples instancias de servicios.

## Monitoreo y Logging

### Recomendaciones

- **Logging**: Winston o Morgan para logs estructurados
- **Monitoring**: Prometheus + Grafana
- **Error Tracking**: Sentry
- **APM**: New Relic o DataDog

### Health Checks

Cada servicio expone un endpoint `/health` para verificar su estado.

## Despliegue

### Desarrollo

```bash
docker-compose up
```

### Producción

- **Frontend**: Vercel, Netlify
- **Backend**: Railway, Render, AWS ECS
- **Database**: AWS RDS, Digital Ocean Managed MySQL
- **Contenedores**: Kubernetes, Docker Swarm

## Mejoras Futuras

1. **Caching**: Redis para mejorar performance
2. **Message Queue**: RabbitMQ o Kafka para comunicación asíncrona
3. **Full-text Search**: Elasticsearch para búsquedas avanzadas
4. **CDN**: CloudFlare para assets estáticos
5. **Analytics**: Sistema de métricas y analíticas
6. **Testing**: Pruebas unitarias y de integración
7. **CI/CD**: Pipeline automatizado de despliegue
