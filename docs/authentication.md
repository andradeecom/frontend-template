# Authentication

The browser holds exactly one thing — an httpOnly session cookie set by the
backend. **Nothing in this app reads it**, and no credential is ever exposed to
client JavaScript.

That rules out a common pattern: storing an access token in `localStorage` or a
readable cookie. Anything JavaScript can read, injected script can exfiltrate,
and a stolen token then works from the attacker's own machine.

How it holds together:

- **Login is a Server Action** (`src/actions/auth.ts`), not a client `fetch`. The
  request runs on the Next.js server, which relays the backend's `Set-Cookie`
  verbatim so `HttpOnly`/`Secure`/`SameSite` are defined in one place.
- **Google's code exchange** goes through a route handler
  (`src/app/api/auth/google/exchange/route.ts`) for the same reason.
- **`src/lib/api/api.ts` is the BFF hop.** Requests originate server-side, carry
  the session cookie upstream, echo the CSRF token in `X-CSRF-Token`, and return
  only data.
- **Identity comes from `getAuthUser()`**, which asks the backend. Role drives
  authorization, and a value the browser could edit is not a safe basis for it.
- **A 401 means the session row is gone** — there is no token to refresh. Cookies
  cannot be mutated during an RSC render, so deletion is delegated to
  `/api/auth/force-logout` before redirecting to login.
- **The middleware only checks whether the cookie is _present_** (`src/proxy.ts`).
  That is a redirect hint, not authorization: the cookie is opaque and only the
  backend can judge it.

> When adding a server-side call to the API, keep the CSRF header and the
> unreachable-API catch — a mutation without the header gets a `403`, and a bare
> `fetch failed` otherwise surfaces as an opaque 500.
