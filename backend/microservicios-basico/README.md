# Backend desde cero (Microservicios basico)

Arquitectura simple para foro estudiantil con:

- `api-gateway` (puerto `4200`)
- `usuarios` (puerto `4201`)
- `cursos` (puerto `4202`)
- `temas` (puerto `4203`)
- `comentarios` (puerto `4204`)
- `chatbot` (puerto `4205`)

## Uso

Desde esta carpeta:

```bash
npm install
npm run install:all
npm run dev
```

## Endpoints via gateway

- `GET http://localhost:4200/health`
- `GET|POST|PUT|DELETE http://localhost:4200/api/usuarios`
- `GET|POST|PUT|DELETE http://localhost:4200/api/cursos`
- `GET|POST|PUT|DELETE http://localhost:4200/api/temas`
- `GET|POST|PUT|DELETE http://localhost:4200/api/comentarios`
- `POST http://localhost:4200/api/chatbot/message`
