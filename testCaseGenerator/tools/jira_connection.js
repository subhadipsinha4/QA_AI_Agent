import { loadProjectEnv, requiredConfig } from './env.js';

loadProjectEnv();

function authHeader() {
  return `Basic ${Buffer.from(`${process.env.JIRA_EMAIL}:${process.env.JIRA_API_TOKEN}`).toString('base64')}`;
}

function jiraBaseUrl() {
  const raw = process.env.JIRA_URL?.trim();
  if (!raw) throw new Error('Jira is not configured. Add JIRA_URL to the server .env file.');
  let url;
  try { url = new URL(raw); } catch { throw new Error('JIRA_URL must be a valid Jira base URL.'); }
  if (!['https:', 'http:'].includes(url.protocol)) throw new Error('JIRA_URL must use HTTP or HTTPS.');
  return url.toString().replace(/\/$/, '');
}

async function jiraGet(url) {
  let response;
  try {
    response = await fetch(url, {
      headers: { Authorization: authHeader(), Accept: 'application/json' },
      signal: AbortSignal.timeout(18000),
    });
  } catch (error) {
    if (error.name === 'TimeoutError') throw new Error('Jira took too long to respond. Try again.');
    throw new Error('Could not reach Jira. Check the Jira URL and your network connection.');
  }
  if (response.status === 401 || response.status === 403) throw new Error('Jira authentication failed or this account cannot view the issue. Check the Jira email, API token, and project access.');
  if (response.status === 404) throw new Error('Jira issue was not found. Check the issue key and project access.');
  if (!response.ok) throw new Error(`Jira returned an error (${response.status}). Try again or check the Jira service.`);
  return response.json();
}

function adfText(value) {
  if (value == null) return '';
  if (typeof value === 'string') return value;
  if (Array.isArray(value)) return value.map(adfText).filter(Boolean).join('\n');
  if (typeof value !== 'object') return String(value);
  if (value.type === 'text' && typeof value.text === 'string') return value.text;
  const content = Array.isArray(value.content) ? value.content.map(adfText).filter(Boolean).join(value.type === 'paragraph' || value.type === 'listItem' ? '\n' : '') : '';
  if (value.type === 'hardBreak') return '\n';
  if (value.type === 'mention') return value.attrs?.text || '';
  return content;
}

function plainValue(value) {
  if (value == null) return '';
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') return String(value);
  if (Array.isArray(value)) return value.map(plainValue).filter(Boolean).join('\n');
  if (typeof value === 'object') {
    if (value.content) return adfText(value);
    return value.value || value.name || value.displayName || '';
  }
  return '';
}

export async function fetchJiraIssue(issueKey) {
  loadProjectEnv();
  requiredConfig('JIRA_EMAIL', 'JIRA_API_TOKEN');
  const key = String(issueKey || '').trim().toUpperCase();
  if (!/^[A-Z][A-Z0-9_]*-\d+$/.test(key)) throw new Error('Enter a Jira issue key such as PROJ-123.');

  const base = jiraBaseUrl();
  const fieldsUrl = new URL(`${base}/rest/api/3/field`);
  const issueUrl = new URL(`${base}/rest/api/3/issue/${encodeURIComponent(key)}`);
  issueUrl.searchParams.set('fields', '*all');
  const [fieldList, issue] = await Promise.all([jiraGet(fieldsUrl), jiraGet(issueUrl)]);
  const fields = issue.fields || {};
  const acceptanceFieldIds = new Set((Array.isArray(fieldList) ? fieldList : [])
    .filter((field) => /acceptance\s*criteria/i.test(field.name || ''))
    .map((field) => field.id));
  const criteria = [...acceptanceFieldIds].map((id) => plainValue(fields[id])).filter(Boolean).join('\n');
  const normalized = {
    key: issue.key || key,
    summary: plainValue(fields.summary),
    description: plainValue(fields.description),
    acceptanceCriteria: criteria,
  };
  if (!normalized.summary && !normalized.description && !normalized.acceptanceCriteria) {
    throw new Error('The Jira issue has no readable summary, description, or acceptance criteria.');
  }
  return normalized;
}

export async function checkJiraConnection() {
  loadProjectEnv();
  requiredConfig('JIRA_EMAIL', 'JIRA_API_TOKEN');
  const base = jiraBaseUrl();
  const response = await jiraGet(new URL(`${base}/rest/api/3/myself`));
  return { connected: true, account: response.displayName || 'Jira account' };
}
