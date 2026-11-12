import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createServer as createViteServer } from 'vite';
import { getSettingsStatus, loadProjectEnv, projectRoot, saveProjectSettings } from './tools/env.js';
import { checkJiraConnection, fetchJiraIssue } from './tools/jira_connection.js';
import { checkGroqConnection, createTestPlan } from './tools/test_plan_creator.js';

loadProjectEnv();
const port = Number(process.env.PORT) || 3001;
const isProduction = process.env.NODE_ENV === 'production';
const distDir = path.join(projectRoot, 'dist');
const mime = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.ico': 'image/x-icon' };

async function readJson(request) {
  let body = '';
  for await (const chunk of request) {
    body += chunk;
    if (body.length > 1_000_000) throw new Error('Request is too large.');
  }
  try { return JSON.parse(body || '{}'); } catch { throw new Error('Request body must be valid JSON.'); }
}

function respond(response, status, payload) {
  response.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' });
  response.end(JSON.stringify(payload));
}

const vite = isProduction ? null : await createViteServer({
  root: projectRoot,
  server: { middlewareMode: true, hmr: false },
});

const server = http.createServer(async (request, response) => {
  const url = new URL(request.url, `http://${request.headers.host || 'localhost'}`);
  try {
    if (request.method === 'GET' && url.pathname === '/api/health') {
      respond(response, 200, { ok: true, service: 'jira-test-plan-generator' });
      return;
    }
    if (request.method === 'GET' && url.pathname === '/api/settings/status') {
      respond(response, 200, getSettingsStatus());
      return;
    }
    if (request.method === 'POST' && url.pathname === '/api/settings') {
      const body = await readJson(request);
      const status = await saveProjectSettings(body);
      const configured = status.jiraUrlConfigured && status.jiraEmailConfigured && status.jiraTokenConfigured && status.groqKeyConfigured;
      if (!configured) {
        respond(response, 400, { error: 'Enter the Jira URL, Jira email, Jira token, and Groq API key before saving.' });
        return;
      }
      respond(response, 200, { saved: true, status });
      return;
    }
    if (request.method === 'GET' && url.pathname === '/api/jira/connection') {
      const connection = await checkJiraConnection();
      respond(response, 200, { ok: true, account: connection.account });
      return;
    }
    if (request.method === 'GET' && url.pathname === '/api/groq/connection') {
      await checkGroqConnection();
      respond(response, 200, { ok: true });
      return;
    }
    if (request.method === 'GET' && url.pathname.startsWith('/api/jira/')) {
      const issueKey = decodeURIComponent(url.pathname.slice('/api/jira/'.length));
      const issue = await fetchJiraIssue(issueKey);
      respond(response, 200, { issue });
      return;
    }
    if (request.method === 'POST' && url.pathname === '/api/generate') {
      const body = await readJson(request);
      if (!body.issue || typeof body.issue !== 'object') {
        respond(response, 400, { error: 'Fetch a Jira issue before generating its test plan.' });
        return;
      }
      const testCases = await createTestPlan(body.issue);
      respond(response, 200, { issueKey: body.issue.key, testCases });
      return;
    }
    if (url.pathname.startsWith('/api/')) {
      respond(response, 404, { error: 'That API route was not found.' });
      return;
    }
    if (isProduction) {
      const requested = url.pathname === '/' ? 'index.html' : decodeURIComponent(url.pathname).replace(/^\/+/, '');
      const file = path.resolve(distDir, requested);
      if (!file.startsWith(`${distDir}${path.sep}`) && file !== path.join(distDir, 'index.html')) {
        response.writeHead(400); response.end('Bad request'); return;
      }
      try {
        const content = await fs.readFile(file);
        response.writeHead(200, { 'Content-Type': mime[path.extname(file)] || 'application/octet-stream', 'X-Content-Type-Options': 'nosniff' });
        response.end(content);
      } catch {
        const index = await fs.readFile(path.join(distDir, 'index.html'));
        response.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' }); response.end(index);
      }
      return;
    }
    vite.middlewares(request, response, (error) => {
      if (error) { response.writeHead(500); response.end('Development server error'); }
      else if (!response.writableEnded) { response.writeHead(404); response.end('Not found'); }
    });
  } catch (error) {
    respond(response, 502, { error: error.message || 'The request failed. Try again.' });
  }
});

server.listen(port, '127.0.0.1', () => {
  console.log(`Casebook running at http://localhost:${port}`);
});

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, async () => {
    server.close();
    await vite?.close();
    process.exit(0);
  });
}
