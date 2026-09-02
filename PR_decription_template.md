## PR: DEV-441 --- Onboarding Skeleton Loader

### Summary

Replaces the full-screen spinner with a layout-matching skeleton loader.

Adds copy update at 1 s and slow-connection message at 3 s.

All changes are behind the 'skeleton-loader' feature flag.

### Spec

specs/DEV-441-onboarding-skeleton.md

### Acceptance Criteria

| AC | Criterion | Status | Evidence |

|-------|------------------------------------------|---------|------------------------------|

| AC-1 | Skeleton renders within 100 ms | PASS | OnboardingScreen.test.tsx:23 |

| AC-2 | No layout shift on resolve | PASS | Storybook visual diff |

| AC-3 | Loading copy changes at 1 000 ms | PASS | OnboardingScreen.test.tsx:41 |

| AC-4 | Slow-connection message at 3 000 ms | PASS | OnboardingScreen.test.tsx:58 |

| AC-5 | All Cypress tests pass without change | PASS | CI run #4821 |

| AC-6 | No files outside scope modified | PASS | git diff --name-only confirms|

### Test Evidence

CI Run: https://github.com/org/repo/actions/runs/4821

47 tests pass. 0 skipped. 0 weakened.

### Security

Secret scan: clean. New dependencies: none. Validation: no changes.

### Observability

Logs: onboarding.skeleton.rendered, onboarding.skeleton.slow_connection.

Metrics: onboarding.load.success, onboarding.load.error.

Alert: configured in Datadog (link).

### Feature Flag

Flag: skeleton-loader. Currently 0%. Staged rollout plan: (link).

### Rollback

Option A (< 1 min): Disable 'skeleton-loader' flag in LaunchDarkly.

Option B (~10 min): git revert abc1234 + trigger deployment.

### Merge Decision

APPROVE --- all ACs pass, tests green, security clean, observability in place.
