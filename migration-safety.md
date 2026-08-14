# Migration Safety Rule

## Every Migration Requires a Paired Rollback
Every migration requires a paired rollback migration. Test against staging copy only.

## Required Practice
- Never deploy a migration without a corresponding rollback migration.
- The rollback must reverse all changes made by the forward migration.
- Test both the forward and rollback migrations against a staging database copy.
- Never test migrations directly against production.
- Ensure rollback migrations are functionally complete before deploying to production.

## Staging Testing Requirements
- Always use a staging environment database copy that mirrors production data.
- Test the forward migration first to verify it produces expected results.
- Test the rollback migration to ensure it fully restores the previous state.
- Verify data integrity after both forward and rollback operations.
- Document any data loss or transformation that occurs during migration.

## Migration Checklist
- [ ] Forward migration is written and tested
- [ ] Rollback migration is written and tested
- [ ] Both migrations have been run successfully against staging
- [ ] Data integrity is verified after each migration
- [ ] Rollback has been validated to restore the exact previous state
- [ ] No data loss or inconsistencies were introduced
- [ ] Migration changes are documented

## Deployment Safeguards
- Always have a rollback plan in place before production deployment.
- Keep rollback migrations in the same commit as forward migrations.
- Include clear documentation on how to execute the rollback if needed.
- Ensure team members know the rollback procedure before deployment.
- Monitor the migration execution in production and be ready to rollback.

## Reminder
Migration safety is critical for data integrity and system reliability. A migration without a tested rollback is a disaster waiting to happen. Always prioritize reversibility and staging validation.
