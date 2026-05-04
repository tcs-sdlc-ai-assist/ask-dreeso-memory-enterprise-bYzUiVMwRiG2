# Changelog

All notable changes to **Ask Dreeso Memory** will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] — 2024-07-15

### Added

#### Persona-Based Authentication
- Four demo personas: Lukas Müller (Project Director), Elena Rossi (Senior Quantity Surveyor), Sophie Dubois (Project Manager), and James Carter (Sales Director).
- Login via email/password with demo credentials (`demo1234` for all personas).
- Quick-start persona selector on the login screen for instant role switching.
- Sign-up form with persona role selection and client-side validation.
- Session persistence in localStorage with 24-hour expiry and automatic cleanup.
- Protected route guard (`ProtectedRoute`) redirecting unauthenticated users to the welcome screen.
- `AuthContext` providing signup, login, logout, and loginAsPersona methods.
- `PersonaContext` providing persona-scoped data loading, permission checks, and cluster retrieval.

#### Intelligence Clusters
- 24 intelligence clusters (6 per persona) covering management, finance, risk, reporting, workforce, compliance, procurement, schedule, analysis, and sales categories.
- `ClusterGrid` component rendering clusters in a responsive 3×2 (desktop), 2×3 (tablet), 1×6 (mobile) grid layout.
- `IntelligenceCluster` card component with glassmorphism styling, persona-specific accent colors, category badges, and hover animations.
- Click-to-query functionality triggering pre-built query templates from each cluster.
- Skeleton loader placeholders during cluster data loading.

#### Query Engine with Autosuggest
- `QueryEngine` service implementing keyword-based and fuzzy query matching against 22 pre-built query/response pairs.
- Persona-scoped query processing returning structured responses with title, summary, data tables, charts, source systems, and CTA bubbles.
- `QueryBar` component with persistent bottom positioning, focus expansion animation, and real-time autosuggest dropdown.
- Autosuggest filtering by persona context with 20 suggestions per persona sorted by relevance score.
- Keyboard navigation (ArrowUp, ArrowDown, Enter, Escape) within the autosuggest dropdown.
- Loading spinner during query processing with simulated network latency (400–1200ms).
- `QueryResponse` component rendering structured responses with data tables, chart placeholders, source system badges, and CTA follow-up bubbles.
- `useQueryEngine` custom hook managing query state, loading, error, suggestions, and CTA bubbles.

#### CTA Bubbles
- `CTABubbles` component rendering 3–4 tappable pill-shaped follow-up query suggestions after each response.
- `CTAFactory` service generating contextual, data-derived follow-up suggestions based on response content, persona context, and autosuggest data.
- Category-specific icons and persona accent color styling on each bubble.
- Hover scale animation and keyboard accessibility (Enter/Space activation).
- Data-driven CTA generation analyzing response tables for flagged items, high variances, and at-risk statuses.

#### Source Transparency Panel
- `SourcePanel` component rendering a horizontal strip of colored dots representing 10 connected enterprise systems.
- Active system dots pulse green when their system contributed to the current query response.
- Inactive system dots displayed in muted grey with 30% opacity.
- Tooltip on hover/focus showing system name and active status.
- Active/total system count display.

#### Connected Enterprise Systems
- 10 enterprise systems modeled: Procore, SAP Material Management, SAP Financial Accounting, Autodesk Navisworks, Oracle Primavera P6, Salesforce CRM, Workday HCM, Vendor Compliance Database, ESG Registry, and Amsterdam Authority Portal.
- Each system has a unique color, icon, short name, and description.
- System data used across source panels, action previews, and propagation chains.

#### Action Execution
- `ActionExecutor` service implementing persona-scoped action validation and execution with permission checks.
- 18 pre-built actions across workforce, management, finance, risk, compliance, sales, procurement, schedule, and reporting categories.
- `ActionPanel` component displaying available actions in a responsive card grid with execute buttons.
- `ActionConfirmation` component showing action details, affected systems, propagation chain preview, and confirm/cancel buttons before execution.
- Permission validation ensuring personas can only execute actions within their scope and permission set.
- Execution result objects containing status, affected systems, propagation chain, notifications, rollback support, and confirmation messages.

#### Cross-Domain Propagation
- `CrossDomainPropagator` service implementing propagation rule matching, multi-system update simulation, and persona notification generation.
- 18 propagation rules mapping actions to cross-domain update chains with ordered steps, latency estimates, and confidence scores.
- `PropagationFeed` component displaying a live feed of propagation events with expandable details, system dots, and notification entries.
- Propagation preview in action confirmation dialogs showing the full chain before execution.
- Rollback support indicators (reversible/irreversible) on each propagation rule.
- Notification messages tailored per affected persona with role-specific context.

#### 20-Screen Prototype Flow
- Complete 20-screen interactive prototype flow defined in `screenFlow.json`.
- Screen 1: Welcome & System Overview with animated background gradient and branding.
- Screen 2: Persona Selection with four persona cards and quick-start login.
- Screens 3–5: Lukas Müller flow (Dashboard → Strategic Query → Action & Propagation).
- Screens 6–9: Elena Rossi flow (Dashboard → Cost Query → Procurement Follow-up → Budget Action).
- Screens 10–13: Sophie Dubois flow (Dashboard → Schedule Query → Resource Conflict → Task Reassignment).
- Screens 14–17: James Carter flow (Dashboard → Pipeline Query → Market Intelligence → Proposal Submission).
- Screen 18: Cross-Domain System Map with timeline, system breakdown, persona breakdown, and propagation feed tabs.
- Screen 19: Memory & Context Showcase (Session Summary) with event timeline, persona activity, and system access metrics.
- Screen 20: Closing & Call to Action.
- Keyboard navigation between screens: ArrowRight/ArrowLeft for sequential navigation, number keys (1–4) for persona selection, Home for first screen.
- Screen progress indicator in the navigation bar.

#### Audit Logging
- `AuditLogger` service appending structured log entries to localStorage with FIFO purge at 1000 entries.
- Event types: LOGIN, LOGOUT, SIGNUP, PERSONA_SWITCH, QUERY, ACTION, PROPAGATION, PROPAGATION_STEP, PROPAGATION_NOTIFICATION, NAVIGATION.
- Filtering by event type, persona ID, user ID, date range, and entry limit.
- `AuditLogPage` with sortable table, filterable columns, detail panel, pagination, JSON export, and log management (purge/clear).
- `useAuditLog` custom hook providing React state integration for log display and management.
- `SummaryPage` aggregating session metrics from audit logs with event timeline, persona activity breakdown, and system access counts.

#### Responsive UI & Design System
- Glassmorphism design system with `GlassCard` component supporting default, sm, and lg variants.
- Dark theme (`dreeso-dark-950` background) with Uber Design System–inspired typography and color tokens.
- Custom Tailwind CSS configuration with extended color palette (dreeso-dark, dreeso-accent, semantic, glass), custom animations (shimmer, pulse-green, slide-in, scale-up), and glassmorphism shadows.
- `Avatar` component with initials, persona-specific colors, contrast-aware text, and multiple size variants (xs–xl).
- `DataTable` component with fixed header, zebra-striped rows, semantic status coloring, and responsive horizontal scroll.
- `SkeletonLoader` component with shimmer animation supporting text, card, table, and cluster variants.
- `Notification` toast system with success, warning, error, and info variants, auto-dismiss, and slide-in animation.
- `NotificationContainer` rendering stacked toasts fixed top-right.
- `Layout` component with Navbar, 12-column responsive grid, and persistent query bar area.
- `Navbar` with app logo, persona switcher dropdown, navigation links, mobile hamburger menu, and logout button.
- Responsive breakpoints: mobile (< 640px), tablet (640–1023px), desktop (1024px+).

#### Keyboard Controls
- `useKeyboardControls` hook implementing global keyboard shortcuts: F (advance screen), Space (render response), N (next persona), R (restart flow), L (logout).
- Per-screen keyboard shortcuts defined in `screenFlow.json` for contextual navigation.
- Keyboard shortcut hints displayed in the query bar, sidebar cards, and onboarding steps.
- Input/textarea/select elements excluded from shortcut handling to prevent conflicts.

#### Data Management
- `DataManager` service implementing CRUD operations for 9 data entities (actions, autosuggest, clusters, personas, propagation, queries, screenFlow, systems, users).
- Initial data loading from static JSON files into localStorage on first use.
- Schema versioning (`1.0.0`) for future data migration support.
- `resetData` function restoring all entities to default values.
- `getDataById` convenience method for single-record lookups.

#### Pages
- `LoginPage` with animated background gradient, persona selector, email login form, and feature highlights.
- `SignupPage` with account creation form, persona role selection, and login link.
- `OnboardingPage` with 4-step animated walkthrough (Welcome, Personas, Capabilities, Get Started).
- `HomePage` with persona greeting, quick stats, intelligence cluster grid, recent activity feed, and connected systems strip.
- `QueryPage` with query bar, response display, source panel, CTA bubbles, action panel, and propagation feed.
- `ActionPage` with action browsing, confirmation, execution progress, result display, and propagation feed.
- `CrossDomainPage` with propagation timeline, system breakdown, persona breakdown, and propagation feed tabs.
- `AuditLogPage` with filterable/sortable log table, detail panel, summary stats, JSON export, and log management.
- `SummaryPage` with session metrics, event timeline, persona activity cards, and system access breakdown.
- `PersonaSwitchPage` with persona cards, transition overlay animation, session reset notice, and connected systems overview.
- `NotFoundPage` with 404 error display, navigation options, and keyboard shortcut hints.

#### Testing
- Unit tests for `DataManager` service covering getData, setData, updateData, deleteData, resetData, and localStorage interaction.
- Unit tests for `AuthContext` covering signup, login, logout, loginAsPersona, session persistence, and invalid credential handling.
- Unit tests for `QueryEngine` covering processQuery matching, autosuggest filtering, response structure, and audit logging.
- Unit tests for `ActionExecutor` covering executeAction validation, permission checks, confirmation object structure, and audit logging.
- Unit tests for `CrossDomainPropagator` covering propagation rule matching, multi-system updates, persona notifications, and audit logging.
- Integration tests for `ClusterGrid` covering cluster rendering, click handling, skeleton loading, and responsive layout.
- Integration tests for `QueryBar` covering input handling, autosuggest display, query submission, and persona context.
- Vitest configuration with jsdom environment, path aliases, and React Testing Library setup.

#### Build & Configuration
- Vite 5 build configuration with React plugin and `@` path alias.
- Tailwind CSS 3 with PostCSS and Autoprefixer.
- ESLint configuration with React, React Hooks, and React Refresh plugins.
- Vercel deployment configuration with SPA rewrites.
- Environment variable support via `.env` with `VITE_APP_TITLE` and `VITE_APP_VERSION`.