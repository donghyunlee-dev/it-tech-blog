## **Purpose**

This document defines the conditions that must be met before work is considered complete.

## **General Principles**

- Implementation alone does not mean completion.
- Completion requires behavior, validation, and documentation to align.
- Work is not complete if it exceeds the approved scope.
- Once the requested scope is complete, stop rather than continuing with optional improvements.

## **Functional Criteria**

- The requested behavior works as specified.
- Expected inputs are validated.
- Important success and failure paths are handled.
- Externally visible behavior matches the documented specification.
- State changes occur intentionally and consistently.

## **Testing Criteria**

- Important behavior is covered by tests or equivalent validation.
- Failure cases are included where relevant.
- Validation results are recorded clearly.
- Tests or checks are repeatable.
- Unverified areas are explicitly called out.

## **Design Criteria**

- Responsibilities remain clearly separated.
- High-level logic is not tightly coupled to low-level implementation detail.
- Boundaries are explicit and understandable.
- Code remains maintainable after the change.

## **Error and Safety Criteria**

- Errors are not hidden.
- Expected failure paths are handled deliberately.
- User-visible or caller-visible responses remain consistent.
- Security and misuse risks have been considered for the changed path.

## **Documentation Criteria**

- `docs/tasks/{task-id}/spec.md`
- `docs/tasks/{task-id}/plan.md`
- `docs/tasks/{task-id}/tasks.md`
- `docs/tasks/{task-id}/test-result.md`
- `docs/tasks/{task-id}/result.md`

Minimum content requirements:

- `spec.md`: problem, scope, out of scope, acceptance criteria, edge cases
- `plan.md`: approach, impacted areas, validation plan, risks
- `tasks.md`: implementation items, test items, progress state
- `test-result.md`: executed validation, results, failures, retest status
- `result.md`: delivered scope, changed files, key decisions, open gaps, next steps

## **Completion Gates**

- The requested scope is satisfied.
- Validation has passed or remaining gaps are explicitly documented.
- Required task documents are updated.
- No unrelated scope expansion was introduced.

## **Not Done If**

- behavior was implemented without sufficient validation
- a non-trivial change started without task documents
- only happy-path behavior was considered
- important failures are hidden or undocumented
- documentation no longer matches implementation
- the change introduced avoidable unrelated scope

## **Final Checklist**

- Was the request implemented as specified?
- Was the change set kept focused?
- Was important behavior validated?
- Were failure cases considered?
- Were required task documents updated?
- Are remaining risks or gaps stated clearly?
