# Deployment Guide — Ask Dreeso Memory

This document covers deployment to **Vercel**, environment variable configuration, build settings, SPA rewrite rules, CI/CD integration with GitHub, and common troubleshooting steps.

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Build Configuration](#build-configuration)
3. [Environment Variables](#environment-variables)
4. [Vercel Deployment](#vercel-deployment)
   - [Via Vercel Dashboard](#via-vercel-dashboard)
   - [Via Vercel CLI](#via-vercel-cli)
5. [SPA Rewrite Configuration](#spa-rewrite-configuration)
6. [CI/CD with GitHub](#cicd-with-github)
7. [Manual Deployment](#manual-deployment)
8. [Troubleshooting](#troubleshooting)

---

## Prerequisites

- **Node.js** >= 18.x
- **npm** >= 9.x (or compatible package manager)
- A **Vercel** account at [vercel.com](https://vercel.com)
- A **GitHub** repository containing the project source code
- (Optional) Vercel CLI installed globally: `npm i -g vercel`

---

## Build Configuration

The project uses **Vite 5** as the build tool with the React plugin.

### Build Command

```
npm run build
```

### Output Directory

```
dist/
```

### Key Build Files

| File               | Purpose                                              |
| ------------------ | ---------------------------------------------------- |
| `vite.config.js`   | Vite configuration with React plugin and `@` alias   |
| `tailwind.config.js` | Tailwind CSS theme, colors, animations, and plugins |
| `postcss.config.js`  | PostCSS with Tailwind CSS and Autoprefixer          |
| `index.html`       | Entry HTML file (Vite injects built assets here)     |
| `vercel.json`      | Vercel-specific deployment configuration             |

### Build Output

Running `npm run build` produces a static site in the `dist/` directory:

```
dist/
├── index.html
├── assets/
│   ├── index-[hash].js
│   └── index-[hash].css
└── vite.svg
```

### Local Preview

After building, preview the production build locally:

```
npm run preview
```

This starts a local server at `http://localhost:4173` serving the `dist/` directory.

---

## Environment Variables

The application uses Vite environment variables prefixed with `VITE_`.

### Required Variables

| Variable            | Description                          | Default Value        |
| ------------------- | ------------------------------------ | -------------------- |
| `VITE_APP_TITLE`    | Application title displayed in the UI | `Ask Dreeso Memory` |
| `VITE_APP_VERSION`  | Application version string           | `1.0.0`              |

### Setting Up Locally

1. Copy the example environment file:

```
cp .env.example .env
```

2. Edit `.env` and set the values:

```
VITE_APP_TITLE=Ask Dreeso Memory
VITE_APP_VERSION=1.0.0
```

### Setting Up on Vercel

Environment variables are configured in the Vercel dashboard:

1. Navigate to your project in the Vercel dashboard.
2. Go to **Settings** → **Environment Variables**.
3. Add each variable:
   - **Name**: `VITE_APP_TITLE`
   - **Value**: `Ask Dreeso Memory`
   - **Environments**: Select Production, Preview, and Development as needed.
4. Repeat for `VITE_APP_VERSION`.

> **Note**: Vite embeds environment variables at build time. Changes to environment variables require a new deployment (rebuild) to take effect.

### Accessing in Code

Environment variables are accessed via `import.meta.env`:

```js
const title = import.meta.env.VITE_APP_TITLE || 'Ask Dreeso Memory';
const version = import.meta.env.VITE_APP_VERSION || '1.0.0';
```

These are referenced in `src/utils/constants.js`:

```js
export const APP_TITLE = import.meta.env.VITE_APP_TITLE || 'Ask Dreeso Memory';
export const APP_VERSION = import.meta.env.VITE_APP_VERSION || '1.0.0';
```

---

## Vercel Deployment

### Via Vercel Dashboard

1. **Import Project**
   - Log in to [vercel.com](https://vercel.com).
   - Click **Add New** → **Project**.
   - Select **Import Git Repository** and choose your GitHub repository.

2. **Configure Project Settings**
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`
   - **Node.js Version**: 18.x (or latest LTS)

3. **Add Environment Variables**
   - Add `VITE_APP_TITLE` and `VITE_APP_VERSION` as described above.

4. **Deploy**
   - Click **Deploy**.
   - Vercel will clone the repository, install dependencies, run the build, and deploy the output.

5. **Verify**
   - Once deployed, visit the provided `.vercel.app` URL.
   - Verify the application loads correctly and all routes work.

### Via Vercel CLI

1. **Install the CLI** (if not already installed):

```
npm i -g vercel
```

2. **Authenticate**:

```
vercel login
```

3. **Deploy from the project root**:

```
vercel
```

4. **Follow the prompts**:
   - Link to an existing project or create a new one.
   - Confirm the detected settings (Vite framework, `dist` output directory).

5. **Deploy to production**:

```
vercel --prod
```

6. **Set environment variables via CLI** (optional):

```
vercel env add VITE_APP_TITLE
vercel env add VITE_APP_VERSION
```

---

## SPA Rewrite Configuration

Ask Dreeso Memory is a single-page application (SPA) using `react-router-dom` with `createBrowserRouter`. All client-side routes must be rewritten to `index.html` so the React router can handle them.

### Vercel Configuration

The `vercel.json` file in the project root handles this:

```json
{
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

This ensures that:

- Direct navigation to `/home`, `/query`, `/action`, or any other route serves `index.html`.
- The React router (`createBrowserRouter`) then matches the URL and renders the correct page component.
- 404 handling is managed by the React router's catch-all `*` route, which renders `NotFoundPage`.

### How It Works

1. A user navigates to `https://your-app.vercel.app/query`.
2. Vercel receives the request for `/query`.
3. The rewrite rule matches `/(.*)`and serves `/index.html`.
4. The browser loads `index.html`, which loads the JavaScript bundle.
5. `react-router-dom` reads the URL `/query` and renders `QueryPage`.

### Important Notes

- Static assets in `dist/assets/` are served directly (Vercel handles this automatically before rewrites).
- The `vite.svg` favicon is served directly from the root.
- The rewrite rule does **not** affect requests for files that physically exist in the `dist/` directory.

---

## CI/CD with GitHub

### Automatic Deployments via Vercel

When your GitHub repository is connected to Vercel:

- **Production deployments** are triggered automatically on every push to the `main` (or `master`) branch.
- **Preview deployments** are triggered automatically on every push to any other branch or on pull request creation.

### Recommended Branch Strategy

| Branch    | Vercel Environment | URL                              |
| --------- | ------------------ | -------------------------------- |
| `main`    | Production         | `your-app.vercel.app`            |
| `develop` | Preview            | `your-app-develop-xxx.vercel.app`|
| Feature   | Preview            | `your-app-feature-xxx.vercel.app`|

### GitHub Actions (Optional)

If you prefer to run tests before deployment, add a GitHub Actions workflow:

Create `.github/workflows/ci.yml`:

```yaml
name: CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  lint-and-test:
    runs-on: ubuntu-latest

    strategy:
      matrix:
        node-version: [18, 20]

    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Setup Node.js ${{ matrix.node-version }}
        uses: actions/setup-node@v4
        with:
          node-version: ${{ matrix.node-version }}
          cache: npm

      - name: Install dependencies
        run: npm ci

      - name: Run linter
        run: npm run lint

      - name: Run tests
        run: npm run test

      - name: Build
        run: npm run build
```

### Vercel GitHub Integration Features

- **Automatic Preview URLs**: Every pull request gets a unique preview deployment URL posted as a comment.
- **Status Checks**: Vercel reports deployment status back to GitHub, visible in the PR checks.
- **Instant Rollbacks**: Roll back to any previous deployment from the Vercel dashboard.
- **Branch Protection**: Combine with GitHub branch protection rules to require passing builds before merge.

### Skipping Deployments

To skip a Vercel deployment for a specific commit, include `[skip ci]` or `[vercel skip]` in the commit message:

```
git commit -m "docs: update README [skip ci]"
```

---

## Manual Deployment

If you need to deploy without Vercel (e.g., to a static hosting provider):

### 1. Build the Project

```
npm install
npm run build
```

### 2. Serve the `dist/` Directory

Upload the contents of `dist/` to any static hosting provider:

- **Netlify**: Drag and drop the `dist/` folder, or configure build settings.
- **AWS S3 + CloudFront**: Upload to an S3 bucket with static website hosting enabled.
- **GitHub Pages**: Use the `gh-pages` package or GitHub Actions to deploy `dist/`.
- **Nginx**: Serve the `dist/` directory with an SPA fallback configuration.

### Nginx SPA Configuration Example

```nginx
server {
    listen 80;
    server_name your-domain.com;
    root /var/www/ask-dreeso-memory/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /assets/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

---

## Troubleshooting

### Build Failures

**Symptom**: `npm run build` fails with errors.

**Solutions**:

1. **Clear node_modules and reinstall**:
   ```
   rm -rf node_modules
   npm install
   npm run build
   ```

2. **Check Node.js version**:
   ```
   node --version
   ```
   Ensure you are running Node.js 18.x or later.

3. **Check for lint errors**:
   ```
   npm run lint
   ```
   Fix any reported issues before building.

4. **Check for test failures**:
   ```
   npm run test
   ```
   Failing tests may indicate broken code that could also cause build issues.

### Blank Page After Deployment

**Symptom**: The deployed site shows a blank white page.

**Solutions**:

1. **Check the browser console** for JavaScript errors (F12 → Console tab).

2. **Verify the SPA rewrite** is configured correctly in `vercel.json`. The file must exist in the project root and contain the rewrite rule.

3. **Verify the build output** contains `index.html` and the `assets/` directory:
   ```
   ls -la dist/
   ```

4. **Check the base path**: If deploying to a subdirectory, you may need to set `base` in `vite.config.js`:
   ```js
   export default defineConfig({
     base: '/your-subdirectory/',
     // ...
   });
   ```

### Routes Return 404

**Symptom**: Direct navigation to `/home` or `/query` returns a 404 error.

**Solutions**:

1. **Verify `vercel.json`** exists in the project root with the correct rewrite rule:
   ```json
   {
     "rewrites": [
       {
         "source": "/(.*)",
         "destination": "/index.html"
       }
     ]
   }
   ```

2. **Redeploy** after adding or modifying `vercel.json` — the file must be present at build time.

3. **For non-Vercel hosts**, ensure the server is configured to serve `index.html` for all routes (see the Nginx example above).

### Environment Variables Not Working

**Symptom**: `APP_TITLE` or `APP_VERSION` shows default values instead of configured values.

**Solutions**:

1. **Verify the variable prefix**: Vite only exposes variables prefixed with `VITE_`. Ensure your variables are named `VITE_APP_TITLE` and `VITE_APP_VERSION`.

2. **Rebuild after changes**: Vite embeds environment variables at build time. After changing variables in the Vercel dashboard, trigger a new deployment.

3. **Check the Vercel environment scope**: Ensure the variables are enabled for the correct environment (Production, Preview, or Development).

4. **Verify locally**: Create a `.env` file and run `npm run dev` to confirm the variables are picked up.

### localStorage Quota Exceeded

**Symptom**: The application throws errors related to localStorage being full.

**Solutions**:

1. **Clear application data** in the browser: DevTools → Application → Storage → Clear site data.

2. **Purge old audit logs**: The audit log retains up to 1000 entries. Use the Audit Log page to purge old entries or clear all logs.

3. **Reset mock data**: If localStorage data becomes corrupted, clear all `dreeso_*` keys:
   ```js
   // Run in browser console
   Object.keys(localStorage)
     .filter(key => key.startsWith('dreeso_'))
     .forEach(key => localStorage.removeItem(key));
   location.reload();
   ```

### Styles Not Loading

**Symptom**: The page loads but appears unstyled or with broken layout.

**Solutions**:

1. **Verify Tailwind CSS** is processing correctly by checking that `dist/assets/` contains a CSS file.

2. **Check `postcss.config.js`** exists and includes both `tailwindcss` and `autoprefixer`.

3. **Check `tailwind.config.js`** content paths include all source files:
   ```js
   content: [
     "./index.html",
     "./src/**/*.{js,jsx}",
   ],
   ```

4. **Verify `src/index.css`** contains the Tailwind directives:
   ```css
   @tailwind base;
   @tailwind components;
   @tailwind utilities;
   ```

### Deployment Hangs or Times Out

**Symptom**: Vercel deployment takes too long or times out.

**Solutions**:

1. **Check build logs** in the Vercel dashboard for the specific error or step that is slow.

2. **Ensure `npm install`** is not downloading unnecessary packages. Review `package.json` for unused dependencies.

3. **Check for infinite loops** in build-time code (e.g., Vite plugins or PostCSS configurations).

4. **Increase the build timeout** in Vercel project settings if the build is legitimately large.

### Tests Failing in CI

**Symptom**: Tests pass locally but fail in CI/CD.

**Solutions**:

1. **Ensure the test environment matches**: CI should use the same Node.js version as local development.

2. **Check for timing-sensitive tests**: Tests using `setTimeout` or `waitFor` may need longer timeouts in CI.

3. **Verify localStorage mock**: The test setup (`vitest.setup.js`) provides a localStorage mock. Ensure it is referenced in `vitest.config.js`:
   ```js
   test: {
     setupFiles: ['./src/test/setup.js'],
   }
   ```

4. **Run tests locally with the same command**:
   ```
   npm run test
   ```

---

## Quick Reference

| Task                        | Command              |
| --------------------------- | -------------------- |
| Install dependencies        | `npm install`        |
| Start development server    | `npm run dev`        |
| Run linter                  | `npm run lint`       |
| Run tests                   | `npm run test`       |
| Run tests in watch mode     | `npm run test:watch` |
| Build for production        | `npm run build`      |
| Preview production build    | `npm run preview`    |
| Deploy to Vercel (preview)  | `vercel`             |
| Deploy to Vercel (production) | `vercel --prod`    |

---

## Support

For issues related to:

- **Vercel deployment**: Check the [Vercel documentation](https://vercel.com/docs) or [Vercel community](https://github.com/vercel/vercel/discussions).
- **Vite build**: Check the [Vite documentation](https://vitejs.dev/guide/).
- **Tailwind CSS**: Check the [Tailwind CSS documentation](https://tailwindcss.com/docs).
- **React Router**: Check the [React Router documentation](https://reactrouter.com/en/main).