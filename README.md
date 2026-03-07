# usePromptify

usePromptify is the working repo and cloud workspace for the Promptify product. The app is a Next.js 16 App Router web app that converts rough or under-specified prompt ideas into structured, high-quality prompts for AI systems.

The app works in guest mode without any external API key using a deterministic prompt-engine, and it can also run with real accounts, Stripe billing, and a low-cost managed provider lane.

## Stack

- Next.js (App Router)
- TypeScript
- Tailwind CSS
- shadcn-style shared UI components
- React Hook Form + Zod
- SQLite-backed accounts and synced prompt storage
- Stripe checkout + billing portal + webhook support
- ESLint + TypeScript strictness for production-safe code

## Features Included

- Polished SaaS landing page
  - Hero, CTA, feature grid, social-proof placeholders, use-case examples, FAQ, pricing section
- Workspace (`/workspace`)
  - Raw prompt and goal inputs
  - Target model/use-case/tone/output format/detail controls
  - Optional context/constraints/examples toggles
  - Template preset application
  - Deterministic refine engine
  - Managed provider path gated to Pro accounts when server keys are configured
  - BYOK provider access for users who want session-only keys
  - Multiple variants: improved, concise, detailed, variant A/B, model-specific
  - Compare view vs original with rationale summary
  - Copy and export as `.txt`/`.md`
- Accounts (`/account`)
  - Email/password signup and login
  - Session cookies
  - Synced saved prompts and history
  - Stripe billing entry point for Pro
- Templates (`/templates`)
  - Multiple seeded presets across writing, coding, marketing, images, and agents
  - Per-template detail pages
- Saved prompts and history
  - `/saved`: rename, duplicate, delete, favorite, copy
  - `/history`: restore previous generations
- SEO-ready
  - Metadata + canonical + OG/Twitter cards via `layout.tsx`
  - `robots.txt`
  - `sitemap.xml` (includes template routes)
- Basic legal/product pages
  - `/about`, `/faq`, `/contact`, `/privacy`, `/terms`, `/changelog`

## Project structure

- `src/app/` – routes, metadata, route handlers, and generated social cards
- `src/components/marketing` – landing page and pricing surfaces
- `src/components/workspace` – workspace and prompt workflow components
- `src/components/navigation` – header/footer
- `src/components/account` – auth and billing UI
- `src/components/branding` – Promptify brand assets
- `src/components/ui` – reusable UI primitives
- `src/lib/auth` – account and session helpers
- `src/lib/billing` – Stripe helpers
- `src/lib/db.ts` – SQLite connection and schema bootstrap
- `src/lib/prompt-engine` – deterministic prompt refinement and provider adapters
- `src/lib/storage` – guest-mode local storage + client store orchestration
- `src/lib/prompt-store` – account-backed saved/history persistence
- `src/components/seo` – JSON-LD helper
- `src/data/` – constants, presets, and guide content
- `src/types/` – shared application types

## Local development

```bash
cd /path/to/usepromptify
npm install
npm run dev
```

Then open `http://localhost:3000`.

## Cloud workspace

The repo is prepared for GitHub Codespaces so you can continue work from another computer without rebuilding the environment by hand.

```bash
gh auth refresh -h github.com -s codespace
gh codespace create -R Mikes-hub-va/usepromptify -b codex/usepromptify-cloud-ready --default-permissions --display-name "usePromptify" --idle-timeout 4h --retention-period 72h --devcontainer-path .devcontainer/devcontainer.json
```

After the codespace is created:

```bash
gh codespace code -R Mikes-hub-va/usepromptify -w
```

## Build and quality checks

```bash
npm run lint
npm run build
```

Both are expected to pass before release. The production build is intentionally pinned to webpack right now because Turbopack builds were producing an unstable `next start` runtime for this app.

## Environment variables

Promptify runs in guest local mode with no provider key. Copy `.env.example` to `.env.local` when you want to wire accounts, billing, and hosted providers.

- `PROMPTIFY_DATABASE_PATH` (optional): SQLite file path (default `./data/promptify.sqlite`).
- `PROMPTIFY_OWNER_EMAILS` (optional): comma-separated owner emails allowed to open `/ops`.
- `PROMPTIFY_ENABLE_MANAGED_RUNTIME_NON_PRODUCTION` (optional): set to `true` only when you intentionally want managed AI enabled on preview or staging.
- `OPENAI_API_KEY` (optional): enables the managed OpenAI-compatible generation lane.
- `OPENAI_API_BASE_URL` (optional): set this to an OpenAI-compatible host such as OpenRouter.
- `OPENAI_PROVIDER_LABEL` (optional): label the managed OpenAI-compatible lane in the product UI.
- `OPENAI_SITE_URL` / `OPENAI_APP_NAME` (optional): attribution headers for OpenRouter.
- `ANTHROPIC_API_KEY` (optional): enables Anthropic-backed generation.
- `GEMINI_API_KEY` (optional): enables Gemini-backed generation.
- `OPENAI_PROMPT_MODEL` (optional): default OpenAI-compatible model selector (default `openai/gpt-oss-20b`).
- `NEXT_PUBLIC_PROMPTIFY_VERSION` (optional): version shown in the UI footer.
- `NEXT_PUBLIC_PROMPTIFY_ENGINE_MODE` (optional): `"auto" | "heuristic" | "provider"`
  - `auto` prefers hosted generation when a compatible provider key is available for the current user, otherwise falls back to heuristic.
  - `heuristic` forces deterministic local mode.
  - `provider` prefers AI mode.
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` (optional): Stripe publishable key for billing surfaces.
- `STRIPE_SECRET_KEY`: required for real checkout sessions.
- `STRIPE_PRICE_PRO_MONTHLY`: Stripe price ID for the Pro subscription.
- `STRIPE_WEBHOOK_SECRET`: required for Stripe webhook verification.

Session-entered provider keys from the workspace are never persisted; they are only forwarded for the active run.

## Provider architecture

The engine uses a real backend generation path:

1. Client submits settings to `POST /api/promptify/generate`.
2. Server route resolves provider mode using a session key or a managed provider key.
3. Managed provider usage is gated to Pro accounts. Free users still get local mode and BYOK.
4. If enabled and healthy, requests are sent to OpenAI, Anthropic, or Gemini and returned as structured `PromptOutput`.
4. On error or absent keys, the deterministic fallback in `lib/prompt-engine/heuristic.ts` is used.

The provider abstraction in `lib/prompt-engine/provider.ts` routes to the matching provider adapter when keys are available.

## Pricing structure

Pricing is intentionally simple and launch-practical:

- Starter: `$0`, guest/local mode, account sync, and BYOK access.
- Promptify Pro: `$12/month`, Stripe-billed, managed low-cost OpenRouter runs, and unlimited BYOK.
- Studio: contact-led onboarding for collaborative rollout.

The product is designed so the free tier is genuinely useful, Pro stays affordable by using a low-cost managed model, and team pricing only appears when governance features are ready.

## Storage model

Prompt persistence now supports two modes:

- Guest mode: browser localStorage
- Signed-in mode: SQLite-backed storage scoped to the user account
- `/saved` stores polished prompts as `SavedPrompt`
- `/history` stores recent generations

## Route map

- `/` landing page
- `/workspace` prompt builder and output experience
- `/templates` presets index
- `/templates/[slug]` preset details
- `/saved` saved draft manager
- `/history` recent generations
- `/pricing`, `/account`, `/about`, `/faq`, `/contact`, `/privacy`, `/terms`, `/changelog`

## Deployment

Promptify uses SQLite for real accounts and synced prompt storage. That means production deployment needs a runtime with a persistent filesystem, or a swap to a hosted database before going live on serverless infrastructure.

```bash
# from repo root
npm install
npm run build
```

Before publish:

- Set the env vars from `.env.example`
- Provision a persistent disk for `PROMPTIFY_DATABASE_PATH`, or replace SQLite with a hosted database
- Configure Stripe webhook delivery to `/api/stripe/webhook`
- Set any provider keys you want available for managed Pro runs

## Release lanes

Promptify now has a clear release path:

- Production: `https://usepromptify.org`
- Staging: `https://staging.usepromptify.org`
- Preview: disposable Vercel preview deployments for branch work
- Local: `http://localhost:3000`

Recommended flow:

1. Build on a feature branch and verify the Vercel preview deployment.
2. Promote the release candidate to staging for QA.
3. Merge to `main` only after staging passes.
4. Let Production stay mapped to `usepromptify.org`.

Helper commands:

```bash
npm run deploy:preview
npm run deploy:staging
npm run deploy:prod
```

The signed-in owner dashboard lives at `/ops` and mirrors the current release notes, review findings, and owner action items in one place. Set `PROMPTIFY_OWNER_EMAILS` so that page stays limited to owner accounts.

### Vercel note

Vercel is fine for project setup and preview deployment, but it is not the right production backing store for the current SQLite implementation.

- Preview deploys can run with `PROMPTIFY_DATABASE_PATH=/tmp/promptify.sqlite`
- Production should move accounts, sessions, saved prompts, and billing state to a hosted database before pointing `usepromptify.org` at the app

## Launch checklist

- Run `npm run lint`
- Run `npm run build`
- Set production env vars from `.env.example`
- Verify `/`, `/workspace`, `/account`, `/pricing`, `/saved`, and `/history` in a browser
- Confirm the production domain is `https://usepromptify.org`
- Confirm `hello@usepromptify.org` or your chosen launch inbox is monitored

## Updating branding or adding templates

- Brand/copy: edit `src/app/layout.tsx`, `src/components/navigation/site-nav.tsx`, and landing components under `src/components/marketing`.
- Add new presets: edit `src/data/presets.ts` with the same `TemplatePreset` shape.
- Add new pages: create folders/files under `src/app/` with matching metadata and content blocks.

## Notes

- This repository now includes real accounts, real billing plumbing, and a real provider architecture. If you keep SQLite, deploy it somewhere with persistent storage.
