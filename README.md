# Ask Dreeso Memory

Enterprise knowledge and memory assistant — connecting insights across your entire project ecosystem.

---

## Table of Contents

1. [Overview](#overview)
2. [Tech Stack](#tech-stack)
3. [Getting Started](#getting-started)
4. [Available Scripts](#available-scripts)
5. [Folder Structure](#folder-structure)
6. [Personas](#personas)
7. [20-Screen Prototype Flow](#20-screen-prototype-flow)
8. [Keyboard Shortcuts](#keyboard-shortcuts)
9. [Connected Enterprise Systems](#connected-enterprise-systems)
10. [Mock Data Structure](#mock-data-structure)
11. [Architecture](#architecture)
12. [Deployment](#deployment)
13. [Troubleshooting](#troubleshooting)
14. [License](#license)

---

## Overview

Ask Dreeso Memory is a 20-screen interactive prototype demonstrating an enterprise knowledge and memory assistant for the construction and engineering industry. The application showcases persona-based intelligence, cross-domain query processing, action execution with real-time propagation across connected enterprise systems, and full audit trail transparency.

Key capabilities:

- **4 Persona Roles** — Project Director, Senior Quantity Surveyor, Project Manager, Sales Director
- **24 Intelligence Clusters** — 6 per persona covering management, finance, risk, reporting, workforce, compliance, procurement, schedule, analysis, and sales
- **22 Pre-built Query/Response Pairs** — Rich structured responses with data tables, charts, source system attribution, and CTA follow-up bubbles
- **18 Executable Actions** — Cross-domain actions with confirmation dialogs, propagation chains, and persona notifications
- **10 Connected Enterprise Systems** — Procore, SAP MM, SAP FI, Navisworks, Primavera P6, Salesforce, Workday, Vendor Compliance DB, ESG Registry, Amsterdam Authority Portal
- **18 Propagation Rules** — Multi-system update chains with latency estimates, confidence scores, and rollback indicators
- **Full Audit Trail** — Every query, action, and propagation event logged with timestamps and persona context

---

## Tech Stack

| Technology | Version | Purpose |
| --- | --- | --- |
| [React](https://react.dev/) | 18.3+ | UI component library |
| [Vite](https://vitejs.dev/) | 5.4+ | Build tool and dev server |
| [Tailwind CSS](https://tailwindcss.com/) | 3.4+ | Utility-first CSS framework |
| [React Router](https://reactrouter.com/) | 6.26+ | Client-side routing (SPA) |
| [Vitest](https://vitest.dev/) | 2.1+ | Unit and integration testing |
| [Testing Library](https://testing-library.com/) | 16.0+ | React component testing |
| localStorage | Built-in | Client-side data persistence |

No backend server is required. All data is stored in the browser's localStorage using static JSON datasets loaded on first use.

---

## Getting Started

### Prerequisites

- **Node.js** >= 18.x
- **npm** >= 9.x (or compatible package manager)

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd ask-dreeso-memory

# Install dependencies
npm install

# Copy environment variables (optional)
cp .env.example .env
```

### Development Server

```bash
npm run dev
```

Opens the application at [http://localhost:5173](http://localhost:5173) with hot module replacement.

### Production Build

```bash
npm run build
```

Outputs optimized static files to the `dist/` directory.

### Preview Production Build

```bash
npm run preview
```

Serves the production build locally at [http://localhost:4173](http://localhost:4173).

---

## Available Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the Vite development server with HMR |
| `npm run build` | Build for production (output to `dist/`) |
| `npm run preview` | Preview the production build locally |
| `npm run test` | Run all tests once with Vitest |
| `npm run test:watch` | Run tests in watch mode |
| `npm run lint` | Run ESLint across all `.js` and `.jsx` files |

---

## Folder Structure

```
ask-dreeso-memory/
├── index.html                    # Entry HTML file
├── package.json                  # Dependencies and scripts
├── vite.config.js                # Vite build configuration
├── vitest.config.js              # Vitest test configuration
├── tailwind.config.js            # Tailwind CSS theme and plugins
├── postcss.config.js             # PostCSS with Tailwind and Autoprefixer
├── .eslintrc.cjs                 # ESLint configuration
├── vercel.json                   # Vercel SPA rewrite rules
├── .env.example                  # Environment variable template
├── CHANGELOG.md                  # Version history
├── DEPLOYMENT.md                 # Deployment guide
├── README.md                     # This file
│
├── public/
│   └── vite.svg                  # Favicon
│
└── src/
    ├── main.jsx                  # React entry point
    ├── App.jsx                   # Root component with AppProvider + RouterProvider
    ├── router.jsx                # Route definitions (createBrowserRouter)
    ├── index.css                 # Tailwind directives and global styles
    │
    ├── components/
    │   ├── actions/
    │   │   ├── ActionConfirmation.jsx   # Action confirmation modal
    │   │   ├── ActionPanel.jsx          # Available actions grid
    │   │   └── PropagationFeed.jsx      # Cross-domain propagation feed
    │   │
    │   ├── auth/
    │   │   ├── LoginForm.jsx            # Email/password login form
    │   │   ├── PersonaSelector.jsx      # Quick-start persona cards
    │   │   ├── ProtectedRoute.jsx       # Auth route guard
    │   │   └── SignupForm.jsx           # Account creation form
    │   │
    │   ├── clusters/
    │   │   ├── ClusterGrid.jsx          # Responsive cluster grid
    │   │   ├── ClusterGrid.test.jsx     # ClusterGrid integration tests
    │   │   └── IntelligenceCluster.jsx  # Single cluster card
    │   │
    │   ├── common/
    │   │   ├── Avatar.jsx               # Persona avatar with initials
    │   │   ├── DataTable.jsx            # Responsive data table
    │   │   ├── GlassCard.jsx            # Glassmorphism card component
    │   │   ├── Notification.jsx         # Toast notification system
    │   │   └── SkeletonLoader.jsx       # Shimmer loading placeholders
    │   │
    │   ├── layout/
    │   │   ├── Layout.jsx               # Main layout with Navbar + QueryBar
    │   │   └── Navbar.jsx               # Global navigation bar
    │   │
    │   └── query/
    │       ├── CTABubbles.jsx           # Follow-up query bubbles
    │       ├── QueryBar.jsx             # Persistent query input bar
    │       ├── QueryBar.test.jsx        # QueryBar integration tests
    │       ├── QueryResponse.jsx        # Structured response display
    │       └── SourcePanel.jsx          # Source system transparency panel
    │
    ├── contexts/
    │   ├── AppContext.jsx               # Root context (screen flow, notifications)
    │   ├── AuthContext.jsx              # Authentication state
    │   ├── AuthContext.test.jsx         # AuthContext unit tests
    │   └── PersonaContext.jsx           # Persona state and data loading
    │
    ├── data/
    │   ├── actions.json                 # 18 executable actions
    │   ├── autosuggest.json             # 80 autosuggest entries (20 per persona)
    │   ├── clusters.json                # 24 intelligence clusters
    │   ├── personas.json                # 4 persona definitions
    │   ├── propagation.json             # 18 propagation rules
    │   ├── queries.json                 # 22 query/response pairs
    │   ├── screenFlow.json              # 20-screen flow definitions
    │   ├── systems.json                 # 10 connected systems
    │   └── users.json                   # 4 demo user accounts
    │
    ├── hooks/
    │   ├── useAuditLog.js               # Audit log React hook
    │   ├── useKeyboardControls.js       # Global keyboard shortcuts
    │   └── useQueryEngine.js            # Query processing hook
    │
    ├── pages/
    │   ├── ActionPage.jsx               # Action execution page
    │   ├── AuditLogPage.jsx             # Filterable audit log table
    │   ├── CrossDomainPage.jsx          # Cross-domain system map
    │   ├── HomePage.jsx                 # Persona dashboard
    │   ├── LoginPage.jsx                # Login / persona selection
    │   ├── NotFoundPage.jsx             # 404 error page
    │   ├── OnboardingPage.jsx           # 4-step onboarding walkthrough
    │   ├── PersonaSwitchPage.jsx        # Mid-session persona switch
    │   ├── QueryPage.jsx                # Query results page
    │   ├── SignupPage.jsx               # Account creation page
    │   └── SummaryPage.jsx              # Session summary page
    │
    ├── services/
    │   ├── actionExecutor.js            # Action validation and execution
    │   ├── actionExecutor.test.js       # ActionExecutor unit tests
    │   ├── auditLogger.js               # Structured audit logging
    │   ├── crossDomainPropagator.js     # Cross-domain propagation engine
    │   ├── crossDomainPropagator.test.js # Propagator unit tests
    │   ├── ctaFactory.js                # CTA bubble generation
    │   ├── dataManager.js               # CRUD operations for mock data
    │   ├── dataManager.test.js          # DataManager unit tests
    │   ├── queryEngine.js               # Query matching and processing
    │   └── queryEngine.test.js          # QueryEngine unit tests
    │
    ├── test/
    │   └── setup.js                     # Vitest setup (jest-dom, localStorage mock)
    │
    └── utils/
        ├── constants.js                 # App-wide constants and IDs
        └── storage.js                   # localStorage abstraction
```

---

## Personas

The application features four demo personas, each with unique intelligence clusters, actions, permissions, and query scopes.

### Lukas Müller — Project Director

- **Color Theme:** `#3bcd7e` (Green)
- **Focus Areas:** Portfolio strategy, budget control, risk management, executive reporting, workforce oversight, compliance & governance
- **Permissions:** View all projects, manage projects, approve budgets, view reports, manage team, access intelligence
- **Demo Email:** `lukas.muller@dreeso.com`
- **Password:** `demo1234`

### Elena Rossi — Senior Quantity Surveyor

- **Color Theme:** `#276ef1` (Blue)
- **Focus Areas:** Cost analysis, budget monitoring, procurement intelligence, valuation tracking, quantity benchmarking, subcontractor costs
- **Permissions:** View all projects, manage costs, view reports, submit valuations, access intelligence, manage quantities
- **Demo Email:** `elena.rossi@dreeso.com`
- **Password:** `demo1234`

### Sophie Dubois — Project Manager

- **Color Theme:** `#ffc043` (Amber)
- **Focus Areas:** Schedule management, schedule risk analysis, resource allocation, progress tracking, stakeholder communications, quality control
- **Permissions:** View assigned projects, manage tasks, view reports, manage schedule, access intelligence, manage team
- **Demo Email:** `sophie.dubois@dreeso.com`
- **Password:** `demo1234`

### James Carter — Sales Director

- **Color Theme:** `#e11900` (Red)
- **Focus Areas:** Sales pipeline, client insights, market intelligence, proposal tracking, revenue forecasting, partnership development
- **Permissions:** View pipeline, manage proposals, view reports, access intelligence, manage clients, view market data
- **Demo Email:** `james.carter@dreeso.com`
- **Password:** `demo1234`

---

## 20-Screen Prototype Flow

| # | Screen ID | Title | Persona |
| --- | --- | --- | --- |
| 1 | `screen-welcome` | Welcome & System Overview | — |
| 2 | `screen-persona-selection` | Persona Selection | — |
| 3 | `screen-lukas-dashboard` | Lukas — Project Director Dashboard | Lukas |
| 4 | `screen-lukas-query` | Lukas — Strategic Query & Response | Lukas |
| 5 | `screen-lukas-action` | Lukas — Cross-Domain Action & Propagation | Lukas |
| 6 | `screen-elena-dashboard` | Elena — Senior QS Dashboard | Elena |
| 7 | `screen-elena-query` | Elena — Cost Analysis Query & Response | Elena |
| 8 | `screen-elena-followup` | Elena — Follow-Up Query & Procurement | Elena |
| 9 | `screen-elena-action` | Elena — Budget Update Action & Propagation | Elena |
| 10 | `screen-sophie-dashboard` | Sophie — Project Manager Dashboard | Sophie |
| 11 | `screen-sophie-query` | Sophie — Schedule & Milestone Query | Sophie |
| 12 | `screen-sophie-resource` | Sophie — Resource Conflict Resolution | Sophie |
| 13 | `screen-sophie-action` | Sophie — Task Reassignment & Propagation | Sophie |
| 14 | `screen-james-dashboard` | James — Sales Director Dashboard | James |
| 15 | `screen-james-query` | James — Pipeline & Client Health Query | James |
| 16 | `screen-james-market` | James — Market Intelligence & Competitors | James |
| 17 | `screen-james-action` | James — Proposal Submission & Propagation | James |
| 18 | `screen-cross-domain-overview` | Cross-Domain System Map | — |
| 19 | `screen-memory-showcase` | Memory & Context Showcase | — |
| 20 | `screen-closing` | Closing & Call to Action | — |

Navigate between screens using the keyboard shortcuts below or the navigation bar.

---

## Keyboard Shortcuts

### Global Shortcuts

| Key | Action |
| --- | --- |
| `F` | Advance to the next screen in the flow |
| `Space` | Trigger render response (context-dependent) |
| `N` | Switch to the next persona |
| `R` | Restart the flow from the beginning |
| `L` | Log out the current user |

### Navigation Shortcuts

| Key | Action |
| --- | --- |
| `→` (ArrowRight) | Next screen |
| `←` (ArrowLeft) | Previous screen |
| `Home` | Go to the first screen |
| `Escape` | Clear notifications / close dropdowns |

### Persona Selection Shortcuts

| Key | Action |
| --- | --- |
| `1` | Select Lukas Müller |
| `2` | Select Elena Rossi |
| `3` | Select Sophie Dubois |
| `4` | Select James Carter |

### Query Bar Shortcuts

| Key | Action |
| --- | --- |
| `↓` (ArrowDown) | Navigate down in autosuggest dropdown |
| `↑` (ArrowUp) | Navigate up in autosuggest dropdown |
| `Enter` | Submit query or select highlighted suggestion |
| `Escape` | Close autosuggest dropdown |

> **Note:** Keyboard shortcuts are disabled when focus is inside an `<input>`, `<textarea>`, or `<select>` element to prevent conflicts with text entry.

---

## Connected Enterprise Systems

| System | Short Name | Color | Description |
| --- | --- | --- | --- |
| Procore | Procore | `#F47E20` | Construction project management, field coordination, document control |
| SAP Material Management | SAP MM | `#0070F2` | Procurement, inventory management, goods receipt |
| SAP Financial Accounting | SAP FI | `#0053B8` | General ledger, accounts payable/receivable, financial reporting |
| Autodesk Navisworks | Navisworks | `#1CA54C` | BIM coordination, clash detection, 3D model review |
| Oracle Primavera P6 | Primavera P6 | `#C74634` | Project scheduling, critical path analysis, resource planning |
| Salesforce CRM | Salesforce | `#00A1E0` | Sales pipeline, client engagement, opportunity management |
| Workday HCM | Workday | `#F68D2E` | Workforce planning, talent management, resource allocation |
| Vendor Compliance Database | Vendor Compliance DB | `#7B61FF` | Supplier certifications, audit records, regulatory adherence |
| ESG Registry | ESG Registry | `#34A853` | Sustainability metrics, carbon tracking, ESG reporting |
| Amsterdam Authority Portal | Amsterdam Authority | `#E4003A` | Permit applications, regulatory submissions, government compliance |

---

## Mock Data Structure

All mock data is stored as static JSON files in `src/data/` and loaded into localStorage on first use via the `DataManager` service. The schema version is `1.0.0`.

### Data Entities

| Entity | File | Records | Description |
| --- | --- | --- | --- |
| `personas` | `personas.json` | 4 | Persona definitions with roles, permissions, and color themes |
| `users` | `users.json` | 4 | Demo user accounts with email, password, and persona mapping |
| `clusters` | `clusters.json` | 24 | Intelligence clusters (6 per persona) with query templates |
| `queries` | `queries.json` | 22 | Pre-built query/response pairs with data tables and charts |
| `actions` | `actions.json` | 18 | Executable actions with cross-domain effects and permissions |
| `propagation` | `propagation.json` | 18 | Propagation rules with chain steps and notification messages |
| `autosuggest` | `autosuggest.json` | 80 | Autosuggest entries (20 per persona) sorted by relevance |
| `systems` | `systems.json` | 10 | Connected enterprise system definitions |
| `screenFlow` | `screenFlow.json` | 20 | Screen flow definitions with navigation and keyboard shortcuts |

### localStorage Keys

| Key | Purpose |
| --- | --- |
| `dreeso_data_<entity>` | Persisted mock data for each entity |
| `dreeso_data_schema_version` | Schema version for migration detection |
| `dreeso_session` | Current user session (24-hour expiry) |
| `dreeso_auth` | Authentication state flag |
| `dreeso_persona` | Currently selected persona ID |
| `dreeso_audit_log` | Audit log entries (max 1000, FIFO purge) |
| `dreeso_screen_index` | Current screen flow index |

### Resetting Data

To reset all mock data to defaults, run the following in the browser console:

```js
Object.keys(localStorage)
  .filter(key => key.startsWith('dreeso_'))
  .forEach(key => localStorage.removeItem(key));
location.reload();
```

---

## Architecture

### Context Providers

The application uses three nested React Context providers:

```
<AuthProvider>
  <PersonaProvider>
    <AppInnerProvider>
      <RouterProvider />
    </AppInnerProvider>
  </PersonaProvider>
</AuthProvider>
```

- **AuthProvider** — Manages authentication state, session persistence, login/logout/signup, and persona login
- **PersonaProvider** — Manages current persona selection, persona-scoped data loading, permissions, and cluster retrieval
- **AppInnerProvider** — Manages screen flow navigation, notifications, global loading state, keyboard shortcuts, and theme

### Service Layer

| Service | Module | Responsibility |
| --- | --- | --- |
| DataManager | `dataManager.js` | CRUD operations for all 9 data entities with localStorage persistence |
| QueryEngine | `queryEngine.js` | Keyword-based and fuzzy query matching, autosuggest filtering |
| ActionExecutor | `actionExecutor.js` | Action validation, permission checks, execution, and result building |
| CrossDomainPropagator | `crossDomainPropagator.js` | Propagation rule matching, multi-system update simulation, notifications |
| CTAFactory | `ctaFactory.js` | Contextual CTA bubble generation from response data and autosuggest |
| AuditLogger | `auditLogger.js` | Structured audit log with FIFO purge, filtering, and export |

### Custom Hooks

| Hook | Module | Purpose |
| --- | --- | --- |
| `useQueryEngine` | `useQueryEngine.js` | Query submission, autosuggest, loading/error state, CTA bubbles |
| `useKeyboardControls` | `useKeyboardControls.js` | Global keyboard shortcut handling (F, Space, N, R, L) |
| `useAuditLog` | `useAuditLog.js` | Audit log state integration with filtering, export, and purge |

### Design System

- **Theme:** Dark mode (`dreeso-dark-950` background) with glassmorphism cards
- **Typography:** Uber Design System–inspired with `UberMove` font family fallback
- **Colors:** Extended Tailwind palette with `dreeso-dark`, `dreeso-accent`, `semantic`, and `glass` tokens
- **Animations:** `shimmer`, `pulse-green`, `slide-in`, `scale-up` keyframe animations
- **Components:** `GlassCard`, `Avatar`, `DataTable`, `SkeletonLoader`, `Notification`, `SourcePanel`

---

## Deployment

### Vercel (Recommended)

The project includes a `vercel.json` with SPA rewrite rules. Deploy by connecting your GitHub repository to Vercel:

1. Import the repository in the Vercel dashboard
2. Set framework preset to **Vite**
3. Set build command to `npm run build`
4. Set output directory to `dist`
5. Add environment variables: `VITE_APP_TITLE`, `VITE_APP_VERSION`
6. Deploy

### Manual / Other Hosts

```bash
npm install
npm run build
```

Serve the `dist/` directory with any static hosting provider. Ensure all routes are rewritten to `index.html` for SPA support.

For detailed deployment instructions, see [DEPLOYMENT.md](./DEPLOYMENT.md).

### Environment Variables

| Variable | Default | Description |
| --- | --- | --- |
| `VITE_APP_TITLE` | `Ask Dreeso Memory` | Application title displayed in the UI |
| `VITE_APP_VERSION` | `1.0.0` | Application version string |

---

## Troubleshooting

### Blank Page After Build

1. Check the browser console for JavaScript errors
2. Verify `vercel.json` SPA rewrite is configured
3. Ensure `dist/` contains `index.html` and `assets/`

### localStorage Quota Exceeded

1. Clear site data: DevTools → Application → Storage → Clear site data
2. Purge old audit logs from the Audit Log page
3. Reset mock data using the console command above

### Routes Return 404

Ensure your hosting provider rewrites all routes to `index.html`. See the [Deployment](#deployment) section.

### Tests Failing

```bash
# Clear and reinstall
rm -rf node_modules
npm install
npm run test
```

Ensure Node.js >= 18.x is installed.

---

## License

Private — All rights reserved.