# Course & Lab Planning MVP — Development Skill

## 1. Purpose

Build a simple, clean MERN-based Course & Lab Planning application.

The application is an internal course planning tool where an admin/user can create courses and organize their labs using the following hierarchy:

```text
Course
  ↓
Lab Planning
  ↓
Milestone
  ↓
Module
  ↓
Lab Group
  ↓
Lab
```

The primary purpose of this MVP is **course curriculum and lab planning**.

Do NOT turn this into a full LMS.

Keep the application simple, fast, maintainable, and easy to extend later.

---

# 2. Core Product Principle

The most important principle is:

> Simple UI + clear hierarchy + fast lab planning.

The application should feel like a lightweight combination of:

* Course planner
* Curriculum organizer
* ClickUp-style lab status management

But it should NOT try to replicate ClickUp.

Avoid unnecessary features, animations, complex dashboards, and excessive configuration.

---

# 3. MVP Scope

Only implement the following:

```text
1. Course Management
2. Lab Planning
3. Milestone Management
4. Module Management
5. Lab Group Management
6. Lab Management
7. Lab Status Management
8. Basic drag-and-drop ordering/status movement
```

Nothing beyond this should be implemented unless explicitly requested.

---

# 4. Hierarchy

The hierarchy MUST remain:

```text
Course
│
└── Lab Planning
    │
    ├── Milestone
    │   │
    │   ├── Module
    │   │   │
    │   │   ├── Lab Group
    │   │   │   ├── Lab
    │   │   │   └── Lab
    │   │   │
    │   │   └── Lab Group
    │   │
    │   └── Module
    │
    └── Milestone
        └── Module
```

Never change this relationship without explicit approval.

Final relationship:

```text
Course → Milestone → Module → LabGroup → Lab
```

"Lab Planning" is a feature/workspace of a Course, not necessarily a separate database entity.

---

# 5. UI Philosophy

## IMPORTANT

The UI must be **simple**.

Do NOT create:

* overly complicated dashboards
* excessive cards
* huge gradients
* unnecessary animations
* complicated navigation
* excessive modal dialogs
* 10+ sidebar menu items
* unnecessary charts
* excessive colors
* complex settings pages

The application should look like a professional internal productivity tool.

Think:

```text
Clean
Minimal
Functional
Fast
Professional
```

---

# 6. Recommended Layout

Use a simple application shell:

```text
┌────────────────────────────────────────────────────┐
│ Logo / App Name                         User       │
├───────────────┬────────────────────────────────────┤
│               │                                    │
│ Dashboard     │                                    │
│ Courses       │           Main Content             │
│               │                                    │
│               │                                    │
└───────────────┴────────────────────────────────────┘
```

Sidebar should contain only:

```text
Dashboard
Courses
```

Do not add unnecessary navigation items.

---

# 7. Dashboard

Dashboard should be minimal.

Show only useful summary information:

```text
Dashboard

Courses       8
Milestones    32
Modules       75
Lab Groups    140
Labs          420
```

Below that:

```text
Recent Courses

DevOps Career Track
MLOps Career Track
Kubernetes Track
```

Do not build advanced analytics in MVP.

---

# 8. Course Management

## Course List

Route:

```text
/courses
```

Display:

```text
Courses

[ + Create Course ]

-----------------------------------------
Course                    Status
-----------------------------------------
DevOps Career Track       Active
MLOps Career Track        Draft
Kubernetes Track          Active
```

Actions:

```text
View
Edit
Archive/Delete
```

Keep actions simple.

---

# 9. Create Course

Course fields:

```text
title
description
status
thumbnail (optional)
```

Status:

```text
Active
Draft
Archived
```

Do not add:

* instructor
* students
* enrollment
* payment
* certificate
* category
* advanced metadata

unless explicitly requested.

---

# 10. Course Details

Route:

```text
/courses/:courseId
```

Simple header:

```text
DevOps Career Track

Complete DevOps learning program

[ Edit Course ]
```

Tabs or simple navigation:

```text
Overview
Lab Planning
```

The main feature should be:

```text
Lab Planning
```

---

# 11. Lab Planning

Route:

```text
/courses/:courseId/lab-planning
```

This is the core page of the application.

Header:

```text
DevOps Career Track

Lab Planning

[ + Milestone ]
```

The primary view should be a clean hierarchical tree.

Example:

```text
▼ Milestone 01 — Linux & Networking

   ▼ Module 01 — Linux Fundamentals

      ▼ Basic Linux Commands

         Lab 01 — File Management       DONE
         Lab 02 — File Permissions      IN PROGRESS
         Lab 03 — User Management       PLANNED

      ▼ Linux Networking

         Lab 04 — Network Commands      REVIEW
         Lab 05 — SSH                   PLANNED


▼ Milestone 02 — Git & GitHub

   ▼ Module 02 — Git Fundamentals

      ▼ Git Basics

         Lab 06 — Git Introduction      DONE
```

This hierarchy should be the default experience.

---

# 12. Hierarchy UI

Use collapsible sections.

Example:

```text
▼ Milestone
   ▼ Module
      ▼ Lab Group
         Lab
         Lab
         Lab
```

Each level should have a small action menu.

Example:

```text
Milestone 01 — Linux
                         ⋮

Module 01 — Fundamentals
                         ⋮

Basic Commands
                         ⋮
```

Menu options:

### Milestone

```text
Edit
Delete
Add Module
```

### Module

```text
Edit
Delete
Add Lab Group
```

### Lab Group

```text
Edit
Delete
Add Lab
```

### Lab

```text
Edit
Delete
```

---

# 13. Milestone

Milestone is a major learning phase/checkpoint.

Example:

```text
Milestone 01
Linux & Networking
```

Fields:

```text
title
description
order
status
```

Keep it simple.

Milestone can contain multiple Modules.

---

# 14. Module

Module belongs to a Milestone.

Example:

```text
Milestone 01
    ↓
Linux Fundamentals
```

Fields:

```text
milestoneId
title
description
order
status
```

Module can contain multiple Lab Groups.

---

# 15. Lab Group

Lab Group belongs to a Module.

Example:

```text
Module
  ↓
Linux Fundamentals
  ↓
Lab Group
  ↓
Basic Linux Commands
```

Fields:

```text
moduleId
title
description
order
status
```

Lab Group can contain multiple Labs.

---

# 16. Lab

Lab is the smallest and most important actionable item.

Example:

```text
Lab 01 — File Management
```

Fields:

```text
labGroupId
title
description
instructions
estimatedTime
order
status
createdAt
updatedAt
```

The Lab detail page should remain simple.

Example:

```text
Lab 01 — File Management

Status
[ In Progress ▼ ]

Description
Learn basic Linux file management commands.

Instructions
1. Create a directory.
2. Create a file.
3. Move the file.
4. Change permissions.

Estimated Time
45 minutes
```

---

# 17. Lab Status

Labs should have a ClickUp-style workflow.

MVP statuses:

```text
BACKLOG
PLANNED
IN PROGRESS
REVIEW
DONE
```

Use readable UI labels:

```text
Backlog
Planned
In Progress
Review
Done
```

Internally, use stable values:

```text
BACKLOG
PLANNED
IN_PROGRESS
REVIEW
DONE
```

Do not hardcode status logic throughout the frontend.

Keep statuses centralized.

Example:

```javascript
LAB_STATUSES = [
  "BACKLOG",
  "PLANNED",
  "IN_PROGRESS",
  "REVIEW",
  "DONE"
]
```

---

# 18. Kanban View

A simple Kanban view can be provided as an alternative to the hierarchy view.

At the top:

```text
[ Hierarchy ] [ Board ]
```

Board:

```text
┌──────────┬──────────┬─────────────┬────────┬────────┐
│ Backlog  │ Planned  │ In Progress │ Review │ Done   │
├──────────┼──────────┼─────────────┼────────┼────────┤
│ Lab 12   │ Lab 08   │ Lab 15      │ Lab 21 │ Lab 01 │
│ Lab 13   │ Lab 09   │ Lab 16      │ Lab 22 │ Lab 02 │
└──────────┴──────────┴─────────────┴────────┴────────┘
```

Do NOT make the board overly complicated.

The board exists primarily for quickly changing Lab status.

---

# 19. Drag and Drop

Support drag-and-drop for Labs.

### Status movement

A Lab can be dragged:

```text
Backlog
   ↓
Planned
   ↓
In Progress
   ↓
Review
   ↓
Done
```

Dragging between columns should update:

```text
lab.status
```

### Ordering

Labs should also support ordering within a Lab Group.

Use:

```text
order
```

Do not use array index as the permanent ordering mechanism.

---

# 20. Ordering

Each hierarchical entity should have:

```text
order
```

For example:

```text
Milestone
  order: 1

Module
  order: 1

LabGroup
  order: 1

Lab
  order: 1
```

Allow users to reorder:

```text
Milestones
Modules
Lab Groups
Labs
```

But keep the UI interaction simple.

---

# 21. MongoDB Models

Use separate MongoDB collections.

## Course

```javascript
{
  _id,
  title,
  description,
  thumbnail,
  status,
  createdAt,
  updatedAt
}
```

## Milestone

```javascript
{
  _id,
  courseId,
  title,
  description,
  order,
  status,
  createdAt,
  updatedAt
}
```

## Module

```javascript
{
  _id,
  milestoneId,
  title,
  description,
  order,
  status,
  createdAt,
  updatedAt
}
```

## LabGroup

```javascript
{
  _id,
  moduleId,
  title,
  description,
  order,
  status,
  createdAt,
  updatedAt
}
```

## Lab

```javascript
{
  _id,
  labGroupId,
  title,
  description,
  instructions,
  estimatedTime,
  order,
  status,
  createdAt,
  updatedAt
}
```

---

# 22. Database Relationship

Do NOT embed the entire course hierarchy into one huge Course document.

Use references:

```text
Course
  _id
   ↑
   │ courseId
Milestone
   _id
   ↑
   │ milestoneId
Module
   _id
   ↑
   │ moduleId
LabGroup
   _id
   ↑
   │ labGroupId
Lab
```

This will make future modifications easier.

---

# 23. Backend API

Use REST API.

## Courses

```http
GET    /api/courses
POST   /api/courses
GET    /api/courses/:id
PUT    /api/courses/:id
DELETE /api/courses/:id
```

## Milestones

```http
GET    /api/courses/:courseId/milestones
POST   /api/courses/:courseId/milestones

GET    /api/milestones/:id
PUT    /api/milestones/:id
DELETE /api/milestones/:id

PATCH  /api/milestones/reorder
```

## Modules

```http
GET    /api/milestones/:milestoneId/modules
POST   /api/milestones/:milestoneId/modules

GET    /api/modules/:id
PUT    /api/modules/:id
DELETE /api/modules/:id

PATCH  /api/modules/reorder
```

## Lab Groups

```http
GET    /api/modules/:moduleId/lab-groups
POST   /api/modules/:moduleId/lab-groups

GET    /api/lab-groups/:id
PUT    /api/lab-groups/:id
DELETE /api/lab-groups/:id

PATCH  /api/lab-groups/reorder
```

## Labs

```http
GET    /api/lab-groups/:labGroupId/labs
POST   /api/lab-groups/:labGroupId/labs

GET    /api/labs/:id
PUT    /api/labs/:id
DELETE /api/labs/:id

PATCH  /api/labs/:id/status
PATCH  /api/labs/reorder
```

---

# 24. API Design Principles

Use:

```text
Controllers
Services
Models
Routes
Validation
Error Handling
```

Recommended backend structure:

```text
server/
├── src/
│   ├── models/
│   │   ├── Course.js
│   │   ├── Milestone.js
│   │   ├── Module.js
│   │   ├── LabGroup.js
│   │   └── Lab.js
│   │
│   ├── controllers/
│   ├── services/
│   ├── routes/
│   ├── middleware/
│   ├── validators/
│   ├── utils/
│   └── app.js
│
└── server.js
```

Do not put all business logic directly inside route files.

---

# 25. Frontend Structure

Use reusable components.

Example:

```text
client/
└── src/
    ├── pages/
    │   ├── Dashboard
    │   ├── Courses
    │   ├── CourseDetails
    │   ├── LabPlanning
    │   └── LabDetails
    │
    ├── components/
    │   ├── Layout
    │   ├── Course
    │   ├── Milestone
    │   ├── Module
    │   ├── LabGroup
    │   ├── Lab
    │   ├── Kanban
    │   └── Common
    │
    ├── services/
    │   ├── courseApi
    │   ├── milestoneApi
    │   ├── moduleApi
    │   ├── labGroupApi
    │   └── labApi
    │
    ├── hooks/
    ├── utils/
    └── routes/
```

Follow the existing project structure if a project already exists.

Do NOT unnecessarily restructure an existing application.

---

# 26. Component Philosophy

Components should be small and reusable.

For example:

```text
<MilestoneItem />

<ModuleItem />

<LabGroupItem />

<LabItem />

<StatusBadge />

<AddButton />

<EditModal />

<ConfirmDialog />
```

Avoid giant components containing the entire Lab Planning system.

---

# 27. Forms

Use reusable forms where possible.

### Milestone Form

```text
Title
Description

[ Cancel ] [ Create ]
```

### Module Form

```text
Title
Description

[ Cancel ] [ Create ]
```

### Lab Group Form

```text
Title
Description

[ Cancel ] [ Create ]
```

### Lab Form

```text
Title
Description
Instructions
Estimated Time
Status

[ Cancel ] [ Create ]
```

Do not create multi-step forms.

---

# 28. Delete Behavior

Deleting parent entities can affect children.

Therefore, NEVER silently delete a parent with children.

Example:

If deleting a Module that contains Lab Groups:

Show:

```text
Delete Module?

This module contains 4 lab groups and 18 labs.

Are you sure?

[ Cancel ] [ Delete ]
```

For MVP, either:

1. prevent deletion until children are removed, OR
2. implement safe cascading deletion.

Prefer preventing accidental destructive actions.

---

# 29. Empty States

Every section should have a clean empty state.

Example:

```text
No milestones yet.

Create your first milestone to start planning this course.

[ + Add Milestone ]
```

For Lab Group:

```text
No labs yet.

[ + Add Lab ]
```

Avoid empty blank screens.

---

# 30. Loading States

Use simple loading indicators.

Example:

```text
Loading courses...
```

or skeletons where appropriate.

Do not over-engineer loading animations.

---

# 31. Error Handling

Show simple user-friendly messages.

Example:

```text
Unable to create the lab.
Please try again.
```

Do not expose raw backend errors to users.

Backend should log technical errors.

---

# 32. Responsive UI

The application should work on:

```text
Desktop
Laptop
Tablet
```

Desktop is the primary target.

For mobile, maintain usability but do not over-engineer a mobile-specific interface in MVP.

The Lab Planning hierarchy should remain readable on smaller screens.

---

# 33. Visual Design

Use a professional neutral design.

Recommended principles:

```text
White / neutral background
Simple borders
Moderate border radius
Readable typography
Small shadows
Consistent spacing
Minimal colors
```

Status colors may be used only for status indicators.

Example:

```text
Backlog       subtle neutral
Planned       subtle blue
In Progress   subtle yellow
Review        subtle purple
Done          subtle green
```

Avoid making the entire UI colorful.

---

# 34. Navigation

Keep navigation predictable.

Example:

```text
Courses
   ↓
DevOps Career Track
   ↓
Lab Planning
```

Breadcrumb:

```text
Courses / DevOps Career Track / Lab Planning
```

This is preferable to opening many nested pages.

---

# 35. Lab Planning Interaction

The main interaction should be:

```text
Create
Edit
Delete
Expand
Collapse
Reorder
Change Status
```

Nothing more.

The user should be able to build an entire course structure without leaving the Lab Planning page repeatedly.

---

# 36. Recommended Lab Planning Toolbar

Keep toolbar simple:

```text
Lab Planning

[ + Milestone ]        [ Hierarchy | Board ]
```

Optional:

```text
Search labs...
```

If search is implemented, keep it simple.

Do not add advanced filtering in MVP.

---

# 37. Board Filtering

If Board view is implemented, allow simple filtering:

```text
Milestone: All
Module: All
Lab Group: All
```

But do not create a complicated filter builder.

---

# 38. State Management

Do not introduce a heavy state-management system unless the existing project already uses one.

For a small MVP:

```text
React Query / TanStack Query
```

or the project's existing data-fetching approach is sufficient.

Avoid unnecessary Redux architecture if it isn't already present.

---

# 39. Authentication

If authentication already exists in the project:

* preserve it
* do not replace it
* do not break existing authentication

For a new MVP, authentication can be minimal.

Do not build:

* social login
* complicated RBAC
* student authentication
* instructor permissions

unless explicitly requested.

---

# 40. Important Existing-Project Rule

If implementing this inside an existing application:

> DO NOT break existing features.

Before changing code:

1. Inspect the existing architecture.
2. Understand existing routing.
3. Understand existing authentication.
4. Understand existing API structure.
5. Reuse existing components where possible.
6. Reuse existing styling system.
7. Reuse existing database configuration.
8. Add the new feature without unnecessarily rewriting existing code.

Never replace the whole project just to implement this feature.

---

# 41. MVP Routes

Recommended frontend routes:

```text
/
```

Dashboard

```text
/courses
```

Course list

```text
/courses/:courseId
```

Course details

```text
/courses/:courseId/lab-planning
```

Lab planning

```text
/labs/:labId
```

Lab details

Keep routing minimal.

---

# 42. Recommended User Flow

The complete MVP flow:

```text
Dashboard
   ↓
Courses
   ↓
Create Course
   ↓
Open Course
   ↓
Lab Planning
   ↓
Create Milestone
   ↓
Create Module
   ↓
Create Lab Group
   ↓
Create Lab
   ↓
Set Lab Status
   ↓
Move Lab through workflow
```

Example:

```text
DevOps Career Track

Milestone 01 — Linux
    │
    ├── Module 01 — Linux Fundamentals
    │      │
    │      ├── Basic Commands
    │      │      ├── File Management      DONE
    │      │      ├── Permissions          REVIEW
    │      │      └── User Management      PLANNED
    │      │
    │      └── Networking
    │             ├── SSH                  IN PROGRESS
    │             └── Network Tools        PLANNED
    │
    └── Module 02 — Shell Scripting
```

---

# 43. What NOT To Build

This is a strict MVP boundary.

Do NOT implement:

```text
Student management
Enrollment
Payment
Certificate
Exam
Quiz
Assignment submission
Auto grading
Lab provisioning
AWS integration
Docker provisioning
Kubernetes provisioning
Terraform execution
GitHub integration
Video management
Attendance
Chat
Notifications
Email automation
Advanced analytics
AI features
Instructor management
Multi-tenancy
Complex permissions
Calendar
Time tracking
Comments
Activity feed
```

These can be future features.

---

# 44. Future Architecture Consideration

The MVP should be designed so future features can be added.

Potential future hierarchy:

```text
Course
  ↓
Milestone
  ↓
Module
  ↓
Lab Group
  ↓
Lab
  ↓
Lab Environment
  ↓
Student Attempt
  ↓
Submission
  ↓
Evaluation
```

But none of these should be implemented now.

---

# 45. Future Lab Model Compatibility

Although MVP only needs:

```text
title
description
instructions
estimatedTime
status
```

the schema should not prevent future fields such as:

```text
repositoryUrl
dockerImage
environmentType
difficulty
tags
attachments
resources
commands
validationRules
```

Do not add these fields to the UI now.

---

# 46. Development Order

Implement the feature in this order:

### Phase 1 — Foundation

```text
Project inspection
Database connection
Model structure
API structure
```

### Phase 2 — Courses

```text
Course model
Course API
Course list
Create Course
Edit Course
Delete/Archive Course
```

### Phase 3 — Lab Planning

```text
Milestone model/API
Module model/API
Lab Group model/API
Lab model/API
```

### Phase 4 — Hierarchical UI

```text
Milestone tree
Module tree
Lab Group tree
Lab list
Expand/collapse
Create/edit/delete
```

### Phase 5 — Lab Workflow

```text
Status system
Status badge
Status dropdown
Kanban board
Drag and drop
```

### Phase 6 — Polish

```text
Loading states
Empty states
Error handling
Responsive layout
UI cleanup
```

---

# 47. Testing Requirements

At minimum test:

### Course

```text
Create course
Edit course
Delete/archive course
```

### Milestone

```text
Create milestone
Edit milestone
Delete milestone
```

### Module

```text
Create module
Edit module
Delete module
```

### Lab Group

```text
Create lab group
Edit lab group
Delete lab group
```

### Lab

```text
Create lab
Edit lab
Delete lab
Change status
```

### Ordering

```text
Reorder milestone
Reorder module
Reorder lab group
Reorder lab
```

### Board

```text
Drag lab from one status to another
Refresh page
Confirm status remains correct
```

---

# 48. Performance

The MVP should avoid unnecessary API requests.

Prefer:

```text
Fetch course planning data
        ↓
Render hierarchy
```

rather than making excessive requests for every small UI element.

However, do not sacrifice clean API architecture merely to reduce requests.

Use caching where appropriate.

---

# 49. Security

Implement basic backend validation.

Never trust frontend input.

Validate:

```text
title
description
status
IDs
order
estimatedTime
```

Ensure referenced parent entities exist.

Example:

When creating a Module:

```text
Check milestoneId exists
Check milestone belongs to requested course if applicable
Then create module
```

Do not allow arbitrary invalid relationships.

---

# 50. Code Quality Rules

Follow these rules:

```text
Keep functions small.
Keep components focused.
Avoid duplicated logic.
Use meaningful names.
Use reusable components.
Use centralized constants.
Validate API input.
Handle errors properly.
Avoid unnecessary abstractions.
```

Do not build an over-engineered enterprise architecture for this MVP.

---

# 51. Definition of Done

The MVP is complete when a user can:

```text
1. Create a Course
2. Open the Course
3. Open Lab Planning
4. Create a Milestone
5. Create Modules under that Milestone
6. Create Lab Groups under Modules
7. Create Labs under Lab Groups
8. Edit all entities
9. Delete all entities safely
10. Expand/collapse the hierarchy
11. Reorder items
12. Change Lab status
13. View Labs in Kanban form
14. Drag Labs between statuses
15. Refresh the page and retain all data
```

The final experience should be:

```text
Simple enough to understand immediately.
Powerful enough to plan a complete course.
```

---

# 52. Final Product Structure

The final MVP should feel like:

```text
                    COURSE
                       │
                       ▼
                 LAB PLANNING
                       │
             ┌─────────┴─────────┐
             ▼                   ▼
        MILESTONE 01        MILESTONE 02
             │                   │
        ┌────┴────┐         ┌────┴────┐
        ▼         ▼         ▼         ▼
     MODULE    MODULE    MODULE    MODULE
        │         │         │
        ▼         ▼         ▼
    LAB GROUP  LAB GROUP  LAB GROUP
        │         │         │
        ▼         ▼         ▼
       LAB       LAB       LAB
        │
        ▼
      STATUS

Backlog → Planned → In Progress → Review → Done
```

The application should prioritize this workflow and nothing else.

---

# 53. Agent Instruction

When implementing this skill:

1. First inspect the existing project.
2. Do not rewrite working code unnecessarily.
3. Preserve existing authentication and infrastructure.
4. Follow the existing project's technology choices where possible.
5. Implement only the defined MVP.
6. Keep the UI minimal and professional.
7. Do not add features that are not requested.
8. Do not introduce unnecessary dependencies.
9. Test each feature after implementation.
10. Before finishing, verify the complete Course → Milestone → Module → Lab Group → Lab flow.
11. Verify Lab status changes and drag-and-drop persistence.
12. Verify that existing application functionality still works.

The goal is not to build a large LMS.

The goal is to build a **simple, professional Course & Lab Planning MVP** that can later evolve into a larger learning/lab platform.
