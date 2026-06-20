# Architecture Decision Record: Service Layer Migration

**Status:** Accepted
**Date:** 2026-05-14

## Context
Currently, Next.js Server Actions and React Server Components are making direct `mongoose` calls. This tightly couples the presentation layer to the database schema, making it difficult to test, hard to audit, and prone to breaking changes. 

## Decision
We are adopting a **Service Layer Architecture** combined with the Repository Pattern. 
1. `src/services/` will contain business logic classes (e.g., `CourseService`, `AuthService`).
2. Server Actions will *only* handle HTTP/Session parsing and then invoke the Service Layer.
3. React Server Components will fetch data via the Service Layer.

## Consequences
- **Positive:** Easier unit testing (services can be mocked).
- **Positive:** Clear separation of concerns (Domain-Driven Design).
- **Negative:** Adds a layer of indirection, requiring slightly more boilerplate.
