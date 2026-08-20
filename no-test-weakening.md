# No Test Weakening Rule

## What It Enforces
- NEVER remove, skip, or weaken a test assertion.
- Green build ≠ correct code.

## Required Practice
- Keep all test assertions intact and meaningful.
- If a test fails, fix the underlying code or fix the test to ensure it validates the correct behavior.
- Never comment out, skip, or disable tests to make the build pass.
- Never reduce test coverage by removing valid test cases.
- Never make assertions more lenient when they should be strict.

## Key Principles
- A passing build does not guarantee correctness—only passing tests with strong assertions do.
- Tests are contracts that define expected behavior; weakening them breaks the contract.
- Skipped or disabled tests are technical debt that hide bugs.
- Test quality matters as much as code quality.

## When Tests Need Updates
- Update tests only when the intended behavior actually changes.
- Strengthen tests over time, never weaken them.
- Document why a test was changed, not just that it was changed.
- Ensure new assertions add meaningful validation, not just pass through.

## Reminder
Maintaining test integrity is essential for long-term code quality and team confidence. A test is only as good as the assertions it makes.
