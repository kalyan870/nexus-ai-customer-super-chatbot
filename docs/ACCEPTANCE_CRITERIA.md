# Acceptance Criteria (`ACCEPTANCE_CRITERIA.md`)

1. **Super Chatbot & Personas**: Supports `Support Specialist`, `Technical Engineer`, `Billing & Refunds`, and `Sales Advisor` personas with persistent conversation history and CSAT feedback.
2. **Order Lookup & Ticket Escalation**: Recognizes order IDs (`ORD-...`) and returns live order cards; allows creating and managing support tickets (`TKT-...`).
3. **Auth & Security**: Hybrid Clerk + JWT RBAC (`admin`, `agent`, `customer`), `scrypt` password hashing, Zod validation, XSS sanitization, Helmet headers, CORS, rate limiting, and optional Cloudflare Turnstile verification.
4. **Testing**: 100% pass rate across unit, auth, RBAC, validation, edge cases, and E2E API tests.
5. **Multi-Cloud Deployment**: Live on Vercel, Firebase Hosting, Cloudflare Workers, GitHub, and GitHub Pages.
