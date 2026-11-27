# Database Schema (`DATABASE.md` — Neon PostgreSQL)

1. **`users`**: `id`, `clerk_id`, `email`, `password_hash`, `full_name`, `role` (`admin`, `agent`, `customer`), `is_active`.
2. **`conversations`**: `id`, `user_id`, `persona`, `title`, `created_at`, `updated_at`.
3. **`messages`**: `id`, `conversation_id`, `sender` (`user` | `bot`), `text`, `intent`, `csat_rating` (`1` | `-1` | `null`), `created_at`.
4. **`orders`**: `id` (e.g. `ORD-1001`), `customer_email`, `product_name`, `amount_cents`, `status` (`Processing`, `Shipped`, `Delivered`, `Cancelled`), `tracking_number`, `eta`.
5. **`tickets`**: `id` (`TKT-...`), `customer_name`, `customer_email`, `category`, `priority`, `subject`, `description`, `status` (`open`, `in_progress`, `resolved`), `assigned_agent`, `resolution_notes`.
6. **`knowledge_base`**: `id`, `category`, `keywords TEXT[]`, `title`, `content`.
7. **`audit_logs`**: `id`, `user_id`, `user_email`, `user_role`, `action`, `resource`, `details JSONB`, `ip_address`, `created_at`.
