This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
pnpm dev
```

`pnpm dev` uses **`next dev --webpack`**. Next.js 16 defaults to Turbopack for `next dev`; in this monorepo setup, Turbopack has been observed to **stall on “Compiling / …”** (high CPU, never finishing, and can overwhelm the IDE). Webpack dev avoids that. If you want to try Turbopack anyway:

```bash
pnpm dev:turbo
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

## End-to-end tests (Playwright)

From the monorepo root (after installing dependencies):

```bash
pnpm --filter demo test:e2e:install   # one-time: download Chromium
pnpm test:e2e                         # starts dev server and runs e2e/
```

Or from `packages/demo`: `pnpm test:e2e` / `pnpm test:e2e:ui`.

By default Playwright runs **`next build` + `next start`** on **127.0.0.1:3333** (override with `E2E_PORT`). That avoids Next’s single-dev-server lock if you already run `next dev` in this app. For a faster loop with no other dev server: `E2E_USE_DEV=1 pnpm test:e2e`.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
