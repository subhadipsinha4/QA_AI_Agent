import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';
import './settings.css';

async function api(path, options = {}) {
  const response = await fetch(path, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...options.headers },
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || 'Something went wrong. Please try again.');
  return data;
}

function downloadCsv(cases) {
  const headers = ['Test ID', 'Category', 'Description', 'Steps', 'Expected Result', 'Priority'];
  const cell = (value) => `"${String(value ?? '').replaceAll('"', '""')}"`;
  const rows = cases.map((item) => [item.testId, item.category, item.description, item.steps.map((step, i) => `${i + 1}. ${step}`).join('\n'), item.expectedResult, item.priority]);
  const csv = [headers, ...rows].map((row) => row.map(cell).join(',')).join('\r\n');
  const url = URL.createObjectURL(new Blob(['\uFEFF', csv], { type: 'text/csv;charset=utf-8' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = 'jira-test-plan.csv';
  link.click();
  URL.revokeObjectURL(url);
}

function App() {
  const [issueKey, setIssueKey] = useState('');
  const [issue, setIssue] = useState(null);
  const [testCases, setTestCases] = useState([]);
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const [connected, setConnected] = useState(null);
  const [groqConnected, setGroqConnected] = useState(null);
  const [settingsOpen, setSettingsOpen] = useState(true);
  const [settingsStatus, setSettingsStatus] = useState(null);
  const [settings, setSettings] = useState({ jiraUrl: '', jiraEmail: '', jiraToken: '', groqKey: '', groqModel: '' });

  useEffect(() => {
    api('/api/settings/status').then((status) => {
      setSettingsStatus(status);
      if (status.jiraUrlConfigured && status.jiraEmailConfigured && status.jiraTokenConfigured && status.groqKeyConfigured) setSettingsOpen(false);
    }).catch(() => {});
  }, []);

  async function saveSettings(event) {
    event.preventDefault(); setBusy('settings'); setError('');
    const payload = {
      JIRA_URL: settings.jiraUrl,
      JIRA_EMAIL: settings.jiraEmail,
      JIRA_API_TOKEN: settings.jiraToken,
      GROQ_KEY: settings.groqKey,
      GROQ_MODEL: settings.groqModel,
    };
    try {
      const result = await api('/api/settings', { method: 'POST', body: JSON.stringify(payload) });
      setSettingsStatus(result.status);
      setSettings({ jiraUrl: '', jiraEmail: '', jiraToken: '', groqKey: '', groqModel: '' });
      setSettingsOpen(false);
      const checks = await Promise.allSettled([api('/api/jira/connection'), api('/api/groq/connection')]);
      setConnected(checks[0].status === 'fulfilled');
      setGroqConnected(checks[1].status === 'fulfilled');
      const failed = checks.find((check) => check.status === 'rejected');
      if (failed) setError(`Settings saved. ${failed.reason.message}`);
    } catch (err) { setError(err.message); }
    finally { setBusy(''); }
  }

  async function verifyConnection() {
    setBusy('connection'); setError('');
    try {
      const results = await Promise.allSettled([api('/api/jira/connection'), api('/api/groq/connection')]);
      setConnected(results[0].status === 'fulfilled');
      setGroqConnected(results[1].status === 'fulfilled');
      const errors = results.filter((result) => result.status === 'rejected').map((result) => result.reason.message);
      if (errors.length) setError(errors.join(' '));
    } finally { setBusy(''); }
  }

  async function fetchIssue(event) {
    event.preventDefault(); setBusy('issue'); setError(''); setIssue(null); setTestCases([]);
    try {
      const data = await api(`/api/jira/${encodeURIComponent(issueKey.trim())}`);
      setIssue(data.issue); setConnected(true);
    } catch (err) { setConnected(false); setError(err.message); }
    finally { setBusy(''); }
  }

  async function generate() {
    setBusy('generate'); setError(''); setTestCases([]);
    try {
      const data = await api('/api/generate', { method: 'POST', body: JSON.stringify({ issue }) });
      setTestCases(data.testCases);
    } catch (err) { setError(err.message); }
    finally { setBusy(''); }
  }

  return <div className="app-shell">
    <header className="topbar">
      <a className="brand" href="#top" aria-label="Casebook home"><span className="brand-mark">C</span><span>casebook</span></a>
      <div className="topbar-right"><span className="secure-note"><span className="lock">▣</span> Credentials stay on this server</span><span className={`connection ${connected ? 'is-connected' : ''}`}><i />{connected ? 'Jira' : 'Jira pending'}</span><span className={`connection ${groqConnected ? 'is-connected' : ''}`}><i />{groqConnected ? 'Groq' : 'Groq pending'}</span></div>
    </header>

    <main id="top" className="main-content">
      <section className="intro">
        <div className="eyebrow"><span className="eyebrow-line" /> TEST PLANNING, WITHOUT THE BUSYWORK</div>
        <h1>Turn a Jira issue<br /><span>into a test plan.</span></h1>
        <p className="intro-copy">Every distinct test case supported by the requirement, ready to review, refine, and export.</p>
      </section>

      <section className="settings-panel" aria-label="Connection settings">
        <button className="settings-toggle" type="button" aria-expanded={settingsOpen} onClick={() => setSettingsOpen((open) => !open)}>
          <span><span className="step-label">CONFIGURATION</span><strong>Jira &amp; Groq settings</strong><small>{settingsStatus?.jiraUrlConfigured && settingsStatus?.jiraEmailConfigured && settingsStatus?.jiraTokenConfigured && settingsStatus?.groqKeyConfigured ? 'Credentials saved on this computer' : 'Add your API credentials to get started'}</small></span>
          <span className="settings-toggle-end"><span className="settings-lock">▣</span>{settingsOpen ? 'Hide settings −' : 'Edit settings +'}</span>
        </button>
        {settingsOpen && <form className="settings-form" onSubmit={saveSettings}>
          <div className="settings-grid">
            <label>Jira base URL<input type="url" value={settings.jiraUrl} onChange={(e) => setSettings({ ...settings, jiraUrl: e.target.value })} placeholder="https://your-company.atlassian.net" autoComplete="url" /></label>
            <label>Jira email<input type="email" value={settings.jiraEmail} onChange={(e) => setSettings({ ...settings, jiraEmail: e.target.value })} placeholder="you@company.com" autoComplete="username" /></label>
            <label>Jira API token<input type="password" value={settings.jiraToken} onChange={(e) => setSettings({ ...settings, jiraToken: e.target.value })} placeholder={settingsStatus?.jiraTokenConfigured ? 'Saved. Enter a new token to replace it.' : 'Paste your Jira API token'} autoComplete="new-password" /></label>
            <label>Groq API key<input type="password" value={settings.groqKey} onChange={(e) => setSettings({ ...settings, groqKey: e.target.value })} placeholder={settingsStatus?.groqKeyConfigured ? 'Saved. Enter a new key to replace it.' : 'Paste your Groq API key'} autoComplete="new-password" /></label>
            <label className="model-field">Groq model<input type="text" value={settings.groqModel} onChange={(e) => setSettings({ ...settings, groqModel: e.target.value })} placeholder={settingsStatus?.groqModel || 'openai/gpt-oss-120b'} autoComplete="off" /></label>
          </div>
          <div className="settings-actions"><p>Saved to the local <code>.env</code> file. Blank fields keep saved values.</p><button className="button button-primary" disabled={Boolean(busy)}>{busy === 'settings' ? <><span className="spinner" /> Saving</> : <>Save settings <span>→</span></>}</button></div>
        </form>}
      </section>

      <section className="workspace" aria-label="Create test plan">
        <div className="workspace-head"><div><div className="step-label">01 <span>·</span> START WITH AN ISSUE</div><h2>Bring in a Jira issue</h2></div><button className="text-button" type="button" onClick={verifyConnection} disabled={Boolean(busy)}>{busy === 'connection' ? 'Checking…' : <>Check connections <span aria-hidden="true">↗</span></>}</button></div>
        <form className="issue-form" onSubmit={fetchIssue}>
          <label htmlFor="issue-key">Issue key</label>
          <div className="input-row"><div className="input-wrap"><span className="search-glyph" aria-hidden="true">⌕</span><input id="issue-key" value={issueKey} onChange={(event) => setIssueKey(event.target.value)} placeholder="e.g. SHOP-142" autoComplete="off" required /></div><button className="button button-primary" disabled={Boolean(busy)}>{busy === 'issue' ? <><span className="spinner" /> Fetching</> : <>Fetch issue <span>→</span></>}</button></div>
          <p className="helper">Connects using the Jira credentials configured in your server environment.</p>
        </form>

        {error && <div className="alert" role="alert"><span className="alert-icon">!</span><span>{error}</span></div>}

        {issue && <div className="issue-card">
          <div className="issue-card-top"><span className="issue-chip">{issue.key}</span><span className="fetched-label"><i /> Issue fetched</span></div>
          <h3>{issue.summary || 'Summary not specified'}</h3>
          <div className="requirement-preview"><span>REQUIREMENT SNAPSHOT</span><p>{issue.description || issue.acceptanceCriteria || 'No description or acceptance criteria was provided.'}</p></div>
          <button className="button button-dark generate-button" onClick={generate} disabled={Boolean(busy)}>{busy === 'generate' ? <><span className="spinner light" /> Building your plan</> : <>Generate test plan <span>✳</span></>}</button>
          <p className="privacy-note">Generated only from the issue details shown above. Unspecified behavior stays marked.</p>
        </div>}
      </section>

      {testCases.length > 0 && <section className="results" aria-live="polite">
        <div className="results-head"><div><div className="step-label">02 <span>·</span> YOUR TEST PLAN</div><h2>Ready for review <span className="count">{String(testCases.length).padStart(2, '0')}</span></h2><p>Each case stands on its own. Priorities reflect the requirement.</p></div><button className="button button-outline" onClick={() => downloadCsv(testCases)}><span className="download-icon">↓</span> Export CSV</button></div>
        <div className="table-scroll"><table><thead><tr><th>TEST ID</th><th>CATEGORY</th><th>DESCRIPTION</th><th>STEPS</th><th>EXPECTED RESULT</th><th>PRIORITY</th></tr></thead><tbody>{testCases.map((item) => <tr key={item.testId}><td className="test-id">{item.testId}</td><td><span className={`category category-${item.category.toLowerCase().replace(' ', '-')}`}>{item.category}</span></td><td>{item.description}</td><td><ol>{item.steps.map((step, index) => <li key={index}>{step}</li>)}</ol></td><td>{item.expectedResult}</td><td><span className={`priority priority-${item.priority.toLowerCase()}`}><i />{item.priority}</span></td></tr>)}</tbody></table></div>
        <div className="table-foot"><span><i className="foot-dot" /> {testCases.length} independent test cases</span><span>Source: {issue?.key}</span></div>
      </section>}

      {!issue && <div className="below-note"><span className="sparkle">✳</span><span>Clear requirements in. Useful test coverage out.</span><span className="below-rule" /></div>}
    </main>
    <footer className="footer"><span>CASEBOOK <span className="footer-dot">·</span> BUILT FOR BETTER COVERAGE</span><span>Jira → Test plan → CSV</span></footer>
  </div>;
}

createRoot(document.getElementById('root')).render(<App />);
