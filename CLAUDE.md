This document defines repository-level operating rules for Claude Code.

---

## **Purpose**

- Keep changes small, clear, and scoped to the request.
- Deliver working results, not only analysis or plans.
- Leave verifiable outcomes with clear notes on what changed and how it was checked.
- Avoid unintended scope expansion or speculative work.

---

## **Priority**

1. User request
2. Repository or team-specific rules
3. Rules in CLAUDE.md
4. Existing repository conventions and patterns

If rules conflict, stop implementation and report the conflict.

---

## **Scope Control**

- Stay within the scope defined by the user request and the active task specification and task plan.
- Implement only what is explicitly requested.
- Do not introduce new features, unrelated refactors, renames, dependency changes, or configuration changes unless required.
- Record optional improvements under **Next Steps** in the task result document instead of implementing them.
- Stop when the requested task and done criteria are satisfied.

---

## **Pre-Implementation Verification**

- Read the relevant documentation.
- Make sure the implementation scope is clear.
- Identify the minimum set of files that must change.
- Know the validation steps before implementation starts.
- If any of these are unclear, pause and ask for clarification.

---

## **Execution Style**

- Work autonomously when assumptions do not change behavior or expand scope.
- Ask questions when assumptions would materially affect behavior.
- Stop and ask if unexpected changes directly conflict with the current task.
- Avoid loops and repeated low-value edits.

---

## **Search and Tool Use**

- Prefer fast search and focused file reads.
- Use dedicated tools when available.
- Batch independent reads and searches where possible.
- Avoid exploring unrelated parts of the repository once enough context is gathered.

---

## **Implementation Rules**

- Optimize for correctness, clarity, and reliability.
- Reuse existing patterns before introducing new abstractions.
- Preserve behavior unless the requested change requires otherwise.
- Avoid broad exception handling and silent failure paths.
- Limit changes to the smallest set of files needed.

---

## **Editing and Safety**

- Use focused edits and preserve unrelated user changes.
- Do not revert or overwrite work you did not create unless explicitly asked.
- Do not amend commits unless explicitly requested.
- Avoid destructive repository operations unless explicitly approved.

---

## **Version Control Actions**

- Do not create commits, push changes, open pull requests, or modify branches unless explicitly requested.
- If version control actions are required, ask for confirmation first.

---

## **Validation and Reporting**

- Run relevant validation steps when possible after changes.
- If validation cannot be executed, state what was not verified and why.
- Report results in a consistent order: outcome → changed files → commands or actions → validation results → notable findings.

---

## **Planning Rules**

- Skip formal planning for trivial tasks.
- If a plan is used, keep it multi-step and update statuses as work progresses.
- Do not end with plan-only output unless the user explicitly asked for planning.

---

## **Required Guidance Files**

Before starting any task, read all of the following that are present:

- `CLAUDE.team.md` (if present)
- `CLAUDE.md`
- `docs/guide/development-rules.md`
- `docs/guide/testing-strategy.md`
- `docs/guide/done-criteria.md`
- `docs/guide/spec-driven-workflow.md`
- `docs/guide/design-system.md` for web or UI work
- `docs/prd.md`
- `docs/data-spec.md`
- `docs/requirements.md` (if present)
- `docs/architecture.md` (if present)

> Implementation must not begin without reviewing all relevant documents.
> 

---

## **Web Design System Rule**

- When implementing or modifying web UI, read `docs/guide/design-system.md` before design or code changes.
- Use the design system as the source of truth for visual direction, typography, color, spacing, radius, shadows, layout rhythm, and component styling.
- Do not introduce a conflicting visual style unless the user explicitly requests it or the repository has a more specific local design rule.
- If the requested UI cannot follow the design system cleanly, record the reason in the task plan or result before proceeding.
- Validation for web UI work must include checking that the implemented screen follows the design system guidance.

---

## **Task Deliverables**

Each task must produce the following under `docs/tasks/{task-id}/`:

```
docs/tasks/{task-id}/  spec.md  plan.md  tasks.md  test-result.md  result.md
```

- Determine the task identifier from the PRD task ID or a user-request work ID.
- Create or update `spec.md` before technical planning.
- Resolve open questions through the spec-driven workflow before implementation.
- Create or update `plan.md` before code changes.
- Create or update `tasks.md` before or during implementation.
- Record validation in `test-result.md`.
- Summarize delivered scope, key decisions, and open gaps in `result.md`.

---

## **General Quality Bar**

- Respect repository structure and conventions.
- Keep responsibilities separated across boundaries.
- Avoid putting decision logic in boundary handling code.
- Use explicit boundary models where external input or output is involved.
- Do not expose internal persistence or transport models directly.
- Keep validation intentional and close to the boundary.
- Keep state changes and side effects explicit.

---

## **Response Format**

- Keep responses concise, factual, and collaborative.
- Use lightweight structure only when it improves readability.
- Explain what changed, why, and what was validated.

## Security and Information Protection

Before reading, modifying, summarizing, or transmitting any project file, read and follow:

- docs/guide/security-guidelines.md

The following rules are mandatory:

- Do not read, attach, summarize, transform, or transmit files that contain personal information, customer data, raw financial data, secrets, credentials, internal system information, or unreleased company information.
- Do not connect to external APIs, email, messenger, storage, Git, Jira, Confluence, database, or cloud services without explicit user approval.
- Do not use company information as training data or share it with unapproved external services.
- Mask or anonymize sensitive data before processing.
- Stop and ask the user when data sensitivity, external transmission, or tool permission is unclear.
- Human review is required before sharing AI-generated output outside the company.
