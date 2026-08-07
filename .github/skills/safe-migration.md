# SKILL.md — Safe Database Migration

## When to use

Use this skill for any schema or data migration that cannot be trivially rolled back.

## Steps

1. Create a migration file at: db/migrations/<timestamp>_<description>.sql
2. Create a rollback file at: db/migrations/<timestamp>_<description>_rollback.sql
3. Verify the rollback file undoes every change made by the migration file.
4. Write a smoke test to confirm expected row counts and schema after migration.
5. Add PR notes describing what the migration changes, how to roll back, and the risk level.

## Output

A complete migration package including:
- migration SQL
- rollback SQL
- smoke test
- PR notes

