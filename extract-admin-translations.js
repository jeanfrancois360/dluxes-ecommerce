#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const glob = require('glob');

const adminPagesDir = 'apps/web/src/app/admin';
const translationFile = 'apps/web/messages/en.json';

// Find all admin page files
const pageFiles = glob.sync(`${adminPagesDir}/**/page.tsx`);

console.log(`Found ${pageFiles.length} admin pages\n`);

const allKeys = new Set();
const keysByPage = {};

// Regular expressions to extract translation keys
const useTranslationsRegex = /useTranslations\(['"]([^'"]+)['"]\)/g;
const tCallRegex = /t\(['"]([^'"]+)['"]/g;

pageFiles.forEach((file) => {
  const content = fs.readFileSync(file, 'utf-8');
  const relativePath = file.replace(adminPagesDir + '/', '');

  keysByPage[relativePath] = {
    namespace: null,
    keys: [],
  };

  // Extract namespace from useTranslations
  let match;
  const namespaceMatches = [];
  while ((match = useTranslationsRegex.exec(content)) !== null) {
    namespaceMatches.push(match[1]);
  }

  // Reset regex lastIndex
  useTranslationsRegex.lastIndex = 0;

  if (namespaceMatches.length > 0) {
    keysByPage[relativePath].namespace = namespaceMatches[0];
  }

  // Extract all t() calls
  while ((match = tCallRegex.exec(content)) !== null) {
    const key = match[1];
    keysByPage[relativePath].keys.push(key);

    // Build full key with namespace
    if (keysByPage[relativePath].namespace) {
      const fullKey = `${keysByPage[relativePath].namespace}.${key}`;
      allKeys.add(fullKey);
    }
  }

  // Reset regex lastIndex
  tCallRegex.lastIndex = 0;
});

// Read existing translation file
const existingTranslations = JSON.parse(fs.readFileSync(translationFile, 'utf-8'));

// Check which keys are missing
const missingKeys = {};

allKeys.forEach((fullKey) => {
  const parts = fullKey.split('.');
  let current = existingTranslations;
  let missing = false;

  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    if (!current || !current.hasOwnProperty(part)) {
      missing = true;
      break;
    }
    current = current[part];
  }

  if (missing) {
    // Organize by namespace
    const namespace = parts[0];
    if (!missingKeys[namespace]) {
      missingKeys[namespace] = [];
    }
    missingKeys[namespace].push(fullKey);
  }
});

// Output results
console.log('\n=== MISSING TRANSLATION KEYS ===\n');

const namespaces = Object.keys(missingKeys).sort();

if (namespaces.length === 0) {
  console.log('✅ No missing keys found!');
} else {
  namespaces.forEach((namespace) => {
    console.log(`\n📦 ${namespace}:`);
    console.log(`   Total missing: ${missingKeys[namespace].length}`);
    console.log(`   Keys:`);
    missingKeys[namespace].forEach((key) => {
      console.log(`     - ${key}`);
    });
  });

  console.log(`\n\n📊 Summary:`);
  console.log(`   Total namespaces with issues: ${namespaces.length}`);
  console.log(
    `   Total missing keys: ${Array.from(allKeys).length - Object.keys(existingTranslations).length}`
  );
}

// Write detailed report
const reportPath = 'translation-audit-report.json';
fs.writeFileSync(
  reportPath,
  JSON.stringify(
    {
      timestamp: new Date().toISOString(),
      totalPages: pageFiles.length,
      totalKeys: allKeys.size,
      missingKeys,
      keysByPage,
    },
    null,
    2
  )
);

console.log(`\n📄 Detailed report written to: ${reportPath}`);
