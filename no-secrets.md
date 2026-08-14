# No Secrets Rule

## Never Hardcode Secrets
NEVER hardcode API keys, tokens, passwords, private keys, or other credentials in source code.

## Required Practice
- Store secrets in environment variables or secure secret management tools.
- Keep configuration values out of source files unless they are safe and non-sensitive.
- Review code changes for accidental exposure of credentials in logs, requests, or config files.

## Reminder
If a secret is needed, load it securely at runtime rather than embedding it directly in the codebase.
