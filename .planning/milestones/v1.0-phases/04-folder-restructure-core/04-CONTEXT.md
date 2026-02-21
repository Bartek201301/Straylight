# Phase 4: Folder Restructure - Core - Context

**Gathered:** 2026-02-18
**Status:** Ready for planning

<domain>
## Phase Boundary

Reorganize the src/ folder to Next.js 14 App Router best practices: route groups in src/app, component colocation with private \_components folders, structured shared components, and clean lib organization. No new features, no behavior changes, no loading/error state additions (Phase 8). All existing routes must continue working identically.

</domain>

<decisions>
## Implementation Decisions

### Route group design

- Organize by audience: (marketing) for public pages, (dashboard) for logged-in users, (admin) for admin-only
- Auth routes placement: Claude's discretion based on Next.js conventions
- Group layouts: Claude determines which groups benefit from dedicated layout.tsx (don't add empty layouts)
- Mixed-audience routes (articles, library, home): Claude decides placement based on actual auth patterns in the codebase

### Component colocation

- Route-specific components go into `_components` folders (underscore prefix = private to Next.js)
- Colocation aggressiveness: Claude analyzes import graphs and moves what makes sense (single-route components are strong candidates)
- Shared components organized by type: ui/, layout/, forms/, auth/, articles/, admin/ etc.
- Feature subfolders (components/articles/, components/admin/): Claude analyzes usage patterns — route-specific ones colocate, truly shared ones stay

### Lib folder structure

- Organization approach: Claude's discretion based on analyzing current structure
- Hooks directory location: Claude decides (src/hooks vs src/lib/hooks)
- Contexts directory location: Claude decides based on Next.js conventions
- Fonts directory location: Claude decides based on next/font configuration

### Naming conventions

- File casing: Claude decides based on minimizing risk across Windows dev / Linux prod environments
- loading.tsx and error.tsx: Deferred to Phase 8 (explicit user decision — keep Phase 4 focused on folder moves)
- Move strategy: Claude decides safest approach (incremental by group vs one batch)
- tsconfig path aliases: Claude reviews and picks best approach

### Claude's Discretion

- Auth route group placement (own group vs marketing)
- Which routes go in which groups for mixed-audience pages
- Group layout.tsx creation (only where actually needed)
- How aggressively to colocate components (based on import graph analysis)
- Feature subfolder reorganization approach
- Lib folder internal organization (by responsibility vs domain)
- Hooks, contexts, and fonts directory placement
- File casing standardization approach
- Incremental vs batch move strategy
- Path alias standardization

</decisions>

<specifics>
## Specific Ideas

- Phase 1 audit identified 51 route-specific components (28%) as colocation candidates — use this as the starting inventory
- User strongly prefers audience-based route grouping (marketing/dashboard/admin pattern)
- \_components (underscore prefix) explicitly chosen over regular components folders
- Shared components must be organized by type (ui/, layout/, forms/ etc.), not by feature domain

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

_Phase: 04-folder-restructure-core_
_Context gathered: 2026-02-18_
