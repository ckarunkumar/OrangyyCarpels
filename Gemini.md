# Gemini.md (AI Memory File)

Template: Orangyy_Carpels

## Overview
Orangyy Carpels is a resource, project, timesheet, HR, and billing management application that helps design studios and project-based teams manage employees, clients, projects, resource allocation, attendance, leave, timesheets, and billing in one centralized platform by connecting operational data, approval workflows, time tracking, billing rules, and reporting.

## Tech Stack
* **Frontend**: React + Vite
* **UI**: Tailwind CSS
* **Language**: TypeScript
* **Backend**: Node.js + Fastify
* **ORM**: Prisma
* **Database**: MySQL 8.0 (100% unified standard across Local and Server environments)
* **Database GUI**: Prisma Studio (Web-based visual manager on port 5555)
* **Authentication**: Session-based (cookie-based sessions)
* **Scheduler**: System Cron
* **Process Manager**: PM2
* **Web Server**: Nginx
* **AI**: Google Gemini API
* **Architecture**: Modular Monolith

## Architecture Rules
* **Service-layer pattern**: All business logic goes in services; no business logic in routes/views.
* **Explicit routes**: Define Fastify routes explicitly with strict JSON schemas for request/response validation. Avoid complex dynamic routing magic.
* **Separate concerns**: API (endpoints/routes) -> Service (business logic) -> Model/DB (Prisma client and database queries).
* **Keep components modular**: Keep React components small, focused, and reusable.

## Code Style
* **Functional components only**: Use modern React functional components with hooks.
* **Async/await everywhere**: Prefer `async/await` over promise chaining for cleaner asynchronous flows.
* **Proper error handling**: Structured error responses from backend, clean error boundaries/states in frontend.
* **Max file size**: 200 lines (strictly refactor components and services if they exceed this limit).

## Backend Rules
* **Strict validation**: Validate all incoming request body, query, and path params using Fastify JSON Schema (Ajv).
* **No logic in schemas**: Validation schemas should only check types and formats, not execute business rules.
* **All business logic in services**: Services handle validation of rules (e.g., matching capacity, check timesheet locks).
* **Use transactions where needed**: Ensure atomic operations using Prisma transactions when touching multiple tables.

## Frontend Rules
* **Clean UI, minimal design**: Dylan Field (Figma) inspired design. Extremely clean layout, minimalist UI flows, low cognitive load, function-first, and very light colors.
* **No heavy libraries**: Avoid heavy UI framework libraries (e.g., Material UI, Ant Design). Use Tailwind CSS and simple, custom, lightweight components.
* **Reusable components**: Place common components in `frontend/components/ui`. Place domain-specific feature components in `frontend/components/features`.

## Constraints
* **Strict Tech Stack Lock**: The entire tech stack (React + Vite, Tailwind CSS, TypeScript, Node.js + Fastify, Prisma ORM, MySQL 8.0 unified across Local & Server, Prisma Studio, PM2, Nginx, Google Gemini API) is 100% frozen and strictly locked. Absolutely no changes, replacements, or additions without explicit written approval from the user.
* **Do not break existing features**: Ensure all changes are verified and tested.
* **No unnecessary dependencies**: Minimize external npm packages.
* **Hardcode labels**: No i18n support in V1 (keep it simple).

## Current Status
* **Phase**: Production Ready & Fully Completed (Phase G V1)
* **Completed**:
  * Phase A - Project Scaffolding & Setup (Fastify, Vite, Tailwind CSS, TypeScript, Workspace script)
  * Phase B - Core UI Layout (sidebar, layout, routing, placeholder pages, RBAC visibility preview)
  * Phase C - Core Feature: Weekly Timesheet Entry (API endpoints, validation schemas, timesheet service, database structures)
  * Phase D - Secondary Feature: HR & Project Registries (API endpoints, validation schemas, registries services, database structures)
  * Phase E - Database Integration (Prisma configuration, SQLite schema migration, ORM services refactoring, database seeding)
  * Phase F - Auth & Role-Based Access (session-based cookie auth, frontend login page, auth guard rules)
  * Phase G - Polish & Validation (skeletons loaders, component error boundaries, debounced auto-saves, Figma-style visual alignments)
* **In Progress**:
  * None
* **Blocked**:
  * None
