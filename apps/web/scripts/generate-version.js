#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Get git information
let gitCommit = 'unknown';
let gitBranch = 'unknown';

try {
  gitCommit = execSync('git rev-parse --short HEAD').toString().trim();
  gitBranch = execSync('git rev-parse --abbrev-ref HEAD').toString().trim();
} catch (error) {
  console.warn('Warning: Could not get git information:', error.message);
}

// Get package version
const packageJson = require('../package.json');
const version = packageJson.version || '1.0.0';

// Create version object
const versionInfo = {
  version: `v${version}-${gitCommit}`,
  commit: gitCommit,
  branch: gitBranch,
  buildTime: new Date().toISOString(),
  nodeVersion: process.version,
};

// Write to public/version.json
const publicDir = path.join(__dirname, '..', 'public');
const versionFile = path.join(publicDir, 'version.json');

// Ensure public directory exists
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

fs.writeFileSync(versionFile, JSON.stringify(versionInfo, null, 2));

console.log('✅ Version file generated:');
console.log(JSON.stringify(versionInfo, null, 2));
