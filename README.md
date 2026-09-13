# Course & Lab Planner

A simple MERN-based internal tool for planning courses and their labs.

```
Course → Milestone → Module → Lab Group → Lab
```

Labs move through a ClickUp-style workflow:
`Backlog → Planned → In Progress → Review → Done`.

## Stack

- **Server**: Node.js, Express, Mongoose, Zod (validation)
- **Client**: Vite, React, TypeScript, TanStack Query, React Router, `@dnd-kit`, plain CSS

## Running locally

### 1. Configure environment

Copy the example env file and edit `MONGODB_URI` if needed:

```bash
cd server
cp .env.example .env
```

`.env` defaults to `mongodb://127.0.0.1:27017/lab_planner`. Run a local MongoDB or point at Atlas.

### 2. Install + run

```bash
# Terminal 1 — server
cd server
npm install
npm run dev          # http://localhost:5000

# Terminal 2 — client
cd client
npm install
npm run dev          # http://localhost:5173
```

The Vite dev server proxies `/api/*` to the Express server.

### 3. Smoke test (no MongoDB needed)

The smoke test boots an in-memory MongoDB and exercises the full API:

```bash
cd server
npm run smoke
```

## Project layout

```
server/
  src/
    models/       Mongoose models (Course, Milestone, Module, LabGroup, Lab)
    controllers/  HTTP handlers
    services/     Business logic + safe-delete child counting
    validators/   Zod schemas
    routes/       Express routers
    middleware/   error handler, validators
    utils/        ApiError, asyncHandler, constants

client/
  src/
    pages/        DashboardPage, CoursesPage, CourseDetailsPage,
                  LabPlanningPage, LabDetailsPage
    layouts/      AppLayout (sidebar + header)
    components/   common (Modal, ConfirmDialog, StatusBadge, Toast,
                            ActionMenu, Breadcrumb, EmptyState),
                  course (CourseForm, CourseTable),
                  planning (Milestone/Module/LabGroup items + forms),
                  kanban (KanbanBoard)
    hooks/        TanStack Query hooks
    services/     Axios API clients
    styles/       reset.css, tokens.css, global.css
```

## Hierarchy UI

The Lab Planning page (`/courses/:courseId/lab-planning`) has two views:

- **Hierarchy** — collapsible tree: Milestone → Module → Lab Group → Lab.
  Each row has a kebab `⋮` menu (Edit, Delete, Add child) and inline `↑`/`↓`
  reorder buttons.
- **Board** — 5 status columns. Drag a lab between columns to change its
  status; drag within a column to reorder. Top of the page has simple
  Milestone / Module / Lab Group filters.

## API overview

```
GET    /api/courses
POST   /api/courses
GET    /api/courses/:id
PUT    /api/courses/:id
DELETE /api/courses/:id

GET    /api/courses/:courseId/milestones
POST   /api/courses/:courseId/milestones
PATCH  /api/courses/:courseId/milestones/reorder

GET    /api/milestones/:id
PUT    /api/milestones/:id
DELETE /api/milestones/:id

GET    /api/milestones/:milestoneId/modules
POST   /api/milestones/:milestoneId/modules
PATCH  /api/milestones/:milestoneId/modules/reorder

GET    /api/modules/:id
PUT    /api/modules/:id
DELETE /api/modules/:id

GET    /api/modules/:moduleId/lab-groups
POST   /api/modules/:moduleId/lab-groups
PATCH  /api/modules/:moduleId/lab-groups/reorder

GET    /api/lab-groups/:id
PUT    /api/lab-groups/:id
DELETE /api/lab-groups/:id

GET    /api/lab-groups/:labGroupId/labs
POST   /api/lab-groups/:labGroupId/labs
PATCH  /api/lab-groups/:labGroupId/labs/reorder

GET    /api/labs/:id
PUT    /api/labs/:id
DELETE /api/labs/:id
PATCH  /api/labs/:id/status
PATCH  /api/labs/reorder                     # cross-group (Kanban)

GET    /api/courses/:courseId/planning       # full tree in one fetch
GET    /api/dashboard/summary
```

## Notes

- Safe delete: deleting a parent with children returns `409 Conflict`
  with `{ modules, labGroups, labs }` counts. The UI surfaces the counts in
  a confirm dialog.
- All mutations invalidate the relevant TanStack Query keys, so the UI
  stays in sync without manual refresh.
- The Lab model leaves room for future fields (`repositoryUrl`,
  `dockerImage`, `validationRules`, …) — they are not in the UI yet.
# lab-planner
