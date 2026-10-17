# news_proj_frontend

React (Vite) frontend for the News Management and Online Publishing System.

1. Copy `.env.example` to `.env.local` and set `VITE_API_URL` if the backend is not on `http://localhost:8080`.
2. `npm install`
3. `npm run dev` / `npm run build` / `npm run lint`

Rule: pages and hooks call functions in `src/services` only, never axios directly.
