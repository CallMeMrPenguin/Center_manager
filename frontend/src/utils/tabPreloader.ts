import React, { ComponentType } from 'react';

/**
 * Resilient module importer with exponential backoff retry.
 * Handles transient network dropouts or Cloudflare clearance race conditions gracefully.
 */
function loadWithRetry<T>(importer: () => Promise<T>, retries = 2, delayMs = 800): Promise<T> {
  return importer().catch((err) => {
    if (retries <= 0) throw err;
    return new Promise((resolve) => setTimeout(resolve, delayMs)).then(() =>
      loadWithRetry(importer, retries - 1, Math.round(delayMs * 1.5))
    );
  });
}

/**
 * Registry of dynamic import module loaders for all application tabs.
 * Centralizing them enables both React.lazy() and background prefetching to share
 * the exact same module promise cache.
 */
export const TAB_MODULE_LOADERS: Record<string, () => Promise<{ default: ComponentType<any> }>> = {
  dashboard: () => loadWithRetry(() => import('../pages/dashboard')),
  students: () => loadWithRetry(() => import('../pages/students')),
  classes: () => loadWithRetry(() => import('../pages/classes')),
  schedule: () => loadWithRetry(() => import('../pages/schedule')),
  teachers: () => loadWithRetry(() => import('../pages/teachers')),
  courses: () => loadWithRetry(() => import('../pages/courses')),
  kiemtra: () => loadWithRetry(() => import('../pages/kiemtra')),
  assignments: () => loadWithRetry(() => import('../pages/assignments')),
  results: () => loadWithRetry(() => import('../pages/results')),
  reports: () => loadWithRetry(() => import('../pages/reports')),
  'users-roles': () => loadWithRetry(() => import('../pages/users-roles')),
  settings: () => loadWithRetry(() => import('../pages/settings')),
  // Local/Resource tools
  formatter: () => loadWithRetry(() => import('../pages/test-formatter')),
  'question-bank': () => loadWithRetry(() => import('../pages/question-bank')),
  'vocab-bank': () => loadWithRetry(() => import('../pages/vocabulary-bank')),
  'unit-config': () => loadWithRetry(() => import('../pages/unit-config')),
  'file-manager': () => loadWithRetry(() => import('../pages/document-manager')),
  'word-editor': () => loadWithRetry(() => import('../pages/word-editor')),
  'canvas-board': () => loadWithRetry(() => import('../pages/canvas-board')),
  'ui-showcase': () => loadWithRetry(() => import('../pages/ui-showcase')),
};

/**
 * High-priority core business tabs to progressively pre-mount during browser idle time.
 * These are lightweight data tables and dashboards that benefit immensely from being kept alive.
 */
export const CORE_PREMOUNT_TABS: string[] = [
  'students',
  'classes',
  'schedule',
  'teachers',
  'courses',
  'assignments',
  'results',
  'kiemtra',
  'reports',
];

/**
 * Heavy/specialized tabs that MUST NOT be pre-mounted into the DOM in background.
 * Only their JS chunks are preloaded to prevent excessive RAM/CPU usage.
 */
export const HEAVY_ISOLATED_TABS: string[] = [
  'canvas-board',
  'word-editor',
  'formatter',
  'question-bank',
  'file-manager',
  'settings',
  'vocab-bank',
  'unit-config',
  'ui-showcase',
  'payments',
  'invoices',
];

const preloadedChunks = new Set<string>();

/**
 * Pre-downloads the JavaScript chunk for a given tab in the background.
 * Browser HTTP and ES module cache will hold the module ready for instant 0ms mount.
 */
export function prefetchTabChunk(tabId: string): void {
  const loader = TAB_MODULE_LOADERS[tabId];
  if (!loader || preloadedChunks.has(tabId)) return;
  preloadedChunks.add(tabId);
  loader().catch(() => {
    preloadedChunks.delete(tabId);
  });
}
