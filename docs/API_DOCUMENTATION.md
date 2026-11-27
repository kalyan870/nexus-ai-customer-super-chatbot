# API Documentation (`API_DOCUMENTATION.md`)

- `GET /api/status` — Health, DB mode, auth mode (`clerk` / `local-jwt`), live counts.
- `POST /api/auth/register` & `POST /api/auth/login` & `GET /api/auth/me` & `GET /api/auth/users`
- `POST /api/chat` — `{ message, conversationId?, persona? }` → returns `{ reply, intent, persona, card?, suggestions, conversationId, messageId }`.
- `POST /api/chat/feedback` — `{ messageId, rating: 1 | -1 }` — records CSAT rating.
- `GET /api/conversations` & `GET /api/conversations/:id/messages` — Conversation history.
- `GET /api/orders/:id` — Order tracking lookup.
- `POST /api/tickets`, `GET /api/tickets` (agent/admin), `PATCH /api/tickets/:id` (agent/admin), `DELETE /api/tickets/:id` (admin).
- `GET /api/kb`, `POST /api/kb` (admin), `DELETE /api/kb/:id` (admin).
- `GET /api/analytics` (agent/admin) & `GET /api/audit-logs` (admin).
