#!/usr/bin/env python3

import os
import json
import re
from collections import defaultdict
from pathlib import Path

# Paths
admin_dir = "apps/web/src/app/admin"
translation_file = "apps/web/messages/en.json"

# Find all admin page files
page_files = list(Path(admin_dir).rglob("page.tsx"))

print(f"Found {len(page_files)} admin pages\n")

# Load existing translations
with open(translation_file, 'r') as f:
    translations = json.load(f)

# Track findings
all_keys_by_page = {}
missing_keys = defaultdict(list)
all_namespaces = set()

for page_file in page_files:
    with open(page_file, 'r') as f:
        content = f.read()

    relative_path = str(page_file).replace(f"{admin_dir}/", "")

    # Extract namespace
    namespace_matches = re.findall(r"useTranslations\(['\"]([^'\"]+)['\"]\)", content)
    namespace = namespace_matches[0] if namespace_matches else None

    if not namespace:
        continue

    all_namespaces.add(namespace)

    # Extract all t() calls
    t_calls = re.findall(r"t\(['\"]([^'\"]+)['\"]", content)

    all_keys_by_page[relative_path] = {
        'namespace': namespace,
        'keys': sorted(set(t_calls))
    }

    # Check for missing keys
    for key in set(t_calls):
        full_key_parts = [namespace] + key.split('.')
        current = translations
        found = True

        for part in full_key_parts:
            if isinstance(current, dict) and part in current:
                current = current[part]
            else:
                found = False
                break

        if not found:
            missing_keys[namespace].append(key)

# Print results
print("=" * 80)
print("MISSING TRANSLATION KEYS")
print("=" * 80)

if not missing_keys:
    print("\n✅ NO MISSING KEYS FOUND!\n")
else:
    total_missing = sum(len(keys) for keys in missing_keys.values())
    print(f"\n❌ Found {total_missing} missing keys across {len(missing_keys)} namespaces\n")

    for namespace in sorted(missing_keys.keys()):
        keys = sorted(set(missing_keys[namespace]))
        print(f"\n📦 {namespace} ({len(keys)} missing keys):")
        for key in keys:
            print(f"   - {key}")

# Check for pageSubtitle vs pageDescription inconsistency
print("\n" + "=" * 80)
print("CHECKING pageSubtitle vs pageDescription INCONSISTENCY")
print("=" * 80)

for relative_path, data in all_keys_by_page.items():
    namespace = data['namespace']
    keys = data['keys']

    has_page_subtitle = 'pageSubtitle' in keys
    has_page_description = 'pageDescription' in keys

    if has_page_subtitle:
        # Check if translation file has pageDescription instead
        if namespace in translations:
            ns_trans = translations[namespace]
            if isinstance(ns_trans, dict):
                if 'pageDescription' in ns_trans and 'pageSubtitle' not in ns_trans:
                    print(f"\n⚠️  {relative_path}")
                    print(f"    Namespace: {namespace}")
                    print(f"    Code uses: pageSubtitle")
                    print(f"    Translation has: pageDescription")
                    print(f"    FIX NEEDED!")

print("\n" + "=" * 80)
print("SUMMARY")
print("=" * 80)
print(f"Total admin pages scanned: {len(page_files)}")
print(f"Total namespaces found: {len(all_namespaces)}")
print(f"Namespaces: {', '.join(sorted(all_namespaces))}")

# Write detailed report
report = {
    'timestamp': '2026-02-09',
    'total_pages': len(page_files),
    'total_namespaces': len(all_namespaces),
    'namespaces': sorted(all_namespaces),
    'missing_keys': {ns: sorted(set(keys)) for ns, keys in missing_keys.items()},
    'keys_by_page': all_keys_by_page
}

with open('translation-audit-report.json', 'w') as f:
    json.dump(report, f, indent=2)

print(f"\n📄 Detailed report written to: translation-audit-report.json\n")
