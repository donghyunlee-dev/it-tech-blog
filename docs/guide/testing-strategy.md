## **Purpose**

This document defines the testing strategy used for repository work. The goal is to verify behavior, reduce regressions, and keep implementation aligned with documented requirements.

## **Principles**

- Write tests early enough to lock down expected behavior.
- Prefer tests that describe behavior over tests that mirror implementation detail.
- Keep tests deterministic, isolated, and repeatable.
- Use the smallest test scope that gives confidence for the behavior under change.

## **Test Layers**

### **Unit Tests**

- Verify isolated business rules and transformations.
- Avoid unnecessary external dependencies.
- Use them for fast feedback on core logic.

### **Flow or Application Tests**

- Verify orchestration across collaborators.
- Confirm state transitions, sequencing, and interaction boundaries.

### **Integration Tests**

- Verify real integration points, persistence behavior, or external contracts where appropriate.
- Use them to validate assumptions that cannot be proven with isolated tests alone.

### **Interface or API Tests**

- Verify input validation, output shape, status handling, and user-visible behavior.
- Keep these focused on boundary behavior.

## **Test Writing Rules**

### **Structure**

```
Given: initial stateWhen: action is performedThen: expected result is verified
```

### **Naming**

- Name tests after observable behavior.
- Make failure meaning obvious from the test name.

### **General Rules**

- One test should verify one main behavior.
- Tests must not depend on execution order.
- Test data should be easy to read and reason about.
- Avoid randomness unless it is part of the requirement.
- Control time, external state, and side effects where needed.

## **What To Avoid**

- tests that depend on hidden shared state
- flaky timing-based tests
- tests tightly coupled to implementation detail
- excessive mocking that removes the behavior under test
- production code changes made only to satisfy a weak test approach

## **Coverage Expectations**

- Cover important business behavior.
- Cover failure paths as well as happy paths.
- Cover boundary validation for externally visible behavior.
- Cover regressions for defects that were fixed.

Coverage percentage alone is not sufficient evidence of quality.

## **Validation Workflow**

```
spec review-> clarification review-> plan review-> test design-> failing test or missing-proof check-> implementation-> passing validation-> result recording
```

Do not start non-trivial implementation before the task documents are prepared.

## **Test Result Recording**

Each task must record:

- commands or actions used for validation
- pass results
- fail results
- skipped or blocked checks
- retest results after fixes
- acceptance criteria or task items covered by validation

Path: `docs/tasks/{task-id}/test-result.md`
