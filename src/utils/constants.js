/**
 * Application-wide constants for Ask Dreeso Memory
 */

// ─── LocalStorage Keys ───────────────────────────────────────────────────────

export const AUTH_KEY = 'dreeso_auth';
export const SESSION_KEY = 'dreeso_session';
export const DATA_PREFIX = 'dreeso_data_';
export const AUDIT_LOG_KEY = 'dreeso_audit_log';
export const PERSONA_KEY = 'dreeso_persona';

// ─── Persona IDs ─────────────────────────────────────────────────────────────

export const PERSONA_IDS = {
  LUKAS: 'persona-lukas',
  ELENA: 'persona-elena',
  SOPHIE: 'persona-sophie',
  JAMES: 'persona-james',
};

export const PERSONA_LIST = [
  PERSONA_IDS.LUKAS,
  PERSONA_IDS.ELENA,
  PERSONA_IDS.SOPHIE,
  PERSONA_IDS.JAMES,
];

// ─── System IDs ──────────────────────────────────────────────────────────────

export const SYSTEM_IDS = {
  PROCORE: 'system-procore',
  SAP_MM: 'system-sap-mm',
  SAP_FI: 'system-sap-fi',
  NAVISWORKS: 'system-navisworks',
  PRIMAVERA_P6: 'system-primavera-p6',
  SALESFORCE: 'system-salesforce',
  WORKDAY: 'system-workday',
  VENDOR_COMPLIANCE_DB: 'system-vendor-compliance-db',
  ESG_REGISTRY: 'system-esg-registry',
  AMSTERDAM_AUTHORITY_PORTAL: 'system-amsterdam-authority-portal',
};

export const SYSTEM_LIST = [
  SYSTEM_IDS.PROCORE,
  SYSTEM_IDS.SAP_MM,
  SYSTEM_IDS.SAP_FI,
  SYSTEM_IDS.NAVISWORKS,
  SYSTEM_IDS.PRIMAVERA_P6,
  SYSTEM_IDS.SALESFORCE,
  SYSTEM_IDS.WORKDAY,
  SYSTEM_IDS.VENDOR_COMPLIANCE_DB,
  SYSTEM_IDS.ESG_REGISTRY,
  SYSTEM_IDS.AMSTERDAM_AUTHORITY_PORTAL,
];

// ─── Keyboard Shortcut Mappings ──────────────────────────────────────────────

export const KEYBOARD_SHORTCUTS = {
  NEXT_SCREEN: 'ArrowRight',
  PREV_SCREEN: 'ArrowLeft',
  CONFIRM: 'Enter',
  CANCEL: 'Escape',
  HOME: 'Home',
  PERSONA_1: '1',
  PERSONA_2: '2',
  PERSONA_3: '3',
  PERSONA_4: '4',
};

export const KEYBOARD_SHORTCUT_LABELS = {
  [KEYBOARD_SHORTCUTS.NEXT_SCREEN]: '→ Next',
  [KEYBOARD_SHORTCUTS.PREV_SCREEN]: '← Previous',
  [KEYBOARD_SHORTCUTS.CONFIRM]: '↵ Confirm',
  [KEYBOARD_SHORTCUTS.CANCEL]: 'Esc Cancel',
  [KEYBOARD_SHORTCUTS.HOME]: 'Home',
  [KEYBOARD_SHORTCUTS.PERSONA_1]: '1 Lukas',
  [KEYBOARD_SHORTCUTS.PERSONA_2]: '2 Elena',
  [KEYBOARD_SHORTCUTS.PERSONA_3]: '3 Sophie',
  [KEYBOARD_SHORTCUTS.PERSONA_4]: '4 James',
};

// ─── Animation Durations (ms) ────────────────────────────────────────────────

export const ANIMATION_DURATION = {
  INSTANT: 0,
  FAST: 150,
  DEFAULT: 200,
  MODERATE: 300,
  SLOW: 500,
  SHIMMER: 2000,
  PULSE: 2000,
  SLIDE_IN: 300,
  SCALE_UP: 200,
  SCREEN_TRANSITION: 400,
  TYPING_DELAY: 30,
  PROPAGATION_STEP: 800,
};

// ─── Color Palette Tokens ────────────────────────────────────────────────────

export const COLORS = {
  DARK: {
    50: '#f5f5f6',
    100: '#e6e6e7',
    200: '#cfcfd2',
    300: '#adadb2',
    400: '#84848b',
    500: '#696970',
    600: '#5a5a5f',
    700: '#4c4c50',
    800: '#434346',
    900: '#3b3b3d',
    950: '#1a1a1c',
  },
  ACCENT: {
    50: '#edfcf2',
    100: '#d3f8df',
    200: '#aaf0c4',
    300: '#73e2a3',
    400: '#3bcd7e',
    500: '#17b363',
    600: '#0b914f',
    700: '#097441',
    800: '#0a5c36',
    900: '#094b2d',
    950: '#042a1a',
  },
  SEMANTIC: {
    SUCCESS: '#06c167',
    WARNING: '#ffc043',
    ERROR: '#e11900',
    INFO: '#276ef1',
  },
  PERSONA: {
    [PERSONA_IDS.LUKAS]: '#3bcd7e',
    [PERSONA_IDS.ELENA]: '#276ef1',
    [PERSONA_IDS.SOPHIE]: '#ffc043',
    [PERSONA_IDS.JAMES]: '#e11900',
  },
  SYSTEM: {
    [SYSTEM_IDS.PROCORE]: '#F47E20',
    [SYSTEM_IDS.SAP_MM]: '#0070F2',
    [SYSTEM_IDS.SAP_FI]: '#0053B8',
    [SYSTEM_IDS.NAVISWORKS]: '#1CA54C',
    [SYSTEM_IDS.PRIMAVERA_P6]: '#C74634',
    [SYSTEM_IDS.SALESFORCE]: '#00A1E0',
    [SYSTEM_IDS.WORKDAY]: '#F68D2E',
    [SYSTEM_IDS.VENDOR_COMPLIANCE_DB]: '#7B61FF',
    [SYSTEM_IDS.ESG_REGISTRY]: '#34A853',
    [SYSTEM_IDS.AMSTERDAM_AUTHORITY_PORTAL]: '#E4003A',
  },
  HEALTH: {
    GREEN: '#06c167',
    AMBER: '#ffc043',
    RED: '#e11900',
  },
};

// ─── Grid Breakpoints (px) ───────────────────────────────────────────────────

export const BREAKPOINTS = {
  SM: 640,
  MD: 768,
  LG: 1024,
  XL: 1280,
  XXL: 1536,
};

// ─── Route Paths ─────────────────────────────────────────────────────────────

export const ROUTES = {
  HOME: '/',
  WELCOME: '/welcome',
  PERSONA_SELECTION: '/personas',
  DASHBOARD: '/dashboard/:personaId',
  QUERY: '/query/:personaId',
  ACTION: '/action/:personaId',
  CROSS_DOMAIN: '/cross-domain',
  MEMORY_SHOWCASE: '/memory',
  CLOSING: '/closing',
};

// ─── Screen IDs ──────────────────────────────────────────────────────────────

export const SCREEN_IDS = {
  WELCOME: 'screen-welcome',
  PERSONA_SELECTION: 'screen-persona-selection',
  LUKAS_DASHBOARD: 'screen-lukas-dashboard',
  LUKAS_QUERY: 'screen-lukas-query',
  LUKAS_ACTION: 'screen-lukas-action',
  ELENA_DASHBOARD: 'screen-elena-dashboard',
  ELENA_QUERY: 'screen-elena-query',
  ELENA_FOLLOWUP: 'screen-elena-followup',
  ELENA_ACTION: 'screen-elena-action',
  SOPHIE_DASHBOARD: 'screen-sophie-dashboard',
  SOPHIE_QUERY: 'screen-sophie-query',
  SOPHIE_RESOURCE: 'screen-sophie-resource',
  SOPHIE_ACTION: 'screen-sophie-action',
  JAMES_DASHBOARD: 'screen-james-dashboard',
  JAMES_QUERY: 'screen-james-query',
  JAMES_MARKET: 'screen-james-market',
  JAMES_ACTION: 'screen-james-action',
  CROSS_DOMAIN_OVERVIEW: 'screen-cross-domain-overview',
  MEMORY_SHOWCASE: 'screen-memory-showcase',
  CLOSING: 'screen-closing',
};

// ─── Action Categories ───────────────────────────────────────────────────────

export const ACTION_CATEGORIES = {
  WORKFORCE: 'workforce',
  MANAGEMENT: 'management',
  FINANCE: 'finance',
  RISK: 'risk',
  COMPLIANCE: 'compliance',
  SALES: 'sales',
  PROCUREMENT: 'procurement',
  SCHEDULE: 'schedule',
  REPORTING: 'reporting',
};

// ─── Cluster Categories ──────────────────────────────────────────────────────

export const CLUSTER_CATEGORIES = {
  MANAGEMENT: 'management',
  FINANCE: 'finance',
  RISK: 'risk',
  REPORTING: 'reporting',
  WORKFORCE: 'workforce',
  COMPLIANCE: 'compliance',
  PROCUREMENT: 'procurement',
  SCHEDULE: 'schedule',
  ANALYSIS: 'analysis',
  SALES: 'sales',
};

// ─── App Metadata ────────────────────────────────────────────────────────────

export const APP_TITLE = import.meta.env.VITE_APP_TITLE || 'Ask Dreeso Memory';
export const APP_VERSION = import.meta.env.VITE_APP_VERSION || '1.0.0';

// ─── Total Screen Count ──────────────────────────────────────────────────────

export const TOTAL_SCREENS = 20;