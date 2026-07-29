## **Purpose**

This document defines common development rules for repository work. The goal is to keep changes clear, maintainable, testable, and aligned with the requested scope.

## **Scope**

- new feature implementation
- changes to existing behavior
- bug fixes
- integration work
- data handling logic
- API or interface changes
- scheduled or background processing

The following require additional caution: architecture changes, large refactors, dependency changes, environment changes, data migrations, and security-sensitive changes.

## **Core Principles**

### **Keep Scope Tight**

- Change only what is required by the task.
- Prefer the smallest effective implementation.
- Do not widen scope to include adjacent improvements.

### **Favor Clarity**

- Write code that is easy to read and reason about.
- Prefer simple control flow over clever compactness.
- Make intent visible in names, structure, and boundaries.

### **Preserve Behavior Deliberately**

- Preserve existing behavior unless the requested change requires otherwise.
- Make behavior changes explicit in code, tests, and reporting.

### **Reduce Accidental Complexity**

- Avoid unnecessary abstraction.
- Introduce structure only when it supports the current requirement.
- Do not generalize for hypothetical future needs.

## **Design Rules**

- Keep input and output handling separate from decision logic.
- Keep orchestration separate from persistence or transport details.
- Keep domain rules separate from infrastructure-specific code.
- High-level logic must not depend directly on low-level implementation details.
- Depend on contracts where a dependency may vary, integrate externally, or be replaced.
- Do not expose persistence or transport models directly at external boundaries.
- Validate external input at the boundary.

## **Implementation Rules**

- Reuse existing patterns before creating new ones.
- Avoid broad exception handling that hides real failures.
- Do not introduce silent fallback behavior unless it is a defined requirement.
- Keep functions and classes focused on a single responsibility.
- Prefer guard clauses over deeply nested conditional logic.
- Keep state changes explicit.
- Limit changes to the minimum set of files needed.

## **Naming Rules**

- Use names that describe purpose, not implementation trivia.
- Prefer consistent naming within the surrounding module.
- Use verbs for actions and nouns for concepts or data structures.
- Avoid abbreviations unless they are already standard in the repository.

## **Refactoring Rules**

- Refactoring must improve structure without changing intended behavior.
- Do not perform large refactors without explicit approval.
- Refactor in small, verifiable steps.
- Keep tests green before and after the refactor.
- Do not mix unrelated cleanup into a behavior change unless required.

## **Error Handling Rules**

- Fail explicitly when required assumptions are not met.
- Preserve actionable error context.
- Do not swallow errors to make flows appear successful.
- Handle expected failure cases intentionally and consistently.

## **Data and State Rules**

- Keep data constraints explicit and enforced.
- Avoid duplicate representations of the same business rule in multiple places.
- Review the impact of a change on state transitions and invariants.
- Consider idempotency when the same action may be repeated.

## **Logging and Observability**

- Log failures with enough context to support diagnosis.
- Avoid logging sensitive information.
- Prefer structured, purposeful logs over noisy trace output.
- Do not log normal behavior as if it were an error.

## **Security and Safety**

- Treat external input as untrusted.
- Validate input before using it.
- Keep secrets and sensitive configuration out of source code.
- Review changes for misuse, abuse, and data exposure risks.

## **Documentation Rules**

- Keep documentation aligned with actual repository behavior.
- Update documentation when rules, workflows, or required outputs change.
- Do not leave documentation in a state that contradicts the codebase.

## **Completion Checklist**

- The requested behavior is implemented and scoped correctly.
- The design remains understandable and maintainable.
- Boundaries and responsibilities remain clear.
- Error handling and validation are intentional.
- Tests cover the important behavior.
- Documentation reflects the current rule set.
