This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.


## Running e2e tests (Playwright) 🔧

1. Install dev dependencies and Playwright browsers:

   ```bash
   cd frontend
   npm install
   npx playwright install
   ```

2. Start the frontend dev server (and backend if needed) on the expected ports. By default the Playwright base URL is `http://localhost:3001`. You can override with `PLAYWRIGHT_BASE_URL`.

   ```bash
   npm run dev
   # in another terminal
   npm run test:e2e
   ```

3. The e2e test `tests/e2e/ea-export.spec.ts` navigates to `/ea`, clicks the `Exporter Excel` button and verifies a download is triggered.


## Updating Next (fix source map warnings) ⚠️

If you see the `Invalid source map` warning during dev server startup, it may be fixed by installing the latest patch of `next`. To upgrade the patch for `next` run:

```bash
cd frontend
npm install next@latest
```

If issues persist, let me know and I can try to identify the specific package causing the non-conformant source map and update or pin it.


This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
