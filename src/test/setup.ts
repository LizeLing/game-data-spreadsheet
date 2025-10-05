/**
 * Vitest Setup File
 * Configure global test environment
 */

import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Mock IndexedDB for browser storage tests
const indexedDB = {
  open: () => ({
    result: {},
    onsuccess: null,
    onerror: null,
  }),
};

global.indexedDB = indexedDB as any;
