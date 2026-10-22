# Contributing

## Branching

- `main` — production
- `develop` — integration; all feature branches target `develop`
- `feature/<scope>` — individual work

Never develop directly on `main` or `develop`. Always create a feature branch.

## Workflow

```bash
git checkout develop
git pull
git checkout -b feature/<scope>

# work, then:
npm run lint
npm run typecheck
npm test
npm run build

git status
git diff
git add .
git commit -m "<type>: <description>"
git push origin feature/<scope>

# open PR into develop
```

## Commit messages

Conventional commits:

```
feat:     new feature
fix:      bug fix
refactor: code change that neither fixes a bug nor adds a feature
security: security fix or hardening
docs:     documentation only
test:     tests
chore:    tooling, dependencies, configuration
```

## Pull request checklist

- [ ] `npm run lint` passes
- [ ] `npm run typecheck` passes
- [ ] `npm test` passes
- [ ] `npm run build` passes
- [ ] Mobile + desktop verified
- [ ] No secrets introduced
- [ ] No `any`, no `eslint-disable`, no `// @ts-ignore` without justification
- [ ] Documentation updated (README/ARCHITECTURE/SECURITY) if behavior changed
- [ ] New utility / schema / service has unit tests
- [ ] No real church data added — use the placeholders documented in
      [`SECURITY.md`](./SECURITY.md) (§ Placeholder data policy) until
      the church provides the real values.

## Secrets

Never commit `.env.local`, service-role keys, M-Pesa credentials, or any other secret. Use `.env.example` for variable names only.

## Code style

- TypeScript strict mode — no `any`.
- Reusable components preferred over duplicated markup.
- Server Components by default; Client Components only when interactivity is required.
- Validate inputs with Zod (client for UX, server for security).
- Never display raw database errors to end users.
