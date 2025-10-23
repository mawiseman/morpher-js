#!/usr/bin/env node

/**
 * Clean script - removes all build artifacts from workspace packages
 */

import { rmSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, '..');

const distDirs = [
  join(rootDir, 'dist'),
  join(rootDir, 'packages', 'morpher', 'dist'),
  join(rootDir, 'packages', 'gui', 'dist'),
  join(rootDir, 'packages', 'demos', 'dist'),
];

console.log('🧹 Cleaning build artifacts...\n');

for (const dir of distDirs) {
  if (existsSync(dir)) {
    console.log(`  Removing: ${dir}`);
    rmSync(dir, { recursive: true, force: true });
  }
}

console.log('\n✅ Clean complete!');
