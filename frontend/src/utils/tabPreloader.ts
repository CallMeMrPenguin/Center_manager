import React, { ComponentType } from 'react';

/**
 * Registry of dynamic import module loaders for all application tabs.
 * Centralizing them enables both React.lazy() and background prefetching to share
 * the exact same module promise cache.
 */
export const TAB_MODULE_LOADERS: Record<string, () => Promise<{ default: ComponentType<any> }>> = {
  dashboard: () => import('../pages/dashboard'),
  students: () => import('../pages/students'),
  classes: () => import('../pages/classes'),
  schedule: () => import('../pages/schedule'),
  teachers: () => import('../pages/teachers'),
  courses: () => import('../pages/courses'),
  kiemtra: () => import('../pages/kiemtra'),
  assignments: () => import('../pages/assignments'),
  results: () => import('../pages/results'),
  reports: () => import('../pages/reports'),
  'users-roles': () => import('../pages/users-roles'),
  settings: () => import('../pages/settings'),
  // Local/Resource tools
  formatter: () => import('../pages/test-formatter'),
  'question-bank': () => import('../pages/question-bank'),
  'vocab-bank': () => import('../pages/vocabulary-bank'),
  'unit-config': () => import('../pages/unit-config'),
  'file-manager': () => import('../pages/document-manager'),
  'word-editor': () => import('../pages/word-editor'),
  'canvas-board': () => import('../pages/canvas-board'),
  'ui-showcase': () => import('../pages/ui-showcase'),
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
