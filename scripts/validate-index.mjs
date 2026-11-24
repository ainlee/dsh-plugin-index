import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { pathToFileURL } from 'node:url';

const indexPath = path.resolve(process.cwd(), 'index.json');
const indexUrl = process.argv[2] ?? pathToFileURL(indexPath).href;

function fail(message) {
  console.error(`[validate-index] ${message}`);
  process.exitCode = 1;
}

function isLocalizedText(value) {
  if (typeof value === 'string') return value.trim().length > 0;
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  if (typeof value.en !== 'string' || value.en.trim().length === 0) return false;
  return Object.values(value).every((v) => typeof v === 'string' && v.trim().length > 0);
}

async function basicValidate(index) {
  const errors = [];
  if (!index || typeof index !== 'object' || Array.isArray(index)) {
    return ['index must be an object'];
  }
  if (index.format !== 1) errors.push('$.format must be 1');
  if (!isLocalizedText(index.title)) errors.push('$.title must be LocalizedText and include en');
  if (index.description !== undefined && !isLocalizedText(index.description)) {
    errors.push('$.description must be LocalizedText when present');
  }
  if (!Array.isArray(index.plugins)) errors.push('$.plugins must be an array');

  const metadata = index.metadata ?? {};
  const categories = metadata.categories ?? {};
  const labels = metadata.labels ?? {};
  const sortKeys = metadata.sortKeys ?? {};
  const names = new Set();

  for (const [i, plugin] of (index.plugins ?? []).entries()) {
    const p = `$.plugins[${i}]`;
    if (!plugin || typeof plugin !== 'object') {
      errors.push(`${p} must be an object`);
      continue;
    }
    if (typeof plugin.name !== 'string' || !plugin.name) errors.push(`${p}.name must be a non-empty string`);
    if (names.has(plugin.name)) errors.push(`${p}.name duplicates ${plugin.name}`);
    names.add(plugin.name);
    if (plugin.title !== undefined && !isLocalizedText(plugin.title)) errors.push(`${p}.title must be LocalizedText`);
    if (plugin.description !== undefined && !isLocalizedText(plugin.description)) errors.push(`${p}.description must be LocalizedText`);
    if (!Array.isArray(plugin.versions) || plugin.versions.length === 0) errors.push(`${p}.versions must be a non-empty array`);

    const pm = plugin.metadata ?? {};
    if (pm.category !== undefined && !Object.hasOwn(categories, pm.category)) {
      errors.push(`${p}.metadata.category references undeclared category ${JSON.stringify(pm.category)}`);
    }
    for (const [j, label] of (pm.labels ?? []).entries()) {
      if (!Object.hasOwn(labels, label)) errors.push(`${p}.metadata.labels[${j}] references undeclared label ${JSON.stringify(label)}`);
    }
    for (const key of Object.keys(pm.sortKeys ?? {})) {
      if (!Object.hasOwn(sortKeys, key)) errors.push(`${p}.metadata.sortKeys.${key} references undeclared sort key`);
    }

    const versions = new Set();
    for (const [j, version] of (plugin.versions ?? []).entries()) {
      const v = `${p}.versions[${j}]`;
      if (!version || typeof version !== 'object') { errors.push(`${v} must be an object`); continue; }
      if (typeof version.version !== 'string') errors.push(`${v}.version must be a string`);
      if (versions.has(version.version)) errors.push(`${v}.version duplicates ${version.version}`);
      versions.add(version.version);
      if (!Number.isInteger(version.publishTimestamp)) errors.push(`${v}.publishTimestamp must be an integer`);
      const source = version.source;
      if (!source || typeof source !== 'object') {
        errors.push(`${v}.source must be an object`);
      } else if (source.type === 'npm') {
        // ok
      } else if (source.type === 'git') {
        if (typeof source.url !== 'string') errors.push(`${v}.source.url must be a string`);
        if (typeof source.commit !== 'string' || !/^[0-9a-f]{40}$/.test(source.commit)) {
          errors.push(`${v}.source.commit must be a 40-char lowercase hex SHA`);
        }
      } else {
        errors.push(`${v}.source.type must be "npm" or "git"`);
      }
    }
  }
  return errors;
}

const raw = await fs.readFile(indexPath, 'utf8');
const index = JSON.parse(raw);

try {
  const mod = await import('@deepseek-ai/dsh-plugin-market-index');
  if (typeof mod.parseMarketIndex === 'function') {
    mod.parseMarketIndex(index, indexUrl);
    console.log(`[validate-index] OK (official validator) ${indexPath}`);
    process.exit(0);
  }
} catch {
  // Fall through to basic validation.
}

const errors = await basicValidate(index);
if (errors.length > 0) {
  for (const e of errors) fail(e);
  process.exit(1);
}

console.log(`[validate-index] OK (basic checks only; install @deepseek-ai/dsh-plugin-market-index for full validation) ${indexPath}`);
