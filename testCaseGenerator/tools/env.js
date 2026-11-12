import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

export function loadProjectEnv() {
  const envFile = path.join(root, '.env');
  if (!fs.existsSync(envFile)) return;
  for (const rawLine of fs.readFileSync(envFile, 'utf8').split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    const separator = line.indexOf('=');
    if (separator < 1) continue;
    const key = line.slice(0, separator).trim();
    let value = line.slice(separator + 1).trim();
    if (value.startsWith('"') && value.endsWith('"')) {
      try { value = JSON.parse(value); } catch { value = value.slice(1, -1); }
    } else if (value.startsWith("'") && value.endsWith("'")) value = value.slice(1, -1);
    if (!process.env[key]) process.env[key] = value;
  }
}

const editableKeys = new Set(['JIRA_URL', 'JIRA_EMAIL', 'JIRA_API_TOKEN', 'GROQ_KEY', 'GROQ_MODEL']);

export async function saveProjectSettings(input) {
  loadProjectEnv();
  const updates = Object.fromEntries(Object.entries(input || {})
    .filter(([key, value]) => editableKeys.has(key) && typeof value === 'string' && value.trim())
    .map(([key, value]) => [key, value.trim()]));
  if (!Object.keys(updates).length) throw new Error('Enter at least one setting to save.');

  const file = path.join(root, '.env');
  let lines = fs.existsSync(file) ? fs.readFileSync(file, 'utf8').split(/\r?\n/) : [];
  const written = new Set();
  lines = lines.map((line) => {
    const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=/);
    if (!match || !Object.hasOwn(updates, match[1])) return line;
    written.add(match[1]);
    return `${match[1]}=${JSON.stringify(updates[match[1]])}`;
  });
  for (const [key, value] of Object.entries(updates)) if (!written.has(key)) lines.push(`${key}=${JSON.stringify(value)}`);
  const content = `${lines.filter((line, index) => index < lines.length - 1 || line !== '').join('\n').replace(/\n+$/, '')}\n`;
  const temporary = `${file}.tmp`;
  fs.writeFileSync(temporary, content, { mode: 0o600 });
  fs.renameSync(temporary, file);
  fs.chmodSync(file, 0o600);
  for (const [key, value] of Object.entries(updates)) process.env[key] = value;
  return getSettingsStatus();
}

export function getSettingsStatus() {
  loadProjectEnv();
  return {
    jiraUrlConfigured: Boolean(process.env.JIRA_URL?.trim()),
    jiraEmailConfigured: Boolean(process.env.JIRA_EMAIL?.trim()),
    jiraTokenConfigured: Boolean(process.env.JIRA_API_TOKEN?.trim()),
    groqKeyConfigured: Boolean(process.env.GROQ_KEY?.trim()),
    groqModel: process.env.GROQ_MODEL?.trim() || 'openai/gpt-oss-120b',
  };
}

export function requiredConfig(...keys) {
  const missing = keys.filter((key) => !process.env[key]?.trim());
  if (missing.length) throw new Error(`Server configuration is incomplete. Set: ${missing.join(', ')}.`);
}

export { root as projectRoot };
