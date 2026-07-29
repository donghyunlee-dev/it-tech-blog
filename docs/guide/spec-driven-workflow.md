## **Purpose**

This document defines the repository workflow for non-trivial work items. The goal is to ensure that implementation follows an explicit task-level specification instead of starting directly from code changes.

## **When To Apply**

- a task is derived from `docs/prd.md`
- the user directly requests a feature, bug fix, or scoped change
- the work affects behavior, interfaces, persistence, validation, or integration logic

Task document creation may be skipped only for trivial operational requests or very small edits with no behavioral impact.

## **Task Workspace**

Each non-trivial work item must use `docs/tasks/{task-id}/`.

- `spec.md`
- `plan.md`
- `tasks.md`
- `test-result.md`
- `result.md`

Starter templates are available under `docs/tasks/_template/`.

## **Task Identifier Rule**

1. Use a PRD task ID when the work maps directly to a PRD task.
2. Use an existing issue or ticket ID when one exists.
3. Otherwise use a short user-request work ID.

The same work item must keep the same task ID across follow-up edits.

## **Workflow Phases**

### **1. Specify**

Create or update `docs/tasks/{task-id}/spec.md`.

`spec.md` must define problem statement, business context, scope, out of scope, user or operator scenarios, acceptance criteria, edge cases, and assumptions.

### **2. Clarify**

Resolve missing or ambiguous requirements before planning. Record clarifications inside `spec.md` when needed.

### **3. Plan**

Create or update `docs/tasks/{task-id}/plan.md`.

`plan.md` must define impacted modules, architecture approach, data or interface impact, validation strategy, and risks.

### **4. Task Breakdown**

Create or update `docs/tasks/{task-id}/tasks.md`.

`tasks.md` must contain implementation tasks, test tasks, documentation updates, and progress markers.

### **5. Implement**

Implement only after `spec.md` and `plan.md` are sufficient to remove behavioral ambiguity.

### **6. Validate**

Record validation in `docs/tasks/{task-id}/test-result.md`.

### **7. Report**

Summarize the final outcome in `docs/tasks/{task-id}/result.md`.

## **Phase Gates**

- Do not implement before `spec.md` defines scope and acceptance criteria.
- Do not implement before `plan.md` defines the technical approach and validation plan.
- Do not mark work complete before `test-result.md` and `result.md` are updated.
- Do not expand scope beyond what is written in `spec.md` and confirmed by the user.

## **Relationship To Other Guidance**

- `AGENTS.md` defines repository-wide operating rules and required document reads.
- `development-rules.md` defines coding and architecture constraints.
- `testing-strategy.md` defines test categories and execution expectations.
- `done-criteria.md` defines completion conditions.
- `prd.md` and `data-spec.md` remain the product-level source documents.
- `requirements.md` and `architecture.md`, when present, provide additional detail that this workflow's `spec.md`/`plan.md` must stay consistent with.
