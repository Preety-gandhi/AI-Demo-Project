# PR Review Rules

## Purpose
Use this checklist for every pull request before approval.

## Required Checks
- Verify the change matches the product/spec requirements.
- Confirm the implementation covers the intended user workflow.
- Review for regressions in core features such as patient management, appointments, consultations, and prescriptions.
- Ensure tests or validation evidence are provided.
- Check that any bug fix includes clear reproduction steps and verification results.

## Evidence Requirements
- Include test evidence or validation notes in the PR description.
- If automated tests exist, mention the command run and result.
- If no tests are available, document the manual verification performed.

## Rollback Planning
- Identify how the change can be rolled back safely.
- Note any database, config, or deployment impact.
- Ensure rollback steps are clear for the team.

## Security Review
- Review for secrets, credentials, or sensitive data exposure.
- Confirm no insecure defaults or unsafe authentication behavior were introduced.
- Check that dependencies and configuration changes do not increase risk.

## Approval Standard
Do not approve a PR without clear evidence, a rollback path, and a security review.
