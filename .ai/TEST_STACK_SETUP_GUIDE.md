# Test Stack Setup Guide (Vanilla JavaScript Browser App)

## 1) Test Stack Choice

This repository is currently planned as a vanilla JavaScript + HTML/CSS browser application.

Recommended complete stack:
- Test framework: Vitest (unit + integration), Playwright Test (e2e)
- Assertion library: Vitest expect (Jest-style, Chai-compatible)
- Mocking tool: Vitest vi (mocks, spies, stubs)

Why this stack:
- Fast feedback loop for plain JavaScript modules
- Built-in mocking and coverage support
- Clear split between fast local tests and real-browser e2e tests

## 2) Directory Structure

Use this structure:

```text
tests/
  unit/
  integration/
  e2e/
```

Optional future growth:
- tests/fixtures/ for reusable sample data
- tests/helpers/ for shared test utilities

## 3) Commands (Per Test Type + Watch)

Use these scripts in package.json when you are ready to implement:

```json
{
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest",
    "test:unit": "vitest run tests/unit",
    "test:unit:watch": "vitest tests/unit",
    "test:integration": "vitest run tests/integration",
    "test:integration:watch": "vitest tests/integration",
    "test:e2e": "playwright test",
    "test:e2e:watch": "playwright test --ui",
    "test:coverage": "vitest run --coverage"
  }
}
```

Command intent:
- test: one-shot unit + integration run
- test:watch: watch mode for all Vitest tests
- test:unit / test:integration: scoped runs by test type
- test:e2e: full end-to-end suite in real browser
- test:e2e:watch: interactive UI mode for fast e2e debugging
- test:coverage: generate coverage report from Vitest tests

## 4) Coverage Threshold Policy

Define a minimum quality bar with these thresholds:
- lines: 85%
- statements: 85%
- functions: 80%
- branches: 75%

How to measure:
- Run: npm run test:coverage
- Vitest produces coverage output (text summary and HTML report)
- Enforce thresholds in Vitest config so CI fails when below target

Example threshold config (for later implementation):

```ts
coverage: {
  reporter: ["text", "html"],
  thresholds: {
    lines: 85,
    statements: 85,
    functions: 80,
    branches: 75
  }
}
```

Suggested measurement rule:
- Exclude test files and generated artifacts from coverage
- Include all app source modules used by F1-F7 flows

## 5) Example Unit Test Pattern (With Mock)

This example shows the pattern to replicate: Arrange -> Mock -> Act -> Assert.

File example:
- tests/unit/appointmentService.test.js

```js
import { describe, it, expect, vi, beforeEach } from "vitest";

// System under test: a service that writes appointments via a repository.
import { createAppointmentService } from "../../src/services/appointmentService";

describe("appointmentService.create", () => {
  let repo;
  let service;

  beforeEach(() => {
    repo = {
      save: vi.fn()
    };

    service = createAppointmentService({ repo });
  });

  it("saves appointment and returns persisted record", async () => {
    const input = {
      patientId: "p-001",
      date: "2026-08-20",
      time: "10:30"
    };

    const saved = { id: "a-100", ...input, status: "Scheduled" };
    repo.save.mockResolvedValue(saved);

    const result = await service.create(input);

    expect(repo.save).toHaveBeenCalledTimes(1);
    expect(repo.save).toHaveBeenCalledWith(input);
    expect(result).toEqual(saved);
  });
});
```

Pattern checklist you can reuse:
- Mock dependencies at module boundary (repo, API client, storage adapter)
- Assert both behavior (called with correct arguments) and output
- Keep one main expectation goal per test case
- Use deterministic input data (fixed ids/dates)

## Recommended Rollout Order

When implementation starts later:
1. Add Vitest for unit/integration first.
2. Add coverage gate in CI after baseline tests are stable.
3. Raise thresholds gradually if needed, never lower without justification.

This guide intentionally defines setup only and does not implement any test tooling yet.
