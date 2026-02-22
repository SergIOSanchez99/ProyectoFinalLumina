# Documentación de API

## Base URL

```
http://localhost:4300/api   (foro-estudiantes - auth, content, users)
http://localhost:4200/api   (gateway - proxy a microservicios)
```

## Autenticación

La mayoría de los endpoints requieren autenticación mediante JWT.

### Headers Requeridos

```
Authorization: Bearer <token>
Content-Type: application/json
```

### Obtener Token

```http
POST /api/auth/login
```

## Endpoints

### Autenticación

#### Registrar Usuario

```http
POST /api/auth/register
```

**Body**:
```json
{
  "name": "Juan Pérez",
  "email": "juan@example.com",
  "password": "password123",
  "university": "Universidad Nacional",
  "career": "Ingeniería de Sistemas"
}
```

**Response**:
```json
{
  "message": "Usuario registrado exitosamente",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "name": "Juan Pérez",
    "email": "juan@example.com",
    "university": "Universidad Nacional",
    "career": "Ingeniería de Sistemas"
  }
}
```

#### Iniciar Sesión

```http
POST /api/auth/login
```

**Body**:
```json
{
  "email": "juan@example.com",
  "password": "password123"
}
```

**Response**:
```json
{
  "message": "Login exitoso",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "name": "Juan Pérez",
    "email": "juan@example.com"
  }
}
```

#### Verificar Token

```http
GET /api/auth/verify
Headers: Authorization: Bearer <token>
```

**Response**:
```json
{
  "message": "Token válido",
  "user": {
    "id": 1,
    "email": "juan@example.com",
    "name": "Juan Pérez"
  }
}
```

### Usuarios

#### Obtener Perfil

```http
GET /api/users/:userId
Headers: Authorization: Bearer <token>
```

**Response**:
```json
{
  "id": 1,
  "name": "Juan Pérez",
  "email": "juan@example.com",
  "university": "Universidad Nacional",
  "career": "Ingeniería de Sistemas",
  "bio": "Estudiante apasionado por la tecnología",
  "contributionsCount": 15,
  "created_at": "2024-01-01T00:00:00.000Z"
}
```

#### Actualizar Perfil

```http
PUT /api/users/:userId
Headers: Authorization: Bearer <token>
```

**Body**:
```json
{
  "name": "Juan Pérez García",
  "university": "Universidad Nacional",
  "career": "Ingeniería de Sistemas",
  "bio": "Mi nueva bio"
}
```

#### Obtener Cursos del Usuario

```http
GET /api/users/:userId/courses
Headers: Authorization: Bearer <token>
```

**Response**:
```json
[
  {
    "id": 1,
    "name": "Programación I",
    "code": "CS101",
    "description": "Introducción a la programación"
  }
]
```

#### Obtener Reputación

```http
GET /api/users/:userId/reputation
Headers: Authorization: Bearer <token>
```

**Response**:
```json
{
  "points": 150,
  "level": 2,
  "rank": 15,
  "badge": "Aprendiz"
}
```

### Contenidos

#### Obtener Publicaciones

```http
GET /api/content/publications?filter=all
Headers: Authorization: Bearer <token>
```

**Query Params**:
- `filter`: all | my-courses | trending

**Response**:
```json
[
  {
    "id": 1,
    "title": "Introducción a React",
    "content": "React es una librería...",
    "tags": ["react", "javascript"],
    "userId": 1,
    "author": {
      "name": "Juan Pérez",
      "email": "juan@example.com"
    },
    "upvotes": 15,
    "downvotes": 2,
    "commentsCount": 8,
    "createdAt": "2024-01-15T10:30:00.000Z"
  }
]
```

#### Crear Publicación

```http
POST /api/content/publications
Headers: Authorization: Bearer <token>
```

**Body**:
```json
{
  "title": "Mi primera publicación",
  "content": "Contenido de la publicación...",
  "tags": ["tutorial", "programación"]
}
```

#### Obtener Comentarios

```http
GET /api/content/publications/:publicationId/comments
Headers: Authorization: Bearer <token>
```

**Response**:
```json
[
  {
    "id": 1,
    "content": "Excelente explicación",
    "author": {
      "name": "María García"
    },
    "createdAt": "2024-01-15T11:00:00.000Z"
  }
]
```

#### Crear Comentario

```http
POST /api/content/publications/:publicationId/comments
Headers: Authorization: Bearer <token>
```

**Body**:
```json
{
  "content": "Muy útil, gracias!"
}
```

#### Votar Publicación

```http
POST /api/content/publications/:publicationId/vote
Headers: Authorization: Bearer <token>
```

**Body**:
```json
{
  "voteType": "up"
}
```

Valores de `voteType`: `up` | `down`

#### Obtener Apuntes

```http
GET /api/content/notes?courseId=1
Headers: Authorization: Bearer <token>
```

**Response**:
```json
[
  {
    "id": 1,
    "title": "Apuntes de Clase 1",
    "preview": "Introducción al curso...",
    "author": {
      "name": "Juan Pérez"
    },
    "collaboratorsCount": 3,
    "updatedAt": "2024-01-15T14:00:00.000Z",
    "views": 45,
    "likes": 12
  }
]
```

#### Crear Apunte

```http
POST /api/content/notes
Headers: Authorization: Bearer <token>
```

**Body**:
```json
{
  "title": "Mis Apuntes",
  "content": "<h1>Título</h1><p>Contenido...</p>",
  "courseId": 1
}
```

#### Actualizar Apunte

```http
PUT /api/content/notes/:noteId
Headers: Authorization: Bearer <token>
```

**Body**:
```json
{
  "title": "Título actualizado",
  "content": "<h1>Contenido actualizado</h1>"
}
```

### Chatbot

#### Crear Conversación

```http
POST /api/chatbot/conversations
Headers: Authorization: Bearer <token>
```

**Response**:
```json
{
  "id": 1,
  "userId": 1,
  "createdAt": "2024-01-15T15:00:00.000Z"
}
```

#### Enviar Mensaje

```http
POST /api/chatbot/message
Headers: Authorization: Bearer <token>
```

**Body**:
```json
{
  "message": "¿Puedes resumir este tema?",
  "context": {
    "conversationId": 1
  }
}
```

**Response**:
```json
{
  "message": "Claro, el tema se resume en...",
  "conversationId": 1
}
```

#### Resumir Apunte

```http
POST /api/chatbot/summarize
Headers: Authorization: Bearer <token>
```

**Body**:
```json
{
  "noteId": 1
}
```

**Response**:
```json
{
  "noteId": 1,
  "title": "Apuntes de Clase 1",
  "summary": "Resumen conciso del contenido..."
}
```

### Recomendaciones

#### Obtener Recomendaciones de Contenido

```http
GET /api/recommendations/content?limit=10
Headers: Authorization: Bearer <token>
```

**Response**:
```json
[
  {
    "id": 5,
    "title": "Tutorial avanzado",
    "author_name": "María García",
    "upvotes": 20
  }
]
```

#### Obtener Recomendaciones de Usuarios

```http
GET /api/recommendations/users?limit=10
Headers: Authorization: Bearer <token>
```

**Response**:
```json
[
  {
    "id": 3,
    "name": "Carlos López",
    "university": "Universidad Nacional",
    "points": 500,
    "level": 5,
    "badge": "Avanzado"
  }
]
```

### Reputación

#### Agregar Puntos

```http
POST /api/reputation/add-points
Headers: Authorization: Bearer <token>
```

**Body**:
```json
{
  "userId": 1,
  "actionType": "PUBLICATION",
  "points": 10
}
```

Tipos de acción:
- `PUBLICATION`: 10 puntos
- `COMMENT`: 5 puntos
- `NOTE`: 15 puntos
- `VOTE_RECEIVED`: 2 puntos
- `EDIT_NOTE`: 8 puntos

#### Obtener Ranking Global

```http
GET /api/reputation/ranking?limit=50
Headers: Authorization: Bearer <token>
```

**Response**:
```json
[
  {
    "user_id": 3,
    "name": "Carlos López",
    "university": "Universidad Nacional",
    "points": 500,
    "level": 5,
    "badge": "Avanzado"
  }
]
```

## WebSocket (Colaboración)

### Conexión

```javascript
import { io } from 'socket.io-client'

const socket = io('ws://localhost:4000', {
  auth: {
    token: 'your-jwt-token'
  }
})
```

### Eventos

#### Unirse a Documento

```javascript
socket.emit('join-document', {
  documentId: '123'
})
```

#### Salir de Documento

```javascript
socket.emit('leave-document', {
  documentId: '123'
})
```

#### Enviar Actualización

```javascript
socket.emit('document-update', {
  documentId: '123',
  update: {
    content: 'Nuevo contenido...'
  }
})
```

#### Recibir Actualización

```javascript
socket.on('document-update', (data) => {
  console.log('Update from:', data.userName)
  console.log('Content:', data.content)
})
```

#### Usuario se Unió

```javascript
socket.on('user-joined', (user) => {
  console.log(`${user.name} se unió al documento`)
})
```

#### Usuario Salió

```javascript
socket.on('user-left', (user) => {
  console.log(`${user.name} salió del documento`)
})
```

## Códigos de Estado HTTP

- `200 OK`: Solicitud exitosa
- `201 Created`: Recurso creado exitosamente
- `400 Bad Request`: Datos inválidos
- `401 Unauthorized`: No autenticado
- `403 Forbidden`: No autorizado
- `404 Not Found`: Recurso no encontrado
- `429 Too Many Requests`: Rate limit excedido
- `500 Internal Server Error`: Error del servidor

## Rate Limiting

El API Gateway implementa rate limiting:

- **Límite**: 100 peticiones por 15 minutos
- **Por**: Dirección IP

Si excedes el límite, recibirás un `429 Too Many Requests`.

## Paginación

Para endpoints que devuelven listas, puedes usar:

```
?limit=20&offset=0
```

- `limit`: Cantidad de resultados (máx 100)
- `offset`: Saltar N resultados

## Errores

Formato de respuesta de error:

```json
{
  "message": "Descripción del error",
  "error": "Detalles técnicos (solo en desarrollo)"
}
```
