# NEXUS AI — Customer Super Chatbot

> **Enterprise AI customer support, order tracking, and ticket triage powered by Neon PostgreSQL, Clerk Auth, and Cloudflare Edge.**

[![Verify application](https://github.com/kalyan870/nexus-ai-customer-super-chatbot/actions/workflows/ci.yml/badge.svg)](https://github.com/kalyan870/nexus-ai-customer-super-chatbot/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-17A673.svg)](LICENSE)

NEXUS AI is a standalone full-stack **AI Customer Super Chatbot** featuring multi-persona support (`Support Specialist`, `Technical Engineer`, `Billing & Refunds`, `Sales Advisor`), real-time order tracking cards (`ORD-1001`), CSAT feedback, autonomous ticket escalation, and a Clerk/JWT RBAC Agent Triage Console.

## Documentation

- [Product Requirements (PRD)](docs/PRD.md)
- [Design System](docs/DESIGN.md)
- [Implementation Tasks](docs/TASKS.md)
- [Technology Stack](docs/TECHSTACK.md)
- [Architecture](docs/ARCHITECTURE.md)
- [Database Schema](docs/DATABASE.md)
- [API Documentation](docs/API_DOCUMENTATION.md)
- [User Flows](docs/USER_FLOWS.md)
- [Acceptance Criteria](docs/ACCEPTANCE_CRITERIA.md)

## Run locally

```powershell
cd backend && npm install && npm test
cd ../frontend && npm install && npm run build
cd .. && npm start
```
Visit `http://localhost:5001`.
