<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Auth

Auth is an **opaque, server-backed session**, not a JWT — and the browser never
holds anything readable by JavaScript.

- The only credential is an httpOnly session cookie set by the backend
  (`__Host-session` in production; plain `session` in development, since the
  `__Host-` prefix requires HTTPS). See `src/lib/api/session.ts`.
- **Never** write auth state with `document.cookie` or `localStorage`. Anything
  JS can read, injected script can exfiltrate — that is the whole reason this
  template stopped storing an access token client-side.
- Login is a Server Action (`login` in `src/actions/auth.ts`), not a client
  fetch: the request runs on the Next.js server, which relays the backend's
  `Set-Cookie` verbatim via `forwardSessionCookies()`. Google's code exchange
  goes through `src/app/api/auth/google/exchange/route.ts` for the same reason.
- `src/lib/api/api.ts` is the BFF hop: it forwards the session cookie
  server-to-server and returns only data. On 401 there is nothing to refresh —
  the session row is gone — so it delegates cookie deletion to
  `/api/auth/force-logout` (cookies cannot be mutated during an RSC render) and
  redirects to login.
- Identity comes from `getAuthUser()`, which asks the backend. Do not
  reintroduce a `user_data` cookie: role drives authorization, and a value the
  browser can edit is not a safe basis for it.
- Mutations must carry the CSRF token: `src/lib/api/api.ts` reads the readable
  `csrf_token` cookie and echoes it in the `X-CSRF-Token` header. The backend
  rejects a state-changing request whose header and cookie do not match, so a
  new call path that skips this will 403.
- `/auth/me` returns the user object **directly**, unlike the `/users` routes
  which wrap theirs in `{ statusCode, message, data }`. Do not reach for
  `.data` on it.
- When the API is unreachable, `src/lib/api/api.ts` throws an `ApiError` naming
  the URL it could not reach instead of letting Node's bare "fetch failed"
  become an opaque 500. Keep that catch on any new server-side `fetch` to the
  API — a stopped backend is the most common cause in development.
- The middleware (`src/proxy.ts`) only checks whether the cookie is *present*.
  That is a redirect hint, never an authorization decision — the cookie is
  opaque and only the backend can validate it.
