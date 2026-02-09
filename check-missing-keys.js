const fs = require('fs');
const path = require('path');
const glob = require('glob');

const translationsPath = path.join(__dirname, 'apps/web/messages/en.json');
const translations = JSON.parse(fs.readFileSync(translationsPath, 'utf8'));

// Get all admin page files
const adminFiles = glob.sync('apps/web/src/app/admin/**/page.tsx');

const missingKeys = {};

adminFiles.forEach((file) => {
  const content = fs.readFileSync(file, 'utf8');

  // Find useTranslations calls
  const translationMatch = content.match(/useTranslations\(['"]([^'"]+)['"]\)/);
  if (!translationMatch) return;

  const namespace = translationMatch[1];

  // Skip non-admin namespaces
  if (!namespace.startsWith('admin')) return;

  // Extract all t() calls
  const tCalls = content.match(/t\(['"]([^'"]+)['"]\)/g) || [];

  tCalls.forEach((call) => {
    const keyMatch = call.match(/t\(['"]([^'"]+)['"]\)/);
    if (!keyMatch) return;

    const key = keyMatch[1];
    const keyParts = key.split('.');

    // Check if key exists in translations
    let current = translations[namespace];
    if (!current) {
      if (!missingKeys[namespace]) missingKeys[namespace] = new Set();
      missingKeys[namespace].add('NAMESPACE_MISSING');
      return;
    }

    for (const part of keyParts) {
      if (!current || !current[part]) {
        if (!missingKeys[namespace]) missingKeys[namespace] = new Set();
        missingKeys[namespace].add(key);
        break;
      }
      current = current[part];
    }
  });
});

// Print results
console.log('Missing Translation Keys Report\n');
Object.keys(missingKeys)
  .sort()
  .forEach((namespace) => {
    const keys = Array.from(missingKeys[namespace]).sort();
    console.log(`\n${namespace} (${keys.length} missing):`);
    keys.forEach((key) => console.log(`  - ${key}`));
  });

if (Object.keys(missingKeys).length === 0) {
  console.log('✓ All translation keys exist in en.json');
}
