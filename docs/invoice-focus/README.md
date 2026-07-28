# InvoiceFocus Technical Documentation

**Document set:** Software Architecture, Database, API, Security, Deployment, Operations, and QA  
**Application:** InvoiceFocus  
**Evidence basis:** Current source code, SQL migrations `001`–`007`, Replit workflow configuration, and live Supabase schema verification  
**Documentation date:** 2026-07-28

## Documents

1. [System Architecture](./01-system-architecture.md)
2. [Database Schema and ERD](./02-database-schema-and-erd.md)
3. [API Reference](./03-api-reference.md)
4. [Authentication, Subscription, and Security](./04-auth-subscription-security.md)
5. [Application Structure](./05-application-structure.md)
6. [Deployment and Operations](./06-deployment-and-operations.md)
7. [Roadmap and Architecture Review](./07-roadmap-and-architecture-review.md)

## Scope and documentation conventions

This documentation describes the implementation that exists today. It does not describe an imagined target architecture.

- **Implemented** means supported by current source code or applied SQL.
- **Configured hook** means the code expects or exposes the capability, but a complete provider/workflow is not present in this repository.
- **Recommendation** means an architectural improvement, not current behavior.
- Passwords, API keys, service-role keys, session secrets, and other credentials are intentionally not documented by value.

## Executive summary

InvoiceFocus is a single-product invoicing SaaS composed of:

- A React/Vite browser application under `artifacts/invoice-focus`
- An Express/TypeScript API under `artifacts/api-server`
- Supabase Auth, PostgreSQL, PostgREST, and Storage
- Resend for transactional email
- Replit workflows and deployment for application hosting

The browser uses Supabase Auth for session management and calls the Express API for business operations. The API validates the bearer token with Supabase, performs user-scoped operations using a service-role Supabase client, and applies subscription and ownership checks in application code. PostgreSQL RLS remains enabled as a defense-in-depth boundary.

## Current production-readiness position

The current codebase has passed typechecking, frontend production build, API startup, and live schema verification for migration `007`. The main known non-blocking build warnings are sourcemap resolution warnings and a large vendor bundle. See the architecture review for remaining technical debt and recommended hardening.