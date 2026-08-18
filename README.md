# Frontend Template

Next.js 16 + TypeScript template with server-side session auth, Tailwind CSS, and
i18n routing.

It pairs with [`backend-template`](https://github.com/andradeecom/backend-template)
and acts as a **backend-for-frontend**: the browser never receives a credential
it can read. See [docs/authentication.md](docs/authentication.md).

## Requirements

- Node `24.x` (see `.nvmrc`)
- pnpm `11.21.0` (pinned via `packageManager`)
- A running instance of the backend API

## Getting started

```bash
pnpm install
cp .env.example .env.local   # then fill in the blanks
pnpm dev
```

Opens on `http://localhost:3000`. Requests redirect to a locale-prefixed path
(`/en`, `/es`, `/pt`), so `/` lands on `/en/login` or `/en/home` depending on
whether a session cookie is present.

## Scripts

| Script                      | What it does                    |
| --------------------------- | ------------------------------- |
| `pnpm dev`                  | Dev server (Turbopack)          |
| `pnpm build` / `pnpm start` | Production build, then serve it |
| `pnpm lint`                 | ESLint                          |
| `pnpm format`               | Prettier                        |

## Environment

| Variable                       | Notes                                                   |
| ------------------------------ | ------------------------------------------------------- |
| `NEXT_PUBLIC_API_URL`          | Backend base URL, e.g. `http://localhost:3001/api`      |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | Google social login                                     |
| `API_URL`                      | Optional server-only override for `NEXT_PUBLIC_API_URL` |

There is deliberately no token TTL configuration: the browser holds no token, and
the backend owns session lifetime.

## Authentication

The browser holds exactly one thing — an httpOnly session cookie set by the
backend. **Nothing in this app reads it**, and no credential is ever exposed to
client JavaScript. Login runs as a Server Action and `src/lib/api/api.ts` is the
BFF hop that carries the session upstream.

Full detail — the Server Action flow, CSRF forwarding, 401 handling, and what
the middleware does and does not check — in
[docs/authentication.md](docs/authentication.md).

## Internationalization

Locales are `en`, `es`, `pt`, with `en` as the default. Every page lives under
`src/app/[lang]/`, and `src/proxy.ts` redirects unprefixed paths to a detected
locale. Dictionaries are JSON files in `src/lib/i18n/dictionaries/`, loaded
server-side via `getDictionary()`.

## Project structure

```
src/
├── app/
│   ├── [lang]/
│   │   ├── (auth)/       login, forgot-password, change-password, Google callback
│   │   └── home/
│   └── api/auth/         force-logout, Google exchange (route handlers)
├── actions/              Server Actions (login, logout, password flows)
├── components/
│   ├── auth/
│   └── ui/               shadcn-style primitives
├── lib/
│   ├── api/              BFF layer: api.ts, session.ts, client-api.ts
│   ├── i18n/
│   ├── validations/      Zod schemas
│   └── types/
└── proxy.ts              Middleware: locale routing + session presence
```

## Features

- [x] Next.js 16 + TypeScript
- [x] Server-side session auth (BFF; no credential in the browser)
- [x] CSRF token forwarding
- [x] Tailwind CSS
- [x] React Compiler
- [x] i18n routing (en / es / pt)
- [x] Zod (validation)
- [x] React Hook Form (form handling)
- [x] Login with Google (social login)
- [x] ESLint, Prettier, Husky, lint-staged
- [ ] Toast
- [ ] Zustand (state management)

## Releasing

The **Bump Version** GitHub Action (`workflow_dispatch`) bumps `package.json`,
then commits, tags, and pushes. Dispatch it from `main` — it has no branch
filter, so it tags whichever branch you run it against.

## Contributing

`main` is protected by a branch ruleset: it cannot be force-pushed or deleted,
and changes land through a pull request. Only the **admin** repository role can
bypass that — for everyone else the requirement is absolute, with no bypass
option offered. Owners listed in `.github/CODEOWNERS` are auto-requested for
review on every PR.

```bash
git switch -c feat/short-description
# ...work...
git push -u origin feat/short-description
gh pr create --fill
```

**Branch names** carry the same prefix as the commit type: `feat/`, `fix/`,
`docs/`, `refactor/`, `chore/`.

**Commits** follow [Conventional Commits](https://www.conventionalcommits.org):

```
<type>(<optional scope>): <summary in the imperative mood>

<body explaining *why*, not what the diff already shows>
```

Types: `feat`, `fix`, `docs`, `refactor`, `test`, `chore`, `ci`, `perf`.
Append `!` and add a `BREAKING CHANGE:` footer when the change breaks callers —
for example `refactor(auth)!: issue sessions instead of JWTs`.

Split work into commits that each stand on their own rather than one large
commit at the end. Husky runs Prettier and ESLint on staged files, so a commit
that fails linting will not complete.

**Before opening a PR**, run the checks below locally; describe *why* the change
is needed and call out anything that alters behaviour for existing clients.

```bash
pnpm lint
pnpm build
```

## License

MIT — see [LICENSE.md](LICENSE.md).
