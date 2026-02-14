#!/usr/bin/env node

/**
 * Generate version.json file for deployment
 * This script runs before each build to update the version info
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Get version from package.json
const packageJson = require('../package.json');
const version = packageJson.version;

// Get git commit hash (short)
let gitHash = 'unknown';
try {
  gitHash = execSync('git rev-parse --short HEAD').toString().trim();
} catch (error) {
  console.warn('Warning: Could not get git hash');
}

// Get build timestamp
const buildTime = new Date().toISOString();

// Create version object
const versionInfo = {
  version,
  buildTime,
  gitHash,
};

// Write to public/version.json
const outputPath = path.join(__dirname, '../public/version.json');
fs.writeFileSync(outputPath, JSON.stringify(versionInfo, null, 2));

console.log('✓ Generated version.json:', versionInfo);
